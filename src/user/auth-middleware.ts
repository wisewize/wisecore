import Middleware from '../common/middleware';
import Authentication from './authentication';
import BasicAuthentication from './basic-authentication';
import JwtAuthentication from './jwt-authentication';
import { UnauthorizedError } from '../common/errors';

class EmptyAuthentication implements Authentication {
  container = null;
  user = null;

  constructor(container, authHeader) {
    if (authHeader) {
      throw new UnauthorizedError();
    }
  }

  verify() {
    return false;
  }
}

class AuthMiddleware extends Middleware {
  after = 'CorsMiddleware';
  authentications = [
    EmptyAuthentication,
    JwtAuthentication,
    BasicAuthentication
  ];

  async run(ctx, next) {
    let container = ctx.container;
    let authHeader = ctx.get('Authorization');
    let authInstance = null;

    for (let Auth of this.authentications) {
      try {
        authInstance = new Auth(container, authHeader);
        break;
      } catch (e) {
        ;
      }
    }

    if (!authInstance) {
      throw new UnauthorizedError();
    }

    if ('init' in authInstance) {
      await authInstance.init();
    }

    container.set('auth', () => () => authInstance);

    await next();
  }
}

export default AuthMiddleware;
