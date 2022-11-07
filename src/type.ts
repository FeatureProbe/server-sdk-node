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
  /**
   * Return value of a toggle for the current user.
   */
  value: boolean | string | number | any;

  /**
   * The index of the matching rule.
   */
  ruleIndex: number | null;

  /**
   * The index of the matching variation.
   */
  variationIndex: number | null;

  /**
   * The version of the toggle.
   */
  version: number | null;

  /**
   * The failed reason.
   */
  reason: string | null;
}

export interface FPConfig {
  /**
   * The server SDK Key for authentication.
   */
  serverSdkKey: string;

  /**
   * The unified URL to get toggles and post events.
   */
  remoteUrl?: URL | string;

  /**
   * The specific URL to get toggles, once set, remoteUrl will be ignored.
   */
  togglesUrl?: URL | string;

  /**
   * The specific URL to post events, once set, remoteUrl will be ignored.
   */
  eventsUrl?: URL | string;

  /**
   * The SDK check for updated in millisecond.
   */
  refreshInterval?: number;

  /**
   * Pino logger.
   *
   * If you want to use transport or advanced settings,
   * please define one instance and pass to this param.
   */
  logger?: pino.Logger;
}
