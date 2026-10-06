import { beforeEach, describe, expect, it, vi } from 'vitest';
import { indexFixture } from '@fixtures/index.js';

const { mockBrowserExecutablePath, mockBrowserExecutablePathCreate, mockBrowserPageControllerCreate, mockRenderSVG } = vi.hoisted(() => ({
    mockBrowserExecutablePath: { path: '' },
    mockBrowserExecutablePathCreate: vi.fn(),
    mockBrowserPageControllerCreate: vi.fn(),
    mockRenderSVG: vi.fn()
}));

vi.mock('@src/BrowserExecutablePath.valueobject.js', () => ({
    BrowserExecutablePathVO: {
        create: mockBrowserExecutablePathCreate
    }
}));

vi.mock('@src/BrowserPageController.js', () => ({
    BrowserPageController: {
        create: mockBrowserPageControllerCreate
    }
}));

describe('[unit] renderSvg Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockBrowserExecutablePath.path = indexFixture.browserPath;
        mockBrowserExecutablePathCreate.mockResolvedValue(mockBrowserExecutablePath);
        mockBrowserPageControllerCreate.mockReturnValue({ renderSVG: mockRenderSVG });
        mockRenderSVG.mockResolvedValue(indexFixture.svg);
    });

    it('renderSvg(): Should create a browser controller and return its SVG', async () => {
        const { renderSvg } = await import('@src/index.js');

        const actual = await renderSvg(indexFixture.source, {
            browserPath: indexFixture.browserPath,
            rendererPageURL: indexFixture.rendererPageURL
        });

        expect(actual).toEqual(indexFixture.svg);
        expect(mockBrowserExecutablePathCreate).toHaveBeenCalledWith({ path: indexFixture.browserPath });
        expect(mockBrowserPageControllerCreate).toHaveBeenCalledWith({
            browserExecutablePath: mockBrowserExecutablePath,
            rendererPageURL: indexFixture.rendererPageURL
        });
        expect(mockRenderSVG).toHaveBeenCalledWith(indexFixture.source);
    });
});
