import { inject } from '../../common/container';
import { NoResourceError } from '../../common/errors';
import { scheduled } from '../../common/task';
import Service from '../../common/service';
import StorageRepository from '../repositories/storage-repository';
import ConfigService from '../../operation/services/config-service';
import NotificationService from '../../operation/services/notification-service';
import { transactional } from '../../common/transaction';

class StorageService extends Service {
  static usedSize = 0;

  @inject() configService: ConfigService;
  @inject() storageRepository: StorageRepository;
  @inject() notificationService: NotificationService;

  async getFileSystemInfo() {
    let storageConfig = await this.configService.get('storage');
    let used = await this.storageRepository.getUsedSize();

    return {
      uploader: storageConfig.uploader,
      storage: {
        used, 
        total: storageConfig.storageSize
      }
    };
  }

  async getStorage(storageId) {
    let storage = await this.storageRepository.getOne(storageId);

    if (!storage) {
      throw new NoResourceError();
    }

    return storage;
  }

  async getStorages(pagination) {
    return await this.storageRepository.getCollection(pagination);
  }

  async createStorage(data) {
    let storageId = await this.storageRepository.create(data);

    return storageId;
  }

  async updateStorage(storageId, data) {
    await this.storageRepository.update(storageId, data);
  }

  async deleteStorage(storageId) {
    await this.storageRepository.del(storageId);
  }

  async getPrimaryStorage() {
    let storage = await this.storageRepository.getOne({ primary: true });

    if (!storage) {
      throw new NoResourceError();
    }

    return storage;
  }

  @transactional
  async setPrimaryStorage(storageId) {
    if (!await this.storageRepository.hasOne(storageId)) {
      throw new NoResourceError();
    }

    await this.storageRepository.update({ primary: true }, { primary: false });
    await this.storageRepository.update(storageId, { primary: true });
  }

  async getStorageUsage(storageId) {
    let used = await this.storageRepository.getUsedSize(storageId);

    return { used };
  }

  async canUpload() {
    let storageConfig = await this.configService.get('storage');

    if (StorageService.usedSize >= storageConfig.storageSize) {
      return false;
    }

    return true;
  }

  // 시간당 스토리지 용량 체크를 하고 알림.
  @scheduled({ time: '0 * * * *', start: true })
  async checkStorageSize() {
    let usedSize = await this.storageRepository.getUsedSize();

    StorageService.usedSize = usedSize;

    if (!await this.canUpload()) {
      await this.notificationService.notify(
        'WARNING',
        'file.storageSizeOver',
        '파일 스토리지의 용량이 부족합니다. 더 이상의 파일 업로드는 불가능하므로 용량 추가를 문의하시기 바랍니다.'
      );
    }
  }
}

export default StorageService;
