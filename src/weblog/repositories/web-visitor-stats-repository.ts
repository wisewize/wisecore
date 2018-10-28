import Repository from '../../common/repository';
import Pagination from '../../common/pagination';
import Model from '../../common/model';
import WeblogSpanCount from '../models/weblog-span-count';

class WebVisitorStatsRepository extends Repository {
  async getVisitorCountCollection(span: string, pagination: Pagination) {
    let result = await this.collect(pagination,
      [
        'date',
        'year',
        'month',
        'day',
        this.db.raw(`count(WebVisitor.id) as count`)
      ],
      null,
      db => db
        .from('Calendar')
        .joinRaw(`left join ?? on ?? between ?? and ??`, ['WebVisitor', 'WebVisitor.createdAt', 'Calendar.startAt', 'Calendar.endAt'])
        .where('date', '<', this.db.fn.now())
        .groupBy('date')
    );

    return result.map(entry => Model.fromRawObject(entry, Model.getMetadata(WeblogSpanCount).schema));
  }

  async getPageViewCountCollection(span: string, pagination: Pagination) {
    switch (span.toLowerCase()) {
      case 'day':
      {
        let result = await this.collect(pagination,
          [
            'date',
            'year',
            'month',
            'day',
            this.db.raw(`count(WebVisitorTrack.id) as count`)
          ],
          null,
          db => db
            .from('Calendar')
            .joinRaw(`left join ?? on ?? between ?? and ??`, ['WebVisitorTrack', 'WebVisitorTrack.createdAt', 'Calendar.startAt', 'Calendar.endAt'])
            .where('date', '<', this.db.fn.now())
            .groupBy('date')
        );

        return result.map(entry => Model.fromRawObject(entry, Model.getMetadata(WeblogSpanCount).schema));
      }
      case 'week':
      {
        let result = await this.collect(pagination,
          [
            this.db.raw(`min(date) as date`),
            'year',
            'month',
            'week',
            this.db.raw(`count(WebVisitorTrack.id) as count`)
          ],
          null,
          db => db
            .from('Calendar')
            .joinRaw(`left join ?? on ?? between ?? and ??`, ['WebVisitorTrack', 'WebVisitorTrack.createdAt', 'Calendar.startAt', 'Calendar.endAt'])
            .where('date', '<', this.db.fn.now())
            .groupBy('year', 'month', 'week')
        );

        return result.map(entry => Model.fromRawObject(entry, Model.getMetadata(WeblogSpanCount).schema));
      }
      case 'month':
      {
        let result = await this.collect(pagination,
          [
            this.db.raw(`min(date) as date`),
            'year',
            'month',
            this.db.raw(`count(WebVisitorTrack.id) as count`)
          ],
          null,
          db => db
            .from('Calendar')
            .joinRaw(`left join ?? on ?? between ?? and ??`, ['WebVisitorTrack', 'WebVisitorTrack.createdAt', 'Calendar.startAt', 'Calendar.endAt'])
            .where('date', '<', this.db.fn.now())
            .groupBy('year', 'month')
        );

        return result.map(entry => Model.fromRawObject(entry, Model.getMetadata(WeblogSpanCount).schema));
      }
      default: throw new Error(`WebVisitorStatsRepository.getPageViewCountCollection: undefined span type(${span})`);
    }
  }
}

export default WebVisitorStatsRepository;
