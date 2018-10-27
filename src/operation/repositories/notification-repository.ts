import ModelRepository from '../../common/model-repository';
import Notification from '../models/notification';

class NotificationRepository extends ModelRepository {
  constructor(container) {
    super(container, Notification);
  }

  async hasActiveIssue(type: string, target: string) {
    let result = await this.db
      .from(this.tableName)
      .where({ type, target })
      .whereNull('readAt')
      .count('* as count');

    return !!result[0].count;
  }

  async setRead(id: number) {
    let result = await this.getOne(id);

    if (!result.readAt) {
      await this.update(id, {
        readAt: this.db.fn.now()
      });
    }
  }

  async getCollectionByRead(read: boolean, pagination) {
    let result = await this.collect(
      pagination,
      this.collectionColumns,
      null,
      db => read ?
        db.from(this.tableName).whereNotNull('readAt') :
        db.from(this.tableName).whereNull('readAt')
    );

    return result.map(entry => this.createModel(entry));
  }
}

export default NotificationRepository;
