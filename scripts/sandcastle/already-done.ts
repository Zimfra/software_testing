import { isAncestor, refExists, tryGit } from "../lib/git.ts";

export type PlannedIssue = { id: string; title: string; branch: string };

// Sandcastle creates the branch at HEAD before the implementer runs, so a branch that never got
// a commit is an ancestor of HEAD too. Only the branch's own reflog tells the two apart: it holds
// the creation entry, plus one entry per commit made on the branch. A reset, rename, fetch or
// fast-forward merge also writes an entry, so only entries that create a commit count (a
// conflict resolved with `git commit` logs `commit (merge)`, which counts, as do `commit (amend)` and `rebase (finish)`; a conflict-free merge
// of another branch logs `merge ...`, which does not, and the implementer's own commits are
// counted anyway). The commit an entry made must still be reachable from the tip: a branch an
// agent reset to a commit HEAD already contains has lost its work. A branch with no reflog is
// "unrecognised" and stays pending, which costs a re-plan and never loses an issue. A worked
// branch that the merger merged before its issue was finished is dropped too, because the signal
// cannot tell partial from complete work, and a reset part of the way back is judged by its tip.
// A reflog entry can name a commit that was pruned; that is "not reachable", never a failure.
function reachable(sha: string, ref: string, cwd: string): boolean {
  try {
    return isAncestor(sha, ref, { cwd });
  } catch {
    return false;
  }
}

export type BranchWork = "worked" | "empty" | "unrecognised";

/**
 * "worked": a commit entry's commit is still reachable from the tip. "empty": the branch is
 * missing, its tip is still where it was created, or every commit it made was reset away.
 * "unrecognised": the tip moved or the reflog is gone, but no entry says a commit was made (a ref
 * written by update-ref or fetch); callers that must not stay silent treat it differently from "empty".
 */
export function branchWork(ref: string, cwd: string): BranchWork {
  if (!refExists(ref, { cwd })) return "empty";
  const log = tryGit(["reflog", "show", "--format=%H %gs", ref, "--"], { cwd });
  const entries = (log ?? "").split("\n").filter((line) => line !== "").map((line) => {
    const space = line.indexOf(" ");
    return { sha: line.slice(0, space), subject: line.slice(space + 1) };
  });
  const created = entries.find((entry) => entry.subject.startsWith("branch: Created"));
  if (created !== undefined && created.sha === entries[0]?.sha) return "empty";
  const commits = entries.filter((entry) => /^(commit|cherry-pick|revert|rebase \(finish\))/.test(entry.subject));
  if (commits.length === 0) return "unrecognised";
  return commits.some((entry) => reachable(entry.sha, ref, cwd)) ? "worked" : "empty";
}

export const hasOwnCommits = (ref: string, cwd: string): boolean => branchWork(ref, cwd) === "worked";

/**
 * The planned issues whose branch is not yet merged into the checked-out branch of `cwd`.
 * A branch that does not exist, or that never received a commit, is not done: an issue is
 * dropped only when it was worked on and the work is in HEAD. Only local branches count: the
 * full ref name keeps a tag or remote branch of the same name, or a name starting with `-`, from matching.
 */
export function pendingIssues(issues: readonly PlannedIssue[], cwd: string): PlannedIssue[] {
  return issues.filter((issue) => {
    const ref = `refs/heads/${issue.branch}`;
    return !(refExists(ref, { cwd }) && isAncestor(ref, "HEAD", { cwd }) && hasOwnCommits(ref, cwd));
  });
}

/**
 * The planned issues whose branch holds commits that HEAD does not contain yet (worked, or a tip
 * written by update-ref or fetch), such as work left over from a round whose review failed. The merger must receive these even when
 * the implementer adds nothing new in the round.
 */
export function aheadIssues(issues: readonly PlannedIssue[], cwd: string): PlannedIssue[] {
  return issues.filter((issue) => {
    const ref = `refs/heads/${issue.branch}`;
    return refExists(ref, { cwd }) && !isAncestor(ref, "HEAD", { cwd }) && branchWork(ref, cwd) !== "empty";
  });
}
