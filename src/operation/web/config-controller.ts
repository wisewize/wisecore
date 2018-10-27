import { inject } from '../../common/container';
import Controller, { route, pathParam, paginated, validate, authorize, queryParam } from '../../common/controller';
import ConfigService from '../services/config-service';
import Config from '../models/config';

class ConfigController extends Controller {
  @inject() configService: ConfigService;

  @route('GET', '/operation/configs/#configId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getConfig(@pathParam('configId') configId) {
    let config = await this.configService.getConfig(configId);

    return config;
  }

  @route('GET', '/operation/configs/get')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getConfigByKey(@queryParam('key') key) {
    let config = await this.configService.getConfigByKey(key);

    return config;
  }

  @route('GET', '/operation/configs')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getConfigCollection(@paginated pagination) {
    let configs = await this.configService.getConfigs(pagination);

    return configs;
  }

  @route('POST', '/operation/configs')
  @authorize(e => e.hasAuthority('ADMIN'))
  async createConfig(@validate(Config) data) {
    let insertId = await this.configService.createConfig(data);

    return `/operation/configs/${insertId}`;
  }

  @route('PUT', '/operation/configs/:configId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async updateConfig(@pathParam('configId') configId, @validate(Config) data) {
    await this.configService.updateConfig(configId, data);
  }

  @route('DELETE', '/operation/configs/:configId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async deleteConfig(@pathParam('configId') configId) {
    await this.configService.deleteConfig(configId);
  }
}

export default ConfigController;
