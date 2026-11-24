/* Signature pad: draw or type. Returns a PNG data URL. */
import { h } from './util.js';
function flat(cv) { // small JPEG on white: keeps the signed PDFs tiny
  const o = document.createElement('canvas'); o.width = 450; o.height = 120; const c = o.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, 450, 120); c.drawImage(cv, 0, 0, 450, 120); return o.toDataURL('image/jpeg', .85);
}
export function signaturePad(host, { name = '' } = {}) {
  let mode = 'draw', drawn = false, typed = name;
  const cv = h('canvas', { class: 'sig-cv', width: 900, height: 240, 'aria-label': 'Draw your signature here' });
  const ctx = cv.getContext('2d'); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#232b1f';
  const typedIn = h('input', { class: 'inp', placeholder: 'Type your full name', value: name, 'aria-label': 'Type your full name' });
  const typedCv = h('canvas', { class: 'sig-cv', width: 900, height: 240 }); const tctx = typedCv.getContext('2d');
  const paintTyped = () => { tctx.clearRect(0, 0, 900, 240); tctx.fillStyle = '#232b1f'; let s = 96; tctx.font = `italic ${s}px "Instrument Serif", Georgia, serif`; while (tctx.measureText(typedIn.value).width > 840 && s > 30) { s -= 4; tctx.font = `italic ${s}px "Instrument Serif", Georgia, serif`; } tctx.textBaseline = 'middle'; tctx.fillText(typedIn.value, 24, 130); };
  typedIn.addEventListener('input', () => { typed = typedIn.value; paintTyped(); });
  let last = null, down = false;
  const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 900 / r.width, (e.clientY - r.top) * 240 / r.height]; };
  cv.addEventListener('pointerdown', e => { down = true; cv.setPointerCapture(e.pointerId); last = pt(e); ctx.beginPath(); ctx.arc(...last, 2.5, 0, 7); ctx.fillStyle = '#232b1f'; ctx.fill(); drawn = true; e.preventDefault(); });
  cv.addEventListener('pointermove', e => { if (!down) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(...last); ctx.lineTo(...p); ctx.stroke(); last = p; });
  const up = () => { down = false; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  const clear = () => { ctx.clearRect(0, 0, 900, 240); drawn = false; };
  const drawPane = h('div', { class: 'sig-pane' }, h('div', { class: 'sig-box' }, cv, h('span', { class: 'sig-line' }, 'Sign above')), h('button', { type: 'button', class: 'btn ghost sm', onclick: clear }, 'Clear'));
  const typePane = h('div', { class: 'sig-pane', hidden: true }, typedIn, h('div', { class: 'sig-box' }, typedCv, h('span', { class: 'sig-line' }, 'Your typed signature')));
  const tabD = h('button', { type: 'button', class: 'seg on', onclick: () => set('draw') }, 'Draw');
  const tabT = h('button', { type: 'button', class: 'seg', onclick: () => set('type') }, 'Type');
  function set(m) { mode = m; tabD.classList.toggle('on', m === 'draw'); tabT.classList.toggle('on', m === 'type'); drawPane.hidden = m !== 'draw'; typePane.hidden = m !== 'type'; if (m === 'type') { paintTyped(); typedIn.focus(); } }
  host.append(h('div', { class: 'seg-row' }, tabD, tabT), drawPane, typePane);
  if (document.fonts) document.fonts.ready.then(paintTyped);
  return {
    isEmpty: () => mode === 'draw' ? !drawn : !typedIn.value.trim(),
    get: () => ({ image: flat(mode === 'draw' ? cv : typedCv), method: mode === 'draw' ? 'drawn' : 'typed', typed: typedIn.value.trim() }),
    lock: () => { host.classList.add('locked'); host.querySelectorAll('button,input').forEach(b => b.disabled = true); cv.style.pointerEvents = 'none'; }
  };
}
