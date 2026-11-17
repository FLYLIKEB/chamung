#!/usr/bin/env bash
# Read-only network health checks. Success requires HTTP 2xx and JSON status=healthy.
set -euo pipefail

target=${1:-${LIGHTSAIL_IP:-}}
if [[ -z "$target" ]]; then
  printf 'Usage: %s <LIGHTSAIL_IP>\n' "$0" >&2
  exit 1
fi
for dependency in curl node; do
  command -v "$dependency" >/dev/null || { printf 'Missing dependency: %s\n' "$dependency" >&2; exit 1; }
done

check_health() {
  local label=$1 url=$2 response
  if ! response=$(curl --fail --silent --show-error --connect-timeout 5 --max-time 10 "$url"); then
    printf 'FAIL: %s (HTTP or connection failure)\n' "$label" >&2
    return 1
  fi
  if ! printf '%s' "$response" | node -e '
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", chunk => { input += chunk; });
    process.stdin.on("end", () => {
      try { process.exit(JSON.parse(input)?.status === "healthy" ? 0 : 1); }
      catch { process.exit(1); }
    });
  '; then
    printf 'FAIL: %s (expected JSON status=healthy)\n' "$label" >&2
    return 1
  fi
  printf 'PASS: %s\n' "$label"
}

failures=0
check_health 'Backend health' "${DIRECT_HEALTH_URL:-http://$target:3000/health}" || failures=$((failures + 1))
check_health 'Public health' "${PUBLIC_HEALTH_URL:-http://$target/health}" || failures=$((failures + 1))
if (( failures > 0 )); then
  printf 'Health verification failed: %d check(s).\n' "$failures" >&2
  exit 1
fi
printf 'Health verification passed. The endpoint includes a database SELECT 1 check.\n'
printf 'Authenticated API flows and browser behavior are not covered by this command.\n'
