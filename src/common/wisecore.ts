import process from 'process';

import Koa from 'koa';
import knex from 'knex';
import bunyan from 'bunyan';

import Logger from './logger';
import Router from './router';
import Model from './model';
import Package from './package';
import Controller, { ControllerMiddleware } from './controller';
import Middleware from './middleware';
import Transaction from './transaction';
import PackageScanner from './package-scanner';
import Container, { ContainerProviderMiddleware } from './container';
import Authorization from './authorization';
import FetchExpression from './fetch-expression';

import { ErrorHandlerMiddleware, NoResourceError } from './errors';
import CorsMiddleware from './cors-middleware';
import BodyParserMiddleware from './body-parser-middleware';
import { TaskManager } from './task';
import { NetworkTrafficSize } from './util';
import Configuration from './configuration';

class Wisecore {
  private static fetchExpression = new FetchExpression();
  private static contextExpressionCache = {};
  private koa: Koa;
  private intialized: boolean = false;

  public server: any;
  public test: any = null;
  public container: Container;
  public packages: Package[] = [];
  public controllers: Controller[] = [];
  public middlewares: Middleware[] = [];
  public db: knex;
  public authorization: Authorization;
  public router: Router;
  public log: Logger;
  public mode: string = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase().trim() : 'development';
  public config: Configuration;
  public scanner = new PackageScanner();

  constructor(defaultConfig: Configuration = {}) {
    this.koa = new Koa();
    this.container = new Container();
    this.authorization = new Authorization();
    this.router = new Router();
    this.config = defaultConfig;
    this.log = bunyan.createLogger({
      name: 'wisecore',
      level: this.config.logLevel || 'info'
    });

    this.scanner.excludes = this.config.excludes || [];
  }

  async setup() {
    if (this.intialized) {
      return;
    }

    this.intialized = true;

    console.log('\n--- WISECORE by Wisewize ---\n');

    this.container.set('config', () => () => this.config); 
    this.container.set('router', () => () => this.router); 
    this.container.set('server', () => () => this.koa); 
    this.container.set('log', () => () => this.log); 
    this.container.set('mode', () => () => this.mode); 
    this.container.set('authorization', () => () => this.authorization);

    // assign 'fetch' method to context.
    // 'fetch' here is not related to Fetch API.
    Object.defineProperty(this.koa.context, 'fetch', {
      get: function () {
        return Wisecore.fetchContextExpression.bind(this, this);
      }
    });

    console.log('setup network...');

    await this.setupNetwork();

    console.log('setup database...');

    await this.setupDatabase();

    console.log('register packages...');

    await this.scanner.scan(__dirname + '/..');
    this.packages = this.scanner.getPackages();

    await this.registerPackages(this.packages);

    console.log('create database...');

    await this.createDatabase();

    console.log('setup packages...');

    await this.setupPackages(this.packages);

    console.log('register routes...');

    Controller.registerRoutes(this.router);

    console.log('setup middlewares...');

    this.setupMiddlewares();

    console.log('\n--- ready ---\n');
  }

  listen(port) {
    this.server = this.koa.listen(port);
    return this.server;
  }

  async start(port = process.env.PORT || 3000) {
    await this.setup();

    const server = this.listen(port);

    // measure API traffics
    const serverTraffics = new Set<NetworkTrafficSize>();

    this.container.set('serverTraffics', () => () => serverTraffics);

    server.on('connection', socket => {
      socket.on('close', function () {
        for (let v of serverTraffics) {
          v.rx += this.bytesRead;
          v.tx += this.bytesWritten;
        }
      });
    });

    TaskManager.setup(this.container);

    return server;
  }

  async dropDatabase() {
    // prevent execution of this method on production
    if (this.mode === 'production') {
      return;
    }

    // reversed loop for index constraints
    for (let i = this.packages.length - 1; i >= 0; i--) {
      let p = this.packages[i];

      for (let schema of p.schemaInstances) {
        await schema.down(this.db);
      }
    }
  }

  async clearDatabase() {
    await this.dropDatabase();
    await this.createDatabase();
  }

  async createDatabase() {
    for (let p of this.packages) {
      for (let schema of p.schemaInstances) {
        await schema.up(this.db);
      }
    }
  }

  private async setupNetwork() {
    // set "representative" IP Address
    this.container.set('ipAddress', container => {
      const ctx = container.get('context');

      if (this.config.network && this.config.network.proxy) {
        if (this.config.network.reversedXff) {
          return () => ctx.request.ips[0];
        } else {
          return () => ctx.request.ip;
        }
      } else {
        return () => ctx.request.ip;
      }
    });

    // network proxy setting
    if (this.config.network && this.config.network.proxy) {
      this.koa.proxy = true;
    }
  }

  private async setupDatabase() {
    this.db = knex({
      client: this.config.database.engine,
      connection: this.config.database.connection,
      debug: this.mode === 'development',
      useNullAsDefault: true
    });

    this.container.set('transaction', () => {
      let transaction = new Transaction(this.db, this.log);

      return () => transaction;
    });

    this.container.set('db', container => {
      let transaction = container.get('transaction');

      return () => transaction.workingDb;
    });
  }

