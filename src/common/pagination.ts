import { BaseContext } from 'koa';

class Pagination {
  private ctx: BaseContext;
  public offset: number;
  public limit: number;
  public page: number;
  public count: number;
  public sort: string[];
  public textSearch: string;

  constructor(ctx: BaseContext) {
    this.ctx = ctx;
    this.offset = Math.max(ctx.query.offset || 0, 0);
    this.limit = Math.min(Math.max(ctx.query.limit || 20, 1), 1000);
    this.sort = ctx.query.sort ? ctx.query.sort.split(',') : [];
    this.page = Math.ceil(this.offset / this.limit + 1);
    this.count = 0;
    this.textSearch = ctx.query.q;

    if (Number.isNaN(this.offset) || Number.isNaN(this.limit)) {
      throw new Error('Invalid paging information.');
    }
  }

  setHeader() {
    this.ctx.set('X-Pagination-Count', this.count.toString());
    this.ctx.set('X-Pagination-Page', this.page.toString());
    this.ctx.set('X-Pagination-Limit', this.limit.toString());
  }
}

export default Pagination;
