import fs from 'fs';

import { inject } from '../common/container';
import { mkdirp } from '../common/util';
import Uploader from './uploader';

class LocalUploader extends Uploader {
  @inject() config: any;

  getUploadDir() {
    const date = new Date();
    return `${this.config.storage.baseDir}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }

  async copyFile(source, target) {
    return new Promise((resolve, reject) => {
      const rd = fs.createReadStream(source);
      const wr = fs.createWriteStream(target);
      const onError = e => {
        rd.destroy();
        wr.end();
        reject(e);
      };

      wr.on('finish', resolve);
      wr.on('error', onError);
      rd.pipe(wr);
    });
  }

  async uploadFile(localPath, originalName) {
    const filename = this.getUniqueFileName(originalName);
    const dir = this.getUploadDir();
    const uploadPath = this.config.storage.uploadDir + dir + '/' + filename;

    mkdirp(this.config.storage.uploadDir + dir);
    await this.copyFile(localPath, uploadPath);

    return dir + '/' + filename;
  }

  async deleteFile(uploadPath) {
    fs.unlinkSync(uploadPath);
  }
}

export default LocalUploader;
