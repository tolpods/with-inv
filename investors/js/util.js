export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = n => n == null || isNaN(n) ? '-' : (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
export const money2 = n => n == null || isNaN(n) ? '-' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const compact = n => { const a = Math.abs(n); const s = a >= 1e9 ? (a / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'M' : a >= 1e3 ? Math.round(a / 1e3) + 'K' : String(Math.round(a)); return (n < 0 ? '-$' : '$') + s; };
export const fmtDate = (t, long) => t ? new Date(t).toLocaleString('en-US', long ? { dateStyle: 'long', timeStyle: 'short' } : { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-';
export const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || '').trim());
export const norm = e => String(e || '').trim().toLowerCase();
export function toast(msg, kind = 'ok') {
  let w = $('#toasts'); if (!w) { w = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(w); }
  const t = h('div', { class: 'toast ' + kind }, msg); w.append(t);
  setTimeout(() => t.classList.add('out'), 3800); setTimeout(() => t.remove(), 4300);
}
export function download(name, dataUrl) { const a = h('a', { href: dataUrl, download: name }); document.body.append(a); a.click(); a.remove(); }
export async function sha256(str) {
  try {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  } catch { let x = 5381; for (let i = 0; i < str.length; i++) x = ((x << 5) + x) ^ str.charCodeAt(i); return 'weak-' + (x >>> 0).toString(16); }
}
export function modal(title, body, { wide = false, actions = [] } = {}) {
  const back = h('div', { class: 'modal-back', role: 'dialog', 'aria-modal': 'true', 'aria-label': title });
  const box = h('div', { class: 'modal' + (wide ? ' wide' : '') });
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  box.append(h('div', { class: 'modal-h' }, h('h3', {}, title), h('button', { class: 'x', 'aria-label': 'Close', onclick: close }, '×')), h('div', { class: 'modal-b' }, body));
  if (actions.length) box.append(h('div', { class: 'modal-f' }, actions.map(a => h('button', { class: 'btn ' + (a.kind || ''), onclick: () => a.run(close) }, a.label))));
  back.addEventListener('mousedown', e => { if (e.target === back) close(); });
  back.append(box); document.body.append(back); return { close, box };
}
export const loadScript = src => new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = h('script', { src, onload: res, onerror: rej }); document.head.append(s); });
export const dataUrlToBlobUrl = d => { const [m, b] = d.split(','); const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u], { type: m.match(/:(.*?);/)[1] })); };
