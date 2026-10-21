import { generateEmail, PURPOSES, RECIPIENTS } from '../engines/email.js';
import { resultBlock, copyText, setFieldError, radioValue, announce, el } from '../ui.js';

const form = document.getElementById('em-form');
const purposeSel = document.getElementById('em-purpose');
const recipientSel = document.getElementById('em-recipient');
const topic = document.getElementById('em-topic');
const results = document.getElementById('em-results');
const notesEl = document.getElementById('em-notes');
const empty = document.getElementById('em-empty');
const again = document.getElementById('em-again');
const actions = document.getElementById('em-actions');
let variant = 0;
let subjectArea;
let bodyArea;

purposeSel.append(el('option', { value: '', text: 'Choose a purpose…' }));
for (const [id, p] of Object.entries(PURPOSES)) purposeSel.append(el('option', { value: id, text: p.label }));
for (const [id, r] of Object.entries(RECIPIENTS)) recipientSel.append(el('option', { value: id, text: r.label }));

purposeSel.addEventListener('change', () => {
  setFieldError(purposeSel, '');
  const p = PURPOSES[purposeSel.value];
  topic.placeholder = p ? `e.g. ${p.placeholder.replace(/[[\]]/g, '')}` : '';
});

function read() {
  const d = Object.fromEntries(new FormData(form));
  d.tone = radioValue(form, 'tone');
  d.length = radioValue(form, 'length');
  return d;
}

function render() {
  const out = generateEmail(read(), variant);
  if (out.error) {
    setFieldError(purposeSel, out.error);
    purposeSel.focus();
    return;
  }
  notesEl.replaceChildren(...out.notes.map((n) => el('p', { class: 'notice notice-info', text: n })));
  const s = resultBlock({ label: 'Subject line', value: out.subject, rows: 1 });
  const b = resultBlock({ label: 'Email', value: out.body, rows: Math.min(22, out.body.split('\n').length + 2) });
  subjectArea = s.textarea;
  bodyArea = b.textarea;
  results.replaceChildren(s.root, b.root);
  empty.hidden = true;
  again.hidden = false;
  actions.hidden = false;
  announce('Email draft ready.');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  variant = 0;
  render();
});
again.addEventListener('click', () => {
  variant++;
  render();
});
form.addEventListener('reset', () => {
  setTimeout(() => {
    results.replaceChildren();
    notesEl.replaceChildren();
    empty.hidden = false;
    again.hidden = true;
    actions.hidden = true;
    topic.placeholder = '';
    setFieldError(purposeSel, '');
    variant = 0;
    announce('Form cleared.');
  });
});
document.getElementById('em-copy-all').addEventListener('click', (e) =>
  copyText(`Subject: ${subjectArea.value.trim()}\n\n${bodyArea.value.trim()}`, e.currentTarget)
);
form.querySelector('[data-example]').addEventListener('click', () => {
  form.reset();
  setTimeout(() => {
    purposeSel.value = 'interview-follow-up';
    purposeSel.dispatchEvent(new Event('change'));
    topic.value = 'Marketing Coordinator';
    recipientSel.value = 'hiring-manager';
    form.recipientName.value = 'Ms. Patel';
    form.points.value = 'I especially enjoyed hearing about the plans for the spring campaign.\nI am happy to share more writing samples if that would help.';
    form.senderName.value = 'Alex Morgan';
    form.requestSubmit ? form.requestSubmit() : render();
  });
});
