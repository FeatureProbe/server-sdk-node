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

'use strict';

import pino from 'pino';

require('isomorphic-fetch');

import { Repository } from './Evaluate';

const pkg = require('../package.json');
const UA = `Node/${pkg.version}`;

export class Synchronizer {
  private _serverSdkKey: string;
  private _togglesUrl: string;
  private _repository: Repository;

  private _refreshInterval: number;
  private _timer?: NodeJS.Timer;

  private readonly _logger?: pino.Logger;

  get serverSdkKey(): string {
    return this._serverSdkKey;
  }

  set serverSdkKey(value: string) {
    this._serverSdkKey = value;
  }

  get togglesUrl(): string {
    return this._togglesUrl;
  }

  set togglesUrl(value: URL | string) {
    this._togglesUrl = new URL(value).toString();
  }

  get repository(): Repository {
    return this._repository;
  }

  set repository(value: Repository) {
    this._repository = value;
  }

  get refreshInterval(): number {
    return this._refreshInterval;
  }

  set refreshInterval(value: number) {
    this._refreshInterval = value;
  }

  constructor(serverSdkKey: string,
              togglesUrl: URL | string,
              refreshInterval: number,
              repository: Repository,
              logger?: pino.Logger) {
    this._serverSdkKey = serverSdkKey;
    this._togglesUrl = new URL(togglesUrl).toString();
    this._refreshInterval = refreshInterval;
    this._repository = repository;
    this._logger = logger;
  }

  public async start(): Promise<void> {
    this._logger?.info(`Starting FeatureProbe polling repository with interval ${this._refreshInterval} ms`);
    this.stop();
    this._timer = setInterval(() => this.fetchRemoteRepo(), this._refreshInterval);
    return this.fetchRemoteRepo();
  }

  public stop() {
    if (this._timer !== undefined) {
      this._logger?.info('Closing FeatureProbe Synchronizer');
      clearInterval(this._timer);
      delete this._timer;
    }
  }

  private async fetchRemoteRepo(): Promise<void> {
    await fetch(this._togglesUrl, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        Authorization: this._serverSdkKey,
        'Content-Type': 'application/json',
        UA: UA
      }
    })
      .then(resp => resp.json())
      .then(json => {
        this._logger?.debug(`Http response: ${json.status}`);
        this._logger?.debug(json, 'Http response body');
        const latestRepo = new Repository(json);
        latestRepo.initialized = true;
        latestRepo.updatedTimestamp = Date.now();
        Object.assign(this._repository, latestRepo);
      })
      .catch((e: any) => this._logger?.error(e, 'Unexpected error from polling processor'));
  }
}
