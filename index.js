'use strict';

module.exports = {
  authenticator: require('./lib/koa-authenticator'),

  lib: {
    Authenticator: require('./lib/request-authenticator'),
    AuthenticationError: require('./lib/error/authentication')
  }
};
