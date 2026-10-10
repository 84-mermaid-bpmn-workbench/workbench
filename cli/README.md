# Mermaid-BPMN CLI

Render a Mermaid-BPMN diagram into an SVG file on your own machine.

The package renders through a locally installed Chrome or Chromium browser. It does not download a browser, guess where one is installed, or send your diagram to a service.

## Quick Start

Run the package without installing it globally:

```sh
npx mermaid-bpmn-cli --browser /path/to/chrome process.mmd
```

That reads `process.mmd` and writes `process.svg` next to it.

To keep the command in a development project instead:

```sh
npm install --save-dev mermaid-bpmn-cli
npx mermaid-bpmn-cli --browser /path/to/chrome process.mmd
```

The package requires Node.js 22.12 or later and a local Chrome or Chromium executable.

## Browser Configuration

Pass the executable path each time:

```sh
mermaid-bpmn-cli --browser /path/to/chrome process.mmd
```

Or set it once in `MERMAID_BPMN_CLI_BROWSER_PATH`:

```sh
MERMAID_BPMN_CLI_BROWSER_PATH=/path/to/chrome mermaid-bpmn-cli process.mmd
```

When both are present, `--browser` wins. The path must point to an executable browser file. The CLI does not search for one automatically.

## Command-Line Usage

Supply exactly one source file, either as the positional argument:

```sh
mermaid-bpmn-cli --browser /path/to/chrome process.mmd
```

Or with `--input`:

```sh
mermaid-bpmn-cli --browser /path/to/chrome --input process.mmd --output diagrams/process.svg
```

`--output` is optional, but when present it must end in `.svg`. Without it, the CLI replaces the source extension with `.svg`.

The CLI refuses an output path that would overwrite the source file. It reads and writes UTF-8 text and produces SVG only.

Run `mermaid-bpmn-cli --help` to see the complete command help.

## Programmatic API

The package also exports a function for tools that need SVG markup rather than a file:

```js
import { renderSvg } from 'mermaid-bpmn-cli';

const svg = await renderSvg('bpmn\n  startEvent', {
    browserPath: '/path/to/chrome'
});
```

`renderSvg()` returns the SVG string. It does not read or write your project files.

## Local Icon Packs

Mermaid-BPMN diagrams can use the bundled `icon:` packs: Lucide, Nonicons, Devicon Plain, Font Awesome Regular, Font Awesome Brands, and Material Design Icons. Their data is packaged with this CLI and loaded from local assets; rendering does not fetch icon data from a CDN.

## Development

Install the package dependencies, then run the ordinary local checks:

```sh
npm ci
npm run check-types
npm run lint
npm run test:foundation
npm run build
```

The E2E suite opens a local browser. Set `MERMAID_BPMN_CLI_BROWSER_PATH` to its executable path before running it:

```sh
npm run test:e2e
```

### Release

Before publishing a version, run the type check, linter, foundation suite, E2E suite, and build. Then inspect the package contents with:

```sh
npm pack --dry-run
```

Create the tarball with `npm pack`, install that tarball into a clean temporary consumer project, and verify both the `mermaid-bpmn-cli` command and the `renderSvg()` export there. Publish only the validated tarball version.

## Limitations

This package deliberately stays focused on SVG rendering. It does not provide PNG or PDF output, stdin, automatic browser discovery or browser downloading. Raise the [issue](https://github.com/84-mermaid-bpmn-workbench/workbench/issues), if you want some feature.

## License

The CLI source is available under the [MIT License](./LICENSE). See [third-party notices](./THIRD-PARTY-NOTICES.md) for the bundled icon data.
