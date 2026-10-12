# Mermaid BPMN Workbench

`mermaid-bpmn-workbench` makes Mermaid-BPMN practical for local and self-hosted BPMN-as-code workflows. It builds on the great [`mermaid-bpmn`](https://github.com/derari/mermaid-bpmn) package that does the heavy lifting. The workbench keeps diagrams as local source that can be edited, previewed, and generated as SVG without an external SaaS service, as well as provides the BPMN editor as a Docker container convenient for self-hosting.

## Workbench Packages

- [[PUBLISHED](https://hub.docker.com/repository/docker/valentineshidev/mermaid-bpmn-workbench-web-editor/general)] **Self-hosted live editor**: a production Docker deployment of the upstream editor with developer experience improvements. It provides 30% and 50% source-pane presets, keeps long source lines unwrapped with horizontal scrolling, and can open the current rendered SVG in a separate browser tab.
- [[PUBLISHED](https://www.npmjs.com/package/mermaid-bpmn-cli)] **CLI**: a `mermaid-bpmn-cli` npm package and separate Docker delivery that render Mermaid-BPMN source to SVG. The npm package uses a locally managed compatible Chrome or Chromium browser; the Docker image includes its tested browser and fonts.
- [PLANNED] **VS Code extension** — a planned VSIX that provides local Mermaid-BPMN preview and SVG generation through the CLI's programmatic renderer.

## The Repository Organization

The repository is simple monorepo with independently developed and published packages. See the web editor source in [web-editor](./web-editor) folde and the CLI in [cli](./cli) folder.

## Intended Workflow

```text
local Mermaid-BPMN source
        |
        +--> self-hosted live editor
        |      +--> Write the DSL code
        |      +--> Open SVG in a separate tab
        |
        +--> mermaid-bpmn-cli --> SVG
        |
        +--> VS Code preview --> SVG
```
