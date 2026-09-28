// Build the prototype as one self-contained HTML page (JS, CSS and fonts
// inlined) that can be published as a claude.ai Artifact.
// Usage: bun run build:artifact  ->  dist-artifact/anumat-prototype.html
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-artifact';
let html = readFileSync(join(dir, 'index.html'), 'utf8');
const asset = (href) => readFileSync(join(dir, href.replace(/^\.\//, '')), 'utf8');

html = html
  // Inline the stylesheet and the (single) module script.
  .replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_, href) => `<style>${asset(href)}</style>`)
  .replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_, src) => {
    const js = asset(src).replace(/<\/script/gi, '<\\/script');
    return `<script type="module">${js}</script>`;
  })
  // Links to separate files don't exist in a single page.
  .replace(/<link rel="(icon|apple-touch-icon)"[^>]*>\n?/g, '')
  .replace(/<meta property="og:[^>]*>\n?/g, '')
  .replace('<title>Anumat ERP</title>', '<title>Anumat ERP Prototype</title>')
  // The Artifact host supplies the document skeleton.
  .replace(/<!doctype html>\n?/i, '')
  .replace(/<\/?(html|head|body)[^>]*>\n?/g, '');

// Move <title> to the very top so the host finds it.
const title = html.match(/<title>.*?<\/title>/)[0];
html = `${title}\n${html.replace(title, '')}`;

if (/src="\.\/assets|href="\.\/assets/.test(html)) throw new Error('An asset was not inlined.');
const out = join(dir, 'anumat-prototype.html');
writeFileSync(out, html);
console.log(`wrote ${out} (${Math.round(html.length / 1024)} KB)`);
