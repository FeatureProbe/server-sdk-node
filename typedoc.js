import pkg from "./package.json";
const PKG_VERSION = pkg.version;

module.exports = {
  out: "./doc",
  name: "FeatureProbe Server Side SDK for NodeJS  (" + PKG_VERSION + ")",
  readme: "README.md",
  entryPoints: ["./src/index.ts"]
};
