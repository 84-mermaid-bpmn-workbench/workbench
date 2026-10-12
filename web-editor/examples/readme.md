# How to Deploy on Your Host

This is how to deploy the editor onto your VPS (you can use a basic one, which is roughly $6-7/month, with the latest Ubuntu version).

![Web Editor Deployment](.svg/Web%20Editor%20Deployment%20Container.svg)

## Deploy the editor

```bash
cd workbench/web-editor/examples
cp .env.example .env
```

Set the required image tag and host port in `.env`.

For root deployment, keep this value empty:

```dotenv
EDITOR_PATH=
```

For path-prefix deployment, set the required prefix. It must start with `/` and must not end with `/`:

```dotenv
EDITOR_PATH=/example-prefix
```

Start the deployment:

```bash
docker compose up --detach
```

Open <http://localhost:8080/> for root deployment, or <http://localhost:8080/example-prefix/> for the example path-prefix deployment. The proxy redirects the bare prefix to its trailing-slash form and strips the prefix before forwarding requests to the editor.

Verify normal navigation, the examples gallery, and **Open SVG**.

Stop the deployment:

```bash
docker compose down
```

To deploy a newer editor image, update `WEB_EDITOR_TAG` in `.env`, then run:

```bash
docker compose pull web-editor
docker compose up --detach
```

## TLS and domains

This example listens for HTTP on `NGINX_HOST_PORT`. Place it behind an existing TLS-terminating reverse proxy, or add your own TLS certificate configuration before exposing it directly on the Internet.
