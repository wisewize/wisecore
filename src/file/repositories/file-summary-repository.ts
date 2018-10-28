import ModelRepository from '../../common/model-repository';
import FileSummary from '../models/file-summary';

class FileSummaryRepository extends ModelRepository {
  constructor(container) {
    super(container, FileSummary);
  }

  async getReferencedFileCollection(refTableName, refColumnName, fileColumnName, refId, pagination) {
    let result = await this.collect(
      pagination,
      this.collectionColumns,
      null,
      db => db.from(refTableName)
        .innerJoin('File', refTableName + '.' + fileColumnName, 'File.id')
        .where(refTableName + '.' + refColumnName, refId)
    );

    return result.map(entry => this.createModel(entry));
  }

  async addReferencedFile(refTableName, refColumnName, fileColumnName, refId, fileId) {
    return await this.db
      .insert({ [refColumnName]: refId, [fileColumnName]: fileId })
      .into(refTableName);
  }

  async removeReferencedFile(refTableName, refColumnName, fileColumnName, refId, fileId) {
    return await this.db
      .from(refTableName)
      .where({ [refColumnName]: refId, [fileColumnName]: fileId })
      .del();
  }

  async unreferenceAllFiles(refTableName, refColumnName, fileColumnName, refId) {
    return await this.db
      .from('File')
      .where('id', 'in', this.db.from(refTableName).where(refColumnName, refId).select(fileColumnName))
      .decrement('refCount', 1);
  }
}

export default FileSummaryRepository;
