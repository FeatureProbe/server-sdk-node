import fetchMock from 'fetch-mock';

import { EventRecorder } from '../src/Event';

test('flush event', async () => {
  const fakeEventUrl = 'https://test.featureprobe.io/api/events';
  const mockApi = fetchMock.mock(fakeEventUrl, { status: 200, body: '{' });

  const recorder = new EventRecorder('sdk key', fakeEventUrl, 1000);
  recorder.record({
    time: Date.now(),
    key: 'toggle key',
    value: 'eval value',
    version: 1,
    reason: 'default',
    index: -1
  });
  recorder.record({
    time: Date.now(),
    key: 'toggle key',
    value: 'eval value',
    version: 2,
    reason: 'default',
    index: -1
  });
  recorder.flush();
  await new Promise(r => setTimeout(r, 2000));
  expect(JSON.parse(mockApi.lastOptions()?.body?.toString() ?? '[]')[0].events)
    .toHaveLength(2);
});

test('invalid url', async () => {
  expect(() => new EventRecorder('sdk key', '??', 1000)).toThrow();
});

test('get snapshot', () => {
  const fakeEventUrl = 'https://test.featureprobe.io/api/events';
  const mockApi = fetchMock.mock(fakeEventUrl, { status: 200, body: '{' });

  const recorder = new EventRecorder('sdk key', fakeEventUrl, 1000);
  recorder.record({
    time: Date.now(),
    key: 'toggle key',
    value: 'eval value',
    version: 1,
    reason: 'default',
    index: -1
  });
});
