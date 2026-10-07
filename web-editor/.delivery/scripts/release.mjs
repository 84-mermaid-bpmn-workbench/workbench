import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile as executeFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(executeFile);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const editorDirectory = resolve(scriptDirectory, '../..');
const workspaceRoot = resolve(editorDirectory, '../..');
const versionPath = resolve(editorDirectory, 'VERSION');
const releaseVerificationPath = resolve(editorDirectory, 'tests/.temp/release-verification.json');
const deployScriptPath = resolve(editorDirectory, 'deploy.sh');
const action = process.argv[2];
let version;
let releaseBranch;

try {
    version = (await readFile(versionPath, 'utf8')).trim();
    if (version.length === 0) {
        throw new Error(`Editor version file is empty: ${versionPath}`);
    }

    releaseBranch = `release/web-editor/${version}`;

    if (action === 'prepare') {
        await prepareRelease();
    } else if (action === 'publish') {
        await publishRelease();
    } else {
        throw new Error('Usage: node .delivery/scripts/release.mjs {prepare|publish}');
    }
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error(`\u001B[31m[ERROR] ${message}\u001B[0m`);
    process.exitCode = 1;
}

async function prepareRelease() {
    await rm(releaseVerificationPath, { force: true });
    await checkoutReleaseBranch(releaseBranch);
    await runCommand('bash', [deployScriptPath, 'build']);
    await writeReleaseVerification({
        prepare: {
            version,
            preparationID: `${Date.now()}-${process.hrtime.bigint()}`,
            buildCompletedAt: new Date().toISOString(),
        },
        release: null,
    });

    console.log(`Release branch is ready: ${releaseBranch}`);
    console.log('Run the required local Docker smoke E2E test from the workspace root:');
    console.log('npm --prefix workbench/web-editor run test:smoke');
}

async function publishRelease() {
    await ensureCurrentBranch();
    await ensureCleanWorkingTree();
    await ensureGreenReleaseVerification();
    await runCommand('git', ['push', '--set-upstream', 'origin', releaseBranch]);
}

async function checkoutReleaseBranch(branch) {
    const branchExists = await localBranchExists(branch);
    const argumentsList = branchExists ? ['switch', branch] : ['switch', '--create', branch];

    await runCommand('git', argumentsList);
}

async function localBranchExists(branch) {
    try {
        await execFile('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], { cwd: workspaceRoot });
        return true;
    } catch {
        return false;
    }
}

async function ensureCurrentBranch() {
    const actual = await execFile('git', ['branch', '--show-current'], { cwd: workspaceRoot });
    const currentBranch = actual.stdout.trim();

    if (currentBranch !== releaseBranch) {
        throw new Error(`Current branch must be ${releaseBranch}; found ${currentBranch || 'detached HEAD'}.`);
    }
}

async function ensureCleanWorkingTree() {
    const actual = await execFile('git', ['status', '--porcelain'], { cwd: workspaceRoot });

    if (actual.stdout.trim().length !== 0) {
        throw new Error('Commit or remove all working-tree changes before publishing the release branch.');
    }
}

async function ensureGreenReleaseVerification() {
    let actual;

    try {
        actual = JSON.parse(await readFile(releaseVerificationPath, 'utf8'));
    } catch {
        throw new Error(`Release verification file is missing or invalid: ${releaseVerificationPath}`);
    }

    const prepare = actual?.prepare;
    const release = actual?.release;
    const hasMatchingVersion = prepare?.version === version;
    const hasMatchingPreparation = release?.preparationID === prepare?.preparationID;
    const smokeTestRanAfterBuild = Date.parse(release?.completedAt) >= Date.parse(prepare?.buildCompletedAt);

    if (release?.success !== true || !hasMatchingVersion || !hasMatchingPreparation || !smokeTestRanAfterBuild) {
        throw new Error('Release verification is not a green smoke E2E result for the current prepared image.');
    }
}

async function runCommand(command, argumentsList) {
    await new Promise((resolvePromise, reject) => {
        const childProcess = spawn(command, argumentsList, { cwd: workspaceRoot, stdio: 'inherit' });

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

async function writeReleaseVerification(verification) {
    await mkdir(dirname(releaseVerificationPath), { recursive: true });
    await writeFile(releaseVerificationPath, `${JSON.stringify(verification, null, 4)}\n`);
}
