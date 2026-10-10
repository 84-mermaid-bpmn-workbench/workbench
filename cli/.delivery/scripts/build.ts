import { spawn } from 'node:child_process';
import { copyFile, mkdir, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Command, Option } from 'commander';
import { build } from 'esbuild';

const browserEntryPoint = fileURLToPath(new URL('../../src/BrowserPageRenderer.ts', import.meta.url));
const rendererSource = fileURLToPath(new URL('../../assets/renderer.html', import.meta.url));
const outputDirectory = fileURLToPath(new URL('../.builds/dist', import.meta.url));
const rendererOutputDirectory = fileURLToPath(new URL('../.builds/dist/assets', import.meta.url));
const rendererOutput = fileURLToPath(new URL('../.builds/dist/assets/renderer.html', import.meta.url));
const nodeOutput = fileURLToPath(new URL('../.builds/dist/cli.js', import.meta.url));
const typescriptConfiguration = fileURLToPath(new URL('../configuration/tsconfig.json', import.meta.url));
const shebang = '#!/usr/bin/env node\n';
const require = createRequire(import.meta.url);
const typescriptCompiler = require.resolve('typescript/lib/tsc.js');

const program = new Command()
    .name('build')
    .description('Build Mermaid-BPMN CLI delivery artifacts.')
    .addOption(
        new Option('-t, --target <target>', 'Select the delivery artifact stage.')
            .choices(['all', 'clean', 'node', 'browser'])
            .default('all')
    )
    .showSuggestionAfterError()
    .showHelpAfterError()
    .helpOption('-h, --help', 'Display build help.')
    .addHelpText(
        'after',
        `
Examples:
  tsx .delivery/scripts/build.ts --target=all
  tsx .delivery/scripts/build.ts --target=node
  tsx .delivery/scripts/build.ts --target=browser
  tsx .delivery/scripts/build.ts --target=clean
`
    );

program.parse();

const { target } = program.opts<{ target: 'all' | 'clean' | 'node' | 'browser' }>();

if (target === 'all') {
    await clean();
    await buildNode();
    await buildBrowser();
} else if (target === 'clean') {
    await clean();
} else if (target === 'node') {
    await buildNode();
} else {
    await buildBrowser();
}

async function clean(): Promise<void> {
    await rm(outputDirectory, { recursive: true, force: true });
}

async function buildNode(): Promise<void> {
    await runCommand(process.execPath, [typescriptCompiler, '--build', '--force', typescriptConfiguration]);
    await verifyNodeExecutable();
}

async function buildBrowser(): Promise<void> {
    await mkdir(outputDirectory, { recursive: true });
    await mkdir(rendererOutputDirectory, { recursive: true });
    await build({
        bundle: true,
        entryPoints: [browserEntryPoint],
        format: 'iife',
        outdir: outputDirectory,
        platform: 'browser',
        target: 'es2022',
        entryNames: 'BrowserPageRenderer'
    });
    await copyFile(rendererSource, rendererOutput);
}

async function verifyNodeExecutable(): Promise<void> {
    const nodeExecutable = await readFile(nodeOutput, 'utf8');

    if (!nodeExecutable.startsWith(shebang)) {
        throw new Error(`The CLI executable must start with ${JSON.stringify(shebang.trim())}: ${nodeOutput}`);
    }
}

async function runCommand(command: string, argumentsList: string[]): Promise<void> {
    await new Promise<void>((resolve, reject) => {
        const childProcess = spawn(command, argumentsList, { stdio: 'inherit' });

        childProcess.once('error', reject);
        childProcess.once('exit', (exitCode) => {
            if (exitCode === 0) {
                resolve();
                return;
            }

            reject(new Error(`${command} exited with code ${exitCode ?? 'unknown'}.`));
        });
    });
}
