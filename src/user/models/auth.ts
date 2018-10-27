import { column } from '../../common/model';

class Auth {
  @column({
    type: 'string',
    required: true
  })
  username: string;

  @column({
    type: 'string',
    min: 4,
    required: true
  })
  password: string;
}

export default Auth;
