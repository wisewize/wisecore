import Schema from '../../common/schema';

class AclSchema extends Schema {
  async up(db) {
    if (!await db.schema.hasTable('AclClass')) {
      await db.schema.createTable('AclClass', this.createAclClassTable);
    }

    if (!await db.schema.hasTable('AclEntry')) {
      await db.schema.createTable('AclEntry', this.createAclEntryTable);
    }
  }

  async down(db) {
    await db.schema.dropTableIfExists('AclEntry');
    await db.schema.dropTableIfExists('AclClass');
  }

  createAclClassTable(t) {
    t.increments();
    t.string('name', 100).notNullable().unique();
    t.string('description', 100).notNullable();
  }

  createAclEntryTable(t) {
    t.increments();
    t.integer('typeId')
      .unsigned()
      .notNullable()
      .references('AclClass.id')
      .onDelete('CASCADE')
      .onUpdate('NO ACTION');
    t.integer('objectId').unsigned().nullable();
    t.integer('sid').unsigned().notNullable();
    t.boolean('principal').notNullable();
    t.integer('mask').notNullable();
    t.boolean('granting').notNullable();
  }
}

export default AclSchema;
