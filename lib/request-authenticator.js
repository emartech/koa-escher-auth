'use strict';

var Escher = require('escher-auth');
var KeyPool = require('escher-keypool');


class RequestAuthenticator {

  constructor(config, context) {
    this._escher = Escher.create({
      algoPrefix: 'EMS',
      vendorKey: 'EMS',
      authHeaderName: 'X-EMS-Auth',
      dateHeaderName: 'X-EMS-Date',
      credentialScope: config.credentialScope
    });

    this._config = config;
    this._context = context;
  }

  *authenticate() {
    this._validate();

    yield this._authenticate();
  }

  _validate() {
    if (!this._getEscherDataPromise() instanceof Promise) {
      throw new Error('Context is not decorated. Use interceptor middleware first.');
    }
  }

  _getEscherDataPromise() {
    return this._context.escherData;
  }

  *_authenticate() {
    let request = yield this._getRequest();
    let keyDb = this._getKeyDb();

    return this._escher.authenticate(request, keyDb);
  }

  *_getRequest() {
    let originalBody = yield this._getEscherDataPromise();

    let request = Object.create(this._context.request);
    request.body = originalBody;

    return request;
  }

  _getKeyDb() {
    if (this._config.keyPool) {
      return KeyPool.create(this._config.keyPool).getKeyDb();
    }

    return function() {};
  }

  static create(context) {
    return new RequestAuthenticator(context);
  }
}

module.exports = RequestAuthenticator;
