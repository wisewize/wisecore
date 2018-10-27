import { inject } from '../../common/container';
import Service from '../../common/service';
import { NoResourceError } from '../../common/errors';
import AuthorityRepository from '../repositories/authority-repository';
import GroupRepository from '../repositories/group-repository';
import UserRepository from '../repositories/user-repository';

class GroupService extends Service {
  @inject() authorityRepository: AuthorityRepository;
  @inject() userRepository: UserRepository;
  @inject() groupRepository: GroupRepository;

  async getGroup(groupId) {
    let group = await this.groupRepository.getOne(groupId);

    if (!group) {
      throw new NoResourceError();
    }

    return group;
  }

  async getGroups(pagination) {
    return await this.groupRepository.getCollection(pagination);
  }

  async createGroup(data) {
    let insertId = await this.groupRepository.create(data);

    return insertId;
  }

  async updateGroup(groupId, data) {
    await this.groupRepository.update(groupId, data);
  }

  async deleteGroup(groupId) {
    await this.groupRepository.del(groupId);
  }

  async addGroupToUser(userId, groupId) {
    if (
      !await this.userRepository.hasOne(userId) ||
      !await this.groupRepository.hasOne(groupId)
    ) {
      throw new NoResourceError();
    }

    await this.groupRepository.addGroupToUser(userId, groupId);
  }

  async removeGroupFromUser(userId, groupId) {
    if (
      !await this.userRepository.hasOne(userId) ||
      !await this.groupRepository.hasOne(groupId)
    ) {
      throw new NoResourceError();
    }

    await this.groupRepository.removeGroupFromUser(userId, groupId);
  }

  async getUserGroups(userId, pagination) {
    if (!await this.userRepository.hasOne(userId)) {
      throw new NoResourceError();
    }

    return await this.groupRepository.getUserGroupCollection(userId, pagination);
  }

  async addAuthorityToGroup(groupId, authorityId) {
    if (
      !await this.groupRepository.hasOne(groupId) ||
      !await this.authorityRepository.hasOne(authorityId)
    ) {
      throw new NoResourceError();
    }

    await this.groupRepository.addAuthorityToGroup(groupId, authorityId);
  }

  async removeAuthorityFromGroup(groupId, authorityId) {
    if (
      !await this.groupRepository.hasOne(groupId) ||
      !await this.authorityRepository.hasOne(authorityId)
    ) {
      throw new NoResourceError();
    }

    await this.groupRepository.removeAuthorityFromGroup(groupId, authorityId);
  }

  async getGroupAuthorities(groupid, pagination) {
    if (!await this.groupRepository.hasOne(groupid)) {
      throw new NoResourceError();
    }

    return await this.groupRepository.getGroupAuthorityCollection(groupid, pagination);
  }
}

export default GroupService;
