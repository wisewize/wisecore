import Logger from './logger';
import Container, { Injectable } from './container';
import Middleware from './middleware';
import Model from './model';
import Router from './router';
import Validator, { ValidatorSchema } from './validator';
import Pagination from './pagination';
import { AuthorizationBuilder } from './authorization';
import { CommonError, NoResourceError, BadRequestError } from './errors';

interface RouteHandler {
  (ctx: any): any;
}

interface RouteMetadata {
  httpMethod: string;
  pattern: string;
  controllerClass: any;
  methodName: string;
  beforeMethodHandlers: RouteHandler[];
  afterMethodHandlers: RouteHandler[];
  parameterHandlers: RouteHandler[];
}

let routeMetadataMap = new Map<any, RouteMetadata>();

function getRouteMetadata(method: any) {
  let metadata = routeMetadataMap.get(method);

  if (!metadata) {
    metadata = {
      httpMethod: null,
      pattern: null,
      controllerClass: null,
      methodName: null,
      beforeMethodHandlers: [],
      afterMethodHandlers: [],
      parameterHandlers: []
    };

    routeMetadataMap.set(method, metadata);
  }

  return metadata;
}

/**
 * route 메소드 어노테이션
 */
function route(method: string, pattern: string): any {
  return function (target: any, key: string, descriptor: PropertyDescriptor): void {
    let metadata = getRouteMetadata(target[key]);

    Object.assign(metadata, {
      httpMethod: method,
      pattern,
      controllerClass: target.constructor,
      methodName: key
    });
  }
}

/**
 * pathParam 파라미터 어노테이션
 */
function pathParam(name: string): any {
  return function (target: any, key: string, index: number): void {
    let metadata = getRouteMetadata(target[key]);

    metadata.parameterHandlers.unshift(async (ctx) => {
      if (!(name in ctx.params)) {
        throw new Error('존재하지 않는 파라미터 이름입니다: ' + name);
      }

      return ctx.params[name];
    });
  }
}

/**
 * queryParam 파라미터 어노테이션
 */
function queryParam(name: string): any {
  return function (target: any, key: string, index: number): void {
    let metadata = getRouteMetadata(target[key]);

    metadata.parameterHandlers.unshift(async (ctx) => {
      return ctx.query[name];
    });
  }
}

/**
 * paginated 파라미터 어노테이션
 */
function paginated(target: any, key: string, index: number): void {
  let metadata = getRouteMetadata(target[key]);

  metadata.parameterHandlers.unshift(async (ctx) => {
    ctx.pagination = new Pagination(ctx);
    return ctx.pagination;
  });

  metadata.afterMethodHandlers.unshift(async (ctx) => {
    ctx.pagination.setHeader();
  });
}

/**
 * authorize 메소드 어노테이션
 */
function authorize(chainCallback: (e: any) => AuthorizationBuilder): any {
  return function (target: any, key: string, descriptor: PropertyDescriptor): void {
    let metadata = getRouteMetadata(target[key]);

    metadata.beforeMethodHandlers.unshift(async (ctx) => {
      let authorization = ctx.container.get('authorization');
      await chainCallback(authorization.createBuilder(ctx).start());
    });
  };
}

/**
 * postAuthorize 메소드 어노테이션
 */
function postAuthorize(chainCallback: (e: any) => AuthorizationBuilder): any {
  return function (target: any, key: string, descriptor: PropertyDescriptor): void {
    let metadata = getRouteMetadata(target[key]);

    metadata.afterMethodHandlers.unshift(async (ctx) => {
      let authorization = ctx.container.get('authorization');
      await chainCallback(authorization.createBuilder(ctx).start());
    });
  };
}

const MethodModelActionMappings = { POST: Model.Action.Create, PUT: Model.Action.Update, DELETE: Model.Action.Delete, GET: Model.Action.Get };

function validateOrThrowError(value: any, option: ValidatorSchema) {
  let v = new Validator();

  if (!v.validate(value, option)) {
    let error = new BadRequestError();

    for (let e of v.errors) {
      error.addField(e.field, e.message);
    }

    throw error;
  }
}

/**
 * validate 파라미터 어노테이션
 */
