// eslint-disable-next-line @typescript-eslint/no-var-requires
const featureProbe = require("../dist/featureprobe-server-sdk-node.min");

const user = new featureProbe.FPUser().with("userId", "1234567890");

const fpClient = new featureProbe.FeatureProbe({
  remoteUrl: "https://featureprobe.io/server",
  serverSdkKey: "server-25614c7e03e9cb49c0e96357b797b1e47e7f2dff",  // FIXME
  refreshInterval: 5000
});

const main = async () => {
  await fpClient.start();
  console.log("FeatureProbe evaluation boolean type toggle result is:", fpClient.booleanValue("bool_toggle_key", user, false));
  console.log("FeatureProbe evaluation boolean type toggle detail is:", fpClient.booleanDetail("bool_toggle_key", user, false));
  console.log();
  console.log("FeatureProbe evaluation string type toggle result is:", fpClient.stringValue("string_toggle_key", user, "default"));
  console.log("FeatureProbe evaluation string type toggle detail is:", fpClient.stringDetail("string_toggle_key", user, "default"));
  console.log();
  console.log("FeatureProbe evaluation number type toggle result is:", fpClient.numberValue("number_toggle_key", user, 0));
  console.log("FeatureProbe evaluation number type toggle detail is:", fpClient.numberDetail("number_toggle_key", user, 0));
  console.log();
  console.log("FeatureProbe evaluation json type toggle result is:", fpClient.jsonValue("json_toggle_key", user, {}));
  console.log("FeatureProbe evaluation json type toggle detail is:", fpClient.jsonDetail("json_toggle_key", user, {}));
  await fpClient.close();
};

main();
