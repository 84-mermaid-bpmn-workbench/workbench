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

Prepare a release locally after setting the browser path:

```powershell
$env:MERMAID_BPMN_CLI_BROWSER_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run release:prepare
```

The first release uses `0.1.0`. Later releases show the last ten commit messages since the latest `cli/v*` tag and ask whether to increment the major, minor, or patch version. The command creates `release/cli/<VERSION>`, runs the full release check, then asks you to accept or cancel. Accepting stages the workbench changes, creates `release(cli): <VERSION>`, and pushes the release branch.

GitHub Actions verifies the pushed release branch and opens a pull request to `master`. After the maintainer merges that pull request, Actions verifies the exact merge commit again, publishes the package, creates the matching `cli/v<VERSION>` tag, and creates a GitHub release. Pull the merged `master` branch and tags locally afterwards.

#### Initial Publication

npm requires the package to exist before it can be configured as a trusted publisher. The initial `0.1.0` publication therefore uses a temporary granular write token stored as the `NPM_TOKEN` GitHub Actions secret. After that publication, configure `.github/workflows/cli-release.yml` as the package's npm trusted publisher and remove `NPM_TOKEN`; later releases then use GitHub Actions OIDC.

> [!NOTE]
> Stage-only tokens cannot publish new package versions directly. Versions must be staged with `npm stage publish` and then promoted by a maintainer with two-factor authentication (2FA) enabled. This token can still deprecate versions and move dist-tags.

## Limitations

This package deliberately stays focused on SVG rendering. It does not provide PNG or PDF output, stdin, automatic browser discovery or browser downloading. Raise the [issue](https://github.com/84-mermaid-bpmn-workbench/workbench/issues), if you want some feature.

## License

The CLI source is available under the [MIT License](./LICENSE). See [third-party notices](./THIRD-PARTY-NOTICES.md) for the bundled icon data.
