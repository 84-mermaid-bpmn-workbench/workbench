import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

export type TBrowserExecutablePathOptions = {
    path: string;
};

/**
 * Puppeteer requires a valid local Chrome or Chromium executable before it can open the renderer page.
 *
 * This class exists to validate the selected executable path before BrowserPageController launches Puppeteer.
 * Its responsibility is to expose one absolute, validated browser executable path.
 *
 * @description Represents a validated local Chrome or Chromium executable path.
 */
export class BrowserExecutablePathVO {
    private readonly value: string;

    private constructor(self: TBrowserExecutablePathOptions) {
        if (self.path.trim().length === 0) {
            throw new Error('A Chrome or Chromium executable path is required.');
        }

        this.value = resolve(self.path);
    }

    public get path(): string {
        return this.value;
    }

    public static async create(self: TBrowserExecutablePathOptions): Promise<BrowserExecutablePathVO> {
        const browserExecutablePath = new BrowserExecutablePathVO(self);
        await browserExecutablePath.validate();
        return browserExecutablePath;
    }

    private async validate(): Promise<void> {
        try {
            await access(this.value, constants.F_OK | constants.X_OK);
        } catch {
            throw new Error(`The Chrome or Chromium executable does not exist or is not executable: ${this.value}`);
        }
    }
}
