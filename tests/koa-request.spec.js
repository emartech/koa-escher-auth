'use strict';

const Escher = require('escher-auth');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const request = require('supertest');
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

    app = new Koa();
    app.use(bodyParser());
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

    app.use(function(ctx) {
      ctx.throw(400, 'Test application error');
    });

    request(server)
      .post('/')
      .send('{"foo": "bar"}')
      .expect(400, 'Test application error', done);
  });


  it('should run controller if request is a valid escher request', function(done) {
    escherStub.authenticate.returns('test_escher_keyid');

    app.use(function(ctx) {
      ctx.body = 'test message from controller';
    });

    request(server)
      .post('/')
      .send('{"foo": "bar"}')
      .expect(200, 'test message from controller', done);
  });

});
