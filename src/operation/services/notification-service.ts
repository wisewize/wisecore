import { inject } from '../../common/container';
import Service from '../../common/service';
import { scheduled } from '../../common/task';
import { NoResourceError } from '../../common/errors';
import NotificationRepository from '../repositories/notification-repository';

class NotificationService extends Service {
  @inject() private notificationRepository: NotificationRepository;

  async getNotification(id) {
    let notification = await this.notificationRepository.getOne(id);

    if (!notification) {
      throw new NoResourceError();
    }

    await this.notificationRepository.setRead(id);

    return notification;
  }

  async getNotifications(read, pagination) {
    if (read === true || read === false) {
      let result = await this.notificationRepository.getCollectionByRead(read, pagination);

      return result;
    }

    let result = await this.notificationRepository.getCollection(pagination);

    return result;
  }

  async notify(type: string, target: string, message: string) {
    if (await this.notificationRepository.hasActiveIssue(type, target)) {
      return;
    }

    await this.notificationRepository.create({
      type,
      target,
      message
    });
  }

  @scheduled({
    time: '* * * * *',
    repeat: 1,
    name: 'showStartMessage'
  })
  async showStartMessage() {
    this.log.info('System has started');

    await this.notify(
      'INFO',
      'operation.start',
      '시스템이 시작되었습니다.'
    );
  }
}

export default NotificationService;
