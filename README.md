# koa-escher-auth
[![Dependency Status](https://david-dm.org/emartech/koa-escher-auth.svg)](https://david-dm.org/emartech/koa-escher-auth)
[![devDependency Status](https://david-dm.org/emartech/koa-escher-auth/dev-status.svg)](https://david-dm.org/emartech/koa-escher-auth#info=devDependencies)

This koa middleware allows you to restrict access to pages with Escher authentication.

## Usage

The middlewares will work only in the following order:
1. Interceptor middleware (lib/koa-interceptor)
2. Bodyparser from other sources (e.g. koa-bodyparser)
3. Authenticator middleware (lib/koa-authenticator)

### Setup the application

```javascript
let app = require('koa')();
let BoarServer = require('boar-stack').app;
let server = new BoarServer(app);
let escherAuth = require('koa-escher-auth');

server.addMiddleware(escherAuth.interceptor());
server.addBodyParseMiddleware();
...
```

### Add authentication to routes

```javascript
let controllerFactory = require('boar-stack').lib.controllerFactory;
let escherAuth = require('koa-escher-auth');
let escherConfig = {
  credentialScope: 'eu/app-id/ems_request',
  keyPool: JSON.stringify([
    { 'keyId': 'app-id_suite_v1', 'secret': 'app-id-secret', acceptOnly: 0 }
  ])
};

module.exports = controllerFactory.create(function(router) {
  router.post('/import-hds', escherAuth.authenticator(escherConfig), function*() {
    this.body = 'Hello world'; 
  });
});

```

### Environment variables

If you define SUITE_ESCHER_CREDENTIAL_SCOPE and SUITE_ESCHER_KEY_POOL as environment variables
the setup becomes even more easier.

```
SUITE_ESCHER_CREDENTIAL_SCOPE='eu/app-id/ems_request'
SUITE_ESCHER_KEY_POOL='[{"keyId": "app-id_suite_v1", "secret": "app-id-secret", "acceptOnly": 0}]'
```

```javascript
let controllerFactory = require('boar-stack').lib.controllerFactory;
let escherAuth = require('koa-escher-auth');

module.exports = controllerFactory.create(function(router) {
  router.post('/import-hds', escherAuth.authenticator(), function*() {
    this.body = 'Hello world'; 
  });
});

```

### Notes

The keypool always has to be a valid JSON string.

You are able to add other middlewares between interceptor and authenticator if you want.
