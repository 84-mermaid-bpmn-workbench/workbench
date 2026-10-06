import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const outputDirectory = fileURLToPath(new URL('../.builds/dist', import.meta.url));

await rm(outputDirectory, { recursive: true, force: true });
