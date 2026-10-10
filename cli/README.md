# Mermaid-BPMN CLI

Render a Mermaid-BPMN diagram into an SVG file on your own machine through a locally installed Chrome or Chromium browser.

## Quick Start

The package requires Node.js 22.12 or later and a local Chrome or Chromium executable.

Run:

```sh
or npm install -g mermaid-bpmn-cli
# or
npm install --save-dev mermaid-bpmn-cli
# then
npx mermaid-bpmn-cli --browser /path/to/chrome process.mmd
```

That reads `process.mmd` and writes `process.svg` next to it.

Run `mermaid-bpmn-cli --help` to see the complete command help.

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

Mermaid-BPMN diagrams can use the bundled `icon:` packs: [Lucide](https://lucide.dev/), [Nonicons](https://icon-sets.iconify.design/nonicons/), [Devicon Plain](https://devicon.dev/), [Font Awesome Regular](https://fontawesome.com/), [Font Awesome Brands](https://fontawesome.com/), and [Material Design Icons](https://pictogrammers.com/library/mdi/). Their data is packaged with this CLI and loaded from local assets; rendering does not fetch icon data from a CDN.

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

The command shows up to ten commit messages since the latest `cli/v*` tag, displays the version committed in `master`’s `cli/package.json`, and asks for `[1] Patch`, `[5] Minor`, or `[9] Major`. It calculates the selected release version from that committed version; for example, `[1] Patch` changes `0.0.1` into `0.0.2`. The command creates `release/cli/<VERSION>` from `master`, updates the package manifests with the selected version, and runs the full release check. It then asks you to accept or cancel. Accepting commits only the version-manifest changes as `release(cli): <VERSION>` and pushes the release branch.

GitHub Actions verifies the pushed release branch and opens a pull request to `master`. After the maintainer merges that pull request, Actions verifies the exact merge commit again, publishes the package through npm trusted publishing, creates the matching `cli/v<VERSION>` tag, and creates a GitHub release. Pull the merged `master` branch and tags locally afterwards.

#### Initial Publication

Publish the first version directly with npm and complete its interactive two-factor authentication challenge:

```powershell
$env:MERMAID_BPMN_CLI_BROWSER_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run release:check
npm login
npm publish
```

Then configure `cli-release.yml` as the `mermaid-bpmn-cli` package's npm trusted publisher. Select GitHub Actions, set the repository to `84-mermaid-bpmn-workbench/workbench`, and allow `npm publish`. Delete the `NPM_TOKEN` GitHub Actions secret. Future merged release pull requests publish through GitHub OIDC; no npm access token is used.

## Limitations

This package deliberately stays focused on SVG rendering. It does not provide PNG or PDF output, stdin, automatic browser discovery or browser downloading. Raise the [issue](https://github.com/84-mermaid-bpmn-workbench/workbench/issues), if you want some feature.

## License

The CLI source is available under the [MIT License](./LICENSE). See [third-party notices](./THIRD-PARTY-NOTICES.md) for the bundled icon data.
