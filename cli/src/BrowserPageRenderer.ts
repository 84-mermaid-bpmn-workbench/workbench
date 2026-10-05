import mermaid from 'mermaid';
import bpmn, { registerIconPacks } from 'mermaid-bpmn';
import { localMermaidBPMNIconPacks } from './icon-packs.js';

declare global {
    interface Window {
        browserPageRenderer: BrowserPageRenderer;
    }
}

/**
 * BrowserPageController sends Mermaid-BPMN source to this Chromium page because Mermaid-BPMN requires browser DOM and SVG measurement behavior.
 *
 * This class exists to keep the actual Mermaid rendering separate from the Node-side browser-page control lifecycle.
 * Its responsibility is to prepare Mermaid-BPMN once and render each supplied Mermaid-BPMN source string.
 *
 * @description Registers Mermaid-BPMN and local icon packs, then renders Mermaid-BPMN source to SVG in the browser page.
 */
export class BrowserPageRenderer {
    private initialization: Promise<void> | null = null;

    public async renderFromSource(source: string): Promise<string> {
        await this.getInitialization();

        const renderId = `mermaid-bpmn-cli-${crypto.randomUUID()}`;
        const renderResult = await mermaid.render(renderId, source);

        return renderResult.svg;
    }

    private getInitialization(): Promise<void> {
        this.initialization ??= this.initialize();
        return this.initialization;
    }

    private async initialize(): Promise<void> {
        await mermaid.registerExternalDiagrams([bpmn]);
        registerIconPacks(localMermaidBPMNIconPacks);
        mermaid.initialize({ startOnLoad: false });
    }
}

window.browserPageRenderer = new BrowserPageRenderer();
