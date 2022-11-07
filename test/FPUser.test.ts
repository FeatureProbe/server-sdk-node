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

import { FPUser } from '../src';

test('simple', () => {
  const user = new FPUser().stableRollout('uniqKey')
    .with('city', 'shenzhen')
    .with('os', 'macos');

  expect(user.getAttr('os')).toBe('macos');
  expect(Object.keys(user.attrs).length).toBe(2);
  expect(user.key).toBe('uniqKey');
});

test('user auto generated key', () => {
  const user = new FPUser();

  expect(user.key).toBeDefined();
  expect(user.key.length).toBe(13);
});
