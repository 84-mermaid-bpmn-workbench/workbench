import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommanderError } from 'commander';
import { cliApplicationFixture } from '@tests/.ancillary/fixtures/index.js';

const { mockCLIApplication, mockRun } = vi.hoisted(() => {
    const mockRun = vi.fn();
    const mockCLIApplication = vi.fn().mockImplementation(function CLIApplication() {
        return { run: mockRun };
    });

    return { mockCLIApplication, mockRun };
});

vi.mock('@src/CLIApplication.js', () => ({
    CLIApplication: mockCLIApplication
}));

describe('[unit] CLI executable Test', () => {
    const originalArgumentsList = process.argv;
    const originalExitCode = process.exitCode;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        mockRun.mockResolvedValue(undefined);
        process.argv = ['node', 'mermaid-bpmn-cli', ...cliApplicationFixture.argumentsList];
    });

    afterEach(() => {
        vi.restoreAllMocks();
        process.argv = originalArgumentsList;
        process.exitCode = originalExitCode;
    });

    it('module [success] #1: Should pass process user arguments to the CLI application', async () => {
        await importCLIExecutable();

        expect(mockCLIApplication).toHaveBeenCalledOnce();
        expect(mockRun).toHaveBeenCalledWith(cliApplicationFixture.argumentsList);
    });

    it('module [success] #2: Should report an application error on stderr and set a failure exit code', async () => {
        const stderrWrite = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
        mockRun.mockRejectedValue(cliApplicationFixture.applicationError);

        await importCLIExecutable();

        expect(stderrWrite).toHaveBeenCalledWith(`${cliApplicationFixture.applicationError.message}\n`);
        expect(process.exitCode).toEqual(1);
    });

    it('module [success] #3: Should preserve a Commander exit code without duplicating its output', async () => {
        const stderrWrite = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
        const helpExit = new CommanderError(0, 'commander.helpDisplayed', '');
        mockRun.mockRejectedValue(helpExit);

        await importCLIExecutable();

        expect(stderrWrite).not.toHaveBeenCalled();
        expect(process.exitCode).toEqual(helpExit.exitCode);
    });

    it('module [success] #4: Should report a non-Error application failure on stderr and set a failure exit code', async () => {
        const stderrWrite = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
        mockRun.mockRejectedValue(cliApplicationFixture.applicationErrorMessage);

        await importCLIExecutable();

        expect(stderrWrite).toHaveBeenCalledWith(`${cliApplicationFixture.applicationErrorMessage}\n`);
        expect(process.exitCode).toEqual(1);
    });

    async function importCLIExecutable(): Promise<void> {
        await import('@src/cli.js');
    }
});
