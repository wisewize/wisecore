import Repository from '../../common/repository';
import { getRandomString } from '../../common/util';

class UserTransactionRepository extends Repository {
  async create(data) {
    let code = getRandomString(20);

    await this.db.insert({
      code,
      createdAt: this.db.fn.now(),
      completedAt: null,
      ...data
    }).into('UserTransaction');

    return code;
  }

  async getOne(code) {
    return await this.db.from('UserTransaction').where('code', code).first();
  }

  async complete(code) {
    await this.db
      .from('UserTransaction')
      .where('code', code)
      .update({
        completedAt: this.db.fn.now()
      });
  }
}

export default UserTransactionRepository;
