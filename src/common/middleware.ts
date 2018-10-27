
abstract class Middleware {
  public priority: number;
  public after: string;
  public before: string;

  constructor() {
    this.priority = 10;
  }

  async run(ctx, next) {
    await next();
  }

  static sort(middlewares: Middleware[]) {
    let sorted = middlewares.filter(m => !m.after && !m.before);

    sorted.sort((a, b) => a.priority - b.priority);

    for (let m of middlewares) {
      if (m.after) {
        let idx = sorted.findIndex(p => p.constructor.name === m.after);

        if (idx >= 0) {
          sorted.splice(idx + 1, 0, m);
        }
      }

      if (m.before) {
        let idx = sorted.findIndex(p => p.constructor.name === m.before);

        if (idx >= 0) {
          sorted.splice(idx, 0, m);
        }
      }
    }

    return sorted;
  }
}

export default Middleware;
