// Site-wide behaviour: mobile menu, theme toggle, tool search and category filters.

// ---------- mobile menu ----------
const menuBtn = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');
if (menuBtn && nav) {
  const close = () => { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn.addEventListener('click', () => {
    const open = !nav.classList.contains('is-open');
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { close(); menuBtn.focus(); }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) close(); });
}

// ---------- theme ----------
const themeBtn = document.querySelector('[data-theme-toggle]');
if (themeBtn) {
  const sync = () => themeBtn.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
  sync();
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('fk-theme', next); } catch { /* private mode: not persisted */ }
    sync();
  });
}

// ---------- search helpers ----------
const normalize = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ');
const STOP = new Set(['a', 'an', 'the', 'for', 'to', 'of', 'and', 'or', 'my', 'i', 'me', 'need', 'help', 'with', 'want', 'how', 'do', 'tool', 'tools', 'free', 'online', 'generator', 'write', 'make', 'create']);

/**
 * A card matches when at least half of the meaningful query words appear in its search text
 * (plurals are tolerated: "words" matches "word"). Natural questions like "instagram post ideas" still match.
 */
export function matches(searchText, query) {
  const words = normalize(query).split(/\s+/).filter((w) => w && !STOP.has(w));
  if (!words.length) return true;
  const hay = normalize(searchText);
  const hits = words.filter((w) => hay.includes(w) || (w.length > 3 && w.endsWith('s') && hay.includes(w.slice(0, -1)))).length;
  return hits >= Math.ceil(words.length / 2);
}

// ---------- tools listing page: search + category chips ----------
const filterRoot = document.querySelector('[data-filter]');
if (filterRoot) {
  const input = filterRoot.querySelector('[data-filter-input]');
  const chips = [...filterRoot.querySelectorAll('[data-category]')];
  const cards = [...document.querySelectorAll('[data-filter-results] [data-tool]')];
  const countEl = document.querySelector('[data-filter-count]');
  const emptyEl = document.querySelector('[data-filter-empty]');
  const params = new URLSearchParams(location.search);
  let category = params.get('category') || 'all';
  if (!chips.some((c) => c.dataset.category === category)) category = 'all';
  input.value = params.get('q') || '';

  const apply = (updateUrl) => {
    let shown = 0;
    for (const card of cards) {
      const ok = (category === 'all' || card.dataset.categories.split(' ').includes(category)) && matches(card.dataset.search, input.value);
      card.hidden = !ok;
      if (ok) shown++;
    }
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.category === category)));
    countEl.textContent = `Showing ${shown} of ${cards.length} tools`;
    emptyEl.hidden = shown !== 0;
    if (updateUrl) {
      const p = new URLSearchParams();
      if (input.value.trim()) p.set('q', input.value.trim());
      if (category !== 'all') p.set('category', category);
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
    }
  };
  input.addEventListener('input', () => apply(true));
  chips.forEach((c) => c.addEventListener('click', () => { category = c.dataset.category; apply(true); }));
  filterRoot.addEventListener('submit', (e) => e.preventDefault());
  document.querySelectorAll('[data-filter-reset]').forEach((b) =>
    b.addEventListener('click', () => { input.value = ''; category = 'all'; apply(true); input.focus(); })
  );
  apply(false);
}

// ---------- homepage hero search: live suggestions ----------
const hero = document.querySelector('[data-hero-search]');
if (hero) {
  const input = hero.querySelector('input');
  const list = hero.querySelector('[data-suggestions]');
  const status = hero.querySelector('[data-suggestions-status]');
  const tools = [...document.querySelectorAll('[data-tool]')].map((card) => ({
    name: card.querySelector('.card-title').textContent,
    desc: card.querySelector('.card-text').textContent,
    href: card.querySelector('.card-link').getAttribute('href'),
    search: card.dataset.search
  }));
  const render = () => {
    const q = input.value.trim();
    list.replaceChildren();
    if (!q) { list.hidden = true; status.textContent = ''; return; }
    const found = tools.filter((t) => matches(t.search, q));
    if (!found.length) {
      const li = document.createElement('li');
      li.className = 'sugg-empty';
      li.innerHTML = 'No matching tool yet. <a href="/tools/">Browse all tools</a>';
      list.append(li);
    }
    for (const t of found) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = t.href;
      a.textContent = t.name;
      const d = document.createElement('span');
      d.className = 'sugg-desc';
      d.textContent = t.desc;
      a.append(d);
      li.append(a);
      list.append(li);
    }
    list.hidden = false;
    status.textContent = found.length ? `${found.length} matching ${found.length === 1 ? 'tool' : 'tools'}` : 'No matching tools';
  };
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { const first = list.querySelector('a'); if (first) { e.preventDefault(); first.focus(); } }
    if (e.key === 'Escape') { input.value = ''; render(); }
  });
  list.addEventListener('keydown', (e) => {
    const links = [...list.querySelectorAll('a')];
    const i = links.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && i > -1 && i < links.length - 1) { e.preventDefault(); links[i + 1].focus(); }
    if (e.key === 'ArrowUp' && i > -1) { e.preventDefault(); (i === 0 ? input : links[i - 1]).focus(); }
    if (e.key === 'Escape') { input.focus(); }
  });
}
