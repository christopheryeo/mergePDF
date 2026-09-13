# Git & Pull Request Workflow

The correct, end-to-end process for making a change and getting it into `main`
through a pull request (PR).

## The golden rule

> **Always work on a branch that is *not* `main` before you commit.**
> A PR merges one branch *into another*, so the source (your feature branch) must
> be different from the target (`main`). You cannot open a PR from `main` into `main`.

Committing straight to `main` and pushing is **not** a PR — it bypasses review
entirely.

## The stages

### 1. Branch — start a feature branch from an up-to-date `main`
```bash
git checkout main && git pull
git checkout -b my-feature
```
> Skip *creating* a branch only if you are already on a non-`main` branch. You can
> never skip *being on* one.

### 2. Stage — mark which changes to include
```bash
git add -A
```

### 3. Commit — save the staged changes to the branch (local only)
```bash
git commit -m "Describe the change"
```

### 4. Push — publish the branch to GitHub
```bash
git push -u origin my-feature
```

### 5. Create PR — *propose* merging the branch into `main`
```bash
gh pr create --base main --head my-feature
```
> Creating a PR does **not** merge. It opens a proposal for review.

### 6. Merge the PR — the actual combine (a separate, deliberate step)
Review first, then merge on GitHub or:
```bash
gh pr merge my-feature
```

### 7. Sync & tidy — update local `main` and drop the merged branch
```bash
git checkout main && git pull        # the merge happened on the server; pull it down
git branch -d my-feature             # remote copy usually auto-deletes on merge
```

## Common misconceptions

| Belief | Reality |
|---|---|
| "Creating a PR merges the branches." | No — creating a PR only *proposes*. Merging (step 6) is separate. |
| "I can skip the branch and just commit → push → PR." | No — a PR needs a source branch different from `main`; you can't PR `main` → `main`. |
| "After merging on GitHub, my local repo is up to date." | No — the merge happens on the remote; local `main` only catches up when you `pull` (step 7). |

## Quick reference

```
branch → stage → commit → push → create PR → merge PR → pull & tidy
  (1)      (2)      (3)      (4)      (5)         (6)        (7)
```
