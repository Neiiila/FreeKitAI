// Word counter & text cleaner — runs entirely in the browser. Nothing is sent anywhere.
import { titleCase, sentenceCase } from './text.js';

export const READING_WPM = 238; // average silent reading speed for non-fiction (Brysbaert, 2019)
export const SPEAKING_WPM = 140; // a typical conversational presentation pace

const hasSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function';
const wordSeg = hasSegmenter ? new Intl.Segmenter('en', { granularity: 'word' }) : null;
const graphemeSeg = hasSegmenter ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null;

/** Count user-perceived characters (an emoji or accented letter counts as one). */
export function countChars(text) {
  if (graphemeSeg) {
    let n = 0;
    for (const _ of graphemeSeg.segment(text)) n++;
    return n;
  }
  return Array.from(text).length;
}

export function countWords(text) {
  if (!text.trim()) return 0;
  if (wordSeg) {
    let n = 0;
    for (const s of wordSeg.segment(text)) if (s.isWordLike) n++;
    return n;
  }
  const m = text.match(/[\p{L}\p{N}]+(?:['’\-.][\p{L}\p{N}]+)*/gu);
  return m ? m.length : 0;
}

export function countSentences(text) {
  const t = text.trim();
  if (!t) return 0;
  // A sentence ends with . ! ? (or …) followed by space/end; common abbreviations are ignored.
  const cleaned = t
    .replace(/\b(?:e\.g|i\.e|etc|vs|Mr|Mrs|Ms|Dr|Prof|St|Jr|Sr|No|approx|Inc|Ltd)\./gi, (m) => m.replace(/\./g, ''))
    .replace(/\d\.\d/g, (m) => m.replace('.', ''));
  const parts = cleaned.split(/[.!?…]+["')\]]*(?=\s|$)|\n\s*\n/).filter((s) => /[\p{L}\p{N}]/u.test(s));
  return parts.length;
}

export function countParagraphs(text) {
  return text.split(/\n\s*\n/).filter((p) => p.trim()).length;
}

function formatMinutes(words, wpm) {
  if (!words) return '0 sec';
  const seconds = Math.round((words / wpm) * 60);
  if (seconds < 60) return `${Math.max(seconds, 1)} sec`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec ? `${min} min ${sec} sec` : `${min} min`;
}

export function stats(text) {
  const s = String(text || '');
  const words = countWords(s);
  return {
    words,
    characters: countChars(s),
    charactersNoSpaces: countChars(s.replace(/\s+/g, '')),
    sentences: countSentences(s),
    paragraphs: countParagraphs(s),
    lines: s ? s.split(/\r\n|\r|\n/).length : 0,
    readingTime: formatMinutes(words, READING_WPM),
    speakingTime: formatMinutes(words, SPEAKING_WPM)
  };
}

// ---------- cleaning transforms (all pure) ----------

/** Collapse runs of spaces/tabs, trim each line, remove spaces before punctuation. Keeps line breaks. */
export function removeExtraSpaces(text) {
  return String(text)
    .replace(/ /g, ' ')
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(/[ \t]+/g, ' ').replace(/ ([,.;:!?)\]])/g, '$1').replace(/([(\[]) /g, '$1').trim())
    .join('\n')
    .trim();
}

/** Unify line endings, strip trailing whitespace, and allow at most one blank line between paragraphs. */
export function normalizeLineBreaks(text) {
  return String(text)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');
}

/** Join lines that were broken mid-sentence (e.g. text copied from a PDF), keeping paragraph breaks. */
export function joinBrokenLines(text) {
  return normalizeLineBreaks(text)
    .split('\n\n')
    .map((p) => p.replace(/-\n(?=\p{Ll})/gu, '').replace(/\n/g, ' ').replace(/ {2,}/g, ' '))
    .join('\n\n');
}

export const transforms = {
  removeExtraSpaces,
  normalizeLineBreaks,
  joinBrokenLines,
  upper: (t) => String(t).toUpperCase(),
  lower: (t) => String(t).toLowerCase(),
  title: (t) => titleCase(t),
  sentence: (t) => sentenceCase(t)
};
