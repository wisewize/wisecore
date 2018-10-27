import { inject } from '../../common/container';
import { NoResourceError } from '../../common/errors';
import Service from '../../common/service';
import AclClassRepository from '../repositories/acl-class-repository';

class AclClassService extends Service {
  @inject()
  aclClassRepository: AclClassRepository;

  async getAclClass(aclClassId) {
    let aclClass = await this.aclClassRepository.getOne(aclClassId);

    if (!aclClass) {
      throw new NoResourceError();
    }

    return aclClass;
  }

  async getAclClasses(pagination) {
    return await this.aclClassRepository.getCollection(pagination);
  }

  async createAclClass(data) {
    let insertId = await this.aclClassRepository.create(data);

    return insertId;
  }

  async updateAclClass(aclClassId, data) {
    await this.aclClassRepository.update(aclClassId, data);
  }

  async deleteAclClass(aclClassId) {
    await this.aclClassRepository.del(aclClassId);
  }
}

export default AclClassService;
