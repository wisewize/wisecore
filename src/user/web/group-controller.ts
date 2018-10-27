import { inject } from '../../common/container';
import Controller, { route, pathParam, paginated, validate, authorize } from '../../common/controller';
import GroupService from '../services/group-service';
import Group from '../models/group';

class GroupController extends Controller {
  @inject() groupService: GroupService;

  @route('GET', '/groups/:groupId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getGroup(@pathParam('groupId') groupId) {
     return await this.groupService.getGroup(groupId);
  }

  @route('GET', '/groups')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getGroupCollection(@paginated pagination) {
    return await this.groupService.getGroups(pagination);
  }

  @route('POST', '/groups')
  @authorize(e => e.hasAuthority('ADMIN'))
  async createGroup(@validate(Group) data) {
    let insertId = await this.groupService.createGroup(data);

    return `/groups/${insertId}`;
  }

  @route('PUT', '/groups/:groupId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async updateGroup(@pathParam('groupId') groupId, @validate(Group) data) {
    await this.groupService.updateGroup(groupId, data);
  }

  @route('DELETE', '/groups/:groupId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async deleteGroup(@pathParam('groupId') groupId) {
    await this.groupService.deleteGroup(groupId);
  }

  @route('PUT', '/users/:userId/groups/:groupId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async addGroupToUser(@pathParam('userId') userId, @pathParam('groupId') groupId) {
    await this.groupService.addGroupToUser(userId, groupId);
  }

  @route('DELETE', '/users/:userId/groups/:groupId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async removeGroupFromUser(@pathParam('userId') userId, @pathParam('groupId') groupId) {
    await this.groupService.removeGroupFromUser(userId, groupId);
  }

  @route('GET', '/users/:userId/groups')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getUserGroupCollection(@pathParam ('userId') userId, @paginated pagination) {
    let result = this.groupService.getUserGroups(userId, pagination);

    return result;
  }

  @route('PUT', '/groups/:groupId/authorities/:authorityId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async addAuthorityToGroup(@pathParam('groupId') groupId, @pathParam('authorityId') authorityId) {
     await this.groupService.addAuthorityToGroup(groupId, authorityId);
  }

  @route('DELETE', '/groups/:groupId/authorities/:authorityId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async removeAuthorityFromGroup(@pathParam('groupId') groupId, @pathParam('authorityId') authorityId) {
     await this.groupService.removeAuthorityFromGroup(groupId, authorityId);
  }

  @route('GET', '/groups/:groupId/authorities')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getGroupAuthorities(@pathParam('groupId') groupId, @paginated pagination) {
     let result = await this.groupService.getGroupAuthorities(groupId, pagination);

     return result;
  }
}

export default GroupController;
