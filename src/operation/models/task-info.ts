import { Task } from '../../common/task';

class TaskInfo {
  id: number;
  name: string;
  cronTime: string;
  immediateStart: boolean;
  repeat: number;
  count: number;
  error: string;
  status: string;
  lastTaskAt: string;
  createdAt: string;

  constructor(task: Task) {
    this.id = task.id;
    this.name = task.name;
    this.cronTime = task.cronTime.toString();
    this.immediateStart = task.immediateStart;
    this.repeat = task.repeat;
    this.count = task.count;
    this.error = task.error ? task.error.message : null;
    this.status = task.status;
    this.lastTaskAt = task.lastTaskAt ? task.lastTaskAt.toISOString() : null;
    this.createdAt = task.createdAt.toISOString();
  }
}

export default TaskInfo;
