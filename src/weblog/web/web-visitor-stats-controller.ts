import { inject } from '../../common/container';
import Controller, { route, queryParam, paginated, authorize } from '../../common/controller';
import WebVisitorStatsService from '../services/web-visitor-stats-service';

class WebVisitorStatsController extends Controller {
  @inject() webVisitorStatsService: WebVisitorStatsService;

  @route('GET', '/weblog/visitor-count')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getWebVisitorCount(@queryParam('span') span, @paginated pagination) {
    let result = await this.webVisitorStatsService.getVisitorCounts(span || 'day', pagination);

    return result;
  }

  @route('GET', '/weblog/page-view-count')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getPageViewCount(@queryParam('span') span, @paginated pagination) {
    let result = await this.webVisitorStatsService.getPageViewCounts(span || 'day', pagination);

    return result;
  }
}

export default WebVisitorStatsController;
