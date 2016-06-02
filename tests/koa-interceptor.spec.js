'use strict';

var expect = require('chai').expect;
var ReadableStream = require('stream').Readable;
var getMiddleware = require('../').interceptor;



describe('Koa Escher Request Interceptor Middleware', function() {
  var next;
  var requestBodyStream;
  var requestBody;


  var callMiddleware = function(context) {
    return getMiddleware().call(context, next);
  };


  var callPromise = function(context) {
    return context.escherData;
  };


  var createContextWithRequestBody = function() {
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
      var context = {};

      yield callMiddleware(context);

      expect(callPromise(context)).to.be.instanceOf(Promise);
    });

    it('should resolve with the original body when the data read from request stream', function*(done) {
      // arrange
      var context = createContextWithRequestBody();

      // assert
      requestBodyStream.on('end', function() {
        callPromise(context)
          .then((data) => {
            expect(data.toString()).to.eq(requestBody);
            done();
          })
          .catch((ex) => done(ex));
      });

      // act
      yield callMiddleware(context);
    });
  });
});
