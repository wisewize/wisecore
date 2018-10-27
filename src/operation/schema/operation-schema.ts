import Schema from '../../common/schema';

class OperationSchema extends Schema {
  async up(db) {
    if (!await db.schema.hasTable('Config')) {
      await db.schema.createTable('Config', t => {
        t.increments();
        t.string('key', 100).notNullable().unique();
        t.text('value').notNullable();
      });
    }

    if (!await db.schema.hasTable('NetworkTraffic')) {
      await db.schema.createTable('NetworkTraffic', t => {
        t.increments();
        t.integer('rx').notNullable();
        t.integer('tx').notNullable();
        t.integer('srx').notNullable();
        t.integer('stx').notNullable();
        t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
      });
    }

    if (!await db.schema.hasTable('SystemLog')) {
      await db.schema.createTable('SystemLog', t => {
        t.increments();
        t.string('name', 20).notNullable();
        t.string('hostname', 30).notNullable();
        t.integer('pid').notNullable();
        t.integer('level').notNullable();
        t.string('message', 100).notNullable();
        t.text('data').notNullable();
        t.timestamp('time').notNullable();
      });
    }

    if (!await db.schema.hasTable('Notification')) {
      await db.schema.createTable('Notification', t => {
        t.increments();
        t.enu('type', ['INFO', 'WARNING', 'ERROR', 'FATAL']).notNullable();
        t.string('message', 255).notNullable();
        t.string('target', 50).notNullable();
        t.timestamp('readAt').nullable();
        t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
      });
    }

    if (!await db.schema.hasTable('Calendar')) {
      await db.schema.createTable('Calendar', t => {
        t.date('date').notNullable().primary();
        t.integer('year').notNullable();
        t.integer('month').notNullable();
        t.integer('week').notNullable();
        t.integer('day').notNullable();
        t.integer('dayOfWeek').notNullable();
        t.timestamp('startAt').nullable();
        t.timestamp('endAt').nullable();
      });

      await this.fillCalendar(db);
    }
  }

  async down(db) {
    await db.schema.dropTableIfExists('Notification');
    await db.schema.dropTableIfExists('SystemLog');
    await db.schema.dropTableIfExists('NetworkTraffic');
    await db.schema.dropTableIfExists('Config');
    await db.schema.dropTableIfExists('Calendar');
  }

  async fillCalendar(db) {
    let endDate = new Date('2037-12-31'); // 2038년 문제가 일어나기 전까지의 달력을 채움
    let date = new Date('2018-01-01');
    let week = 1;
    let rows = [];

    while (date < endDate) {
      let t = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
      let d = t.toISOString();
      let nextDate = new Date(date.getTime() + 60 * 60 * 24 * 1000);
      let data = {
        date: d.split('T')[0],
        year: t.getFullYear(),
        month: t.getMonth() + 1,
        week,
        day: t.getDate(),
        dayOfWeek: t.getDay(),
        startAt: date.toISOString().slice(0, 19).replace('T', ' '),
        endAt: nextDate.toISOString().slice(0, 19).replace('T', ' ')
      };

      rows.push(data);

      date.setDate(date.getDate() + 1);

      if (date.getMonth() === 11 && date.getDate() === 31) {
        week = 1;
      } else if (date.getDay() === 0) {
        week++;
      }
    }

    await db.batchInsert('Calendar', rows, 100);
  }
}

export default OperationSchema;
