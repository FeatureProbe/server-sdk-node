import { saltHash, Repository, Condition } from "../src/Evaluate";
import { FPUser } from "../src";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const repo = new Repository(require("./fixtures/repo.json"));

test("salt hash", () => {
  expect(saltHash("key", "salt", 10000)).toBe(2647);
});

test("[is in] segment condition match", () => {
  const toggle = repo.toggles["json_toggle"];
  const user = new FPUser().with("city", "4");
  const detail = toggle.eval(user, repo.segments, {});
  expect(detail.value["variation_1"]).toBe("v2");
});

test("[is not in] segment condition match", () => {
  const user = new FPUser().with("city", "100");
  const toggle = repo.toggles["not_in_segment"];
  const detail = toggle.eval(user, repo.segments, {});
  expect(detail.value["not_in"]).toBe(true);
});

test("not match in segment condition", () => {
  const user = new FPUser().with("city", "100");
  const toggle = repo.toggles["json_toggle"];
  const detail = toggle.eval(user, repo.segments, {});
  expect(detail.reason).toBe("Default rule hit.");
});

test("no segments", () => {
  const c = new Condition({
    type: "segment",
    subject: "city?"
    // objects is undefined or empty
  });
  const user = new FPUser().with("city", "100");

  c.predicate = "is in";
  expect(c.meet(user, undefined)).toBeFalsy();
  c.predicate = "is not in";
  expect(c.meet(user, undefined)).toBeFalsy();
});

test("segment invalid predicate", () => {
  const c = new Condition({
    type: "segment",
    subject: "city?"
    // objects is undefined or empty
  });
  const user = new FPUser().stableRollout("key111")
    .with("city", "100");

  c.predicate = "invalid";
  expect(c.meet(user)).toBeFalsy();
});

test("multiple conditions", () => {
  const toggle = repo.toggles["multi_condition_toggle"];

  let user = new FPUser().stableRollout("key11")
    .with("city", "1")
    .with("os", "linux");
  let detail = toggle.eval(user, repo.segments, null);
  expect(detail.value).toStrictEqual({ "variation_0": "" });

  user = new FPUser().stableRollout("key")
    .with("city", "1");
  detail = toggle.eval(user, repo.segments, null);
  expect(detail.reason).toBe("Default rule hit. Warning: User with key 'key' does not have attribute name 'os'");

  user = new FPUser().stableRollout("key")
    .with("os", "linux");
  detail = toggle.eval(user, repo.segments, null);
  expect(detail.reason).toBe("Default rule hit. Warning: User with key 'key' does not have attribute name 'city'");
});

test("toggle disabled", () => {
  const toggle = repo.toggles["disabled_toggle"];
  const user = new FPUser().with("city", "100");
  const detail = toggle.eval(user, repo.segments, null);
  expect(detail.reason).toBe("Toggle disabled");
});

test("[is one of] string condition match", () => {
  const condition = new Condition({
    type: "string",
    predicate: "is one of",
    subject: "name",
    objects: ["hello", "world"]
  });
  const user = new FPUser().with("name", "world");
  expect(condition.meet(user)).toBeTruthy();
});

test("[is not any of] string condition match", () => {
  const condition = new Condition({
    type: "string",
    predicate: "is not any of",
    subject: "name",
    objects: ["hello", "world"]
  });

  const user = new FPUser().with("name", "no");
  expect(condition.meet(user)).toBeTruthy();
  const user1 = new FPUser();
  expect(condition.meet(user1)).toBeFalsy();
});

test("[ends with] string condition match", () => {
  const condition = new Condition({
    type: "string",
    predicate: "ends with",
    subject: "name",
    objects: ["hello", "world"]
  });
  const user = new FPUser().with("name", "the world");
  expect(condition.meet(user)).toBeTruthy();
  user.with("name", "the word");
  expect(condition.meet(user)).toBeFalsy();
});

test("[does not end with] string condition match", () => {
  const condition = new Condition({
    type: "string",
    predicate: "does not end with",
    subject: "name",
    objects: ["hello", "world"]
  });
  const user = new FPUser().with("name", "world111");
  expect(condition.meet(user)).toBeTruthy();
  user.with("name", "my world");
  expect(condition.meet(user)).toBeFalsy();
});

test("[starts with] string condition match", () => {
  const condition = new Condition({
    type: "string",
    predicate: "starts with",
    subject: "name",
    objects: ["hello", "world"]
  });
  const user = new FPUser().with("name", "world!");
  expect(condition.meet(user)).toBeTruthy();
  user.with("name", "the word");
  expect(condition.meet(user)).toBeFalsy();
});

test("[does not start with] string condition match", () => {
  const condition = new Condition({
    type: "string",
    predicate: "does not start with",
    subject: "name",
    objects: ["hello", "world"]
  });
  const user = new FPUser().with("name", "1world111");
  expect(condition.meet(user)).toBeTruthy();
  user.with("name", "world1");
  expect(condition.meet(user)).toBeFalsy();
});

