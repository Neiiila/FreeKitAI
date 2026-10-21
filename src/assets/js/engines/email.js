// Professional email generator — rule-based templates (no AI, no network).
// Anything the tool cannot know (dates, names, details) is left as a [bracketed placeholder].
import { clean, stripEndPunct, sentence, splitLines, pick } from './text.js';

export const TONES = ['formal', 'friendly', 'polite', 'assertive'];
export const LENGTHS = ['short', 'medium', 'detailed'];

export const RECIPIENTS = {
  'hiring-manager': { label: 'Hiring manager or recruiter', fallback: 'Hiring Manager' },
  manager: { label: 'Manager or supervisor', fallback: '[Name]' },
  colleague: { label: 'Colleague or teammate', fallback: '[Name]' },
  client: { label: 'Client or customer', fallback: '[Name]' },
  professor: { label: 'Teacher or professor', fallback: 'Professor [Last name]' },
  vendor: { label: 'Supplier or vendor', fallback: '[Name]' },
  'new-contact': { label: 'Someone you have not met', fallback: '[Name]' }
};

// {topic} is the user's "topic / reference" (or the placeholder), {name} the sender's name.
export const PURPOSES = {
  'interview-follow-up': {
    label: 'Thank you / follow-up after an interview',
    placeholder: '[position]',
    subjects: ['Thank you – {topic} interview', 'Following up on the {topic} interview'],
    core: [
      'Thank you for taking the time to speak with me about the {topic} position. I enjoyed learning more about the role and the team.',
      'Thank you again for interviewing me for the {topic} role. I appreciated the chance to learn more about the position.'
    ],
    assertive: ['I am following up on my interview for the {topic} position. I remain interested in the role and would like to know the next steps and expected timeline.'],
    extra: 'If there is any additional information I can provide to support my application, please let me know.',
    next: ['I look forward to hearing about the next steps.', 'I would be glad to answer any further questions.']
  },
  'job-application': {
    label: 'Apply for a job',
    placeholder: '[job title]',
    subjects: ['Application for {topic}', '{topic} application – {name}'],
    core: [
      'I am writing to apply for the {topic} position.',
      'I would like to be considered for the {topic} role.'
    ],
    extra: 'I would welcome the opportunity to discuss how my experience matches what you are looking for.',
    next: ['Thank you for considering my application. I look forward to hearing from you.', 'I would be happy to provide any further information you need.']
  },
  'meeting-request': {
    label: 'Request a meeting or call',
    placeholder: '[topic]',
    subjects: ['Meeting request: {topic}', 'Could we meet to discuss {topic}?'],
    core: [
      'I would like to schedule a meeting to discuss {topic}.',
      'Would you have time for a short meeting about {topic}?'
    ],
    assertive: ['I need to schedule a meeting about {topic} this week.'],
    extra: 'The meeting should take about [length of time], and I am happy to work around your schedule.',
    next: ['Would [suggest a day and time] work for you?', 'Please let me know which day and time suit you best.']
  },
  'no-reply-follow-up': {
    label: 'Follow up when you have had no reply',
    placeholder: '[topic]',
    subjects: ['Following up: {topic}', 'Re: {topic}'],
    core: [
      'I am following up on my previous email about {topic}.',
      'I wanted to check in on my earlier message regarding {topic}.'
    ],
    assertive: ['I am following up again on my email about {topic}, as I have not yet received a response.'],
    extra: 'I understand you may be busy, and I appreciate you taking a look.',
    next: ['Could you let me know when I can expect an update?', 'Please reply by [date] so we can move forward.']
  },
  'thank-you': {
    label: 'Say thank you',
    placeholder: '[what you are thanking them for]',
    subjects: ['Thank you', 'Thank you for {topic}'],
    core: ['Thank you for {topic}.', 'I wanted to say thank you for {topic}.'],
    extra: 'Your help made a real difference, and I appreciate the time you took.',
    next: ['Thank you again.', 'I hope I can return the favor.']
  },
  apology: {
    label: 'Apologize for a mistake or delay',
    placeholder: '[the issue]',
    subjects: ['Apologies regarding {topic}', 'My apologies – {topic}'],
    core: ['I want to apologize for {topic}.', 'Please accept my apologies for {topic}.'],
    assertive: ['I want to acknowledge and apologize for {topic}.'],
    extra: '[Explain briefly what happened and what you are doing to fix it.]',
    next: ['Please let me know if there is anything else I can do.', 'Thank you for your patience and understanding.']
  },
  'request-info': {
    label: 'Ask for information',
    placeholder: '[topic]',
    subjects: ['Question about {topic}', 'Request for information: {topic}'],
    core: ['I am writing to ask for more information about {topic}.', 'Could you please share more details about {topic}?'],
    assertive: ['I need more information about {topic}.'],
    extra: 'Any documents or links you can share would also be helpful.',
    next: ['Thank you in advance for your help.', 'I would appreciate a reply when you have a moment.']
  },
  decline: {
    label: 'Decline an offer or invitation',
    placeholder: '[the offer or invitation]',
    subjects: ['Re: {topic}', 'Thank you – {topic}'],
    core: [
      'Thank you for {topic}. After careful consideration, I have decided not to accept at this time.',
      'Thank you for thinking of me for {topic}. Unfortunately, I am not able to accept.'
    ],
    assertive: ['Thank you for {topic}. I will not be able to accept.'],
    extra: 'I appreciate the time and effort involved, and I hope we can stay in touch.',
    next: ['Thank you again for your understanding.', 'I wish you all the best.']
  },
  introduction: {
    label: 'Introduce yourself',
    placeholder: '[the reason you are writing]',
    subjects: ['Introduction: {name}', 'Introducing myself – {topic}'],
    core: ['My name is {name}, and I am reaching out about {topic}.', 'I am {name}, and I am writing to introduce myself regarding {topic}.'],
    extra: '[Add one or two sentences about who you are and why you are contacting this person.]',
    next: ['Would you be open to a short conversation?', 'I would be glad to share more if it is helpful.']
  },
  'deadline-extension': {
    label: 'Ask for a deadline extension',
    placeholder: '[assignment or task]',
    subjects: ['Extension request: {topic}', 'Request for more time on {topic}'],
    core: [
      'I am writing to ask whether it would be possible to extend the deadline for {topic}.',
      'Would it be possible to have a short extension on the deadline for {topic}?'
    ],
    assertive: ['I am requesting an extension to the deadline for {topic}.'],
    extra: '[Briefly explain the reason for the request.]',
    next: ['Would [new date] be acceptable?', 'I can deliver it by [new date] if that works for you.']
  },
  'customer-reply': {
    label: 'Reply to a customer inquiry',
    placeholder: '[their question]',
    subjects: ['Re: {topic}', 'Your question about {topic}'],
    core: ['Thank you for contacting us about {topic}.', 'Thank you for your message regarding {topic}.'],
    extra: 'If anything is unclear, please reply to this email and we will be happy to help.',
    next: ['Please let us know if you have any other questions.', 'We are happy to help with anything else you need.']
  },
  'payment-reminder': {
    label: 'Send a payment reminder',
    placeholder: '[invoice number]',
    subjects: ['Payment reminder: {topic}', 'Reminder: {topic} due [date]'],
    core: ['This is a reminder that payment for {topic} is due on [date].', 'I am writing to remind you that {topic} is due for payment on [date].'],
    assertive: ['Payment for {topic} is now overdue. Please arrange payment by [date].'],
    extra: 'If you have already sent the payment, please disregard this message.',
    next: ['Please let me know if you have any questions about the invoice.', 'Thank you for your prompt attention to this.']
  },
  general: {
    label: 'Something else',
    placeholder: '[topic]',
    subjects: ['{topic}', 'Regarding {topic}'],
    core: ['I am writing regarding {topic}.', 'I wanted to get in touch about {topic}.'],
    extra: '',
    next: ['I look forward to hearing from you.', 'Please let me know if you have any questions.']
  }
};

