'use strict';

let expect = require('chai').expect;
let ReadableStream = require('stream').Readable;
let getMiddleware = require('../').interceptor;



describe('Koa Escher Request Interceptor Middleware', function() {
  let requestBodyStream;
  let requestBody = '    {"test":"json"}    ';

  let callMiddleware = function(context) {
    return getMiddleware().call(context, function*() {});
  };


  let callPromise = function(context) {
    return context.escherData.then((data) => data.toString());
  };


  let createContextWithRequestBody = function() {
    requestBodyStream.push(requestBody);
    requestBodyStream.push(null);

    return {
      req: requestBodyStream,
      request: {}
    };
  };


  beforeEach(function() {
    requestBodyStream = new ReadableStream();
  });

  describe('Promise', function() {
    it('should be placed onto the context', function* () {
      let context = {};

      yield callMiddleware(context);

      expect(callPromise(context)).to.be.instanceOf(Promise);
    });

    it('should resolve with the original body when the data read from request stream', function*() {
      let context = createContextWithRequestBody();

      let requestPromise = new Promise(function(resolve, reject) {
        requestBodyStream.on('end', function() {
          callPromise(context)
            .then(resolve)
            .catch(reject);
        });
      });

      yield callMiddleware(context);

      expect(yield requestPromise).to.eq(requestBody);
    });
  });
});
