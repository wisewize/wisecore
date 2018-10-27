import Package from '../common/package';
import { ForbiddenError } from '../common/errors';

class UserPackage extends Package {
  dependencies = ['operation'];

  async setup(app) {
    let authorization = app.authorization;

    authorization.addHandler('deny', async (ctx, contextValue) => {
      let v = contextValue ? (await ctx.fetch(contextValue)) : true;

      if (v) {
        throw new ForbiddenError();
      }
    });

    authorization.addHandler('authenticated', async (ctx) => {
      if (!ctx.container.get('auth').verify()) {
        throw new ForbiddenError();
      }
    });

    authorization.addHandler('hasId', async (ctx, contextValue) => {
      let auth = ctx.container.get('auth');
      let userId = await ctx.fetch(contextValue);

      if (!auth.user || auth.user.id !== userId) {
        throw new ForbiddenError();
      }
    });

    authorization.addHandler('hasGroup', async (ctx, ...groups) => {
      let auth = ctx.container.get('auth');

      if (!auth.user || [...groups].every(name => !auth.user.groups.find(v => v.name === name))) {
        throw new ForbiddenError();
      }
    });

    authorization.addHandler('hasAuthority', async (ctx, ...authorities) => {
      let auth = ctx.container.get('auth');

      if (!auth.user || [...authorities].every(name => !auth.user.authorities.find(v => v.name === name))) {
        throw new ForbiddenError();
      }
    });
  }
}

export default UserPackage;
