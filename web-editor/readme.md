# Self-hosted web editor

This deployment builds the existing editor from `_mermaid-bpmn-fork/` and serves its static production files with an unprivileged Nginx container. Docker generates the files in its builder stage and copies them into the runtime image.

## Prerequisites

- Run the commands from the workspace root in the environment with Docker present with `jq` available.

## Build and start

The deployment script reads the version from `_mermaid-bpmn-fork/package.json` with `jq` and uses it for both the image tag and OCI version label. From the workspace root in WSL, build the image with:

```bash
bash workbench/web-editor/deploy.sh build
```

To build the image and start the Compose service in one step, run:

```bash
bash workbench/web-editor/deploy.sh up
```

The script uses the workspace root as the Docker build context. It supplies editor source and the lockfile from `_mermaid-bpmn-fork/`, plus deployment configuration from `workbench/web-editor/`.

Open the editor at <http://localhost:8080/>. The upstream editor page is also available directly at <http://localhost:8080/editor.html>.

Stop and remove the service from the workspace root with:

```bash
bash workbench/web-editor/deploy.sh down
```

## Image details

- Image: `mermaid-bpmn-workbench-web-editor`
- Tag and `org.opencontainers.image.version`: version read automatically from `_mermaid-bpmn-fork/package.json` (currently `1.2.0`)
- Container port: `8080`; host port: `8080`
- OCI labels: title, description, source repository, version, and license
- Source repository label: <https://github.com/84-mermaid-bpmn-workbench/workbench>

## Source and delivery locations

`_mermaid-bpmn-fork/` owns the editor source and its production examples build. `workbench/web-editor/` owns this deployment documentation, Dockerfile, Compose configuration, ignore configuration, and Nginx configuration. The editor's production output is generated inside the Docker build and is not stored as a separate workspace artifact.
