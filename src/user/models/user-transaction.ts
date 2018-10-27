import Model, { column } from '../../common/model';

class UserTransaction {
  @column({
    type: 'string',
    max: 60
  })
  code: string;

  @column({
    type: 'enum',
    value: ['REGISTER', 'DEREGISTER', 'PASSWORD']
  })
  type: string;

  @column({ type: 'key' })
  userId: number;

  @column({
    type: 'timestamp',
    excludedOn: Model.ModificationActions
  })
  completedAt: string;

  @column({ type: 'timestamp' })
  expireAt: string;

  @column({ type: 'timestamp' })
  createdAt: string;
}

export default UserTransaction;
