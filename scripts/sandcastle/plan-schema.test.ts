import assert from "node:assert/strict";
import { test } from "node:test";
import { planSchema } from "./plan-schema.ts";

const validate = (value: unknown): ReturnType<typeof planSchema["~standard"]["validate"]> =>
  planSchema["~standard"].validate(value);

await test("planSchema accepts a plan and returns its issues", () => {
  const plan = { issues: [{ id: "42", title: "Fix auth bug", branch: "sandcastle/issue-42" }] };
  assert.deepEqual(validate(plan), { value: plan });
  assert.deepEqual(validate({ issues: [] }), { value: { issues: [] } });
});

await test("planSchema refuses a plan with the wrong shape, naming where", () => {
  const failing: [string, unknown, string][] = [
    ["a non-object", "nope", ""],
    ["null", null, ""],
    ["no issues list", {}, "issues"],
    ["issues that is not an array", { issues: "x" }, "issues"],
    ["an issue that is not an object", { issues: [1] }, "issues.0"],
    ["a numeric id", { issues: [{ id: 42, title: "t", branch: "sandcastle/issue-42" }] }, "issues.0.id"],
    ["a missing title", { issues: [{ id: "1", branch: "sandcastle/issue-1" }] }, "issues.0.title"],
    ["a missing branch", { issues: [{ id: "1", title: "t" }] }, "issues.0.branch"],
    ["an id that is not a number", { issues: [{ id: "1; rm", title: "t", branch: "sandcastle/issue-1" }] }, "issues.0.id"],
    ["a branch outside sandcastle/issue-N", { issues: [{ id: "1", title: "t", branch: "main" }] }, "issues.0.branch"],
    ["a branch that starts with a dash", { issues: [{ id: "1", title: "t", branch: "--all" }] }, "issues.0.branch"],
    ["a branch that names another issue", { issues: [{ id: "1", title: "t", branch: "sandcastle/issue-2" }] }, "issues.0.branch"],
    ["an id with a leading zero", { issues: [{ id: "007", title: "t", branch: "sandcastle/issue-007" }] }, "issues.0.id"],
    ["an empty title", { issues: [{ id: "1", title: "  ", branch: "sandcastle/issue-1" }] }, "issues.0.title"],
    ["the same issue twice", { issues: [{ id: "1", title: "t", branch: "sandcastle/issue-1" }, { id: "1", title: "u", branch: "sandcastle/issue-1" }] }, "issues.1.id"],
    ["a branch with a path suffix", { issues: [{ id: "1", title: "t", branch: "sandcastle/issue-1/../x" }] }, "issues.0.branch"],
  ];
  for (const [name, value, path] of failing) {
    const result = validate(value);
    assert.ok("issues" in result && result.issues.length > 0, name);
    assert.equal("issues" in result ? result.issues[0]?.path.join(".") : undefined, path, name);
  }
});

await test("planSchema normalises a title instead of refusing the plan", () => {
  const titled = (title: string): unknown => {
    const result = validate({ issues: [{ id: "3", title, branch: "sandcastle/issue-3" }] });
    return "value" in result ? result.value.issues[0]?.title : result;
  };
  assert.equal(titled("Fix `foo` crash"), "Fix 'foo' crash");
  assert.equal(titled("  two\nlines\r\n here "), "two lines here");
  assert.equal(titled("bell\u0007 and \u001b[31mred"), "bell and [31mred");
  assert.equal(titled("x".repeat(250)), "x".repeat(200));
  assert.equal(titled("a\u202Eb\u200Bc"), "abc", "bidi and zero-width format characters are removed");
  assert.equal(titled("\u{1F600}".repeat(250)), "\u{1F600}".repeat(200), "cut by code point, never inside a surrogate pair");
});

// Sandcastle's extractObject (dist/index.js, 0.12.0) treats a truthy `issues` on the result as
// a validation failure and otherwise returns `value`; extractStructuredOutput is not exported, so
// the test applies that same contract to the schema's results.
await test("planSchema results follow the contract Sandcastle's Output.object reads", () => {
  const plan = { issues: [{ id: "7", title: "t", branch: "sandcastle/issue-7" }] };
  const accepted = validate(plan);
  assert.ok("value" in accepted && !("issues" in accepted), "a plan must not carry a top-level issues key on success");
  assert.deepEqual(accepted.value, plan);
  for (const bad of [{ issues: [{ id: "x", title: "t", branch: "sandcastle/issue-x" }] }, { issues: 3 }, null]) {
    const refused = validate(bad);
    assert.ok("issues" in refused && refused.issues.length > 0 && !("value" in refused));
  }
});
