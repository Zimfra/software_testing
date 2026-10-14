import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TestContext } from "node:test";
import type { Run } from "../git/pr-ready.ts";
import type { Output } from "../lib/cli.ts";
import { cleanGitEnv, createRepo, type RepoFixture } from "./repo-fixture.ts";
import { main } from "../sandcastle/afk.ts";

export const PR_URL = "https://github.com/Zimfra/software_testing/pull/21";

export function fixture(t: TestContext): RepoFixture {
  const repo = createRepo("afk-");
  const remote = mkdtempSync(join(tmpdir(), "afk-remote-"));
  t.after(() => { repo.cleanup(); rmSync(remote, { recursive: true, force: true }); });
  execFileSync("git", ["init", "--quiet", "--bare", remote], { env: cleanGitEnv });
  repo.commit("base");
  repo.git(["remote", "add", "origin", remote]);
  repo.git(["push", "--quiet", "origin", "main"]);
  repo.git(["fetch", "--quiet", "origin"]);
  repo.git(["switch", "--quiet", "-c", "feat/afk-work"]);
  return repo;
}

// An issue branch with one commit, left unmerged; the caller merges it where it should land.
export function issueBranch(repo: RepoFixture, name: string): void {
  const from = repo.git(["symbolic-ref", "--short", "HEAD"]);
  repo.git(["switch", "--quiet", "-c", name, from]);
  repo.write(`${name.replaceAll("/", "-")}.md`, "work\n");
  repo.commit(`feat: ${name}`);
  repo.git(["switch", "--quiet", from]);
}

export function mergeInto(repo: RepoFixture, target: string, name: string): void {
  repo.git(["switch", "--quiet", target]);
  repo.git(["merge", "--quiet", "--no-ff", "-m", `Merge ${name}`, name]);
}

export type Script = {
  loop?: () => number;
  pr?: { status: number; stdout: string };
  view?: { status: number; stdout: string };
  ghRepo?: { status: number; stdout: string };
  failComments?: string[];
};

// git runs for real; the Sandcastle loop, pr-ready, gh and npm are scripted and recorded.
export function runner(repo: RepoFixture, script: Script = {}): { run: Run; calls: string[]; inherited: string[] } {
  const calls: string[] = [];
  const inherited: string[] = [];
  const run: Run = (command, args, options) => {
    const line = `${command} ${args.join(" ")}`;
    calls.push(line);
    if (options?.inherit === true) inherited.push(line);
    if (command === "git") {
      const result = spawnSync("git", args, { cwd: repo.dir, env: cleanGitEnv, encoding: "utf8" });
      return { status: result.status, stdout: result.stdout };
    }
    if (line === "node .sandcastle/main.ts") return { status: script.loop?.() ?? 0, stdout: "" };
    if (line === "node scripts/git/pr-ready.ts") return script.pr ?? { status: 0, stdout: `pr-ready: pull request ${PR_URL} is open.\n` };
    if (line === "gh repo view --json nameWithOwner --jq .nameWithOwner") return script.ghRepo ?? { status: 0, stdout: "Zimfra/software_testing\n" };
    if (command === "gh" && args[0] === "pr" && args[1] === "view") return script.view ?? { status: 0, stdout: `OPEN\t${PR_URL}\n` };
    if (command === "gh" && args[0] === "issue" && args[1] === "comment") {
      return { status: script.failComments?.includes(args[2] ?? "") === true ? 1 : 0, stdout: "" };
    }
    throw new Error(`unexpected ${line}`);
  };
  return { run, calls, inherited };
}

export function go(repo: RepoFixture, run: Run, args: string[] = [], env: NodeJS.ProcessEnv = {}): { code: number; out: string; err: string } {
  const out: string[] = [];
  const err: string[] = [];
  const output: Output = { write: (line) => out.push(line), warn: (line) => err.push(line) };
  return { code: main(args, { cwd: repo.dir, output, run, env }), out: out.join("\n"), err: err.join("\n") };
}

export const comments = (calls: string[]): string[] => calls.filter((call) => call.startsWith("gh issue comment"));
export const GH_REPO = "gh repo view --json nameWithOwner --jq .nameWithOwner";
export const sawAnything = (calls: string[]): boolean => calls.some((call) => !call.startsWith("git ") && call !== GH_REPO);

