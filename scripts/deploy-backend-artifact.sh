#!/usr/bin/env bash
# Activate a CI-built artifact without installing packages on the production host.
set -Eeuo pipefail

archive=${1:?Usage: deploy-backend-artifact.sh /path/to/deploy.tar.gz}
backend_dir=${BACKEND_DIR:-/home/ubuntu/chalog-backend}
node_cmd=${NODE_CMD:-/home/ubuntu/.local/chalog-node22/bin/node}
export PATH="$(dirname "$node_cmd"):$PATH"
pm2_cmd=${PM2_CMD:-$(command -v pm2)}
health_url=${HEALTH_URL:-http://127.0.0.1:3000/health}
health_attempts=${HEALTH_ATTEMPTS:-12}
health_interval=${HEALTH_INTERVAL:-5}
managed=(dist node_modules migrations package.json package-lock.json ecosystem.config.js RELEASE)
old_paths=()
new_paths=()
switching=false
stage=''
backup=''

fail() { printf 'Deployment failed: %s\n' "$*" >&2; exit 1; }
health_check() {
  local attempt response
  for ((attempt = 1; attempt <= health_attempts; attempt++)); do
    if response=$(curl --fail --silent --show-error --connect-timeout 3 --max-time 5 "$health_url") &&
      printf '%s' "$response" | "$node_cmd" -e 'let s=""; process.stdin.on("data", x => s += x); process.stdin.on("end", () => { try { process.exit(JSON.parse(s).status === "healthy" ? 0 : 1); } catch { process.exit(1); } });'; then
      return 0
    fi
    sleep "$health_interval"
  done
  return 1
}
cleanup() {
  local status=$? item
  trap - EXIT
  if [[ $status -ne 0 && "$switching" == true ]]; then
    echo 'Activation failed; restoring previous application artifacts.' >&2
    "$pm2_cmd" delete chalog-backend >/dev/null 2>&1 || true
    for item in ${new_paths[@]+"${new_paths[@]}"}; do rm -rf -- "$backend_dir/$item"; done
    for item in ${old_paths[@]+"${old_paths[@]}"}; do mv -- "$backup/$item" "$backend_dir/$item"; done
    if [[ -f "$backend_dir/ecosystem.config.js" ]]; then
      if (cd "$backend_dir" && "$pm2_cmd" start ecosystem.config.js --only chalog-backend --update-env) && health_check; then
        "$pm2_cmd" save
        echo 'Previous application restored and healthy.' >&2
      else
        echo "ROLLBACK REQUIRES ATTENTION: previous artifacts restored at $backend_dir; backup $backup" >&2
      fi
    fi
  fi
  [[ -z "$stage" ]] || rm -rf -- "$stage"
  exit "$status"
}
trap cleanup EXIT

[[ -f "$archive" ]] || fail 'archive missing'
[[ -f "$backend_dir/.env" ]] || fail 'existing production .env missing; provision it separately'
[[ -x "$node_cmd" ]] || fail 'Node22 runtime missing'
[[ "$("$node_cmd" -p 'process.versions.node.split(".")[0]')" == 22 ]] || fail 'Node22 required'
[[ -x "$pm2_cmd" ]] || fail 'PM2 missing'

# Stage on the same filesystem so activation and rollback use renames, not copies.
stage=$(mktemp -d "$(dirname "$backend_dir")/.chalog-stage.XXXXXX")
tar -tzf "$archive" > "$stage/archive-list"
while IFS= read -r member; do
  member=${member#./}
  [[ -z "$member" ]] && continue
  [[ "$member" != /* && "$member" != *../* && "$member" != .. ]] || fail 'unsafe archive path'
  case "${member%%/*}" in
    dist|node_modules|migrations|package.json|package-lock.json|ecosystem.config.js|RELEASE) ;;
    *) fail "unexpected archive entry: $member" ;;
  esac
done < "$stage/archive-list"
rm "$stage/archive-list"
tar -xzf "$archive" -C "$stage"
for item in "${managed[@]}"; do [[ -e "$stage/$item" ]] || fail "missing artifact: $item"; done
[[ -f "$stage/dist/src/main.js" && -f "$stage/dist/src/database/data-source.js" ]] || fail 'compiled entrypoints missing'
[[ "$(cat "$stage/RELEASE")" =~ ^[0-9a-f]{40}$ ]] || fail 'release commit missing'

# This also loads native modules on the destination before disturbing the live app.
(cd "$stage" && "$node_cmd" -e 'for (const p of ["typeorm","@nestjs/core","@nestjs/common","mysql2","class-transformer","class-validator","reflect-metadata","sharp","bcrypt"]) { if (!require.resolve(p).startsWith(process.cwd()+"/node_modules/")) throw new Error("Dependency outside artifact: "+p); require(p); }')
ln -s "$backend_dir/.env" "$stage/.env"
(cd "$stage" && "$node_cmd" node_modules/typeorm/cli.js migration:run -d dist/src/database/data-source.js)

backup=$(mktemp -d "$backend_dir/.deploy-backup.XXXXXX")
switching=true
# The database migration is not reversed automatically; application rollback preserves data.
if "$pm2_cmd" describe chalog-backend >/dev/null 2>&1; then "$pm2_cmd" stop chalog-backend; fi
for item in "${managed[@]}"; do
  if [[ -e "$backend_dir/$item" ]]; then
    mv -- "$backend_dir/$item" "$backup/$item"
    old_paths+=("$item")
  fi
  mv -- "$stage/$item" "$backend_dir/$item"
  new_paths+=("$item")
done
(cd "$backend_dir" && "$pm2_cmd" startOrRestart ecosystem.config.js --only chalog-backend --update-env)
health_check || fail 'new application health check failed'
"$pm2_cmd" save
switching=false
echo "Deployment healthy: $(cat "$backend_dir/RELEASE"); previous artifacts retained at $backup"
