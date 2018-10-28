import Repository from '../../common/repository';
import Pagination from '../../common/pagination';
import Model from '../../common/model';

interface WebVisitorTrackCreateModel {
  userId?: number;
  visitorId: number;
  referer: string;
}

class WebVisitorTrackRepository extends Repository {
  async getOne(id: number) {
    let result = await this.db
      .first(
        'WebVisitorTrack.id',
        'WebVisitorTrack.createdAt',
        'WebVisitorTrack.referer',
        'WebVisitor.id as visitor.id',
        'WebVisitor.ipAddress as visitor.ipAddress',
        'WebVisitorBrowser.name as visitor.browser',
        'WebVisitorOs.name as visitor.os',
        'WebVisitorDevice.name as visitor.device',
        'WebVisitor.createdAt as visitor.createdAt',
        'User.id as user.id',
        'User.nickname as user.nickname',
        'User.email as user.email'
      )
      .from('WebVisitorTrack')
      .innerJoin('WebVisitor', 'WebVisitor.id', 'WebVisitorTrack.visitorId')
      .leftJoin('User', 'User.id', 'WebVisitorTrack.userId')
      .innerJoin('WebVisitorBrowser', 'WebVisitorBrowser.id', 'WebVisitor.browserId')
      .innerJoin('WebVisitorOs', 'WebVisitorOs.id', 'WebVisitor.osId')
      .innerJoin('WebVisitorDevice', 'WebVisitorDevice.id', 'WebVisitor.deviceId')
      .where('WebVisitorTrack.id', id);
    
    return result;
  }

  async getCollection(pagination: Pagination) {
    let countResult = await this.db.from('WebVisitorTrack').count('* as count');

    pagination.count = countResult[0].count;

    let result = await this.db
      .select(
        'WebVisitorTrack.id',
        'WebVisitorTrack.createdAt',
        'WebVisitorTrack.referer',
        'WebVisitor.id as visitor.id',
        'WebVisitor.ipAddress as visitor.ipAddress',
        'WebVisitorBrowser.name as visitor.browser',
        'WebVisitorOs.name as visitor.os',
        'WebVisitorDevice.name as visitor.device',
        'WebVisitor.createdAt as visitor.createdAt',
        'User.id as user.id',
        'User.nickname as user.nickname',
        'User.email as user.email'
      )
      .from('WebVisitorTrack')
      .innerJoin('WebVisitor', 'WebVisitor.id', 'WebVisitorTrack.visitorId')
      .leftJoin('User', 'User.id', 'WebVisitorTrack.userId')
      .innerJoin('WebVisitorBrowser', 'WebVisitorBrowser.id', 'WebVisitor.browserId')
      .innerJoin('WebVisitorOs', 'WebVisitorOs.id', 'WebVisitor.osId')
      .innerJoin('WebVisitorDevice', 'WebVisitorDevice.id', 'WebVisitor.deviceId')
      .orderBy('WebVisitorTrack.id', 'desc')
      .offset(pagination.offset)
      .limit(pagination.limit);

    return result.map(entry => Model.unflatten(entry));
  }

  async create(data: WebVisitorTrackCreateModel) {
    let createData = Object.assign({}, data, {
      createdAt: this.db.fn.now()
    });

    let result = await this.db.insert(createData).into('WebVisitorTrack');
    return result[0];
  }
}

export default WebVisitorTrackRepository;
