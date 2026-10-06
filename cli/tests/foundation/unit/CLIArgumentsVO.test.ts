import { afterEach, describe, expect, it, vi } from 'vitest';
import { cliArgumentsFixture } from '@fixtures/index.js';
import { CLIArgumentsVO } from '@src/CLIArguments.valueobject.js';

describe('[unit] CLIArgumentsVO Test', () => {
    const originalBrowserExecutablePath = process.env[cliArgumentsFixture.browserEnvironmentVariableName];

    afterEach(() => {
        vi.restoreAllMocks();

        if (originalBrowserExecutablePath === undefined) {
            delete process.env[cliArgumentsFixture.browserEnvironmentVariableName];
            return;
        }

        process.env[cliArgumentsFixture.browserEnvironmentVariableName] = originalBrowserExecutablePath;
    });

    it('+create() #1: Should create the expected request from command-line options', () => {
        const actual = CLIArgumentsVO.create([
            '--browser',
            cliArgumentsFixture.browserExecutablePath,
            '--input',
            cliArgumentsFixture.inputPath,
            '--output',
            cliArgumentsFixture.outputPath
        ]);

        expect(actual.input).toEqual(cliArgumentsFixture.inputPath);
        expect(actual.output).toEqual(cliArgumentsFixture.outputPath);
        expect(actual.browser).toEqual(cliArgumentsFixture.browserExecutablePath);
    });

    it('+create() #2: Should use the browser executable path from the environment', () => {
        process.env[cliArgumentsFixture.browserEnvironmentVariableName] = cliArgumentsFixture.environmentBrowserExecutablePath;

        const actual = CLIArgumentsVO.create([cliArgumentsFixture.inputPath]);

        expect(actual.browser).toEqual(cliArgumentsFixture.environmentBrowserExecutablePath);
    });

    it('+create() #3: Should derive an SVG output path for an extensionless input', () => {
        const actual = CLIArgumentsVO.create([
            '--browser',
            cliArgumentsFixture.browserExecutablePath,
            cliArgumentsFixture.extensionlessInputPath
        ]);

        expect(actual.output).toEqual(cliArgumentsFixture.extensionlessOutputPath);
    });

    it('+create() [failure] #1: Should reject conflicting input sources', () => {
        expect(() => CLIArgumentsVO.create([
            '--browser',
            cliArgumentsFixture.browserExecutablePath,
            '--input',
            cliArgumentsFixture.inputPath,
            cliArgumentsFixture.positionalInputPath
        ])).toThrow(cliArgumentsFixture.conflictingInputSourcesError);
    });

    it('+create() [failure] #2: Should reject a missing input source', () => {
        expect(() => CLIArgumentsVO.create([
            '--browser',
            cliArgumentsFixture.browserExecutablePath
        ])).toThrow(cliArgumentsFixture.missingInputError);
    });

    it('+create() [failure] #3: Should reject a missing browser path', () => {
        delete process.env[cliArgumentsFixture.browserEnvironmentVariableName];

        expect(() => CLIArgumentsVO.create([cliArgumentsFixture.inputPath])).toThrow();
    });

    it('+create() [failure] #4: Should display help before the successful Commander exit', () => {
        const output: string[] = [];
        const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
            output.push(String(chunk));
            return true;
        });

        expect(() => CLIArgumentsVO.create(['--help'])).toThrow();

        expect(stdoutWrite).toHaveBeenCalled();
        expect(output.join('')).toContain(cliArgumentsFixture.helpUsage);

        for (const helpExample of cliArgumentsFixture.helpExamples) {
            expect(output.join('')).toContain(helpExample);
        }
    });
});
