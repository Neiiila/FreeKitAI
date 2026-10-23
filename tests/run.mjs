// Zero-dependency test runner for the tool engines. Run: npm test  (Node 16+)
import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateResumeBullets } from '../src/assets/js/engines/resume.js';
import { generateEmail, PURPOSES, RECIPIENTS, TONES as EMAIL_TONES, LENGTHS } from '../src/assets/js/engines/email.js';
import { generateCaptions, PLATFORMS, TONES as CAPTION_TONES } from '../src/assets/js/engines/captions.js';
import { stats, transforms } from '../src/assets/js/engines/textstats.js';
import { generateProductDescription, TONES as PRODUCT_TONES } from '../src/assets/js/engines/product.js';
import { LIMIT_PRESETS, checkLimit, describeLimit, findPreset } from '../src/assets/js/engines/limits.js';
import { titleCase, sentenceCase, hashtag, article, splitList, joinList } from '../src/assets/js/engines/text.js';

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.error(`✗ ${name}\n  ${e.message.split('\n').join('\n  ')}`);
  }
}

/** Every number in the output must already be in the input: the tools must never invent figures. */
function assertNoInventedNumbers(inputText, outputText) {
  const inNums = new Set(inputText.match(/\d+(?:[.,]\d+)?/g) || []);
  for (const n of outputText.match(/\d+(?:[.,]\d+)?/g) || []) {
    assert.ok(inNums.has(n), `Output contains a number not in the input: ${n}\n${outputText}`);
  }
}

const UNUSUAL = ['   ', '!!!???', '<script>alert(1)</script>', '😀😀😀 emoji only', 'a'.repeat(3000), 'Ünïcödé café naïve résumé', '12345'];

// ---------------- text helpers ----------------
test('titleCase keeps small words lower and acronyms intact', () => {
  assert.equal(titleCase('the art of war and NASA'), 'The Art of War and NASA');
  assert.equal(titleCase('HELLO WORLD'), 'Hello World');
  assert.equal(titleCase('a tale: of two cities'), 'A Tale: Of Two Cities');
});
test('sentenceCase', () => {
  assert.equal(sentenceCase('HELLO THERE. how are you? i am fine'), 'Hello there. How are you? I am fine');
  assert.equal(sentenceCase('we met at NASA today. great'), 'We met at NASA today. Great');
});
test('hashtag', () => {
  assert.equal(hashtag('handmade soy candles'), '#HandmadeSoyCandles');
  assert.equal(hashtag('café'), '#Cafe');
  assert.equal(hashtag('!!!'), '');
  assert.equal(hashtag('123'), '');
});
test('article', () => {
  assert.equal(article('apple'), 'an');
  assert.equal(article('user guide'), 'a');
  assert.equal(article('hour'), 'an');
  assert.equal(article('SEO tool'), 'an');
  assert.equal(article('candle'), 'a');
});
test('splitList / joinList', () => {
  assert.deepEqual(splitList('a, b; c\n- d\n a'), ['a', 'b', 'c', 'd']);
  assert.equal(joinList(['x', 'y', 'z']), 'x, y, and z');
  assert.equal(joinList(['x', 'y']), 'x and y');
});

