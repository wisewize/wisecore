import { inject } from '../../common/container';
import Controller, { route, pathParam, queryParam, paginated, authorize } from '../../common/controller';
import SystemLogService from '../services/system-log-service';

class SystemLogController extends Controller {
  @inject() systemLogService: SystemLogService;

  @route('GET', '/operation/system-logs/day-stats')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getSystemLogDayStats() {
    return await this.systemLogService.getDayStats();
  }

  @route('GET', '/operation/system-logs/:systemLogId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getSystemLog(@pathParam('systemLogId') systemLogId) {
    return await this.systemLogService.getSystemLog(systemLogId);
  }

  @route('GET', '/operation/system-logs')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getSystemLogCollection(@queryParam('level') level, @paginated pagination) {
    return await this.systemLogService.getSystemLogs(level, pagination);
  }
}

export default SystemLogController;
