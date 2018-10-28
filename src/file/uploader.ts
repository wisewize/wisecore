import Container, { Injectable } from '../common/container';
import { getRandomString } from '../common/util';

abstract class Uploader implements Injectable {
  container: Container;

  constructor(container) {
    this.container = container;
  }

  getUniqueFileName(oldName) {
    let prefix = getRandomString(5);
    return prefix + '_' + oldName;
  }

  abstract async uploadFile(localPath: string, originalName: string, type: string): Promise<string>;
  abstract async deleteFile(uploadPath: string): Promise<void>;
}

export default Uploader;
