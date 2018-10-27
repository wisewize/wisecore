import { inject } from '../../common/container';
import Controller, { route, pathParam, paginated, validate, authorize } from '../../common/controller';
import AclEntryService from '../services/acl-entry-service';
import AclEntry from '../models/acl-entry';

class AclEntryController extends Controller {
  @inject() aclEntryService: AclEntryService;

  @route('GET', '/acl-entries/:aclEntryId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getAclEntry(@pathParam('aclEntryId') aclEntryId) {
     return await this.aclEntryService.getAclEntry(aclEntryId);
  }

  @route('GET', '/acl-entries')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getAclEntryCollection(@paginated pagination) {
    return await this.aclEntryService.getAclEntries(pagination);
  }

  @route('POST', '/acl-entries')
  @authorize(e => e.hasAuthority('ADMIN'))
  async createAclEntry(@validate(AclEntry) data) {
    let insertId = await this.aclEntryService.createAclEntry(data);

    return `/acl-entries/${insertId}`;
  }

  @route('PUT', '/acl-entries/:aclEntryId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async updateAclEntry(@pathParam('aclEntryId') aclEntryId, @validate(AclEntry) data) {
    await this.aclEntryService.updateAclEntry(aclEntryId, data);
  }

  @route('DELETE', '/acl-entries/:aclEntryId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async deleteAclEntry(@pathParam('aclEntryId') aclEntryId) {
    await this.aclEntryService.deleteAclEntry(aclEntryId);
  }
}

export default AclEntryController;
