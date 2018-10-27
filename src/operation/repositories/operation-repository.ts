import * as fs from 'fs';

import Repository from '../../common/repository';
import { inject } from '../../common/container';

class OperationRepository extends Repository {
  @inject() config: any;

  async getDatabaseSize() {
    if (this.config.database.engine === 'sqlite3') {
      let stat = fs.statSync(this.config.database.connection.filename);
      return stat.size;
    }

    let result = await this.db.raw(`
      SELECT SUM(data_length + index_length) AS size
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ?
    `, [this.config.database.connection.database]);

    return result[0][0].size;
  }
}

export default OperationRepository;
