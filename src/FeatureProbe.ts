import { FPUser } from './FPUser';
import { FPToggleDetail, FPConfig } from './type';

export default class FeatureProbe {
  constructor({
                remoteUrl,
                togglesUrl,
                eventsUrl,
                clientSdkKey,
                user,
              }: FPConfig) {

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

  private toggleValue(key: string, defaultValue: any, valueType: string): any {

  }

  private toggleDetail(
      key: string,
      defaultValue: any,
      valueType: string
  ): any {

  }
}