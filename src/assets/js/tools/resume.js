import { generateResumeBullets } from '../engines/resume.js';
import { resultBlock, copyText, setFieldError, radioValue, announce, el } from '../ui.js';

const form = document.getElementById('rb-form');
const desc = document.getElementById('rb-desc');
const results = document.getElementById('rb-results');
const notesEl = document.getElementById('rb-notes');
const empty = document.getElementById('rb-empty');
const more = document.getElementById('rb-more');
const actions = document.getElementById('rb-actions');
let variant = 0;
let areas = [];

function read() {
  const d = Object.fromEntries(new FormData(form));
  d.tone = radioValue(form, 'tone');
  return d;
}

function render() {
  const out = generateResumeBullets(read(), variant);
  if (out.error) {
    setFieldError(desc, out.error);
    desc.focus();
    return;
  }
  setFieldError(desc, '');
  notesEl.replaceChildren(...out.notes.map((n) => el('p', { class: 'notice notice-info', text: n })));
  areas = [];
  results.replaceChildren(
    ...out.bullets.map((b, i) => {
      const block = resultBlock({ label: `Option ${i + 1}`, value: b, rows: 3 });
      areas.push(block.textarea);
      return block.root;
    })
  );
  empty.hidden = true;
  more.hidden = false;
  actions.hidden = false;
  announce('Three bullet options generated.');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  variant = 0;
  render();
});
more.addEventListener('click', () => {
  variant++;
  render();
});
desc.addEventListener('input', () => setFieldError(desc, ''));
form.addEventListener('reset', () => {
  setTimeout(() => {
    results.replaceChildren();
    notesEl.replaceChildren();
    empty.hidden = false;
    more.hidden = true;
    actions.hidden = true;
    setFieldError(desc, '');
    variant = 0;
    announce('Form cleared.');
  });
});
document.getElementById('rb-copy-all').addEventListener('click', (e) =>
  copyText(areas.map((a) => '• ' + a.value.trim()).join('\n'), e.currentTarget)
);
form.querySelector('[data-example]').addEventListener('click', () => {
  form.reset();
  setTimeout(() => {
    form.jobTitle.value = 'Customer Service Assistant';
    desc.value = 'I was responsible for answering customer emails and phone calls';
    form.skills.value = 'Zendesk';
    form.industry.value = 'retail';
    form.requestSubmit ? form.requestSubmit() : render();
  });
});
