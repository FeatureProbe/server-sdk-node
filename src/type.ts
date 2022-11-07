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

import { pino } from 'pino';

export interface FPUser {

  key: string;

  attrs: { [key: string]: string };

  stableRollout(key: string): FPUser;

  with(attrName: string, attrValue: string): FPUser;

  extendAttrs(attrs: { [key: string]: string }): FPUser;
}

export interface FeatureProbe {

  start(): void;

  close(): void;

  flush(): void;

  booleanValue(key: string, user: FPUser, defaultValue: boolean): boolean;

  numberValue(key: string, user: FPUser, defaultValue: number): number;

  stringValue(key: string, user: FPUser, defaultValue: string): string;

  jsonValue(key: string, user: FPUser, defaultValue: any): any;

  booleanDetail(key: string, user: FPUser, defaultValue: boolean): FPToggleDetail;

  numberDetail(key: string, user: FPUser, defaultValue: number): FPToggleDetail;

  stringDetail(key: string, user: FPUser, defaultValue: string): FPToggleDetail;

  jsonDetail(key: string, user: FPUser, defaultValue: object): FPToggleDetail;
}

export interface FPToggleDetail {
  value: boolean | string | number | any;
  ruleIndex: number | null;
  variationIndex: number | null;
  version: number | null;
  reason: string | null;
}

export interface FPConfig {
  serverSdkKey: string;
  remoteUrl?: URL | string;
  togglesUrl?: URL | string;
  eventsUrl?: URL | string;
  refreshInterval?: number;
  logger?: pino.Logger;
}
