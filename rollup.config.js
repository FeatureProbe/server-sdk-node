/*
 * Copyright 2022 FeatureProbe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
