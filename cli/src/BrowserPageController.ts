import puppeteer, { type Browser } from 'puppeteer-core';
import type { BrowserExecutablePathVO } from './BrowserExecutablePath.valueobject.js';

export type TBrowserPageControllerOptions = {
    browserExecutablePath: BrowserExecutablePathVO;
    rendererPageURL?: URL;
};

const noSandboxEnvironmentVariable = 'MERMAID_BPMN_CLI_BROWSER_NO_SANDBOX';

/**
 * Mermaid-BPMN rendering must run in a browser page because it depends on browser DOM and SVG measurement behavior.
 *
 * This class exists to keep the Node-side Puppeteer lifecycle separate from the browser-page Mermaid renderer.
 * Its responsibility is to open the local renderer page, request SVG for Mermaid-BPMN source, and close the browser.
 *
 * @description Controls a local browser page that renders Mermaid-BPMN source to SVG.
 */
export class BrowserPageController {
    private readonly browserExecutablePath: BrowserExecutablePathVO;

    private readonly rendererPageURL: URL;

    public constructor(self: TBrowserPageControllerOptions) {
        this.browserExecutablePath = self.browserExecutablePath;
        this.rendererPageURL = self.rendererPageURL ?? new URL('./assets/renderer.html', import.meta.url);
    }

    public static create(self: TBrowserPageControllerOptions): BrowserPageController {
        return new BrowserPageController(self);
    }

    public async renderSVG(source: string): Promise<string> {
        const executablePath = this.browserExecutablePath.path;
        const launchOptions = process.env[noSandboxEnvironmentVariable] === 'true'
            ? { executablePath, headless: true, args: ['--no-sandbox'] }
            : { executablePath, headless: true };

        let browser: Browser;
        try {
            browser = await puppeteer.launch(launchOptions);
        } catch (error) {
            throw new Error(`Failed to launch the browser at ${executablePath}: ${(error as Error).message}`, { cause: error });
        }

        try {
            const page = await browser.newPage();
            const pageErrors: string[] = [];
            page.on('pageerror', (error) => pageErrors.push(String(error)));

            await page.goto(this.rendererPageURL.href, { waitUntil: 'load' });

            const isRendererReady = await page.evaluate(() => typeof window.browserPageRenderer !== 'undefined');
            if (!isRendererReady) {
                throw new Error(`The renderer page did not initialize. ${pageErrors.join('; ')}`.trim());
            }

            return await page.evaluate(async (diagramSource: string): Promise<string> => {
                return window.browserPageRenderer.renderFromSource(diagramSource);
            }, source);
        } catch (error) {
            const version = await browser.version().catch(() => 'unknown version');
            throw new Error(`${(error as Error).message} (browser: ${executablePath}, ${version})`, { cause: error });
        } finally {
            await browser.close();
        }
    }
}
