// Checks every internal link, script, stylesheet and #anchor in dist/ points at something that exists.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const htmlFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(dist);

const idsCache = new Map();
function idsOf(file) {
  if (!idsCache.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}
function resolveTarget(urlPath) {
  const p = path.join(dist, decodeURIComponent(urlPath));
  if (urlPath.endsWith('/')) return fs.existsSync(path.join(p, 'index.html')) ? path.join(p, 'index.html') : null;
  return fs.existsSync(p) && fs.statSync(p).isFile() ? p : null;
}

let errors = 0;
let checked = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = '/' + path.relative(dist, file).split(path.sep).join('/');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
    checked++;
    const [pathPart, hash] = url.split('#');
    const target = pathPart === '' ? file : resolveTarget(pathPart.split('?')[0]);
    if (!target) { console.error(`✗ ${rel}: broken link ${url}`); errors++; continue; }
    if (hash && target.endsWith('.html') && !idsOf(target).has(hash)) { console.error(`✗ ${rel}: missing anchor ${url}`); errors++; }
  }
  if (/\{\{|%[A-Z_]+%/.test(html)) { console.error(`✗ ${rel}: unreplaced template token`); errors++; }
}
console.log(`${checked} internal links checked in ${htmlFiles.length} pages, ${errors} problem(s).`);
process.exit(errors ? 1 : 0);
