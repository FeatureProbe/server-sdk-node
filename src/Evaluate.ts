'use strict';

import { FPToggleDetail } from './type';
import { FPUser } from './FPUser';

import { createHash } from 'crypto';

const SemVer = require('semver/classes/semver');

const Defaults = {
  Split: {
    bucketSize: 10000,
    invalidIndex: -1
  }
};

export class Repository {
  private _toggles: { [key: string]: Toggle };
  private _segments: { [key: string]: Segment };

  private _initialized = false;
  private _updatedTimestamp = 0;

  constructor(json: any) {
    this._toggles = {};
    this._segments = {};
    for (const tk in json.toggles || {}) {
      this._toggles[tk] = new Toggle(json.toggles[tk]);
    }
    for (const sk in json.segments || {}) {
      this._segments[sk] = new Segment(json.segments[sk]);
    }
  }

  get toggles(): { [key: string]: Toggle } {
    return Object.assign({}, this._toggles);
  }

  set toggles(value: { [key: string]: Toggle }) {
    this._toggles = value;
  }

  get segments(): { [key: string]: Segment } {
    return this._segments;
  }

  set segments(value: { [p: string]: Segment }) {
    this._segments = value;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  set initialized(value: boolean) {
    this._initialized = value;
  }

  get updatedTimestamp(): number {
    return this._updatedTimestamp;
  }

  set updatedTimestamp(value: number) {
    this._updatedTimestamp = value;
  }

  public getToggle(key: string): Toggle | undefined {
    return this._toggles[key];
  }

  public clear() {
    this._toggles = {};
    this._segments = {};
  }
}

export class Toggle {
  private _key: string;
  private _enabled: boolean;
  private _version: number;
  private _forClient: boolean;
  private _disabledServe: Serve | null;
  private _defaultServe: Serve | null;
  private _rules: Rule[];
  private _variations: any[];

  constructor(json: any) {
    this._key = json.key;
    this._enabled = json.enabled || false;
    this._version = json.version || 1;
    this._forClient = json.forClient || false;
    this._disabledServe = json.disabledServe ? new Serve(json.disabledServe) : null;
    this._defaultServe = json.defaultServe ? new Serve(json.defaultServe) : null;
    this._rules = [];
    for (const r of json.rules || []) {
      this._rules.push(new Rule(r));
    }
    this._variations = json.variations || [];
  }

  get key(): string {
    return this._key;
  }

  set key(value: string) {
    this._key = value;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
  }

  get version(): number {
    return this._version;
  }

  set version(value: number) {
    this._version = value;
  }

  get forClient(): boolean {
    return this._forClient;
  }

  set forClient(value: boolean) {
    this._forClient = value;
  }

  get disabledServe(): Serve | null {
    return this._disabledServe;
  }

  set disabledServe(value: Serve | null) {
    this._disabledServe = value;
  }

  get defaultServe(): Serve | null {
    return this._defaultServe;
  }

  set defaultServe(value: Serve | null) {
    this._defaultServe = value;
  }

  get rules(): Rule[] {
    return this._rules;
  }

  set rules(value: Rule[]) {
    this._rules = value;
  }

  get variations(): any[] {
    return this._variations;
  }

  set variations(value: any[]) {
    this._variations = value;
  }

  public eval(user: FPUser, segments: { [key: string]: Segment }, defaultValue: any): FPToggleDetail {
    if (!this._enabled) {
      return this.disabledResult(user, this._key, defaultValue);
    }
    let warning: string | undefined;
    if (this._rules?.length > 0) {
      for (let i = 0; i < this._rules.length; i++) {
        const rule = this._rules[i];
        const hitResult = rule.hit(user, segments, this._key);
        if (hitResult.hit) {
          return this.hitValue(hitResult, defaultValue, i);
        }
        warning = hitResult.reason;
      }
    }
    return this.defaultResult(user, this._key, defaultValue, warning);
  }

