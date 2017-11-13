'use strict';

const Interceptor = require('./request-interceptor');

module.exports = function() {
  return function* (next) {
    const interceptor = new Interceptor(this);

    this.escherData = interceptor.intercept();

    if (next) {
      yield next;
    }
  };
};
