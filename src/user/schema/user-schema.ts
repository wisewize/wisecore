import Schema from '../../common/schema';
import SaltCrypt from '../salt-crypt';

class UserSchema extends Schema {
  async up(db) {
    if (!await db.schema.hasTable('User')) {
      await db.schema.createTable('User', t => this.createUserTable(t, db));
    }

    if (!await db.schema.hasTable('UserAvatar')) {
      await db.schema.createTable('UserAvatar', t => this.createUserAvatarTable(t));
    }

    if (!await db.schema.hasTable('Group')) {
      await db.schema.createTable('Group', this.createGroupTable);
    }

    if (!await db.schema.hasTable('GroupUser')) {
      await db.schema.createTable('GroupUser', this.createGroupUserTable);
    }

    if (!await db.schema.hasTable('Authority')) {
      await db.schema.createTable('Authority', this.createAuthorityTable);
    }

    if (!await db.schema.hasTable('GroupAuthority')) {
      await db.schema.createTable('GroupAuthority', this.createGroupAuthorityTable);
    }

    if (!await db.first().where('id', 1).from('User')) {
      await this.createSystemUsers(db);
      await this.createAdminGroup(db);
      await this.createUserGroup(db);
    }
  }

  async down(db) {
    await db.schema.dropTableIfExists('GroupUser');
    await db.schema.dropTableIfExists('GroupAuthority');
    await db.schema.dropTableIfExists('Group');
    await db.schema.dropTableIfExists('Authority');
    await db.schema.dropTableIfExists('UserAvatar');
    await db.schema.dropTableIfExists('User');
  }

  async createSystemUsers(db) {
    let adminCrypt = new SaltCrypt('1234');

    await db.insert({
      username: 'admin',
      password: adminCrypt.hash,
      salt: adminCrypt.salt,
      nickname: '관리자',
      email: 'admin@wisewize.com',
      guest: false,
      status: 'ACTIVATED',
      createdAt: db.fn.now(),
      loginAt: db.fn.now()
    }).into('User');
  }

  async createAdminGroup(db) {
    await db.insert({
      id: 1,
      name: 'ADMIN',
      description: '관리자 권한'
    }).into('Authority');

    await db.insert({
      id: 1,
      name: 'ADMIN',
      description: '관리자 그룹'
    }).into('Group');

    await db.insert({
      groupId: 1,
      authorityId: 1
    }).into('GroupAuthority');

    await db.insert({
      groupId: 1,
      userId: 1
    }).into('GroupUser');
  }

  async createUserGroup(db) {
    await db.insert({
      id: 2,
      name: 'USER',
      description: '일반 사용자 권한'
    }).into('Authority');

    await db.insert({
      id: 2,
      name: 'USER',
      description: '일반 사용자 그룹'
    }).into('Group');

    await db.insert({
      groupId: 1,
      authorityId: 2
    }).into('GroupAuthority');

    await db.insert({
      groupId: 2,
      authorityId: 2
    }).into('GroupAuthority');
  }

  createUserTable(t, db) {
    t.increments();
    t.string('username', 50).notNullable().unique();
    t.string('password', 128).notNullable();
    t.string('salt', 32).notNullable();
    t.boolean('guest').notNullable().defaultTo(false);
    t.string('nickname', 50).notNullable();
    t.string('email', 200).nullable();
    t.date('birthDate').nullable();
    t.enu('birthType', ['SOLAR', 'LUNAR']).nullable();
    t.enu('gender', ['MALE', 'FEMALE']).nullable();
    t.string('address', 100).nullable();
    t.string('addressDetail', 100).nullable();
    t.string('postcode', 10).nullable();
    t.string('phone', 20).nullable();
    t.string('mobile', 20).nullable();
    t.enu('status', ['INACTIVE', 'ACTIVATED', 'BANNED', 'WITHDRAWN']).notNullable().defaultTo('ACTIVATED');
    t.timestamp('loginAt').nullable();
    t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
    t.timestamp('updatedAt').nullable();
  }

  createUserAvatarTable(t) {
    t.integer('id')
      .unsigned()
      .notNullable()
      .references('User.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    t.binary('data').notNullable();
    t.string('type', 50).notNullable();
  }

  createUserTransactionTable(t, db) {
    t.string('code', 36).notNullable().primary();
    t.enu('type', ['REGISTER', 'DEREGISTER', 'PASSWORD', 'USERUPDATE']).notNullable();
    t.integer('userId')
      .unsigned()
      .notNullable()
      .references('User.id')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    t.timestamp('completedAt').nullable();
    t.timestamp('expireAt').nullable();
    t.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
  }

  createGroupTable(t) {
    t.increments();
    t.string('name', 50).notNullable();
    t.string('description', 100).notNullable();
  }

  createGroupUserTable(t) {
    t.integer('groupId')
      .unsigned()
      .notNullable()
      .references('Group.id')
      .onDelete('NO ACTION')
      .onUpdate('NO ACTION');
    t.integer('userId')
      .unsigned()
      .notNullable()
      .references('User.id')
      .onDelete('NO ACTION')
      .onUpdate('NO ACTION');
    
    t.primary(['groupId', 'userId']);
  }

  createAuthorityTable(t) {
    t.increments();
    t.string('name', 50).notNullable().unique();
    t.string('description', 100).notNullable();
  }

  createGroupAuthorityTable(t) {
    t.integer('groupId')
      .unsigned()
      .notNullable()
      .references('Group.id')
      .onDelete('NO ACTION')
      .onUpdate('NO ACTION');
    t.integer('authorityId')
      .unsigned()
      .notNullable()
      .references('Authority.id')
      .onDelete('NO ACTION')
      .onUpdate('NO ACTION');

    t.primary(['groupId', 'authorityId']);
  }
}

export default UserSchema;
