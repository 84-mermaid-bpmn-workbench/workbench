import puppeteer from 'puppeteer-core';
import type { BrowserExecutablePathVO } from './BrowserExecutablePath.valueobject.js';

export type TBrowserPageControllerOptions = {
    browserExecutablePath: BrowserExecutablePathVO;
    rendererPageURL?: URL;
};

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
        const browser = await puppeteer.launch({
            executablePath: this.browserExecutablePath.path,
            headless: true,
        });

        try {
            const page = await browser.newPage();
            await page.goto(this.rendererPageURL.href, { waitUntil: 'load' });

            return page.evaluate(async (diagramSource: string): Promise<string> => {
                return window.browserPageRenderer.renderFromSource(diagramSource);
            }, source);
        } finally {
            await browser.close();
        }
    }
}
