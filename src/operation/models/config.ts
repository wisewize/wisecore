import Model, { column } from '../../common/model';

class Config {
  @column({ type: 'key' })
  id: number;

  @column({
    type: 'string',
    textSearch: true
  })
  key: string;

  @column({
    type: 'string',
    excludedOn: [Model.Action.Collect]
  })
  value: string;
}

export default Config;
