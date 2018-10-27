import * as assert from 'assert';
import Router from '../router';

describe('Router', function () {
  it('should check invalid patterns', function () {
    let router = new Router();

    assert.throws(function () {
      router.add('GET', 'invalid/url', 'invalid');
    });
  });

  it('should match urls correctly', function () {
    let router = new Router();

    router.add('GET', '/users/#userId/avatar', 'avatar');
    router.add('GET', '/users/:username', 'user');
    router.add('PUT', '/api/v1/posts', 'posts');
    router.add('GET', '/api/v1/posts/:postId/comments/:commentId', 'comment');

    assert.equal(router.find('GET', '/users'), null);
    assert.equal(router.find('GET', '/users/username/avatar'), null);
    assert.equal(router.find('POST', '/users/13/avatar'), null);
    assert.deepEqual(router.find('GET', '/users/test'), {
      value: 'user',
      params: {
        username: 'test' 
      }
    });
    assert.deepEqual(router.find('GET', '/users/13/avatar'), {
      value: 'avatar',
      params: {
        userId: 13
      }
    });
    assert.deepEqual(router.find('PUT', '/api/v1/posts'), {
      value: 'posts',
      params: {}
    });
    assert.deepEqual(router.find('GET', '/api/v1/posts/7/comments/13'), {
      value: 'comment',
      params: {
        postId: 7,
        commentId: 13
      }
    });
  });
});

