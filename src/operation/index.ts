import Package from '../common/package';
import LogBuffer from './log-buffer';

class OperationPackage extends Package {
  async setup(app) {
    let logBuffer = new LogBuffer();

    app.log.addStream({
      stream: logBuffer,
      level: 'info',
      type: 'raw'
    });

    app.container.set('logBuffer', () => () => logBuffer);
  }
}

export default OperationPackage;
