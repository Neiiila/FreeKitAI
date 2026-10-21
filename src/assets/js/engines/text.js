// Small, dependency-free text helpers shared by the template engines.
// Pure functions: they work in the browser and in Node (used by the tests).

/** Collapse whitespace and trim. */
export function clean(s) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
}

/** Remove trailing sentence punctuation. */
export function stripEndPunct(s) {
  return clean(s).replace(/[\s.,;:!?]+$/, '');
}

/** Upper-case the first letter only. */
export function capFirst(s) {
  s = clean(s);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Lower-case the first letter unless the first word looks like an acronym or proper noun-ish token (e.g. "SEO", "iPhone"). */
export function lowerFirst(s) {
  s = clean(s);
  if (!s) return s;
  const first = s.split(' ')[0];
  if (/^[A-Z0-9]{2,}\b/.test(first) || /[A-Z]/.test(first.slice(1))) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Make sure a sentence ends with terminal punctuation. */
export function sentence(s) {
  s = capFirst(s);
  if (!s) return s;
  return /[.!?…]["')\]]?$/.test(s) ? s : s + '.';
}

/** Split a comma / semicolon / newline separated list, trimming and de-duplicating (case-insensitive). */
export function splitList(s) {
  const seen = new Set();
  return String(s == null ? '' : s)
    .split(/[\n;,]+/)
    .map((x) => stripEndPunct(x.replace(/^\s*(?:[-*•‣·]|\d+[.)])\s*/, '')))
    .filter((x) => {
      const k = x.toLowerCase();
      if (!x || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

/** Split by lines only (keeps commas inside a line). */
export function splitLines(s) {
  const seen = new Set();
  return String(s == null ? '' : s)
    .split(/\n+/)
    .map((x) => stripEndPunct(x.replace(/^\s*(?:[-*•‣·]|\d+[.)])\s*/, '')))
    .filter((x) => {
      const k = x.toLowerCase();
      if (!x || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

/** "a", "a and b", "a, b, and c" */
export function joinList(items, conj = 'and') {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list[0] || '';
  if (list.length === 2) return `${list[0]} ${conj} ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, ${conj} ${list[list.length - 1]}`;
}

/** Indefinite article for a phrase (good enough for common English words). */
export function article(phrase) {
  const w = clean(phrase).toLowerCase();
  if (!w) return 'a';
  if (/^(hour|honest|honou?r|heir)/.test(w)) return 'an';
  if (/^(uni|use|usu|uti|ure|eu|one|once|ewe)/.test(w)) return 'a';
  if (/^[aeiou]/.test(w)) return 'an';
  // Acronyms pronounced letter by letter: "an SEO tool", "an MBA graduate"
  const first = clean(phrase).split(' ')[0];
  if (/^[A-Z]{2,}$/.test(first) && /^[AEFHILMNORSX]/.test(first)) return 'an';
  return 'a';
}

export function withArticle(phrase) {
  return `${article(phrase)} ${clean(phrase)}`;
}

/** Deterministic pick: same input + variant always gives the same choice. */
export function pick(list, index) {
  if (!list.length) return '';
  return list[((index % list.length) + list.length) % list.length];
}

/** Rotate an array so variant n starts at a different element. */
export function rotate(list, n) {
  if (!list.length) return list;
  const k = ((n % list.length) + list.length) % list.length;
  return list.slice(k).concat(list.slice(0, k));
}

/** Title Case with common small words kept lower-case (except first/last). */
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'onto', 'or', 'over', 'per', 'the', 'to', 'up', 'via', 'vs', 'with', 'yet', 'so']);
export function titleCase(text) {
  const str = String(text);
  // If the whole text is shouting in capitals, don't treat every word as an acronym.
  const allCaps = str === str.toUpperCase();
  return str.split('\n').map((line) => {
    const parts = line.split(/(\s+)/);
    const wordIdx = parts.map((w, i) => (/\S/.test(w) ? i : -1)).filter((i) => i > -1);
    const firstI = wordIdx[0];
    const lastI = wordIdx[wordIdx.length - 1];
    let startsClause = true;
    return parts.map((w, i) => {
      if (!/\S/.test(w)) return w;
      const letters = w.replace(/[^\p{L}]/gu, '');
      const bare = w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase();
      let out;
      const isAcronym = !allCaps && letters.length > 1 && letters === letters.toUpperCase();
      const hasInnerCaps = /\p{Ll}/u.test(letters) && /\p{Lu}/u.test(letters.slice(1)); // iPhone, McDonald
      if (isAcronym || hasInnerCaps) {
        out = w;
      } else if (i !== firstI && i !== lastI && !startsClause && SMALL.has(bare)) {
        out = w.toLowerCase();
      } else {
        out = w.toLowerCase().replace(/(^|[-/("'“‘])(\p{L})/gu, (m, p, c) => p + c.toUpperCase());
      }
      startsClause = /[:.!?]["')]?$/.test(w);
      return out;
    }).join('');
  }).join('\n');
}

/** Sentence case: lower-case everything, then capitalise the first letter of each sentence. */
export function sentenceCase(text) {
  const str = String(text);
  const words = str.match(/[\p{L}\p{N}]+/gu) || [];
  const isCaps = (w) => w.length > 1 && /\p{Lu}/u.test(w) && w === w.toUpperCase();
  // Keep a lone acronym like "NASA"; a run of capital words ("HELLO THERE") is shouting, so it is lowered.
  const keep = new Set(words.filter((w, i) => isCaps(w) && !isCaps(words[i - 1] || '') && !isCaps(words[i + 1] || '')));
  return str
    .replace(/[\p{L}\p{N}]+/gu, (w) => (keep.has(w) ? w : w.toLowerCase()))
    .replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (m, p, c) => p + c.toUpperCase())
    .replace(/\bi\b/g, 'I');
}

/** Turn a phrase into a hashtag: "handmade soy candles" -> "#HandmadeSoyCandles". Returns '' if nothing usable. */
export function hashtag(phrase) {
  const words = clean(phrase)
    .replace(/^#/, '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (!words.length) return '';
  const tag = words.map((w) => (/^[A-Z0-9]+$/.test(w) && w.length <= 4 ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join('');
  if (tag.length < 2 || /^\d+$/.test(tag) || tag.length > 40) return '';
  return '#' + tag;
}
