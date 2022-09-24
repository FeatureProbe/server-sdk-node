export class FPUser {

  private _key: string;
  private readonly _attrs: { [key: string]: string };

  constructor() {
    this._key = Date.now().toString();
    this._attrs = {};
  }

  get key(): string {
    return this._key;
  }

  get attrs(): { [key: string]: string } {
    return Object.assign({}, this._attrs);
  }

  public stableRollout(key: string): FPUser {
    this._key = key;
    return this;
  }

  public with(attrName: string, attrValue: string): FPUser {
    this._attrs[attrName] = attrValue;
    return this;
  }

  public extendAttrs(attrs: { [key: string]: string }): FPUser {
    for (const key in attrs) {
      this._attrs[key] = attrs[key];
    }
    return this;
  }

  getAttr(attrName: string): string | undefined {
    return this._attrs[attrName];
  }

}
