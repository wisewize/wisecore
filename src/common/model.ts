import flatten from 'flat';
import { memoized, getLocalDate } from './util';

enum ModelRelation {
  HasMany,
  BelongsTo,
  ManyToMany
};

enum ModelAction {
  Get,
  Collect,
  Create,
  Update,
  Delete
};

interface ColumnOption {
  type: string;
  name?: string;
  value?: any;
  required?: boolean;
  excludedOn?: ModelAction[];
  requiredOn?: ModelAction[];
  min?: number;
  max?: number;
  minValue?: number;
  maxValue?: number;
  defaultTo?: any;
  textSearch?: boolean;
  pattern?: RegExp;
  relation?: ModelRelation;
  tableName?: string;
  model?: Model;
  from?: string;
  to?: string;
}

interface TableOption {
  name: string;
  primary?: string[]
}

interface RelationSchema {
  relation: ModelRelation;
  name: string;
  model: Model;
  tableName: string;
  refTableName: string;
  from: string;
  to: string;
}

interface ModelSchema {
  [key: string]: ColumnOption;
}

interface ModelMetadata {
  name: string;
  tableName: string;
  pkColumns: string[];
  schema: ModelSchema;
}

interface ModelObject {
  [key: string]: any;
}

let modelMetadataMap: { [key: string]: ModelMetadata } = {};

function getModelMetadata(modelName) {
  let metadata = modelMetadataMap[modelName];
  
  if (!metadata) {
    metadata = modelMetadataMap[modelName] = {
      name: modelName,
      tableName: modelName,
      pkColumns: ['id'],
      schema: {}
    };
  }

  return metadata;
}

/**
 * column 속성 데코레이터
 */
function column(option: ColumnOption): any {
  return function (target: any, key: string, descriptor: PropertyDescriptor): void {
    let modelName = target.constructor.name;
    let metadata = getModelMetadata(modelName);

    if (!option.name) {
      option.name = key;
    }

    metadata.schema[key] = option;
  };
}

/**
 * table 클래스 데코레이터
 */
function table(option: TableOption): any {
  return function (target: any): void {
    let modelName = target.name;
    let metadata = getModelMetadata(modelName);

    metadata.tableName = option.name;

    if (option.primary) {
      metadata.pkColumns = option.primary;
    }
  };
}

abstract class Model {
  static Action = ModelAction;
  static Relation = ModelRelation;

  static AllActions = [ModelAction.Get, ModelAction.Create, ModelAction.Update, ModelAction.Delete];
  static ModificationActions = [ModelAction.Create, ModelAction.Update, ModelAction.Delete];

  /**
   * Model에 기반한 개체에서 데이터베이스에 저장할 수 있는 형태의 개체로 변환함.
   * @param object 
   * @param schema 
   */
  static toRawObject(object: any, schema?: ModelSchema): ModelObject {
    let modelObject: ModelObject = {};

    for (let key in object) {
      let v = object[key];
      let columnType = (schema && schema[key]) ? schema[key].type : null;

      switch (columnType) {
        case 'json':
          v = JSON.stringify(v);
          break;
      }

      modelObject[key] = v;
    }

    return modelObject;
  }

  /**
   * 데이터베이스 개체로부터 Model에 기반한 개체로 변환함.
   * @param object
   * @param schema 
   */
  static fromRawObject(object: any, schema?: ModelSchema): ModelObject {
    let modelObject: ModelObject = {};

    for (let key in object) {
      let v = object[key];

      if (v === null) {
        continue;
      }

      let columnType = (schema && schema[key]) ? schema[key].type : null;

      // 날짜 개체인 경우 문자열로 변환한다.
      if (v instanceof Date) {
        if (columnType === 'date') {
          // 타임존 문제 때문에 날짜의 경우 로컬 타임으로 전환함.
          modelObject[key] = getLocalDate(v).toISOString().substring(0, 10);
        } else {
          modelObject[key] = v.toISOString();
        }

        continue;
      }

      switch (columnType) {
        case 'boolean': 
          v = Boolean(v);
          break;
        case 'json':
          v = JSON.parse(v);
          break;
        case 'reference':
          {
            let refSchema = schema && schema[key] ? Model.getMetadata(schema[key].model).schema : null;

            if (Array.isArray(v)) {
              v = v.map(entry => Model.fromRawObject(entry, refSchema));
            } else if (typeof v === 'object') {
              // LEFT 조인은 관계 개체의 결과가 없으면 NULL로 채우기 때문에 삭제해줌.
              if (Object.keys(v).every(key => v[key] === null)) {
                continue;
              } else {
                v = Model.fromRawObject(v, refSchema);
              }
            } 
            break;
          }
        default:
          break;
      }

      modelObject[key] = v;
    }

    return modelObject;
  }

  static unflatten(flatObject: any, schema?: ModelSchema): ModelObject {
    if (!flatObject) {
      return null;
    }

    let jsonObject = flatten.unflatten(flatObject);

    return Model.fromRawObject(jsonObject, schema);
  }

