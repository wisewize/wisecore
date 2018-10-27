import ModelRepository from '../../common/model-repository';
import AclClass from '../models/acl-class';

class AclClassRepository extends ModelRepository {
  constructor(container) {
    super(container, AclClass);
  }
}

export default AclClassRepository;
