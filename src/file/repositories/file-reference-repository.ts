import { inject } from '../../common/container';
import ModelRepository from '../../common/model-repository';
import Model from '../../common/model';
import FileSummaryRepository from './file-summary-repository';

class FileReferenceRepository extends ModelRepository {
  private refTableName: string;
  private refColumnName: string;
  private fileColumnName: string;

  @inject() protected fileSummaryRepository: FileSummaryRepository;

  constructor(container, model, refTableName?: string, refColumnName?: string, fileColumnName: string = 'fileId') {
    super(container, model);

    let metadata = Model.getMetadata(model);

    this.refTableName = refTableName || (metadata.tableName + 'File');
    this.refColumnName = refColumnName || (metadata.tableName[0].toLowerCase() + metadata.tableName.substring(1) + 'Id');
    this.fileColumnName = fileColumnName;
  }

  async getFileCollection(id, pagination) {
    return await this.fileSummaryRepository.getReferencedFileCollection(
      this.refTableName, this.refColumnName, this.fileColumnName, id, pagination
    );
  }

  async addFile(id, fileId) {
    return await this.fileSummaryRepository.addReferencedFile(
      this.refTableName, this.refColumnName, this.fileColumnName, id, fileId
    );
  }

  async removeFile(id, fileId) {
    return await this.fileSummaryRepository.removeReferencedFile(
      this.refTableName, this.refColumnName, this.fileColumnName, id, fileId
    );
  }

  async unreferenceAllFiles(id) {
    return await this.fileSummaryRepository.unreferenceAllFiles(
      this.refTableName, this.refColumnName,  this.fileColumnName, id
    );
  }

  async getRepresentativeThumbnail(id) {
    let row = await this.db
      .from(this.refTableName)
      .leftJoin('File', 'File.id', this.refTableName + '.' + this.fileColumnName)
      .where(this.refTableName + '.' + this.refColumnName, id)
      .whereNotNull('File.thumbUrl')
      .select('File.thumbUrl as thumbUrl')
      .orderBy(this.refTableName + '.' + this.refColumnName, 'asc')
      .first();

    return row ? row.thumbUrl : null;
  }
}

export default FileReferenceRepository;
