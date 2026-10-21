// Zero-dependency static site builder.
// src/pages/**/*.html (each starting with a <!--meta {json} --> block) + src/partials/layout.html  ->  dist/
// Works on Node 16+.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { icons } from './icons.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const dist = path.join(root, 'dist');

const config = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(src, 'data', 'tools.json'), 'utf8'));
const layout = fs.readFileSync(path.join(src, 'partials', 'layout.html'), 'utf8');
const baseUrl = (process.env.SITE_URL || config.baseUrl).replace(/\/+$/, '');

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- collect pages ----------
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith('.html') ? [p] : [];
  });
}

function urlPathFor(file) {
  const rel = path.relative(path.join(src, 'pages'), file).split(path.sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel === '404.html') return '/404.html';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel.slice(0, -'.html'.length) + '/';
}

const pages = walk(path.join(src, 'pages')).map((file) => {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  if (!m) throw new Error(`Missing <!--meta {...} --> block in ${file}`);
  let meta;
  try {
    meta = JSON.parse(m[1]);
  } catch (e) {
    throw new Error(`Invalid meta JSON in ${file}: ${e.message}`);
  }
  return { file, meta, body: raw.slice(m[0].length), url: urlPathFor(file) };
});

const guides = pages
  .filter((p) => p.meta.guide)
  .sort((a, b) => (a.meta.guide.order || 99) - (b.meta.guide.order || 99));

// ---------- component renderers ----------
const toolById = Object.fromEntries(data.tools.map((t) => [t.id, t]));
const catById = Object.fromEntries(data.categories.map((c) => [c.id, c]));

function toolCard(t, headingLevel = 3) {
  const h = `h${headingLevel}`;
  const search = [t.name, t.description, t.keywords, ...t.categories.map((c) => catById[c].name)].join(' ').toLowerCase();
  return `<article class="card tool-card" data-tool data-search="${esc(search)}" data-categories="${t.categories.join(' ')}">
  <div class="card-icon">${icons[t.icon] || ''}</div>
  <${h} class="card-title">${esc(t.name)}</${h}>
  <p class="card-text">${esc(t.description)}</p>
  <p class="badge badge-local">${icons.lock}<span>Runs in your browser</span></p>
  <a class="card-link" href="${t.path}" aria-label="Use Free Tool: ${esc(t.name)}">Use Free Tool <span aria-hidden="true">&rarr;</span></a>
</article>`;
}

function toolCards(args) {
  let list = data.tools;
  if (args.category) list = list.filter((t) => t.categories.includes(args.category));
  if (args.audience) list = list.filter((t) => t.audiences.includes(args.audience));
  if (args.ids) list = args.ids.split(',').map((id) => toolById[id]).filter(Boolean);
  return `<div class="grid grid-cards">${list.map((t) => toolCard(t, args.h ? Number(args.h) : 3)).join('\n')}</div>`;
}

