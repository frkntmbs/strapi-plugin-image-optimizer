'use strict';

const { register } = require('esbuild-register/dist/node');

const { unregister } = register({
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
});

const admin = require('./admin/src/index.ts');

unregister();

module.exports = admin.default || admin;
