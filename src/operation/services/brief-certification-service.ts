import { inject } from '../../common/container';
import { NoResourceError, ConflictError } from '../../common/errors';
import Service from '../../common/service';
import BriefCertificationRepository from '../repositories/brief-certification-repository';
import BriefCertification from '../models/brief-certification';

class BriefCertificationService extends Service {
  @inject() private briefCertificationRepository: BriefCertificationRepository;

  async createBriefCertification(payload: any = null, expireSeconds = 60 * 30) {
    const expireDate = new Date();

    expireDate.setSeconds(expireDate.getSeconds() + expireSeconds);

    if (payload) {
      return await this.briefCertificationRepository.create({
        payload,
        expireAt: expireDate
      });
    } else {
      return await this.briefCertificationRepository.create({
        expireAt: expireDate
      });
    }
  }

  async getBriefCertification(code: string) {
    const cert: BriefCertification = await this.briefCertificationRepository.getOne(code);

    if (!cert) {
      throw new NoResourceError();
    }

    return cert;
  }

  async completeBriefCertification(t: BriefCertification) {
    const expireDate = new Date(t.expireAt);
    const now = new Date();

    if (expireDate < now) {
      throw new ConflictError('이미 기한이 지나 파기된 처리입니다.');
    }

    if (t.completedAt) {
      throw new ConflictError('이미 완료된 처리입니다.');
    }

    await this.briefCertificationRepository.complete(t.code);
  }
}

export default BriefCertificationService;
