import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const outputDir = '/build';
const galleryDir = `${outputDir}/examples`;
const galleryLink = 'class="nav" href="."';
const deployedGalleryLink = 'class="nav" href="/examples/"';
const editorLink = '<a href="./editor">live editor</a>';
const deployedEditorLink = '<a href="/">live editor</a>';

await mkdir(galleryDir, { recursive: true });
await cp(`${outputDir}/index.html`, `${galleryDir}/index.html`);
await cp(`${outputDir}/editor.html`, `${outputDir}/index.html`);

const galleryPath = `${galleryDir}/index.html`;
const galleryHtml = await readFile(galleryPath, 'utf8');
if (!galleryHtml.includes(editorLink)) {
  throw new Error(`Expected live-editor link was not found in ${galleryPath}.`);
}
await writeFile(galleryPath, galleryHtml.replace(editorLink, deployedEditorLink));

for (const path of [`${outputDir}/index.html`, `${outputDir}/editor.html`]) {
  const html = await readFile(path, 'utf8');
  if (!html.includes(galleryLink)) {
    throw new Error(`Expected example-gallery link was not found in ${path}.`);
  }
  await writeFile(path, html.replace(galleryLink, deployedGalleryLink));
}
