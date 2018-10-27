
interface Logger {
  info(arg1: any, ...rest: any[]): void;
  debug(arg1: any, ...rest: any[]): void;
  error(arg1: any, ...rest: any[]): void;
  warn(arg1: any, ...rest: any[]): void;
}

export default Logger;
