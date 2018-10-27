import { ForbiddenError } from './errors';
import { Injectable } from './container';

const defaultAuthorizationHandlers = {
  isNull: async function (ctx, contextValue) {
    let v = contextValue ? (await ctx.fetch(contextValue)) : null;

    if (v) {
      throw new ForbiddenError();
    }
  },
  isNotNull: async function (ctx, contextValue) {
    let v = contextValue ? (await ctx.fetch(contextValue)) : null;

    if (!v) {
      throw new ForbiddenError();
    }
  }
};

enum AuthorizationOperation {
  And = 0,
  Or = 1
}

interface AuthorizationCommand {
  handler: any;
  args: any[];
  operation: AuthorizationOperation;
}

class AuthorizationBuilder {
  private context: any;
  private handlers: Map<string, any>;
  private commands: AuthorizationCommand[] = [];
  private proxy: any;

  constructor(ctx, handlers) {
    this.context = ctx;
    this.handlers = handlers;
    this.proxy = new Proxy(this, {
      get: (target, key: string) => (...args) => {
        this.add(key, args);
        return this;
      }
    });
  }

  get and() {
    let cmd = this.commands[this.commands.length - 1];
    cmd.operation = AuthorizationOperation.And;
    return this.proxy;
  }

  get or() {
    let cmd = this.commands[this.commands.length - 1];
    cmd.operation = AuthorizationOperation.Or;
    return this.proxy;
  }

  add(handlerName: string, args: any[]) {
    let handler = this.handlers.get(handlerName);

    if (!handler) {
      throw new Error(`AuthorizationBuilder.add: 해당 권한 처리기(${handlerName})가 등록되어 있지 않습니다.`);
    }

    this.commands.push({
      handler, 
      args,
      operation: null
    });
  }

  start() {
    return this.proxy;
  }

  build() {
    return this.commands;
  }

  then(resolve: () => any, reject: (reason: any) => any): Promise<void> {
    return this.execute().then(resolve, reject);
  }

  async execute(ctx: any = this.context, commands: AuthorizationCommand[] = this.commands) {
    let pass = false;

    for (let cmd of commands) {
      if (pass) {
        if (cmd.operation !== AuthorizationOperation.Or) {
          pass = false;
        }
        
        continue;
      }

      if (cmd.operation === AuthorizationOperation.Or) {
        try {
          await cmd.handler(ctx, ...cmd.args);
          pass = true;
        } catch (e) {
          if (!(e instanceof ForbiddenError)) {
            throw e;
          }
        }
      } else {
        await cmd.handler(ctx, ...cmd.args);
      }
    }
  }
}

class Authorization {
  private handlers: Map<string, any> = new Map();

  constructor() {
    let handlerNames = Object.keys(defaultAuthorizationHandlers);

    for (let handlerName of handlerNames) {
      this.handlers.set(handlerName, defaultAuthorizationHandlers[handlerName]);
    }
  }

  addHandler(name, handler: any) {
    this.handlers.set(name, handler);
  }

  createBuilder(ctx) {
    let builder = new AuthorizationBuilder(ctx, this.handlers);
    return builder;
  }

  chain(dep: Injectable) {
    let ctx = dep.container.get('context');
    let builder = this.createBuilder(ctx);
    return builder.start();
  }
}

export default Authorization;

export {
  AuthorizationBuilder
};
