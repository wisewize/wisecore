import { column } from '../../common/model';

class SystemLog {
  @column({ type: 'key' })
  id: number;

  @column({ type: 'string' })
  name: string;

  @column({ type: 'string' })
  hostname: string;

  @column({ type: 'integer' })
  pid: number;

  @column({ type: 'integer' })
  level: number;

  @column({ type: 'string' })
  message: string;

  @column({ type: 'string' })
  data: string;

  @column({ type: 'timestamp' })
  time: string;
}

export default SystemLog;
