// Word counter: everything stays on this page. No storage, no network requests.
import { stats, transforms } from '../engines/textstats.js';
import { copyText, announce } from '../ui.js';

const text = document.getElementById('wc-text');
const statEls = [...document.querySelectorAll('[data-stat]')];
const undoBtn = document.getElementById('wc-undo');
const status = document.getElementById('wc-status');
let history = null;

const LABELS = {
  removeExtraSpaces: 'Extra spaces removed.',
  normalizeLineBreaks: 'Line breaks normalized.',
  joinBrokenLines: 'Broken lines joined.',
  upper: 'Converted to UPPERCASE.',
  lower: 'Converted to lowercase.',
  title: 'Converted to Title Case.',
  sentence: 'Converted to sentence case.'
};

let frame = 0;
function update() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const s = stats(text.value);
    for (const elx of statEls) {
      const v = s[elx.dataset.stat];
      elx.textContent = typeof v === 'number' ? v.toLocaleString() : v;
    }
  });
}

function showStatus(msg) {
  status.textContent = msg;
  status.hidden = !msg;
  if (msg) announce(msg);
}

text.addEventListener('input', () => {
  update();
  showStatus('');
});

document.querySelectorAll('[data-transform]').forEach((btn) =>
  btn.addEventListener('click', () => {
    if (!text.value.trim()) {
      showStatus('Add some text first.');
      text.focus();
      return;
    }
    const before = text.value;
    const after = transforms[btn.dataset.transform](before);
    if (after === before) {
      showStatus('No changes were needed.');
      return;
    }
    history = before;
    undoBtn.disabled = false;
    text.value = after;
    update();
    showStatus(LABELS[btn.dataset.transform]);
  })
);

undoBtn.addEventListener('click', () => {
  if (history === null) return;
  text.value = history;
  history = null;
  undoBtn.disabled = true;
  update();
  showStatus('Last change undone.');
});

document.getElementById('wc-copy').addEventListener('click', (e) => copyText(text.value, e.currentTarget, 'Copied', text));

document.getElementById('wc-clear').addEventListener('click', () => {
  if (!text.value) return;
  history = text.value;
  undoBtn.disabled = false;
  text.value = '';
  update();
  showStatus('Text cleared. Use Undo to bring it back.');
  text.focus();
});

update();
