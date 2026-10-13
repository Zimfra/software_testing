# TASK

Merge the following branches into the current branch:

{{BRANCHES}}

For each branch:

1. Run `git merge <branch> --no-edit`
2. If there are merge conflicts, keep the lines from both sides and change nothing else (`CHANGELOG.md` conflicts are the common case: keep both entries). Do not rewrite code or text while resolving a conflict.
3. Run `npm run typecheck` and `npm run test` after each merge.
4. If they fail, stop. Make any fix in a separate commit after the merge commit, with its own `<type>: <description>` subject, never inside the merge commit.

Follow `CLAUDE.md` and `.claude/rules/zeem/`. Never use `--no-verify`. Never push. Never rebase or force-push. Stage files by name.

# COMMENT ON ISSUES

Do not close any issue. An item is done only when the owner merges its pull request.

For each branch that was merged, leave a comment with the following command:

`gh issue comment -R Zimfra/software_testing <ID> --body "Branch <branch> was merged into the integration branch. A pull request is pending."`

Here are all the issues:

{{ISSUES}}

Once you've merged everything you can, output <promise>COMPLETE</promise>.
