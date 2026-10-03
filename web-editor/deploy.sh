#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
workspace_root="$(cd -- "$script_dir/../.." && pwd)"
package_json="$workspace_root/_mermaid-bpmn-fork/package.json"
compose_file="$script_dir/compose.yaml"
image_name="mermaid-bpmn-workbench-web-editor"
action="${1:-}"

if ! command -v jq >/dev/null 2>&1; then
  printf '%s\n' 'Error: jq is required to read the editor version from package.json.' >&2
  exit 1
fi

if [[ ! -f "$package_json" ]]; then
  printf 'Error: editor package file not found: %s\n' "$package_json" >&2
  exit 1
fi

editor_version="$(jq -er '.version | select(type == "string" and length > 0)' "$package_json")"

build_image() {
  docker build \
    --file "$script_dir/Dockerfile" \
    --build-arg "WEB_EDITOR_VERSION=$editor_version" \
    --tag "$image_name:$editor_version" \
    "$workspace_root"
}

run_compose() {
  WEB_EDITOR_TAG="$editor_version" docker compose \
    --project-directory "$workspace_root" \
    --file "$compose_file" \
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
