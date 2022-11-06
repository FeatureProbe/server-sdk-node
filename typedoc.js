const pkg = require('./package.json');
const PKG_VERSION = pkg.version;

module.exports = {
  out: './docs',
  name: `FeatureProbe Server Side SDK for Node.js (${PKG_VERSION})`,
  readme: 'README.md',
  entryPoints: ['./src/index.ts']
};
