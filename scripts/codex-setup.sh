#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Run in the cloud container, with Node matching .nvmrc already selected.
node -e 'const [major] = process.versions.node.split(".").map(Number); if (!(major === 24)) throw new Error("Select Node 24.21.0 before setup")'
if ! command -v pnpm >/dev/null || [[ "$(pnpm --version)" != "10.13.1" ]]; then
  npm install --global pnpm@10.13.1
fi

# Offline build/UI mode. Never copy local or production credentials into Cloud.
# Preserve a pre-existing environment file. Real DB features need an isolated DB.
if [[ ! -f frontend/.env.local ]]; then
  cat > frontend/.env.local <<'ENV'
# Offline development only: no database is started by this script.
DATABASE_URL=postgresql://localhost:5432/boundaries
DIRECT_URL=postgresql://localhost:5432/boundaries
ENV
fi
pnpm --dir frontend install --frozen-lockfile
