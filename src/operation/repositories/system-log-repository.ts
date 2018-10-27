import ModelRepository from '../../common/model-repository';
import SystemLog from '../models/system-log';

class SystemLogRepository extends ModelRepository {
  constructor(container) {
    super(container, SystemLog);
  }

  async getCollectionByLevel(level: number, pagination) {
    let result = await this.collect(
      pagination,
      this.collectionColumns,
      null,
      db => {
        if (level) {
          return db.from(this.tableName).where(this.tableName + '.level', '>=', level);
        } else {
          return db.from(this.tableName);
        }
      }
    );

    return result.map(entry => this.createModel(entry));
  }

  async getDayStats() {
    let date = new Date();

    date.setHours(date.getHours() - 24);

    let infoCount = await this.db.from(this.tableName).count('* as count').where('level', 30).where('time', '>=', date);
    let warnCount = await this.db.from(this.tableName).count('* as count').where('level', 40).where('time', '>=', date);
    let errorCount = await this.db.from(this.tableName).count('* as count').where('level', 50).where('time', '>=', date);
    let fatalCount = await this.db.from(this.tableName).count('* as count').where('level', 60).where('time', '>=', date);

    return {
      infoCount: infoCount[0].count,
      warnCount: warnCount[0].count,
      errorCount: errorCount[0].count,
      fatalCount: fatalCount[0].count
    };
  }
}

export default SystemLogRepository;