  private hitValue(hitResult: IHitResult | undefined, defaultValue: any, ruleIndex?: number): FPToggleDetail {
    const res = {
      value: defaultValue,
      ruleIndex: ruleIndex || null,
      variationIndex: hitResult?.index || null,
      version: this._version,
      reason: hitResult?.reason || null
    } as FPToggleDetail;

    if (hitResult?.index !== undefined) {
      res.value = this._variations[hitResult.index];
      if (ruleIndex !== undefined) {
        res.reason = `Rule ${ruleIndex} hit`;
      }
    }
    return res;
  }

  private disabledResult(user: FPUser, toggleKey: string, defaultValue: any): FPToggleDetail {
    const disabledResult = this.hitValue(this._disabledServe?.evalIndex(user, toggleKey), defaultValue);
    disabledResult.reason = 'Toggle disabled';
    return disabledResult;
  }

  private defaultResult(user: FPUser, toggleKey: string, defaultValue: any, warning?: string): FPToggleDetail {
    const defaultResult = this.hitValue(this._defaultServe?.evalIndex(user, toggleKey), defaultValue);
    defaultResult.reason = `Default rule hit. ${warning ?? ''}`.trimEnd();
    return defaultResult;
  }
}

class Segment {
  private _key: string;
  private _uniqueId: string;
  private _version: number;
  private _rules: Rule[];

  constructor(json: any) {
    this._key = json.key;
    this._uniqueId = json.uniqueId;
    this._version = json.version;
    this._rules = [];
    for (const r of json.rules || []) {
      this._rules.push(new Rule(r));
    }
  }

  get key(): string {
    return this._key;
  }

  set key(value: string) {
    this._key = value;
  }

  get uniqueId(): string {
    return this._uniqueId;
  }

  set uniqueId(value: string) {
    this._uniqueId = value;
  }

  get version(): number {
    return this._version;
  }

  set version(value: number) {
    this._version = value;
  }

  get rules(): Rule[] {
    return this._rules;
  }

  set rules(value: Rule[]) {
    this._rules = value;
  }

  public contains(user: FPUser, segments: { [key: string]: Segment }) {
    return this._rules.some(rule =>
      !rule.conditions.some(c =>
        c.type !== 'segment' && user.getAttr(c.subject) === undefined
        || !c.meet(user, segments)
      )
    );
  }
}

class Serve {
  private _select: number;
  private _split: Split | null;

  constructor(json: any) {
    this._select = json.select;
    this._split = json.split ? new Split(json.split) : null;
  }

  get select(): number {
    return this._select;
  }

  set select(value: number) {
    this._select = value;
  }

  get split(): Split | null {
    return this._split;
  }

  set split(value: Split | null) {
    this._split = value;
  }

  public evalIndex(user: FPUser, toggleKey: string): IHitResult {
    if (this._select) {
      return {
        hit: true,
        index: this._select
      } as IHitResult;
    }
    return this._split?.findIndex(user, toggleKey) || {
      hit: false,
      reason: 'Serve.split is null'
    } as IHitResult;
  }
}

class Rule {
  private _serve: Serve | null;
  private _conditions: Condition[];

  constructor(json: any) {
    this._serve = json.serve ? new Serve(json.serve) : null;
    this._conditions = [];
    for (const cond of json.conditions || []) {
      this._conditions.push(new Condition(cond));
    }
  }

  get serve(): Serve | null {
    return this._serve;
  }

  set serve(value: Serve | null) {
    this._serve = value;
  }

  get conditions(): Condition[] {
    return this._conditions;
  }

  set conditions(value: Condition[]) {
    this._conditions = value;
  }

  public hit(user: FPUser, segments: { [key: string]: Segment }, toggleKey: string): IHitResult {
    for (const condition of this._conditions) {
      if (!['segment', 'datetime'].includes(condition.type)
        && user.getAttr(condition.subject) === undefined) {
        return {
          hit: false,
          reason: `Warning: User with key '${user.key}' does not have attribute name '${condition.subject}'`
        } as IHitResult;
      }
      if (!condition.meet(user, segments)) {
        return {
          hit: false
        } as IHitResult;
      }
    }
    return this._serve?.evalIndex(user, toggleKey) || {
      hit: false,
      reason: 'Rule.serve is null'
    } as IHitResult;
  }
}

export class Split {
  private _distribution: number[][][];
  private _bucketBy: string;
  private _salt: string;

