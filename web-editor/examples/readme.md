# Deploy the Web Editor on a VPS

This example runs the published Mermaid BPMN Web Editor image on a VPS with Docker Compose. It starts two containers: the editor is available only to the Compose network on port `8080`, and Nginx publishes the configured host port and proxies requests to the editor. The deployment files are [compose.yaml](./compose.yaml), [.env.example](./.env.example), and [nginx.conf.template](./nginx.conf.template).

![Web Editor Deployment](.svg/Web%20Editor%20Deployment%20Container.svg)

## Before You Start

You need a VPS that you can access with SSH, Docker Engine, and the Docker Compose plugin. Install Docker by following Docker's [Ubuntu installation instructions](https://docs.docker.com/engine/install/ubuntu/) and [Compose plugin instructions](https://docs.docker.com/compose/install/linux/). Confirm the installation on the VPS:

```bash
docker compose version
```

For the direct-access setup below, allow TCP port `80` in the VPS provider's network firewall and in the operating-system firewall, if one is enabled. Use the VPS public IP address or a DNS name that resolves to it. If you use a domain, create its DNS record before opening the editor in a browser.

## Deploy With Direct HTTP Access

SSH to the VPS, clone the public `workbench` repository, and enter this example directory:

```bash
git clone https://github.com/84-mermaid-bpmn-workbench/workbench.git
cd workbench/web-editor/examples
```

Create the deployment configuration from the checked-in example:

```bash
cp .env.example .env
```

Edit `.env` and set the published image version and port. This configuration serves the editor at the root URL of the VPS:

```dotenv
WEB_EDITOR_IMAGE=valentineshidev/mermaid-bpmn-workbench-web-editor
WEB_EDITOR_TAG=latest
NGINX_IMAGE=nginx:alpine
NGINX_HOST_PORT=80
EDITOR_PATH=
```

`WEB_EDITOR_TAG=latest` selects the latest published editor image. `NGINX_HOST_PORT` is the TCP port exposed by the VPS. `EDITOR_PATH` is empty because this setup serves the editor at `/`.

Start the containers:

```bash
docker compose up --detach
```

Confirm that the proxy responds on the VPS:

```bash
curl --head http://127.0.0.1/
```

Then open `http://YOUR_VPS_IP/` or `http://editor.example.com/` from your own computer. Do not use `localhost` in that browser URL: on your computer it refers to your computer, not the VPS. Verify normal navigation, the examples gallery, and **Open SVG**.

## Serve the Editor Below a Path Prefix

Use a path prefix when this Compose deployment owns the public port but the editor should be served below a URL such as `/editor`. Set `EDITOR_PATH` to the prefix; it must start with `/` and must not end with `/`:

```dotenv
NGINX_HOST_PORT=80
EDITOR_PATH=/editor
```

Restart the containers after changing `.env`:

```bash
docker compose up --detach
```

Open `http://YOUR_VPS_IP/editor/` or `http://editor.example.com/editor/`. The bundled Nginx redirects `/editor` to `/editor/`, keeps the prefix in browser URLs, and removes it before passing requests to the editor.

## Use an Existing HTTPS Reverse Proxy

The Nginx container in this example serves HTTP only; it does not obtain or configure TLS certificates. If your VPS already has a TLS-terminating reverse proxy on the same host, bind this Compose deployment to an unused loopback port instead of port `80`, for example:

```dotenv
NGINX_HOST_PORT=127.0.0.1:8080
EDITOR_PATH=/editor
```

Configure the existing reverse proxy to forward `/editor` and `/editor/` to `http://127.0.0.1:8080` without removing `/editor`. The proxy must preserve the request path so that the bundled Nginx can apply the configured `EDITOR_PATH`. Configure TLS certificates and the domain on that existing proxy, then open `https://editor.example.com/editor/`.

## Update or Stop the Deployment

To update to the latest published editor image, rerun the deployment command:

```bash
docker compose up --detach
```

To stop and remove the containers while retaining the configuration file, run:

```bash
docker compose down
```
