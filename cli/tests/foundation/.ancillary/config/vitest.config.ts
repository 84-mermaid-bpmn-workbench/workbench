import { cwd } from 'node:process';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const root = cwd();

export default defineConfig({
    resolve: {
        alias: {
            '@src': resolve(root, 'src'),
            '@fixtures': resolve(root, 'tests/foundation/.ancillary/fixtures')
        }
    },
    test: {
        root,
        environment: 'node',
        include: ['tests/foundation/**/*.test.ts'],
        cache: false,
        reporters: ['tree'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.types.ts', 'src/database/migrations/**'],
            reportsDirectory: resolve(root, 'tests/.coverage')
        }
    }
});
