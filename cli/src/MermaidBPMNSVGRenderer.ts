import puppeteer from 'puppeteer-core';

export type TMermaidBPMNSVGRendererOptions = {
    browserPath: string;
    rendererPageURL?: URL;
};

/**
 * The CLI must render in a browser because Mermaid-BPMN depends on browser DOM and SVG measurement
 * behavior.
 *
 * This class exists to isolate the Node-side browser lifecycle from command-line parsing and
 * file input or output. Its responsibility is to render one Mermaid-BPMN source string through
 * the local renderer page and return SVG markup.
 *
 * @description Renders one Mermaid-BPMN source string to SVG through a configured local browser. It owns the browser lifecycle and local renderer-page invocation. It does not parse CLI arguments or read or write input or output files.
 */
export class MermaidBPMNSVGRenderer {
    private readonly browserPath: string;

    private readonly rendererPageURL: URL;

    public constructor(self: TMermaidBPMNSVGRendererOptions) {
        this.browserPath = self.browserPath;
        this.rendererPageURL = self.rendererPageURL ?? new URL('./assets/renderer.html', import.meta.url);
    }

    public async renderSvg(source: string): Promise<string> {
        const browser = await puppeteer.launch({
            executablePath: this.browserPath,
            headless: true,
        });

        try {
            const page = await browser.newPage();
            await page.goto(this.rendererPageURL.href, { waitUntil: 'load' });

            return page.evaluate(async (diagramSource: string): Promise<string> => {
                return window.mermaidBPMNBrowserPage.renderSvg(diagramSource);
            }, source);
        } finally {
            await browser.close();
        }
    }
}
