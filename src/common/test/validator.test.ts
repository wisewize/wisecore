import * as assert from 'assert';
import Validator from '../validator';

describe('Validator.validate', function () {
  it('should validate key', function () {
    let v = new Validator();

    assert.ok(v.validate(13, { type: 'key' }));
    assert.ok(!v.validate('13', { type: 'key' }));
    assert.ok(!v.validate(-1, { type: 'key' }));
  });

  it('should validate string', function () {
    let v = new Validator();

    assert.ok(v.validate('string', { type: 'string' }));
    assert.ok(v.validate('string', {
      type: 'string', min: 3, max: 8
    }));
    assert.ok(!v.validate('string', {
      type: 'string', min: 3, max: 4
    }));
  });

  it('should validate boolean', function () {
    let v = new Validator();

    assert.ok(v.validate(true, { type: 'boolean' }));
    assert.ok(v.validate(false, { type: 'boolean' }));
    assert.ok(!v.validate('true', { type: 'boolean' }));
    assert.ok(!v.validate(undefined, { type: 'boolean' }));
  });

  it('should validate password', function () {
    let v = new Validator();

    assert.ok(v.validate('1234', { type: 'password' }));
    assert.ok(!v.validate('123', { type: 'password' }));
    assert.ok(!v.validate(1234, { type: 'password' }));
  });

  it('should validate email', function () {
    let v = new Validator();

    assert.ok(v.validate('test@test.com', { type: 'email' }));
    assert.ok(v.validate('test_1234@test-14.com', { type: 'email' }));
    assert.ok(!v.validate('t@est@test.com', { type: 'email' }));
  });

  it('should validate date', function () {
    let v = new Validator();

    assert.ok(v.validate('1999-12-31', { type: 'date' }));
    assert.ok(!v.validate('1999-12-32', { type: 'date' }));
    assert.ok(!v.validate('19991231', { type: 'date' }));
  });

  it('should validate object', function () {
    let v = new Validator();

    assert.ok(v.validate({
      id: 13,
      name: 'test',
      email: 'test@test.com'
    }, {
      id: { type: 'key' },
      name: { type: 'string' },
      email: { type: 'email' }
    }));

    assert.ok(!v.validate({
      name: 'test',
      email: 'test@test.com'
    }, {
      name: { type: 'string' },
    }), 'Unknown property should throw an error');
  });
});
