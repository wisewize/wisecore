import parse from 'co-body'; 
import formidable from 'formidable';
import Middleware from './middleware';

class BodyParserMiddleware extends Middleware {
  priority = 5;

  async run(ctx, next) {
    const bodyType = ctx.is('json', 'urlencoded', 'multipart', 'text');

    if (bodyType !== null) {
      switch (bodyType) {
        case 'json':
          ctx.request.body = await parse.json(ctx);
          break;
        case 'urlencoded':
          ctx.request.body = await parse.form(ctx);
          break;
        case 'multipart':
          Object.assign(ctx.request, await this.parseMultipartBody(ctx));
          break;
        case 'text':
          ctx.request.body = await parse.text(ctx);
          break;
        default:
          ctx.request.body = await parse(ctx);
          break;
      }
    }

    await next();
  }

  async parseMultipartBody(ctx) {
    return new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm();

      form.keepExtensions = true;

      form.parse(ctx.req, function (err, fields, files) {
        if (err) {
          reject(err);
        } else {
          resolve({ body: fields, files });
        }
      });
    });
  }
}

export default BodyParserMiddleware;
