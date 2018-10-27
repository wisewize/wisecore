import { inject } from '../../common/container';
import Controller, { route, pathParam, paginated, validate, authorize } from '../../common/controller';
import AclClassService from '../services/acl-class-service';
import AclClass from '../models/acl-class';

class AclClassController extends Controller {
  @inject() aclClassService: AclClassService;

  @route('GET', '/acl-classes/:aclClassId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getAclClass(@pathParam('aclClassId') aclClassId: number) {
     return await this.aclClassService.getAclClass(aclClassId);
  }

  @route('GET', '/acl-classes')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getAclClassCollection(@paginated pagination) {
    return await this.aclClassService.getAclClasses(pagination);
  }

  @route('POST', '/acl-classes')
  @authorize(e => e.hasAuthority('ADMIN'))
  async createAclClass(@validate(AclClass) data) {
    let insertId = await this.aclClassService.createAclClass(data);

    return `/acl-classes/${insertId}`;
  }

  @route('PUT', '/acl-classes/:aclClassId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async updateAclClass(@pathParam('aclClassId') aclClassId, @validate(AclClass) data) {
    await this.aclClassService.updateAclClass(aclClassId, data);
  }

  @route('DELETE', '/acl-classes/:aclClassId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async deleteAclClass(@pathParam('aclClassId') aclClassId) {
    await this.aclClassService.deleteAclClass(aclClassId);
  }
}

export default AclClassController;
