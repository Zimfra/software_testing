import { isAncestor, refExists, tryGit } from "../lib/git.ts";

export type PlannedIssue = { id: string; title: string; branch: string };

// Sandcastle creates the branch at HEAD before the implementer runs, so a branch that never got
// a commit is an ancestor of HEAD too. Only the branch's own reflog tells the two apart: it holds
// the creation entry, plus one entry per commit made on the branch. A reset, rename, fetch or
// fast-forward merge also writes an entry, so only entries that create a commit count; a
// conflict-free merge of another branch into this one logs `merge ...` and does not count, which
// is safe because the implementer's own commits are counted. A branch whose tip is where it was
// created again (an agent reset it past its commits) has no work, and a branch with no reflog
// stays pending: either costs a re-plan and never loses an issue. A worked branch that the
// merger merged before its issue was finished is dropped too, because the signal cannot tell
// partial from complete work.
export function hasOwnCommits(ref: string, cwd: string): boolean {
  if (!refExists(ref, { cwd })) return false;
  const log = tryGit(["reflog", "show", "--format=%H %gs", ref, "--"], { cwd });
  if (log === null) return false;
  const entries = log.split("\n").filter((line) => line !== "").map((line) => {
    const space = line.indexOf(" ");
    return { sha: line.slice(0, space), subject: line.slice(space + 1) };
  });
  const created = entries.find((entry) => entry.subject.startsWith("branch: Created"));
  const tip = entries[0]?.sha;
  if (created !== undefined && created.sha === tip) return false;
  return entries.some((entry) => /^(commit|cherry-pick|revert)\b/.test(entry.subject));
}

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
 * The planned issues whose branch holds commits of its own that HEAD does not contain yet, such
 * as work left over from a round whose review failed. The merger must receive these even when
 * the implementer adds nothing new in the round.
 */
export function aheadIssues(issues: readonly PlannedIssue[], cwd: string): PlannedIssue[] {
  return issues.filter((issue) => {
    const ref = `refs/heads/${issue.branch}`;
    return refExists(ref, { cwd }) && !isAncestor(ref, "HEAD", { cwd }) && hasOwnCommits(ref, cwd);
  });
}
