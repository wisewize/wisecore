import Middleware from '../common/middleware';

class HoneypotMiddleware extends Middleware {
  after = 'BodyParserMiddleware';

  async run(ctx, next) {
    let data = ctx.request.body;

    if (typeof data === 'object' && 'captcha' in data) {
      if (data.captcha) {
        ctx.status = 200;
        ctx.body = '';
        return;
      } else {
        delete data.captcha;
      }
    }

    await next();
  }
}

export default HoneypotMiddleware;
