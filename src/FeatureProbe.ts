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

import { FPToggleDetail, FPConfig } from './type';
import { FPUser } from './FPUser';
import { Repository } from './Evaluate';
import { EventRecorder } from './Event';
import { Synchronizer } from './Sync';
import pino from 'pino';
import { io, Socket } from 'socket.io-client';
import { DefaultEventsMap } from "@socket.io/component-emitter";

/**
 * A client for the FeatureProbe API.
 * Applications should instantiate a single {@link FeatureProbe} for the lifetime of their application.
 */
export class FeatureProbe {
  private readonly _remoteUrl: string;
  private readonly _togglesUrl: string;
  private readonly _eventsUrl: string;
  private readonly _realtimeUrl: string;
  private readonly _serverSdkKey: string;
  private readonly _refreshInterval: number;

  private readonly _eventRecorder: EventRecorder;
  private readonly _toggleSyncer: Synchronizer;
  private readonly _repository: Repository;

  private readonly _logger: pino.Logger;
  private _socket?: Socket<DefaultEventsMap, DefaultEventsMap>;

  get initialized(): boolean {
    return this._repository.initialized;
  }

  /**
   * Creates a new client instance that connects to FeatureProbe.
   * Undefined optional parameters will be set as the default configurations.
   *
   * @param remoteUrl url for FeatureProbe api server
   * @param togglesUrl url of FeatureProbe api server's toggle controller, leave it as blank to use the same api server as {@link remoteUrl}
   * @param eventsUrl url of FeatureProbe api server's event report controller, leave it as blank to use the same api server as {@link remoteUrl}
   * @param serverSdkKey key for your FeatureProbe environment
   * @param refreshInterval interval between polls to refresh local toggles
   * @param logger pino logger, if you want to use transport or advanced settings, please define one instance and pass to this param
   */
  constructor(
    {
      serverSdkKey,
      remoteUrl,
      togglesUrl,
      eventsUrl,
      realtimeUrl,
      refreshInterval = 1000,
      logger
    }: FPConfig) {
    if (!serverSdkKey) {
      throw new Error('non empty serverSdkKey is required');
    }
    if (refreshInterval <= 0) {
      throw new Error('refreshInterval is invalid');
    }

    if (!remoteUrl && !togglesUrl) {
      throw new Error('remoteUrl or togglesUrl is required');
    }
    if (!remoteUrl && !eventsUrl) {
      throw new Error('remoteUrl or eventsUrl is required');
    }
    if (!remoteUrl && !realtimeUrl) {
      throw new Error('remoteUrl or realtimeUrl is required');
    }

    if (!remoteUrl && !togglesUrl && !eventsUrl) {
      throw new Error('remoteUrl is required');
    }

    this._serverSdkKey = serverSdkKey;
    this._refreshInterval = refreshInterval;

    this._remoteUrl = new URL(remoteUrl ?? '').toString();
    this._togglesUrl = new URL(togglesUrl ?? remoteUrl + '/api/server-sdk/toggles').toString();
    this._eventsUrl = new URL(eventsUrl ?? remoteUrl + '/api/events').toString();
    this._realtimeUrl = new URL(realtimeUrl ?? remoteUrl + '/realtime').toString();
    this._logger = logger ?? pino({ name: 'FeatureProbe' });
    this._repository = new Repository({});
    this._eventRecorder = new EventRecorder(this._serverSdkKey, this._eventsUrl, this._refreshInterval, this._logger);
    this._toggleSyncer = new Synchronizer(this._serverSdkKey, this._togglesUrl, this._refreshInterval, this._repository, this._logger);
  }

