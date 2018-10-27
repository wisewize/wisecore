import { Injectable } from './container';
import Logger from './logger';
import Knex from 'knex';

/**
 * transactional 메소드 어노테이션
 */
function transactional(target: Injectable, key: string, descriptor: PropertyDescriptor) {
  let oldMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    let container = this.container;
    let transaction = container.get('transaction');

    await transaction.begin();

    let result = await oldMethod.apply(this, args);

    await transaction.end();

    return result;
  };

  return descriptor;
}

class Transaction {
  public count: number = 0;
  public tx: Knex.Transaction;
  private db: Knex;
  private log: Logger;

  constructor(db: Knex, logger: Logger) {
    this.log = logger;
    this.db = db;
    this.tx = null;
  }

  get workingDb() {
    if (this.tx) {
      return this.tx;
    }
    
    return this.db;
  }

  async begin() {
    if (this.count++ > 0) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        this.log.debug('transaction begins');
        this.tx = tx;
        resolve(tx);
      }).then(() => {
        this.log.debug('transaction succeeded');
      }).catch(e => {
        this.log.debug('transaction rejected');
      });
    });
  }

  async end() {
    if (this.count < 1) {
      throw new Error('트랜잭션의 시작과 끝이 맞지 않습니다.');
    }

    if (this.count-- > 1) {
      return;
    }

    let tx = this.tx;

    this.count = 0;
    this.tx = null;

    await tx.commit();
  }

  async rollback() {
    if (this.count < 1) {
      return;
    }

    let tx = this.tx;

    this.count = 0;
    this.tx = null;

    await tx.rollback();
  }
}

export default Transaction;

export {
  transactional
};
