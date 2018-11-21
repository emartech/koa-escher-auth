'use strict';

const ReadableStream = require('stream').Readable;
const getMiddleware = require('../index').interceptor;



describe('Koa Escher Request Interceptor Middleware', function() {
  let requestBodyStream;
  const requestBody = '    {"test":"json"}    ';

  const callMiddleware = function(context) {
    return getMiddleware().call(context, function*() {});
  };


  const callPromise = function(context) {
    return context.escherData.then((data) => data.toString()).catch(err => { return err; });
  };


  const createContextWithRequestBody = function() {
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
      const context = {};

      yield callMiddleware(context);

      expect(callPromise(context)).to.be.instanceOf(Promise);
    });

    it('should resolve with the original body when the data read from request stream', function*() {
      const context = createContextWithRequestBody();

      const requestPromise = new Promise(function(resolve, reject) {
        requestBodyStream.on('end', function() {
          callPromise(context)
            .then(resolve)
            .catch(reject);
        });
      });

      yield callMiddleware(context);

      expect(requestPromise).to.eventually.eq(requestBody);
    });
  });
});
