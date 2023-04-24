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

import { FeatureProbe, FPToggleDetail, FPUser } from '../src';
import { Repository } from '../src/Evaluate';
import fetchMock from 'fetch-mock';

const repoJson = require('./fixtures/repo.json');
const unInitPrompt = 'not initialized';

const scenarios = require('./fixtures/spec/spec/toggle_simple_spec.json');

let originalConsole: () => void;

beforeEach(() => {
  originalConsole = console.log;
  console.log = jest.fn();
});

afterEach(() => {
  console.log = originalConsole;
});

test('init FeatureProbe client', async () => {
  fetchMock.mock('https://test.featureprobe.io/api/server-sdk/toggles',
    JSON.stringify(repoJson),
    { overwriteRoutes: true });

  const fpClient = new FeatureProbe(
    {
      remoteUrl: 'https://test.featureprobe.io',
      serverSdkKey: 'sdk key',
      refreshInterval: 1000
    });
  await fpClient.start();
  expect(fpClient.initialized).toBeTruthy();
  fpClient.flush();
  await fpClient.close();
});

test('close client', async () => {
  fetchMock.mock('https://test.featureprobe.io/api/server-sdk/toggles',
    JSON.stringify(repoJson),
    { overwriteRoutes: true });

  const fpClient = new FeatureProbe(
    {
      remoteUrl: 'https://test.featureprobe.io',
      serverSdkKey: 'sdk key',
      refreshInterval: 1000
    });
  await fpClient.start();
  await fpClient.close();
  console.log(( fpClient as any )._repository.toggles);
  expect(Object.keys(( fpClient as any )._repository.toggles)).toHaveLength(0);
});

test('invalid sdk key', async () => {
  expect(() => new FeatureProbe(
    {
      remoteUrl: 'https://test.featureprobe.io',
      serverSdkKey: '',
      refreshInterval: 1000
    })).toThrow();

  expect(() => new FeatureProbe(
    {
      remoteUrl: 'https://test.featureprobe.io',
      // @ts-ignore
      serverSdkKey: null,
      refreshInterval: 1000
    })).toThrow();
});

test('invalid url', async () => {
  expect(() => new FeatureProbe(
    {
      remoteUrl: '?',
      serverSdkKey: 'aaa',
      refreshInterval: 1000
    })).toThrow();
});

test('no url', async () => {
  expect(() => new FeatureProbe(
    {
      serverSdkKey: 'aaa'
    })).toThrow();
});

test('repo not initialized', async () => {
  fetchMock.mock('https://test.featureprobe.io/api/server-sdk/toggles',
    400,
    { overwriteRoutes: true });

  const fpClient = new FeatureProbe({
    remoteUrl: 'https://test.featureprobe.io',
    serverSdkKey: 'sdk key',
    refreshInterval: 1000
  });
  await fpClient.start();

  const fpUser = new FPUser().stableRollout('key11')
    .with('city', '4');

  expect(fpClient.booleanValue('bool_toggle', fpUser, true)).toBe(true);
  const booleanDetail = fpClient.booleanDetail('bool_toggle', fpUser, true);
  expect(booleanDetail.value).toBe(true);
  expect(booleanDetail.reason).toBe(unInitPrompt);

  expect(fpClient.stringValue('string_toggle', fpUser, 'ss')).toBe('ss');
  const stringDetail = fpClient.stringDetail('string_toggle', fpUser, 'sss');
  expect(stringDetail.value).toBe('sss');
  expect(stringDetail.reason).toBe(unInitPrompt);

  expect(fpClient.numberValue('number_toggle', fpUser, -3.2e10)).toBe(-3.2e10);
  const numberDetail = fpClient.numberDetail('number_toggle', fpUser, -3.2e10);
  expect(numberDetail.value).toBe(-3.2e10);
  expect(numberDetail.reason).toBe(unInitPrompt);

  expect(fpClient.jsonValue('json_toggle', fpUser, {})).toEqual({});
  const jsonDetail = fpClient.jsonDetail('json_toggle', fpUser, { a: null });
  expect(jsonDetail.value).toEqual({ a: null });
  expect(jsonDetail.reason).toBe(unInitPrompt);
});

test('test eval', async () => {
  fetchMock.mock('https://test.featureprobe.io/api/server-sdk/toggles',
    JSON.stringify(repoJson),
    { overwriteRoutes: true });

  const fpClient = new FeatureProbe(
    {
      remoteUrl: 'https://test.featureprobe.io',
      serverSdkKey: 'sdk key',
      refreshInterval: 1000
    });
  await fpClient.start();

  const fpUser = new FPUser().stableRollout('key11')
    .with('city', '4');

  expect(fpClient.booleanValue('bool_toggle', fpUser, true)).toBe(false);
  expect(fpClient.stringValue('string_toggle', fpUser, 'ss')).toBe('2');
  expect(fpClient.numberValue('number_toggle', fpUser, -3.2e10)).toBe(2.0);
  expect(fpClient.jsonValue('json_toggle', fpUser, {})).not.toEqual({});
});

