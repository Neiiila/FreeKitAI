# FreeKit AI

Free, browser-based online tools for work, study, and small business: resume bullet points, professional emails, social media captions, word counting, and product descriptions.

*"FreeKit AI" is a working name. Check domain and trademark availability before you launch; the name lives in `site.config.json` and can be changed in one place.*

## Architecture (and why)

| Choice | Reason |
| --- | --- |
| Static HTML + CSS + vanilla JavaScript (ES modules) | Fastest possible pages, no framework to learn or update, works on any static host. |
| A ~300-line zero-dependency Node build script | Shares one header/footer across 19 pages, fills tool cards and guide lists from data, and generates `sitemap.xml` and `robots.txt`. No `npm install` needed. |
| All tool logic runs in the browser | No backend, no database, no API keys, $0 running cost, and user text never leaves the device. |
| Template engines, not AI | Free, instant, predictable, and they can't invent facts. Each tool says so clearly. |
| Cloudflare Pages for hosting | Free plan allows commercial use (ads/affiliates), with unlimited static requests. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). |

## Folder structure

```
FreeKitAI/
├── site.config.json          ← brand name, base URL, contact email, analytics token
├── package.json              ← npm scripts only (no dependencies)
├── scripts/
│   ├── build.mjs             ← src/ → dist/ (pages, sitemap, robots, headers)
│   ├── serve.mjs             ← local test server for dist/
│   ├── check-links.mjs       ← fails if any internal link / #anchor / template token is broken
│   └── icons.mjs             ← inline SVG icons
├── src/
│   ├── data/tools.json       ← tool + category registry (cards, search, footer, related tools)
│   ├── partials/layout.html  ← <head>, header, footer shared by every page
│   ├── pages/                ← one HTML file per page (+ a <!--meta {json} --> block)
│   │   ├── index.html                     → /
│   │   ├── tools/index.html               → /tools/            (search + category filter)
│   │   ├── tools/resume-bullet-generator.html → /tools/resume-bullet-generator/
│   │   ├── tools/email-generator.html
│   │   ├── tools/social-media-caption-generator.html
│   │   ├── tools/word-counter.html
│   │   ├── tools/product-description-generator.html
│   │   ├── for-work.html, for-business.html
│   │   ├── guides/index.html + 3 guides
│   │   ├── about, contact, privacy, terms, affiliate-disclosure
│   │   └── 404.html
│   ├── assets/
│   │   ├── css/styles.css    ← design system (colors are tokens at the top)
│   │   └── js/
│   │       ├── engines/      ← pure generator logic (testable in Node)
│   │       ├── tools/        ← one UI script per tool page
│   │       ├── site.js       ← menu, theme, search, filters
│   │       ├── ui.js         ← copy buttons, result blocks, validation helpers
│   │       └── theme-init.js
│   └── static/               ← copied as-is: favicon.svg, _headers (security headers + CSP)
├── tests/run.mjs             ← 30 engine tests incl. "never invents numbers" and "no network calls"
├── docs/                     ← deployment, 90-day plan, editorial plan, services, AI backend notes
└── dist/                     ← build output (what you deploy; not committed)
```

## Run it locally

Requires Node.js 16 or newer. Nothing to install.

```bash
npm run dev
```

Then open <http://localhost:8080>. (`npm run dev` = build + serve. Use `node scripts/serve.mjs 3000` for another port.)

Before deploying, run every check:

```bash
npm run check
```

This builds the site, runs the engine tests, and checks every internal link and anchor.

> Opening `dist/index.html` directly from disk will not work, because browsers block ES modules on `file://`. Always use the local server.

## Common changes

- **Rename the brand / set your domain** → edit `site.config.json` (`name`, `baseUrl`), then rebuild. Canonical URLs, sitemap and robots update automatically.
- **Add a tool** → add an entry to `src/data/tools.json`, create `src/pages/tools/<id>.html` (copy an existing tool page), an engine in `src/assets/js/engines/`, and a UI script in `src/assets/js/tools/`. It then appears in cards, search, the footer, and related tools automatically.
- **Add a guide** → copy a file in `src/pages/guides/` and edit its `"guide"` meta (summary, readMinutes, published, tools). It is listed on `/guides/`, on related pages, and in the sitemap.
- **Change colors** → the tokens at the top of `src/assets/css/styles.css` (light and dark).

## Documentation

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — step-by-step free deployment on Cloudflare Pages, Search Console, analytics
- [docs/LAUNCH-PLAN.md](docs/LAUNCH-PLAN.md) — 90-day traffic and monetization plan, metrics to watch
- [docs/EDITORIAL-PLAN.md](docs/EDITORIAL-PLAN.md) — 12 article ideas with angles and tool links
- [docs/SERVICES.md](docs/SERVICES.md) — everything that needs a third-party account, manual setup, or a future paid service
- [docs/FUTURE-AI.md](docs/FUTURE-AI.md) — how to add a real AI feature later without exposing keys
