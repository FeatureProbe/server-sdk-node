import { FPUser } from './FPUser';

export interface FeatureProbe {};

export interface FPToggleDetail {
  value: boolean | string | number | object;
  ruleIndex: number | null;
  variationIndex: number | null;
  version: number | null;
  reason: string;
}

export interface FPConfig {
  remoteUrl?: string;
  togglesUrl?: string;
  eventsUrl?: string;
  clientSdkKey: string;
  user: FPUser;
}