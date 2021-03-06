import jwt from 'jsonwebtoken';

import Logger from '../common/logger';
import Container, { inject } from '../common/container';
import Authentication, { AuthenticationUser } from './authentication';
import { UnauthorizedError } from '../common/errors';
import Group from './models/group';
import Authority from './models/authority';
import User from './models/user';

class JwtAuthentication implements Authentication {
  static defaultJwtSecret = 'jwtsecret';

  container: Container;
  
  @inject() log: Logger;
  @inject() config: any;

  user: AuthenticationUser = null;
  token: string = null;

  private verified: boolean = false;
  private _authenticated = false;

  constructor(container, authHeader) {
    if (authHeader.indexOf('Bearer ') !== 0) {
      throw new UnauthorizedError();
    }

    this.token = authHeader.substring(7);
    this.container = container;

    this.decodeToken(this.token);
  }

  static async createToken(user: User, groups: Group[], authorities: Authority[], secret: string,  expiresIn: string = '10y'): Promise<string> {
    const token = jwt.sign({
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        groups: groups.map(g => ({ id: g.id, name: g.name })),
        authorities: authorities.map(a => ({ id: a.id, name: a.name}))
      }
    }, secret, {
      expiresIn
    });

    return token;
  }

  decodeToken(token: string) {
    try {
      let decoded = jwt.decode(token);

      if (typeof decoded === 'object') {
        this.user = (<any> decoded).user as AuthenticationUser;
      } else {
        throw new UnauthorizedError();
      }
    } catch (e) {
      this.log.error(e, 'error occurred at JwtAuthoentication.decodeToken');
      throw new UnauthorizedError();
    }
  }

  verify(): boolean {
    if (this.verified) {
      return this._authenticated;
    }

    this.verified = true;

    if (this.token) {
      try {
        const secret = (this.config.jwt && this.config.jwt.secret) || JwtAuthentication.defaultJwtSecret;
        jwt.verify(this.token, secret);
        this._authenticated = true;
        return true;
      } catch (e) {
        return false;
      }
    }

    return false;
  }
}

export default JwtAuthentication;
