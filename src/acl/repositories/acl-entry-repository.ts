import ModelRepository from '../../common/model-repository';
import AclEntry from '../models/acl-entry';

class AclEntryRepository extends ModelRepository {
  constructor(container) {
    super(container, AclEntry);
  }
}

export default AclEntryRepository;
