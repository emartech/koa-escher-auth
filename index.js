'use strict';

module.exports = {
  authenticator: require('./lib/koa-authenticator'),
  interceptor: require('./lib/koa-interceptor'),

  lib: {
    Authenticator: require('./lib/request-authenticator'),
    Interceptor: require('./lib/request-interceptor'),
    AuthenticationError: require('./lib/error/authentication')
  }
};
