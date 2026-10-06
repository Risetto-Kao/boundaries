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
  pushing/merging there triggers Vercel production. Do not push there unless
  the user explicitly authorizes it after being told the deployment effect.
- Never force push, weaken deployment protection, or modify DNS without approval.
- Do not run migrations, `db push`, resets, seeds, or write API requests against
  production. Cloud/Preview data writes require an explicitly isolated database.
- Offline cloud setup supports install/build/lint/typecheck and static pages;
  it does not provide a working database. Report database-dependent UI as untested.
- Use Arc for local browser verification. Record what was actually inspected;
  do not assume cloud browser availability. Phone Safari checks use Preview URLs.
