import { BrowserExecutablePathVO } from './BrowserExecutablePath.valueobject.js';
import { BrowserPageController } from './BrowserPageController.js';
import type { TBrowserPageControllerOptions } from './BrowserPageController.js';

export type TRenderSvgOptions = {
    browserPath: string;
    rendererPageURL?: URL;
};

export { BrowserExecutablePathVO };
export { BrowserPageController };
export type { TBrowserPageControllerOptions };

export async function renderSvg(source: string, options: TRenderSvgOptions): Promise<string> {
    const browserExecutablePath = await BrowserExecutablePathVO.create({ path: options.browserPath });
    const controllerOptions: TBrowserPageControllerOptions = {
        browserExecutablePath,
        rendererPageURL: options.rendererPageURL
    };
    return BrowserPageController.create(controllerOptions).renderSVG(source);
}
