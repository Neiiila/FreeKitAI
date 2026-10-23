// Word counter: everything stays on this page. No storage, no network requests.
import { stats, transforms } from '../engines/textstats.js';
import { LIMIT_PRESETS, findPreset, checkLimit, describeLimit } from '../engines/limits.js';
import { copyText, announce, el } from '../ui.js';

const text = document.getElementById('wc-text');
const statEls = [...document.querySelectorAll('[data-stat]')];
const undoBtn = document.getElementById('wc-undo');
const status = document.getElementById('wc-status');
let history = null;

// ---------- length target ----------
const limitSel = document.getElementById('wc-limit');
const customRow = document.getElementById('wc-custom');
const customMax = document.getElementById('wc-custom-max');
const customUnit = document.getElementById('wc-custom-unit');
const limitResult = document.getElementById('wc-limit-result');
const limitBar = document.getElementById('wc-limit-bar');
const limitFill = document.getElementById('wc-limit-fill');
const limitText = document.getElementById('wc-limit-text');
const limitNote = document.getElementById('wc-limit-note');
let lastLimitStatus = '';

for (const p of LIMIT_PRESETS) {
  const suffix = p.kind === 'recommended' ? 'recommended' : 'max';
  limitSel.append(el('option', { value: p.id, text: `${p.label} (${p.max.toLocaleString()} ${p.unit}, ${suffix})` }));
}
limitSel.append(el('option', { value: 'custom', text: 'Custom limit…' }));

function currentTarget() {
  if (limitSel.value === 'custom') {
    return { unit: customUnit.value, max: Math.floor(Number(customMax.value)), kind: 'limit' };
  }
  return findPreset(limitSel.value);
}

function renderLimit(s) {
  const target = currentTarget();
  customRow.hidden = limitSel.value !== 'custom';
  const result = target ? checkLimit(s, target) : null;
  limitResult.hidden = !result;
  if (!result) {
    limitNote.textContent = limitSel.value === 'custom' ? 'Enter a maximum of 1 or more.' : '';
    lastLimitStatus = '';
    return;
  }
  limitFill.style.width = result.percent + '%';
  limitBar.dataset.status = result.status;
  limitBar.setAttribute('aria-valuenow', String(result.percent));
  const summary = `${result.used.toLocaleString()} / ${result.max.toLocaleString()} ${target.unit}: ${describeLimit(result, target.unit, target.kind)}`;
  limitText.textContent = summary;
  limitText.dataset.status = result.status;
  const preset = findPreset(limitSel.value);
  limitNote.textContent = preset && preset.note ? preset.note : '';
  // Announce only when the status changes, not on every keystroke.
  if (result.status !== lastLimitStatus && lastLimitStatus) {
    announce(result.status === 'over' ? 'Over the limit.' : result.status === 'near' ? 'Close to the limit.' : 'Within the limit.');
  }
  lastLimitStatus = result.status;
}

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
    renderLimit(s);
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

[limitSel, customUnit].forEach((x) => x.addEventListener('change', update));
customMax.addEventListener('input', update);

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
