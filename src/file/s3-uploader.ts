import fs from 'fs';

import { inject } from '../common/container';
import Logger from '../common/logger';
import Uploader from './uploader';

class S3Uploader extends Uploader {
  @inject() config: any;
  @inject() log: Logger
  @inject('aws.s3') s3;

  getUploadDir(type) {
    const date = new Date();
    const media = type.split('/').shift();
    const baseDir = this.config.storage.bucketBaseKey;

    return `${baseDir}/${media}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }

  /**
   * Content-Disposition 메타 태그 문자열을 위해 문자열을 인코딩함.
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
   */
  encodeRFC5987(str) {
    return encodeURIComponent(str) 
      .replace(/['()*]/g, c => "%" + c.charCodeAt(0).toString(16))
      .replace(/%(7C|60|5E)/g, (str, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  async uploadFile(localPath, originalName, type) {
    const bucketName = this.config.storage.bucket;
    const filename = this.getUniqueFileName(originalName);
    const dir = this.getUploadDir(type);
    const uploadPath = dir + '/' + filename;
    let buf = fs.readFileSync(localPath);

    return new Promise<string>((resolve) => {
      this.s3.putObject({
        Bucket: bucketName,
        Key: uploadPath,
        ContentType: type,
        ContentDisposition: 'attachment',
        Body: buf
      }, (err, res) => {
        if (err) {
          this.log.error(err, 'an error occured when uploading file to S3');
        } else {
          resolve(`//${bucketName}/${uploadPath}`);
        }
      });
    });
  }

  async deleteFile(uploadPath: string) {
    const bucketName = this.config.storage.bucket;
    const key = uploadPath.substring(uploadPath.indexOf(bucketName) + bucketName.length + 1);

    this.s3.deleteObject({
      Bucket: bucketName,
      Key: key,
    }, (err, res) => {
      if (err) {
        this.log.error(err, 'an error occured when deleting file from S3');
      }
    });
  }
}

export default S3Uploader;
