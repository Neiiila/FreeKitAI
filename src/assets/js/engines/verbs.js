// A compact English verb dictionary for resume wording.
// Only verbs listed here (or words ending in -ed / -ing) are treated as verbs,
// so the generator never guesses wildly.

const IRREGULAR = {
  be: 'was', begin: 'began', bring: 'brought', build: 'built', buy: 'bought', choose: 'chose', cut: 'cut', do: 'did',
  draw: 'drew', drive: 'drove', find: 'found', give: 'gave', go: 'went', grow: 'grew', hold: 'held', keep: 'kept',
  lead: 'led', make: 'made', meet: 'met', oversee: 'oversaw', put: 'put', read: 'read', run: 'ran', see: 'saw',
  sell: 'sold', send: 'sent', set: 'set', speak: 'spoke', spend: 'spent', take: 'took', teach: 'taught', think: 'thought',
  win: 'won', write: 'wrote', rewrite: 'rewrote', undertake: 'undertook', upsell: 'upsold', feed: 'fed',
  pay: 'paid', lay: 'laid', troubleshoot: 'troubleshot', proofread: 'proofread', input: 'input', forecast: 'forecast', broadcast: 'broadcast', shoot: 'shot', understand: 'understood', deal: 'dealt', sit: 'sat', stand: 'stood', tell: 'told', get: 'got'
};

// Verbs whose final consonant doubles: plan -> planned / planning
const DOUBLING = new Set(['plan', 'ship', 'log', 'chat', 'map', 'scan', 'shop', 'stop', 'tag', 'drop', 'trim', 'commit', 'control', 'submit', 'admit', 'transfer', 'refer', 'equip', 'jog', 'mop', 'prep', 'step', 'pin', 'blog', 'vet', 'program', 'format', 'patrol', 'regret', 'rebut', 'propel', 'compel', 'excel', 'occur', 'prefer', 'outfit', 'zip', 'clip', 'skim', 'slim', 'wrap', 'strip', 'scrap', 'swap', 'grab', 'stir', 'span', 'spot', 'sum', 'debug', 'run', 'win', 'set', 'cut', 'put', 'begin', 'get', 'sit', 'upset']);

const BASE_VERBS = `
accelerate accept access accommodate accomplish achieve acquire act adapt add address adjust administer advertise advise advocate
allocate analyze analyse answer anticipate apply appraise approve arrange assemble assess assign assist attend audit author automate
balance book boost brainstorm brand brief budget build calculate call campaign catalog catalogue champion change chair check clarify
classify clean close coach code collaborate collect communicate compile complete compose compute conceive conceptualize conduct configure
consolidate construct consult contact contribute convert cook coordinate correspond counsel count create cultivate curate customize
cut debug decrease define delegate deliver demonstrate deploy design detect determine develop devise diagnose digitize direct discover
dispatch distribute document draft drive edit educate eliminate email employ empower enable encourage engage engineer enhance enroll enter
establish estimate evaluate examine execute expand expedite explain explore facilitate file film finalize fix follow forecast formalize
format formulate found foster fulfill fulfil gather generate greet grow guide handle help hire host identify illustrate implement improve
increase influence inform initiate input inspect install instruct integrate interpret interview introduce invent inventory investigate invoice
judge label launch lead lecture liaise listen load locate log lower maintain manage map market measure mediate mentor merge migrate
minimize mix model moderate modernize monitor motivate negotiate network notify observe obtain onboard open operate optimize order
organize organise orient outline outsource overhaul oversee pack participate partner perform persuade photograph pilot pioneer plan
post prepare present preserve prioritize process procure produce program project promote proofread propose protect prototype provide
publish purchase qualify quantify raise rank reach recommend reconcile record recruit redesign reduce refine register rehabilitate
reinforce remodel render renew reorganize repair replace report represent research reshape resolve respond restock restore restructure
retain retrieve review revise revitalize revamp route run save scale schedule screen script secure select sell serve service set shape
share ship shop simplify sketch solve sort source speak specify sponsor standardize steer stock store strategize streamline strengthen
structure study supervise supply support survey sustain systematize tailor teach test track train transcribe transform translate
troubleshoot tutor type unify ensure care roll reach capture publicize convey agree replenish categorize earn archive adhere tune move release receive confirm finish carry reply spot transfer update upgrade upsell use utilize validate verify volunteer welcome win work write
`.trim().split(/\s+/);

