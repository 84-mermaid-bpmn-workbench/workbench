import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { browserPageRendererFixture } from '@fixtures/index.js';

const { mockBPMN, mockMermaid, mockRegisterIconPacks } = vi.hoisted(() => ({
    mockBPMN: { id: 'bpmn' },
    mockMermaid: {
        initialize: vi.fn(),
        registerExternalDiagrams: vi.fn(),
        render: vi.fn()
    },
    mockRegisterIconPacks: vi.fn()
}));

vi.mock('mermaid', () => ({
    default: mockMermaid
}));

vi.mock('mermaid-bpmn', () => ({
    default: mockBPMN,
    registerIconPacks: mockRegisterIconPacks
}));

describe('[unit] BrowserPageRenderer Test', () => {
    let BrowserPageRenderer: typeof import('@src/BrowserPageRenderer.js').BrowserPageRenderer;
    let localMermaidBPMNIconPacks: typeof import('@src/icon-packs.js').localMermaidBPMNIconPacks;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        vi.stubGlobal('window', {});
        vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValue(browserPageRendererFixture.renderUUID) });

        ({ localMermaidBPMNIconPacks } = await import('@src/icon-packs.js'));
        ({ BrowserPageRenderer } = await import('@src/BrowserPageRenderer.js'));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('constructor(): Should expose the browser page renderer on the window', () => {
        expect(window.browserPageRenderer).toBeInstanceOf(BrowserPageRenderer);
    });

    it('+renderFromSource(): Should initialize Mermaid-BPMN and return rendered SVG', async () => {
        mockMermaid.registerExternalDiagrams.mockResolvedValue(undefined);
        mockMermaid.render.mockResolvedValue({ svg: browserPageRendererFixture.firstSVG });
        const renderer = new BrowserPageRenderer();

        const actual = await renderer.renderFromSource(browserPageRendererFixture.firstSource);

        expect(actual).toEqual(browserPageRendererFixture.firstSVG);
        expect(mockMermaid.registerExternalDiagrams).toHaveBeenCalledWith([mockBPMN]);
        expect(mockRegisterIconPacks).toHaveBeenCalledWith(localMermaidBPMNIconPacks);
        expect(mockMermaid.initialize).toHaveBeenCalledWith({ startOnLoad: false });
        expect(mockMermaid.render).toHaveBeenCalledWith(
            `mermaid-bpmn-cli-${browserPageRendererFixture.renderUUID}`,
            browserPageRendererFixture.firstSource
        );
    });

    it('+renderFromSource(): Should initialize Mermaid-BPMN only once', async () => {
        mockMermaid.registerExternalDiagrams.mockResolvedValue(undefined);
        mockMermaid.render
            .mockResolvedValueOnce({ svg: browserPageRendererFixture.firstSVG })
            .mockResolvedValueOnce({ svg: browserPageRendererFixture.secondSVG });
        const renderer = new BrowserPageRenderer();

        await renderer.renderFromSource(browserPageRendererFixture.firstSource);
        await renderer.renderFromSource(browserPageRendererFixture.secondSource);

        expect(mockMermaid.registerExternalDiagrams).toHaveBeenCalledOnce();
        expect(mockRegisterIconPacks).toHaveBeenCalledOnce();
        expect(mockMermaid.initialize).toHaveBeenCalledOnce();
    });
});
