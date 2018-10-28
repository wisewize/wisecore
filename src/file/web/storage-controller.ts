import { inject } from '../../common/container';
import Controller, { route, pathParam, paginated, validate, authorize } from '../../common/controller';
import StorageService from '../services/storage-service';
import Storage from '../models/storage';

class StorageController extends Controller {
  @inject() storageService: StorageService;

  @route('GET', '/storages/primary')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getPrimaryStorage() {
    return await this.storageService.getPrimaryStorage();
  }

  @route('PUT', '/storages/:storageId/primary')
  @authorize(e => e.hasAuthority('ADMIN'))
  async setPrimaryStorage(@pathParam('storageId') storageId) {
    await this.storageService.setPrimaryStorage(storageId);
  }

  @route('GET', '/file/file-system-info')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getFileSystemInfo() {
    let info = await this.storageService.getFileSystemInfo();

    return info;
  }

  @route('GET', '/storages/:storageId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getStorage(@pathParam('storageId') storageId) {
    let storage = await this.storageService.getStorage(storageId);

    return storage;
  }

  @route('GET', '/storages')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getStorageCollection(@paginated pagination) {
    let storages = this.storageService.getStorages(pagination);

    return storages;
  }

  @route('POST', '/storages')
  @authorize(e => e.hasAuthority('ADMIN'))
  async createStorage(@validate(Storage) data) {
    let insertId = await this.storageService.createStorage(data);

    return `/storages/${insertId}`;
  }

  @route('PUT', '/storages/:storageId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async updateStorage(@pathParam('storageId') storageId, @validate(Storage) data) {
    await this.storageService.updateStorage(storageId, data);
  }

  @route('DELETE', '/storages/:storageId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async deleteStorage(@pathParam('storageId') storageId) {
    await this.storageService.deleteStorage(storageId);
  }

  @route('GET', '/storages/:storageId/usage')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getStorageUsage(@pathParam('storageId') storageId) {
    let usage = await this.storageService.getStorageUsage(storageId);

    return usage;
  }
}

export default StorageController;
