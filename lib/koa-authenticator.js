'use strict';

const Authenticator = require('./request-authenticator');
const AuthenticationError = require('./error/authentication');

module.exports = function(escherConfig, logger) {
  escherConfig = escherConfig || {};

  return function*(next) {
    try {
      const authenticator = new Authenticator(escherConfig, this);

      yield authenticator.authenticate();

      if (next) {
        yield next;
      }
    } catch (ex) {
      if (ex instanceof AuthenticationError) {
        if (logger && logger.error) {
          logger.error('authentication_request_error', ex.message, ex);
        }

        return this.throw(401, ex.message);
      }

      throw ex;
    }
  };
};
