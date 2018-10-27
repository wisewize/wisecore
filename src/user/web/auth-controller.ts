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

    return await JwtAuthentication.createToken(
      user,
      groups,
      authorities,
      this.config.jwt.secret,
      expiresIn || this.config.jwt.expiresIn
    );
  }

  @route('GET', '/auth/validate')
  @authorize(e => e.authenticated())
  validateAuthToken(ctx) {
  }
}

export default AuthController;
