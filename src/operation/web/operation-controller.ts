import { inject } from '../../common/container';
import Controller, { route, queryParam, authorize, pathParam } from '../../common/controller';
import OperationService from '../services/operation-service';
import NetworkMonitorService from '../services/network-monitor-service';

class OperationController extends Controller {
  @inject() operationService: OperationService;
  @inject() networkMonitorService: NetworkMonitorService;

  @route('GET', '/operation/system-info')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getSystemInfo() {
    return await this.operationService.getSystemInfo();
  }

  @route('GET', '/operation/database-info')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getDatabaseInfo() {
    return await this.operationService.getDatabaseInfo();
  }

  @route('GET', '/operation/network-info')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getNetworkInfo() {
    return await this.networkMonitorService.getNetworkInfo();
  }

  @route('GET', '/operation/network-traffic-stats')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getNetworkTrafficStats(@queryParam('from') fromDate, @queryParam('to') toDate) {
    return await this.networkMonitorService.getNetworkTrafficStats(fromDate, toDate);
  }

  @route('GET', '/operation/tasks/:taskId')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getTask(@pathParam('taskId') taskId) {
    return await this.operationService.getTask(taskId);
  }

  @route('GET', '/operation/tasks')
  @authorize(e => e.hasAuthority('ADMIN'))
  async getAllTasks() {
    return await this.operationService.getAllTasks();
  }

  @route('POST', '/operation/tasks/:taskId/start')
  @authorize(e => e.hasAuthority('ADMIN'))
  async startTask(@pathParam('taskId') taskId) {
    await this.operationService.startTask(taskId);
  }

  @route('POST', '/operation/tasks/:taskId/stop')
  @authorize(e => e.hasAuthority('ADMIN'))
  async stopTask(@pathParam('taskId') taskId) {
    await this.operationService.stopTask(taskId);
  }
}

export default OperationController;
