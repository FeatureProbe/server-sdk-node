'use strict';

import { FPToggleDetail, FPConfig } from './type';
import { FPUser } from './FPUser';
import { Repository } from './Evaluate';
import { EventRecorder } from './Event';
import { Synchronizer } from './Sync';
import pino from 'pino';

export class FeatureProbe {
  private readonly _remoteUrl: string;
  private readonly _togglesUrl: string;
  private readonly _eventsUrl: string;
  private readonly _serverSdkKey: string;
  private readonly _refreshInterval: number;

  private readonly _eventRecorder: EventRecorder;
  private readonly _toggleSyncer: Synchronizer;
  private readonly _repository: Repository;

  private readonly _logger: pino.Logger;

  get repository() {
    return this._repository;
  }

  constructor(
    {
      remoteUrl,
      togglesUrl,
      eventsUrl,
      serverSdkKey,
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
    if (!remoteUrl && !togglesUrl && !eventsUrl) {
      throw new Error('remoteUrl is required');
    }

    this._serverSdkKey = serverSdkKey;
    this._refreshInterval = refreshInterval;

    this._remoteUrl = new URL(remoteUrl ?? '').toString();
    this._togglesUrl = new URL(togglesUrl ?? remoteUrl + '/api/server-sdk/toggles').toString();
    this._eventsUrl = new URL(eventsUrl ?? remoteUrl + '/api/events').toString();

    this._logger = logger ?? pino({ name: 'FeatureProbe' });
    this._repository = new Repository({});
    this._eventRecorder = new EventRecorder(this._serverSdkKey, this._eventsUrl, this._refreshInterval, this._logger);
    this._toggleSyncer = new Synchronizer(this._serverSdkKey, this._togglesUrl, this._refreshInterval, this._repository, this._logger);
  }

  public async start() {
    await this._toggleSyncer.start();
    this._logger.info('FeatureProbe client started');
  }

  public async close() {
    await this._eventRecorder.stop();
    this._toggleSyncer.stop();
    this._repository.clear();
    this._logger.flush();
  }

  public flush() {
    this._eventRecorder.flush();
  }

  public booleanValue(key: string, user: FPUser, defaultValue: boolean): boolean {
    return this.toggleDetail(key, user, defaultValue, 'boolean').value as boolean;
  }

  public numberValue(key: string, user: FPUser, defaultValue: number): number {
    return this.toggleDetail(key, user, defaultValue, 'number').value as number;
  }

  public stringValue(key: string, user: FPUser, defaultValue: string): string {
    return this.toggleDetail(key, user, defaultValue, 'string').value as string;
  }

  public jsonValue(key: string, user: FPUser, defaultValue: any): any {
    return this.toggleDetail(key, user, defaultValue, 'object').value;
  }

  public booleanDetail(key: string, user: FPUser, defaultValue: boolean): FPToggleDetail {
    return this.toggleDetail(key, user, defaultValue, 'boolean');
  }

  public numberDetail(key: string, user: FPUser, defaultValue: number): FPToggleDetail {
    return this.toggleDetail(key, user, defaultValue, 'number');
  }

  public stringDetail(key: string, user: FPUser, defaultValue: string): FPToggleDetail {
    return this.toggleDetail(key, user, defaultValue, 'string');
  }

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
}

type ToggleValueType = 'boolean' | 'number' | 'string' | 'object';
