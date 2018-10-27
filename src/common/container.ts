import Middleware from './middleware';

interface ModuleGetterBuilder {
  (container: Container): ModuleGetter;
}

interface ModuleGetter {
  (container: Container): any;
}

interface Injectable {
  container: Container;
}

/**
 * 부모 컨테이너가 주어진 경우, 부모 컨테이너의 모듈 빌더만 참조할 뿐 실제 모듈 참조는 자식 개체에 저장됨.
 * 따라서 모듈 정의를 부모로부터 이어받되, 완전히 독립적인 컨테이너가 생성된다. 
 */
class Container {
  private builders: { [key: string]: ModuleGetterBuilder };
  private getters: { [key: string]: ModuleGetter };
  private parent: Container;

  constructor(parent: Container = null) {
    this.builders = {};
    this.getters = {};
    this.parent = parent;
  }

  has(key: string) {
    if (this.builders[key]) {
      return true;
    }

    if (this.parent) {
      return this.parent.has(key);
    }

    return false;
  }

  get(key: string) {
    if (this.getters[key]) {
      return this.getters[key](this);
    }

    return this.resolve(key);
  }

  set(key: string, builder: ModuleGetterBuilder) {
    this.builders[key] = builder;
  }

  fork() {
    return new Container(this);
  }

  private resolve(key: string, container = this) {
    if (this.builders[key]) {
      let getter = this.builders[key](container);
      container.getters[key] = getter;
      return getter(container);
    }

    if (this.parent) {
      return this.parent.resolve(key, container);
    }

    throw new Error(`[${key}] 모듈이 등록되지 않았습니다.`);
  }
}

/**
 * inject 속성 어노테이션
 */
function inject(diName: string = null): any {
  return function (target: Injectable, key: string) {
    Object.defineProperty(target, key, {
      get: function () {
        return this.container.get(diName || key);
      }
    });
  };
}

/**
 * 컨테이너 프로바이더 미들웨어
 */
class ContainerProviderMiddleware extends Middleware {
  priority = 1;
  container: Container;

  constructor(container) {
    super();
    this.container = container;
  }

  async run(ctx, next) {
    ctx.container = this.container.fork();
    ctx.container.set('context', () => () => ctx);
    await next();
  }
}

export default Container;

export {
  Injectable,
  inject,
  ContainerProviderMiddleware
};
