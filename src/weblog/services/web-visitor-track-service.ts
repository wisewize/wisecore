import { inject } from '../../common/container';
import Service from '../../common/service';
import { NoResourceError } from '../../common/errors';
import WebVisitorTrackRepository from '../repositories/web-visitor-track-repository';
import WebVisitorService from './web-visitor-service';

class WebVisitorTrackService extends Service {
  @inject() webVisitorTrackRepository: WebVisitorTrackRepository;
  @inject() webVisitorService: WebVisitorService;
  @inject('context') ctx;
  @inject('auth') auth;

  async getWebVisitorTrack(trackId) {
    let track = await this.webVisitorTrackRepository.getOne(trackId);

    if (!track) {
      throw new NoResourceError();
    }

    return track;
  }

  async getWebVisitorTracks(pagination) {
    return await this.webVisitorTrackRepository.getCollection(pagination);
  }

  async createWebVisitorTrack() {
    let user = this.auth.user;
    let referer = this.ctx.request.get('referer');
    let visitorId = await this.webVisitorService.getCurrentWebVisitorId();

    return await this.webVisitorTrackRepository.create({ userId: user && user.id, visitorId, referer });
  }
}

export default WebVisitorTrackService;
