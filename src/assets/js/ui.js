// Shared UI helpers for tool pages. No network calls anywhere in this file.

export function announce(message) {
  const region = document.getElementById('live-region');
  if (!region) return;
  region.textContent = '';
  // Re-set on the next frame so screen readers announce repeated messages.
  requestAnimationFrame(() => { region.textContent = message; });
}

async function writeClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for older browsers / non-secure contexts.
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  if (!ok) throw new Error('copy failed');
}

/** Copy text and give visible + screen-reader feedback on the button. */
export async function copyText(text, button, label = 'Copied', selectOnFail = null) {
  if (!text || !text.trim()) {
    announce('Nothing to copy yet.');
    return false;
  }
  try {
    await writeClipboard(text);
    if (button) {
      const original = button.dataset.label || button.textContent;
      button.dataset.label = original;
      button.textContent = label + '!';
      button.classList.add('is-done');
      clearTimeout(button._t);
      button._t = setTimeout(() => {
        button.textContent = original;
        button.classList.remove('is-done');
      }, 1600);
    }
    announce(label + ' to clipboard.');
    return true;
  } catch {
    // Clipboard blocked (permissions, old browser): select the text so the user can copy it manually.
    if (selectOnFail) { selectOnFail.focus(); selectOnFail.select(); }
    if (button) {
      const original = button.dataset.label || button.textContent;
      button.dataset.label = original;
      button.textContent = selectOnFail ? 'Selected: press Ctrl+C' : 'Copy blocked';
      clearTimeout(button._t);
      button._t = setTimeout(() => { button.textContent = original; }, 2500);
    }
    announce('Copy failed. Select the text and press Ctrl+C (or Cmd+C).');
    return false;
  }
}

/** Mark a field invalid with a message, or clear it. */
export function setFieldError(input, message) {
  const err = document.getElementById(input.id + '-error');
  if (message) {
    input.setAttribute('aria-invalid', 'true');
    if (err) err.textContent = message;
  } else {
    input.removeAttribute('aria-invalid');
    if (err) err.textContent = '';
  }
}

export function radioValue(form, name) {
  const el = form.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'text') node.textContent = v;
    else if (k === 'class') node.className = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c) node.append(c);
  return node;
}

let blockCounter = 0;

/**
 * An editable result block: label, optional meta, a textarea, and a copy button.
 * Returns { root, textarea }.
 */
export function resultBlock({ label, value, rows = 3, meta }) {
  const id = 'result-' + ++blockCounter;
  const textarea = el('textarea', { id, rows: String(rows), spellcheck: 'true' });
  textarea.value = value;
  const metaEl = meta ? el('span', { class: 'result-meta', 'aria-live': 'off' }) : null;
  const copyBtn = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Copy' });
  copyBtn.setAttribute('aria-label', 'Copy ' + label);
  copyBtn.addEventListener('click', () => copyText(textarea.value, copyBtn, 'Copied', textarea));
  const updateMeta = () => { if (metaEl) meta(textarea.value, metaEl); };
  textarea.addEventListener('input', updateMeta);
  updateMeta();
  const root = el('div', { class: 'result-block' }, [
    el('div', { class: 'result-head' }, [
      el('label', { class: 'result-label', for: id, text: label }),
      el('div', { class: 'btn-row' }, [metaEl, copyBtn])
    ]),
    textarea
  ]);
  return { root, textarea };
}
