# Self-hosted web editor

## Prerequisites

- Run the commands from the workspace root in an environment with Docker available.

## Build and start

The deployment script reads the image repository from `workbench/web-editor/.env` and the release metadata from `workbench/web-editor/release.json`. It uses the release version for the image tag and OCI version label. Each build uses `--no-cache`. From the workspace root in WSL, build the image with:

```bash
bash workbench/web-editor/deploy.sh build
```

The resulting image is `<WEB_EDITOR_IMAGE>:<version from release.json>`.

## Docker smoke E2E test

After building the image, run this command from `workbench/web-editor/` in WSL:

```bash
npm run test:smoke
```

The test starts the prepared local image, verifies that it serves the editor over HTTP, stops the container, and writes its result to `tests/.temp/release-verification.json`.

## Release preparation

From `workbench/web-editor/`, prepare the release branch and image with:

```bash
npm run release:prepare
```

The command removes the previous smoke-test result, creates or checks out `release/web-editor/<version from release.json>`, builds the image, and prints the required smoke-test command.

After the smoke test has written a green matching `release-verification.json`, publish the release branch with:

```bash
npm run release:publish
```

The command requires the expected release branch, at least one change under `web-editor`, and a green smoke result created after the prepared image build. It then asks for `A` or `C`. On `A`, it stages all non-ignored working-tree changes, commits `release(web-editor): <version from release.json>`, and pushes the branch to `origin`.

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
