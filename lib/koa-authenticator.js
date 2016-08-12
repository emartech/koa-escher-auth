'use strict';

let Authenticator = require('./request-authenticator');

module.exports = function(escherConfig, logger) {
  escherConfig = escherConfig || {};

  return function*(next) {
    try {
      let authenticator = new Authenticator(escherConfig, this);

      yield authenticator.authenticate();

      if (next) {
        yield next;
      }
    } catch (ex) {
      if (logger && logger.error) {
        logger.error('authentication_request_error', ex.message, ex);
      }

      this.throw(401, ex.message);
    }
  };
};
