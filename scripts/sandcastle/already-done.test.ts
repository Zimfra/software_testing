import assert from "node:assert/strict";
import { test } from "node:test";
import { createRepo } from "../test-support/repo-fixture.ts";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { aheadIssues, pendingIssues } from "./already-done.ts";

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

await test("pendingIssues keeps an issue whose branch name looks like an option, without reading it as one", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    const planned = [{ id: "6", title: "Odd", branch: "--all" }];
    assert.deepEqual(pendingIssues(planned, repo.dir), planned);
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues keeps a branch that was created at HEAD and never got a commit", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    repo.git(["branch", "sandcastle/issue-8"]);
    assert.deepEqual(pendingIssues([issue("8")], repo.dir), [issue("8")], "same commit as HEAD");
    repo.write("later.txt", "l");
    repo.commit("chore: HEAD moves on");
    assert.deepEqual(pendingIssues([issue("8")], repo.dir), [issue("8")], "an ancestor of HEAD");
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues keeps a branch whose only reflog entries are a reset, not a commit", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    repo.git(["branch", "sandcastle/issue-10"]);
    repo.write("later.txt", "l");
    repo.commit("chore: HEAD moves on");
    repo.git(["branch", "--force", "sandcastle/issue-10", "HEAD"]);
    assert.deepEqual(pendingIssues([issue("10")], repo.dir), [issue("10")]);
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues keeps an empty branch that only fast-forwarded to a later HEAD or was renamed", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    repo.git(["branch", "sandcastle/issue-11"]);
    repo.write("later.txt", "l");
    repo.commit("chore: HEAD moves on");
    repo.git(["switch", "--quiet", "sandcastle/issue-11"]);
    repo.git(["merge", "--quiet", "--ff-only", "main"]);
    repo.git(["switch", "--quiet", "main"]);
    assert.deepEqual(pendingIssues([issue("11")], repo.dir), [issue("11")], "a fast-forward merge is not work");
    repo.git(["branch", "--move", "sandcastle/issue-11", "sandcastle/issue-12"]);
    assert.deepEqual(pendingIssues([issue("12")], repo.dir), [issue("12")], "a rename is not work");
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues drops a branch whose commits were fast-forwarded into HEAD", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    repo.git(["switch", "--quiet", "-c", "sandcastle/issue-9"]);
    repo.write("nine.txt", "9");
    repo.commit("feat: nine");
    repo.git(["switch", "--quiet", "main"]);
    repo.git(["merge", "--quiet", "--ff-only", "sandcastle/issue-9"]);
    assert.deepEqual(pendingIssues([issue("9")], repo.dir), []);
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues keeps a branch an agent reset back to where it started", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    repo.git(["switch", "--quiet", "-c", "sandcastle/issue-13"]);
    repo.write("thirteen.txt", "13");
    repo.commit("feat: thirteen");
    repo.git(["reset", "--quiet", "--hard", "main"]);
    repo.git(["switch", "--quiet", "main"]);
    assert.deepEqual(pendingIssues([issue("13")], repo.dir), [issue("13")]);
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues counts cherry-picked and reverted commits as the branch's own", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    repo.git(["switch", "--quiet", "-c", "elsewhere"]);
    repo.write("picked.txt", "p");
    const picked = repo.commit("feat: picked");
    repo.git(["switch", "--quiet", "main"]);
    repo.git(["switch", "--quiet", "-c", "sandcastle/issue-14"]);
    repo.git(["cherry-pick", picked]);
    repo.git(["switch", "--quiet", "-c", "sandcastle/issue-15", "main"]);
    repo.git(["cherry-pick", picked]);
    repo.git(["revert", "--no-edit", "HEAD"]);
    repo.git(["switch", "--quiet", "main"]);
    repo.git(["merge", "--quiet", "--no-ff", "--no-edit", "sandcastle/issue-14"]);
    repo.git(["merge", "--quiet", "--no-ff", "--no-edit", "sandcastle/issue-15"]);
    assert.deepEqual(pendingIssues([issue("14"), issue("15")], repo.dir), []);
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues keeps a branch whose reflog is gone", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    repo.git(["switch", "--quiet", "-c", "sandcastle/issue-16"]);
    repo.write("sixteen.txt", "16");
    repo.commit("feat: sixteen");
    repo.git(["switch", "--quiet", "main"]);
    repo.git(["merge", "--quiet", "--ff-only", "sandcastle/issue-16"]);
    rmSync(join(repo.dir, ".git", "logs", "refs", "heads", "sandcastle", "issue-16"));
    assert.deepEqual(pendingIssues([issue("16")], repo.dir), [issue("16")]);
  } finally {
    repo.cleanup();
  }
});

await test("aheadIssues lists the planned branches that hold commits of their own not yet in HEAD", () => {
  const repo = createRepo();
  try {
    repo.commit("chore: base");
    repo.git(["switch", "--quiet", "-c", "sandcastle/issue-17"]);
    repo.write("seventeen.txt", "17");
    repo.commit("feat: seventeen");
    repo.git(["switch", "--quiet", "main"]);
    repo.git(["branch", "sandcastle/issue-18"]);
    repo.git(["switch", "--quiet", "-c", "sandcastle/issue-19"]);
    repo.write("nineteen.txt", "19");
    repo.commit("feat: nineteen");
    repo.git(["switch", "--quiet", "main"]);
    repo.git(["merge", "--quiet", "--no-ff", "--no-edit", "sandcastle/issue-19"]);
    const planned = [issue("17"), issue("18"), issue("19"), issue("20")];
    assert.deepEqual(aheadIssues(planned, repo.dir).map((entry) => entry.id), ["17"]);
  } finally {
    repo.cleanup();
  }
});

await test("pendingIssues refuses when the directory is not a repository", () => {
  const repo = createRepo();
  repo.cleanup();
  assert.throws(() => pendingIssues([issue("7")], repo.dir));
});
