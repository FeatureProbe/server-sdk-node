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

import { Repository } from '../src/Evaluate';
import { Synchronizer } from '../src/Sync';
import fetchMock from 'fetch-mock';

const repoJson = require('./fixtures/repo.json');
const repo = new Repository(repoJson);

test('start sync and wait for first resp', async () => {
  fetchMock.mock('https://test.featureprobe.io/toggles',
    JSON.stringify(repoJson),
    { overwriteRoutes: true });
  const repo2 = new Repository({});
  const synchronizer = new Synchronizer('node-sdk',
    new URL('https://test.featureprobe.io/toggles'),
    1000,
    repo2
  );
  await synchronizer.start();

  // don't care about update timestamp and initialized flag for testing
  repo2.initialized = false;
  repo2.updatedTimestamp = 0;

  expect(repo2).toStrictEqual(repo);
});

test('receive invalid json', async () => {
  fetchMock.mock('https://test.featureprobe.io/toggles',
    { body: '{' },
    { overwriteRoutes: true });
  const repo2 = new Repository({});
  const synchronizer = new Synchronizer('node-sdk',
    new URL('https://test.featureprobe.io/toggles'),
    1000,
    repo2
  );
  await synchronizer.start();
  await new Promise(r => setTimeout(r, 3000));
  expect(repo2).toStrictEqual(new Repository({}));
});

test('invalid url', async () => {
  fetchMock.mock('hppt://111', 404);

  const synchronizer = new Synchronizer('node-sdk',
    new URL('hppt://111'),  // more explicit errors will be checked in FeatureProbe.constructor
    1000,
    new Repository({})
  );
  await synchronizer.start();

  await new Promise(r => setTimeout(r, 3000));
  expect(synchronizer.repository).toStrictEqual(new Repository({}));
  expect(synchronizer.repository.initialized).toBe(false);
  expect(synchronizer.repository.updatedTimestamp).toBe(0);
});
