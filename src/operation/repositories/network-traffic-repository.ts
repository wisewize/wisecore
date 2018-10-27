import ModelRepository from '../../common/model-repository';
import NetworkTraffic from '../models/network-traffic';

class NetworkTrafficRepository extends ModelRepository {
  constructor(container) {
    super(container, NetworkTraffic);
  }

  async getStatsBetween(fromDate: string, toDate: string) {
    let result = await this.db
      .select([
        this.db.raw(`date(createdAt) as date`),
        this.db.raw('sum(srx) as rx'),
        this.db.raw('sum(stx) as tx')
      ])
      .from(this.tableName)
      .where('createdAt', '>=', fromDate)
      .where('createdAt', '<=', toDate)
      .groupByRaw(`date`);

    return result.map(entry => {
      let t = new Date(entry.date.getTime() - entry.date.getTimezoneOffset() * 60 * 1000).toISOString();

      return {
        rx: entry.rx,
        tx: entry.tx,
        date: t.substring(0, 10)
      };
    });
  }
}

export default NetworkTrafficRepository;
