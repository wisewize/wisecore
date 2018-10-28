import { column } from '../../common/model';

class WeblogSpanCount {
  @column({ type: 'date' })
  date: string;

  @column({ type: 'integer' })
  year: number;

  @column({ type: 'integer' })
  month: number;

  @column({ type: 'integer', required: false })
  day: number;

  @column({ type: 'integer', required: false })
  week: number;

  @column({ type: 'integer' })
  count: number;
}

export default WeblogSpanCount;