  private setupMiddlewares() {
    this.middlewares.push(new ContainerProviderMiddleware(this.container));
    this.middlewares.push(new ErrorHandlerMiddleware(this.log));
    this.middlewares.push(new CorsMiddleware());
    this.middlewares.push(new BodyParserMiddleware());
    this.middlewares.push(new ControllerMiddleware(this.router, this.log));

    this.middlewares = Middleware.sort(this.middlewares);
    
    for (let m of this.middlewares) {
      this.koa.use(m.run.bind(m));
    }
  }

  private async setupPackages(packages: Package[]) {
    for (let p of packages) {
      await p.setup(this);
    }
  }

  private async registerPackages(packages: Package[]) {
    for (let p of packages) {
      await this.registerModules(p);
      p.registered = true;

      console.log(` - package registered: ${p.alias}`);
    }
  }

  private async registerModules(p) {
    let serviceModules = p.modules.filter(m => m.baseModuleName === 'Service');
    let repositoryModules = p.modules.filter(m => m.baseModuleName === 'Repository');
    let controllerModules = p.modules.filter(m => m.baseModuleName === 'Controller');
    let middlewareModules = p.modules.filter(m => m.baseModuleName === 'Middleware');
    let schemaModules  = p.modules.filter(m => m.baseModuleName === 'Schema');

    await this.registerSchema(p, schemaModules);
    this.registerRepositories(repositoryModules);
    this.registerServices(serviceModules);
    this.registerControllers(controllerModules);
    this.registerMiddlewares(middlewareModules);
  }

  private registerDependencyModule(m: any) {
    let name = m.name;
    let instanceName = name[0].toLowerCase() + name.substring(1);

    this.container.set(instanceName, container => {
      let instance = new m(container);

      return () => instance;
    })
  }

  private async registerSchema(p, modules) {
    for (let m of modules) {
      let schema = new m();
      p.schemaInstances.push(schema);
    }
  }

  private registerControllers(modules) {
    for (let m of modules) {
      this.controllers[m.name] = m;
    }
  }

  private registerRepositories(modules) {
    for (let m of modules) {
      this.registerDependencyModule(m);
    }
  }

  private registerServices(modules) {
    for (let m of modules) {
      this.registerDependencyModule(m);
    }
  }

  private registerMiddlewares(modules) {
    for (let m of modules) {
      let middleware = new m();
      this.middlewares.push(middleware);
    }
  }

  private static async fetchContextValue(ctx, name, key, params) {
    // Is a value from a database model?
    //   ex) File(params.fileId).ownerId
    // In above example, "File" is a table name and "params.fileId" is an argument for the table model
    // that is actually a shortened form of "id=params.fileId" so generated SQL query would be like this:
    //   select ownerId from File where id="params.fileId"
    // And params.fileId will be fetched from URL parameters if the endpoint is given with path
    // variables as "/files/:fileId".
    if (params) {
      if (!key) {
        throw new Error(`Wisecore.fetchContextValue: Invalid expression: ${name}`);
      }

      const metadata = Model.getMetadataByName(name);

      if (!metadata) {
        throw new Error(`Wisecore.fetchContextValue: Unknown model name: ${name}`);
      }

      if (!ctx._contextValueCache) {
        ctx._contextValueCache = {};
      }

      let cacheKey = metadata.tableName;

      for (const key in params) {
        cacheKey += '.' + key + '(' + params[key] + ')';
      }

      let entity = ctx._contextValueCache[cacheKey];

      if (!entity) {
        entity = await ctx.container.get('db')
          .first()
          .from(metadata.tableName)
          .where(params);

        ctx._contextValueCache[cacheKey] = entity;
      }

      if (!entity) {
        throw new NoResourceError();
      }

      return entity[key];
    }

    switch (name) {
      // Is a value from URL parameters?
      case 'params': {
        const value = Number(ctx.params[key]);

        if (Number.isNaN(value)) {
          return ctx.params[key];
        } else {
          return value;
        }
      }
      // Is a value from querystring?
      case 'query': {
        const value = Number(ctx.query[key]);

        if (Number.isNaN(value)) {
          return ctx.query[key];
        } else {
          return value;
        }
      }
      // Is a value from response body?
      case 'returnValue': {
        const result = ctx.body;

        if (Array.isArray(result)) {
          return result.map(entry => entry.id);
        } else {
          return result.id;
        }
      }
      default: {
        const num = Number(name);

        // Is a just number?
        if (!Number.isNaN(num)) {
          return num;
        }

        throw new Error(`Wisecore.fetchContextValue: Invalid argument: ${name}`);
      }
    }
  }

  /**
   * Parse a string and fetch a value from it.
   * 
   * ex)
   *  - URL parameter: params.id
   *  - Querystring: query.limit
   *  - DB Table: User(1).username
   *  - Reponse body: returnValue
   *  - Number: 17
   * @param ctx Koa context
   * @param expression
   */
  static async fetchContextExpression(ctx: any, expression: string) {
    // Cache parsing results by string expressions.
    let instructions = Wisecore.contextExpressionCache[expression];

    if (!instructions) {
      const root = Wisecore.fetchExpression.parse(expression);
      instructions = Wisecore.fetchExpression.getInstructionStack(root);
      Wisecore.contextExpressionCache[expression] = instructions;
    }

    return await Wisecore.fetchExpression.evaluate(instructions, Wisecore.fetchContextValue.bind(null, ctx));
  }
}

export default Wisecore;
