import { inject } from '../../common/container';
import Controller, { route, pathParam, paginated, authorize } from '../../common/controller';
import WebVisitorService from '../services/web-visitor-service';

class WebVisitorController extends Controller {
  @inject() webVisitorService: WebVisitorService;

  @route('GET', '/web-visitors/:visitorId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getWebVisitor(@pathParam('visitorId') visitorId) {
     return await this.webVisitorService.getWebVisitor(visitorId);
  }

  @route('GET', '/web-visitors')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getWebVisitorCollection(@paginated pagination) {
    return await this.webVisitorService.getWebVisitors(pagination);
  }
}

export default WebVisitorController;