test("[contains] string condition match", () => {
  const condition = new Condition({
    type: "string",
    predicate: "starts with",
    subject: "name",
    objects: ["hello", "world"]
  });
  const user = new FPUser().with("name", "world!");
  expect(condition.meet(user)).toBeTruthy();
  user.with("name", "ord");
  expect(condition.meet(user)).toBeFalsy();
});

test("[does not contain] string condition match", () => {
  const condition = new Condition({
    type: "string",
    predicate: "does not contain",
    subject: "name",
    objects: ["hello", "world"]
  });
  const user = new FPUser().with("name", "1world111");
  expect(condition.meet(user)).toBeFalsy();
  user.with("name", "the wor1d");
  expect(condition.meet(user)).toBeTruthy();
});

test("[matches regex] string condition match", () => {
  const condition = new Condition({
    type: "string",
    predicate: "matches regex",
    subject: "name",
    objects: ["hello\\d", "world.+", "^strict$"]
  });
  const user = new FPUser().with("name", "1world111");
  expect(condition.meet(user)).toBeTruthy();
  user.with("name", "a  hello1\n");
  expect(condition.meet(user)).toBeTruthy();
  user.with("name", "2world");
  expect(condition.meet(user)).toBeFalsy();
  user.with("name", " strict ");
  expect(condition.meet(user)).toBeFalsy();

  // invalid regex
  condition.objects = ["\\\\\\"];
  user.with("name", "\\\\\\");
  expect(condition.meet(user)).toBeFalsy();
});

test("[does not match regex] string condition match", () => {
  const condition = new Condition({
    type: "string",
    predicate: "does not match regex",
    subject: "name",
    objects: ["hello\\d", "world.+", "^strict$"]
  });
  const user = new FPUser().with("name", "1world");
  expect(condition.meet(user)).toBeTruthy();
});

test("[before] datetime condition match", () => {
  const now = Date.now() / 1000;
  const condition = new Condition({
    type: "datetime",
    predicate: "before",
    subject: "created",
    objects: [( now + 10 ).toString()]
  });

  const user = new FPUser();
  expect(condition.meet(user)).toBeTruthy();

  user.with("created", now.toString());
  expect(condition.meet(user)).toBeTruthy();

  user.with("created", ( now + 10 ).toString());
  expect(condition.meet(user)).toBeFalsy();
});

test("[after] datetime condition match", () => {
  const now = Date.now() / 1000;
  const condition = new Condition({
    type: "datetime",
    predicate: "after",
    subject: "created",
    objects: [now.toString()]
  });

  const user = new FPUser();
  expect(condition.meet(user)).toBeTruthy();

  user.with("created", now.toString());
  expect(condition.meet(user)).toBeTruthy();

  user.with("created", ( now + 1 ).toString());
  expect(condition.meet(user)).toBeTruthy();

  user.with("created", ( now - 10 ).toString());
  expect(condition.meet(user)).toBeFalsy();
});

test("datetime condition invalid custom value", () => {
  const now = Date.now() / 1000;
  const condition = new Condition({
    type: "datetime",
    predicate: "before",
    subject: "created",
    objects: [now.toString()]
  });

  const user = new FPUser().with("created", "foo");
  expect(condition.meet(user)).toBeFalsy();

  condition.objects = ["foo"];
  user.with("created", now.toString());
  expect(condition.meet(user)).toBeFalsy();
});

test("[=] number condition match", () => {
  const condition = new Condition({
    type: "number",
    predicate: "=",
    subject: "count",
    objects: ["1", "2", "5"]
  });

  const user = new FPUser().with("count", "5");
  expect(condition.meet(user)).toBeTruthy();

  user.with("count", "4");
  expect(condition.meet(user)).toBeFalsy();
});

test("[!=] number condition match", () => {
  const condition = new Condition({
    type: "number",
    predicate: "!=",
    subject: "count",
    objects: ["1", "2", "5"]
  });

  const user = new FPUser().with("count", "5");
  expect(condition.meet(user)).toBeFalsy();

  user.with("count", "4");
  expect(condition.meet(user)).toBeTruthy();
});

test("[>] number condition match", () => {
  const condition = new Condition({
    type: "number",
    predicate: ">",
    subject: "count",
    objects: ["1.e0", "2", "5"]
  });

  const user = new FPUser().with("count", "1");
  expect(condition.meet(user)).toBeFalsy();

  user.with("count", "\n1.000001 ");
  expect(condition.meet(user)).toBeTruthy();
});

test("[>=] number condition match", () => {
  const condition = new Condition({
    type: "number",
    predicate: ">=",
    subject: "count",
    objects: ["1.e0", "2", "5"]
  });

  const user = new FPUser().with("count", "0.9");
  expect(condition.meet(user)).toBeFalsy();

  user.with("count", "10e-1");
  expect(condition.meet(user)).toBeTruthy();
});

test("[<] number condition match", () => {
  const condition = new Condition({
    type: "number",
    predicate: "<",
    subject: "count",
    objects: ["1.e0", "2", "5"]
  });

  const user = new FPUser().with("count", "3");
  expect(condition.meet(user)).toBeTruthy();

  user.with("count", "7");
  expect(condition.meet(user)).toBeFalsy();
});

