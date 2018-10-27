import { inject } from '../../common/container';
import Service from '../../common/service';
import { NoResourceError, ConflictError } from '../../common/errors';
import AuthorityRepository from '../repositories/authority-repository';

class AuthorityService extends Service {
  @inject()
  authorityRepository: AuthorityRepository;

  async getAuthority(authorityId) {
    let authority = await this.authorityRepository.getOne(authorityId);

    if (!authority) {
      throw new NoResourceError();
    }

    return authority;
  }

  async getAuthorities(pagination) {
    return await this.authorityRepository.getCollection(pagination);
  }

  async createAuthority(data) {
    let insertId = await this.authorityRepository.create(data);

    return insertId;
  }

  async updateAuthority(authorityId, data) {
    if (authorityId <= 2) {
      throw new ConflictError('시스템에 내장된 권한이므로 수정할 수 없습니다.');
    }

    await this.authorityRepository.update(authorityId, data);
  }

  async deleteAuthority(authorityId) {
    if (authorityId <= 2) {
      throw new ConflictError('시스템에 내장된 권한이므로 삭제할 수 없습니다.');
    }

    await this.authorityRepository.del(authorityId);
  }
}

export default AuthorityService;
