import Model, { column } from '../../common/model';

class Storage {
  @column({ type: 'key' })
  id: number;

  @column({
    type: 'string',
    min: 2,
    max: 50,
    textSearch: true
  })
  name: string;

  @column({
    type: 'string',
    min: 0,
    max: 100
  })
  typeFilter: string;

  @column({
    type: 'integer',
    required: false
  })
  maxSize: number;

  @column({
    type: 'integer',
    required: false
  })
  maxWidth: number;

  @column({
    type: 'integer',
    required: false
  })
  maxHeight: number;

  @column({
    type: 'integer',
    required: false
  })
  thumbWidth: number;

  @column({
    type: 'integer',
    required: false
  })
  thumbHeight: number;

  @column({
    type: 'boolean',
    excludedOn: Model.ModificationActions
  })
  primary: boolean;

  @column({ type: 'timestamp' })
  createdAt: string;

  @column({ type: 'timestamp' })
  updatedAt: string;

  canUploadFile(file) {
    let regex = new RegExp(`^${this.typeFilter}$`);

    if (regex.test(file.type)) {
      return true;
    }

    return false;
  }

  isImageStorage() {
    return this.typeFilter.indexOf('image') >= 0;
  }
}

export default Storage;
