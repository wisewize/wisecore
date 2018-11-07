import Model, { column } from '../../common/model';
import User from '../../user/models/user';

class File {
  @column({ type: 'key' })
  id: number;

  @column({
    type: 'key',
    excludedOn: Model.AllActions
  })
  storageId: number;

  @column({
    type: 'reference',
    relation: Model.Relation.BelongsTo,
    model: User
  })
  owner: User;

  @column({ type: 'string', max: 255 })
  url: string;

  @column({ type: 'string', max: 50 })
  name: string;

  @column({ type: 'integer' })
  size: number;

  @column({ type: 'string', max: 50 })
  type: string;

  @column({ type: 'string', max: 255, required: false })
  thumbUrl: string;

  @column({ type: 'json', required: false })
  info: any;

  @column({ type: 'integer' })
  refCount: number;

  @column({ type: 'timestamp' })
  createdAt: string;
}

export default File;
