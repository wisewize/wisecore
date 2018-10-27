import Middleware from './middleware';
import Logger from './logger';

class CommonError {
  public status: number;
  public message: string;

  constructor(status = 200, message = '에러가 발생했습니다.') {
    this.status = status;
    this.message = message;
  }
}

interface BadRequestField {
  field: string;
  message: string;
}

class BadRequestError extends CommonError {
  public errors: BadRequestField[] = [];

  constructor() {
    super(400, '요청한 데이터가 올바르지 않습니다.');
  }

  addField(field: string, message: string) {
    this.errors.push({ field, message });
  }
}

class UnauthorizedError extends CommonError {
  constructor() {
    super(401, '인증에 실패하였습니다.');
  }
}

class ForbiddenError extends CommonError {
  constructor() {
    super(403, '권한이 없습니다.');
  }
}

class NoResourceError extends CommonError {
  constructor() {
    super(404, '요청한 리소스가 존재하지 않습니다.');
  }
}

class ConflictError extends CommonError {
  public field: string;

  constructor(message, field?: string) {
    super(409, message);

    this.field = field;
  }
}

class InternalServerError extends CommonError {
  constructor() {
    super(500, '서버 에러가 발생하였습니다.');
  }
}

class ErrorHandlerMiddleware extends Middleware {
  priority = 2;
  log: Logger;

  constructor(log: Logger) {
    super();
    this.log = log;
  }

  async run(ctx: any, next) {
     try {
      await next();
    } catch (e) {
      await ctx.container.get('transaction').rollback();

      if (e instanceof CommonError) {
        ctx.status = e.status;
        ctx.body = e;
      } else if (e.code === 'ER_DUP_ENTRY') {
        // mysql 중복값 에러 메시지
        let field = e.message.substring(e.message.indexOf(' for key ') + 10).split('_')[1];
        let error = new ConflictError('이미 존재하는 값입니다.', field);
        ctx.status = error.status;
        ctx.body = error;
        console.log(e)
      } else if (e.message && e.message.indexOf('UNIQUE') >= 0) {
        // sqlite 중복값 에러 메시지
        let field = e.message.substring(e.message.indexOf('failed:') + 8, e.message.length); 
        let error = new ConflictError('이미 존재하는 값입니다.', field);
        ctx.status = error.status;
        ctx.body = error;
      } else if (e.message && e.message.indexOf('invalid JSON') >= 0) {
        ctx.status = 406;
        ctx.body = new CommonError(406, '올바른 JSON 개체 또는 배열 형식이 아닙니다.');
      } else {
        ctx.status = 500;
        ctx.body = new CommonError(500, '알 수 없는 에러가 발생하였습니다.');

        this.log.error(e);
      }
    }
  }
}

export {
  CommonError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NoResourceError,
  ConflictError,
  InternalServerError,
  ErrorHandlerMiddleware
};
