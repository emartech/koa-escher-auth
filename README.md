# koa-escher-auth

This library allows you to use body parser middlewares with Escher authentication.

## Usage

The middlewares will work only in the following order:
1. Interceptor middleware (lib/koa-interceptor)
2. Bodyparser from other sources (e.g. koa-bodyparser)
3. Authenticator middleware (lib/koa-authenticator)

You are able to add other middlewares between interceptor and authenticator if you want.