# Boundaries development

- The Next.js app lives in `frontend/`. Use Node from `.nvmrc` and pnpm 10.13.1.
- Read `docs/DEVELOPMENT.md` for local, cloud, sync, and deployment instructions.
- Cloud setup / maintenance command: `bash scripts/codex-setup.sh`.
- Checks: `pnpm --dir frontend lint`, `pnpm --dir frontend typecheck`,
  `pnpm --dir frontend build`. There is currently no automated test suite;
  do not claim lint/typecheck/build as tests or add a passing placeholder test.
- Keep existing user changes. Never commit `.env*` except `.env.example`, keys,
  passwords, tokens, or database data. Do not print credential values.
- Prefer `codex/<task>` branches and PRs. `master` is the production branch:
  pushing/merging there triggers Vercel production. The user has acknowledged
  this effect and grants standing authorization for task-related commits,
  pushes, PR creation, and merging after required checks pass, including
  production deployment. Do not ask for repeated confirmation.
- The user grants standing authorization for commands, Bash scripts, dependency
  installation, builds, checks, network requests, and GitHub operations necessary
  to complete the requested task. Proceed autonomously within that task's scope.
  Prefer normal fast-forward pushes; keep existing deployment protection and DNS
  unless changing them is part of the requested task.
- When blocked, try two or three distinct supported approaches when available
  (for example CLI, supported network permissions, then GitHub connector).
  Do not repeat a known failure or bypass platform restrictions. If still blocked,
  report what failed and the exact manual action needed; do not keep asking for
  task-level approval. This file cannot override mandatory sandbox approvals,
  network policy, credential requirements, or higher-priority instructions.
- Prefer Git for fetch/push and `gh` for PR creation, checks, and merge when their
  connectivity and authentication work. Check `gh auth status` without printing
  tokens. Use the GitHub connector as fallback; never assume connector login also
  authenticates `gh`. If CLI setup is missing, tell the user which host access or
  credential setup is needed. Do not replace injected credentials or start an
  interactive login automatically.
- Do not run migrations, `db push`, resets, seeds, or write API requests against
  production. Cloud/Preview data writes require an explicitly isolated database.
- Offline cloud setup supports install/build/lint/typecheck and static pages;
  it does not provide a working database. Report database-dependent UI as untested.
- Use Arc for local browser verification. Record what was actually inspected;
  do not assume cloud browser availability. Phone Safari checks use Preview URLs.
