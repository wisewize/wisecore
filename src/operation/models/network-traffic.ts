import Model, { column } from '../../common/model';

class NetworkTraffic {
  @column({ type: 'key' })
  id: number;

  @column({ type: 'integer' })
  rx: number;

  @column({ type: 'integer' })
  tx: number;

  @column({ type: 'integer' })
  srx: number;

  @column({ type: 'integer' })
  stx: number;

  @column({ type: 'timestamp' })
  createdAt: string;
}

export default NetworkTraffic;
