import Repository from '../../common/repository';
import Pagination from '../../common/pagination';
import Model from '../../common/model';

interface WebVisitorCreateModel {
  hash: string,
  ipAddress: string,
  browser: string,
  os: string,
  device: string
};

class WebVisitorRepository extends Repository {
  async getOne(id: number) {
    let result = await this.db
      .first(
        'WebVisitor.id',
        'WebVisitor.ipAddress',
        'WebVisitorBrowser.name as browser',
        'WebVisitorOs.name as os',
        'WebVisitorDevice.name as device',
        'WebVisitor.createdAt'
      )
      .from('WebVisitor')
      .innerJoin('WebVisitorBrowser', 'WebVisitorBrowser.id', 'WebVisitor.browserId')
      .innerJoin('WebVisitorOs', 'WebVisitorOs.id', 'WebVisitor.osId')
      .innerJoin('WebVisitorDevice', 'WebVisitorDevice.id', 'WebVisitor.deviceId')
      .where('WebVisitor.id', id);
    
    return result;
  }
  
  async getOneByHash(hash: string) {
    let result = await this.db
      .first(
        'WebVisitor.id',
        'WebVisitor.ipAddress',
        'WebVisitor.createdAt'
      )
      .from('WebVisitor')
      .where('WebVisitor.hash', hash);

    return result;
  }

  async getCollection(pagination: Pagination) {
    let countResult = await this.db.from('WebVisitor').count('* as count');

    pagination.count = countResult[0].count;

    let result = await this.db
      .select(
        'WebVisitor.id',
        'WebVisitor.ipAddress',
        'WebVisitorBrowser.name as browser',
        'WebVisitorOs.name as os',
        'WebVisitorDevice.name as device',
        'WebVisitor.createdAt'
      )
      .from('WebVisitor')
      .innerJoin('WebVisitorBrowser', 'WebVisitorBrowser.id', 'WebVisitor.browserId')
      .innerJoin('WebVisitorOs', 'WebVisitorOs.id', 'WebVisitor.osId')
      .innerJoin('WebVisitorDevice', 'WebVisitorDevice.id', 'WebVisitor.deviceId')
      .orderBy('WebVisitor.id', 'desc')
      .offset(pagination.offset)
      .limit(pagination.limit);

    return result.map(entry => Model.unflatten(entry));
  }

  async getBrowserId(name) {
    let browser = await this.db.first('id').from('WebVisitorBrowser').where('name', name);

    if (browser) {
      return browser.id;
    }

    let r = await this.db.insert({ name }).into('WebVisitorBrowser');

    return r[0];
  }

  async getOsId(name) {
    let os = await this.db.first('id').from('WebVisitorOs').where('name', name);

    if (os) {
      return os.id;
    }

    let r = await this.db.insert({ name }).into('WebVisitorOs');

    return r[0];
  }

  async getDeviceId(name) {
    let device = await this.db.first('id').from('WebVisitorDevice').where('name', name);

    if (device) {
      return device.id;
    }

    let r = await this.db.insert({ name }).into('WebVisitorDevice');

    return r[0];
  }

  async create(data: WebVisitorCreateModel) {
    let createData = {
      hash: data.hash,
      ipAddress: data.ipAddress,
      browserId: await this.getBrowserId(data.browser),
      osId: await this.getOsId(data.os),
      deviceId: await this.getDeviceId(data.device),
      createdAt: this.db.fn.now()
    };

    let result = await this.db.insert(createData).into('WebVisitor');
    return result[0];
  }
}

export default WebVisitorRepository;
