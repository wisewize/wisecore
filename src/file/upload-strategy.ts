import Uploader from './uploader';
import Storage from './models/storage';

interface UploadResult {
  url: string;
  thumbUrl?: string;
  name: string;
  size: number;
  type: string;
  info?: any;
}

interface UploadStrategy {
  (uploader: Uploader, storage: Storage, file): Promise<UploadResult>;
}

export default UploadStrategy;
