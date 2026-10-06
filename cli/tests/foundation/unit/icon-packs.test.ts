import { describe, expect, it } from 'vitest';
import { iconPacksFixture } from '@tests/.ancillary/fixtures/index.js';
import { localMermaidBPMNIconPacks } from '@src/icon-packs.js';

describe('[unit] localMermaidBPMNIconPacks Test', () => {
    it('loaders: Should load every supported local Iconify pack', async () => {
        const actual = await Promise.all(localMermaidBPMNIconPacks.map(async (iconPack) => ({
            name: iconPack.name,
            iconSet: await iconPack.loader!()
        })));

        expect(actual.map((iconPack) => iconPack.name)).toEqual(iconPacksFixture.names);

        for (const iconPack of actual) {
            expect(iconPack.iconSet.icons).toEqual(expect.any(Object));
        }
    });
});
