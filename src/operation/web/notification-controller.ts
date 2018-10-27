import { inject } from '../../common/container';
import Controller, { route, pathParam, queryParam, paginated, authorize } from '../../common/controller';
import NotificationService from '../services/notification-service';

class NotificationController extends Controller {
  @inject() notificationService: NotificationService;

  @route('GET', '/notifications/:notificationId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getNotification(@pathParam('notificationId') notificationId) {
    return await this.notificationService.getNotification(notificationId);
  }

  @route('GET', '/notifications')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getNotificationCollection(@queryParam('read') read, @paginated pagination) {
    return await this.notificationService.getNotifications(
      read === 'true' ? true : (read === 'false' ? false : null),
      pagination
    );
  }
}

export default NotificationController;
