import { inject } from '../../common/container';
import Controller, { route, pathParam, formData, validate, paginated, authorize } from '../../common/controller';
import Pagination from '../../common/pagination';
import Authentication from '../authentication';
import User from '../models/user';
import UserService from '../services/user-service';

class UserController extends Controller {
  @inject() private auth: Authentication;
  @inject() private userService: UserService;
  @inject('context') private ctx;

  @route('GET', '/')
  async getRoot() {
    return 'OK';
  }

  @route('GET', '/users/:userId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getUser(@pathParam('userId') userId: number) {
    let user = await this.userService.getUser(userId);

    return user;
  }

  @route('GET', '/users')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getUserCollection(@paginated pagination: Pagination) {
    let users = await this.userService.getUsers(pagination);

    return users;
  }

  @route('POST', '/users')
  @authorize(e => e.hasAuthority('ADMIN'))
  async createUser(@validate(User) data: User) {
    let insertId = await this.userService.createUser(data);

    return `/users/${insertId}`;
  }

  @route('PUT', '/users/:userId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async updateUser(@pathParam('userId') userId: number, @validate(User) data: User) {
    await this.userService.updateUser(userId, data);
  }

  @route('DELETE', '/users/:userId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async deleteUser(@pathParam('userId') userId: number) {
    await this.userService.deleteUser(userId);
  }

  @route('GET', '/users/:userId/avatar')
  async getUserAvatar(@pathParam('userId') userId) {
    let avatar = await this.userService.getUserAvatar(userId);

    this.ctx.set('Content-Type', avatar.type);

    return avatar.data;
  }

  @route('POST', '/users/:userId/avatar')
  async setUserAvatar(@pathParam('userId') userId, @formData('file') file) {
    await this.userService.setUserAvatar(userId, file);
  }

  @route('GET', '/me')
  @authorize(e => e.authenticated())
  async getCurrentUser() {
    return await this.userService.getUser(this.auth.user.id);
  }
}

export default UserController;
