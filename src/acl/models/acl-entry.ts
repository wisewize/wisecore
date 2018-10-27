import Model, { column } from '../../common/model';
import AclClass from './acl-class';

class AclEntry {
  @column({ type: 'key' })
  id: number;

  @column({
    type: 'reference',
    relation: Model.Relation.BelongsTo,
    model: AclClass
  })
  type: AclClass;

  @column({ type: 'key', required: false })
  objectId: number;

  @column({ type: 'key' })
  sid: number;

  @column({ type: 'boolean' })
  principal: boolean;

  @column({ 
    type: 'integer',
    minValue: 1,
    maxValue: 65536
  })
  mask: number;

  @column({ type: 'boolean' })
  granting: boolean;
}

export default AclEntry;
