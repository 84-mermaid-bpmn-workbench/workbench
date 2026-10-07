import { cwd } from 'node:process';
import { resolve } from 'node:path';

const root = cwd();

export const cliExecutableFixture = {
    browserPathEnvironmentVariable: 'MERMAID_BPMN_CLI_BROWSER_PATH',
    executablePath: resolve(root, '.delivery/.builds/dist/cli.js'),
    inputPath: resolve(root, 'tests/.ancillary/fixtures/CLIExecutable.render-source.mmd'),
    localIconInputPath: resolve(root, 'tests/.ancillary/fixtures/CLIExecutable.local-icon-source.mmd'),
    outputDirectory: resolve(root, 'tests/e2e/.temp'),
    outputPath: resolve(root, 'tests/e2e/.temp/render.svg'),
    localIconOutputPath: resolve(root, 'tests/e2e/.temp/render-with-local-icon.svg'),
    svgOpeningTag: '<svg',
    iconClassAttribute: 'class="bpmn-icon"'
};
