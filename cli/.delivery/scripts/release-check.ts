import { execFile as executeFile, spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(executeFile);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const cliDirectory = resolve(scriptDirectory, '../..');
const temporaryDirectory = resolve(cliDirectory, '.delivery/.temp/release-check');
const browserPathEnvironmentVariable = 'MERMAID_BPMN_CLI_BROWSER_PATH';
const browserNoSandboxEnvironmentVariable = 'MERMAID_BPMN_CLI_BROWSER_NO_SANDBOX';
const browserExecutablePath = requireBrowserPath();

try {
    await rm(temporaryDirectory, { recursive: true, force: true });
    await runNpm(['run', 'check-types']);
    await runNpm(['run', 'lint']);
    await runNpm(['run', 'test:foundation'], { [browserNoSandboxEnvironmentVariable]: 'false' });
    await runNpm(['run', 'build']);
    await runNpm(['run', 'vitest:e2e'], { [browserPathEnvironmentVariable]: browserExecutablePath });

    const packagePreview = await previewPackage();
    verifyPackagePreview(packagePreview);

    const tarballPath = await pack();
    await verifyConsumerInstallation(tarballPath);
} finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
}

function requireBrowserPath(): string {
    const actual = process.env[browserPathEnvironmentVariable];

    if (typeof actual !== 'string' || actual.trim().length === 0) {
        throw new Error(`${browserPathEnvironmentVariable} must name a Chrome or Chromium executable.`);
    }

    return actual;
}

async function previewPackage(): Promise<TPackagePreview> {
    const output = await runNpm(['pack', '--json', '--dry-run'], {}, 'pipe');
    const parsed = JSON.parse(output.stdout) as Record<string, TPackagePreview>;
    const preview = Object.values(parsed)[0];

    if (preview === undefined || typeof preview.filename !== 'string' || !Array.isArray(preview.files)) {
        throw new Error('npm pack --dry-run did not return a package file list.');
    }

    return preview;
}

function verifyPackagePreview(preview: TPackagePreview): void {
    const paths = new Set(preview.files.map((file) => file.path));
    const requiredPaths = [
        '.delivery/.builds/dist/cli.js',
        '.delivery/.builds/dist/index.js',
        '.delivery/.builds/dist/index.d.ts',
        '.delivery/.builds/dist/assets/renderer.html',
        'README.md',
        'LICENSE',
        'THIRD-PARTY-NOTICES.md',
        'package.json',
    ];
    const missingPaths = requiredPaths.filter((path) => !paths.has(path));

    if (missingPaths.length > 0) {
        throw new Error(`npm package preview is missing: ${missingPaths.join(', ')}.`);
    }
}

async function pack(): Promise<string> {
    const output = await runNpm(['pack', '--json'], {}, 'pipe');
    const parsed = JSON.parse(output.stdout) as Record<string, TPackagePreview>;
    const packageResult = Object.values(parsed)[0];

    if (packageResult === undefined || typeof packageResult.filename !== 'string') {
        throw new Error('npm pack did not return a package result.');
    }

    return resolve(cliDirectory, packageResult.filename);
}

async function verifyConsumerInstallation(tarballPath: string): Promise<void> {
    const consumerDirectory = join(temporaryDirectory, 'consumer');
    const sourcePath = join(consumerDirectory, 'process.mmd');
    const outputPath = join(consumerDirectory, 'process.svg');

    try {
        await mkdir(consumerDirectory, { recursive: true });
        await runNpm(['init', '--yes'], {}, 'inherit', consumerDirectory);
        await runNpm(['install', tarballPath], {}, 'inherit', consumerDirectory);
        await writeFile(sourcePath, 'bpmn\n    startEvent', 'utf8');
        await runNpm([
            'exec', '--', 'mermaid-bpmn-cli', '--input', sourcePath, '--output', outputPath, '--browser', browserExecutablePath,
        ], {}, 'inherit', consumerDirectory);

        const renderedSVG = await readFile(outputPath, 'utf8');
        if (!renderedSVG.includes('<svg')) {
            throw new Error('The installed CLI did not render an SVG file.');
        }

        const apiSource = [
            "import { renderSvg } from 'mermaid-bpmn-cli';",
            `const svg = await renderSvg('bpmn\\n    startEvent', { browserPath: ${JSON.stringify(browserExecutablePath)} });`,
            "if (!svg.includes('<svg')) throw new Error('The installed API did not return SVG.');",
        ].join('\n');
        const apiPath = join(consumerDirectory, 'verify-api.mjs');
        await writeFile(apiPath, apiSource, 'utf8');
        await runCommand(process.execPath, [apiPath], consumerDirectory);
    } finally {
        await rm(consumerDirectory, { recursive: true, force: true });
        await rm(tarballPath, { force: true });
    }
}

async function runNpm(argumentsList: string[], environment: NodeJS.ProcessEnv = {}, stdio: 'inherit' | 'pipe' = 'inherit', cwd = cliDirectory): Promise<{ stdout: string }> {
    const npmExecutable = process.env.npm_execpath;
    if (npmExecutable === undefined) {
        throw new Error('npm_execpath is required to run npm release checks.');
    }

    return await runCommand(process.execPath, [npmExecutable, ...argumentsList], cwd, environment, stdio);
}

async function runCommand(command: string, argumentsList: string[], cwd: string, environment: NodeJS.ProcessEnv = {}, stdio: 'inherit' | 'pipe' = 'inherit'): Promise<{ stdout: string }> {
    if (stdio === 'pipe') {
        const output = await execFile(command, argumentsList, { cwd, env: { ...process.env, ...environment } });
        return { stdout: output.stdout };
    }

    await new Promise<void>((resolvePromise, reject) => {
        const childProcess = spawn(command, argumentsList, { cwd, env: { ...process.env, ...environment }, stdio });
        childProcess.once('error', reject);
        childProcess.once('exit', (exitCode) => {
            if (exitCode === 0) {
                resolvePromise();
                return;
            }

            reject(new Error(`${basename(command)} exited with status ${exitCode ?? 'unknown'}.`));
        });
    });

    return { stdout: '' };
}

type TPackagePreview = {
    filename: string;
    files: Array<{ path: string }>;
};
