import { column } from '../../common/model';

class Notification {
  @column({ type: 'key' })
  id: number;

  @column({
    type: 'enum',
    value: ['INFO', 'WARNING', 'ERROR', 'FATAL']
  })
  type: string;

  @column({
    type: 'string',
    max: 255
  })
  message: string;

  @column({
    type: 'string',
    max: 50
  })
  target: string;

  @column({
    type: 'timestamp',
    required: false
  })
  readAt: string;

  @column({ type: 'timestamp' })
  createdAt: string;
}

export default Notification;
