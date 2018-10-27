import ModelRepository from '../../common/model-repository';
import Config from '../models/config';

class ConfigRepository extends ModelRepository {
  constructor(container) {
    super(container, Config);
  }

  async getValue(key: string): Promise<string> {
    let result = await this.db.first('value').from(this.tableName).where('key', key);

    if (!result) {
      return null;
    }

    return result.value;
  }

  async setValue(key: string, value: string) {
    let result = await this.db.first('id').from(this.tableName).where('key', key);

    if (!result) {
      return await this.db.insert({ key, value }).into(this.tableName);
    } else {
      return await this.queryOne(result.id).update({ value });
    }
  }
}

export default ConfigRepository;
