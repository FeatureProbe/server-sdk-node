import { FeatureProbe, FPUser } from "../src";
import fetchMock from "fetch-mock";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const repoJson = require("./fixtures/repo.json");
const unInitPrompt = "FeatureProbe repository not initialized";

test("init FeatureProbe client", async () => {
  fetchMock.mock("https://test.featureprobe.io/api/server-sdk/toggles", JSON.stringify(repoJson));

  const fpClient = new FeatureProbe(
    {
      remoteUrl: "https://test.featureprobe.io",
      serverSdkKey: "sdk key",
      refreshInterval: 1000
    });
  await fpClient.start();
  fpClient.flush();
  await fpClient.close();
});

test("invalid sdk key or url", async () => {
  expect(new FeatureProbe(
    {
      remoteUrl: "https://test.featureprobe.io",
      serverSdkKey: "",
      refreshInterval: 1000
    })).toThrow();
});

test("repo not initialized", async () => {
  fetchMock.mock("https://test.featureprobe.io/api/server-sdk/toggles", 400);

  const fpClient = new FeatureProbe({
    remoteUrl: "https://test.featureprobe.io",
    serverSdkKey: "sdk key",
    refreshInterval: 1000
  });
  await fpClient.start();

  const fpUser = new FPUser().stableRollout("key11")
    .with("city", "4");

  expect(fpClient.booleanValue("bool_toggle", fpUser, true)).toBe(true);
  const booleanDetail = fpClient.booleanDetail("bool_toggle", fpUser, true);
  expect(booleanDetail.value).toBe(true);
  expect(booleanDetail.reason).toBe(unInitPrompt);

  expect(fpClient.stringValue("string_toggle", fpUser, "ss")).toBe("ss");
  const stringDetail = fpClient.stringDetail("string_toggle", fpUser, "sss");
  expect(stringDetail.value).toBe("sss");
  expect(stringDetail.reason).toBe(unInitPrompt);

  expect(fpClient.numberValue("number_toggle", fpUser, -3.2e10)).toBe(-3.2e10);
  const numberDetail = fpClient.numberDetail("number_toggle", fpUser, -3.2e10);
  expect(numberDetail.value).toBe(-3.2e10);
  expect(numberDetail.reason).toBe(unInitPrompt);

  expect(fpClient.jsonValue("json_toggle", fpUser, {})).toEqual({});
  const jsonDetail = fpClient.jsonDetail("json_toggle", fpUser, { a: null });
  expect(jsonDetail.value).toEqual({ a: null });
  expect(jsonDetail.reason).toBe(unInitPrompt);
});

test("test eval", async () => {
  fetchMock.mock("https://test.featureprobe.io/api/server-sdk/toggles", JSON.stringify(repoJson));

  const fpClient = new FeatureProbe(
    {
      remoteUrl: "https://test.featureprobe.io",
      serverSdkKey: "sdk key",
      refreshInterval: 1000
    });
  await fpClient.start();

  const fpUser = new FPUser().stableRollout("key11")
    .with("city", "4");

  expect(fpClient.booleanValue("bool_toggle", fpUser, true)).toBe(false);
  expect(fpClient.stringValue("string_toggle", fpUser, "ss")).toBe("2");
  expect(fpClient.numberValue("number_toggle", fpUser, -3.2e10)).toBe(2.0);
  expect(fpClient.jsonValue("json_toggle", fpUser, {})).not.toEqual({});
});
