#!/usr/bin/env bash
# Offline deployment regression fixtures. No production, database, or network access.
set -euo pipefail
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
export NODE_CMD=$(command -v node)
export HEALTH_ATTEMPTS=1 HEALTH_INTERVAL=0
export PATH="$fixture/bin:$PATH"
mkdir -p "$fixture/bin"
cat > "$fixture/bin/pm2" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$FIXTURE_PM2_LOG"
if [[ "$1" == stop && "${FIXTURE_SCENARIO:-}" == stop-failure ]]; then exit 1; fi
if [[ "$1" == startOrRestart && "${FIXTURE_SCENARIO:-}" == restart-failure ]]; then exit 1; fi
MOCK
cat > "$fixture/bin/curl" <<'MOCK'
#!/usr/bin/env bash
if [[ "${FIXTURE_SCENARIO:-}" == unhealthy && "$(cat "$BACKEND_DIR/RELEASE")" == 2222222222222222222222222222222222222222 ]]; then
  printf '%s' '{"status":"unhealthy"}'
else
  printf '%s' '{"status":"healthy"}'
fi
MOCK
cat > "$fixture/bin/npm" <<'MOCK'
#!/usr/bin/env bash
printf 'UNEXPECTED NPM CALL\n' >&2
exit 99
MOCK
chmod +x "$fixture/bin/"*
export PM2_CMD="$fixture/bin/pm2"
make_artifacts() {
  local target=$1 commit=$2 pkg
  mkdir -p "$target/dist/src/database" "$target/migrations" "$target/node_modules"
  printf '%s\n' "$commit" > "$target/RELEASE"
  printf '%s\n' "$commit" > "$target/dist/src/main.js"
  touch "$target/dist/src/database/data-source.js" "$target/package-lock.json" "$target/ecosystem.config.js"
  printf '{}\n' > "$target/package.json"
  for pkg in typeorm @nestjs/core @nestjs/common mysql2 class-transformer class-validator reflect-metadata sharp bcrypt adminjs @adminjs/typeorm @adminjs/nestjs @adminjs/express; do
    mkdir -p "$target/node_modules/$pkg"
    printf 'module.exports = {};\n' > "$target/node_modules/$pkg/index.js"
  done
  printf 'if (process.env.FIXTURE_SCENARIO === "migration-failure") process.exit(1);\n' > "$target/node_modules/typeorm/cli.js"
}
for scenario in success missing-dependency missing-artifact adminjs-import-failure migration-failure stop-failure restart-failure unhealthy unexpected-env; do
  export FIXTURE_SCENARIO=$scenario
  export BACKEND_DIR="$fixture/$scenario/live" FIXTURE_PM2_LOG="$fixture/$scenario/pm2.log"
  mkdir -p "$BACKEND_DIR" "$fixture/$scenario/new"
  : > "$FIXTURE_PM2_LOG"
  make_artifacts "$BACKEND_DIR" 1111111111111111111111111111111111111111
  make_artifacts "$fixture/$scenario/new" 2222222222222222222222222222222222222222
  for protected in .env data/state uploads/photo logs/server.log; do
    mkdir -p "$(dirname "$BACKEND_DIR/$protected")"
    printf 'protected\n' > "$BACKEND_DIR/$protected"
  done
  case "$scenario" in
    missing-dependency) rm -rf "$fixture/$scenario/new/node_modules/sharp" ;;
    missing-artifact) rm "$fixture/$scenario/new/dist/src/main.js" ;;
    adminjs-import-failure) printf 'throw new Error("Incompatible AdminJS dependency");\n' > "$fixture/$scenario/new/node_modules/adminjs/index.js" ;;
    unexpected-env) printf 'overwrite\n' > "$fixture/$scenario/new/.env" ;;
  esac
  tar -czf "$fixture/$scenario/artifact.tar.gz" -C "$fixture/$scenario/new" .
  if bash "$script_dir/deploy-backend-artifact.sh" "$fixture/$scenario/artifact.tar.gz" > "$fixture/$scenario/output" 2>&1; then
    [[ "$scenario" == success ]] || { cat "$fixture/$scenario/output"; echo "FAIL accepted $scenario"; exit 1; }
    [[ "$(cat "$BACKEND_DIR/RELEASE")" == 2222222222222222222222222222222222222222 ]]
  else
    [[ "$scenario" != success ]] || { cat "$fixture/$scenario/output"; exit 1; }
    [[ "$(cat "$BACKEND_DIR/RELEASE")" == 1111111111111111111111111111111111111111 ]] || { cat "$fixture/$scenario/output"; echo 'FAIL previous release lost'; exit 1; }
    case "$scenario" in
      missing-dependency|missing-artifact|adminjs-import-failure|migration-failure|unexpected-env) [[ ! -s "$FIXTURE_PM2_LOG" ]] ;;
      *) grep -q 'Previous application restored and healthy' "$fixture/$scenario/output" ;;
    esac
  fi
  for protected in .env data/state uploads/photo logs/server.log; do
    [[ "$(cat "$BACKEND_DIR/$protected")" == protected ]] || { echo "FAIL changed $protected"; exit 1; }
  done
  printf 'PASS: backend artifact %s\n' "$scenario"
done
