import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { exec } from 'child_process';

export function getRandomString(len) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

export function getLocalDate(date = new Date()) {
  let t = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return t;
}

export function guardPrivateString(str, min = 1, guard = '***') {
  return str.toString().substring(0, min) + guard;
}

export function truncateString(str, limit, ellipsis = '…') {
  let t = str.toString();

  if (t.length > limit) {
    t = t.substring(0, Math.max(limit - ellipsis.length, 0)) + ellipsis;
  }

  return t;
}

export function stripTags(html: string) {
  let result = html.replace(/<[^>]+>|&\w+;/ig, '');
  return result || '';
}

export function lispCaseToPascalCase(str) {
  let words = str.split('-');
  let converted = '';

  for (let i = 0; i < words.length; i++) {
    let word = words[i];
    converted += word[0].toUpperCase() + word.substring(1);
  }

  return converted;
}

export function snakeCaseToCamelCase(str) {
  let words = str.split('_');
  let converted = words[0];

  for (let i = 1; i < words.length; i++) {
    let word = words[i];
    converted += word[0].toUpperCase() + word.substring(1);
  }

  return converted;
}

export function camelCaseToLispCase(str) {
  let regex = /[A-Z][a-z0-9]*/g;
  let result = null;
  let words = [];

  while (result = regex.exec(str)) {
    words.push(result[0].toLowerCase());
  }

  return words.join('-');
}

export function memoize(fn, binder = null) {
  let valueKey = Symbol('value');
  let cache = new Map<any, any>();

  return function (...args) {
    let node = cache;

    for (let arg of args) {
      if (!node.get(arg)) {
        node.set(arg, new Map<any, any>());
      }

      node = node.get(arg);
    }

    if (node.has(valueKey)) {
      return node.get(valueKey);
    }

    let value = fn.apply(binder || this, args);

    node.set(valueKey, value)

    return value;
  };
}

export function memoized(target: any, key: string, descriptor: PropertyDescriptor): any {
  descriptor.value = memoize(target[key]);

  return descriptor;
}

export function mkdirp(dir) {
  const sdir = path.resolve(dir);
  const sep = path.sep;
  const initDir = path.isAbsolute(sdir) ? sep : '';

  sdir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(parentDir, childDir);

    if (!fs.existsSync(curDir)) {
      fs.mkdirSync(curDir);
    }

    return curDir;
  }, initDir);
}

export async function getDiskUsage(diskName:string = null) {
  let platform = os.platform();

  if (platform === 'linux' || platform === 'darwin') {
    let disk = diskName || '/';

    return new Promise((resolve) => {
      exec('df -k', (err, stdout) => {
        if (err) {
          resolve(err);
          return;
        }

        let lines = stdout.split('\n');

        for (let line of lines) {
          let tokens = line.split(/\s+/);

          if (tokens[tokens.length - 1] === disk) {
            resolve({
              total: Number(tokens[1]) * 1024,
              used: Number(tokens[2]) * 1024
            });
            return;
          }
        }

        resolve({ used: 0, total: 0 });
      });
    });
  } else if (platform === 'win32') {
    let disk = diskName || 'c:';

    return new Promise((resolve) => {
      exec('wmic logicaldisk get caption,freespace,size', (err, stdout) => {
        if (err) {
          resolve(err);
          return;
        }

        let lines = stdout.split('\n');
        let headers = lines[0].split(/\s+/).map(s => s.toLowerCase());
        let captionIndex = headers.indexOf('caption');
        let freeSpaceIndex = headers.indexOf('freespace');
        let sizeIndex = headers.indexOf('size');

        for (let i = 1; i < lines.length; i++) {
          let line = lines[i];
          let tokens = line.split(/\s+/);

          if (tokens[captionIndex].toLowerCase() === disk.toLowerCase()) {
            let freeSpace = Number(tokens[freeSpaceIndex]);
            let size = Number(tokens[sizeIndex]);

            resolve({
              total: size,
              used: size - freeSpace
            });
            return;
          }
        }

        resolve({ used: 0, total: 0 });
      });
    });
  }

  return {
    used: 0,
    total: 0
  };
}

export interface NetworkTrafficSize {
  rx: number;
  tx: number;
}

export async function getNetworkTraffic(interfaceName = 'eth0'): Promise<NetworkTrafficSize> {
  let platform = os.platform();

  if (platform === 'linux') {
    return new Promise<NetworkTrafficSize>((resolve, reject) => {
      exec('ifconfig ' + interfaceName, (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }

        let rx = (/RX.+Bytes[^\d]*([0-9]+)/ig).exec(stdout);
        let tx = (/TX.+Bytes[^\d]*([0-9]+)/ig).exec(stdout);

        resolve({
          rx: Number(rx[1]),
          tx: Number(tx[1])
        });
      });
    });
  } else if (platform === 'win32') {
    return new Promise<NetworkTrafficSize>((resolve, reject) => {
      exec('netstat -e', (err, stdout) => {
        if (err) {
          reject(err);
          return;
        }
        
        let r = /[0-9]+/ig;
        let rx = r.exec(stdout);
        let tx = r.exec(stdout);

        resolve({
          rx: Number(rx[0]),
          tx: Number(tx[0])
        });
      });
    });
  }

  return {
    rx: 0,
    tx: 0
  };
}
