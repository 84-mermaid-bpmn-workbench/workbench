import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { browserExecutablePathFixture } from '@tests/.ancillary/fixtures/index.js';
import { BrowserExecutablePathVO } from '@src/BrowserExecutablePath.valueobject.js';

describe('[unit] BrowserExecutablePathVO Test', () => {
    it('+create(): Should create the expected value object for the current Node.js executable', async () => {
        const actual = await BrowserExecutablePathVO.create({ path: process.execPath });

        expect(actual.path).toEqual(resolve(process.execPath));
    });

    it('+create() [failure]: Should reject an empty executable path', async () => {
        await expect(BrowserExecutablePathVO.create({ path: browserExecutablePathFixture.missingPath }))
            .rejects.toThrow(browserExecutablePathFixture.missingPathError);
    });

    it('+create() [failure]: Should reject an unavailable executable path', async () => {
        await expect(BrowserExecutablePathVO.create({ path: browserExecutablePathFixture.unavailablePath }))
            .rejects.toThrow(browserExecutablePathFixture.unavailablePathError);
    });
});
