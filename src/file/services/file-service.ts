import fs from 'fs';
import path from 'path';
import url from 'url';
import fetch from 'node-fetch';

import { inject } from '../../common/container';
import Service from '../../common/service';
import { NoResourceError, ConflictError, CommonError } from '../../common/errors';
import { scheduled } from '../../common/task';
import Authentication from '../../user/authentication';
import ImageFile from '../image-file';
import Uploader from '../uploader';
import StorageService from '../services/storage-service';
import FileRepository from '../repositories/file-repository';

class FileService extends Service {
  static deletingUnreferencedFiles = false;

  @inject() auth: Authentication;
  @inject() storageService: StorageService;
  @inject() fileRepository: FileRepository;
  @inject() fileUploader: Uploader;

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
      let isImage = file.type.indexOf('image/') >= 0;

      if (!await this.storageService.canUpload()) {
        throw new CommonError(500, '스토리지에 업로드할 수 있는 용량이 가득찼습니다. 관리자에게 문의하여 용량을 업그레이드해주세요.');
      }

      if (!storage.canUploadFile(file)) {
        throw new ConflictError(`스토리지(${storage.name})에 업로드할 수 있는 파일이 아닙니다.`);
      }

      if (storage.maxSize && file.size > storage.maxSize) {
        // skip file size limit if maxWidth or maxHeight is defined
        if (!isImage || !(storage.maxWidth || storage.maxHeight)) {
          throw new ConflictError(`스토리지(${storage.name})에 업로드할 수 있는 파일 크기가 아닙니다.`);
        }
      }

      let url = null;
      let fileSize = 0;
      let thumbUrl = null;
      let thumbSize = 0;

      // create a thumbnail
      if (isImage) {
        let info = await this.thumbnailImage(file, storage.thumbWidth, storage.thumbHeight);
        thumbUrl = await this.fileUploader.uploadFile(info.path, file.name + '_thumb.png', 'image/png');
        thumbSize = info.size;
        fs.unlinkSync(info.path);
      }

      // resize image if maxWidth or maxHeight is defined
      if (isImage && (storage.maxWidth || storage.maxHeight)) {
        let info = await this.resizeImage(file, storage.maxWidth, storage.maxHeight);

        if (info) {
          url = await this.fileUploader.uploadFile(info.path, file.name, file.type);
          fileSize = info.size;
          fs.unlinkSync(info.path);
        } else {
          url = await this.fileUploader.uploadFile(file.path, file.name, file.type);
          fileSize = file.size;
        }
      } else {
        url = await this.fileUploader.uploadFile(file.path, file.name, file.type);
        fileSize = file.size;
      }

      let insertId = await this.fileRepository.create({
        storageId,
        ownerId: this.auth.user.id,
        url,
        name: file.name,
        size: fileSize + thumbSize,
        type: file.type,
        refCount: 0,
        thumbUrl
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
    await this.fileUploader.deleteFile(file.url);

    if (file.thumbUrl) {
      await this.fileUploader.deleteFile(file.thumbUrl);
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

  private async thumbnailImage(file, width, height) {
    const imgDir = path.dirname(file.path);
    const ext = path.extname(file.name);
    const name = path.basename(file.name, ext);
    const resizePath = path.join(imgDir, name + '_thumb.png');

    let image = new ImageFile();

    await image.load(file.path);
    await image.resize(width || 100, height || 100);

    let fileSize = await image.save(resizePath);

    return {
      path: resizePath,
      size: fileSize
    };
  }

  private async resizeImage(file, width, height) {
    const imgDir = path.dirname(file.path);
    const ext = path.extname(file.name);
    const name = path.basename(file.name, ext);
    const resizePath = path.join(imgDir, name + '_resize' + ext);

    let image = new ImageFile();

    await image.load(file.path);

    let resizeWidth = image.width;
    let resizeHeight = image.height;

    if (width && resizeWidth > width) {
      resizeHeight = Math.floor(resizeHeight * (width / resizeWidth));
      resizeWidth = width;
    }

    if (height && resizeHeight > height) {
      resizeWidth = Math.floor(resizeWidth * (height / resizeHeight));
      resizeHeight = height;
    }

    // null if resizing is useless
    if (resizeWidth === image.width && resizeHeight === image.height) {
      return null;
    }

    await image.resize(resizeWidth, resizeHeight);

    let fileSize = await image.save(resizePath);

    return {
      path: resizePath,
      size: fileSize
    };
  }

  /**
   * 인터넷 URL로부터 파일을 로컬로 다운로드하여 FileDescriptor를 반환함.
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
          await this.fileUploader.deleteFile(file.url);

          if (file.thumbUrl) {
            await this.fileUploader.deleteFile(file.thumbUrl);
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
