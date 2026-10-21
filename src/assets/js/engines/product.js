// Product description generator — structured templates (no AI, no network).
// Every claim comes from the seller's own feature list. The tool never adds materials,
// certifications, health benefits, specifications, or performance claims.
import { stripEndPunct, capFirst, lowerFirst, splitLines, splitList, joinList, withArticle, pick, sentence, titleCase } from './text.js';

export const TONES = ['professional', 'friendly', 'premium', 'minimalist'];
export const LENGTHS = ['short', 'medium', 'long'];

const INTRO = {
  professional: [
    '{Name} is {aCategory}{forAudience}.',
    'Introducing {Name}, {aCategory}{forAudience}.'
  ],
  friendly: [
    'Meet {Name}: {aCategory}{forAudience}.',
    'Say hello to {Name}, {aCategory}{forAudience}.'
  ],
  premium: [
    'Introducing {Name}: {aCategory}{forAudience}.',
    'Discover {Name}, {aCategory}{forAudience}.'
  ],
  minimalist: ['{Name}. {Category}{forAudienceShort}.', '{Name} — {category}{forAudienceShort}.']
};

const FEATURE_LEAD = {
  professional: ['Key features include {list}.', 'It offers {list}.'],
  friendly: ["Here's what you get: {list}.", 'You get {list}.'],
  premium: ['Its features include {list}.', 'Details include {list}.'],
  minimalist: ['Features: {list}.', 'Includes {list}.']
};

const AUDIENCE_LINE = {
  professional: 'It is intended for {audience}.',
  friendly: 'Made with {audience} in mind.',
  premium: 'Designed with {audience} in mind.',
  minimalist: 'For {audience}.'
};

const CTAS = {
  professional: ['Order {Name} today.', 'Add {Name} to your cart.', 'View the details and order {Name}.'],
  friendly: ['Grab yours today!', 'Add {Name} to your cart and treat yourself.', 'Ready when you are: order {Name} now.'],
  premium: ['Make {Name} yours today.', 'Order {Name} now.', 'Add {Name} to your collection.'],
  minimalist: ['Shop now.', 'Add to cart.', 'Order {Name}.']
};

/** Turn "free shipping" / "Waterproof" into a clean feature phrase, keeping the seller's words. */
function featurePhrase(f) {
  return lowerFirst(stripEndPunct(f));
}

/**
 * @param {object} input { name, category, features (one per line), audience, tone, keywords, length }
 * @returns {{ titles: string[], short: string, long: string, bullets: string[], ctas: string[], notes: string[], error?: string, fieldErrors?: object }}
 */
export function generateProductDescription(input, variant = 0) {
  const name = stripEndPunct(input.name);
  const category = stripEndPunct(input.category);
  const features = splitLines(input.features).slice(0, 10);
  const fieldErrors = {};
  if (!name) fieldErrors.name = 'Enter the product name.';
  if (!category) fieldErrors.category = 'Enter the product category, for example “scented candle”.';
  if (!features.length) fieldErrors.features = 'Add at least one feature you can verify (one per line).';
  if (Object.keys(fieldErrors).length) return { error: 'Please fill in the required fields.', fieldErrors, titles: [], short: '', long: '', bullets: [], ctas: [], notes: [] };

  const tone = TONES.includes(input.tone) ? input.tone : 'professional';
  const length = LENGTHS.includes(input.length) ? input.length : 'medium';
  const audience = lowerFirst(stripEndPunct(input.audience || ''));
  const keywords = splitList(input.keywords).slice(0, 5);
  const notes = [];

  const catLower = lowerFirst(category);
  const vars = {
    '{Name}': name,
    '{aCategory}': withArticle(catLower),
    '{Category}': capFirst(category),
    '{category}': catLower,
    '{forAudience}': audience ? ` for ${audience}` : '',
    '{forAudienceShort}': audience ? ` for ${audience}` : ''
  };
  const fill = (s, v = vars) => Object.entries(v).reduce((acc, [k, val]) => acc.split(k).join(val), s);

  // ---- titles (marketplace style, under ~80 characters where possible) ----
  const kw = keywords.find((k) => !(name + ' ' + category).toLowerCase().includes(k.toLowerCase()));
  const titleSet = [
    `${name} – ${titleCase(category)}${audience ? ` for ${titleCase(audience)}` : ''}`,
    `${name} ${titleCase(category)}${kw ? ` | ${titleCase(kw)}` : ''}`,
    `${name} | ${titleCase(category)}${features[0] && features[0].length < 30 ? ` with ${titleCase(featurePhrase(features[0]))}` : ''}`
  ];
  const titles = [...new Set(tone === 'minimalist' ? [name, `${name} – ${titleCase(category)}`, titleSet[2]] : titleSet)];

  // ---- bullets: the seller's features, cleaned up, nothing added ----
  const bullets = features.map((f) => capFirst(stripEndPunct(f)));

  // ---- short description ----
  const intro = fill(pick(INTRO[tone], variant));
  const fShort = features.slice(0, 2).map(featurePhrase);
  const featureLead = pick(FEATURE_LEAD[tone], variant);
  const short = [intro, featureLead.replace('{list}', joinList(fShort))].join(' ');

  // ---- detailed description ----
  const paras = [];
  // The detailed version mentions the audience in its own paragraph, so the intro leaves it out.
  const longIntro = audience && length !== 'short' ? fill(pick(INTRO[tone], variant), { ...vars, '{forAudience}': '', '{forAudienceShort}': '' }) : intro;
  paras.push(longIntro + (keywords.length && tone !== 'minimalist' ? ` ${sentence(`If you are looking for ${withArticle(lowerFirst(keywords[0]))}, it is worth a closer look`)}` : ''));
  const allF = features.map(featurePhrase);
  if (length === 'short') {
    paras.push(featureLead.replace('{list}', joinList(allF.slice(0, 3))));
  } else {
    paras.push(featureLead.replace('{list}', joinList(allF)));
    if (audience) paras.push(AUDIENCE_LINE[tone].replace('{audience}', audience));
    if (keywords.length > 1 && tone !== 'minimalist') {
      paras.push(`Whether you are shopping for ${joinList(keywords.slice(1, 3).map((k) => withArticle(lowerFirst(k))), 'or')}, ${name} is ready to order.`);
    }
  }
  if (length === 'long') {
    paras.push('[Add verified details customers often ask about: size or dimensions, materials, care instructions, what is included, and shipping or returns.]');
  }
  paras.push(fill(pick(CTAS[tone], variant)));
  const long = paras.join('\n\n');

  const ctas = CTAS[tone].map(fill);

  if (features.length < 3) notes.push('Listing three or more verified features usually makes a description more useful to shoppers.');
  if (/\b(cure|cures|heal|heals|treat|treats|prevent|prevents|clinically|certified|organic|fda|guarantee[ds]?|100%|best|#1|number one)\b/i.test(features.join(' '))) {
    notes.push('Some features contain claims (for example health, certification, “organic”, or “best”). Only keep them if you can prove them and they are allowed in your market.');
  }
  return { titles, short, long, bullets, ctas, notes };
}
