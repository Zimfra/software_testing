// npm run sandcastle:afk: run the Sandcastle loop, then hand its work to the owner and walk away.
//
// `npm run sandcastle` only merges issue branches into the checked-out branch: nothing is pushed,
// no pull request is opened and nobody is told. This wrapper adds those steps without adding any
// authority. Landing is the repository's own tool (scripts/git/pr-ready.ts, what `npm run pr`
// runs), so the checks, the refusal of an owner login and the push of the branch stay where they
// are. Notification is GitHub only: the pull request's review request to the code owner and a
// comment on each issue. It never pushes main, never merges or approves, never closes an issue,
// never skips a hook and never reads .sandcastle/.env.
import { EXIT_ERROR, EXIT_OK, EXIT_REFUSED, consoleOutput, isEntryPoint, runCli, type Output } from "../lib/cli.ts";
import { spawnRunner, type Run } from "../git/pr-ready.ts";

export type Options = { cwd?: string; output?: Output; run?: Run };

const REPO = "Zimfra/software_testing";
const ISSUE_BRANCH = /^refs\/heads\/sandcastle\/issue-(\d+)$/;

const USAGE = `Usage: node scripts/sandcastle/afk.ts
Runs the Sandcastle loop on the current feature branch, then opens a pull request for the issue
branches it merged (npm run pr's tool) and comments on each issue. Never merges or closes anything.
Exit: 0 done or nothing to land, 1 refused, 2 a step failed.`;

function refusals(run: Run): string[] {
  const refused: string[] = [];
  const head = run("git", ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  if (head.status !== 0 || head.stdout.trim() === "main") refused.push("Run this on a feature branch, not main or a detached HEAD.");
  if (run("git", ["status", "--porcelain"]).stdout.trim() !== "") refused.push("The tree has uncommitted changes. Commit or stash them first.");
  return refused;
}

function git(run: Run, args: readonly string[]): string {
  const result = run("git", args);
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed (exit ${String(result.status)})`);
  return result.stdout;
}

const branchesMerged = (run: Run, flag: string, ref: string): string[] =>
  git(run, ["for-each-ref", "--format=%(refname)", flag, ref, "refs/heads/sandcastle/"]).split("\n").filter((name) => name !== "");

/** Issue numbers of sandcastle/issue-<N> branches merged into HEAD but not yet into origin/main. */
function mergedIssues(run: Run): number[] {
  git(run, ["fetch", "--quiet", "origin", "main"]);
  const onMain = new Set(branchesMerged(run, "--merged", "refs/remotes/origin/main"));
  return branchesMerged(run, "--merged", "HEAD")
    .filter((name) => !onMain.has(name))
    .flatMap((name) => ISSUE_BRANCH.exec(name)?.[1] ?? [])
    .map(Number)
    .sort((a, b) => a - b);
}

function comment(run: Run, issue: number, url: string): boolean {
  const body = `Sandcastle merged this issue into a branch and opened ${url}. It is waiting for the owner's review. This issue stays open until the owner merges that pull request.`;
  return run("gh", ["issue", "comment", String(issue), "-R", REPO, "--body", body]).status === 0;
}

export function main(args: readonly string[], options: Options = {}): number {
  const output = options.output ?? consoleOutput;
  if (args[0] === "--help") {
    output.write(USAGE);
    return EXIT_OK;
  }
  if (args.length > 0) {
    output.warn("afk: pass no arguments. See --help.");
    return EXIT_ERROR;
  }
  const run = options.run ?? defaultRunner(options.cwd);
  const refused = refusals(run);
  for (const reason of refused) output.warn(`afk: ${reason}`);
  if (refused.length > 0) return EXIT_REFUSED;

  output.write("afk: step 1 of 3, running the Sandcastle loop (node .sandcastle/main.ts).");
  if (run("node", [".sandcastle/main.ts"], { inherit: true }).status !== 0) {
    output.warn("afk: the Sandcastle loop failed (output above). Nothing was pushed or commented.");
    return EXIT_ERROR;
  }
  const issues = mergedIssues(run);
  if (issues.length === 0) {
    output.write("afk: no Sandcastle issue branch was merged into this branch beyond origin/main; nothing to land.");
    return EXIT_OK;
  }

  output.write(`afk: step 2 of 3, landing issue(s) ${issues.join(", ")} with scripts/git/pr-ready.ts (checks, push, pull request).`);
  const landing = run("node", ["scripts/git/pr-ready.ts"]);
  if (landing.stdout !== "") output.write(landing.stdout.trimEnd());
  if (landing.status !== 0) {
    const reason = landing.status === 1 ? "refused" : "failed";
    output.warn(`afk: the landing step ${reason} (exit ${String(landing.status)}, reason above). The work stays merged on this branch; nothing was pushed or commented.`);
    return landing.status === 1 ? EXIT_REFUSED : EXIT_ERROR;
  }
  const url = /https:\/\/\S+\/pull\/\d+/.exec(landing.stdout)?.[0];
  if (url === undefined) {
    output.warn("afk: the landing step succeeded but printed no pull request URL, so no issue was commented. Find the pull request on GitHub.");
    return EXIT_ERROR;
  }

  output.write(`afk: step 3 of 3, commenting on issue(s) ${issues.join(", ")}.`);
  const failed = issues.filter((issue) => !comment(run, issue, url));
  if (failed.length > 0) {
    output.warn(`afk: the pull request ${url} is open, but the comment on issue ${failed.join(", ")} failed.`);
    return EXIT_ERROR;
  }
  output.write(`afk: done. ${url} is waiting for the owner's review; this tool never merges.`);
  return EXIT_OK;
}

// The loop and the landing tool run for minutes and are not given a timeout; git and gh are.
function defaultRunner(cwd: string | undefined): Run {
  const quick = spawnRunner(cwd);
  const long = spawnRunner(cwd, 0);
  return (command, args, options) => (command === "node" ? long : quick)(command, args, options);
}

if (isEntryPoint(import.meta.url)) await runCli(() => main(process.argv.slice(2)));
