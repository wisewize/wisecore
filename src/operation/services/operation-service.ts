import os from 'os';
import process from 'process';

import Service from '../../common/service';
import { NoResourceError, ConflictError } from '../../common/errors';
import { inject } from '../../common/container';
import { getDiskUsage } from '../../common/util';
import { TaskManager } from '../../common/task';
import ConfigService from './config-service';
import TaskInfo from '../models/task-info';
import OperationRepository from '../repositories/operation-repository';

class OperationService extends Service {
  @inject() operationRepository: OperationRepository;
  @inject() configService: ConfigService;
  @inject() mode: string;

  async getDatabaseInfo() {
    let databaseConfig = await this.configService.get('database');
    let size = await this.operationRepository.getDatabaseSize();

    return {
      engine: databaseConfig.engine,
      storage: {
        used: size,
        total: databaseConfig.storageSize
      },
      comment: '',
      status: 'RUNNING'
    };
  }

  async getSystemInfo() {
    let platform = os.platform();
    let cpus = os.cpus();
    let ram = os.totalmem();
    let diskUsage = await getDiskUsage();

    return {
      system: {
        cpu: cpus[0].model,
        core: cpus.length
      },
      server: {
        name: 'Node.js',
        version: process.version,
        platform,
        memoryUsage: process.memoryUsage().rss
      },
      memory: {
        used: ram - os.freemem(),
        total: ram
      },
      disk: diskUsage
    }
  }

  getTask(taskId) {
    let task = TaskManager.tasks.find(task => task.id === taskId);

    if (!task) {
      throw new NoResourceError();
    }

    return new TaskInfo(task);
  }

  getAllTasks() {
    return TaskManager.tasks.map(task => new TaskInfo(task));
  }

  startTask(taskId) {
    let task = TaskManager.tasks.find(task => task.id === taskId);

    if (!task) {
      throw new NoResourceError();
    }

    if (!TaskManager.startTask(task)) {
      throw new ConflictError('진행중이거나 완료된 작업은 시작할 수 없습니다.');
    }
  }

  stopTask(taskId) {
    let task = TaskManager.tasks.find(task => task.id === taskId);

    if (!task) {
      throw new NoResourceError();
    }

    if (!TaskManager.stopTask(task)) {
      throw new ConflictError('진행중인 작업만 중지할 수 있습니다.');
    }
  }
}

export default OperationService;
