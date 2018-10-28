import ModelRepository from '../../common/model-repository';
import File from '../models/file';

class FileRepository extends ModelRepository {
  constructor(container) {
    super(container, File);
  }

  async getOneRaw(id: number) {
    let result = await this.queryOne(id).first(this.rawColumns);

    return result;
  }

  async unreferenceAll(refTableName, refColumnName, refId) {
    return await this.db
      .from('File')
      .where('id', 'in', this.db.from(refTableName).where(refColumnName, refId).select('fileId'))
      .decrement('refCount', 1);
  }

  async getUnreferenced(limit = 100) {
    return await this.db
      .from(this.tableName)
      .where('refCount', 0)
      .orderBy('id', 'asc')
      .limit(limit);
  }
}

export default FileRepository;
