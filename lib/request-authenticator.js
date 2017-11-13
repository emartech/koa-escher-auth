'use strict';

const Escher = require('escher-auth');
const KeyPool = require('escher-keypool');
const AuthenticationError = require('./error/authentication');


class RequestAuthenticator {

  constructor(config, context) {
    const credentialScope = config.credentialScope || process.env.SUITE_ESCHER_CREDENTIAL_SCOPE;

    this._escher = Escher.create({
      algoPrefix: 'EMS',
      vendorKey: 'EMS',
      authHeaderName: 'X-EMS-Auth',
      dateHeaderName: 'X-EMS-Date',
      credentialScope: credentialScope
    });

    this._config = config;
    this._context = context;
  }

  authenticate() {
    this._validate();

    return this._authenticate().catch((error) => {
      throw new AuthenticationError(error.message);
    });
  }

  _validate() {
    if (!(this._getEscherDataPromise() instanceof Promise)) {
      throw new Error('Context is not decorated. Use interceptor middleware first.');
    }
  }

  _getEscherDataPromise() {
    return this._context.escherData;
  }

  _authenticate() {
    return this._getRequest().then((request) => {
      const keyDb = this._getKeyDb();

      return this._escher.authenticate(request, keyDb);
    });
  }

  _getRequest() {
    return this._getEscherDataPromise().then((originalBody) => {
      const request = Object.create(this._context.request);
      request.body = originalBody;

      return request;
    });
  }

  _getKeyDb() {
    const keyPool = this._config.keyPool || process.env.SUITE_ESCHER_KEY_POOL;

    if (keyPool) {
      return KeyPool.create(keyPool).getKeyDb();
    }

    return function() {};
  }

  static create(context) {
    return new RequestAuthenticator(context);
  }
}

module.exports = RequestAuthenticator;
