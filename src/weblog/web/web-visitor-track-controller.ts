import { inject } from '../../common/container';
import Controller, { route, pathParam, paginated, authorize, queryParam } from '../../common/controller';
import WebVisitorTrackService from '../services/web-visitor-track-service';

class WebVisitorTrackController extends Controller {
  @inject() webVisitorTrackService: WebVisitorTrackService;

  @route('GET', '/web-visitor-tracks/:trackId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getWebVisitorTrack(@pathParam('trackId') trackId) {
     return await this.webVisitorTrackService.getWebVisitorTrack(trackId);
  }

  @route('GET', '/web-visitor-tracks')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getWebVisitorTrackCollection(@paginated pagination) {
    return await this.webVisitorTrackService.getWebVisitorTracks(pagination);
  }

  @route('POST', '/web-visitor-tracks')
  async createWebVisitorTrack(@queryParam('referer') referer) {
    let insertId = await this.webVisitorTrackService.createWebVisitorTrack(referer);

    return `/web-visitor-tracks/${insertId}`;
  }
}

export default WebVisitorTrackController;
