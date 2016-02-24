'use strict';

var logger = require('logentries-logformat')('suite-sdk');
var Authenticator = require('./request-authenticator');

module.exports = function(escherConfig) {
  return function*(next) {
    try {
      var authenticator = new Authenticator(escherConfig, this);

      yield authenticator.authenticate();

      if (next) {
        yield next;
      }
    } catch (ex) {
      logger.error('authentication_request_error', ex.message, ex);
      this.throw(401, ex.message);
    }
  };
};
