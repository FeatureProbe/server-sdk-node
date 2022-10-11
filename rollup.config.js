import typescript from "rollup-plugin-typescript2";
import minify from "rollup-plugin-babel-minify";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import nodePolyfills from "rollup-plugin-node-polyfills";
import json from "@rollup/plugin-json";
import builtins from "rollup-plugin-node-builtins";

export default {
  input: "./src/index.ts",
  output: [
    {
      file: "./dist/featureprobe-server-sdk-node.min.js",
      format: "cjs",
      name: "featureProbe"
    }
  ],
  plugins: [
    nodePolyfills(),
    typescript({ tsconfigOverride: { compilerOptions: { module: "ES2015" } } }),
    builtins({ crypto: false }),
    resolve({ browser: true }),
    commonjs({ include: "node_modules/**" }),
    json(),
    minify({ comments: false })
  ],
  external: [
    "crypto"
  ]
};
