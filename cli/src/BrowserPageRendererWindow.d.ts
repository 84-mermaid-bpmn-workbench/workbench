/**
 * The Node-side page controller and the browser-page renderer communicate through the local page's Window object.
 *
 * This declaration exists outside the browser implementation so both the Node delivery build and browser bundle share the same bridge contract.
 * Its responsibility is to describe the operation the controller may invoke in the loaded renderer page.
 *
 * @description Declares the browser-page SVG rendering operation exposed on Window.
 */
type TBrowserPageRendererWindowAPI = {
    renderFromSource(source: string): Promise<string>;
};

declare global {
    interface Window {
        browserPageRenderer: TBrowserPageRendererWindowAPI;
        mermaidBPMNIconPackAssets: Record<string, IconifyJSON | undefined>;
    }
}

export {};
import type { IconifyJSON } from '@iconify/types';
