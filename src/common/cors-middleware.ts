import Middleware from './middleware';

class CorsMiddleware extends Middleware {
  priority = 3;

  async run(ctx: any, next) {
    let origin = ctx.get('Origin');

    ctx.set('Access-Control-Allow-Origin', origin);

    if (ctx.method.toUpperCase() === 'OPTIONS') {
      let allowMethod = ctx.get('Access-Control-Request-Method');

      ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      ctx.set('Access-Control-Allow-Headers', 'Accept, Content-Type, Authorization');
      ctx.set('Access-Control-Age', '1728000');

      ctx.status = 204;
      ctx.body = '';
    } else {
      ctx.set('Access-Control-Expose-Headers', 'Content-Type, Location, X-Pagination-Page, X-Pagination-Count, X-Pagination-Limit');

      await next();
    }
  }
}

export default CorsMiddleware;
