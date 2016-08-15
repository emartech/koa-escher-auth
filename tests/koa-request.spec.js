'use strict';

let Escher = require('escher-auth');
let koaApp = require('koa');
let request = require('supertest');
let getInterceptorMiddleware = require('../').interceptor;
let getAuthenticatorMiddleware = require('../').authenticator;

describe('Koa Escher Authentication Middleware suite', function() {
  let app;
  let escherStub;

  beforeEach(function() {
    escherStub = {
      authenticate: this.sandbox.stub()
    };

    this.sandbox.stub(Escher, 'create').returns(escherStub);

    app = koaApp();
    app.use(getInterceptorMiddleware());
    app.use(getAuthenticatorMiddleware({ credentialScope: 'testScope' }));
  });

  it('should return with HTTP 401 in case of authentication error', function(done) {
    escherStub.authenticate.throws(new Error('Test escher error'));

    request(app.listen())
      .post('/')
      .send('{"foo": "bar"}')
      .expect(401, 'Test escher error', done);
  });

  it('should return with the original error in case of application error', function(done) {
    escherStub.authenticate.returns('test_escher_keyid');

    /*eslint-disable*/
    app.use(function*() {
      this.throw('Test application error', 400);
    });
    /*eslint-enable*/

    request(app.listen())
      .post('/')
      .send('{"foo": "bar"}')
      .expect(400, 'Test application error', done);
  });

  it('should run controller if request is a valid escher request', function(done) {
    escherStub.authenticate.returns('test_escher_keyid');

    /*eslint-disable*/
    app.use(function*() {
      this.body = 'test message from controller';
    });
    /*eslint-enable*/

    request(app.listen())
      .post('/')
      .send('{"foo": "bar"}')
      .expect(200, 'test message from controller', done);
  });

});
