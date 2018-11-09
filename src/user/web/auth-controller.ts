import { inject } from '../../common/container';
import Controller, { route, validate, authorize, queryParam } from '../../common/controller';
import JwtAuthentication from '../jwt-authentication';
import Auth from '../models/auth';
import UserService from '../services/user-service';

class AuthController extends Controller {
  @inject() userService: UserService;
  @inject() config;

  @route('POST', '/auth')
  async createAuthToken(@validate(Auth) q, @queryParam('expiresIn') expiresIn) {
    const { user, groups, authorities } = await this.userService.authenticate(q.username, q.password);
    const jwtConfig = {
      secret: (this.config.jwt && this.config.jwt.secret) || JwtAuthentication.defaultJwtSecret,
      expiresIn: expiresIn || (this.config.jwt && this.config.jwt.expiresIn) || undefined
    };

    return await JwtAuthentication.createToken(
      user,
      groups,
      authorities,
      jwtConfig.secret,
      jwtConfig.expiresIn
    );
  }

  @route('GET', '/auth/validate')
  @authorize(e => e.authenticated())
  validateAuthToken(ctx) {
  }
}

export default AuthController;
