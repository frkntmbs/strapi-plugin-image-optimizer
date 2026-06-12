'use strict';

const { register } = require('esbuild-register/dist/node');

const { unregister } = register({
  extensions: ['.js', '.ts'],
});

const server = require('./server/src/index.ts');

unregister();

module.exports = server.default || server;
