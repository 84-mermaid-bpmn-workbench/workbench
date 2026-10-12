# Self-Hosted Mermaid BPMN Editor

The package provides [the Docker image ](https://hub.docker.com/repository/docker/valentineshidev/mermaid-bpmn-workbench-web-editor/) to run the [editor](https://derari.github.io/mermaid-bpmn/editor) as a self-hosted service.

It is the part of a compact [Mermaid BPMN Workbench](../readme.md) for product owners and architects that also includes the [CLI](../cli/README.md) package to generate svg images from the Mermaid BPMN DSL.

See the intended workflow in the workbench [readme](../readme.md#intended-workflow).

See the self-hosted how-to [here](./examples).

## Development

Prerequisite: run the commands from the workspace root in an environment with Docker available.

To build the image for path-prefix verification, run:

```bash
docker build --file workbench/web-editor/Dockerfile --tag mermaid-bpmn-web-editor:prefix-check --build-arg WEB_EDITOR_VERSION=prefix-check --build-arg WEB_EDITOR_REVISION=working-tree .
```

### Verify a path-prefix deployment locally

Start the built `mermaid-bpmn-web-editor:prefix-check` image behind a local Nginx proxy that strips `/test-prefix`:

```powershell
docker network create web-editor-prefix-check
docker run --detach --name web-editor-prefix-check --network web-editor-prefix-check mermaid-bpmn-web-editor:prefix-check
docker run --detach --name web-editor-prefix-proxy --network web-editor-prefix-check --publish 8081:80 --entrypoint /bin/sh nginx:alpine -c 'printf "%s\n" "server { listen 80; location /test-prefix/ { proxy_pass http://web-editor-prefix-check:8080/; } }" > /etc/nginx/conf.d/default.conf && nginx -g "daemon off;"'
```

Open <http://localhost:8081/test-prefix/>. Verify that gallery navigation remains under `/test-prefix/examples/` and that **Open SVG** opens an SVG under `/test-prefix/svg/`.

Remove the local verification containers and network when finished:

```powershell
docker rm --force web-editor-prefix-proxy web-editor-prefix-check
docker network rm web-editor-prefix-check
```

To buld and start the image locally, run the script:

```bash
bash /deploy.sh build
```

The deployment script reads the image repository from `.env` and the release metadata from `release.json`. It uses the release version for the image tag and OCI version label. Each build uses `--no-cache`. The resulting image is `<WEB_EDITOR_IMAGE>:<version from release.json>`.

After building the image, run this command:

```bash
npm run test:smoke
```

The test starts the prepared local image, verifies that it serves the editor over HTTP, stops the container, and writes its result to `tests/.temp/release-verification.json`.

To build the image and start the Compose service in one step, run:

```bash
bash workbench/web-editor/deploy.sh up
```

The script uses the workspace root as the Docker build context. It supplies editor source and the lockfile from `_mermaid-bpmn-fork/`, plus the deployment configuration.

Open the editor at <http://localhost:8080/>.

Stop and remove the service Docker:

```bash
bash workbench/web-editor/deploy.sh down
```

## Release

Prepare the release branch and image with:

```bash
npm run release:prepare
```

The command removes the previous smoke-test result, validates the release version and image inputs against the latest `web-editor/v*` tag reachable from `master`, creates or checks out `release/web-editor/<version from release.json>` branch, builds the image, and prints the required smoke-test command.

After the smoke test has written a green matching `release-verification.json`, publish the release branch with:

```bash
npm run release:publish
```

The command requires the expected release branch, at least one change under `web-editor`, and a green smoke result created after the prepared image build. It then asks for `A` (Approve) or `C` (Cancel). On `A`, it stages all non-ignored working-tree changes, commits `release(web-editor): <version from release.json>`, and pushes the branch to `origin`.

### Publication via GitHub Actions

Pushing `release/web-editor/*` runs the GitHub Actions workflow. It checks out the fork revision recorded in `release.json`, builds and smoke-tests the image, pushes the tested image to Docker Hub, creates the `web-editor/v<version>` Git tag, and fast-forwards `master` to the release commit. If `master` has independent commits, the workflow reports that it cannot fast-forward and does not update `master`.

Configure the `DOCKERHUB_TOKEN` repository secret in GitHub with a Docker Hub access token that can push `valentineshidev/mermaid-bpmn-workbench-web-editor`.
