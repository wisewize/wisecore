import Container, { Injectable } from './container';
import Pagination from './pagination';

abstract class Repository implements Injectable {
  public container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  get db() {
    return this.container.get('db');
  }

  async exists(tableName: string, criteria: any) {
    let result = await this.db.count('* as count').from(tableName).where(criteria);

    return result[0].count > 0;
  }

  async collect(pagination: Pagination, columns: string[], tsColumns: string[], getQuery: (db: any) => any) {
    let r = await this.db.from(function () {
      let sq = this.select(columns);

      if (tsColumns && pagination.textSearch) {
        let ts = pagination.textSearch;

        sq.where(function () {
          for (let tsColumn of tsColumns) {
            this.orWhere(tsColumn, 'like', '%' + ts + '%');
          }
        });
      }

      getQuery(sq).as('t1');
    }).count('* as count');

    pagination.count = r[0].count;

    let q = getQuery(this.db)
      .select(...columns)
      .offset(pagination.offset)
      .limit(pagination.limit);

    if (tsColumns && pagination.textSearch) {
      let ts = pagination.textSearch;

      q.where(function () {
        for (let tsColumn of tsColumns) {
          this.orWhere(tsColumn, 'like', '%' + ts + '%');
        }
      });
    }

    if (pagination.sort.length > 0) {
      // A negative sign means descending order. 
      for (let field of pagination.sort) {
        if (field[0] === '-') {
          q = q.orderBy(field.substring(1), 'DESC');
        } else {
          q = q.orderBy(field, 'ASC');
        }
      }
    } else if (columns.indexOf('id') >= 0) {
      // collect itemes by recent order when nothing specified in pagination?
      // q.orderBy('id', 'DESC');
    }

    return q;
  }
}

export default Repository;
