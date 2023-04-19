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

import fetchMock from 'fetch-mock';

import { EventRecorder } from '../src/Event';
import { FPUser } from '../src/FPUser';

test('flush event', async () => {
  const fakeEventUrl = 'https://test.featureprobe.io/api/events';
  const mockApi = fetchMock.mock(fakeEventUrl,
    { status: 200, body: '{' },
    { overwriteRoutes: true });

  const recorder = new EventRecorder('sdk key', fakeEventUrl, 1000);
  recorder.recordAccessEvent({
    time: Date.now(),
    key: 'toggle key',
    value: 'eval value',
    version: 1,
    reason: 'default',
    index: -1
  });
  recorder.recordAccessEvent({
    time: Date.now(),
    key: 'toggle key',
    value: 'eval value',
    version: 2,
    reason: 'default',
    index: -1
  });
  recorder.flush();
  await new Promise(r => setTimeout(r, 2000));

  expect(JSON.parse(mockApi.lastOptions()?.body?.toString() ?? '[]')[0].access.counters['toggle key'])
    .toHaveLength(2);
});

test('record track event', async () => {
  const fakeEventUrl = 'https://test.featureprobe.io/api/events';
  const mockApi = fetchMock.mock(fakeEventUrl,
    { status: 200, body: '{' },
    { overwriteRoutes: true });

  const recorder = new EventRecorder('sdk key', fakeEventUrl, 1000);
  recorder.recordTrackEvent({
    kind: 'access',
    time: Date.now(),
    key: 'toggle key1',
    value: 'value1',
    variationIndex: 1,
    ruleIndex: 1,
    version: 2,
    user: '111',
  });
  recorder.recordTrackEvent({
    kind: 'access',
    time: Date.now(),
    key: 'toggle key2',
    value: 'value2',
    variationIndex: 2,
    ruleIndex: 1,
    version: 1,
    user: '222',
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
  const mockApi = fetchMock.mock(fakeEventUrl,
    { status: 200, body: '{' },
    { overwriteRoutes: true });

  const recorder = new EventRecorder('sdk key', fakeEventUrl, 1000);
  recorder.recordAccessEvent({
    time: Date.now(),
    key: 'toggle key',
    value: 'eval value',
    version: 1,
    reason: 'default',
    index: -1
  });
});

test('record after close', async () => {
  const fakeEventUrl = 'https://test.featureprobe.io/api/events';
  const mockApi = fetchMock.mock(fakeEventUrl, 200, { overwriteRoutes: true });

  const recorder = new EventRecorder('sdk key', fakeEventUrl, 1000);
  await recorder.stop();
  recorder.recordAccessEvent({
    time: Date.now(),
    key: 'toggle key',
    value: 'eval value',
    version: 1,
    reason: 'default',
    index: -1
  });
});

test('close twice', async () => {
  const fakeEventUrl = 'https://test.featureprobe.io/api/events';
  const mockApi = fetchMock.mock(fakeEventUrl, 200, { overwriteRoutes: true });

  const recorder = new EventRecorder('sdk key', fakeEventUrl, 1000);
  await recorder.stop();
  await recorder.stop();
});
