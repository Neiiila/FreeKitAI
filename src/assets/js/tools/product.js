import { generateProductDescription } from '../engines/product.js';
import { resultBlock, copyText, setFieldError, radioValue, announce, el } from '../ui.js';

const form = document.getElementById('pd-form');
const results = document.getElementById('pd-results');
const notesEl = document.getElementById('pd-notes');
const empty = document.getElementById('pd-empty');
const again = document.getElementById('pd-again');
// Looked up by id: an input called "name" would clash with the form's own name property.
const fields = {
  name: document.getElementById('pd-name'),
  category: document.getElementById('pd-category'),
  features: document.getElementById('pd-features')
};
let variant = 0;

function read() {
  const d = Object.fromEntries(new FormData(form));
  d.tone = radioValue(form, 'tone');
  d.length = radioValue(form, 'length');
  return d;
}

function render() {
  const out = generateProductDescription(read(), variant);
  for (const [k, input] of Object.entries(fields)) setFieldError(input, out.fieldErrors ? out.fieldErrors[k] : '');
  if (out.error) {
    const first = Object.keys(out.fieldErrors)[0];
    fields[first].focus();
    announce(out.error);
    return;
  }
  notesEl.replaceChildren(...out.notes.map((n) => el('p', { class: 'notice notice-warn', text: n })));

  const titleBlock = el('div', { class: 'result-block' }, [
    el('p', { class: 'result-label', text: 'Title ideas' }),
    el('ul', { class: 'title-list' }, out.titles.map((t) => {
      const btn = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Copy' });
      btn.setAttribute('aria-label', 'Copy title: ' + t);
      btn.addEventListener('click', () => copyText(t, btn));
      return el('li', { class: 'title-item' }, [el('span', { text: t }), btn]);
    }))
  ]);

  results.replaceChildren(
    titleBlock,
    resultBlock({ label: 'Short description', value: out.short, rows: 3 }).root,
    resultBlock({ label: 'Detailed description', value: out.long, rows: Math.min(16, out.long.split('\n').length + 3) }).root,
    resultBlock({ label: 'Feature bullets', value: out.bullets.map((b) => '• ' + b).join('\n'), rows: Math.min(10, out.bullets.length + 1) }).root,
    resultBlock({ label: 'Call-to-action ideas', value: out.ctas.join('\n'), rows: 3 }).root
  );
  empty.hidden = true;
  again.hidden = false;
  announce('Product copy generated.');
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
Object.values(fields).forEach((input) => input.addEventListener('input', () => setFieldError(input, '')));
form.addEventListener('reset', () => {
  setTimeout(() => {
    results.replaceChildren();
    notesEl.replaceChildren();
    empty.hidden = false;
    again.hidden = true;
    Object.values(fields).forEach((input) => setFieldError(input, ''));
    variant = 0;
    announce('Form cleared.');
  });
});
form.querySelector('[data-example]').addEventListener('click', () => {
  form.reset();
  setTimeout(() => {
    fields.name.value = 'Harvest Glow';
    fields.category.value = 'scented candle';
    fields.features.value = 'Hand-poured soy wax\nBurn time of about 40 hours\nReusable glass jar';
    form.audience.value = 'people who love a cozy home';
    form.keywords.value = 'soy candle, autumn candle, candle gift';
    form.requestSubmit ? form.requestSubmit() : render();
  });
});
