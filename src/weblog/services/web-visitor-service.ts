import crypto from 'crypto';
import useragent from 'useragent';

import { inject } from '../../common/container';
import Service from '../../common/service';
import { NoResourceError } from '../../common/errors';
import WebVisitorRepository from '../repositories/web-visitor-repository';

class WebVisitorService extends Service {
  @inject('context') ctx;
  @inject('configService') configService;
  @inject() webVisitorRepository: WebVisitorRepository;

  async getWebVisitor(visitorId) {
    let visitor = await this.webVisitorRepository.getOne(visitorId);

    if (!visitor) {
      throw new NoResourceError();
    }

    return visitor;
  }

  async getWebVisitors(pagination) {
    return await this.webVisitorRepository.getCollection(pagination);
  }

  async getCurrentWebVisitorId() {
    let networkConfig = this.configService.get('network');
    let ipAddress = (networkConfig && networkConfig.reversedXff) ? this.ctx.request.ips[0] || this.ctx.request.ip : this.ctx.request.ip;
    let userAgent = this.ctx.request.get('user-agent');
    let visitorId = await this.fetchWebVisitorId(ipAddress, userAgent);

    return visitorId;
  }

  async fetchWebVisitorId(ipAddress: string, userAgent: string) {
    let hash = crypto.createHash('md5').update(ipAddress + '-' + userAgent).digest('hex');
    let visitor = await this.webVisitorRepository.getOneByHash(hash);

    if (!visitor) {
      let agent = useragent.parse(userAgent);
      let browser = agent.family;

      return await this.webVisitorRepository.create({
        hash,
        ipAddress,
        browser: browser === 'IE' ? browser + ' ' + agent.major : browser,
        os: agent.os.family,
        device: agent.device.family
      });
    }

    return visitor.id;
  }
}

export default WebVisitorService;
