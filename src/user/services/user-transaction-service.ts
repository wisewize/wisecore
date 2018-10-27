import { inject } from '../../common/container';
import { NoResourceError, ConflictError } from '../../common/errors';
import Service from '../../common/service';
import UserTransactionRepository from '../repositories/user-transaction-repository';
import UserTransaction from '../models/user-transaction';

class UserTransactionService extends Service {
  @inject() private userTransactionRepository: UserTransactionRepository;

  async createUserTransaction(type: string, userId: number, expireHours = 24) {
    let expireDate = new Date();

    expireDate.setHours(expireDate.getHours() + expireHours);

    let code = await this.userTransactionRepository.create({
      type,
      userId,
      expireAt: expireDate
    });

    return code;
  }

  async getUserTransaction(type: string, code: string) {
    let t = await this.userTransactionRepository.getOne(code);

    if (!t || t.type !== type)  {
      throw new NoResourceError();
    }

    return t;
  }

  async completeUserTransaction(t: UserTransaction) {
    let expireDate = new Date(t.expireAt);
    let now = new Date();

    if (expireDate < now) {
      throw new ConflictError('이미 기한이 지나 파기된 처리입니다.');
    }

    if (t.completedAt) {
      throw new ConflictError('이미 완료된 처리입니다.');
    }

    await this.userTransactionRepository.complete(t.code);
  }
}

export default UserTransactionService;