test('eval type mismatch', async () => {
  fetchMock.mock('https://test.featureprobe.io/api/server-sdk/toggles',
    JSON.stringify(repoJson),
    { overwriteRoutes: true });

  const fpClient = new FeatureProbe(
    {
      remoteUrl: 'https://test.featureprobe.io',
      serverSdkKey: 'sdk key',
      refreshInterval: 1000
    });
  await fpClient.start();

  const fpUser = new FPUser().stableRollout('key11')
    .with('city', '4');

  expect(fpClient.booleanValue('number_toggle', fpUser, true)).toBe(true);
  expect(fpClient.stringValue('bool_toggle', fpUser, 'ss')).toBe('ss');
  expect(fpClient.numberValue('string_toggle', fpUser, -3.2e10)).toBe(-3.2e10);
  expect(fpClient.jsonValue('bool_toggle', fpUser, {})).toEqual({});
});

test('eval toggle not exist', async () => {
  fetchMock.mock('https://test.featureprobe.io/api/server-sdk/toggles',
    JSON.stringify(repoJson),
    { overwriteRoutes: true });

  const fpClient = new FeatureProbe(
    {
      remoteUrl: 'https://test.featureprobe.io',
      serverSdkKey: 'sdk key',
      refreshInterval: 1000
    });
  await fpClient.start();

  const fpUser = new FPUser().stableRollout('key11')
    .with('city', '4');

  expect(fpClient.booleanValue('not_exist_toggle', fpUser, true)).toBe(true);
  expect(fpClient.stringValue('not_exist_toggle', fpUser, 'ss')).toBe('ss');
  expect(fpClient.numberValue('not_exist_toggle', fpUser, -3.2e10)).toBe(-3.2e10);
  expect(fpClient.jsonValue('not_exist_toggle', fpUser, {})).toEqual({});
});

test('test scenarios', async () => {
  fetchMock.mock('https://test.featureprobe.io/api/server-sdk/toggles',
    200, { overwriteRoutes: true });

  function expectDetail(detail: FPToggleDetail, exp: any, isJson: boolean=false) {
    if (isJson) {
      expect(detail.value).toStrictEqual(exp.value);
    } else {
      expect(detail.value).toBe(exp.value);
    }

    if (exp.reason !== undefined) {
      expect(detail.reason).toContain(exp.reason)
    }
    if (exp.ruleIndex !== undefined) {
      expect(detail.ruleIndex).toBe(exp.ruleIndex)
    }
    if (exp.noRuleIndex == true) {
      expect(detail.ruleIndex).toBeNull()
    }
    if (exp.version !== undefined) {
      expect(detail.version).toBe(exp.version)
    }
  }

  for (const scenario of scenarios.tests) {
    const { scenario: name, fixture } = scenario;
    const repo = new Repository(fixture);
    repo.initialized = true;

    const fpClient = new FeatureProbe(
      {
        remoteUrl: 'https://test.featureprobe.io',
        serverSdkKey: 'sdk key'
      });
    ( fpClient as any )._repository = repo;

    for (const testCase of scenario.cases) {
      console.log(`starting execute scenario: ${name}, case: ${testCase.name}`);
      const userCase = testCase.user;
      const fpUser = new FPUser().stableRollout(userCase.key);
      for (const cv of userCase.customValues) {
        fpUser.with(cv.key, cv.value);
      }

      const funcCase = testCase.function;
      const { name: funcName, toggle: toggleKey, default: defaultValue } = funcCase;
      const expectValue = testCase.expectResult.value;

      switch (funcName) {
        case 'bool_value':
          expect(fpClient.booleanValue(toggleKey, fpUser, defaultValue)).toBe(expectValue);
          break;
        case 'bool_detail':
          expectDetail(fpClient.booleanDetail(toggleKey, fpUser, defaultValue), testCase.expectResult);
          break;
        case 'string_value':
          expect(fpClient.stringValue(toggleKey, fpUser, defaultValue)).toBe(expectValue);
          break;
        case 'string_detail':
          expectDetail(fpClient.stringDetail(toggleKey, fpUser, defaultValue), testCase.expectResult);
          break;
        case 'number_value':
          expect(fpClient.numberValue(toggleKey, fpUser, defaultValue)).toBe(expectValue);
          break;
        case 'number_detail':
          expectDetail(fpClient.numberDetail(toggleKey, fpUser, defaultValue), testCase.expectResult);
         break;
        case 'json_value':
          expect(fpClient.jsonValue(toggleKey, fpUser, defaultValue)).toStrictEqual(expectValue);
          break;
        case 'json_detail':
          expectDetail(fpClient.jsonDetail(toggleKey, fpUser, defaultValue), testCase.expectResult, true);
          break;
      }
    }
  }
});

