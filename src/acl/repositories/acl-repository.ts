import Repository from '../../common/repository';
import AclPermission from '../models/acl-permission';

class AclRepository extends Repository {
  async getAclEntries(mask: AclPermission, typeName: string, objectId: number) {
    let result = await this.db
      .select(
        'AclClass.name as typeName',
        'AclEntry.objectId',
        'AclEntry.sid',
        'AclEntry.principal',
        'AclEntry.mask',
        'AclEntry.granting'
      )
      .from('AclEntry')
      .innerJoin('AclClass', 'AclClass.id', 'AclEntry.typeId')
      .where({
        'AclClass.name': typeName,
        'AclEntry.objectId': objectId,
        'AclEntry.mask': mask
      });

    return result;
  }
}

export default AclRepository;
