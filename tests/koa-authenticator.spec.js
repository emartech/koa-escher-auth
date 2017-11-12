'use strict';

const getMiddleware = require('../index').authenticator;
const expect = require('chai').expect;
const sinon = require('sinon');
const KeyPool = require('escher-keypool');
const Escher = require('escher-auth');
const AuthenticationError = require('../lib/error/authentication');

describe('Koa Escher Request Authenticator Middleware', function() {
  let next;
  let escherConfig;
  let escherStub;
  let loggerStub;

  const callMiddleware = function(context) {
    return getMiddleware(escherConfig, loggerStub).call(context, next);
  };


  const createContext = function(dataPromise) {
    return {
      escherData: dataPromise,
      throw: sinon.stub(),
      request: {}
    };
  };


  const createContextWithEmptyBody = function() {
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


  it('should throw error if context is invalid', function *() {
    const context = createContext();

    try {
      yield callMiddleware(context);
      throw new Error('should throw error');
    } catch (err) {
      expect(err.message).to.eql('Context is not decorated. Use interceptor middleware first.');
    }
  });



  it('should throw HTTP 401 in case of authentication problem', function *() {
    const error = new AuthenticationError('Test escher error');
    const resolvedData = Promise.resolve('test body');
    const context = createContext(resolvedData);
    escherStub.authenticate.throws(error);

    yield callMiddleware(context);

    expect(context.throw).to.have.been.calledWith(401, 'Test escher error');
    expect(loggerStub.error).to.have.been.calledWith(
      'authentication_request_error',
      'Test escher error',
      sinon.match.instanceOf(AuthenticationError).and(sinon.match.has('message', 'Test escher error'))
    );
  });



  it('should throw original error in case of problem during request', function *() {
    const expectedErrorMessage = 'Request capture error';

    const resolvedData = Promise.resolve('test body');
    const context = createContext(resolvedData);

    next = function *() {
      throw Error(expectedErrorMessage);
    };

    try {
      yield callMiddleware(context);
    } catch (error) {
      expect(error.message).to.be.eq(expectedErrorMessage);
      expect(loggerStub.error).to.not.have.been.called;
      return;
    }

    throw new Error('Should throw Error');
  });



  it('should yield the "next" if there were no problem on authentication', function *() {
    const resolvedData = Promise.resolve('test body');
    const context = createContext(resolvedData);

    let nextCalled = false;

    next = function *() {
      nextCalled = true;
    };

    yield callMiddleware(context);

    expect(escherStub.authenticate).to.have.been.called;
    expect(nextCalled).to.eql(true);
  });


  it('should supply the request data to escher without modification', function *() {
    const context = createContext(Promise.resolve('  test body  '));

    yield callMiddleware(context);

    const expectedRequest = Object.create(context.request);
    expectedRequest.body = '  test body  ';

    expect(escherStub.authenticate).to.have.been.calledWithExactly(expectedRequest, sinon.match.any);
  });


  it('should use the proper keys using keypool from configuration', function *() {
    this.sandbox.stub(KeyPool, 'create').returns({
      getKeyDb: this.sandbox.stub().returns('testKey')
    });

    const context = createContextWithEmptyBody();

    yield callMiddleware(context);

    expect(KeyPool.create).to.have.been.calledWith(escherConfig.keyPool);
    expect(escherStub.authenticate).to.have.been.calledWithExactly(sinon.match.any, 'testKey');
  });


  describe('Escher library', function() {

    it('should be initialized with the proper Escher config', function *() {
      const fullConfig = {
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
