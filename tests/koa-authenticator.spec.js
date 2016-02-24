'use strict';

var getMiddleware = require('../').authenticator;
var expect = require('chai').expect;
var sinon = require('sinon');
var KeyPool = require('escher-keypool');
var Escher = require('escher-auth');



describe('Koa Escher Request Authenticator Middleware', function() {
  var next;
  var escherConfig;
  var escherStub;


  var callMiddleware = function(context) {
    return getMiddleware(escherConfig).call(context, next);
  };


  var createContext = function(dataPromise) {
    return {
      escherData: dataPromise,
      throw: sinon.stub(),
      request: {}
    };
  };


  var createContextWithEmptyBody = function() {
    return createContext(Promise.resolve(''))
  };


  beforeEach(function() {
    escherConfig = {
      credentialScope: 'testScope',
      keyPool: JSON.stringify([{ 'keyId': 'suite_cuda_v1', 'secret': 'testSecret', 'acceptOnly': 0 }])
    };

    /*eslint-disable*/
    next = function* () {
    };
    /*eslint-enable*/

    escherStub = {
      authenticate: this.sandbox.stub()
    };

    this.sandbox.stub(Escher, 'create').returns(escherStub);
  });


  it('should throw HTTP 401 if context is invalid', function*() {
    var context = createContext();

    yield callMiddleware(context);

    expect(context.throw).to.have.been.calledWith(401, sinon.match.any);
  });


  it('should throw HTTP 401 in case of problem during request capture', function*() {
    var rejectedData = Promise.reject(new Error('Request capture error'));
    var context = createContext(rejectedData);

    yield callMiddleware(context);

    expect(context.throw).to.have.been.calledWith(401, 'Request capture error');
  });


  it('should throw HTTP 401 in case of authentication problem', function*() {
    var resolvedData = Promise.resolve('test body');
    var context = createContext(resolvedData);
    escherStub.authenticate.throws(new Error('Test escher error'));

    yield callMiddleware(context);

    expect(context.throw).to.have.been.calledWith(401, 'Test escher error');
  });


  it('should yield the "next" if there were no problem on authentication', function*() {
    var resolvedData = Promise.resolve('test body');
    var context = createContext(resolvedData);

    var nextCalled = false;

    /*eslint-disable*/
    next = function*() {
      nextCalled = true;
    };
    /*eslint-enable*/

    yield callMiddleware(context);

    expect(escherStub.authenticate).to.have.been.called;
    expect(nextCalled).to.eql(true);
  });


  it('should supply the request data to escher without modification', function*() {
    var context = createContext(Promise.resolve('  test body  '));

    yield callMiddleware(context);

    var expectedRequest = Object.create(context.request);
    expectedRequest.body = '  test body  ';

    expect(escherStub.authenticate).to.have.been.calledWithExactly(expectedRequest, sinon.match.any);
  });


  it('should use the proper keys using keypool from configuration', function* () {
    this.sandbox.stub(KeyPool, 'create').returns({
      getKeyDb: this.sandbox.stub().returns('testKey')
    });

    var context = createContextWithEmptyBody();

    yield callMiddleware(context);

    expect(KeyPool.create).to.have.been.calledWith(escherConfig.keyPool);
    expect(escherStub.authenticate).to.have.been.calledWithExactly(sinon.match.any, 'testKey');
  });


  describe('Escher library', function() {

    it('should be initialized with the proper Escher config', function* () {
      var fullConfig = {
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
