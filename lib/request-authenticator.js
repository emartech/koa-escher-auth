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

    try {
      this._authenticate();
    } catch (error) {
      throw new AuthenticationError(error.message);
    }
  }

  _validate() {
    if (this._context.request.rawBody === undefined) {
      throw new Error('Context is not decorated. Use koa-bodyparser middleware first.');
    }
  }

  _authenticate() {
    const request = this._getRequest();
    const keyDb = this._getKeyDb();

    return this._escher.authenticate(request, keyDb);
  }

  _getRequest() {
    const request = Object.create(this._context.request);
    request.body = this._context.request.rawBody;

    return request;
  }

  _getKeyDb() {
    const keyPool = this._config.keyPool || process.env.SUITE_ESCHER_KEY_POOL;

    if (keyPool) {
      return KeyPool.create(keyPool).getKeyDb();
    }

    return function() {};
  }

}

module.exports = RequestAuthenticator;
