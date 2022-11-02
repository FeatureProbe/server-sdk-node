// eslint-disable-next-line @typescript-eslint/no-var-requires
const featureProbe = require("../dist/featureprobe-server-sdk-node.min");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pino = require("pino");

const user = new featureProbe.FPUser().with("userId", "00001");
const user2 = new featureProbe.FPUser().with("userId", "00003");

const logToFile = pino.transport({
  targets: [
    {
      level: "info",
      target: "pino/file",
      options: {
        destination: "./logs/info.log",
        mkdir: true,
      }
    },
    {
      level: "debug",
      target: "pino/file",
      options: {
        destination: "./logs/debug.log",
        mkdir: true,
      }
    },
  ]
});

const fpClient = new featureProbe.FeatureProbe({
  remoteUrl: "https://featureprobe.io",
  serverSdkKey: "server-1393c8287c0a87adc4ec2f3141b5f24d1aa97070",
  refreshInterval: 5000,
  logTransport: pino(logToFile),
});

const main = async () => {
  await fpClient.start();
  console.log("FeatureProbe evaluation boolean type toggle result is:", fpClient.booleanValue("campaign_allow_list", user, false));
  console.log("FeatureProbe evaluation boolean type toggle detail is:", fpClient.booleanDetail("campaign_allow_list", user, false));
  console.log();
  console.log("FeatureProbe evaluation string type toggle result is:", fpClient.stringValue("string_toggle_key", user, "default"));
  console.log("FeatureProbe evaluation string type toggle detail is:", fpClient.stringDetail("string_toggle_key", user, "default"));
  console.log();
  console.log("FeatureProbe evaluation number type toggle result is:", fpClient.numberValue("promotion_campaign", user2, 0));
  console.log("FeatureProbe evaluation number type toggle detail is:", fpClient.numberDetail("promotion_campaign", user2, 0));
  console.log();
  console.log("FeatureProbe evaluation json type toggle result is:", fpClient.jsonValue("json_toggle_key", user, {}));
  console.log("FeatureProbe evaluation json type toggle detail is:", fpClient.jsonDetail("json_toggle_key", user, {}));
  await fpClient.close();
};

main().then(() => console.log("Enjoy using FeatureProbe!"));
