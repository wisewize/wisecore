import fs from 'fs';
import path from 'path';
import url from 'url';
import fetch from 'node-fetch';

import { inject } from '../../common/container';
import Service from '../../common/service';
import { NoResourceError, ConflictError, CommonError } from '../../common/errors';
import { scheduled } from '../../common/task';
import Authentication from '../../user/authentication';
import StorageService from '../services/storage-service';
import FileRepository from '../repositories/file-repository';
import Uploader from '../uploader';
import UploadStrategy from '../upload-strategy';
import imageUploadStrategy from '../image-upload-strategy';

const defaultUploadStrategy: UploadStrategy = async function (uploader, storage, file) {
  const url = await uploader.uploadFile(file.path, file.name, file.type);
  const fileSize = file.size;

  return {
    url,
    size: fileSize,
    type: file.type,
    name: file.name
  };
}

class FileService extends Service {
  static deletingUnreferencedFiles = false;
  static uploadStrategies: { [typeRegexp: string]: UploadStrategy } = {
    'image/*': imageUploadStrategy
  };

  @inject() auth: Authentication;
  @inject() storageService: StorageService;
  @inject() fileRepository: FileRepository;
  @inject() uploader: Uploader;

  async getFile(fileId) {
    let file = await this.fileRepository.getOne(fileId);

    if (!file) {
      throw new NoResourceError();
    }

    return file;
  }

  async getFiles(storageId, pagination) {
    let storage = await this.storageService.getStorage(storageId);

    return await this.fileRepository.getCollection(pagination, { storageId: storage.id });
  }

  async uploadFile(storageId, file) {
    try {
      let storage = await this.storageService.getStorage(storageId);

      if (!await this.storageService.canUpload()) {
        throw new CommonError(500, '스토리지에 업로드할 수 있는 용량이 가득찼습니다. 관리자에게 문의하여 용량을 업그레이드해주세요.');
      }

      if (!storage.canUploadFile(file)) {
        throw new ConflictError(`스토리지(${storage.name})에 업로드할 수 있는 파일이 아닙니다.`);
      }

      if (storage.maxSize && file.size > storage.maxSize) {
        throw new ConflictError(`스토리지(${storage.name})에 업로드할 수 있는 파일 크기가 아닙니다.`);
      }

      let strategy = defaultUploadStrategy;

      for (const pattern in FileService.uploadStrategies) {
        const r = new RegExp(pattern, 'i');

        if (r.test(file.type)) {
          strategy = FileService.uploadStrategies[pattern];
          break;
        }
      }

      const uploadResult = await strategy(this.uploader, storage, file);
      const insertId = this.fileRepository.create({
        storageId,
        ownerId: this.auth.user.id,
        ...uploadResult,
        refCount: 0
      });

      fs.unlinkSync(file.path);

      this.log.info({ storageName: storage.name, fileName: file.name, fileSize: file.size}, 'A file is uploaded');

      return insertId;
    } catch (e) {
      fs.unlink(file.path, err => {
        if (err) {
          this.log.error(err, 'an error occurred when unlink file at FileService.uploadFile failure');
        }
      });
      throw e;
    }
  }

  async deleteFile(fileId) {
    let file = await this.fileRepository.getOneRaw(fileId);

    if (!file) {
      throw new NoResourceError();
    }

    await this.fileRepository.del(fileId);
    await this.uploader.deleteFile(file.url);

    if (file.thumbUrl) {
      await this.uploader.deleteFile(file.thumbUrl);
    }
  }

  async referenceFile(fileId) {
    let file = await this.fileRepository.getOneRaw(fileId);

    if (!file) {
      throw new NoResourceError();
    }

    await this.fileRepository.update(fileId, { refCount: file.refCount + 1});
  }

  async unreferenceFile(fileId) {
    let file = await this.fileRepository.getOneRaw(fileId);

    if (!file) {
      throw new NoResourceError();
    }

    if (file.refCount < 1) {
      this.log.error({ fileId, refCount: file.refCount }, 'Already refCount is zero');
      throw new ConflictError('이미 파일을 참조하는 개체가 없습니다.');
    }

    await this.fileRepository.update(fileId, { refCount: file.refCount - 1});
  }

  /**
   * Download a file from internet URL and return FileDescriptor
   * @param fileUrl 
   */
  async downloadFile(fileUrl) {
    let filename = path.basename(url.parse(fileUrl).pathname);
    let res = await fetch(fileUrl);
    let buf = await res.buffer();
    let filepath = '' + filename;

    fs.writeFileSync(filepath, buf);

    return {
      name: filename,
      path: filepath,
      size: Number(res.headers.get('content-length')),
      type: res.headers.get('content-type')
    };
  }

  @scheduled({ time: '1 0 * * SUN' })
  async deleteUnreferencedFiles() {
    if (FileService.deletingUnreferencedFiles) {
      return;
    }

    FileService.deletingUnreferencedFiles = true;

    let count = 0;
    let chunkSize = 100;
    let delayedDays = 7;
    let delayedDate = new Date();

    delayedDate.setDate(delayedDate.getDate() - delayedDays);

    try {
      let files = await this.fileRepository.getUnreferenced(chunkSize);

      for (let file of files) {
        let createDate = new Date(file.createdAt);

        if (createDate < delayedDate) {
          await this.fileRepository.del(file.id);
          await this.uploader.deleteFile(file.url);

          if (file.thumbUrl) {
            await this.uploader.deleteFile(file.thumbUrl);
          }

          count++;
        }
      }

      await this.storageService.checkStorageSize();
    } catch (e) {
      this.log.error(e.message);
    }

    FileService.deletingUnreferencedFiles = false;
    
    this.log.info({ count }, 'deleting unreferenced files have completed');
  }
}

export default FileService;
