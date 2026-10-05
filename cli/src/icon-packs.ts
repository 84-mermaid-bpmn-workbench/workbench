import type { IconPack } from 'mermaid-bpmn';

export const localMermaidBPMNIconPacks: IconPack[] = [
    {
        name: 'lucide',
        loader: async () => (await import('@iconify-json/lucide/icons.json')).default
    },
    {
        name: 'nonicons',
        loader: async () => (await import('@iconify-json/nonicons/icons.json')).default
    },
    {
        name: 'devicon-plain',
        loader: async () => (await import('@iconify-json/devicon-plain/icons.json')).default
    },
    {
        name: 'fa7-regular',
        loader: async () => (await import('@iconify-json/fa7-regular/icons.json')).default
    },
    {
        name: 'fa7-brands',
        loader: async () => (await import('@iconify-json/fa7-brands/icons.json')).default
    },
    {
        name: 'mdi',
        loader: async () => (await import('@iconify-json/mdi/icons.json')).default
    }
];
