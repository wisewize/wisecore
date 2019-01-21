
interface DatabaseConfiguration {
  [propName: string]: any;
  engine: string;
  connection?: any;
  storageSize?: number;
}

interface UserConfiguration {
  [propName: string]: any;
  avatarSize: { width: number, height: number };
}

interface NetworkConfiguration {
  proxy?: boolean;
  reversedXff?: boolean;
  trafficSize?: number;
}

interface StorageConfiguration {
  [propName: string]: any;
  storageSize?: number;
  baseDir?: string;
  uploadDir?: string;
  bucketBaseKey?: string;
  bucket?: string;
}

interface Configuration {
  [propName: string]: any;
  apiBase?: string;
  logLevel?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  excludes?: string[];
  database?: DatabaseConfiguration;
  jwt?: { secret: string, expiresIn: string },
  user?: UserConfiguration;
  network?: NetworkConfiguration;
  storage?: StorageConfiguration;
}

export default Configuration;
