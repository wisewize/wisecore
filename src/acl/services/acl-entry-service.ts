import { inject } from '../../common/container';
import { NoResourceError } from '../../common/errors';
import Service from '../../common/service';
import aclEntryRepository from '../repositories/acl-entry-repository';

class AclEntryService extends Service {
  @inject()
  aclEntryRepository: aclEntryRepository;

  async getAclEntry(aclEntryId) {
    let aclEntry = await this.aclEntryRepository.getOne(aclEntryId);

    if (!aclEntry) {
      throw new NoResourceError();
    }

    return aclEntry;
  }

  async getAclEntries(pagination) {
    return await this.aclEntryRepository.getCollection(pagination);
  }

  async createAclEntry(data) {
    let insertId = await this.aclEntryRepository.create(data);

    return insertId;
  }

  async updateAclEntry(aclEntryId, data) {
    await this.aclEntryRepository.update(aclEntryId, data);
  }

  async deleteAclEntry(aclEntryId) {
    await this.aclEntryRepository.del(aclEntryId);
  }
}

export default AclEntryService;
