import { FPUser } from "../src";

test("simple", () => {
  const user = new FPUser().stableRollout("uniqKey")
    .with("city", "shenzhen")
    .with("os", "macos");

  expect(user.getAttr("os")).toBe("macos");
  expect(Object.keys(user.attrs).length).toBe(2);
  expect(user.key).toBe("uniqKey");
});

test("user auto generated key", () => {
  const user = new FPUser();

  expect(user.key).toBeDefined();
  expect(user.key.length).toBe(13);
});