function relatedTools(id) {
  const self = toolById[id];
  const others = data.tools.filter((t) => t.id !== id);
  const scored = others
    .map((t) => ({ t, score: t.categories.filter((c) => self.categories.includes(c)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.t);
  return `<div class="grid grid-cards">${scored.map((t) => toolCard(t, 3)).join('\n')}</div>`;
}

function categoryCards() {
  return `<div class="grid grid-cats">${data.categories
    .map((c) => {
      const count = data.tools.filter((t) => t.categories.includes(c.id)).length;
      return `<a class="card cat-card" href="/tools/?category=${c.id}">
  <span class="card-icon">${icons[c.icon] || ''}</span>
  <span class="cat-body"><span class="card-title">${esc(c.name)}</span>
  <span class="card-text">${esc(c.description)}</span>
  <span class="cat-count">${count} ${count === 1 ? 'tool' : 'tools'}</span></span>
</a>`;
    })
    .join('\n')}</div>`;
}

function guideCards(args) {
  let list = guides;
  if (args.tool) { const wanted = args.tool.split(","); list = list.filter((g) => (g.meta.guide.tools || []).some((t) => wanted.includes(t))); }
  if (!list.length) return '';
  return `<div class="grid grid-cards">${list
    .map(
      (g) => `<article class="card guide-card">
  <span class="card-icon">${icons.book}</span>
  <h3 class="card-title"><a href="${g.url}">${esc(g.meta.h1 || g.meta.title)}</a></h3>
  <p class="card-text">${esc(g.meta.guide.summary)}</p>
  <p class="card-meta">${g.meta.guide.readMinutes} min read</p>
</article>`
    )
    .join('\n')}</div>`;
}

function breadcrumbs(items) {
  if (!items || !items.length) return '';
  const all = [['Home', '/'], ...items];
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${all
    .map(([name, href], i) =>
      i === all.length - 1 ? `<li><span aria-current="page">${esc(name)}</span></li>` : `<li><a href="${href}">${esc(name)}</a></li>`
    )
    .join('')}</ol></nav>`;
}

function contactLine() {
  return config.contactEmail
    ? `<a href="mailto:${esc(config.contactEmail)}">${esc(config.contactEmail)}</a>`
    : `<span class="placeholder-note">[Contact address not configured yet &mdash; set <code>contactEmail</code> in <code>site.config.json</code>]</span>`;
}

// ---------- structured data ----------
function jsonLd(page) {
  const blocks = [];
  const url = baseUrl + page.url;
  if (page.url === '/') {
    blocks.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: config.name, url: baseUrl + '/' });
  }
  if (page.meta.toolId) {
    const t = toolById[page.meta.toolId];
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: t.name,
      url,
      description: page.meta.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (web browser)',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    });
  }
  if (page.meta.guide) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.meta.h1 || page.meta.title,
      description: page.meta.description,
      datePublished: page.meta.guide.published,
      dateModified: page.meta.guide.updated || page.meta.guide.published,
      author: { '@type': 'Organization', name: config.name },
      mainEntityOfPage: url
    });
  }
  if (page.meta.breadcrumbs && page.meta.breadcrumbs.length) {
    const all = [['Home', '/'], ...page.meta.breadcrumbs];
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: all.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: baseUrl + href }))
    });
  }
  return blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b).replace(/</g, '\\u003c')}</script>`).join('\n');
}

// ---------- templating ----------
const flags = {
  contactEmail: Boolean(config.contactEmail),
  analytics: Boolean(config.analytics && config.analytics.cloudflareWebAnalyticsToken),
  operator: Boolean(config.operator),
  jurisdiction: Boolean(config.jurisdiction)
};

function applyConditionals(html) {
  // {{#if flag}} ... {{else}} ... {{/if}}  (not nested)
  return html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (_, flag, yes, no) => {
    if (!(flag in flags)) throw new Error(`Unknown flag in {{#if ${flag}}}`);
    return flags[flag] ? yes : no || '';
  });
}

function parseArgs(str) {
  const args = {};
  (str || '').trim().split(/\s+/).filter(Boolean).forEach((pair) => {
    const [k, v] = pair.split('=');
    args[k] = v === undefined ? true : v;
  });
  return args;
}

function applyTokens(html, page) {
  return html.replace(/\{\{\s*([\w.]+)((?:\s+[\w-]+(?:=[\w,.-]+)?)*)\s*\}\}/g, (whole, name, rawArgs) => {
    const args = parseArgs(rawArgs);
    switch (name) {
      case 'toolCards': return toolCards(args);
      case 'relatedTools': return relatedTools(Object.keys(args)[0]);
      case 'categoryCards': return categoryCards();
      case 'guideCards': return guideCards(args);
      case 'contactLine': return contactLine();
      case 'year': return String(new Date().getFullYear());
      case 'icon': return icons[Object.keys(args)[0]] || '';
      case 'baseUrl': return baseUrl;
      case 'page.url': return page.url;
      default:
        if (name.startsWith('site.')) {
          const key = name.slice(5);
          if (!(key in config)) throw new Error(`Unknown config key {{${name}}} in ${page.file}`);
          return esc(config[key]);
        }
        throw new Error(`Unknown token ${whole} in ${page.file}`);
    }
  });
}

function navCurrent(section, key) {
  return section === key ? ' aria-current="page"' : '';
}

function render(page) {
  const m = page.meta;
  const title = m.title.includes(config.name) ? m.title : `${m.title} | ${config.name}`;
  const scripts = (m.scripts || []).map((s) => `<script type="module" src="${s}"></script>`).join('\n');
  const token = config.analytics && config.analytics.cloudflareWebAnalyticsToken;
  const analytics = token
    ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({ token })}'></script>`
    : '';
  const verification = config.searchConsoleVerification
    ? `<meta name="google-site-verification" content="${esc(config.searchConsoleVerification)}">`
    : '';
  const replacements = {
    '%TITLE%': esc(title),
    '%DESCRIPTION%': esc(m.description),
    '%CANONICAL%': esc(baseUrl + (page.url === '/404.html' ? '/' : page.url)),
    '%ROBOTS%': m.noindex ? '<meta name="robots" content="noindex">' : '',
    '%OG_TYPE%': m.guide ? 'article' : 'website',
    '%JSONLD%': jsonLd(page),
    '%SCRIPTS%': scripts,
    '%ANALYTICS%': analytics,
    '%VERIFICATION%': verification,
    '%BREADCRUMBS%': breadcrumbs(m.breadcrumbs),
    '%NAV_TOOLS%': navCurrent(m.section, 'tools'),
    '%NAV_WORK%': navCurrent(m.section, 'work'),
    '%NAV_BUSINESS%': navCurrent(m.section, 'business'),
    '%NAV_GUIDES%': navCurrent(m.section, 'guides'),
    '%NAV_ABOUT%': navCurrent(m.section, 'about'),
    '%FOOTER_TOOLS%': data.tools.map((t) => `<li><a href="${t.path}">${esc(t.name)}</a></li>`).join('')
  };
  let html = layout;
  for (const [k, v] of Object.entries(replacements)) html = html.split(k).join(v);
  html = html.replace('%CONTENT%', () => page.body);
  html = applyConditionals(html);
  html = applyTokens(html, page);
  return html;
}

