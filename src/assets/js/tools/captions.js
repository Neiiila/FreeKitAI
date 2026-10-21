import { generateCaptions, charCount } from '../engines/captions.js';
import { resultBlock, setFieldError, radioValue, announce, el } from '../ui.js';

const form = document.getElementById('sc-form');
const topic = document.getElementById('sc-topic');
const results = document.getElementById('sc-results');
const notesEl = document.getElementById('sc-notes');
const empty = document.getElementById('sc-empty');
const again = document.getElementById('sc-again');
let variant = 0;

function read() {
  const d = Object.fromEntries(new FormData(form));
  d.tone = radioValue(form, 'tone');
  d.emoji = form.emoji.checked;
  return d;
}

function render() {
  const out = generateCaptions(read(), variant);
  if (out.error) {
    setFieldError(topic, out.error);
    topic.focus();
    return;
  }
  setFieldError(topic, '');
  notesEl.replaceChildren(...out.notes.map((n) => el('p', { class: 'notice notice-info', text: n })));
  results.replaceChildren(
    ...out.captions.map((c, i) =>
      resultBlock({
        label: `Caption ${i + 1}`,
        value: c.text,
        rows: Math.min(12, c.text.split('\n').length + 2),
        meta: (text, metaEl) => {
          const n = charCount(text);
          metaEl.textContent = `${n.toLocaleString()} / ${c.limit.toLocaleString()} characters`;
          metaEl.classList.toggle('is-over', n > c.limit);
        }
      }).root
    )
  );
  empty.hidden = true;
  again.hidden = false;
  announce('Three captions generated.');
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
topic.addEventListener('input', () => setFieldError(topic, ''));
form.addEventListener('reset', () => {
  setTimeout(() => {
    results.replaceChildren();
    notesEl.replaceChildren();
    empty.hidden = false;
    again.hidden = true;
    setFieldError(topic, '');
    variant = 0;
    announce('Form cleared.');
  });
});
form.querySelector('[data-example]').addEventListener('click', () => {
  form.reset();
  setTimeout(() => {
    topic.value = 'our new autumn candle collection';
    form.keywords.value = 'soy wax, cozy home, handmade candles';
    form.cta.value = 'Shop the collection, link in bio';
    form.requestSubmit ? form.requestSubmit() : render();
  });
});
