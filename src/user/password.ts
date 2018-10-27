import crypto from 'crypto';
import { column } from '../common/model';

class Password {
  @column({
    type: 'string',
    required: false
  })
  password: string;

  static md5(password) {
    return crypto.createHash('md5').update(password).digest('hex');
  }

  static verify(password, hash) {
    return Password.md5(password) === hash;
  }
}

export default Password;
