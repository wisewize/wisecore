import Container, { inject } from '../common/container';
import UserService from './services/user-service';
import Authentication, { AuthenticationUser } from './authentication';
import { UnauthorizedError } from '../common/errors';

class BasicAuthentication implements Authentication {
  container: Container;
  
  @inject() userService: UserService;

  user: AuthenticationUser = null;
  token: string = null;

  private _authenticated = false;

  constructor(container, authHeader) {
    if (authHeader.indexOf('Basic ') !== 0) {
      throw new UnauthorizedError();
    }

    this.token = authHeader.substring(6);
    this.container = container;
  }

  verify() {
    return this._authenticated;
  }

  async init() {
    await this.decodeToken(this.token);
  }

  async decodeToken(token: string) {
    const decoded: string = Buffer.from(token, 'base64').toString('ascii');
    const words = decoded.split(':');

    if (words.length !== 2) {
      throw new UnauthorizedError();
    }

    const username = words[0];
    const password = words[1];
    const { user, groups, authorities } = await this.userService.authenticate(username, password);

    this._authenticated = true;

    this.user = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      groups: groups.map(g => ({ id: g.id, name: g.name })),
      authorities: authorities.map(a => ({ id: a.id, name: a.name}))
    };
  }
}

export default BasicAuthentication;
