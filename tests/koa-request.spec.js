'use strict';

const Escher = require('escher-auth');
const koaApp = require('koa');
const request = require('supertest');
const getInterceptorMiddleware = require('../index').interceptor;
const getAuthenticatorMiddleware = require('../index').authenticator;

describe('Koa Escher Authentication Middleware suite', function() {
  let app;
  let escherStub;
  let server;

  beforeEach(function() {
    escherStub = {
      authenticate: this.sandbox.stub()
    };

    this.sandbox.stub(Escher, 'create').returns(escherStub);

    app = koaApp();
    app.use(getInterceptorMiddleware());
    app.use(getAuthenticatorMiddleware({ credentialScope: 'testScope' }));
    server = app.listen();
  });

  afterEach(function() {
    server.close();
  });

  it('should return with HTTP 401 in case of authentication error', function(done) {
    escherStub.authenticate.throws(new Error('Test escher error'));

    request(server)
      .post('/')
      .send('{"foo": "bar"}')
      .expect(401, 'Test escher error', done);
  });

  it('should return with the original error in case of application error', function(done) {
    escherStub.authenticate.returns('test_escher_keyid');

    app.use(function*() {
      this.throw(400, 'Test application error');
    });

    request(server)
      .post('/')
      .send('{"foo": "bar"}')
      .expect(400, 'Test application error', done);
  });

  it('should run controller if request is a valid escher request', function(done) {
    escherStub.authenticate.returns('test_escher_keyid');

    app.use(function*() {
      this.body = 'test message from controller';
    });

    request(server)
      .post('/')
      .send('{"foo": "bar"}')
      .expect(200, 'test message from controller', done);
  });

});
