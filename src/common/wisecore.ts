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

import { ErrorHandlerMiddleware, NoResourceError } from './errors';
import CorsMiddleware from './cors-middleware';
import BodyParserMiddleware from './body-parser-middleware';
import { TaskManager } from './task';
import { NetworkTrafficSize } from './util';
import Configuration from './configuration';

class Wisecore {
  private koa: Koa;

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
  private intialized: boolean = false;

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
        return Wisecore.fetchContextValue.bind(this, this);
      }
    });

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

  private async setupDatabase() {
    this.db = knex({
      client: this.config.database.engine,
      connection: this.config.database.connection,
      debug: this.mode === 'development',
      useNullAsDefault: true
    });

    this.container.set('transaction', container => {
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

  /**
   * 문자열을 파싱하여 컨텍스트로부터 값을 추출한다.
   * 
   * 예)
   *  - URL 파라미터: params.id
   *  - 쿼리 파라미터: query.limit
   *  - DB 테이블: User(1).username
   *  - 응답 바디(컨트롤러 실행 후): returnValue
   *  - 단순 숫자: 17
   * @param ctx Koa 컨텍스트
   * @param key
   */
  static async fetchContextValue(ctx: any, key: any) {
    let num = Number(key);

    // 단순 숫자인지?
    if (!Number.isNaN(num)) {
      return num;
    }

    // 응답 바디인지?
    if (key === 'returnValue') {
      let result = ctx.body;

      if (Array.isArray(result)) {
        return result.map(entry => entry.id);
      } else {
        return result.id;
      }
    }

    // DB 모델에서 직접 가져와야 하는 데이터인지?
    // 예) File(params.fileId).ownerId
    // 위 예제의 경우 File은 조회할 테이블명, params.fileId는 targetContextValue로 재귀조회 대상이며
    // targetContextValue는 {targetColumn}={targetContextValue}로 나눠서 특정 컬럼에 대한 조회를 명시할 수 있다.
    // ownerId는 fetchColumn에 대입되며, 최종적으로 조회되는 컬럼을 의미한다. (생략할 경우 기본키를 조회)
    const fetchModelRegex = /(\w+)\((.+)\)\.?(\w*)/;
    let result = fetchModelRegex.exec(key);

    if (result) {
      let metadata = Model.getMetadataByName(result[1]);
      let fetchColumn = result[3] ? result[3] : metadata.pkColumns[0];

      if (!metadata) {
        throw new Error(`존재하지 않는 모델명(${result[1]})입니다.`);
      }

      // 등호를 이용하여 특정 컬럼에 대해 조회할 수 있다.
      // 예) name=params.pageName
      let targetResult = result[2].split('=');
      let targetContextValue = targetResult.length > 1 ? targetResult[1] : targetResult[0];
      let targetColumn = targetResult.length > 1 ? targetResult[0] : metadata.pkColumns[0];

      let columnValue = await Wisecore.fetchContextValue(ctx, targetContextValue);

      // 조회할 컬럼의 값이 null인 경우 모델의 값도 null로 간주하여 바로 반환한다. 
      if (columnValue === null) {
        return null;
      }
      
      let cacheKey = `${metadata.tableName}.${targetColumn}(${columnValue})`;
      let entity = null;

      if (!ctx._contextValueCache) {
        ctx._contextValueCache = {};
      }

      if (ctx._contextValueCache[cacheKey]) {
        entity = ctx._contextValueCache[cacheKey];
      } else {
        entity = await ctx.container.get('db')
          .first()
          .from(metadata.tableName)
          .where(targetColumn, columnValue);

        ctx._contextValueCache[cacheKey] = entity;
      }

      if (!entity) {
        throw new NoResourceError();
      }

      return entity[fetchColumn];
    }

    // URL 파라미터 값인지?
    if (key.indexOf('params.') === 0) {
      const paramName = key.substring(7);
      const value = Number(ctx.params[paramName]);

      if (Number.isNaN(value)) {
        return ctx.params[paramName];
      } else {
        return value;
      }
    }

    // URL 쿼리 값인지?
    if (key.indexOf('query.') === 0) {
      const queryName = key.substring(6);
      const value = Number(ctx.query[queryName]);

      if (Number.isNaN(value)) {
        return ctx.query[queryName];
      } else {
        return value;
      }
    }

    throw new Error(`잘못된 인수(${key})입니다.`);
  }
}

export default Wisecore;
