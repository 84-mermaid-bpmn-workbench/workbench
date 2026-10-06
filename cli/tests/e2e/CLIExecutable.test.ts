import { execFile } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { execPath, env } from 'node:process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { cliExecutableFixture } from '@tests/.ancillary/fixtures/CLIExecutable.fixture.js';

const execFileAsync = promisify(execFile);

type TCommandError = {
    stdout?: unknown;
    stderr?: unknown;
};

describe('[e2e] CLIExecutable Test', () => {
    it('+run(): Should render Mermaid-BPMN source to an SVG file', async () => {
        const browserExecutablePath = env[cliExecutableFixture.browserPathEnvironmentVariable];

        if (browserExecutablePath === undefined) {
            throw new Error(`${cliExecutableFixture.browserPathEnvironmentVariable} must name a Chrome or Chromium executable.`);
        }

        await mkdir(cliExecutableFixture.outputDirectory, { recursive: true });
        await rm(cliExecutableFixture.outputPath, { force: true });
        try {
            await execFileAsync(
                execPath,
                [cliExecutableFixture.executablePath, '--input', cliExecutableFixture.inputPath, '--output', cliExecutableFixture.outputPath],
                { env: { ...env, [cliExecutableFixture.browserPathEnvironmentVariable]: browserExecutablePath } }
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const standardOutput = getCommandOutput(error, 'stdout');
            const standardError = getCommandOutput(error, 'stderr');

            throw new Error(`${message}\nstdout:\n${standardOutput}\nstderr:\n${standardError}`, { cause: error });
        }

        const actual = await readFile(cliExecutableFixture.outputPath, 'utf8');

        expect(actual).toContain(cliExecutableFixture.svgOpeningTag);
    });
});

function getCommandOutput(error: unknown, property: 'stdout' | 'stderr'): string {
    if (typeof error !== 'object' || error === null || !(property in error)) {
        return '';
    }

    const commandError = error as TCommandError;
    const output = commandError[property];

    return typeof output === 'string' ? output : '';
}
