import { inject } from '../../common/container';
import Controller, { route, pathParam, paginated, validate, authorize } from '../../common/controller';
import AuthorityService from '../services/authority-service';
import Authority from '../models/authority';

class AuthorityController extends Controller {
  @inject() authorityService: AuthorityService;

  @route('GET', '/authorities/:authorityId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getAuthority(@pathParam('authorityId') authorityId) {
     return await this.authorityService.getAuthority(authorityId);
  }

  @route('GET', '/authorities')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getAuthorityCollection(@paginated pagination) {
    return await this.authorityService.getAuthorities(pagination);
  }

  @route('POST', '/authorities')
  @authorize(e => e.hasAuthority('ADMIN'))
  async createAuthority(@validate(Authority) data) {
    let insertId = await this.authorityService.createAuthority(data);

    return `/authorities/${insertId}`;
  }

  @route('PUT', '/authorities/:authorityId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async updateAuthority(@pathParam('authorityId') authorityId, @validate(Authority) data) {
     await this.authorityService.updateAuthority(authorityId, data);
  }

  @route('DELETE', '/authorities/:authorityId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async deleteAuthority(@pathParam('authorityId') authorityId) {
     await this.authorityService.deleteAuthority(authorityId);
  }
}

export default AuthorityController;
