import { inject } from '../../common/container';
import Service from '../../common/service';
import WebVisitorStatsRepository from '../repositories/web-visitor-stats-repository';

class WebVisitorStatsService extends Service {
  @inject() webVisitorStatsRepository: WebVisitorStatsRepository;

  async getVisitorCounts(span: string, pagination) {
    let result = await this.webVisitorStatsRepository.getVisitorCountCollection(span, pagination);

    return result;
  }

  async getPageViewCounts(span: string, pagination) {
    let result = await this.webVisitorStatsRepository.getPageViewCountCollection(span, pagination);

    return result;
  }
}

export default WebVisitorStatsService;
