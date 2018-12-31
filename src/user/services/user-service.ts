import fs from 'fs';
import sharp from 'sharp';
import fetch from 'node-fetch';

import { inject } from '../../common/container';
import { NoResourceError, UnauthorizedError, ConflictError } from '../../common/errors';
import Service from '../../common/service';
import Pagination from '../../common/pagination';
import { getRandomString } from '../../common/util';
import UserRepository from '../repositories/user-repository';

const avatarImage = 'iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAAEgBckRAAAABGdBTUEAALGPC/xhBQAABOtJREFUaAXtWUlIlVEU9jnhyyCoNGhwoZmKvadFtZLKcFmrhkUFQi1aFEHb1i5aVRBBGxdBtrBaFa0aIFo1mPoSNdKFVhANuKgcn6/vyLs/597/Dv+7vxWEPzzuuWf4zjn3njtpUVGUr7+/Pyf0EoLgzNbW1kSxEFhbbmWEsiIsCQlmYGAgKzQl57lcLugHhNAUrSRIJBK1QrAUFQ+TBJSgUIjchixUVBVZiimKm5BBZWVlBTdU4w4Z/MTHDRDiDd4PctDFLikmEpmWlpY05/0ZOghJwKMQ7mPOD1K/oqJiU2Nj4ycho1ZKenBw8JxQJuHMzMxHavknGSwuLl7jQqLh8QrnSQZcIGgU2DdBUysZQHiBC4lOp9NdnCcZYJyvciEAHvO+kaZJNE2kNKxDQ0Nr5+fnpZjVWgoMMBrvMaR1OrclJSU1qVRqkmRBDiZlUspmsxPU/h9fMEamdDAbvyBLmuTFxcUohXTGKDcJiJ+faiM46aC8BzHbrUTrvmDSdMKoPJTSeZPusjgA+CUvB2pR60AwByeg904nI55zkklpdHR0/fT09BeixYd1O461rF04QofaSEME8IvciGgstFr8SlW+2jdmgKXdC4CjqoGpj/Onur6+XsqSdEMOsA13o/ROmYBcfHXepCFC1F1xwMm5aZt0BbYi/3MjEKoi1dXIyMjG2dnZSZSsVBBYaA+w0A6p+mrf6gAlm6LdUjVi/WmU5SrWD5FSVKrUAU7qSbq+qHa8b3Rg2+M5AIIIXXe43OhgYWGhkyv60kYHmNQ1vqDczugA+/w4V/SljQ4wtr2+oNzO6MB2SnEA3Y2Ty40OSImOQ66so9UbqqpjdYD7zm3blVZ95Kjg1LeuZGGAc2IMVVUr+tQmk8mqhoaGr5yno60ZMIMORi+RUcBJ0ekAkZfiFypZnFyXVae6vnWIAELvwDM6wzwvW1ZWVt3c3PzdpKN1gDGvRtSfTUYqH4VwB9V0TOVTP+Qgk8ls8XlAwMkYnGxVnYTmwAecQJFxHV15rA4wNLbDRbUN9bG9nFKZUgaIIqUqFNqnu1WhNiv6KyNgGYHQMrboOkW459TguUlXkTb8Nud/ZPch/3uOjesmNq4JYi7HFzsBbA0dWL23EUxVgQF9wXF8HCfmowLtJHXvBLAbVAKpDzvLNgmxwA42YHpe78QmLP05MiqMtM1FNULQlPjruMGTvzwGYXkNplcCOO464bAhasIuPcIiTJeeTu6VAGp+nw4sDg+Ye33svRJA3Qb/g/BxqrMB5qKO7+J5JYApf+gCLlTui+m1cCg47EIZON1eaKA6fYz+W+xCXvckrxmgIMrLy/ejmSI65jeVx/KC8Z4B4Q3Phlugne9Doa+0PXjAnlR4BXVjJ0DecIVYjSvEE5C7I3p/iSvFAVwpfkTUN6otSwICHeviMNbFXdHXtaj3I6j3ezqZD897DeicIfh2HZ/zouhwfRcdewZwgqZxCHUjsF0uZ1yOmXiFy9xp/Lss1jPQKwEqFQRzHUFv4EH50kiGnvhnfUorcgL03MdIP0XQzv+h+CZCdkhmDDPTLv6R6cJyJjA8PLxubm7uBQKvdYEtpxyJjON82NPU1PTNhmtNAHt8G4CeIXirns1BHBl8w3VuL86K5yYcY2AIfgeM+kyGf5m/E0m80fk0bqPIvkdn8C94tlh+A8CUxLS2xaoAAAAAAElFTkSuQmCC'; 

