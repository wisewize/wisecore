import * as assert from 'assert';
import FetchExpression from '../fetch-expression';

describe('FetchExpression.parse', function () {
  it('should parse expressions', function () {
    const k = new FetchExpression();
    const node1 = k.parse('params.userId');
    const node2 = k.parse('User(params.userId)');
    const node3 = k.parse('User(ShopOrder(orderCode=params.orderCode).userId).nickname');

    assert.deepEqual(node1, {
      name: 'params',
      key: 'userId',
      params: null
    });

    assert.deepEqual(node2, {
      name: 'User',
      key: 'id',
      params: {
        id: {
          name: 'params',
          key: 'userId',
          params: null
        }
      }
    });

    assert.deepEqual(node3, {
      name: 'User',
      key: 'nickname',
      params: {
        id: {
          name: 'ShopOrder',
          key: 'userId',
          params: {
            orderCode: {
              name: 'params',
              key: 'orderCode',
              params: null
            }
          }
        }
      }
    });
  });

  it('should make instruction stack', function () {
    const k = new FetchExpression();
    const node1 = k.parse('params.userId');
    const node2 = k.parse('User(params.userId)');
    const node3 = k.parse('User(ShopOrder(orderCode=params.orderCode).userId).nickname');
    const inst1 = k.getInstructionStack(node1);
    const inst2 = k.getInstructionStack(node2);
    const inst3 = k.getInstructionStack(node3);

    assert.equal(inst1.length, 1);
    assert.equal(inst2.length, 2);
    assert.equal(inst3.length, 3);
  });
});
