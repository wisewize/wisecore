import { column, table } from '../../common/model';

@table({ name: 'User' })
class UserSummary {
  @column({ type: 'key' })
  id: number;

  @column({
    type: 'string',
    min: 2,
    max: 50
  })
  nickname: string;

  @column({ type: 'email' })
  email: string;

  @column({ type: 'boolean' })
  guest: boolean;
}

export default UserSummary;
