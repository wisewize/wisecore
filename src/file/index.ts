import Package from '../common/package';
import LocalUploader from './local-uploader';

class FilePackage extends Package {
  dependencies = ['user', 'operation'];

  async setup(app) {
    // set LocalUploader as default
    app.container.set(container => {
      const localUploader = new LocalUploader(container);
      return () => localUploader;
    });
  }
}

export default FilePackage;