  /**
   * Initializes the toggle repository.
   *
   * @param startWait set time limit for initialization, if not set, this function won't be timeout
   */
  public async start(startWait?: number) {
    this.connectSocket();
    const promises: [Promise<void>] = [this._toggleSyncer.start()];
    let timeoutHandle: NodeJS.Timeout | undefined;
    if (startWait != null) {
      promises.push(new Promise((resolve, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error(`Failed to initialize repository in ${startWait} ms`)),
          startWait
        );
      }));
    }

    const start = new Date().valueOf();
    await Promise.race(promises)
      .then(() => {
        clearTimeout(timeoutHandle);
        this._logger.info(`FeatureProbe client started, initialization cost ${new Date().valueOf() - start} ms`);
      })
      .catch(e => this._logger.error('FeatureProbe client failed to initialize', e));
  }

  /**
   * Closes the FeatureProbe client, this would properly clean the memory and report all events.
   */
  public async close() {
    await this._eventRecorder.stop();
    this._toggleSyncer.stop();
    this._repository.clear();
    this._logger.flush();
  }

  /**
   * Manually events push.
   */
  public flush() {
    this._eventRecorder.flush();
  }

  /**
   * Gets the evaluated value of a boolean toggle.
   * @param key toggle key
   * @param user user to be evaluated
   * @param defaultValue default return value
   */
  public booleanValue(key: string, user: FPUser, defaultValue: boolean): boolean {
    return this.toggleDetail(key, user, defaultValue, 'boolean').value as boolean;
  }

  /**
   * Gets the evaluated value of a number toggle.
   * @param key toggle key
   * @param user user to be evaluated
   * @param defaultValue default return value
   */
  public numberValue(key: string, user: FPUser, defaultValue: number): number {
    return this.toggleDetail(key, user, defaultValue, 'number').value as number;
  }

  /**
   * Gets the evaluated value of a string toggle.
   * @param key toggle key
   * @param user user to be evaluated
   * @param defaultValue default return value
   */
  public stringValue(key: string, user: FPUser, defaultValue: string): string {
    return this.toggleDetail(key, user, defaultValue, 'string').value as string;
  }

  /**
   * Gets the evaluated value of a json toggle.
   * @param key toggle key
   * @param user user to be evaluated
   * @param defaultValue default return value
   */
  public jsonValue(key: string, user: FPUser, defaultValue: any): any {
    return this.toggleDetail(key, user, defaultValue, 'object').value;
  }

  /**
   * Gets the detailed evaluation results of a boolean toggle.
   * @param key toggle key
   * @param user user to be evaluated
   * @param defaultValue default return value
   */
  public booleanDetail(key: string, user: FPUser, defaultValue: boolean): FPToggleDetail {
    return this.toggleDetail(key, user, defaultValue, 'boolean');
  }

  /**
   * Gets the detailed evaluation results of a number toggle.
   * @param key toggle key
   * @param user user to be evaluated
   * @param defaultValue default return value
   */
  public numberDetail(key: string, user: FPUser, defaultValue: number): FPToggleDetail {
    return this.toggleDetail(key, user, defaultValue, 'number');
  }

  /**
   * Gets the detailed evaluation results of a string toggle.
   * @param key toggle key
   * @param user user to be evaluated
   * @param defaultValue default return value
   */
  public stringDetail(key: string, user: FPUser, defaultValue: string): FPToggleDetail {
    return this.toggleDetail(key, user, defaultValue, 'string');
  }

  /**
   * Gets the detailed evaluation results of a json toggle.
   * @param key toggle key
   * @param user user to be evaluated
   * @param defaultValue default return value
   */
  public jsonDetail(key: string, user: FPUser, defaultValue: object): FPToggleDetail {
    return this.toggleDetail(key, user, defaultValue, 'object');
  }

  private toggleDetail(key: string, user: FPUser, defaultValue: any, valueType: ToggleValueType): FPToggleDetail {
    if (!this._repository.initialized) {
      return {
        value: defaultValue,
        ruleIndex: null,
        variationIndex: null,
        version: null,
        reason: 'FeatureProbe repository not initialized'
      } as FPToggleDetail;
    }
    const toggle = this._repository.getToggle(key);
    if (toggle === undefined) {
      return {
        value: defaultValue,
        ruleIndex: null,
        variationIndex: null,
        version: null,
        reason: `Toggle '${key}' not exist`
      } as FPToggleDetail;
    }

    const segments = this._repository.segments;
    const result = toggle.eval(user, segments, defaultValue);
    if (typeof result.value === valueType) {
      this._eventRecorder.record({
        time: Date.now(),
        key: key,
        value: result.value,
        index: result.variationIndex ?? -1,
        version: result.version ?? 0,
        reason: result.reason
      });
      return result;
    } else {
      return {
        value: defaultValue,
        ruleIndex: null,
        variationIndex: null,
        version: null,
        reason: `Value [${result.value.toString()}] type mismatch, target type: ${valueType}`
      } as FPToggleDetail;
    }
  }

  private async connectSocket() {
    const url = new URL(this._realtimeUrl);

    this._logger?.info('connect socket to ' + this._realtimeUrl + " " + url.pathname);
    const socket = io(this._realtimeUrl, { transports: ["websocket"], path: url.pathname });

    socket.on('connect', () => {
      this._logger?.info('connect socketio success');
      socket.emit('register', { key: this._serverSdkKey });
    });

    socket.on('update', () => {
      this._logger?.info('socketio recv update event');
      (async () => {
        await this._toggleSyncer.syncNow()
      })()
    });

    socket.on('connect_error', (error: Error) => {
      this._logger?.info(`socketio error ${error.message}`);
    })

    this._socket = socket;
  }
}

type ToggleValueType = 'boolean' | 'number' | 'string' | 'object';
