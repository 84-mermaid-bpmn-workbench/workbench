import type { IconifyJSON } from '@iconify/types';

const lucideIconPack: IconifyJSON = {
    prefix: 'lucide',
    icons: {
        'test-icon': {
            body: '<path />'
        }
    }
};

export const iconPacksFixture = {
    iconPackNames: ['lucide', 'nonicons', 'devicon-plain', 'fa7-regular', 'fa7-brands', 'mdi'],
    rendererPageURL: new URL('file:///workspace/.delivery/.builds/dist/assets/renderer.html'),
    lucideIconPack,
    lucideIconPackURL: 'file:///workspace/.delivery/.builds/dist/icon-packs/lucide.js',
    missingRegistrationErrorMessage: 'The local Iconify pack did not register: lucide',
    loadingErrorMessage: 'Cannot load the local Iconify pack: lucide'
};