  constructor(json: any) {
    this._distribution = json.distribution || [];
    this._bucketBy = json.bucketBy;
    this._salt = json.salt;
  }

  get distribution(): number[][][] {
    return this._distribution;
  }

  set distribution(value: number[][][]) {
    this._distribution = value;
  }

  get bucketBy(): string {
    return this._bucketBy;
  }

  set bucketBy(value: string) {
    this._bucketBy = value;
  }

  get salt(): string {
    return this._salt;
  }

  set salt(value: string) {
    this._salt = value;
  }

  public findIndex(user: FPUser, toggleKey: string): IHitResult {
    let hashKey = user.key;
    if (this._bucketBy?.trim().length > 0) {
      if (user.getAttr(this._bucketBy) !== undefined) {
        hashKey = user.getAttr(this._bucketBy) ?? user.key;
      } else {
        return {
          hit: false,
          reason: `Warning: User with key '${user.key}' does not have attribute name '${this._bucketBy}'`
        } as IHitResult;
      }
    }
    const groupIndex = this.getGroup(saltHash(hashKey, this._salt || toggleKey, Defaults.Split.bucketSize));
    return {
      hit: true,
      index: groupIndex,
      reason: `selected ${groupIndex} percentage group`
    } as IHitResult;
  }

  private getGroup(hashValue: number): number {
    for (let i = 0; i < this._distribution.length; i++) {
      const groups = this._distribution[i];
      for (const range of groups) {
        if (hashValue >= range[0] && hashValue < range[1]) {
          return i;
        }
      }
    }
    return Defaults.Split.invalidIndex;
  }
}

export class Condition {
  private _subject: string;
  private _objects: string[];
  private _type: 'string' | 'segment' | 'datetime' | 'semver' | 'number';
  private _predicate: string;

  constructor(json: any) {
    this._subject = json.subject;
    this._objects = json.objects || [];
    this._type = json.type;
    this._predicate = json.predicate;
  }

  get subject(): string {
    return this._subject;
  }

  set subject(value: string) {
    this._subject = value;
  }

  get objects(): string[] {
    return this._objects;
  }

  set objects(value: string[]) {
    this._objects = value;
  }

  get type(): 'string' | 'segment' | 'datetime' | 'semver' | 'number' {
    return this._type;
  }

  set type(value: 'string' | 'segment' | 'datetime' | 'semver' | 'number') {
    this._type = value;
  }

  get predicate(): string {
    return this._predicate;
  }

  set predicate(value: string) {
    this._predicate = value;
  }

  private static readonly StringPredicate: {
    [key: string]: (target: string, objects: string[]) => boolean
  } = {
    'is one of': (target, objects) => objects.some(o => target === o),
    'ends with': (target, objects) => objects.some(o => target.endsWith(o)),
    'starts with': (target, objects) => objects.some(o => target.startsWith(o)),
    'contains': (target, objects) => objects.some(o => target.includes(o)),
    'matches regex': (target, objects) => objects.some(o => new RegExp(o).test(target)),
    'is not any of': (target, objects) => !objects.some(o => target === o),
    'does not end with': (target, objects) => !objects.some(o => target.endsWith(o)),
    'does not start with': (target, objects) => !objects.some(o => target.startsWith(o)),
    'does not contain': (target, objects) => !objects.some(o => target.includes(o)),
    'does not match regex': (target, objects) => !objects.some(o => new RegExp(o).test(target))
  };

