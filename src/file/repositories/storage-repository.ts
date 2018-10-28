import ModelRepository from '../../common/model-repository';
import Storage from '../models/storage';

class StorageRepository extends ModelRepository {
  constructor(container) {
    super(container, Storage);
  }

  async getUsedSize(id: number = null) {
    let query = this.db.sum('size as used').from('File')

    if (id) {
      query.where('storageId', id);
    }

    let result = await query;

    if (result[0].used) {
      return result[0].used;
    }
    
    return 0;
  }
}

export default StorageRepository;
