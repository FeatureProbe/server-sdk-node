import { FPUser } from './FPUser';
import { createHash } from 'crypto';

export default class Evaluate {

  public saltHash(key: string, salt: string, bucketSize: number): number {
    const sha = createHash('sha1').update(key + salt);
    console.log(sha.digest('hex'));
    // const bytes = sha.digest('hex').slice(-4, 4);
    // console.log(bytes);
    return 1;
  }

  public selectVariation() {
  }

}

interface Repository {
  toggles: { [key: string]: Toggle };
  segments: { [key: string]: Segment };
}

interface Toggle {
  key: string;
  enabled: boolean;
  version: number;
  forClient: boolean;
  disabledServe: Serve;
  defaultServe: Serve;
  rules: Rule[];
  variations: object[];
}

interface Segment {
  key: string;
  uniqueId: string;
  version: number;
  rules: Rule[];
}

interface Serve {
  select: number;
  split: Split;
}

interface Rule {
  serve: Serve;
  conditions: Condition[];
}

interface Split {
  distribution: Distribution[];
  bucketBy: string;
  salt: string;
}

interface Distribution {
  distribution: number[][];
}

type invalidCondition = string;

interface Condition {
  subject: string;
  objects: string[];

  type:
      | 'string'
      | 'segment'
      | 'datetime'
      | 'number'
      | 'semver'
      | invalidCondition;

  predicate:
      | 'is one of'
      | 'ends with'
      | 'starts with'
      | 'contains'
      | 'matches regex'
      | 'is not any of'
      | 'does not end with'
      | 'does not start with'
      | 'does not contain'
      | 'does not match regex'
      | 'is in'
      | 'is not in'
      | 'after'
      | 'before'
      | '='
      | '!='
      | '>'
      | '>='
      | '<'
      | '<='
      | invalidCondition;
}

export interface EvalDetail {
  value: string;
  ruleIndex: number | null;
  variationIndex: number | null;
  version: number;
  reason: string;
}

interface EvalParams {
  key: string;
  isDetail: boolean;
  user: FPUser;
  variations: [];
  segments: { [key: string]: Segment };
}
