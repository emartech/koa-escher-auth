'use strict';

let Interceptor = require('./request-interceptor');

module.exports = function() {
  return function* (next) {
    let interceptor = new Interceptor(this);

    this.escherData = interceptor.intercept();

    if (next) {
      yield next;
    }
  };
};
