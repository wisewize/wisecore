import ModelRepository from '../../common/model-repository';
import User from '../models/user';
import SaltCrypt from '../salt-crypt';

class UserRepository extends ModelRepository {
  constructor(container) {
    super(container, User);
  }

  async getOneByUsername(username: string) {
    return await this.db
      .first(this.columns)
      .where('username', username)
      .from('User');
  }

  async create(data: any) {
    let crypt = new SaltCrypt(data.password);
    let userData = Object.assign({
      status: 'ACTIVATED'
    }, data, {
      salt: crypt.salt,
      password: crypt.hash
    });

    let userId = await super.create(userData);

    // USER 그룹은 항상 포함시킴.
    await this.db.insert({ userId, groupId: 2 }).into('GroupUser');

    return userId;
  }

  async update(userId: number, data: any) {
    let userData = data;

    if (data.password) {
      let crypt = new SaltCrypt(data.password);

      userData = Object.assign({}, data, {
        salt: crypt.salt,
        password: crypt.hash
      });
    }

    return await super.update(userId, userData);
  }

  async getAvatar(userId: number) {
    let avatar = await this.db
      .first('data', 'type')
      .where('id', userId)
      .from('UserAvatar');

    return avatar;
  }

  async setAvatar(userId: number, type: string, data: any) {
    let avatar = await this.db
      .first('id')
      .where('id', userId)
      .from('UserAvatar');

    if (!avatar) {
      await this.db.insert({ id: userId, data, type }).into('UserAvatar');
    } else {
      await this.db.update({ data, type }).where('id', userId).from('UserAvatar');
    }
  }

  async verifyPassword(username: string, password: string) {
    let user = await this.db
      .first('id', 'password', 'salt')
      .where('username', username)
      .from('User');

    if (user) {
      let result = SaltCrypt.verify(password, user.password, user.salt);

      return result;
    }

    return null;
  }

  async updateLoginTime(userId: number) {
    await this.db.from('User').where('id', userId).update('loginAt', this.db.fn.now());
  }

  async getAllUserGroups(userId: number) {
    let result = await this.db
      .select('Group.id', 'Group.name', 'Group.description')
      .from('Group')
      .innerJoin('GroupUser', 'GroupUser.groupId', 'Group.id')
      .where('GroupUser.userId', userId);

    return result;
  }

  async getAllUserAuthorities(userId: number) {
    let result = await this.db
      .select('Authority.id', 'Authority.name', 'Authority.description')
      .from('Authority')
      .innerJoin('GroupAuthority', 'Authority.id', 'GroupAuthority.authorityId')
      .innerJoin('GroupUser', 'GroupUser.groupId', 'GroupAuthority.groupId')
      .where('GroupUser.userId', userId);

    return result;
  }
}

export default UserRepository;
