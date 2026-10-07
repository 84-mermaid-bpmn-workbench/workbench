#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
workspace_root="$(cd -- "$script_dir/../.." && pwd)"
release_file="$script_dir/release.json"
environment_file="$script_dir/.env"
compose_file="$script_dir/compose.yaml"
action="${1:-}"

if [[ ! -f "$release_file" ]]; then
  printf 'Error: editor release file not found: %s\n' "$release_file" >&2
  exit 1
fi

if [[ ! -f "$environment_file" ]]; then
  printf 'Error: editor environment file not found: %s\n' "$environment_file" >&2
  exit 1
fi

editor_version="$(node --eval '
const { readFileSync } = require("node:fs");
const release = JSON.parse(readFileSync(process.argv[1], "utf8"));
if (typeof release.version !== "string" || release.version.length === 0) {
  throw new Error("release.json must contain a non-empty version.");
}
if (typeof release.mermaid_bpmn_fork_revision !== "string" || release.mermaid_bpmn_fork_revision.length === 0) {
  throw new Error("release.json must contain a non-empty mermaid_bpmn_fork_revision.");
}
console.log(release.version);
' "$release_file")"
editor_revision="$(git -C "$workspace_root/workbench" rev-parse HEAD)"

set -a
. "$environment_file"
set +a

if [[ -z "${WEB_EDITOR_IMAGE:-}" ]]; then
  printf 'Error: WEB_EDITOR_IMAGE is required in %s\n' "$environment_file" >&2
  exit 1
fi

build_image() {
  docker build \
    --no-cache \
    --file "$script_dir/Dockerfile" \
    --build-arg "WEB_EDITOR_VERSION=$editor_version" \
    --build-arg "WEB_EDITOR_REVISION=$editor_revision" \
    --tag "$WEB_EDITOR_IMAGE:$editor_version" \
    "$workspace_root"
}

run_compose() {
  WEB_EDITOR_TAG="$editor_version" docker compose \
    --project-directory "$workspace_root" \
    --file "$compose_file" \
    --env-file "$environment_file" \
    "$@"
}

case "$action" in
  build)
    build_image
    ;;
  up)
    build_image
    run_compose up -d
    ;;
  down)
    run_compose down
    ;;
  *)
    printf '%s\n' \
      'Usage: bash workbench/web-editor/deploy.sh {build|up|down}' \
      '  build  Build the version-tagged editor image.' \
      '  up     Build the image and start the Compose service.' \
      '  down   Stop and remove the Compose service.' >&2
    exit 2
    ;;
esac
