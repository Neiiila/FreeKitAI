// Length targets for the word counter. Pure data + logic, no network.
// "limit" = the platform rejects or cuts text above it; "recommended" = a guideline, not enforced.
// Each preset was checked against its source on the date in LIMITS_CHECKED; platforms change these.

export const LIMITS_CHECKED = '2026-10-23';

export const LIMIT_PRESETS = [
  { id: 'x-post', label: 'X (Twitter) post', unit: 'characters', max: 280, kind: 'limit', source: 'https://help.x.com/en/using-x/types-of-posts', note: 'Standard accounts. X counts links as 23 characters and some characters as 2, so its count can differ.' },
  { id: 'linkedin-post', label: 'LinkedIn post', unit: 'characters', max: 3000, kind: 'limit', source: 'https://www.linkedin.com/help/linkedin/answer/a528176' },
  { id: 'instagram-caption', label: 'Instagram caption', unit: 'characters', max: 2200, kind: 'limit', source: 'https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media', note: 'Only the first lines show before “more”.' },
  { id: 'youtube-title', label: 'YouTube video title', unit: 'characters', max: 100, kind: 'limit', source: 'https://support.google.com/youtube/answer/57404' },
  { id: 'youtube-description', label: 'YouTube video description', unit: 'characters', max: 5000, kind: 'limit', source: 'https://support.google.com/youtube/answer/12948449' },
  { id: 'seo-title', label: 'Page title (SEO)', unit: 'characters', max: 60, kind: 'recommended', note: 'Search engines shorten titles by display width, not a fixed count. About 60 characters usually shows in full.' },
  { id: 'meta-description', label: 'Meta description (SEO)', unit: 'characters', max: 155, kind: 'recommended', note: 'Search engines shorten snippets by display width. About 155 characters usually shows in full.' }
];

export const NEAR_RATIO = 0.9;

export function findPreset(id) {
  return LIMIT_PRESETS.find((p) => p.id === id) || null;
}

/**
 * Compare the current stats with a target.
 * @param {{words: number, characters: number}} stats  output of stats() from textstats.js
 * @param {{unit: 'characters'|'words', max: number}} target
 * @returns {{used: number, max: number, remaining: number, percent: number, status: 'ok'|'near'|'over'} | null}
 */
export function checkLimit(stats, target) {
  if (!target || !Number.isFinite(target.max) || target.max <= 0) return null;
  const used = target.unit === 'words' ? stats.words : stats.characters;
  const remaining = target.max - used;
  const status = used > target.max ? 'over' : used >= target.max * NEAR_RATIO ? 'near' : 'ok';
  return { used, max: target.max, remaining, percent: Math.min(100, Math.round((used / target.max) * 100)), status };
}

/** Human-readable summary, e.g. "45 characters left" or "12 words over". */
export function describeLimit(result, unit, kind = 'limit') {
  if (!result) return '';
  const n = Math.abs(result.remaining);
  const noun = n === 1 ? unit.replace(/s$/, '') : unit;
  if (result.remaining < 0) return `${n.toLocaleString()} ${noun} over the ${kind === 'recommended' ? 'recommended length' : 'limit'}`;
  if (result.remaining === 0) return `Exactly at the ${kind === 'recommended' ? 'recommended length' : 'limit'}`;
  return `${n.toLocaleString()} ${noun} left`;
}
