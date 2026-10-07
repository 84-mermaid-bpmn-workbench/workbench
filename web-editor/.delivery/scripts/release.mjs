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
const forkRoot = resolve(workspaceRoot, '_mermaid-bpmn-fork');
const releasePath = resolve(editorDirectory, 'release.json');
const releaseVerificationPath = resolve(editorDirectory, 'tests/.temp/release-verification.json');
const deployScriptPath = resolve(editorDirectory, 'deploy.sh');
const action = process.argv[2];
let releaseMetadata;
let version;
let releaseBranch;

try {
    releaseMetadata = JSON.parse(await readFile(releasePath, 'utf8'));
    version = releaseMetadata.version;
    const hasReleaseMetadata = typeof version === 'string' && version.length > 0
        && typeof releaseMetadata.mermaid_bpmn_fork_revision === 'string' && releaseMetadata.mermaid_bpmn_fork_revision.length > 0;
    if (!hasReleaseMetadata) {
        throw new Error(`Editor release file is invalid: ${releasePath}`);
    }
    parseVersion(version);

    releaseBranch = `release/web-editor/${version}`;

    if (action === 'prepare') {
        await prepareRelease();
    } else if (action === 'ci-prepare') {
        await prepareCIVerification();
    } else if (action === 'publish') {
        await publishRelease();
    } else {
        throw new Error('Usage: node .delivery/scripts/release.mjs {prepare|ci-prepare|publish}');
    }
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    console.error(`\u001B[31m[ERROR] ${message}\u001B[0m`);
    process.exitCode = 1;
}

async function prepareRelease() {
    await rm(releaseVerificationPath, { force: true });
    await ensureReleaseEligibility();
    await checkoutReleaseBranch(releaseBranch);
    await ensureLocalForkRevision();
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

async function prepareCIVerification() {
    await rm(releaseVerificationPath, { force: true });
    await writeReleaseVerification({
        prepare: {
            version,
            preparationID: `${Date.now()}-${process.hrtime.bigint()}`,
            buildCompletedAt: new Date().toISOString(),
        },
        release: null,
    });
}

async function ensureReleaseEligibility() {
    const latestReleaseTag = await getLatestReleaseTag();

    if (latestReleaseTag === null) {
        if (version !== '1.0.0') {
            throw new Error('The initial web-editor release must use version 1.0.0.');
        }

        return;
    }

    const latestVersion = latestReleaseTag.slice('web-editor/v'.length);
    if (!isVersionGreater(version, latestVersion)) {
        throw new Error(`Release version ${version} must be greater than ${latestVersion}.`);
    }

    const hasChangedImageInputs = await hasChangedImageInputsSince(latestReleaseTag);
    if (!hasChangedImageInputs) {
        throw new Error(`Release version ${version} has no changed image build inputs since ${latestReleaseTag}.`);
    }
}

async function getLatestReleaseTag() {
    const actual = await execFile('git', ['tag', '--merged', 'master', '--list', 'web-editor/v*', '--sort=-version:refname'], { cwd: workbenchRoot });
    const tags = actual.stdout.split('\n').filter(Boolean);

    return tags[0] ?? null;
}

async function hasChangedImageInputsSince(tag) {
    const staticInputs = ['web-editor/Dockerfile', 'web-editor/nginx.conf', 'web-editor/prepare-site.mjs'];
    const actual = await execFile('git', ['diff', '--name-only', tag, '--', ...staticInputs], { cwd: workbenchRoot });
    if (actual.stdout.trim().length > 0) {
        return true;
    }

    let previousReleaseMetadata;
    try {
        const previous = await execFile('git', ['show', `${tag}:web-editor/release.json`], { cwd: workbenchRoot });
        previousReleaseMetadata = JSON.parse(previous.stdout);
    } catch {
        throw new Error(`Release tag ${tag} has no valid web-editor/release.json file.`);
    }

    return previousReleaseMetadata.mermaid_bpmn_fork_revision !== releaseMetadata.mermaid_bpmn_fork_revision;
}

async function ensureLocalForkRevision() {
    const actual = await execFile('git', ['rev-parse', 'HEAD'], { cwd: forkRoot });
    const localForkRevision = actual.stdout.trim();

    if (localForkRevision !== releaseMetadata.mermaid_bpmn_fork_revision) {
        throw new Error(`Local Mermaid-BPMN fork revision must be ${releaseMetadata.mermaid_bpmn_fork_revision}; found ${localForkRevision}.`);
    }
}

function isVersionGreater(candidate, baseline) {
    const candidateParts = parseVersion(candidate);
    const baselineParts = parseVersion(baseline);

    for (const [index, candidatePart] of candidateParts.entries()) {
        const baselinePart = baselineParts[index];
        if (candidatePart > baselinePart) {
            return true;
        }

        if (candidatePart < baselinePart) {
            return false;
        }
    }

    return false;
}

function parseVersion(value) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);

    if (match === null) {
        throw new Error(`Release version must use major.minor.patch format; found ${value}.`);
    }

    return match.slice(1).map(Number);
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
