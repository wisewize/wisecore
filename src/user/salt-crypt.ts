import crypto from 'crypto';

class SaltCrypt {
  public salt: string;
  public hash: string;

  constructor(password: string) {
    this.salt = SaltCrypt.generateRandomString(32);
    this.hash = SaltCrypt.sha512(password, this.salt);
  }

  static generateRandomString(len: number) {
    return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
  }

  static sha512(password: string, salt: string) {
    return crypto.createHmac('sha512', salt)
      .update(password)
      .digest('hex');
  }

  static verify(password: string, hash: string, salt: string) {
    let result = SaltCrypt.sha512(password, salt);

    return hash === result;
  }
}

export default SaltCrypt;
