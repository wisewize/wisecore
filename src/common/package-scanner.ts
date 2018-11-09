import fs from 'fs';
import { normalize } from 'path';
import Package, { UnknownPackage } from './package';

class PackageScanner {
  public packages: Package[] = [];
  public excludes: string[] = [];
  private unknownPackage = new UnknownPackage();

  getPackages() {
    const sorted = this.sortPackagesByDependencyOrder(this.packages);

    if (this.unknownPackage.modules.length > 0) {
      return [...sorted, this.unknownPackage];
    }

    return sorted;
  }

  async scan(rootDir, currentPackage: Package = this.unknownPackage) {
    // don't allow scan common directory
    if (normalize(rootDir).indexOf(__dirname) >= 0) {
      return;
    }

    const files = fs.readdirSync(rootDir).filter(filename => filename.indexOf('test.') < 0 && filename.indexOf('.d.ts') < 0);
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

              const nextPackage = new m();

              // set alias to its parent directory name if null
              if (!nextPackage.alias) {
                nextPackage.alias = rootDir.split('/').pop();
              }

              nextPackage.dir = rootDir;

              // don't include if in excludes
              if (this.excludes.indexOf(nextPackage.alias) < 0) {
                currentPackage = nextPackage;
                this.packages.push(currentPackage);
              }
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
    const marks = new Set<string>();
    const stack: Package[] = [];
    let loop = 0;

    // check dependency existence
    for (const p of packages) {
      for (const dependencyAlias of p.dependencies) {
        if (!packages.some(q => q.alias === dependencyAlias)) {
          throw new Error('Package dependency not found: ' + dependencyAlias);
        }
      }
    }

    // check dependency loop
    while (packages.length !== marks.size) {
      for (const p of packages) {
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
