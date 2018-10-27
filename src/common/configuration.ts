
interface DatabaseConfiguration {
  engine: string;
  connection?: any;
  storageSize?: number;
}

interface UserConfiguration {
  avatarSize: { width: number, height: number };
}

interface NetworkConfiguration {
  reversedXff?: boolean;
  trafficSize?: number;
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
}

export default Configuration;
