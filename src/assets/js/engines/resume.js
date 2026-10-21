// Resume bullet generator — transparent, rule-based (no AI, no network).
// It only rephrases what the user wrote. It never adds numbers, results, employers or qualifications;
// where a result would help, it inserts a [bracketed placeholder] for the user to fill with verified facts.
import { clean, stripEndPunct, capFirst, lowerFirst, splitList, joinList, withArticle, rotate } from './text.js';
import { lookupVerb, SYNONYMS, PREP_VERBS } from './verbs.js';

export const TONES = ['professional', 'concise', 'achievement'];

const FILLERS = [
  [/\b(?:basically|really|very|actually|just|successfully|various|different)\s+/gi, ''],
  [/\b(?:a lot of|lots of)\b/gi, 'many'],
  [/\bin order to\b/gi, 'to'],
  [/\bon a (daily|weekly|monthly|regular) basis\b/gi, (m, p) => (p.toLowerCase() === 'regular' ? 'regularly' : p.toLowerCase())],
  [/\b(?:i|we) was able to\s+|\bwas able to\s+/gi, ''],
  [/\bmy\b/gi, 'the'],
  [/\bour\b/gi, 'the'],
  [/\betc\.?$/i, ''],
  [/\s+/g, ' ']
];

// Weak or wordy openings rewritten before verb detection.
const REWRITES = [
  [/^(?:i\s+)?(?:made|make|making)\s+sure\s+(?:that\s+)?/i, 'ensured '],
  [/^(?:i\s+)?(?:took|take|taking)\s+care\s+of\s+/i, 'handled '],
  [/^(?:i\s+)?(?:dealt|deal|dealing)\s+with\s+/i, 'handled '],
  [/^(?:i\s+)?(?:came|come|coming)\s+up\s+with\s+/i, 'developed '],
  [/^(?:i\s+)?(?:kept|keep|keeping)\s+track\s+of\s+/i, 'tracked '],
  [/^(?:i\s+)?(?:looked|look|looking)\s+after\s+/i, 'cared for '],
  [/^(?:i\s+)?(?:was|am|were)\s+(?:a\s+)?part\s+of\s+/i, 'contributed to ']
];

const PARTICLE = /^(up|out|off|back)\b\s*/i;

const FALLBACK = {
  past: ['Handled', 'Worked on', 'Was responsible for'],
  present: ['Handle', 'Work on', 'Responsible for']
};

/** Convert a past-tense verb phrase ("Responded to") to present ("Respond to"). Returns null if unsure. */
function toPresent(phrase) {
  const [first, ...rest] = phrase.split(' ');
  const v = lookupVerb(first);
  if (!v || !v.base) return null;
  return [capFirst(v.base), ...rest].join(' ');
}

/** "Responded to" -> "responding to". Returns null if unsure. */
function toIng(phrase) {
  const [first, ...rest] = phrase.split(' ');
  const v = lookupVerb(first);
  if (!v || !v.ing) return null;
  return [v.ing, ...rest].join(' ');
}

/** "Responded to" -> "respond to" (for "Used Excel to respond to ..."). */
function toBase(phrase) {
  const p = toPresent(phrase);
  return p ? lowerFirst(p) : null;
}

/**
 * Parse the user's description into { verbs: [past-tense phrases], object, notes }.
 */
