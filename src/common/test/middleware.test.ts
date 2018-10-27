import * as assert from 'assert';
import Middleware from '../middleware';

class FirstMiddleware extends Middleware {
  priority = 1;
}

class SecondMiddleware extends Middleware {
  priority = 2;
}

class ThirdMiddleware extends Middleware {
  priority = 3;
}

class LastMiddleware extends Middleware {
  priority = 100;
}

class AfterSecondMiddleware extends Middleware {
  after = 'SecondMiddleware';
} 

class AfterLastMiddleware extends Middleware {
  after = 'LastMiddleware';
} 

class BeforeLastMiddleware extends Middleware {
  before = 'LastMiddleware';
} 

describe('Middleware', function () {
  it('should sort by priority property', function () {
    let middlewares = [
      new SecondMiddleware(),
      new ThirdMiddleware(),
      new FirstMiddleware(),
      new LastMiddleware()
    ];

    let sorted = Middleware.sort(middlewares);

    assert.deepEqual(sorted.map(m => m.priority), [1, 2, 3, 100]);
  });

  it('should sort by after, before property', function () {
    let middlewares = [
      new SecondMiddleware(),
      new ThirdMiddleware(),
      new FirstMiddleware(),
      new LastMiddleware(),
      new AfterSecondMiddleware(),
      new AfterLastMiddleware(),
      new BeforeLastMiddleware()
    ];

    let sorted = Middleware.sort(middlewares);

    assert.deepEqual(sorted.map(m => m.constructor.name), [
      'FirstMiddleware',
      'SecondMiddleware',
      'AfterSecondMiddleware',
      'ThirdMiddleware',
      'BeforeLastMiddleware',
      'LastMiddleware',
      'AfterLastMiddleware'
    ]);
  });
});
 