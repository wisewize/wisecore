import Schema from '../../common/schema';

class FileSchema extends Schema {
  async up(db) {
    if (!await db.schema.hasTable('Storage')) {
      await db.schema.createTable('Storage', t => {
        t.increments();
        t.string('name', 50).notNullable().unique();
        t.string('typeFilter', 50).notNullable();
        t.integer('maxSize').nullable();
        t.integer('maxWidth').nullable();
        t.integer('maxHeight').nullable();
        t.integer('thumbWidth').nullable();
        t.integer('thumbHeight').nullable();
        t.boolean('primary').notNullable().defaultTo(false);
        t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
        t.timestamp('updatedAt').nullable();
      });
    }

    if (!await db.schema.hasTable('File')) {
      await db.schema.createTable('File', t => {
        t.increments();
        t.integer('storageId')
          .unsigned()
          .notNullable()
          .references('Storage.id')
          .onDelete('NO ACTION')
          .onUpdate('NO ACTION');
        t.integer('ownerId')
          .unsigned()
          .notNullable()
          .references('User.id')
          .onDelete('NO ACTION')
          .onUpdate('NO ACTION');
        t.string('url', 255).notNullable();
        t.string('name', 100).notNullable();
        t.integer('size').notNullable();
        t.string('type', 50).notNullable();
        t.string('thumbUrl', 255).nullable();
        t.integer('refCount').notNullable().defaultTo(0);
        t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
      });
    }

    if (!await db.first().where('id', 1).from('Storage')) {
      await db.insert({
        id: 1,
        name: '기본 스토리지',
        typeFilter: '.*',
        maxSize: 1024 * 10000,
        maxWidth: 1024,
        maxHeight: 768,
        thumbWidth: 64,
        thumbHeight: 64
      }).into('Storage');
    }
  }

  async down(db) {
    await db.schema.dropTableIfExists('File');
    await db.schema.dropTableIfExists('Storage');
  }
}

export default FileSchema;
