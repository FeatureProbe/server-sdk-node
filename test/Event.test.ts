import fetchMock from "jest-fetch-mock";

import { EventRecorder } from "../src/Event";

beforeEach(() => {
  fetchMock.enableMocks();
});

afterEach(() => {
  fetchMock.resetMocks();
});

test("flush event", async () => {
  const recorder = new EventRecorder("sdk key", "https://test.featureprobe.io/api/events", 1000);
  recorder.record({
    time: Date.now(),
    key: "toggle key",
    value: "eval value",
    version: 1,
    reason: "default",
    index: -1
  });
  recorder.record({
    time: Date.now(),
    key: "toggle key",
    value: "eval value",
    version: 2,
    reason: "default",
    index: -1
  });
  await new Promise(r => setTimeout(r, 3000));
  expect(fetch.length).toBeGreaterThanOrEqual(1);
});

test("invalid url", async () => {
  expect(() => new EventRecorder("sdk key", "??", 1000)).toThrow();
});