// Regular past tense
function regularPast(base) {
  if (DOUBLING.has(base)) return base + base.slice(-1) + 'ed';
  if (/e$/.test(base)) return base + 'd';
  if (/[^aeiou]y$/.test(base)) return base.slice(0, -1) + 'ied';
  return base + 'ed';
}

function regularIng(base) {
  if (DOUBLING.has(base)) return base + base.slice(-1) + 'ing';
  if (/ie$/.test(base)) return base.slice(0, -2) + 'ying';
  if (/[^e]e$/.test(base) && base !== 'be') return base.slice(0, -1) + 'ing';
  return base + 'ing';
}

const FORMS = new Map(); // any form -> { base, past, ing }
const BASES = new Map(); // base -> { base, past, ing }

function register(base, matchBase = true) {
  const entry = { base, past: IRREGULAR[base] || regularPast(base), ing: regularIng(base) };
  BASES.set(base, entry);
  for (const f of matchBase ? [entry.base, entry.past, entry.ing] : [entry.past, entry.ing]) if (!FORMS.has(f)) FORMS.set(f, entry);
  if (!matchBase) return;
  // third person: "manages", "teaches", "copies"
  const third = /(s|x|z|ch|sh)$/.test(base) ? base + 'es' : /[^aeiou]y$/.test(base) ? base.slice(0, -1) + 'ies' : base + 's';
  if (!FORMS.has(third)) FORMS.set(third, entry);
}
BASE_VERBS.forEach((b) => register(b));
Object.keys(IRREGULAR).forEach((b) => { if (!BASES.has(b)) register(b); });
// Usually nouns at the start of a description ("head of...", "package design"), so they only
// count as verbs in their -ed / -ing forms. They are needed to convert synonyms like "Headed".
['head', 'package', 'phone', 'bill', 'match', 'mark', 'tag'].forEach((b) => register(b, false));

/**
 * Look up a word. Returns { base, past, ing, known } or null if it doesn't look like a verb.
 * Unknown -ed / -ing words are accepted heuristically (e.g. "upskilling" -> "upskilled").
 */
export function lookupVerb(word) {
  const w = String(word || '').toLowerCase().replace(/[^a-z-]/g, '');
  if (!w) return null;
  if (FORMS.has(w)) return { ...FORMS.get(w), known: true };
  if (w.length > 5 && w.endsWith('ing')) {
    const stem = w.slice(0, -3);
    const past = /[aeiou]y$/.test(stem) ? stem + 'ed' : /y$/.test(stem) ? stem.slice(0, -1) + 'ied' : stem + 'ed';
    return { base: null, past, ing: w, known: false };
  }
  if (w.length > 4 && w.endsWith('ed') && !/(need|seed|feed|bed|red|shed)$/.test(w)) {
    return { base: null, past: w, ing: null, known: false };
  }
  return null;
}

export function baseForm(base) {
  return BASES.get(base) || null;
}

