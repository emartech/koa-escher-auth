# koa-escher-auth
[![Dependency Status](https://david-dm.org/emartech/koa-escher-auth.svg)](https://david-dm.org/emartech/koa-escher-auth)
[![devDependency Status](https://david-dm.org/emartech/koa-escher-auth/dev-status.svg)](https://david-dm.org/emartech/koa-escher-auth#info=devDependencies)

This koa middleware allows you to restrict access to pages with Escher authentication.

## Usage

The middlewares will work only in the following order:
1. A bodyparser defining rawBody on the request (e.g. koa-bodyparser)
2. Authenticator middleware (lib/koa-authenticator)

```javascript
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const escherAuth = require('koa-escher-auth');


let escherConfig = {
  credentialScope: 'eu/app-id/ems_request',
  keyPool: JSON.stringify([
    { 'keyId': 'app-id_suite_v1', 'secret': 'app-id-secret', acceptOnly: 0 }
  ])
};

let app = new Koa();
app.use(bodyParser());
app.use(escherAuth.authenticator(escherConfig));
app.use(function(ctx) {
  ctx.body = `Hello world, ${ctx.escherAccessKeyId}!`;
});
```
The access key id used to authenticate the request will be available on the context as `escherAccessKeyId`

### Environment variables

If you define SUITE_ESCHER_CREDENTIAL_SCOPE and SUITE_ESCHER_KEY_POOL as environment variables
the setup becomes even more easier.

```
SUITE_ESCHER_CREDENTIAL_SCOPE='eu/app-id/ems_request'
SUITE_ESCHER_KEY_POOL='[{"keyId": "app-id_suite_v1", "secret": "app-id-secret", "acceptOnly": 0}]'
```

```javascript
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const escherAuth = require('koa-escher-auth');


let app = new Koa();
app.use(bodyParser());
app.use(escherAuth.authenticator());
app.use(function(ctx) {
  ctx.body = 'Hello world';
});
```

### Notes

The keypool always has to be a valid JSON string.

You are able to add other middlewares between bodyparser and authenticator if you want.