const OPENERS = {
  formal: ['I hope this message finds you well.', 'I hope you are well.'],
  friendly: ['I hope you are having a good week!', 'I hope all is well with you!'],
  polite: ['I hope you are doing well.', 'I hope this email finds you well.'],
  assertive: ['', '']
};
const CLOSINGS = {
  formal: ['Thank you for your time and consideration.', 'Thank you for your attention to this matter.'],
  friendly: ['Thanks so much!', 'Thanks again!'],
  polite: ['Thank you for your time.', 'Many thanks for your time.'],
  assertive: ['I look forward to your reply.', 'Thank you for your prompt response.']
};
const SIGNOFFS = {
  formal: ['Kind regards,', 'Sincerely,'],
  friendly: ['Best,', 'Cheers,'],
  polite: ['Kind regards,', 'Best regards,'],
  assertive: ['Regards,', 'Best regards,']
};

const CONTRACT = [
  [/\bI am\b/g, "I'm"], [/\bI would\b/g, "I'd"], [/\bI will\b/g, "I'll"], [/\bdo not\b/g, "don't"], [/\bdoes not\b/g, "doesn't"],
  [/\bcannot\b/g, "can't"], [/\bit is\b/g, "it's"], [/\bIt is\b/g, "It's"], [/\bthat is\b/g, "that's"], [/\bwe are\b/g, "we're"],
  [/\bWe are\b/g, "We're"], [/\byou are\b/g, "you're"], [/\bI have (been|not|already|sent|attached|received|decided|summarized)\b/g, "I've $1"],
  [/\bhave not\b/g, "haven't"], [/\bwill not\b/g, "won't"], [/\bwe will\b/g, "we'll"]
];
const EXPAND = [
  [/\bI'm\b/g, 'I am'], [/\bI'd\b/g, 'I would'], [/\bI'll\b/g, 'I will'], [/\bdon't\b/g, 'do not'], [/\bcan't\b/g, 'cannot'],
  [/\bit's\b/g, 'it is'], [/\bwe're\b/g, 'we are'], [/\byou're\b/g, 'you are'], [/\bI've\b/g, 'I have'], [/\bhaven't\b/g, 'have not'], [/\bwon't\b/g, 'will not']
];

function toneText(text, tone) {
  let out = text;
  if (tone === 'friendly') for (const [re, rep] of CONTRACT) out = out.replace(re, rep);
  if (tone === 'formal') for (const [re, rep] of EXPAND) out = out.replace(re, rep);
  if (tone === 'friendly') out = out.replace(/\bI would like to\b/g, "I'd love to").replace(/\bregarding\b/g, 'about');
  return out;
}

function greeting(tone, recipientName, recipientType) {
  const r = RECIPIENTS[recipientType] || RECIPIENTS['new-contact'];
  const name = clean(recipientName) || r.fallback;
  if (tone === 'friendly') return clean(recipientName) ? `Hi ${name},` : recipientType === 'hiring-manager' ? 'Hello,' : `Hi ${name},`;
  if (tone === 'formal') return `Dear ${name},`;
  return `${recipientType === 'hiring-manager' || recipientType === 'professor' ? 'Dear' : 'Hello'} ${name},`;
}

/**
 * @param {object} input { purpose, recipientType, recipientName, senderName, topic, points, tone, length }
 * @param {number} variant  "Try another version" counter
 * @returns {{ subject: string, body: string, notes: string[], error?: string }}
 */
export function generateEmail(input, variant = 0) {
  const purpose = PURPOSES[input.purpose];
  if (!purpose) return { subject: '', body: '', notes: [], error: 'Choose what the email is for.' };
  const tone = TONES.includes(input.tone) ? input.tone : 'polite';
  const length = LENGTHS.includes(input.length) ? input.length : 'medium';
  const topic = stripEndPunct(input.topic) || purpose.placeholder;
  const sender = clean(input.senderName) || '[Your name]';
  const points = splitLines(input.points).map(sentence);
  const notes = [];

  const fill = (s) => s.split('{topic}').join(topic).split('{name}').join(sender);
  const t = (s) => toneText(fill(s), tone);

  const subject = toneText(fill(pick(purpose.subjects, variant)), tone).replace(/^\w/, (c) => c.toUpperCase());
  const coreList = tone === 'assertive' && purpose.assertive ? purpose.assertive : purpose.core;
  const core = t(pick(coreList, variant));
  const opener = t(pick(OPENERS[tone], variant));
  const next = t(pick(purpose.next, variant + (tone === 'assertive' ? 1 : 0)));
  const closing = t(pick(CLOSINGS[tone], variant));
  const signoff = pick(SIGNOFFS[tone], variant);

  const paras = [greeting(tone, input.recipientName, input.recipientType)];
  if (length === 'short') {
    paras.push([core, ...points].join(' '));
    paras.push(next);
  } else if (length === 'medium') {
    paras.push([opener, core].filter(Boolean).join(' '));
    if (points.length) paras.push(points.join(' '));
    paras.push([next, closing].join(' '));
  } else {
    paras.push([opener, core].filter(Boolean).join(' '));
    if (points.length >= 3) {
      paras.push(t('Here are the key points:') + '\n' + points.map((p) => `- ${p}`).join('\n'));
    } else if (points.length) {
      paras.push(points.join(' '));
    } else {
      paras.push('[Add the details the recipient needs here.]');
    }
    if (purpose.extra) paras.push(t(purpose.extra));
    paras.push(next);
    paras.push(closing);
  }
  paras.push(`${signoff}\n${sender}`);

  if (!points.length) notes.push('Add a few key points to make the email specific to your situation.');
  const body = paras.join('\n\n');
  if (/\[[^\]]+\]/.test(subject + body)) notes.push('Replace each [bracketed placeholder] before sending.');
  return { subject, body, notes };
}