export function parseDescription(text) {
  const notes = [];
  let raw = clean(text);
  const parts = raw.split(/[.!?]+\s+(?=[A-Z])|\s*\n+\s*/).map((s) => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    notes.push('We used your first sentence. For best results, describe one task or responsibility at a time.');
    raw = parts[0];
  }
  let p = stripEndPunct(raw);
  for (const [re, rep] of FILLERS) p = p.replace(re, rep);
  p = p.trim();
  for (const [re, rep] of REWRITES) p = p.replace(re, rep);

  let mode = 'plain';
  const lower = p.toLowerCase();
  let m;
  if ((m = lower.match(/^(?:i\s+)?(?:was|am|were)\s+(?:responsible|in charge)\s+(?:for|of)\s+|^(?:i\s+)?(?:was\s+)?tasked\s+with\s+|^responsible\s+for\s+|^in\s+charge\s+of\s+|^(?:my\s+|the\s+)?(?:main\s+)?(?:responsibilities|duties|tasks)\s+(?:included|include|were|was)\s*:?\s*/))) {
    mode = 'responsible';
  } else if ((m = lower.match(/^(?:my|the)\s+(?:job|role|task|work)\s+(?:was|is)\s+to\s+|^(?:i\s+)?had\s+to\s+|^i\s+/))) {
    mode = 'plain';
  } else if ((m = lower.match(/^(?:i\s+)?(?:helped|help|helping)\s+(?:to\s+)?/))) {
    mode = 'helped';
  } else if ((m = lower.match(/^(?:i\s+)?(?:worked|work|working)\s+on\s+/))) {
    mode = 'workedOn';
  } else if ((m = lower.match(/^(?:i\s+)?(?:was|am|have been|served as|worked as|acted as)\s+(?=(?:a|an|the)\s)/))) {
    mode = 'role';
  } else if ((m = lower.match(/^we\s+/))) {
    mode = 'plain';
    notes.push('Your description says “we”. Resume bullets describe your own contribution, so make sure the wording reflects what you personally did.');
  }
  if (m) p = p.slice(m[0].length);
  // A remaining leading "I " (e.g. "My job was to ... " already removed) is dropped too.
  p = p.replace(/^i\s+/i, '');

  const words = p.split(' ');
  const firstVerb = lookupVerb(words[0]);
  let verbs;
  let object;

  if (mode === 'role') {
    return { verbs: ['Served as', 'Worked as', 'Acted as'], object: lowerFirst(p), notes, verbFound: true };
  }
  if (mode === 'workedOn') {
    return { verbs: ['Contributed to', 'Worked on', 'Supported'], object: lowerFirst(p), notes, verbFound: true };
  }
  if (mode === 'helped') {
    if (firstVerb && firstVerb.base) {
      const rest = words.slice(1).join(' ');
      return {
        verbs: [`Helped ${firstVerb.base}`, `Assisted with ${firstVerb.ing}`, `Contributed to ${firstVerb.ing}`],
        object: lowerFirst(rest),
        notes,
        verbFound: true
      };
    }
    // "helped customers find products": other verbs would break the grammar, so keep "Helped".
    return { verbs: ['Helped'], object: lowerFirst(p), notes, verbFound: true };
  }

  if (firstVerb) {
    object = words.slice(1).join(' ');
    let verbPast = capFirst(firstVerb.past);
    const particle = object.match(PARTICLE);
    if (particle) {
      // Phrasal verbs ("set up", "followed up") keep their exact meaning: no synonyms.
      verbs = [`${verbPast} ${particle[1].toLowerCase()}`];
      object = object.slice(particle[0].length);
    } else if (firstVerb.base && SYNONYMS[firstVerb.base]) {
      const prep = PREP_VERBS[firstVerb.base];
      if (prep && object.toLowerCase().startsWith(prep + ' ')) object = object.slice(prep.length + 1);
      verbs = SYNONYMS[firstVerb.base].slice();
    } else {
      verbs = [verbPast];
    }
    return { verbs, object: lowerFirst(object), notes, verbFound: true };
  }

  if (mode === 'responsible') {
    return { verbs: SYNONYMS.manage.slice(), object: lowerFirst(p), notes, verbFound: true };
  }

  notes.push('Tip: start your description with an action word (for example “Organized…” or “Answered…”) for stronger bullets.');
  return { verbs: FALLBACK.past.slice(), object: lowerFirst(p), notes, verbFound: false };
}

function finish(s) {
  s = clean(s).replace(/\s+([,.])/g, '$1').replace(/,\s*,/g, ',').replace(/\.\.+$/, '.');
  s = capFirst(s);
  return /[.!?\]]$/.test(s) ? (s.endsWith(']') ? s + '.' : s) : s + '.';
}

