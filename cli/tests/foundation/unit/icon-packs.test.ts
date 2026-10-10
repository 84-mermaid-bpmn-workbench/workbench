import type { IconifyJSON } from '@iconify/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { iconPacksFixture } from '@tests/.ancillary/fixtures/index.js';

type TScriptEventName = 'load' | 'error';
type TScriptEventListener = () => void;
type TScriptElement = {
    async: boolean;
    src: string;
    addEventListener(eventName: TScriptEventName, listener: TScriptEventListener): void;
};

describe('[unit] icon-packs Test', () => {
    let localMermaidBPMNIconPackDefinitions: typeof import('@src/icon-packs.js').localMermaidBPMNIconPackDefinitions;
    let localMermaidBPMNIconPacks: typeof import('@src/icon-packs.js').localMermaidBPMNIconPacks;
    let script: TScriptElement;
    let scriptEventListeners: Map<TScriptEventName, TScriptEventListener>;
    let mockCreateElement: ReturnType<typeof vi.fn>;
    let mockAppend: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.resetModules();
        scriptEventListeners = new Map<TScriptEventName, TScriptEventListener>();
        script = {
            async: false,
            src: '',
            addEventListener: vi.fn((eventName: TScriptEventName, listener: TScriptEventListener) => {
                scriptEventListeners.set(eventName, listener);
            })
        };
        mockCreateElement = vi.fn(() => script);
        mockAppend = vi.fn();
        vi.stubGlobal('window', { location: iconPacksFixture.rendererPageURL });
        vi.stubGlobal('document', { createElement: mockCreateElement, head: { append: mockAppend } });

        ({ localMermaidBPMNIconPackDefinitions, localMermaidBPMNIconPacks } = await import('@src/icon-packs.js'));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('module: Should define every locally bundled Mermaid-BPMN Iconify pack', () => {
        const actual = localMermaidBPMNIconPackDefinitions.map(({ name }) => name);

        expect(actual).toEqual(iconPacksFixture.iconPackNames);
    });

    it('+loader() [success] #1: Should return an icon pack that the renderer page already registered', async () => {
        window.mermaidBPMNIconPackAssets = { lucide: iconPacksFixture.lucideIconPack };

        const actual = await getIconPackLoader('lucide')();

        expect(actual).toEqual(iconPacksFixture.lucideIconPack);
        expect(mockCreateElement).not.toHaveBeenCalled();
        expect(mockAppend).not.toHaveBeenCalled();
    });

    it('+loader() [success] #2: Should load a locally bundled icon pack into the renderer page', async () => {
        const iconPackLoad = getIconPackLoader('lucide')();
        window.mermaidBPMNIconPackAssets = { lucide: iconPacksFixture.lucideIconPack };
        triggerScriptEvent('load');

        const actual = await iconPackLoad;

        expect(actual).toEqual(iconPacksFixture.lucideIconPack);
        expect(script.async).toBe(true);
        expect(script.src).toEqual(iconPacksFixture.lucideIconPackURL);
        expect(mockAppend).toHaveBeenCalledWith(script);
    });

    it('+loader() [success] #3: Should share one pending local icon-pack load', async () => {
        const loader = getIconPackLoader('lucide');
        const firstIconPackLoad = loader();
        const secondIconPackLoad = loader();
        window.mermaidBPMNIconPackAssets = { lucide: iconPacksFixture.lucideIconPack };
        triggerScriptEvent('load');

        const actual = await Promise.all([firstIconPackLoad, secondIconPackLoad]);

        expect(actual).toEqual([iconPacksFixture.lucideIconPack, iconPacksFixture.lucideIconPack]);
        expect(firstIconPackLoad).toBe(secondIconPackLoad);
        expect(mockAppend).toHaveBeenCalledOnce();
    });

    it('+loader() [failure] #1: Should reject when the local script does not register its icon pack', async () => {
        const iconPackLoad = getIconPackLoader('lucide')();
        triggerScriptEvent('load');

        await expect(iconPackLoad).rejects.toThrow(iconPacksFixture.missingRegistrationErrorMessage);
    });

    it('+loader() [failure] #2: Should reject when the local icon-pack script cannot load', async () => {
        const iconPackLoad = getIconPackLoader('lucide')();
        triggerScriptEvent('error');

        await expect(iconPackLoad).rejects.toThrow(iconPacksFixture.loadingErrorMessage);
    });

    function getIconPackLoader(name: string): () => Promise<IconifyJSON> {
        const loader = localMermaidBPMNIconPacks.find((iconPack) => iconPack.name === name)?.loader;

        if (loader === undefined) {
            throw new Error(`The fixture icon pack is unavailable: ${name}`);
        }

        return loader;
    }

    function triggerScriptEvent(eventName: TScriptEventName): void {
        const listener = scriptEventListeners.get(eventName);

        if (listener === undefined) {
            throw new Error(`The script event listener is unavailable: ${eventName}`);
        }

        listener();
    }
});
