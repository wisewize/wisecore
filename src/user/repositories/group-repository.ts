import { inject } from '../../common/container';
import ModelRepository from '../../common/model-repository';
import AuthorityRepository from './authority-repository';
import Group from '../models/group';

class GroupRepository extends ModelRepository {
  @inject()
  private authorityRepository: AuthorityRepository;

  constructor(container) {
    super(container, Group);
  }

  async addGroupToUser(userId, groupId) {
    return await this.db
      .insert({ userId, groupId })
      .into('GroupUser');
  }

  async removeGroupFromUser(userId, groupId) {
    return await this.db
      .from('GroupUser')
      .where({ userId, groupId })
      .del();
  }

  async getUserGroupCollection(userId, pagination) {
    return await this.collect(pagination, this.columns, null, db =>
      db
        .from('Group')
        .innerJoin('GroupUser', 'Group.id', 'GroupUser.groupId')
        .where('GroupUser.userId', userId)
    );
  }

  async addAuthorityToGroup(groupId, authorityId) {
    return await this.db
      .insert({ groupId, authorityId })
      .into('GroupAuthority');
  }

  async removeAuthorityFromGroup(groupId, authorityId) {
    return await this.db
      .from('GroupAuthority')
      .where({ groupId, authorityId })
      .del();
  }

  async getGroupAuthorityCollection(groupId, pagination) {
    let columns = this.authorityRepository.columns;

    return await this.collect(pagination, columns, null, db =>
      db
        .from('Authority')
        .innerJoin('GroupAuthority', 'Authority.id', 'GroupAuthority.authorityId')
        .where('GroupAuthority.groupId', groupId)
    );
  }
}

export default GroupRepository;
