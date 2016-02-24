'use strict';

var rawBody = require('raw-body');


class RequestInterceptor {

  constructor(context) {
    this._context = context;
  }

  intercept() {
    return rawBody(this._context.req);
  }


  static create(context) {
    return new RequestInterceptor(context);
  }

}


module.exports = RequestInterceptor;