/**
 * @param {object} input { jobTitle, description, skills, tone, industry, tense }
 * @param {number} variant  rotates verb choices for "Show other wording"
 * @returns {{ bullets: string[], notes: string[], error?: string }}
 */
export function generateResumeBullets(input, variant = 0) {
  const description = clean(input.description);
  if (!description) return { bullets: [], notes: [], error: 'Describe a task or responsibility first.' };
  if (description.length < 8) return { bullets: [], notes: [], error: 'Add a little more detail (at least a few words).' };

  const tone = TONES.includes(input.tone) ? input.tone : 'professional';
  const tense = input.tense === 'present' ? 'present' : 'past';
  const industry = lowerFirst(stripEndPunct(input.industry || ''));
  const jobTitle = stripEndPunct(input.jobTitle || '');

  const parsed = parseDescription(description);
  // Skip skills the description already mentions ("Analyzed data with SQL" + skill "SQL").
  const objLower = ' ' + parsed.object.toLowerCase().replace(/[^\p{L}\p{N}+#.]+/gu, ' ') + ' ';
  const skills = splitList(input.skills).filter((s) => !objLower.includes(' ' + s.toLowerCase() + ' ')).slice(0, 3);
  const used = tense === 'present' ? 'Use' : 'Used';
  const achieved = tense === 'present' ? 'Achieve' : 'Achieved';
  const notes = parsed.notes.slice();
  let verbs = rotate(parsed.verbs, variant);
  if (tense === 'present') {
    const present = verbs.map(toPresent);
    if (present.every(Boolean)) verbs = present;
    else if (!parsed.verbFound) verbs = rotate(FALLBACK.present, variant);
    else notes.push('We kept the past tense because we could not safely convert this verb. Edit it if this is your current role.');
  }
  while (verbs.length < 3) verbs.push(verbs[0]);
  const obj = parsed.object;
  const core = (i, o = obj) => `${verbs[i]} ${o}`.trim();
  const skillText = joinList(skills);

  let bullets;
  if (tone === 'concise') {
    const short = obj.replace(/^(?:all of the|all the|the)\s+/i, '');
    bullets = [
      finish(core(0, short)),
      finish(core(1, short) + (skills[0] ? ` using ${skills[0]}` : '')),
      finish(core(2, short))
    ];
  } else if (tone === 'achievement') {
    const ing = toIng(verbs[2]);
    bullets = [
      finish(`${core(0)}, resulting in [add a verified result, e.g. time saved or % improvement]`),
      finish(skills.length
        ? `${core(1)} using ${skillText}, which [describe the measurable outcome you can verify]`
        : `${core(1)}, contributing to [add a measurable outcome you can verify]`),
      finish(ing
        ? `${achieved} [add a verified result] by ${ing} ${obj}`
        : `${core(2)} [add scope, e.g. how many people, projects, or customers]`)
    ];
  } else {
    const base = toBase(verbs[2]);
    let third;
    if (skills.length && base) third = `${used} ${skillText} to ${base} ${obj}`;
    else if (skills.length) third = `${core(2)}, applying ${skillText}`;
    else if (jobTitle && !industry) third = `${core(2)} as part of the ${jobTitle} role`;
    else third = core(2);
    bullets = [
      finish(core(0) + (skills.length ? `, using ${skillText}` : '')),
      finish(core(1) + (industry ? ` in ${withArticle(industry)} setting` : '')),
      finish(third)
    ];
  }

  // Never show the same bullet twice.
  const fillers = [
    ' [add scope, e.g. how often or how many]',
    ' for [add who benefited, e.g. a team of X or Y customers]'
  ];
  const seen = new Set();
  let f = 0;
  bullets = bullets.map((b) => {
    let out = b;
    while (seen.has(out.toLowerCase()) && f < fillers.length) out = finish(b.replace(/\.$/, '') + fillers[f++]);
    seen.add(out.toLowerCase());
    return out;
  });

  if (/\[/.test(bullets.join(' '))) {
    notes.push('Replace the text in [brackets] with facts you can verify, or delete it.');
  }
  return { bullets, notes };
}
