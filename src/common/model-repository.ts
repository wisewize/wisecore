import Repository from './repository';
import Container from './container';
import Model, { ModelObject, ModelAction, ModelMetadata } from './model';
import Pagination from './pagination';

function prefixWithTableName(tableName: string, obj: ModelObject) {
  let newObj: ModelObject = {};

  for (let key in obj) {
    if (obj[key] !== undefined) {
      newObj[tableName + '.' + key] = obj[key];
    }
  }

  return newObj;
}

type ModelPkArgument = number | ModelObject;

abstract class ModelRepository extends Repository {
  public container: Container;
  public metadata: ModelMetadata;
  public modelClass: any;
  public tableName: string;
  public pkColumns: string[];
  public columns: string[];
  public collectionColumns: string[];
  public rawColumns: string[];
  public timestamps: { [key: string]: boolean };

  constructor(container: Container, modelClass: any) {
    super(container);

    let metadata = Model.getMetadata(modelClass);

    if (!metadata) {
      throw new Error('Unknown model class: ' + modelClass.name);
    }

    this.metadata = metadata;
    this.modelClass = modelClass;
    this.tableName = metadata.tableName;
    this.pkColumns = metadata.pkColumns;
    this.columns = Model.getColumnNamesOn(Model.Action.Get, metadata);
    this.collectionColumns = Model.getColumnNamesOn(Model.Action.Collect, metadata);
    this.rawColumns = Model.getColumnNames(metadata);
    this.timestamps = {
      createdAt: 'createdAt' in metadata.schema,
      updatedAt: 'updatedAt' in metadata.schema
    };
  }

  createModel(result: any, modelClass = this.modelClass) {
    if (!result) {
      return null;
    }

    let schema = Model.getSchemaOn(Model.Action.Get, this.metadata);
    let jsonObject = Model.unflatten(result, schema);
    let item = new modelClass();

    Object.assign(item, jsonObject);

    return item;
  }

  protected preprocessQueryOn(action: ModelAction, q) {
    for (let r of Model.getRelationsOn(action, Model.Relation.BelongsTo, this.metadata)) {
      q.leftJoin(r.refTableName, r.tableName + '.' + r.from, r.refTableName + '.' + r.to);
    }

    return q;
  }

  protected async postprocessQueryOn(action: ModelAction, result: ModelObject[]) {
    for (let r of Model.getRelationsOn(action, Model.Relation.HasMany, this.metadata)) {
      let refMetadata = Model.getMetadata(r.model);
      let columns = Model.getColumnNamesOn(Model.Action.Collect, refMetadata);
      let refEntries = await this.db
        .from(r.refTableName)
        .select(columns)
        .whereIn(r.to, result.map(entry => entry[r.from]));

      for (let entry of result) {
        entry[r.name] = refEntries.filter(p => p[r.to] === entry[r.from]);
      }
    }

    for (let r of Model.getRelationsOn(action, Model.Relation.ManyToMany, this.metadata)) {
      let refMetadata = Model.getMetadata(r.model);
      let columns = Model.getColumnNamesOn(Model.Action.Collect, refMetadata);
      let pks = result.map(entry => entry[this.pkColumns[0]]);
      let junctions = await this.db.from(r.refTableName).select(r.from, r.to).whereIn(r.from, pks);
      let refEntries = await this.db
        .from(refMetadata.tableName)
        .select(columns)
        .whereIn(refMetadata.pkColumns[0], junctions.map(p => p[r.to]));

      for (let entry of result) {
        let entryId = entry[this.pkColumns[0]];
        entry[r.name] = refEntries.filter(p => {
          let refId = p[refMetadata.pkColumns[0]];
          return junctions.find(q => q[r.from] === entryId && q[r.to] === refId);
        });
      }
    }

    return result;
  }

  protected queryOne(ids: ModelPkArgument) {
    if (typeof ids === 'number') {
      return this.db.from(this.tableName).where(this.tableName + '.' + this.pkColumns[0], ids);
    } else {
      return this.db.from(this.tableName).where(prefixWithTableName(this.tableName, ids));
    }
  }

  async hasOne(ids: ModelPkArgument) {
    if (typeof ids === 'number') {
      let result = await this.db.select(this.db.raw(
        'EXISTS(SELECT 1 FROM ?? WHERE ?? = ?) AS value',
        [this.tableName, this.pkColumns[0], ids]
      ));

      return Boolean(result[0].value);
    } else {
      return await this.exists(this.tableName, ids);
    }
  }

  async getOne(ids: ModelPkArgument) {
    let result = await this.postprocessQueryOn(
      ModelAction.Get,
      await this.preprocessQueryOn(
        ModelAction.Get, 
        this.queryOne(ids).select(this.columns).limit(1)
      )
    );

    return this.createModel(result[0]);
  }

  async getAll(criteria: ModelObject = {}, getQuery?: (db: any) => any) {
    let q = this.db
      .select(this.collectionColumns)
      .from(this.tableName)
      .where(prefixWithTableName(this.tableName, criteria));

    let result = await this.postprocessQueryOn(
      ModelAction.Get,
      await this.preprocessQueryOn(
        ModelAction.Get,
        getQuery ? getQuery(q) : q
      )
    );

    return result.map(entry => this.createModel(entry));
  }

  async getCollection(pagination: Pagination, criteria: ModelObject = {}, getQuery?: (db: any) => any) {
    let result = await this.postprocessQueryOn(
      ModelAction.Collect,
      await this.collect(
        pagination,
        this.collectionColumns,
        Model.getTextSearchColumnNames(this.metadata),
        db => {
          let q = db.from(this.tableName);
        
          if (getQuery) {
            q = getQuery(q);
          }

          return this.preprocessQueryOn(ModelAction.Collect, q)
            .where(prefixWithTableName(this.tableName, criteria));
        }
      )
    );

    return result.map(entry => this.createModel(entry));
  }

  async create(data: any) {
    let result = await this.insert([data]);

    return result[0];
  }

  async insert(data: any[]) {
    let createData = data;

    if (this.timestamps.createdAt && this.timestamps.updatedAt) {
      createData = data.map(v => ({ ...v, createdAt: this.db.fn.now(), updatedAt: this.db.fn.now() }));
    } else if (this.timestamps.createdAt) {
      createData = data.map(v => ({ ...v, createdAt: this.db.fn.now() }));
    }

    let entries = createData.map(entry => Model.toRawObject(entry, this.metadata.schema));
    let result = await this.db.insert(entries).into(this.tableName);

    return result;
  }

 async update(ids: ModelPkArgument, data: any) {
    let updateData = data;

    if (this.timestamps.updatedAt) {
      updateData = { ...data, updatedAt: this.db.fn.now() };
    }

    return await this.queryOne(ids).update(Model.toRawObject(updateData, this.metadata.schema));
  }

  async del(ids: ModelPkArgument) {
    return await this.queryOne(ids).del();
  }

  async count(criteria: ModelObject = {}) {
    let result = await this.db
      .count('* as count')
      .from(this.tableName)
      .where(criteria);

    return result[0].count;
  }
}

export default ModelRepository;
