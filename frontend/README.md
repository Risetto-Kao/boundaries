# Boundaries frontend

Next.js 16 / React 19 / Prisma 7 application. Use pnpm 10.13.1 and the root `.nvmrc`.

See [the development guide](../docs/DEVELOPMENT.md) for environment variables,
clean setup, Cloud, synchronization, Preview deployments, and production behavior.

From the repository root:

```sh
nvm install
nvm use
npm install --global pnpm@10.13.1
cd frontend
cp .env.example .env.local
# Configure an isolated development database in .env.local.
pnpm install --frozen-lockfile
pnpm dev
```

Checks: `pnpm lint`, `pnpm typecheck`, `pnpm build`.
There is currently no automated test suite. `pnpm start` serves a completed build.
