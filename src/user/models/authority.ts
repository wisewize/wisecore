import { column } from '../../common/model';

class Authority {
  @column({ type: 'key' })
  id: number;

  @column({
    type: 'string',
    min: 2,
    max: 50,
    pattern: /^[A-Z]+[A-Z0-9_]*$/
  })
  name: string;

  @column({
    type: 'string',
    min: 2,
    max: 100
  })
  description: string;
}

export default Authority;
