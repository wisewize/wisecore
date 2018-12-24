import Model, { column } from '../../common/model';

class BriefCertification {
  @column({
    type: 'string',
    max: 60
  })
  code: string;

  @column({ type: 'json' })
  payload: any;

  @column({
    type: 'timestamp',
    excludedOn: Model.ModificationActions
  })
  completedAt: string;

  @column({ type: 'timestamp' })
  expireAt: string;

  @column({ type: 'timestamp' })
  createdAt: string;
}

export default BriefCertification;