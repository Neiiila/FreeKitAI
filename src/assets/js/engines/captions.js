// Social media caption generator — structured templates (no AI, no network).
// Hashtags are built only from the user's own topic and keywords, so they stay relevant.
import { clean, stripEndPunct, capFirst, splitList, joinList, hashtag, rotate, sentence } from './text.js';

export const PLATFORMS = {
  instagram: { label: 'Instagram', limit: 2200, maxTags: 10, emoji: true, note: 'Only the first line or two show before “more”, so lead with the hook.' },
  tiktok: { label: 'TikTok', limit: 4000, maxTags: 6, emoji: true, note: 'Keep it short: most viewers read the caption while the video plays.' },
  facebook: { label: 'Facebook', limit: 63206, maxTags: 3, emoji: true, note: 'Hashtags matter less on Facebook; one to three is plenty.' },
  linkedin: { label: 'LinkedIn', limit: 3000, maxTags: 5, emoji: false, note: 'A few specific hashtags work better than many on LinkedIn.' }
};
export const TONES = ['friendly', 'professional', 'funny', 'inspirational'];
export const HASHTAG_MODES = ['none', 'few', 'more'];

// Each template: hook (first line) + body. {topic} is the user's topic; {kw} a keyword sentence.
const TEMPLATES = {
  friendly: [
    { e: '👋', hook: "Let's talk about {topic}!", body: '{kw}' },
    { e: '✨', hook: 'Something we love sharing: {topic}.', body: '{kw}' },
    { e: '💬', hook: 'Have you heard about {topic}?', body: '{kw}' },
    { e: '😊', hook: 'A little update on {topic}.', body: '{kw}' }
  ],
  professional: [
    { e: '', hook: 'A closer look at {topic}.', body: '{kw}' },
    { e: '', hook: "We're sharing an update on {topic}.", body: '{kw}' },
    { e: '', hook: 'Today we are highlighting {topic}.', body: '{kw}' },
    { e: '', hook: 'Here is what to know about {topic}.', body: '{kw}' }
  ],
  funny: [
    { e: '😅', hook: 'Nobody:\nAbsolutely nobody:\nUs: talking about {topic} again.', body: '{kw}' },
    { e: '🙈', hook: 'Plot twist: {topic}.', body: '{kw}' },
    { e: '📋', hook: "Today's to-do list:\n1. {topic}\n2. See point 1.", body: '{kw}' },
    { e: '🤫', hook: "Don't tell anyone, but we can't stop thinking about {topic}.", body: '{kw}' }
  ],
  inspirational: [
    { e: '🌱', hook: 'Every big goal starts with a small step. Today, that step is {topic}.', body: '{kw}' },
    { e: '✨', hook: 'Progress over perfection: {topic}.', body: '{kw}' },
    { e: '🚀', hook: 'Small steps add up. This one is about {topic}.', body: '{kw}' },
    { e: '💡', hook: 'Some ideas are worth sharing. {Topic} is one of them.', body: '{kw}' }
  ]
};

const KW_LINES = {
  friendly: ['Think {list}.', "It's all about {list}.", 'In short: {list}.'],
  professional: ['Key themes: {list}.', 'Focus areas: {list}.', 'In this post: {list}.'],
  funny: ['Featuring: {list}. Obviously.', 'Ingredients: {list}, and a lot of enthusiasm.', 'Starring: {list}.'],
  inspirational: ['Built on {list}.', 'Guided by {list}.', 'Fueled by {list}.']
};

/** Build hashtags from topic + keywords only. */
export function buildHashtags(topic, keywords, max) {
  if (!max) return [];
  const seen = new Set();
  const tags = [];
  const add = (phrase) => {
    const t = hashtag(phrase);
    if (t && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); tags.push(t); }
  };
  keywords.forEach(add);
  const topicWords = clean(topic).split(/\s+/);
  if (topicWords.length <= 3) add(topic);
  // Individual meaningful words from the topic as fallbacks.
  const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'for', 'to', 'in', 'on', 'with', 'our', 'your', 'my', 'new', 'this', 'that', 'we', 'is', 'are', 'how', 'why', 'what', 'about', 'from', 'at', 'by']);
  topicWords.filter((w) => w.length > 3 && !STOP.has(w.toLowerCase())).forEach(add);
  return tags.slice(0, max);
}

/** Characters as people count them (emoji = 1). */
export function charCount(s) {
  return Array.from(String(s)).length;
}

/**
 * @param {object} input { topic, platform, tone, keywords, cta, hashtags: 'none'|'few'|'more', emoji: boolean }
 * @returns {{ captions: {text: string, count: number, limit: number}[], hashtags: string[], notes: string[], error?: string }}
 */
export function generateCaptions(input, variant = 0) {
  const topic = stripEndPunct(input.topic);
  if (!topic) return { captions: [], hashtags: [], notes: [], error: 'Enter a topic or product first.' };
  const platform = PLATFORMS[input.platform] ? input.platform : 'instagram';
  const p = PLATFORMS[platform];
  const tone = TONES.includes(input.tone) ? input.tone : 'friendly';
  const keywords = splitList(input.keywords).slice(0, 6);
  const cta = input.cta ? sentence(stripEndPunct(input.cta)) : '';
  const useEmoji = input.emoji !== false && p.emoji;
  const mode = HASHTAG_MODES.includes(input.hashtags) ? input.hashtags : 'few';
  const maxTags = mode === 'none' ? 0 : mode === 'few' ? Math.min(3, p.maxTags) : p.maxTags;
  const tags = buildHashtags(topic, keywords, maxTags);
  const notes = [p.note];
  if (mode !== 'none' && tags.length < maxTags) {
    notes.push('Add more keywords to get more relevant hashtags. We only create hashtags from your own words.');
  }

  const templates = rotate(TEMPLATES[tone], variant).slice(0, 3);
  const kwLines = rotate(KW_LINES[tone], variant);
  const topicMid = /^[A-Z]{2,}|^[A-Z][a-z]+[A-Z]/.test(topic) ? topic : topic.charAt(0).toLowerCase() + topic.slice(1);

  const captions = templates.map((tpl, i) => {
    let hook = tpl.hook.split('{Topic}').join(capFirst(topic));
    // Topic at the very start of a line keeps a capital letter; elsewhere it reads naturally in lower case.
    hook = hook.replace(/(^|\n|\d\. )\{topic\}/g, (m, lead) => lead + capFirst(topic)).split('{topic}').join(topicMid);
    hook = hook.charAt(0).toUpperCase() + hook.slice(1); // not capFirst(): it would collapse the line breaks
    if (useEmoji && tpl.e) hook = `${hook} ${tpl.e}`;
    const lines = [hook];
    // Spread keywords differently across variations so they are not identical.
    if (keywords.length) {
      const kws = i === 2 && keywords.length > 2 ? keywords.slice(0, 2) : keywords.slice(0, 4);
      lines.push(kwLines[i % kwLines.length].replace('{list}', joinList(kws)));
    }
    if (cta) lines.push(useEmoji && tone !== 'professional' ? `👉 ${cta}` : cta);
    const sep = platform === 'tiktok' ? ' ' : '\n\n';
    let text = lines.join(sep);
    if (tags.length) text += (platform === 'tiktok' ? ' ' : '\n\n') + tags.join(' ');
    return { text, count: charCount(text), limit: p.limit };
  });

  if (!cta) notes.push('Tip: add a call to action, such as “Comment your favorite” or “Link in bio”, to tell people what to do next.');
  return { captions, hashtags: tags, notes };
}
