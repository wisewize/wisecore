import ModelRepository from '../../common/model-repository';
import Authority from '../models/authority';

class AuthorityRepository extends ModelRepository {
  constructor(container) {
    super(container, Authority);
  }
}

export default AuthorityRepository;