function validate(model: Model | ValidatorSchema): any {
  return function (target: any, key: string, index: number): void {
    let metadata = getRouteMetadata(target[key]);

    metadata.parameterHandlers.unshift(async (ctx) => {
      let data = ctx.request.body;
      let method = ctx.method.toUpperCase();

      if (!ctx.is('json')) {
        throw new CommonError(415, `지원하지 않는 데이터 타입(${ctx.get('Content-Type')})입니다.`);
      }

      let action = MethodModelActionMappings[method];

      if (!action) {
        throw new Error(`VALIDATE: 지원되지 않는 HTTP 메소드${method}입니다.`);
      }

      if (Model.hasMetadata(model)) {
        let modelMetadata = Model.getMetadata(model);
        let schema = Model.getSchemaOn(action, modelMetadata);

        validateOrThrowError(data, schema);
      } else {
        validateOrThrowError(data, model as ValidatorSchema);
      }

      return data;
    });
  };
}

/**
 * jsonBody 파라미터 어노테이션
 */
function jsonBody(target: any, key: string, index: number): void {
  let metadata = getRouteMetadata(target[key]);

  metadata.parameterHandlers.unshift(async (ctx) => {
    let data = ctx.request.body;

    if (!ctx.is('json')) {
      throw new CommonError(415, `지원하지 않는 데이터 타입(${ctx.get('Content-Type')})입니다.`);
    }

    return data;
  });
}

/**
 * formData 파라미터 어노테이션
 */
function formData(dataName: string): any {
  return function (target: any, key: string, index: number): void {
    let metadata = getRouteMetadata(target[key]);

    metadata.parameterHandlers.unshift(async (ctx) => {
      let form = ctx.request.body;
      let data = (form.fields && form.fields[dataName]) || (form.files && form.files[dataName]) || null;

      return data;
    });
  };
}

class ControllerMiddleware extends Middleware {
  priority = 20;
  router: Router;
  log: Logger;

  constructor(router: Router, log: Logger) {
    super();

    this.router = router;
    this.log = log;
  }

  async run(ctx, next) {
    let r  = this.router.find(ctx.method, ctx.path);

    if (r) {
      let { metadata, controllerClass } = r.value;
      let controller = new controllerClass(ctx.container);

      ctx.params = r.params;
      ctx.controller = controller;

      this.log.debug({ req: ctx.request, path: ctx.path, controllerMethod: metadata.methodName }, 'Web request');

      for (let handler of metadata.beforeMethodHandlers) {
        await handler.call(controller, ctx);
      }

      // gather controller method parameters
      let args = await Promise.all(metadata.parameterHandlers.map(handler => handler.call(controller, ctx)));

      // call controller method
      let result = await controller[metadata.methodName].apply(controller, args);

      if (result) {
        ctx.body = result;
      }

      // automatically set response status
      if (ctx.method.toUpperCase() === 'POST') {
        ctx.status = 201;

        // 반환값이 문자열인 경우 개체 주소인 것으로 간주함.
        // TODO 개체 주소로 간주할지 어떨지를 엔트리마다 설정할 수 있도록 해야함.
        if (typeof result === 'string') {
          ctx.set('Location', result);
        }
      } else if (!ctx.body) {
        ctx.status = 204;
      } else {
        // 기본 응답의 경우 캐시를 해제한다.
        ctx.set('Cache-Control', 'no-cache');
        ctx.set('Pragma', 'no-cache');
      }

      for (let handler of metadata.afterMethodHandlers) {
        await handler.call(controller, ctx);
      }

      await next();
    } else {
      throw new NoResourceError();
    }
  }
}

abstract class Controller implements Injectable {
  public container: Container;
  public prefix: string = '';

  constructor(container: Container) {
    this.container = container;
  }

  validate(value, option) {
    validateOrThrowError(value, option);
  }

  static getRouteMetadata(method: any) {
    return getRouteMetadata(method);
  }

  static registerRoutes(router) {
    for (let metadata of routeMetadataMap.values()) {
      let controllerClass = metadata.controllerClass;

      router.add(metadata.httpMethod, metadata.pattern, {
        metadata,
        controllerClass
      });
    }
  }
}

export default Controller;

export {
  ControllerMiddleware,
  route,
  pathParam,
  queryParam,
  paginated,
  authorize,
  postAuthorize,
  validate,
  jsonBody,
  formData
};
