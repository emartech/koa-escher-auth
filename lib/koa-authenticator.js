'use strict';

const Authenticator = require('./request-authenticator');
const AuthenticationError = require('./error/authentication');


module.exports = function(escherConfig, logger) {
  escherConfig = escherConfig || {};

  return async function(ctx, next) {
    const authenticator = new Authenticator(escherConfig, ctx);

    try {
      ctx.escherAccessKeyId = await authenticator.authenticate();
    } catch (ex) {
      if (ex instanceof AuthenticationError) {
        if (logger && logger.error) {
          logger.error('authentication_request_error', ex.message, ex);
        }

        return ctx.throw(401, ex.message);
      }

      throw ex;
    }

    await next();
  };
};
