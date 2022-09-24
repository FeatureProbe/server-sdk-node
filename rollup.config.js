import typescript from "rollup-plugin-typescript2";
import minify from "rollup-plugin-babel-minify";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import nodePolyfills from "rollup-plugin-node-polyfills";
import json from "@rollup/plugin-json";

export default {
  input: "./src/index.ts",
  output: [
    {
      file: "./dist/featureprobe-server-sdk-node.min.js",
      format: "iife",
      name: "featureProbe"
    }
  ],
  plugins: [
    nodePolyfills(),
    resolve({}),
    commonjs({
      namedExports: {
        "node_modules/semver/semver.js": ["SemVer"]
      },
      include: "node_modules/**"
    }),
    typescript({ tsconfigOverride: { compilerOptions: { module: "ES2015" } } }),
    minify({ comments: false }),
    json()
  ]
};
