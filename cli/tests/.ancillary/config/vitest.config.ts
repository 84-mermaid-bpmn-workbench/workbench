import { cwd } from 'node:process';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const root = cwd();
const browserPathEnvironmentVariable = 'MERMAID_BPMN_CLI_BROWSER_PATH';
const localChromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export default defineConfig(({ mode }) => {
    const isE2ETestRun = mode === 'e2e';

    if (isE2ETestRun) {
        process.env[browserPathEnvironmentVariable] ??= localChromePath;
    }

    return {
        resolve: {
            alias: {
                '@src': resolve(root, 'src'),
                '@tests': resolve(root, 'tests'),
                '@fixtures': resolve(root, 'tests/.ancillary/fixtures')
            }
        },
        test: {
            root,
            environment: 'node',
            include: [isE2ETestRun ? 'tests/e2e/**/*.test.ts' : 'tests/foundation/**/*.test.ts'],
            cache: false,
            fileParallelism: !isE2ETestRun,
            reporters: ['tree'],
            coverage: {
                provider: 'v8',
                include: ['src/**/*.ts'],
                exclude: ['src/**/*.types.ts','*.d.ts', 'src/database/migrations/**'],
                reportsDirectory: resolve(root, 'tests/.coverage')
            }
        }
    };
});
