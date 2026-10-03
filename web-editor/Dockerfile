FROM node:22-bookworm-slim AS builder
WORKDIR /workspace/mermaid-bpmn

COPY _mermaid-bpmn-fork/package.json _mermaid-bpmn-fork/package-lock.json ./
RUN npm ci

COPY _mermaid-bpmn-fork/ ./
RUN npm run build:examples -- --base=/ --outDir=/build \
    && cp /build/editor.html /build/index.html

FROM nginxinc/nginx-unprivileged:alpine AS runtime
ARG WEB_EDITOR_VERSION
ARG VCS_REF=unknown

LABEL org.opencontainers.image.title="mermaid-bpmn-workbench-web-editor" \
      org.opencontainers.image.description="Self-hosted Mermaid BPMN web editor" \
      org.opencontainers.image.source="https://github.com/84-mermaid-bpmn-workbench/workbench" \
      org.opencontainers.image.version="${WEB_EDITOR_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.licenses="MIT"

COPY workbench/web-editor/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/ /usr/share/nginx/html/

EXPOSE 8080
