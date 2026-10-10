import type { IconifyJSON } from '@iconify/types';
import type { IconPack } from 'mermaid-bpmn';

type TLocalIconPackDefinition = {
    name: string;
    source: string;
};

const localIconPackLoads = new Map<string, Promise<IconifyJSON>>();

export const localMermaidBPMNIconPackDefinitions: TLocalIconPackDefinition[] = [
    {
        name: 'lucide',
        source: '@iconify-json/lucide/icons.json'
    },
    {
        name: 'nonicons',
        source: '@iconify-json/nonicons/icons.json'
    },
    {
        name: 'devicon-plain',
        source: '@iconify-json/devicon-plain/icons.json'
    },
    {
        name: 'fa7-regular',
        source: '@iconify-json/fa7-regular/icons.json'
    },
    {
        name: 'fa7-brands',
        source: '@iconify-json/fa7-brands/icons.json'
    },
    {
        name: 'mdi',
        source: '@iconify-json/mdi/icons.json'
    }
];

export const localMermaidBPMNIconPacks: IconPack[] = localMermaidBPMNIconPackDefinitions.map(({ name }) => ({
    name,
    loader: () => loadLocalIconPack(name)
}));

function loadLocalIconPack(name: string): Promise<IconifyJSON> {
    const existingLoad = localIconPackLoads.get(name);

    if (existingLoad !== undefined) {
        return existingLoad;
    }

    const iconPackLoad = new Promise<IconifyJSON>((resolve, reject) => {
        const existingIconPack = window.mermaidBPMNIconPackAssets?.[name];
        if (existingIconPack !== undefined) {
            resolve(existingIconPack);
            return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = new URL(`../icon-packs/${name}.js`, window.location.href).href;
        script.addEventListener('load', () => {
            const iconPack = window.mermaidBPMNIconPackAssets?.[name];
            if (iconPack === undefined) {
                reject(new Error(`The local Iconify pack did not register: ${name}`));
                return;
            }

            resolve(iconPack);
        }, { once: true });
        script.addEventListener('error', () => reject(new Error(`Cannot load the local Iconify pack: ${name}`)), { once: true });
        document.head.append(script);
    });

    localIconPackLoads.set(name, iconPackLoad);

    return iconPackLoad;
}
