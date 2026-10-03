# Self-hosted web editor

## Prerequisites

- Run the commands from the workspace root in the environment with Docker present with `jq` available.

## Build and start

The deployment script reads the version from `_mermaid-bpmn-fork/package.json` with `jq` and uses it for both the image tag and OCI version label. Each build uses `--no-cache`. From the workspace root in WSL, build the image with:

```bash
bash workbench/web-editor/deploy.sh build
```

To build the image and start the Compose service in one step, run:

```bash
bash workbench/web-editor/deploy.sh up
```

The script uses the workspace root as the Docker build context. It supplies editor source and the lockfile from `_mermaid-bpmn-fork/`, plus deployment configuration from `workbench/web-editor/`.

Open the editor at <http://localhost:8080/>.

Stop and remove the service from the workspace root with:

```bash
bash workbench/web-editor/deploy.sh down
```
