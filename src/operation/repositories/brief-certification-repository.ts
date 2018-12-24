import uuidv1 from 'uuid/v1';
import Repository from '../../common/repository';

class BriefCertificationRepository extends Repository {
  async create(data) {
    const code = uuidv1();

    await this.db.insert({
      code,
      payload: data.payload ? JSON.stringify(data.payload) : null,
      expireAt: data.expireAt,
      createdAt: this.db.fn.now(),
      completedAt: null,
    }).into('BriefCertification');

    return code;
  }

  async getOne(code) {
    const entry = await this.db.from('BriefCertification').where('code', code).first();

    return {
      code,
      payload: entry.payload ? JSON.parse(entry.payload) : null,
      expireAt: entry.expireAt,
      createdAt: entry.createdAt,
      completedAt: entry.completedAt
    };
  }

  async complete(code) {
    await this.db
      .from('BriefCertification')
      .where('code', code)
      .update({
        completedAt: this.db.fn.now()
      });
  }
}

export default BriefCertificationRepository;