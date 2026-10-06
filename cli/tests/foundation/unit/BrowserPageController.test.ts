import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserPageControllerFixture } from '@tests/.ancillary/fixtures/index.js';
import { BrowserExecutablePathVO } from '@src/BrowserExecutablePath.valueobject.js';
import { BrowserPageController } from '@src/BrowserPageController.js';

const { mockLaunch } = vi.hoisted(() => ({
    mockLaunch: vi.fn()
}));

vi.mock('puppeteer-core', () => ({
    default: {
        launch: mockLaunch
    }
}));

describe('[unit] BrowserPageController Test', () => {
    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it('constructor(): Should create the expected browser page controller', async () => {
        const browserExecutablePath = await BrowserExecutablePathVO.create({ path: process.execPath });

        const actual = BrowserPageController.create({ browserExecutablePath });

        expect(actual).toBeInstanceOf(BrowserPageController);
    });

    it('+renderSVG() [success]: Should return SVG rendered by the browser page', async () => {
        const browserExecutablePath = await BrowserExecutablePathVO.create({ path: process.execPath });
        const renderFromSource = vi.fn().mockResolvedValue(browserPageControllerFixture.svg);
        vi.stubGlobal('window', { browserPageRenderer: { renderFromSource } });
        const evaluate = vi.fn().mockImplementation(async (
            render: (diagramSource: string) => Promise<string>,
            diagramSource: string
        ): Promise<string> => await render(diagramSource));
        const goto = vi.fn().mockResolvedValue(undefined);
        const close = vi.fn().mockResolvedValue(undefined);
        const newPage = vi.fn().mockResolvedValue({ evaluate, goto });
        mockLaunch.mockResolvedValue({ close, newPage });
        const controller = BrowserPageController.create({
            browserExecutablePath,
            rendererPageURL: browserPageControllerFixture.rendererPageURL
        });

        const actual = await controller.renderSVG(browserPageControllerFixture.source);

        expect(actual).toEqual(browserPageControllerFixture.svg);
        expect(mockLaunch).toHaveBeenCalledWith({ executablePath: browserExecutablePath.path, headless: true });
        expect(goto).toHaveBeenCalledWith(browserPageControllerFixture.rendererPageURL.href, { waitUntil: 'load' });
        expect(evaluate).toHaveBeenCalledWith(expect.any(Function), browserPageControllerFixture.source);
        expect(renderFromSource).toHaveBeenCalledWith(browserPageControllerFixture.source);
        expect(close).toHaveBeenCalledOnce();
    });

    it('+renderSVG() [failure]: Should close the browser when page navigation fails', async () => {
        const browserExecutablePath = await BrowserExecutablePathVO.create({ path: process.execPath });
        const goto = vi.fn().mockRejectedValue(browserPageControllerFixture.navigationError);
        const close = vi.fn().mockResolvedValue(undefined);
        const newPage = vi.fn().mockResolvedValue({ goto });
        mockLaunch.mockResolvedValue({ close, newPage });
        const controller = BrowserPageController.create({ browserExecutablePath });

        await expect(controller.renderSVG(browserPageControllerFixture.source))
            .rejects.toThrow(browserPageControllerFixture.navigationError);

        expect(close).toHaveBeenCalledOnce();
    });
});