// ---------------- resume ----------------
test('resume: empty and too-short input give errors', () => {
  assert.ok(generateResumeBullets({ description: '' }).error);
  assert.ok(generateResumeBullets({ description: '   ' }).error);
  assert.ok(generateResumeBullets({ description: 'abc' }).error);
});
test('resume: weak opening is rewritten with an action verb', () => {
  const { bullets } = generateResumeBullets({ description: 'I was responsible for answering customer emails', tone: 'professional' });
  assert.equal(bullets.length, 3);
  assert.match(bullets[0], /^Answered customer emails/);
  bullets.forEach((b) => assert.doesNotMatch(b, /responsible for|\bI\b/i));
});
test('resume: three distinct bullets for every tone and tense', () => {
  const inputs = ['managing the store inventory', 'helped customers find products', 'customer service and cash handling', 'set up the CRM', 'was the point of contact for vendors'];
  for (const description of inputs) for (const tone of ['professional', 'concise', 'achievement']) for (const tense of ['past', 'present']) {
    const { bullets, error } = generateResumeBullets({ description, tone, tense, skills: 'Excel', industry: 'retail', jobTitle: 'Assistant' });
    assert.ok(!error, error);
    assert.equal(bullets.length, 3);
    assert.equal(new Set(bullets.map((b) => b.toLowerCase())).size, 3, `duplicates for ${description}/${tone}/${tense}: ${bullets.join(' | ')}`);
    bullets.forEach((b) => assert.match(b, /^[A-Z[]/, `should start with a capital: ${b}`));
    bullets.forEach((b) => assert.doesNotMatch(b, /\s{2,}|\.\.|,,| ,/, `formatting problem: ${b}`));
  }
});
test('resume: never invents numbers', () => {
  for (const tone of ['professional', 'concise', 'achievement']) {
    const input = { description: 'trained 5 new staff members on the till', tone, skills: 'Square POS' };
    const out = generateResumeBullets(input);
    assertNoInventedNumbers(JSON.stringify(input), out.bullets.join(' '));
  }
});
test('resume: present tense converts verbs', () => {
  const { bullets } = generateResumeBullets({ description: 'Analyzed sales data', tense: 'present', tone: 'concise' });
  assert.match(bullets[0], /^Analyze /);
});
test('resume: skills already in the description are not repeated', () => {
  const { bullets } = generateResumeBullets({ description: 'Analyzed sales data with SQL', skills: 'SQL', tone: 'professional' });
  bullets.forEach((b) => assert.equal((b.match(/SQL/g) || []).length, 1, b));
});
test('resume: unusual inputs do not crash', () => {
  for (const description of UNUSUAL) {
    const out = generateResumeBullets({ description, tone: 'achievement' });
    assert.ok(out.error || out.bullets.length === 3);
  }
});

// ---------------- email ----------------
test('email: missing purpose is an error', () => {
  assert.ok(generateEmail({ purpose: '' }).error);
});
test('email: every purpose × tone × length × recipient produces subject and body', () => {
  for (const purpose of Object.keys(PURPOSES)) for (const tone of EMAIL_TONES) for (const length of LENGTHS) for (const recipientType of Object.keys(RECIPIENTS)) {
    const out = generateEmail({ purpose, tone, length, recipientType, topic: 'Project Atlas', points: 'First point\nSecond point' });
    assert.ok(out.subject && out.body, `${purpose}/${tone}/${length}`);
    assert.doesNotMatch(out.subject + out.body, /\{topic\}|\{name\}|undefined|null/, `${purpose}/${tone}/${length}`);
    assert.match(out.body, /First point\./);
  }
});
test('email: placeholders when details are missing', () => {
  const out = generateEmail({ purpose: 'interview-follow-up', tone: 'formal', length: 'short', recipientType: 'hiring-manager' });
  assert.match(out.body, /\[position\]/);
  assert.match(out.body, /^Dear Hiring Manager,/);
  assert.match(out.body, /\[Your name\]$/);
});
test('email: friendly uses contractions, formal does not', () => {
  const f = generateEmail({ purpose: 'request-info', tone: 'friendly', length: 'medium', topic: 'pricing' });
  const formal = generateEmail({ purpose: 'request-info', tone: 'formal', length: 'medium', topic: 'pricing' });
  assert.match(f.body, /I'm|you're|I'd/);
  assert.doesNotMatch(formal.body, /\b(I'm|I'd|don't|can't)\b/);
});
test('email: variants differ', () => {
  const a = generateEmail({ purpose: 'meeting-request', tone: 'polite', length: 'medium', topic: 'Q3 plan' }, 0);
  const b = generateEmail({ purpose: 'meeting-request', tone: 'polite', length: 'medium', topic: 'Q3 plan' }, 1);
  assert.notEqual(a.body, b.body);
});

// ---------------- captions ----------------
test('captions: empty topic is an error', () => {
  assert.ok(generateCaptions({ topic: '  ' }).error);
});
test('captions: 3 distinct captions for each platform and tone', () => {
  for (const platform of Object.keys(PLATFORMS)) for (const tone of CAPTION_TONES) {
    const out = generateCaptions({ topic: 'our spring sale', platform, tone, keywords: 'discounts, new arrivals', cta: 'Shop now', hashtags: 'more' });
    assert.equal(out.captions.length, 3);
    assert.equal(new Set(out.captions.map((c) => c.text)).size, 3);
    out.captions.forEach((c) => assert.ok(c.count <= c.limit));
    assert.ok(out.hashtags.length <= PLATFORMS[platform].maxTags);
    if (platform === 'linkedin') out.captions.forEach((c) => assert.doesNotMatch(c.text, /\p{Extended_Pictographic}/u));
  }
});
test('captions: hashtags only come from the user\'s words', () => {
  const out = generateCaptions({ topic: 'vintage denim jackets', keywords: 'upcycled fashion', hashtags: 'more', platform: 'instagram' });
  const allowed = 'vintagedenimjacketsupcycledfashion';
  out.hashtags.forEach((t) => {
    for (const part of t.slice(1).toLowerCase().match(/[a-z]+/g)) assert.ok(allowed.includes(part), t);
  });
});
test('captions: "none" hashtags and multi-line hooks are kept', () => {
  const out = generateCaptions({ topic: 'Monday', tone: 'funny', hashtags: 'none', platform: 'instagram' });
  assert.equal(out.hashtags.length, 0);
  out.captions.forEach((c) => assert.doesNotMatch(c.text, /#/));
  assert.ok(out.captions.some((c) => c.text.includes('\n')));
});
test('captions: unusual inputs do not crash', () => {
  for (const topic of UNUSUAL) {
    const out = generateCaptions({ topic, keywords: topic });
    assert.ok(out.error || out.captions.length === 3);
  }
});

// ---------------- word counter ----------------
test('stats: empty text', () => {
  const s = stats('');
  assert.equal(s.words, 0);
  assert.equal(s.characters, 0);
  assert.equal(s.sentences, 0);
  assert.equal(s.paragraphs, 0);
  assert.equal(s.readingTime, '0 sec');
});
test('stats: counts', () => {
  const s = stats("Hello world. It's a test!\n\nSecond paragraph, with e.g. an example? Yes.");
  assert.equal(s.words, 12);
  assert.equal(s.sentences, 4);
  assert.equal(s.paragraphs, 2);
  assert.equal(stats('a b').characters, 3);
  assert.equal(stats('a b').charactersNoSpaces, 2);
  assert.equal(stats('👍🏽').characters, 1);
});
test('stats: reading time for 476 words is 2 min', () => {
  assert.equal(stats('word '.repeat(476)).readingTime, '2 min');
});
test('transforms', () => {
  assert.equal(transforms.removeExtraSpaces('  a   b , c\t\td  \n  e  '), 'a b, c d\ne');
  assert.equal(transforms.normalizeLineBreaks('a\r\n\r\n\r\n\r\nb  \r\nc'), 'a\n\nb\nc');
  assert.equal(transforms.joinBrokenLines('This is a\nbroken line with hyph-\nenation.\n\nNew para'), 'This is a broken line with hyphenation.\n\nNew para');
  assert.equal(transforms.upper('abc'), 'ABC');
  assert.equal(transforms.lower('ABC'), 'abc');
});

// ---------------- length limits ----------------
test('limits: presets are complete and unique', () => {
  const ids = new Set();
  for (const p of LIMIT_PRESETS) {
    assert.ok(!ids.has(p.id), `duplicate ${p.id}`);
    ids.add(p.id);
    assert.ok(['characters', 'words'].includes(p.unit), p.id);
    assert.ok(Number.isInteger(p.max) && p.max > 0, p.id);
    assert.ok(['limit', 'recommended'].includes(p.kind), p.id);
    if (p.kind === 'limit') assert.match(p.source || '', /^https:\/\//, `${p.id} needs a source`);
  }
  assert.equal(findPreset('x-post').max, 280);
  assert.equal(findPreset('nope'), null);
});
test('limits: status thresholds', () => {
  const t = { unit: 'characters', max: 100 };
  assert.equal(checkLimit({ words: 0, characters: 0 }, t).status, 'ok');
  assert.equal(checkLimit({ words: 0, characters: 89 }, t).status, 'ok');
  assert.equal(checkLimit({ words: 0, characters: 90 }, t).status, 'near');
  assert.equal(checkLimit({ words: 0, characters: 100 }, t).status, 'near');
  const over = checkLimit({ words: 0, characters: 130 }, t);
  assert.equal(over.status, 'over');
  assert.equal(over.remaining, -30);
  assert.equal(over.percent, 100);
});
test('limits: words unit and invalid targets', () => {
  assert.equal(checkLimit({ words: 600, characters: 4000 }, { unit: 'words', max: 650 }).remaining, 50);
  assert.equal(checkLimit({ words: 1, characters: 1 }, { unit: 'words', max: 0 }), null);
  assert.equal(checkLimit({ words: 1, characters: 1 }, { unit: 'words', max: NaN }), null);
  assert.equal(checkLimit({ words: 1, characters: 1 }, null), null);
});
test('limits: descriptions', () => {
  const t = { unit: 'characters', max: 10 };
  assert.equal(describeLimit(checkLimit({ words: 0, characters: 9 }, t), 'characters'), '1 character left');
  assert.equal(describeLimit(checkLimit({ words: 0, characters: 10 }, t), 'characters'), 'Exactly at the limit');
  assert.equal(describeLimit(checkLimit({ words: 0, characters: 12 }, t), 'characters'), '2 characters over the limit');
  assert.equal(describeLimit(checkLimit({ words: 0, characters: 12 }, t), 'characters', 'recommended'), '2 characters over the recommended length');
});

// ---------------- product ----------------
test('product: required fields', () => {
  const out = generateProductDescription({});
  assert.ok(out.error);
  assert.deepEqual(Object.keys(out.fieldErrors).sort(), ['category', 'features', 'name']);
});
test('product: every tone and length produces all parts and uses only given facts', () => {
  for (const tone of PRODUCT_TONES) for (const length of ['short', 'medium', 'long']) {
    const input = { name: 'Trail Mug', category: 'enamel camping mug', features: 'Holds 350 ml\nEnamel-coated steel\nDishwasher safe', audience: 'campers', keywords: 'camping mug, outdoor cup, gift for hikers', tone, length };
    const out = generateProductDescription(input);
    assert.ok(!out.error);
    assert.ok(out.titles.length >= 2 && out.short && out.long && out.ctas.length === 3);
    assert.deepEqual(out.bullets, ['Holds 350 ml', 'Enamel-coated steel', 'Dishwasher safe']);
    assertNoInventedNumbers(JSON.stringify(input), out.short + out.long + out.titles.join(' ') + out.ctas.join(' '));
    assert.doesNotMatch(out.long, /\b(organic|certified|best|guarantee|cure)\b/i);
    assert.doesNotMatch(out.long, /\{|\}|undefined/);
  }
});
test('product: risky claims are flagged', () => {
  const out = generateProductDescription({ name: 'X', category: 'tea', features: '100% organic\nCures headaches' });
  assert.ok(out.notes.some((n) => /claims/.test(n)));
});

// ---------------- privacy: no network calls in client code ----------------
test('client JavaScript makes no network requests', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'js');
  const files = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      e.isDirectory() ? walk(p) : files.push(p);
    }
  })(root);
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/, `${path.basename(f)} contains a network call`);
  }
});

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
