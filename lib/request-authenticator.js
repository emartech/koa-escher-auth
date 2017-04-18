'use strict';

let Escher = require('escher-auth');
let KeyPool = require('escher-keypool');
let AuthenticationError = require('./error/authentication');


class RequestAuthenticator {

  constructor(config, context) {
    let credentialScope = config.credentialScope || process.env.SUITE_ESCHER_CREDENTIAL_SCOPE;

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
      let keyDb = this._getKeyDb();

      return this._escher.authenticate(request, keyDb);
    });
  }

  _getRequest() {
    return this._getEscherDataPromise().then((originalBody) => {
      let request = Object.create(this._context.request);
      request.body = originalBody;

      return request;
    });
  }

  _getKeyDb() {
    let keyPool = this._config.keyPool || process.env.SUITE_ESCHER_KEY_POOL;

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
