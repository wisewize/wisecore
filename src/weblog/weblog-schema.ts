import Schema from '../common/schema';

class WeblogSchema extends Schema {
  async up(db) {
    if (!await db.schema.hasTable('WebVisitorBrowser')) {
      await db.schema.createTable('WebVisitorBrowser', t => {
        t.increments();
        t.string('name', 50).notNullable().unique();
      });
    }

    if (!await db.schema.hasTable('WebVisitorDevice')) {
      await db.schema.createTable('WebVisitorDevice', t => {
        t.increments();
        t.string('name', 50).notNullable().unique();
      });
    }

    if (!await db.schema.hasTable('WebVisitorOs')) {
      await db.schema.createTable('WebVisitorOs', t => {
        t.increments();
        t.string('name', 50).notNullable().unique();
      });
    }

    if (!await db.schema.hasTable('WebVisitor')) {
      await db.schema.createTable('WebVisitor', t => {
        t.increments();
        t.string('hash', 32).notNullable();
        t.string('ipAddress', 46).notNullable();
        t.integer('browserId')
          .unsigned()
          .notNullable()
          .references('WebVisitorBrowser.id')
          .onDelete('NO ACTION')
          .onUpdate('NO ACTION');
        t.integer('osId')
          .unsigned()
          .notNullable()
          .references('WebVisitorOs.id')
          .onDelete('NO ACTION')
          .onUpdate('NO ACTION');
        t.integer('deviceId')
          .unsigned()
          .notNullable()
          .references('WebVisitorDevice.id')
          .onDelete('NO ACTION')
          .onUpdate('NO ACTION');
        t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
      });
    }

    if (!await db.schema.hasTable('WebVisitorTrack')) {
      await db.schema.createTable('WebVisitorTrack', t => {
        t.increments();
        t.integer('visitorId')
          .unsigned()
          .notNullable()
          .references('WebVisitor.id')
          .onDelete('NO ACTION')
          .onUpdate('NO ACTION');
        t.integer('userId')
          .unsigned()
          .nullable()
          .references('User.id')
          .onDelete('SET NULL')
          .onUpdate('CASCADE');
        t.string('referer', 255).notNullable();
        t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
      });
    }
  }

  async down(db) {
    await db.schema.dropTableIfExists('WebVisitorBrowser');
    await db.schema.dropTableIfExists('WebVisitorDevice');
    await db.schema.dropTableIfExists('WebVisitorOs');
    await db.schema.dropTableIfExists('WebVisitor');
    await db.schema.dropTableIfExists('WebVisitorTrack');
  }
}

export default WeblogSchema;
