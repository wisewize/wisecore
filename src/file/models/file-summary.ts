import { column, table } from '../../common/model';

@table({ name: 'File' })
class FileSummary {
  @column({ type: 'key' })
  id: number;

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
}

export default FileSummary;