// Close synonyms (same meaning, no added seniority or scope). Keys are base forms; values are past-tense alternatives.
export const SYNONYMS = {
  manage: ['Managed', 'Oversaw', 'Ran'],
  oversee: ['Oversaw', 'Managed', 'Supervised'],
  supervise: ['Supervised', 'Oversaw', 'Managed'],
  create: ['Created', 'Developed', 'Produced'],
  develop: ['Developed', 'Built', 'Created'],
  build: ['Built', 'Developed', 'Created'],
  design: ['Designed', 'Created', 'Developed'],
  produce: ['Produced', 'Created', 'Delivered'],
  write: ['Wrote', 'Drafted', 'Authored'],
  draft: ['Drafted', 'Wrote', 'Prepared'],
  prepare: ['Prepared', 'Compiled', 'Put together'],
  compile: ['Compiled', 'Prepared', 'Assembled'],
  analyze: ['Analyzed', 'Evaluated', 'Assessed'],
  analyse: ['Analysed', 'Evaluated', 'Assessed'],
  review: ['Reviewed', 'Evaluated', 'Assessed'],
  assess: ['Assessed', 'Evaluated', 'Reviewed'],
  evaluate: ['Evaluated', 'Assessed', 'Reviewed'],
  organize: ['Organized', 'Coordinated', 'Arranged'],
  organise: ['Organised', 'Coordinated', 'Arranged'],
  coordinate: ['Coordinated', 'Organized', 'Managed'],
  arrange: ['Arranged', 'Organized', 'Coordinated'],
  plan: ['Planned', 'Organized', 'Coordinated'],
  schedule: ['Scheduled', 'Coordinated', 'Organized'],
  lead: ['Led', 'Directed', 'Headed'],
  direct: ['Directed', 'Led', 'Managed'],
  train: ['Trained', 'Coached', 'Instructed'],
  teach: ['Taught', 'Instructed', 'Educated'],
  coach: ['Coached', 'Mentored', 'Trained'],
  mentor: ['Mentored', 'Coached', 'Guided'],
  tutor: ['Tutored', 'Taught', 'Coached'],
  support: ['Supported', 'Assisted', 'Helped'],
  assist: ['Assisted', 'Supported', 'Helped'],
  help: ['Helped', 'Assisted', 'Supported'],
  handle: ['Handled', 'Managed', 'Processed'],
  process: ['Processed', 'Handled', 'Completed'],
  answer: ['Answered', 'Responded to', 'Handled'],
  respond: ['Responded to', 'Answered', 'Replied to'],
  resolve: ['Resolved', 'Addressed', 'Fixed'],
  fix: ['Fixed', 'Resolved', 'Repaired'],
  repair: ['Repaired', 'Fixed', 'Restored'],
  troubleshoot: ['Troubleshot', 'Diagnosed', 'Resolved'],
  improve: ['Improved', 'Enhanced', 'Strengthened'],
  enhance: ['Enhanced', 'Improved', 'Strengthened'],
  streamline: ['Streamlined', 'Simplified', 'Improved'],
  simplify: ['Simplified', 'Streamlined', 'Clarified'],
  increase: ['Increased', 'Grew', 'Raised'],
  grow: ['Grew', 'Expanded', 'Increased'],
  reduce: ['Reduced', 'Lowered', 'Cut'],
  launch: ['Launched', 'Introduced', 'Rolled out'],
  implement: ['Implemented', 'Introduced', 'Put in place'],
  introduce: ['Introduced', 'Implemented', 'Launched'],
  maintain: ['Maintained', 'Kept up', 'Managed'],
  update: ['Updated', 'Maintained', 'Revised'],
  monitor: ['Monitored', 'Tracked', 'Reviewed'],
  track: ['Tracked', 'Monitored', 'Recorded'],
  report: ['Reported', 'Documented', 'Communicated'],
  document: ['Documented', 'Recorded', 'Wrote up'],
  record: ['Recorded', 'Documented', 'Logged'],
  communicate: ['Communicated', 'Conveyed', 'Shared'],
  present: ['Presented', 'Delivered', 'Shared'],
  negotiate: ['Negotiated', 'Agreed', 'Secured'],
  sell: ['Sold', 'Marketed', 'Promoted'],
  promote: ['Promoted', 'Marketed', 'Publicized'],
  market: ['Marketed', 'Promoted', 'Advertised'],
  research: ['Researched', 'Investigated', 'Studied'],
  investigate: ['Investigated', 'Researched', 'Examined'],
  test: ['Tested', 'Validated', 'Checked'],
  check: ['Checked', 'Verified', 'Reviewed'],
  verify: ['Verified', 'Checked', 'Confirmed'],
  inspect: ['Inspected', 'Examined', 'Checked'],
  serve: ['Served', 'Assisted', 'Helped'],
  greet: ['Greeted', 'Welcomed', 'Received'],
  welcome: ['Welcomed', 'Greeted', 'Received'],
  recruit: ['Recruited', 'Hired', 'Sourced'],
  hire: ['Hired', 'Recruited', 'Brought on'],
  onboard: ['Onboarded', 'Trained', 'Introduced'],
  collaborate: ['Collaborated with', 'Worked with', 'Partnered with'],
  partner: ['Partnered with', 'Collaborated with', 'Worked with'],
  deliver: ['Delivered', 'Completed', 'Carried out'],
  complete: ['Completed', 'Finished', 'Delivered'],
  conduct: ['Conducted', 'Carried out', 'Ran'],
  perform: ['Performed', 'Carried out', 'Completed'],
  execute: ['Executed', 'Carried out', 'Delivered'],
  run: ['Ran', 'Managed', 'Conducted'],
  operate: ['Operated', 'Ran', 'Managed'],
  use: ['Used', 'Applied', 'Worked with'],
  utilize: ['Used', 'Applied', 'Worked with'],
  apply: ['Applied', 'Used', 'Put into practice'],
  edit: ['Edited', 'Revised', 'Refined'],
  revise: ['Revised', 'Edited', 'Updated'],
  proofread: ['Proofread', 'Edited', 'Checked'],
  translate: ['Translated', 'Interpreted', 'Converted'],
  stock: ['Stocked', 'Restocked', 'Replenished'],
  restock: ['Restocked', 'Replenished', 'Stocked'],
  pack: ['Packed', 'Prepared', 'Packaged'],
  ship: ['Shipped', 'Dispatched', 'Sent'],
  sort: ['Sorted', 'Organized', 'Categorized'],
  clean: ['Cleaned', 'Maintained', 'Kept'],
  cook: ['Cooked', 'Prepared', 'Made'],
  install: ['Installed', 'Set up', 'Configured'],
  configure: ['Configured', 'Set up', 'Customized'],
  deploy: ['Deployed', 'Released', 'Rolled out'],
  automate: ['Automated', 'Streamlined', 'Scripted'],
  migrate: ['Migrated', 'Moved', 'Transferred'],
  code: ['Coded', 'Programmed', 'Developed'],
  program: ['Programmed', 'Coded', 'Developed'],
  debug: ['Debugged', 'Troubleshot', 'Fixed'],
  optimize: ['Optimized', 'Improved', 'Tuned'],
  budget: ['Budgeted', 'Planned', 'Allocated'],
  calculate: ['Calculated', 'Computed', 'Worked out'],
  reconcile: ['Reconciled', 'Balanced', 'Matched'],
  invoice: ['Invoiced', 'Billed', 'Processed invoices for'],
  purchase: ['Purchased', 'Procured', 'Bought'],
  source: ['Sourced', 'Procured', 'Found'],
  facilitate: ['Facilitated', 'Ran', 'Led'],
  host: ['Hosted', 'Ran', 'Organized'],
  post: ['Posted', 'Published', 'Shared'],
  publish: ['Published', 'Released', 'Posted'],
  photograph: ['Photographed', 'Shot', 'Captured'],
  film: ['Filmed', 'Shot', 'Recorded'],
  advise: ['Advised', 'Guided', 'Counseled'],
  guide: ['Guided', 'Advised', 'Directed'],
  attend: ['Attended', 'Participated in', 'Took part in'],
  participate: ['Participated in', 'Took part in', 'Contributed to'],
  contribute: ['Contributed to', 'Supported', 'Helped with'],
  work: ['Worked'],
  make: ['Made', 'Created', 'Produced'],
  do: ['Completed', 'Carried out', 'Performed'],
  take: ['Took', 'Handled', 'Managed'],
  give: ['Gave', 'Provided', 'Delivered'],
  provide: ['Provided', 'Delivered', 'Supplied'],
  set: ['Set', 'Established', 'Defined'],
  establish: ['Established', 'Set up', 'Created'],
  identify: ['Identified', 'Spotted', 'Found'],
  generate: ['Generated', 'Produced', 'Created'],
  secure: ['Secured', 'Obtained', 'Won'],
  win: ['Won', 'Secured', 'Earned'],
  save: ['Saved', 'Reduced', 'Cut'],
  enter: ['Entered', 'Input', 'Recorded'],
  input: ['Input', 'Entered', 'Recorded'],
  file: ['Filed', 'Organized', 'Archived'],
  type: ['Typed', 'Transcribed', 'Entered'],
  transcribe: ['Transcribed', 'Typed', 'Recorded'],
  email: ['Emailed', 'Contacted', 'Corresponded with'],
  call: ['Called', 'Phoned', 'Contacted'],
  contact: ['Contacted', 'Reached out to', 'Called'],
  follow: ['Followed', 'Adhered to', 'Applied'],
  load: ['Loaded', 'Packed', 'Handled'],
  label: ['Labeled', 'Tagged', 'Marked']
};

// Verbs whose usual preposition is already part of every synonym above.
// "responded to emails" -> object "emails", rendered as "Answered emails" / "Replied to emails".
export const PREP_VERBS = {
  respond: 'to', participate: 'in', contribute: 'to', collaborate: 'with', partner: 'with', liaise: 'with', listen: 'to'
};
