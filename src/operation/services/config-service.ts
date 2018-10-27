import { inject } from '../../common/container';
import Service from '../../common/service';
import { NoResourceError, ConflictError } from '../../common/errors';
import ConfigRepository from '../repositories/config-repository';
import Authentication from '../../user/authentication';

class ConfigService extends Service {
  @inject() auth: Authentication;
  @inject() private configRepository: ConfigRepository;
  @inject('config') private defaultConfig: any;

  private configCache: Map<string, any> = new Map();

  constructor(container) {
    super(container);
  }

  async get(key: string) {
    if (this.configCache.has(key)) {
      return this.configCache.get(key);
    }

    let v = await this.configRepository.getValue(key);

    if (v === null) {
      return this.defaultConfig[key];
    }

    let t = JSON.parse(v);

    this.configCache.set(key, t);

    return t;
  }

  async set(key: string, value: any) {
    let v = JSON.stringify(value, null, 2);

    await this.configRepository.setValue(key, v);

    this.configCache.set(key, value);
  }

  async getConfig(configId) {
    let config = await this.configRepository.getOne(configId);

    if (!config) {
      throw new NoResourceError();
    }

    return config;
  }

  async getConfigByKey(key) {
    let config = await this.configRepository.getOne({ key });

    if (!config) {
      throw new NoResourceError();
    }

    return config;
  }

  async getConfigs(pagination) {
    let configs = await this.configRepository.getCollection(pagination);

    return configs;
  }

  async createConfig(data: any) {
    if (await this.configRepository.hasOne({ key: data.key })) {
      throw new ConflictError('이미 같은 키를 가진 설정이 존재합니다.', 'key');
    }

    const configId = await this.configRepository.setValue(data.key, data.value);
    this.configCache.set(data.key, data.value);

    this.log.info({ configId, username: this.auth.user.username, key: data.key }, '시스템 설정이 생성되었습니다.');

    return configId;
  }

  async updateConfig(configId, data) {
    if (!await this.configRepository.hasOne(configId)) {
      throw new NoResourceError();
    }

    await this.configRepository.setValue(data.key, data.value);
    this.configCache.set(data.key, data.value);
  }

  async deleteConfig(configId) {
    const config = await this.configRepository.getOne(configId);

    if (!config) {
      throw new NoResourceError();
    }

    await this.configRepository.del(configId);
    this.configCache.delete(config.key);

    this.log.info({ configId, username: this.auth.user.username, key: config.key }, '시스템 설정이 삭제되었습니다.');
  }
}

export default ConfigService;
