#!/usr/bin/env bash
# Run on the deployed backend host. No restart, installation or database mutation.
set -euo pipefail
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
target=${1:-${LIGHTSAIL_IP:-}}
backend_dir=${BACKEND_DIR:-/home/ubuntu/chalog-backend}
if [[ -z "$target" ]]; then
  printf 'Usage: %s <LIGHTSAIL_IP>\n' "$0" >&2
  exit 1
fi
for dependency in pm2 node; do
  command -v "$dependency" >/dev/null || { printf 'Missing dependency: %s\n' "$dependency" >&2; exit 1; }
done

failures=0
if pm2 jlist | node -e '
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", chunk => { input += chunk; });
  process.stdin.on("end", () => {
    try {
      const processes = JSON.parse(input).filter(item => item.name === "chalog-backend");
      process.exit(processes.length > 0 && processes.every(item => item.pm2_env?.status === "online") ? 0 : 1);
    } catch { process.exit(1); }
  });
'; then
  printf 'PASS: chalog-backend PM2 process online\n'
else
  printf 'FAIL: chalog-backend PM2 process is missing or not online\n' >&2
  failures=$((failures + 1))
fi

for artifact in .env package.json ecosystem.config.js dist/src/main.js; do
  if [[ -f "$backend_dir/$artifact" ]]; then
    printf 'PASS: deployed %s exists\n' "$artifact"
  else
    printf 'FAIL: missing deployed %s\n' "$artifact" >&2
    failures=$((failures + 1))
  fi
done
if [[ ! -d "$backend_dir/node_modules" ]]; then
  printf 'FAIL: deployed node_modules missing\n' >&2
  failures=$((failures + 1))
fi

if ! DIRECT_HEALTH_URL="${DIRECT_HEALTH_URL:-http://localhost:3000/health}" \
    bash "$script_dir/final-test.sh" "$target"; then
  failures=$((failures + 1))
fi
if (( failures > 0 )); then
  printf 'Deployment verification failed: %d check group(s).\n' "$failures" >&2
  exit 1
fi
printf 'Deployment process, artifacts and health checks passed.\n'
