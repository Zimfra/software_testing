# TASK

Merge the following branches into the current branch:

{{BRANCHES}}

For each branch:

1. Run `git merge <branch> --no-edit`
2. If there are merge conflicts, resolve them intelligently by reading both sides and choosing the correct resolution
3. After resolving conflicts, run `npm run typecheck` and `npm run test` to verify everything works
4. If tests fail, fix the issues before proceeding to the next branch

After all branches are merged, make a single commit summarizing the merge.

# COMMENT ON ISSUES

Do not close any issue. An item is done only when the owner merges its pull request.

For each branch that was merged, leave a comment with the following command:

`gh issue comment -R Zimfra/software_testing <ID> --body "Branch <branch> was merged into the integration branch. A pull request is pending."`

Here are all the issues:

{{ISSUES}}

Once you've merged everything you can, output <promise>COMPLETE</promise>.
