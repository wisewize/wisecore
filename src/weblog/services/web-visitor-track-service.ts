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
    const track = await this.webVisitorTrackRepository.getOne(trackId);

    if (!track) {
      throw new NoResourceError();
    }

    return track;
  }

  async getWebVisitorTracks(pagination) {
    return await this.webVisitorTrackRepository.getCollection(pagination);
  }

  async createWebVisitorTrack(referer?: string) {
    const user = this.auth.user;
    const visitorId = await this.webVisitorService.getCurrentWebVisitorId();
    const httpReferer = this.ctx.request.get('referer');

    return await this.webVisitorTrackRepository.create({
      userId: user && user.id,
      visitorId,
      referer: (referer || httpReferer).toString().substring(0, 255)
    });
  }
}

export default WebVisitorTrackService;
