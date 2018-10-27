import * as fs from 'fs';
import Package, { UnknownPackage } from './package';

class PackageScanner {
  private packages: Package[] = [];
  private unknownPackage = new UnknownPackage();

  getPackages() {
    const sorted = this.sortPackagesByDependencyOrder(this.packages);

    if (this.unknownPackage.modules.length > 0) {
      return [...sorted, this.unknownPackage];
    }

    return sorted;
  }

  async scan(rootDir, currentPackage: Package = this.unknownPackage) {
    const files = fs.readdirSync(rootDir).filter(filename => filename.indexOf('test.ts') < 0);
    let directories = [];
    let modules = [];

    for (let filename of files) {
      try {
        let stat = fs.statSync(rootDir + '/' + filename);
        let ext = filename.substring(filename.lastIndexOf('.'), filename.length);

        if (stat.isDirectory()) {
          directories.push(rootDir + '/' + filename);
        } else if (ext === '.js' || ext === '.ts') {
          const m = await this.readScriptModule(rootDir + '/' + filename);

          if (m) {
            if (m.baseModuleName === 'Package') {
              if (currentPackage !== this.unknownPackage) {
                throw new Error('Multiple nested packages are not allowed.');
              }

              currentPackage = new m();

              // set alias to its parent directory name if null
              if (!currentPackage.alias) {
                currentPackage.alias = rootDir.split('/').pop();
              }

              this.packages.push(currentPackage);
            } else {
              modules.push(m);
            }
          }
        }
      } catch (e) {
        if (e.code !== 'ENOENT' && e.code !== 'MODULE_NOT_FOUND') {
          console.error(e);
        }
      }
    }

    currentPackage.modules = currentPackage.modules.concat(modules);

    for (let dir of directories) {
      await this.scan(dir, currentPackage);
    }
  }

  static getBaseModuleName(m) {
    const moduleNames = ['Controller', 'Service', 'Repository', 'Middleware', 'Schema', 'Package'];
    let proto = Object.getPrototypeOf(m);

    if (!proto) {
      return null;
    }

    if (moduleNames.indexOf(proto.name) >= 0) {
      return proto.name;
    } else {
      return PackageScanner.getBaseModuleName(proto);
    }
  }

  private async readScriptModule(path: string) {
    const m = (await import(path)).default;

    if (!m) {
      return null;
    }

    const baseModuleName = PackageScanner.getBaseModuleName(m); 

    if (baseModuleName) {
      m.baseModuleName = baseModuleName;
      return m;
    }

    return null;
  }

  private sortPackagesByDependencyOrder(packages: Package[]) {
    let marks = new Set<string>();
    let stack: Package[] = [];
    let loop = 0;

    while (packages.length !== marks.size) {
      for (let p of packages) {
        if (!marks.has(p.alias) && p.dependencies.every(alias => marks.has(alias))) {
          stack.push(p);
          marks.add(p.alias);
        }
      }

      if (loop++ > 1000) {
        throw new Error('There are package dependency loops on ' + packages.map(p => p.alias).filter(alias => !marks.has(alias)).join(', ') + '.');
      }
    }

    return stack;
  }
}

export default PackageScanner;
