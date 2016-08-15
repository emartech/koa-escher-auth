'use strict';

let Authenticator = require('./request-authenticator');
let AuthenticationError = require('./error/authentication');

module.exports = function(escherConfig = {}, logger) {
  return function*(next) {
    try {
      let authenticator = new Authenticator(escherConfig, this);

      yield authenticator.authenticate();

      if (next) {
        yield next;
      }
    } catch (ex) {
      if (ex instanceof AuthenticationError) {
        if (logger && logger.error) {
          logger.error('authentication_request_error', ex.message, ex);
        }

        return this.throw(ex.message, 401);
      }

      throw ex;
    }
  };
};
