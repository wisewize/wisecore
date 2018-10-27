import Package from '../common/package';
import Controller from '../common/controller';
import AclPermission from './models/acl-permission';

/**
 * hasPermission 메소드 어노테이션
 */
function hasPermission(perm: AclPermission, typeName: string, contextValue: any, negative = false): any {
  return function (target: any, key: string, descriptor: PropertyDescriptor): void {
    let metadata = Controller.getRouteMetadata(target[key]);

    if (contextValue === 'returnValue') {
      metadata.afterMethodHandlers.unshift(async function(ctx) {
        let result = ctx.body;
        let acl = ctx.container.get('acl');

        if (Array.isArray(result)) {
          let filtered = [];

          for (let entry of result) {
            try {
              await acl.hasPermission(perm, typeName, entry.id, negative);
              filtered.push(entry);
            } catch {
            }
          }

          ctx.body = filtered;
        } else {
          await acl.hasPermission(perm, typeName, result.id, negative);
        }
      });
    } else {
      metadata.beforeMethodHandlers.unshift(async function(ctx) {
        let typeId = await ctx.fetch(contextValue);
        await ctx.container.get('acl').hasPermission(perm, typeName, typeId, negative);
      });
    }
  };
};

class AclPackage extends Package {
  dependencies = ['user'];

  async setup(app) {
    let authorization = app.authorization;

    authorization.addHandler('hasPermission', async (ctx: any, perm: AclPermission, typeName: string, contextValue: any, negative = false) => {
      let acl = ctx.container.get('acl');
      let result = await ctx.fetch(contextValue);

      // TODO 원래는 배열에서 권한이 없는 개체만 선택해서 빼려고 했지만
      // 다른 권한 확인 핸들러와 순서가 뒤바뀌면 다른 결과가 나오기 때문에
      // 더 명확한 방법을 찾아야 함.
      if (Array.isArray(result)) {
        for (let id of result) {
          await acl.hasPermission(perm, typeName, id, negative);
        }
      } else {
        await acl.hasPermission(perm, typeName, result, negative);
      }
    });
  }
}

export default AclPackage;

export {
  hasPermission
};
