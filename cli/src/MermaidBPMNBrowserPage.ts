import mermaid from 'mermaid';
import bpmn from 'mermaid-bpmn';

declare global {
    interface Window {
        mermaidBPMNBrowserPage: MermaidBPMNBrowserPage;
    }
}

/**
 *
 * This class exists to keep browser-page registration and rendering separate from the Node-side 
 * browser lifecycle. Its responsibility is to prepare Mermaid-BPMN once and render each supplied
 * source string after that preparation completes.
 *
 * @description Registers Mermaid-BPMN in the browser page and renders Mermaid-BPMN source after 
 * the registration and Mermaid initialization complete.
 * @requires Mermaid-BPMN must be registered in the same browser page that calls Mermaid rendering.
 */
export class MermaidBPMNBrowserPage {
    private initialization: Promise<void> | null = null;

    public async renderSvg(source: string): Promise<string> {
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
        mermaid.initialize({ startOnLoad: false });
    }
}

window.mermaidBPMNBrowserPage = new MermaidBPMNBrowserPage();
