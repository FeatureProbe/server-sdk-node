import { FPUser } from './FPUser';
import { FPToggleDetail, IOption } from './type';

export default class FeatureProbe {
  private togglesUrl: URL;
  private eventsUrl: URL;
  private refreshInterval: number;
  private clientSdkKey: string;
  private user: FPUser;
  private toggles: { [key: string]: FPToggleDetail } | undefined;
  private timer?: any;

  constructor({
    remoteUrl,
    togglesUrl,
    eventsUrl,
    clientSdkKey,
    user,
    refreshInterval = 1000,
  }: IOption) {
    if (!clientSdkKey) {
      throw new Error('clientSdkKey is required');
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

    this.togglesUrl = new URL(
      togglesUrl || remoteUrl + '/api/client-sdk/toggles'
    );
    this.eventsUrl = new URL(eventsUrl || remoteUrl + '/api/events');
    this.user = user;
    this.clientSdkKey = clientSdkKey;
    this.refreshInterval = refreshInterval;
    this.toggles = undefined;
  }

  public async start() {
  }

  public stop() {
  }

  public boolValue(key: string, defaultValue: boolean): boolean {
    return this.toggleValue(key, defaultValue, 'boolean') as boolean;
  }

  public numberValue(key: string, defaultValue: number): number {
    return this.toggleValue(key, defaultValue, 'number') as number;
  }

  public stringValue(key: string, defaultValue: string): string {
    return this.toggleValue(key, defaultValue, 'string') as string;
  }

  public jsonValue(key: string, defaultValue: object): object {
    return this.toggleValue(key, defaultValue, 'object') as object;
  }

  public boolDetail(key: string, defaultValue: boolean): FPToggleDetail {
    return this.toggleDetail(key, defaultValue, 'boolean');
  }

  public numberDetail(key: string, defaultValue: number): FPToggleDetail {
    return this.toggleDetail(key, defaultValue, 'number');
  }

  public stringDetail(key: string, defaultValue: string): FPToggleDetail {
    return this.toggleDetail(key, defaultValue, 'string');
  }

  public jsonDetail(key: string, defaultValue: object): FPToggleDetail {
    return this.toggleDetail(key, defaultValue, 'object');
  }

  public allToggles(): { [key: string]: FPToggleDetail } | undefined {
    return Object.assign({}, this.toggles);
  }

  public getUser(): FPUser {
    return Object.assign({}, this.user);
  }

  private toggleValue(key: string, defaultValue: any, valueType: string): any {
    if (this.toggles == undefined) {
      return defaultValue;
    }

    let detail = this.toggles[key];
    if (detail === undefined) {
      return defaultValue;
    }

    let v = detail.value;
    if (typeof v == valueType) {
      return v;
    } else {
      return defaultValue;
    }
  }

  private toggleDetail(
    key: string,
    defaultValue: any,
    valueType: string
  ): FPToggleDetail {
    if (this.toggles == undefined) {
      return {
        value: defaultValue,
        ruleIndex: null,
        variationIndex: null,
        version: 0,
        reason: 'Not ready',
      };
    }

    let detail = this.toggles[key];
    if (detail === undefined) {
      return {
        value: defaultValue,
        ruleIndex: null,
        variationIndex: null,
        version: null,
        reason: 'Toggle: [' + key + '] not found',
      };
    } else if (typeof detail.value === valueType) {
      return detail;
    } else {
      return {
        value: defaultValue,
        ruleIndex: null,
        variationIndex: null,
        version: null,
        reason: 'Value type mismatch',
      };
    }
  }
}