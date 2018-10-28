import { inject } from '../../common/container';
import Controller, { route, pathParam, paginated, formData, authorize } from '../../common/controller';
import Authentication from '../../user/authentication';
import FileService from '../services/file-service';

class FileController extends Controller {
  @inject() auth: Authentication;
  @inject() fileService: FileService;

  @route('GET', '/files/:fileId')
  @authorize(e => e
    .hasId('File(params.fileId).ownerId')
    .or.hasAuthority('ADMIN')
  )
  async getFile(@pathParam('fileId') fileId) {
    let file = await this.fileService.getFile(fileId);

    return file;
  }

  @route('GET', '/storages/:storageId/files')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getFileCollection(@pathParam('storageId') storageId, @paginated pagination) {
    let files = await this.fileService.getFiles(storageId, pagination);

    return files;
  }

  @route('POST', '/storages/:storageId/files')
  @authorize(e => e.hasAuthority('USER'))
  async uploadFile(@pathParam('storageId') storageId, @formData('file') file) {
    let insertId = await this.fileService.uploadFile(storageId, file);

    return `/files/${insertId}`;
  }

  @route('DELETE', '/files/:fileId')
  @authorize(e => e
    .hasId('File(params.fileId).ownerId')
    .or.hasAuthority('ADMIN')
  )
  async deleteFile(@pathParam('fileId') fileId) {
    await this.fileService.deleteFile(fileId);
  }
}

export default FileController;
