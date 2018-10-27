import { inject } from '../../common/container';
import Service from '../../common/service';
import { scheduled } from '../../common/task';
import { NoResourceError } from '../../common/errors';
import SystemLogRepository from '../repositories/system-log-repository';
import LogBuffer from '../log-buffer';

class SystemLogService extends Service {
  @inject() private systemLogRepository: SystemLogRepository;
  @inject() logBuffer: LogBuffer;

  async getSystemLog(id) {
    let log = await this.systemLogRepository.getOne(id);

    if (!log) {
      throw new NoResourceError();
    }

    return log;
  }

  async getSystemLogs(level, pagination) {
    let result = await this.systemLogRepository.getCollectionByLevel(level, pagination);

    return result;
  }

  async getDayStats() {
    return await this.systemLogRepository.getDayStats();
  }

  @scheduled({ time: '*/1 * * * *' })
  async saveSystemLogs() {
    let logs = this.logBuffer.flush();

    if (logs.length === 0) {
      return;
    }

    for (let log of logs) {
      log.data = JSON.stringify(log.data);
    }

    await this.systemLogRepository.insert(logs);

    this.log.debug({ count: logs.length }, 'system logs have been saved into SystemLog table');
  }
}

export default SystemLogService;
