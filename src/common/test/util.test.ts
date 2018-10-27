import * as assert from 'assert';
import * as util from '../util';

describe('util', function () {
  it('lispCaseToPascalCase', function () {
    assert.equal(util.lispCaseToPascalCase('user'), 'User');
    assert.equal(util.lispCaseToPascalCase('user-profile'), 'UserProfile');
    assert.equal(util.lispCaseToPascalCase('my-super-hero'), 'MySuperHero');
  });

  it('snakeCaseToCamelCase', function () {
    assert.equal(util.snakeCaseToCamelCase('user'), 'user');
    assert.equal(util.snakeCaseToCamelCase('user_profile'), 'userProfile');
    assert.equal(util.snakeCaseToCamelCase('my_super_hero'), 'mySuperHero');
  });

  it('camelCaseToLispCase', function () {
    assert.equal(util.camelCaseToLispCase('User'), 'user');
    assert.equal(util.camelCaseToLispCase('UserProfile'), 'user-profile');
    assert.equal(util.camelCaseToLispCase('MySuperHero'), 'my-super-hero');
  });

  it('memoize', function () {
    let count = 0;
    let sum3 = function (a, b, c) {
      count++;
      return a + b + c;
    };
    let memoized = util.memoize(sum3);

    assert.equal(sum3(1, 2, 3), 6);
    assert.equal(memoized(3, 4, 5), sum3(3, 4, 5));
    assert.equal(count, 3);

    for (let i = 0; i < 10; i++) {
      memoized(1, 2, 3);
    }

    assert.equal(count, 4);
  });
});