// ---------- write output ----------
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    e.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b);
  }
}

fs.rmSync(dist, { recursive: true, force: true });
copyDir(path.join(src, 'assets'), path.join(dist, 'assets'));
copyDir(path.join(src, 'static'), dist);

for (const page of pages) {
  const out = page.url === '/404.html' ? path.join(dist, '404.html') : path.join(dist, page.url, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, render(page));
}

// Content-Security-Policy: allow the analytics beacon only when it is configured.
const headersPath = path.join(dist, '_headers');
if (fs.existsSync(headersPath)) {
  const extraScript = flags.analytics ? ' https://static.cloudflareinsights.com' : '';
  const extraConnect = flags.analytics ? ' https://cloudflareinsights.com' : '';
  const h = fs.readFileSync(headersPath, 'utf8').replace('%CSP_SCRIPT%', extraScript).replace('%CSP_CONNECT%', extraConnect);
  fs.writeFileSync(headersPath, h);
}

// lastmod is only emitted when a page declares a real date ("updated" in its meta, or a guide's dates).
const indexable = pages.filter((p) => !p.meta.noindex && p.url !== '/404.html');
const lastmod = (p) => p.meta.updated || (p.meta.guide && (p.meta.guide.updated || p.meta.guide.published));
fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable
  .map((p) => `  <url><loc>${baseUrl}${p.url}</loc>${lastmod(p) ? `<lastmod>${lastmod(p)}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>
`
);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);

console.log(`Built ${pages.length} pages into dist/ (base URL ${baseUrl})`);
