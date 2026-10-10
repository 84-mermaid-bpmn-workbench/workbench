import { execFile as executeFile, spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { promisify } from 'node:util';
import { Command } from 'commander';

const execFile = promisify(executeFile);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const cliDirectory = resolve(scriptDirectory, '../..');
const workbenchRoot = resolve(cliDirectory, '..');
const packagePath = resolve(cliDirectory, 'package.json');
const packageLockPath = resolve(cliDirectory, 'package-lock.json');
const verificationPath = resolve(cliDirectory, '.delivery/.temp/release-verification.json');
const releaseTagPrefix = 'cli/v';

const program = new Command()
    .name('release')
    .description('Prepare a Mermaid-BPMN CLI npm release.')
    .showSuggestionAfterError()
    .showHelpAfterError();

program
    .command('prepare')
    .description('Create, verify, commit, and push a CLI release branch.')
    .action(async () => await prepareRelease());

try {
    await program.parseAsync();
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\u001B[31m[ERROR] ${message}\u001B[0m`);
    process.exitCode = 1;
}

async function prepareRelease(): Promise<void> {
    await rm(verificationPath, { force: true });
    const latestReleaseTag = await getLatestReleaseTag();
    await ensureCLIChangesSinceLatestRelease(latestReleaseTag);
    const version = await determineVersion(latestReleaseTag);
    const releaseBranch = `release/cli/${version}`;

    await checkoutReleaseBranch(releaseBranch);
    await updatePackageVersions(version);
    const preparationID = `${Date.now()}-${process.hrtime.bigint()}`;
    await writeVerification({
        prepare: { version, preparationID, preparedAt: new Date().toISOString() },
        release: null,
    });

    try {
        await runNpm(['run', 'release:check']);
        await writeVerification({
            prepare: { version, preparationID, preparedAt: new Date().toISOString() },
            release: { preparationID, completedAt: new Date().toISOString(), success: true },
        });
    } catch (error) {
        await writeVerification({
            prepare: { version, preparationID, preparedAt: new Date().toISOString() },
            release: {
                preparationID,
                completedAt: new Date().toISOString(),
                success: false,
                error: error instanceof Error ? error.message : String(error),
            },
        });
        throw error;
    }

    const accepted = await confirmRelease();
    if (!accepted) {
        console.log('Release publishing cancelled.');
        return;
    }

    await runCommand('git', ['add', '--', 'cli/package.json', 'cli/package-lock.json'], workbenchRoot);
    await runCommand('git', ['commit', '--message', `release(cli): ${version}`], workbenchRoot);
    await runCommand('git', ['push', '--set-upstream', 'origin', releaseBranch], workbenchRoot);
    console.log(`Release branch ${releaseBranch} was pushed. GitHub Actions will verify it and open a pull request to master.`);
}

async function getLatestReleaseTag(): Promise<string | null> {
    const actual = await execFile('git', ['tag', '--merged', 'master', '--list', `${releaseTagPrefix}*`, '--sort=-version:refname'], { cwd: workbenchRoot });
    return actual.stdout.split('\n').filter(Boolean)[0] ?? null;
}

async function determineVersion(latestReleaseTag: string | null): Promise<string> {
    const baselineVersion = latestReleaseTag?.slice(releaseTagPrefix.length) ?? '0.0.0';
    const commitsArguments = latestReleaseTag === null
        ? ['log', '--format=%h %s', '-10', 'master']
        : ['log', '--format=%h %s', '-10', `${latestReleaseTag}..master`];
    const commits = await execFile('git', commitsArguments, { cwd: workbenchRoot });
    const baseline = latestReleaseTag ?? `the initial ${baselineVersion} baseline`;
    console.log(`Commits since ${baseline}:`);
    console.log(commits.stdout.trim() || '(none)');
    const increment = await askForIncrement();
    return incrementVersion(baselineVersion, increment);
}

async function askForIncrement(): Promise<'major' | 'minor' | 'patch'> {
    const interaction = createInterface({ input: stdin, output: stdout });
    try {
        const answer = (await interaction.question('Select SemVer increment: [1] Patch, [5] Minor, [9] Major: ')).trim();
        const incrementBySelection = {
            '1': 'patch',
            '5': 'minor',
            '9': 'major',
        } as const;
        const increment = incrementBySelection[answer as keyof typeof incrementBySelection];

        if (increment !== undefined) {
            return increment;
        }

        throw new Error('Release increment must be 1 for patch, 5 for minor, or 9 for major.');
    } finally {
        interaction.close();
    }
}

function incrementVersion(version: string, increment: 'major' | 'minor' | 'patch'): string {
    const parts = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(version);
    if (parts === null) {
        throw new Error(`Release tag ${releaseTagPrefix}${version} has an invalid SemVer version.`);
    }

    const [major, minor, patch] = parts.slice(1).map(Number);
    if (increment === 'major') {
        return `${major + 1}.0.0`;
    }
    if (increment === 'minor') {
        return `${major}.${minor + 1}.0`;
    }

    return `${major}.${minor}.${patch + 1}`;
}

async function checkoutReleaseBranch(releaseBranch: string): Promise<void> {
    const branchExists = await localBranchExists(releaseBranch);
    const argumentsList = branchExists ? ['switch', releaseBranch] : ['switch', '--create', releaseBranch, 'master'];
    await runCommand('git', argumentsList, workbenchRoot);
}

async function localBranchExists(branch: string): Promise<boolean> {
    try {
        await execFile('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], { cwd: workbenchRoot });
        return true;
    } catch {
        return false;
    }
}

async function updatePackageVersions(version: string): Promise<void> {
    const packageJSON = JSON.parse(await readFile(packagePath, 'utf8')) as { version: string };
    const packageLockJSON = JSON.parse(await readFile(packageLockPath, 'utf8')) as { version: string; packages: Record<string, { version?: string }> };
    packageJSON.version = version;
    packageLockJSON.version = version;
    packageLockJSON.packages[''].version = version;
    await writeFile(packagePath, `${JSON.stringify(packageJSON, null, 4)}\n`);
    await writeFile(packageLockPath, `${JSON.stringify(packageLockJSON, null, 4)}\n`);
}

async function ensureCLIChangesSinceLatestRelease(latestReleaseTag: string | null): Promise<void> {
    const argumentsList = latestReleaseTag === null
        ? ['log', '--format=%H', '-1', 'master', '--', 'cli']
        : ['diff', '--name-only', `${latestReleaseTag}..master`, '--', 'cli'];
    const actual = await execFile('git', argumentsList, { cwd: workbenchRoot });

    if (actual.stdout.trim().length === 0) {
        const baseline = latestReleaseTag ?? 'the repository history';
        throw new Error(`Release publishing requires a committed change under workbench/cli since ${baseline}.`);
    }
}

async function confirmRelease(): Promise<boolean> {
    const interaction = createInterface({ input: stdin, output: stdout });
    try {
        const answer = await interaction.question('Release is ready to commit and push. Type A to accept or C to cancel: ');
        return answer.trim().toUpperCase() === 'A';
    } finally {
        interaction.close();
    }
}

async function runNpm(argumentsList: string[]): Promise<void> {
    const npmExecutable = process.env.npm_execpath;
    if (npmExecutable === undefined) {
        throw new Error('npm_execpath is required to run npm release preparation.');
    }

    await runCommand(process.execPath, [npmExecutable, ...argumentsList], cliDirectory);
}

async function runCommand(command: string, argumentsList: string[], cwd: string): Promise<void> {
    await new Promise<void>((resolvePromise, reject) => {
        const childProcess = spawn(command, argumentsList, { cwd, stdio: 'inherit' });
        childProcess.once('error', reject);
        childProcess.once('exit', (exitCode) => {
            if (exitCode === 0) {
                resolvePromise();
                return;
            }

            reject(new Error(`${command} exited with status ${exitCode ?? 'unknown'}.`));
        });
    });
}

async function writeVerification(verification: TReleaseVerification): Promise<void> {
    await mkdir(dirname(verificationPath), { recursive: true });
    await writeFile(verificationPath, `${JSON.stringify(verification, null, 4)}\n`);
}

type TReleaseVerification = {
    prepare: { version: string; preparationID: string; preparedAt: string };
    release: { preparationID: string; completedAt: string; success: boolean; error?: string } | null;
};
