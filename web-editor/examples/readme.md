# Deploy the Web Editor on a VPS

This example deploys the published Mermaid BPMN Web Editor image behind Nginx with a Let’s Encrypt certificate. [compose.yaml](./compose.yaml) defines the editor, HTTPS proxy, and certificate operations; [.env.example](./.env.example) contains the deployment settings; [nginx.conf.template](./nginx.conf.template) serves ACME challenges, redirects HTTP to HTTPS, and proxies the editor.

![Web Editor Deployment](.svg/Web%20Editor%20Deployment%20Container.svg)

## Before You Start

You need a VPS that you can access with SSH, Docker Engine, and the Docker Compose plugin. Install Docker by following Docker's [Ubuntu installation instructions](https://docs.docker.com/engine/install/ubuntu/) and [Compose plugin instructions](https://docs.docker.com/compose/install/linux/). Confirm the installation on the VPS:

```bash
docker compose version
```

Create a DNS record for the editor domain that resolves to the VPS public IP address. Allow inbound TCP ports `80` and `443` in the VPS provider's network firewall and in the operating-system firewall. The HTTP-01 validation used here requires public access to port `80`; see [Let’s Encrypt’s challenge documentation](https://letsencrypt.org/docs/challenge-types/).

## Deploy Via SSH

SSH to the VPS, clone the public `workbench` repository, and enter this example directory:

```bash
git clone https://github.com/84-mermaid-bpmn-workbench/workbench.git
cd workbench/web-editor/examples
```

Create the deployment configuration from the checked-in example:

```bash
cp .env.example .env
```

In `.env`, replace the placeholder `EDITOR_DOMAIN` and `CERTBOT_EMAIL` values from [.env.example](./.env.example). The remaining settings are ready to use.

Issue the certificate before starting Nginx. Nothing else may listen on port `80` while this command runs:

```bash
docker compose run --rm --service-ports certificate-issue
```

Start the editor and HTTPS proxy:

```bash
docker compose up --detach
```

Confirm that HTTP redirects to HTTPS and that the HTTPS endpoint responds:

```bash
curl --head http://YOUR_DOMAIN/
curl --head https://YOUR_DOMAIN/
```

Open `https://YOUR_DOMAIN/` from your own computer. Verify normal navigation, the examples gallery, and **Open SVG**.

## Serve the Editor Below a Path Prefix

Use a path prefix when the editor should be served below a URL such as `/editor`. In `.env`, set `EDITOR_PATH` to `/editor`; it must start with `/` and must not end with `/`. [nginx.conf.template](./nginx.conf.template) implements the redirect and prefix removal.

Restart the containers after changing `.env`:

```bash
docker compose up --detach
```

Open `https://YOUR_DOMAIN/editor/`. Nginx redirects `/editor` to `/editor/`, keeps the prefix in browser URLs, and removes it before passing requests to the editor.

## Renew the Certificate

Run the certificate-renewal service periodically, then restart Nginx so it loads a renewed certificate:

```bash
docker compose run --rm certificate-renew
docker compose restart nginx
```

Schedule those commands on the VPS before the certificate expires. Certbot explains its renewal behavior in [its documentation](https://eff-certbot.readthedocs.io/en/stable/using.html#renewing-certificates).

## Update or Stop the Deployment

To update to the latest published editor image, rerun the deployment command:

```bash
docker compose up --detach
```

To stop and remove the containers while retaining the configuration file, run:

```bash
docker compose down
```