class UserService extends Service {
  @inject() private userRepository: UserRepository;
  @inject() private config: any;

  async getUser(userId: number) {
    let user = await this.userRepository.getOne(userId);

    if (!user) {
      throw new NoResourceError();
    }

    return user;
  }

  async getUsers(pagination: Pagination) {
    return await this.userRepository.getCollection(pagination);
  }

  async createUser(data: any) {
    if (await this.userRepository.hasOne({ username: data.username })) {
      throw new ConflictError('이미 같은 아이디를 가진 회원이 존재합니다.', 'username');
    }

    let userId = await this.userRepository.create(data);

    return userId;
  }

  async updateUser(userId: number, data: any) {
    if (!await this.userRepository.hasOne(userId)) {
      throw new NoResourceError();
    }

    await this.userRepository.update(userId, data);
  }

  async deleteUser(userId: number) {
    if (!await this.userRepository.hasOne(userId)) {
      throw new NoResourceError();
    }

    await this.userRepository.del(userId);
  }

  async getUserAvatar(userId: number) {
    let avatar = await this.userRepository.getAvatar(userId);

    if (!avatar) {
      avatar = {
        type: 'image/png',
        data: new Buffer(avatarImage, 'base64')
      };
    }

    return avatar;
  }

  async setUserAvatar(userId: number, file: any) {
    const avatarSize = this.config.user ? this.config.user.avatarSize : { width: 64, height: 64 };
    const data = await sharp(file.path).resize(avatarSize.width, avatarSize.height).png().toBuffer();

    fs.unlinkSync(file.path);

    await this.userRepository.setAvatar(userId, 'image/png', data);
  }

  async setUserAvatarByUrl(userId: number, url: string) {
    const avatarSize = this.config.user ? this.config.user.avatarSize : { width: 64, height: 64 };
    const res = await fetch(url);
    const buffer = await res.buffer();
    const data = await sharp(buffer).resize(avatarSize.width, avatarSize.height).png().toBuffer();

    await this.userRepository.setAvatar(userId, 'image/png', data);
  }

  async createGuest(nickname: string, password: string) {
    let guestName = await this.getUniqueUsername('guest_');

    return await this.userRepository.create({
      username: guestName,
      nickname,
      password,
      guest: true
    });
  }

  async authenticate(username: string, password: string) {
    const result = await this.userRepository.verifyPassword(username, password);

    if (result === null) {
      throw new NoResourceError();
    }

    if (!result) {
      throw new UnauthorizedError();
    }

    const user = await this.userRepository.getOneByUsername(username);

    if (user.status !== 'ACTIVATED') {
      throw new UnauthorizedError();
    }

    const groups = await this.userRepository.getAllUserGroups(user.id);
    const authorities = await this.userRepository.getAllUserAuthorities(user.id);

    await this.userRepository.updateLoginTime(user.id);

    return {
      user,
      groups,
      authorities
    };
  }

  async getUniqueUsername(prefix = '') {
    while (true) {
      let code = prefix + getRandomString(8);

      if (!await this.userRepository.hasOne({ username: code })) {
        return code;
      }
    }
  }
}

export default UserService;
