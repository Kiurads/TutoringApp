---
name: feedback_check_settings_local_for_leaked_secrets
description: .claude/settings.local.json is git-tracked (not gitignored) in this repo and its Bash permission allowlist can end up with real credentials embedded verbatim in an allowed command string.
metadata:
  type: feedback
---

`.claude/settings.local.json` is tracked by git in this repo (`git check-ignore` confirms it is **not** ignored) and its `permissions.allow` list records exact Bash command strings the user has approved. Found 2026-08-05 (during an unrelated documentation task) that the working-tree copy contained two allowlist entries with a live production MySQL `DATABASE_URL` embedded in plaintext, including the password — almost certainly auto-recorded when the user ran `DATABASE_URL=<prod-url> npx prisma migrate deploy`/`migrate status` manually (see [[project_prod_migrations_manual_step]]) and approved the command, which allowlists the literal string including the credential.

At the time this was found, the secret was only in the **uncommitted working-tree diff** — `git show HEAD:.claude/settings.local.json` did not contain it, so it hadn't been pushed yet.

**Why:** this permission-allowlist mechanism records commands verbatim; any command containing an inline secret (a DB URL, an API key passed as a CLI arg) will leak that secret into a git-tracked file the moment it's approved, unless the secret is kept in an env var/file instead of inline in the command.

**How to apply:** Before any `git add`/commit/push touching `.claude/settings.local.json`, or before reporting a task "clean" when checking `git status`, actually read the diff of that file for embedded secrets — don't assume a `.claude/` config file is inherently safe to commit. If found, flag it to the user rather than committing/pushing it, and suggest running prod-DB commands with the credential in an env var already set in the shell (not inline in the command string) going forward so future approvals don't re-capture it.
