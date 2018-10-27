import koaBody from 'koa-body';
import Middleware from './middleware';

class BodyParserMiddleware extends Middleware {
  priority = 5;
  parser: any;

  constructor() {
    super();
    this.parser = koaBody({ multipart: true });
  }

  async run(ctx, next) {
    await this.parser(ctx, next);
  }
}

export default BodyParserMiddleware;
