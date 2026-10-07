import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile as executeFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const execFile = promisify(executeFile);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const editorDirectory = resolve(scriptDirectory, '../..');
const workbenchRoot = resolve(editorDirectory, '..');
const workspaceRoot = resolve(workbenchRoot, '..');
const releasePath = resolve(editorDirectory, 'release.json');
const releaseVerificationPath = resolve(editorDirectory, 'tests/.temp/release-verification.json');
const deployScriptPath = resolve(editorDirectory, 'deploy.sh');
const action = process.argv[2];
let version;
let releaseBranch;

try {
    const release = JSON.parse(await readFile(releasePath, 'utf8'));
    version = release.version;
    const hasReleaseMetadata = typeof version === 'string' && version.length > 0
        && typeof release.mermaid_bpmn_fork_revision === 'string' && release.mermaid_bpmn_fork_revision.length > 0;
    if (!hasReleaseMetadata) {
        throw new Error(`Editor release file is invalid: ${releasePath}`);
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
    await runCommand('bash', [deployScriptPath, 'build'], workspaceRoot);
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
    await ensureGreenReleaseVerification();
    await ensureWebEditorChanges();

    const accepted = await confirmRelease();
    if (!accepted) {
        console.log('Release publishing cancelled.');
        return;
    }

    await runCommand('git', ['add', '--all'], workbenchRoot);
    await runCommand('git', ['commit', '--message', `release(web-editor): ${version}`], workbenchRoot);
    await runCommand('git', ['push', '--set-upstream', 'origin', releaseBranch], workbenchRoot);
}

async function checkoutReleaseBranch(branch) {
    const branchExists = await localBranchExists(branch);
    const argumentsList = branchExists ? ['switch', branch] : ['switch', '--create', branch];

    await runCommand('git', argumentsList, workbenchRoot);
}

async function localBranchExists(branch) {
    try {
        await execFile('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], { cwd: workbenchRoot });
        return true;
    } catch {
        return false;
    }
}

async function ensureCurrentBranch() {
    const actual = await execFile('git', ['branch', '--show-current'], { cwd: workbenchRoot });
    const currentBranch = actual.stdout.trim();

    if (currentBranch !== releaseBranch) {
        throw new Error(`Current branch must be ${releaseBranch}; found ${currentBranch || 'detached HEAD'}.`);
    }
}

async function ensureWebEditorChanges() {
    const changedPaths = await getChangedPaths();
    const hasWebEditorChanges = changedPaths.some((path) => path.startsWith('web-editor/'));

    if (!hasWebEditorChanges) {
        throw new Error('Release publishing requires at least one change under workbench/web-editor.');
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

async function getChangedPaths() {
    const commands = [
        ['diff', '--name-only'],
        ['diff', '--cached', '--name-only'],
        ['ls-files', '--others', '--exclude-standard'],
    ];
    const outputs = await Promise.all(commands.map(async (argumentsList) => {
        return await execFile('git', argumentsList, { cwd: workbenchRoot });
    }));
    const paths = outputs.flatMap((output) => output.stdout.split('\n').filter(Boolean));

    return [...new Set(paths)];
}

async function confirmRelease() {
    const interaction = createInterface({ input: stdin, output: stdout });

    try {
        const answer = await interaction.question('Release is ready to commit and push. Type A to accept or C to cancel: ');

        return answer.trim().toUpperCase() === 'A';
    } finally {
        interaction.close();
    }
}

async function runCommand(command, argumentsList, cwd) {
    await new Promise((resolvePromise, reject) => {
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

async function writeReleaseVerification(verification) {
    await mkdir(dirname(releaseVerificationPath), { recursive: true });
    await writeFile(releaseVerificationPath, `${JSON.stringify(verification, null, 4)}\n`);
}
