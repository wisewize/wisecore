import crypto from 'crypto';
import useragent from 'useragent';

import { inject } from '../../common/container';
import Service from '../../common/service';
import { NoResourceError } from '../../common/errors';
import WebVisitorRepository from '../repositories/web-visitor-repository';

class WebVisitorService extends Service {
  @inject('context') ctx;
  @inject() ipAddress;
  @inject() webVisitorRepository: WebVisitorRepository;

  async getWebVisitor(visitorId) {
    const visitor = await this.webVisitorRepository.getOne(visitorId);

    if (!visitor) {
      throw new NoResourceError();
    }

    return visitor;
  }

  async getWebVisitors(pagination) {
    return await this.webVisitorRepository.getCollection(pagination);
  }

  async getCurrentWebVisitorId() {
    const userAgent = this.ctx.request.get('user-agent');
    const visitorId = await this.fetchWebVisitorId(this.ipAddress, userAgent);

    return visitorId;
  }

  async fetchWebVisitorId(ipAddress: string, userAgent: string) {
    const hash = crypto.createHash('md5').update(ipAddress + '-' + userAgent).digest('hex');
    const visitor = await this.webVisitorRepository.getOneByHash(hash);

    if (!visitor) {
      const agent = useragent.parse(userAgent);
      const browser = agent.family;

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
