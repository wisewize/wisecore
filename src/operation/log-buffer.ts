import EventEmitter from 'events';

class LogBuffer extends EventEmitter {
  static coreFields = ['name', 'hostname', 'level', 'v', 'time', 'pid', 'msg', 'src', 'req', 'res'];
  private logs = [];

  constructor() {
    super();
  }

  write(rec) {
    let log = {
      name: rec.name,
      hostname: rec.hostname,
      pid: rec.pid,
      message: rec.msg,
      level: rec.level,
      time: rec.time,
      data: {}
    };

    for (let key in rec) {
      if (LogBuffer.coreFields.indexOf(key) < 0) {
        log.data[key] = rec[key];
      }
    }

    this.logs.push(log);
  }

  flush() {
    let oldLogs = this.logs;
    this.logs = [];
    return oldLogs;
  }
}

export default LogBuffer;