test("[<=] number condition match", () => {
  const condition = new Condition({
    type: "number",
    predicate: "<=",
    subject: "count",
    objects: ["1.e0", "2", "5"]
  });

  const user = new FPUser().with("count", "1");
  expect(condition.meet(user)).toBeTruthy();

  user.with("count", "10e-100");
  expect(condition.meet(user)).toBeTruthy();

  user.with("count", "10e100");
  expect(condition.meet(user)).toBeFalsy();
});

test("invalid number condition", () => {
  const condition = new Condition({
    type: "number",
    predicate: "?=",
    subject: "count",
    objects: ["1.e0", "2", "5"]
  });

  // invalid predicate
  const user = new FPUser().with("count", "1");
  expect(condition.meet(user)).toBeFalsy();

  // invalid customValue
  condition.predicate = "=";
  user.with("count", "foo");
  expect(condition.meet(user)).toBeFalsy();

  // invalid customValue + object
  condition.objects = ["foo", "bar"];
  expect(condition.meet(user)).toBeFalsy();

  // invalid object
  user.with("count", "2");
  expect(condition.meet(user)).toBeFalsy();

  condition.objects = ["foo", "bar", "2"];
  expect(condition.meet(user)).toBeTruthy();
});

test("[=] semver condition match", () => {
  const condition = new Condition({
    type: "semver",
    predicate: "=",
    subject: "ver",
    objects: ["1.0.0-rc1", "2.0.1", "2.1.0-beta2+build1201293821"]
  });

  const user = new FPUser().with("ver", "1.0.0-rc1+build212");
  expect(condition.meet(user)).toBeTruthy();

  user.with("ver", "2.0.1+build3232231");
  expect(condition.meet(user)).toBeTruthy();

  user.with("ver", "2.0.1-rc3");
  expect(condition.meet(user)).toBeFalsy();
});

test("[!=] semver condition match", () => {
  const condition = new Condition({
    type: "semver",
    predicate: "!=",
    subject: "ver",
    objects: ["1.0.0-rc1", "2.0.1", "2.1.0-beta2+build1201293821"]
  });

  const user = new FPUser().with("ver", "1.1.0");
  expect(condition.meet(user)).toBeTruthy();

  user.with("ver", "2.0.1");
  expect(condition.meet(user)).toBeFalsy();

  user.with("ver", "1.0.0-rc1+foo");
  expect(condition.meet(user)).toBeFalsy();

  user.with("ver", "2.1.0-beta2");
  expect(condition.meet(user)).toBeFalsy();
});

test("[>] semver condition match", () => {
  const condition = new Condition({
    type: "semver",
    predicate: ">",
    subject: "ver",
    objects: ["1.0.0-rc1", "2.0.1", "2.1.0-beta2+build1201293821"]
  });

  const user = new FPUser().with("ver", "1.0.0-rc2");
  expect(condition.meet(user)).toBeTruthy();

  user.with("ver", "1.0.0-rc1");
  expect(condition.meet(user)).toBeFalsy();
});

test("[>=] semver condition match", () => {
  const condition = new Condition({
    type: "semver",
    predicate: ">=",
    subject: "ver",
    objects: ["1.0.0-rc1", "2.0.1", "2.1.0-beta2+build1201293821"]
  });

  const user = new FPUser().with("ver", "1.1.0");
  expect(condition.meet(user)).toBeTruthy();

  user.with("ver", "2.0.1");
  expect(condition.meet(user)).toBeTruthy();

  user.with("ver", "0.1.0");
  expect(condition.meet(user)).toBeFalsy();
});

test("[<] semver condition match", () => {
  const condition = new Condition({
    type: "semver",
    predicate: "<",
    subject: "ver",
    objects: ["1.0.0-rc1", "2.0.1", "2.1.0-beta2+build1201293821"]
  });

  const user = new FPUser().with("ver", "1.1.0");
  expect(condition.meet(user)).toBeTruthy();

  user.with("ver", "2.1.0-beta2");
  expect(condition.meet(user)).toBeFalsy();
});

test("[<=] semver condition match", () => {
  const condition = new Condition({
    type: "semver",
    predicate: "<=",
    subject: "ver",
    objects: ["1.0.0-rc1", "2.0.1", "2.1.0-beta2+build1201293821"]
  });

  const user = new FPUser().with("ver", "1.0.0");
  expect(condition.meet(user)).toBeTruthy();

  user.with("ver", "2.0.1-alpha1");
  expect(condition.meet(user)).toBeTruthy();

  user.with("ver", "2.1.0-beta2");
  expect(condition.meet(user)).toBeTruthy();

  user.with("ver", "2.1.0-beta3");
  expect(condition.meet(user)).toBeFalsy();
});

test("invalid semver condition", () => {

  const condition = new Condition({
    type: "semver",
    predicate: ">=",
    subject: "ver",
    objects: ["foo"]
  });

  // invalid predicate
  const user = new FPUser().with("ver", "1.0.0");
  expect(condition.meet(user)).toBeFalsy();

  user.with("ver", "foo");
  expect(condition.meet(user)).toBeFalsy();

  condition.objects = ["1.2.1"];
  expect(condition.meet(user)).toBeFalsy();
});
