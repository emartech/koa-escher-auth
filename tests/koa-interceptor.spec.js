'use strict';

let expect = require('chai').expect;
let ReadableStream = require('stream').Readable;
let getMiddleware = require('../').interceptor;



describe('Koa Escher Request Interceptor Middleware', function() {
  let next;
  let requestBodyStream;
  let requestBody;


  let callMiddleware = function(context) {
    return getMiddleware().call(context, next);
  };


  let callPromise = function(context) {
    return context.escherData;
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
    next = function* () {};

    requestBodyStream = new ReadableStream();
    requestBody = '    {"test":"json"}    ';
  });


  describe('Promise', function() {
    it('should be placed onto the context', function* () {
      let context = {};

      yield callMiddleware(context);

      expect(callPromise(context)).to.be.instanceOf(Promise);
    });

    it('should resolve with the original body when the data read from request stream', function*() {
      // arrange
      let context = createContextWithRequestBody();

      // assert
      let requestPromise = new Promise(function(resolve, reject) {
        requestBodyStream.on('end', function() {
          callPromise(context)
            .then((data) => {
              expect(data.toString()).to.eq(requestBody);
              resolve();
            })
            .catch((ex) => reject(ex));
        });
      });


      // act
      yield callMiddleware(context);
      yield requestPromise;
    });
  });
});