  static getMetadataByName(name: string): ModelMetadata {
    return getModelMetadata(name);
  }

  static getMetadata(model: any): ModelMetadata {
    let metadata = getModelMetadata(model.name);

    return metadata;
  }

  static hasMetadata(model: any): boolean {
    return model.name in modelMetadataMap;
  }

  @memoized
  static getRelationsOn(action: ModelAction, relation: ModelRelation, metadata: ModelMetadata): RelationSchema[] {
    let schema = metadata.schema;
    let tableName = metadata.tableName;
    let relations: RelationSchema[] = [];

    for (let key in schema) {
      let option = schema[key];

      if (option.relation === relation && (!option.excludedOn || !Model.containsAction(action, option.excludedOn))) {
        let refMetadata = getModelMetadata((<any> option.model).name);
        let refTableName = option.tableName || refMetadata.tableName;
        let refRelations = Model.getRelationsOn(action, relation, refMetadata);
        let refFrom = null;
        let refTo = null;

        switch (option.relation) {  
          case ModelRelation.BelongsTo:
            refFrom = (option.from || Model.getReferenceColumnName(key));
            refTo = (option.to || refMetadata.pkColumns[0]);
            break;
          case ModelRelation.HasMany:
            refFrom = (option.from || metadata.pkColumns[0]);
            refTo = (option.to);
            break;
          case ModelRelation.ManyToMany:
            refFrom = option.from;
            refTo = option.to;
            break;
        }

        relations = relations.concat({
          relation: option.relation,
          tableName: tableName,
          refTableName: refTableName,
          model: option.model,
          name: key,
          from: refFrom,
          to: refTo
        }, refRelations);
      }
    }

    return relations;
  }

  @memoized
  static getSchemaOn(action: ModelAction, metadata: ModelMetadata) {
    let schema = metadata.schema;
    let newSchema: ModelSchema = {};

    for (let key in schema) {
      let option = schema[key];
      let newOption: ColumnOption = {
        type: option.type,
        required: option.required
      };

      if (action !== ModelAction.Get && action !== ModelAction.Collect && [...metadata.pkColumns, 'createdAt', 'updatedAt'].indexOf(key) >= 0) {
        continue;
      }

      if (option.excludedOn && option.excludedOn.indexOf(action) >= 0) {
        continue;
      }

      if (option.requiredOn && option.requiredOn.indexOf(action) < 0) {
        newOption.required = false; 
      }

      // 참조 컬럼의 경우 추가/수정 모델에서는 ID로만 받도록 함.
      if (option.type === 'reference' && action !== ModelAction.Get && action !== ModelAction.Collect) {
        newOption.type = 'key';
        newSchema[option.from || Model.getReferenceColumnName(key)] = newOption;
      } else {
        newSchema[key] = Object.assign({}, option, newOption);
      }
    }

    return newSchema;
  }

  /**
   * Collect의 경우 Get의 범주에 들어있기 때문에 별도로 확인해줘야 한다.
   */
  static containsAction(action: ModelAction, actions: ModelAction[]) {
    if (actions.indexOf(action) >= 0) {
      return true;
    }

    if (action === ModelAction.Collect && actions.indexOf(ModelAction.Get) >= 0) {
      return true;
    }

    return false;
  }

  @memoized
  static getColumnNamesOn(action: ModelAction, metadata: ModelMetadata, aliasPrefix = '') {
    let { tableName, schema } = metadata;
    let names: string[] = [];

    for (let key in schema) {
      let option = schema[key];

      if (option.excludedOn && Model.containsAction(action, option.excludedOn)) {
        continue;
      }

      if (option.type === 'reference') {
        if (option.relation === Model.Relation.BelongsTo) {
          let refMetadata = Model.getMetadata(option.model);
          let refNames = Model.getColumnNamesOn(action, refMetadata,  aliasPrefix + key + '.');

          names = names.concat(refNames);
        }
      } else {
        names.push(`${tableName}.${key} as ${aliasPrefix}${key}`);
      }
    }

    return names;
  }

  @memoized
  static getColumnNames(metadata: ModelMetadata) {
    let { schema } = metadata;
    let names: string[] = [];

    for (let key in schema) {
      let option = schema[key];

      if (option.type === 'reference') {
        let name = option.from || Model.getReferenceColumnName(key);
        names.push(name);
      } else {
        names.push(key);
      }
    }

    return names;
  }

  @memoized
  static getTextSearchColumnNames(metadata: ModelMetadata) {
    let { tableName, schema } = metadata;
    let names: string[] = [];

    for (let key in schema) {
      let option = schema[key];

      if (option.type === 'string' || option.type === 'text') {
        if (option.textSearch) {
          names.push(`${tableName}.${key}`);
        }
      }
    }

    return names;
  }

  static getReferenceColumnName(refName: string) {
    return refName + 'Id';
  }
}

export default Model;

export {
  column,
  table,
  ColumnOption,
  ModelObject,
  ModelAction,
  ModelRelation,
  ModelMetadata
};
