import { column } from '../../common/model';

class AclClass {
  @column({ type: 'key' })
  id: number;

  @column({
    type: 'string',
    min: 2,
    max: 50
  })
  name: string;

  @column( {
    type: 'string',
    min: 2,
    max: 100
  })
  description: string;
}

export default AclClass;
