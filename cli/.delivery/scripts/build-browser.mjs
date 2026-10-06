import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const browserEntryPoint = fileURLToPath(new URL('../../src/BrowserPageRenderer.ts', import.meta.url));
const rendererSource = fileURLToPath(new URL('../../assets/renderer.html', import.meta.url));
const outputDirectory = fileURLToPath(new URL('../.builds/dist', import.meta.url));
const rendererOutputDirectory = fileURLToPath(new URL('../.builds/dist/assets', import.meta.url));
const rendererOutput = fileURLToPath(new URL('../.builds/dist/assets/renderer.html', import.meta.url));

await mkdir(outputDirectory, { recursive: true });
await mkdir(rendererOutputDirectory, { recursive: true });
await build({
    bundle: true,
    entryPoints: [browserEntryPoint],
    format: 'esm',
    outdir: outputDirectory,
    platform: 'browser',
    target: 'es2022',
    entryNames: 'BrowserPageRenderer'
});
await copyFile(rendererSource, rendererOutput);
