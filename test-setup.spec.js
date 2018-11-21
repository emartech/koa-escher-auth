'use strict';

const sinon = require('sinon');
const chai = require('chai');
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.use(require('sinon-chai'));

before(function() {

  sinon.stub.returnsWithResolve = function(data) {
    return this.returns(Promise.resolve(data));
  };

  sinon.stub.returnsWithReject = function(error) {
    return this.returns(Promise.reject(error));
  };

  global.expect = chai.expect;
  global.sinon = sinon;
});


beforeEach(function() {
  this.sandbox = sinon.createSandbox();
});


afterEach(function() {
  this.sandbox.restore();
});
