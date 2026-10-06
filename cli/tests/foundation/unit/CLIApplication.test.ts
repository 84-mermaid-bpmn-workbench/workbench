import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cliApplicationFixture } from '@fixtures/index.js';
import { CLIApplication } from '@src/CLIApplication.js';

const { mockReadFile, mockRenderSvg, mockWriteFile } = vi.hoisted(() => ({
    mockReadFile: vi.fn(),
    mockRenderSvg: vi.fn(),
    mockWriteFile: vi.fn()
}));

vi.mock('node:fs/promises', () => ({
    readFile: mockReadFile,
    writeFile: mockWriteFile
}));

vi.mock('@src/index.js', () => ({
    renderSvg: mockRenderSvg
}));

describe('[unit] CLIApplication Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockReadFile.mockResolvedValue(cliApplicationFixture.source);
        mockRenderSvg.mockResolvedValue(cliApplicationFixture.svg);
    });

    it('constructor(): Should create the expected CLI application', () => {
        const actual = new CLIApplication();

        expect(actual).toBeInstanceOf(CLIApplication);
    });

    it('+run() [success] #1: Should read the resolved input source as UTF-8', async () => {
        const application = new CLIApplication();

        await application.run([
            '--browser',
            cliApplicationFixture.browserExecutablePath,
            '--input',
            cliApplicationFixture.inputPath
        ]);

        expect(mockReadFile).toHaveBeenCalledWith(cliApplicationFixture.inputPath, 'utf8');
    });

    it('+run() [success] #2: Should render the input source with the resolved browser path', async () => {
        const application = new CLIApplication();

        await application.run([
            '--browser',
            cliApplicationFixture.browserExecutablePath,
            '--input',
            cliApplicationFixture.inputPath
        ]);

        expect(mockRenderSvg).toHaveBeenCalledWith(cliApplicationFixture.source, {
            browserPath: cliApplicationFixture.browserExecutablePath
        });
    });

    it('+run() [success] #3: Should write the rendered SVG as UTF-8 to the resolved output path', async () => {
        const application = new CLIApplication();

        await application.run([
            '--browser',
            cliApplicationFixture.browserExecutablePath,
            '--input',
            cliApplicationFixture.inputPath,
            '--output',
            cliApplicationFixture.outputPath
        ]);

        expect(mockWriteFile).toHaveBeenCalledWith(
            cliApplicationFixture.outputPath,
            cliApplicationFixture.svg,
            'utf8'
        );
    });

    it('+run() [failure]: Should reject an invalid CLI invocation', async () => {
        const application = new CLIApplication();

        await expect(application.run([])).rejects.toThrow();
    });
});
