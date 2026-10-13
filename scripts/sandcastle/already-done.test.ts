import assert from "node:assert/strict";
import { test } from "node:test";
import { createRepo } from "../test-support/repo-fixture.ts";
import { pendingIssues } from "./already-done.ts";

const issue = (id: string): { id: string; title: string; branch: string } =>
  ({ id, title: `Issue ${id}`, branch: `sandcastle/issue-${id}` });

await test("pendingIssues drops an issue whose branch is merged into HEAD and keeps the rest", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    repo.git(["switch", "--quiet", "-c", "sandcastle/issue-1"]);
    repo.write("one.txt", "1");
    repo.commit("feat: one");
    repo.git(["switch", "--quiet", "main"]);
    repo.git(["merge", "--quiet", "--no-ff", "--no-edit", "sandcastle/issue-1"]);
    repo.git(["switch", "--quiet", "-c", "sandcastle/issue-2"]);
    repo.write("two.txt", "2");
    repo.commit("feat: two");
    repo.git(["switch", "--quiet", "main"]);
    const planned = [issue("1"), issue("2"), issue("3")];
    assert.deepEqual(pendingIssues(planned, repo.dir).map((entry) => entry.id), ["2", "3"]);
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues keeps an issue whose branch does not exist, even when a tag has that name", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    repo.git(["tag", "sandcastle/issue-4"]);
    assert.deepEqual(pendingIssues([issue("4")], repo.dir), [issue("4")]);
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues keeps a branch that is ahead of HEAD or diverged from it", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    repo.git(["switch", "--quiet", "-c", "sandcastle/issue-5"]);
    repo.write("five.txt", "5");
    repo.commit("feat: five");
    repo.git(["switch", "--quiet", "main"]);
    repo.write("main.txt", "m");
    repo.commit("chore: main moves on");
    assert.deepEqual(pendingIssues([issue("5")], repo.dir), [issue("5")]);
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues does not read a branch name that looks like an option as one", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    const planned = [{ id: "6", title: "Odd", branch: "--all" }];
    assert.deepEqual(pendingIssues(planned, repo.dir), planned);
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues refuses when the directory is not a repository", () => {
  const repo = createRepo();
  repo.cleanup();
  assert.throws(() => pendingIssues([issue("7")], repo.dir));
});
