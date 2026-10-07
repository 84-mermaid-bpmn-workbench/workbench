import { createServer } from 'node:net';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile as executeFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFile = promisify(executeFile);
const testDirectory = dirname(fileURLToPath(import.meta.url));
const editorDirectory = resolve(testDirectory, '..');
const releaseVerificationPath = resolve(testDirectory, '.temp/release-verification.json');
const environmentPath = resolve(editorDirectory, '.env');
let containerID = null;
let verification = null;

try {
    verification = await readReleaseVerification();
    const imageRepository = await readEnvironmentVariable('WEB_EDITOR_IMAGE');
    const image = `${imageRepository}:${verification.prepare.version}`;
    const port = await reservePort();

    containerID = await startContainer(image, port);
    await waitForEditor(port);
    await writeReleaseResult({ preparationID: verification.prepare.preparationID, success: true, completedAt: new Date().toISOString(), error: null });
    console.log(`Docker smoke E2E passed for ${image}.`);
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (verification !== null) {
        await writeReleaseResult({
            preparationID: verification.prepare.preparationID,
            success: false,
            completedAt: new Date().toISOString(),
            error: errorMessage,
        });
    }

    console.error(`Docker smoke E2E failed: ${errorMessage}`);
    process.exitCode = 1;
} finally {
    await removeContainer();
}

async function readReleaseVerification() {
    let content;

    try {
        content = await readFile(releaseVerificationPath, 'utf8');
    } catch {
        throw new Error(`Run npm run release:prepare before the Docker smoke E2E test: ${releaseVerificationPath}`);
    }

    let actual;
    try {
        actual = JSON.parse(content);
    } catch {
        throw new Error(`Release verification file is not valid JSON: ${releaseVerificationPath}`);
    }

    const prepare = actual?.prepare;
    if (typeof prepare?.version !== 'string' || typeof prepare?.preparationID !== 'string') {
        throw new Error(`Release verification file has no valid prepare section: ${releaseVerificationPath}`);
    }

    return actual;
}

async function readEnvironmentVariable(name) {
    const environment = await readFile(environmentPath, 'utf8');
    const line = environment.split(/\r?\n/).find((candidate) => candidate.startsWith(`${name}=`));
    const value = line?.slice(name.length + 1).trim();

    if (value === undefined || value.length === 0) {
        throw new Error(`${name} is required in ${environmentPath}`);
    }

    return value;
}

async function reservePort() {
    const server = createServer();

    await new Promise((resolvePromise, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolvePromise);
    });

    const address = server.address();
    await new Promise((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise()));

    if (address === null || typeof address === 'string') {
        throw new Error('Cannot reserve a local TCP port for the Docker smoke E2E test.');
    }

    return address.port;
}

async function startContainer(image, port) {
    const actual = await execFile('docker', ['run', '--detach', '--rm', '--publish', `127.0.0.1:${port}:8080`, image]);

    return actual.stdout.trim();
}

async function waitForEditor(port) {
    const url = `http://127.0.0.1:${port}/`;
    const timeoutAt = Date.now() + 30_000;
    let lastError = null;

    while (Date.now() < timeoutAt) {
        try {
            const response = await fetch(url);
            const body = await response.text();
            const contentType = response.headers.get('content-type');
            const isEditorPage = response.status === 200 && contentType?.includes('text/html') && body.includes('<html');

            if (isEditorPage) {
                return;
            }

            lastError = new Error(`The editor returned HTTP ${response.status} instead of an HTML page.`);
        } catch (error) {
            lastError = error;
        }

        await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
    }

    const message = lastError instanceof Error ? lastError.message : 'The editor did not become available.';
    throw new Error(`Timed out waiting for ${url}: ${message}`);
}

async function writeReleaseResult(release) {
    const actual = { prepare: verification.prepare, release };

    await writeFile(releaseVerificationPath, `${JSON.stringify(actual, null, 4)}\n`);
}

async function removeContainer() {
    if (containerID === null) {
        return;
    }

    try {
        await execFile('docker', ['rm', '--force', containerID]);
    } catch {
        // The detached container may already have exited and been removed by Docker.
    }
}
