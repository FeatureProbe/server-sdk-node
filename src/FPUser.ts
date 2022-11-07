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
