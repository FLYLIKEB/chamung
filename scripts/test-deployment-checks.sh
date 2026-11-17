#!/usr/bin/env bash
# Offline regression fixtures: no network, database, Git or deployment calls.
set -euo pipefail
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
fixture_dir=$(mktemp -d)
trap 'rm -rf "$fixture_dir"' EXIT
mkdir -p "$fixture_dir/bin" "$fixture_dir/backend/dist/src" "$fixture_dir/backend/node_modules"
touch "$fixture_dir/backend/.env" "$fixture_dir/backend/package.json" "$fixture_dir/backend/ecosystem.config.js" "$fixture_dir/backend/dist/src/main.js"
cat > "$fixture_dir/bin/curl" <<'MOCK'
#!/usr/bin/env bash
case "$FIXTURE_HEALTH" in
  healthy) printf '%s' '{"status":"healthy"}' ;;
  unhealthy) printf '%s' '{"status":"unhealthy"}' ;;
  malformed) printf '%s' '{invalid' ;;
  empty) : ;;
  http-error)
    if [[ " $* " == *" --fail "* ]]; then exit 22; fi
    printf '%s' '{"status":"healthy"}' ;;

  timeout) exit 28 ;;
esac
MOCK
cat > "$fixture_dir/bin/pm2" <<'MOCK'
#!/usr/bin/env bash
if [[ "$1" != jlist ]]; then exit 1; fi
printf '[{"name":"chalog-backend","pm2_env":{"status":"%s"}}]' "${FIXTURE_PM2:-online}"
MOCK
cat > "$fixture_dir/bin/npm" <<'MOCK'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$FIXTURE_NPM_LOG"
[[ "$*" != "${FIXTURE_NPM_FAIL:-never}" ]]
MOCK
chmod +x "$fixture_dir/bin/"*
export PATH="$fixture_dir/bin:$PATH" BACKEND_DIR="$fixture_dir/backend"
export FIXTURE_NPM_LOG="$fixture_dir/npm.log"
export DIRECT_HEALTH_URL=http://fixture/direct PUBLIC_HEALTH_URL=http://fixture/public
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
for script in final-test.sh verify-deployment.sh; do
  for scenario in healthy unhealthy malformed empty http-error timeout; do
    export FIXTURE_HEALTH=$scenario
    if bash "$script_dir/$script" fixture > "$fixture_dir/output" 2>&1; then
      [[ "$scenario" == healthy ]] || fail "$script accepted $scenario"
    else
      [[ "$scenario" != healthy ]] || { cat "$fixture_dir/output"; fail "$script rejected healthy"; }
    fi
  done
  printf 'PASS: %s health fixture matrix\n' "$script"
done
export FIXTURE_HEALTH=healthy FIXTURE_PM2=errored
if bash "$script_dir/verify-deployment.sh" fixture > "$fixture_dir/output" 2>&1; then fail 'errored PM2 accepted'; fi
export FIXTURE_PM2=online
rm "$fixture_dir/backend/dist/src/main.js"
if bash "$script_dir/verify-deployment.sh" fixture > "$fixture_dir/output" 2>&1; then fail 'missing build accepted'; fi
printf 'PASS: PM2 and deployed artifact requirements\n'
if [[ "${1:-}" == --health-only ]]; then exit 0; fi
bash "$script_dir/full-release.sh" --check-only > "$fixture_dir/output" 2>&1 || { cat "$fixture_dir/output"; fail 'check-only failed'; }
for required in 'run typecheck' 'run lint' 'run test:run' 'run build' '--workspace backend test -- --runInBand' '--workspace backend run build'; do
  grep -Fxq -- "$required" "$FIXTURE_NPM_LOG" || fail "missing mandatory check: $required"
done
export FIXTURE_NPM_FAIL='run lint'
if bash "$script_dir/full-release.sh" --check-only > "$fixture_dir/output" 2>&1; then fail 'failed lint accepted'; fi
printf 'PASS: required release checks and failure propagation\n'
