'use strict';

/**
 * A collection of attributes that can affect toggle evaluation,
 * usually corresponding to a user of your application.
 */
export class FPUser {

  private _key: string;
  private readonly _attrs: { [key: string]: string };

  /**
   * Creates a new FPUser.
   *
   * @param stableRollout sets user with a unique id for percentage rollout, by default, a timestamp will be assigned as the key
   */
  constructor(stableRollout?: string) {
    this._key = stableRollout ?? Date.now().toString();
    this._attrs = {};
  }

  /**
   * Gets the key of user.
   *
   * The key may be manually defined for {@link stableRollout}, or auto generated (timestamp).
   */
  get key(): string {
    return this._key;
  }

  /**
   * Gets a copy of the user's attributions (custom values).
   */
  get attrs(): { [key: string]: string } {
    return Object.assign({}, this._attrs);
  }

  /**
   * Sets user with a unique id for percentage rollout.
   * @param key user unique id for percentage rollout
   */
  public stableRollout(key: string): FPUser {
    this._key = key;
    return this;
  }

  /**
   * Adds an attribute to the user.
   * @param attrName attribute name
   * @param attrValue attribute value
   * @return the FPUser
   */
  public with(attrName: string, attrValue: string): FPUser {
    this._attrs[attrName] = attrValue;
    return this;
  }

  /**
   * Adds multiple attributes to the user.
   * @param attrs a map of attributions
   * @return the FPUser
   */
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