  private static readonly SegmentPredicate: {
    [key: string]: (user: FPUser, objects: string[], segments: { [key: string]: Segment }) => boolean
  } = {
    'is in': (user, objects, segments) => objects.some(o => segments?.[o]?.contains(user, segments)),
    'is not in': (user, objects, segments) => !objects.some(o => segments?.[o]?.contains(user, segments))
  };

  private static readonly DatetimePredicate: {
    [key: string]: (target: number, objects: string[]) => boolean
  } = {
    'after': (target, objects) => objects.some(o => target >= parseInt(o)),
    'before': (target, objects) => objects.some(o => target < parseInt(o))
  };

  private static readonly NumberPredicate: {
    [key: string]: (customValue: number, objects: string[]) => boolean
  } = {
    '=': (cv, objects) => objects.some(o => cv == parseFloat(o)),
    '!=': (cv, objects) => !objects.some(o => cv == parseFloat(o)),
    '>': (cv, objects) => objects.some(o => cv > parseFloat(o)),
    '>=': (cv, objects) => objects.some(o => cv >= parseFloat(o)),
    '<': (cv, objects) => objects.some(o => cv < parseFloat(o)),
    '<=': (cv, objects) => objects.some(o => cv <= parseFloat(o))
  };

  private static readonly SemverPredicate: {
    [key: string]: (customValue: typeof SemVer, objects: string[]) => boolean
  } = {
    '=': (cv, objects) => objects.some(o => cv.compare(o) === 0),
    '!=': (cv, objects) => !objects.some(o => cv.compare(o) === 0),
    '>': (cv, objects) => objects.some(o => cv.compare(o) > 0),
    '>=': (cv, objects) => objects.some(o => cv.compare(o) >= 0),
    '<': (cv, objects) => objects.some(o => cv.compare(o) < 0),
    '<=': (cv, objects) => objects.some(o => cv.compare(o) <= 0)
  };

  public meet(user: FPUser, segments?: { [key: string]: Segment }): boolean {
    switch (this._type) {
      case 'string':
        return this.matchStringPredicate(user);
      case 'segment':
        return !!segments && this.matchSegmentPredicate(user, segments);
      case 'datetime':
        return this.matchDatetimePredicate(user);
      case 'semver':
        return this.matchSemverPredicate(user);
      case 'number':
        return this.matchNumberPredicate(user);
      default:
        return false;
    }
  }

  private matchStringPredicate(user: FPUser): boolean {
    const subjectVal = user.attrs[this._subject];
    if (!subjectVal?.trim().length) {
      return false;
    }
    try {
      return !!Condition.StringPredicate[this._predicate]?.(subjectVal, this._objects);
    } catch {
      return false;
    }
  }

  private matchSegmentPredicate(user: FPUser, segments: { [key: string]: Segment }): boolean {
    return !!( Condition.SegmentPredicate )[this._predicate]?.(user, this._objects, segments);
  }

  private matchDatetimePredicate(user: FPUser): boolean {
    const res = user.attrs[this._subject];
    let cv: number;
    try {
      cv = res === undefined ? Date.now() / 1000 : parseFloat(res);
      return !isNaN(cv) && !!Condition.DatetimePredicate[this._predicate]?.(cv, this._objects);
    } catch {
      return false;
    }
  }

  private matchSemverPredicate(user: FPUser): boolean {
    try {
      const cv = new SemVer(user.attrs[this._subject]);
      return !!Condition.SemverPredicate[this._predicate]?.(cv, this._objects);
    } catch {
      return false;
    }
  }

  private matchNumberPredicate(user: FPUser): boolean {
    try {
      const cv = parseFloat(user.attrs[this._subject]);
      return !isNaN(cv) && !!Condition.NumberPredicate[this._predicate]?.(cv, this._objects);
    } catch {
      return false;
    }
  }
}

export interface IHitResult {
  hit: boolean;
  index?: number;
  reason?: string;
}

export function saltHash(key: string, salt: string, bucketSize: number): number {
  const sha = createHash('sha1').update(key + salt);
  const bytes = sha.digest('hex').slice(-8);
  return parseInt(bytes, 16) % bucketSize;
}
