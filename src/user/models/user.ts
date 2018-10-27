import Model, { column } from '../../common/model';

class User {
  @column({ type: 'key' })
  id: number;

  @column({
    type: 'string',
    min: 3,
    max: 50,
    pattern: /^[a-zA-Z0-9._-]*(?:@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)?$/,
    excludedOn: [Model.Action.Update],
    textSearch: true
  })
  username: string;

  @column({
    type: 'password',
    requiredOn: [Model.Action.Create],
    excludedOn: [Model.Action.Get]
  })
  password: string;

  @column({
    type: 'string',
    min: 2,
    max: 50,
    textSearch: true
  })
  nickname: string;

  @column({
    type: 'email',
    excludedOn: [Model.Action.Update]
  })
  email: string;

  @column({
    type: 'boolean',
    defaultTo: false,
    excludedOn: Model.ModificationActions
  })
  guest: boolean;

  @column({
    type: 'date',
    required: false
  })
  birthDate: string;

  @column({
    type: 'enum',
    value: ['SOLAR', 'LUNAR'],
    required: false
  })
  birthType: string;

  @column({
    type: 'enum',
    value: ['MALE', 'FEMALE'],
    required: false
  })
  gender: string;

  @column({
    type: 'string',
    max: 20,
    required: false
  })
  phone: string;

  @column({
    type: 'string',
    max: 100,
    required: false
  })
  address: string;

  @column({
    type: 'string',
    max: 100,
    required: false
  })
  addressDetail: string;

  @column({
    type: 'string',
    max: 10,
    required: false
  })
  postcode: string;

  @column({
    type: 'string',
    max: 20,
    required: false
  })
  mobile: string;

  @column({
    type: 'enum',
    value: ['INACTIVE', 'ACTIVATED', 'BANNED', 'DEREGISTERED'],
    defaultTo: 'INACTIVE',
    excludedOn: Model.ModificationActions
  })
  status: string;

  @column({
    type: 'timestamp',
    excludedOn: Model.ModificationActions
  })
  loginAt: string;

  @column({ type: 'timestamp' })
  createdAt: string;

  @column({ type: 'timestamp' })
  updatedAt: string;
}

export default User;
