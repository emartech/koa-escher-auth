'use strict';

let getMiddleware = require('../').authenticator;
let expect = require('chai').expect;
let sinon = require('sinon');
let KeyPool = require('escher-keypool');
let Escher = require('escher-auth');

describe('Koa Escher Request Authenticator Middleware', function() {
  let next;
  let escherConfig;
  let escherStub;
  let loggerStub;


  let callMiddleware = function(context) {
    return getMiddleware(escherConfig, loggerStub).call(context, next);
  };


  let createContext = function(dataPromise) {
    return {
      escherData: dataPromise,
      throw: sinon.stub(),
      request: {}
    };
  };


  let createContextWithEmptyBody = function() {
    return createContext(Promise.resolve(''));
  };


  beforeEach(function() {
    escherConfig = {
      credentialScope: 'testScope',
      keyPool: JSON.stringify([{ 'keyId': 'suite_cuda_v1', 'secret': 'testSecret', 'acceptOnly': 0 }])
    };

    next = function* () {};

    escherStub = {
      authenticate: this.sandbox.stub()
    };

    loggerStub = {
      error: sinon.stub()
    };

    this.sandbox.stub(Escher, 'create').returns(escherStub);
  });


  it('should throw HTTP 401 if context is invalid', function*() {
    let context = createContext();

    yield callMiddleware(context);

    expect(context.throw).to.have.been.calledWith(401, sinon.match.any);
  });


  it('should throw HTTP 401 in case of problem during request capture', function*() {
    let error = new Error('Request capture error');
    let rejectedData = Promise.reject(error);
    let context = createContext(rejectedData);

    yield callMiddleware(context);

    expect(context.throw).to.have.been.calledWith(401, 'Request capture error');
    expect(loggerStub.error).to.have.been.calledWith('authentication_request_error', 'Request capture error', error);
  });


  it('should throw HTTP 401 in case of authentication problem', function*() {
    let error = new Error('Test escher error');
    let resolvedData = Promise.resolve('test body');
    let context = createContext(resolvedData);
    escherStub.authenticate.throws(error);

    yield callMiddleware(context);

    expect(context.throw).to.have.been.calledWith(401, 'Test escher error');
    expect(loggerStub.error).to.have.been.calledWith('authentication_request_error', 'Test escher error', error);
  });


  it('should yield the "next" if there were no problem on authentication', function*() {
    let resolvedData = Promise.resolve('test body');
    let context = createContext(resolvedData);

    let nextCalled = false;

    next = function*() {
      nextCalled = true;
    };

    yield callMiddleware(context);

    expect(escherStub.authenticate).to.have.been.called;
    expect(nextCalled).to.eql(true);
  });


  it('should supply the request data to escher without modification', function*() {
    let context = createContext(Promise.resolve('  test body  '));

    yield callMiddleware(context);

    let expectedRequest = Object.create(context.request);
    expectedRequest.body = '  test body  ';

    expect(escherStub.authenticate).to.have.been.calledWithExactly(expectedRequest, sinon.match.any);
  });


  it('should use the proper keys using keypool from configuration', function* () {
    this.sandbox.stub(KeyPool, 'create').returns({
      getKeyDb: this.sandbox.stub().returns('testKey')
    });

    let context = createContextWithEmptyBody();

    yield callMiddleware(context);

    expect(KeyPool.create).to.have.been.calledWith(escherConfig.keyPool);
    expect(escherStub.authenticate).to.have.been.calledWithExactly(sinon.match.any, 'testKey');
  });


  describe('Escher library', function() {

    it('should be initialized with the proper Escher config', function* () {
      let fullConfig = {
        algoPrefix: 'EMS',
        vendorKey: 'EMS',
        authHeaderName: 'X-EMS-Auth',
        dateHeaderName: 'X-EMS-Date',
        credentialScope: 'testScope'
      };

      yield callMiddleware(createContextWithEmptyBody());

      expect(Escher.create).to.have.been.calledWith(fullConfig);
    });

  });


});
