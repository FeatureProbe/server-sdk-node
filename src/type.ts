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
  refreshInterval: number;
  remoteUrl?: URL | string;
  togglesUrl?: URL | string;
  eventsUrl?: URL | string;
  logger?: pino.Logger;
}
