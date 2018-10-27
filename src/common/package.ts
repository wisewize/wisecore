import Schema from './schema';

abstract class Package {
  public alias: string = '';
  public dir: string = null;
  public dependencies: string[] = [];
  public modules: any[] = [];
  public schemaInstances: Schema[] = [];
  public registered: boolean = false;

  constructor() {
  }

  async setup(app: any) {
  }
}

class UnknownPackage extends Package {
  alias = 'unknown';
}

export default Package;

export {
  UnknownPackage
};
