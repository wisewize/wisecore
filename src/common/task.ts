import { CronJob } from 'cron';
import Container from './container';

enum TaskStatus {
  Stopped = 'STOPPED',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Failed = 'FAILED'
}

type CronTime = string | Date;
type CronCallback = (container: Container) => void;

interface Task {
  id: number;
  name: string;
  cronTime: CronTime;
  immediateStart: boolean;
  repeat: number;
  count: number;
  status: TaskStatus;
  instance: any;
  callback: () => void;
  error: any;
  lastTaskAt: Date;
  createdAt: Date;
}

class TaskManager {
  container: Container;
  nextTaskId: number = 1;
  tasks: Task[] = [];

  setup(container) {
    this.container = container;

    for (let task of this.tasks) {
      this.startTask(task);
    }
  }

  addTask(name: string, cronTime: CronTime, immediateStart: boolean, repeat: number, callback: CronCallback) {
    let task: Task = {
      id: this.nextTaskId++,
      name,
      cronTime,
      immediateStart,
      repeat,
      count: 0,
      instance: null,
      callback: null,
      error: null,
      status: TaskStatus.Stopped,
      lastTaskAt: null,
      createdAt: new Date()
    };

    task.callback = () => {
      task.lastTaskAt = new Date();

      try {
        let container = new Container(this.container);

        callback(container);

        task.count++;

        if (task.repeat && task.count >= task.repeat) {
          task.status = TaskStatus.Completed;
          task.instance.stop();
          task.instance = null;
        }
      } catch (e) {
        task.error = e;
        task.status = TaskStatus.Failed;
        task.instance.stop();
      }
    };

    task.instance = new CronJob(cronTime, task.callback, null, false, 'Asia/Seoul');

    this.tasks.push(task);

    return task;
  }

  startTask(task: Task) {
    if (task.status === TaskStatus.InProgress || task.status === TaskStatus.Completed) {
      return false;
    }

    if (task.immediateStart) {
      task.callback();
    }

    if (task.instance) {
      task.status = TaskStatus.InProgress;
      task.instance.start();
    }

    return true;
  }

  stopTask(task: Task) {
    if (task.status !== TaskStatus.InProgress) {
      return false;
    }

    if (task.instance) {
      task.status = TaskStatus.Stopped;
      task.instance.stop();
    }

    return true;
  }
}

let globalTaskManager = new TaskManager();

interface ScheduleOption {
  time: CronTime,
  repeat?: number;
  start?: boolean;
  name?: string;
};

function scheduled(option: ScheduleOption) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    let targetName = target.name || target.constructor.name;
    let callback = target[key];

    globalTaskManager.addTask(
      targetName + '.' + (option.name || callback.name),
      option.time,
      option.start || false,
      option.repeat || 0,
      (container) => {
        // static method?
        if (target.name) {
          callback.call(null, container);
        } else {
          // 정적 메소드가 아니면 컨테이너에 등록된 개체라고 간주한다.
          let binder = container.get(targetName[0].toLowerCase() + targetName.substring(1));
          callback.call(binder);
        }
      }
    );
  }
}

export {
  Task,
  globalTaskManager as TaskManager,
  scheduled
};
