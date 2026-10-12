The image source can support arbitrary path prefixes without changing the fork.

The necessary changes are:

1. Build Vite with a relative base.

Change the Docker build command from:

```dockerfile
RUN npm run build:examples -- --base=/ --outDir=/build \
```

to:

```dockerfile
RUN npm run build:examples -- --base=./ --outDir=/build \
```

Vite explicitly supports `base: "./"` for deployments where the public base path is unknown at build time; it makes generated asset URLs relative to each HTML document. [Vite documentation](https://vite.dev/guide/build)

2. Make the post-build navigation links relative.

In `prepare-site.mjs`, replace the absolute deployed links:

```js
const deployedGalleryLink = 'class="nav" href="/examples/"';
const deployedEditorLink = '<a href="/">live editor</a>';
```

with:

```js
const deployedGalleryLink = 'class="nav" href="./examples/"';
const deployedEditorLink = '<a href="../">live editor</a>';
```

3. Adjust asset URLs in the copied gallery page.

`prepare-site.mjs` copies the root-built gallery page to `/examples/index.html`. With a relative Vite base, asset references in that copied file must change from `./assets/...` to `../assets/...`; otherwise the gallery attempts to load nonexistent `/examples/assets/...` files.

Do this only for the copied gallery HTML, after copying it. The root editor HTML must retain `./assets/...`.

4. Release a new image version and use it in the Swarm stack.

The current `release.json` version is `1.0.4`; the release process will require a higher version than the latest published release. Update the IaC only after that immutable versioned image is published.

5. Simplify the BPMN Traefik configuration.

After deploying the relative-base image, retain only the prefix router with `StripPrefix(/8e32d454e)`. Remove:

- the host-wide prefix redirect;
- the root `/open-svg.service-worker.js` exception;
- the root `/svg/` exception.

The browser will then request:

```text
/8e32d454e/open-svg.service-worker.js
/8e32d454e/svg/<uuid>.svg
```

The prefix router strips the prefix before Nginx serves the worker. The worker’s scope is `/8e32d454e/`, which matches the SVG URL it stores in Cache Storage.

6. Add an actual path-prefix browser test.

The existing smoke test only checks `GET /` from the container; it cannot detect asset-base, Service Worker, or SVG-popup failures. Add a browser E2E test behind a test reverse proxy mounted at a prefix. It must verify:

- editor assets load at `/test-prefix/`;
- gallery navigation remains under `/test-prefix/examples/`;
- clicking **Open SVG** opens `/test-prefix/svg/<uuid>.svg`;
- the popup receives SVG content rather than a 404.

No fork inspection or fork changes are needed for this plan. The relevant problem is fully in the image build and post-build site preparation: [Dockerfile](D:\dev\oth\84-mermaid-bpmn-workbench\workbench\web-editor\Dockerfile:9), [prepare-site.mjs](D:\dev\oth\84-mermaid-bpmn-workbench\workbench\web-editor\prepare-site.mjs:6), and [current smoke test](D:\dev\oth\84-mermaid-bpmn-workbench\workbench\web-editor\tests\runDockerSmokeE2E.mjs:79).
