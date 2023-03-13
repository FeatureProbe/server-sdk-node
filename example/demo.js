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

const featureProbe = require('../dist/index.js');
const pino = require('pino');

const user = new featureProbe.FPUser().with('userId', '00001');
const user2 = new featureProbe.FPUser().with('userId', '00003');

// save log to file
// const logToFile = pino.transport({
//   targets: [
//     {
//       level: 'info',
//       target: 'pino/file',
//       options: {
//         destination: './logs/info.log',
//         mkdir: true
//       }
//     }
//   ]
// });

const FEATURE_PROBE_SERVER_URL = 'https://featureprobe.io/server';  // for featureprobe.io online demo
// const FEATURE_PROBE_SERVER_URL = 'http://localhost:4007';  // for local docker

const FEATURE_PROBE_SERVER_SDK_KEY = 'server-9b8b98cf444328ff1280a0757b26ec0abdacba76';  // change me

const fpClient = new featureProbe.FeatureProbe({
  remoteUrl: FEATURE_PROBE_SERVER_URL,
  serverSdkKey: FEATURE_PROBE_SERVER_SDK_KEY,
  refreshInterval: 5000,
  // logTransport: pino(logToFile)  // uncomment this line to try out pino transport, by default a general pino client will be used
});

const main = async () => {
  // wait until the repo has been initialized
  // await fpClient.start();
  // add time limit
  await fpClient.start(1000);
  console.log('FeatureProbe evaluation boolean type toggle result is:', fpClient.booleanValue('campaign_allow_list', user, false));
  console.log('FeatureProbe evaluation boolean type toggle detail is:', fpClient.booleanDetail('campaign_allow_list', user, false));
  console.log();
  console.log('FeatureProbe evaluation number type toggle result is:', fpClient.numberValue('promotion_campaign', user2, 0));
  console.log('FeatureProbe evaluation number type toggle detail is:', fpClient.numberDetail('promotion_campaign', user2, 0));

  await fpClient.close();
};

main().then(() => console.log('Enjoy using FeatureProbe!'));
