FROM node:22-bookworm-slim AS builder
WORKDIR /workspace/mermaid-bpmn

COPY _mermaid-bpmn-fork/package.json _mermaid-bpmn-fork/package-lock.json ./
RUN npm ci

COPY _mermaid-bpmn-fork/ ./
COPY workbench/web-editor/prepare-site.mjs /prepare-site.mjs
RUN npm run build:examples -- --base=/ --outDir=/build \
    && node /prepare-site.mjs

FROM nginxinc/nginx-unprivileged:alpine AS runtime
ARG WEB_EDITOR_VERSION

LABEL org.opencontainers.image.title="mermaid-bpmn-workbench-web-editor" \
      org.opencontainers.image.description="Self-hosted Mermaid BPMN web editor" \
      org.opencontainers.image.source="https://github.com/84-mermaid-bpmn-workbench/workbench" \
      org.opencontainers.image.version="${WEB_EDITOR_VERSION}" \
      org.opencontainers.image.licenses="MIT"

COPY workbench/web-editor/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/ /usr/share/nginx/html/

EXPOSE 8080
