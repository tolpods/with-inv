import { h, $, fmtDate, toast, modal, download, esc } from './util.js';
import * as API from './api.js';
import { CONFIG } from './config.js';

export const markSvg = (c1 = '#5f7a56', c2 = '#987347', w = 46) => `<svg width="${w}" height="${w * 52 / 96}" viewBox="0 0 96 52" aria-hidden="true"><rect x="2.5" y="2.5" width="91" height="47" rx="23.5" fill="none" stroke="${c1}" stroke-width="5"/><g fill="none" stroke="${c2}" stroke-linecap="round" stroke-linejoin="round" transform="translate(48,26) scale(.92) translate(-48,-27)"><path d="M28 18 L43 31 H57 L71 22" stroke-width="5"/><path d="M25.5 15.5 L29.5 19" stroke-width="7.7"/><path d="M50 31 V38.5 M41 39 H59" stroke-width="3.6"/></g></svg>`;
export const brand = (sub = 'Investors', href = 'index.html') => h('a', { class: 'brand', href, html: markSvg() + '<span>tolpods</span><small>' + esc(sub) + '</small>' });

/* ---- Dev mailbox (mock mode only): shows every email the system "sends" ---- */
export function mountMailbox() {
  if (CONFIG.mode !== 'mock') return;
  const fab = h('button', { class: 'dev-fab', 'aria-label': 'Open dev mailbox' }, '✉ Dev mailbox ', h('b', {}, '0'));
  document.body.append(fab);
  const count = () => { fab.querySelector('b').textContent = API.mailbox().length; };
  count(); setInterval(count, 1500);
  fab.onclick = () => {
    const list = h('div', { class: 'dev-list' });
    const draw = () => {
      list.replaceChildren(...(API.mailbox().length ? API.mailbox().map(m => {
        const codes = [...new Set([...(m.text.match(/\b\d{6}\b/g) || []), ...(m.text.match(/Your invitation code: ([A-Z0-9]{5})/) || []).slice(1)])];
        const hasLink = /https?:\/\/\S+/.exec(m.text);
        return h('div', { class: 'mail' },
          h('div', { class: 'mh' }, h('span', {}, 'To: ' + m.to), h('span', {}, fmtDate(m.at))),
          h('b', { class: 's' }, m.subject),
          ...codes.filter(c => m.kind === 'otp' || m.kind === 'invite').map(c => h('span', { class: 'codechip', title: 'Click to copy', onclick: () => { navigator.clipboard?.writeText(c); toast('Copied ' + c); } }, c)),
          hasLink && m.kind === 'invite' ? h('div', {}, h('a', { href: hasLink[0].replace(/[).,]+$/, ''), class: 'btn sm', style: 'margin-top:8px', target: '_blank' }, 'Open invitation link')) : null,
          h('pre', {}, m.text),
          ...(m.attachments || []).map(a => h('button', { class: 'btn ghost sm att', onclick: () => download(a.name, a.dataUrl) }, '⬇ ' + a.name)));
      }) : [h('p', { style: 'padding:20px;text-align:center' }, 'No emails sent yet.')]));
    };
    draw(); const iv = setInterval(draw, 1500);
    const drawer = h('div', { class: 'dev-drawer', role: 'dialog', 'aria-label': 'Dev mailbox' },
      h('div', { class: 'dev-h' }, h('h3', {}, 'Dev mailbox'), h('button', { class: 'btn ghost sm', onclick: () => { API.clearMailbox(); draw(); count(); } }, 'Clear'), h('button', { class: 'x', 'aria-label': 'Close', onclick: () => { clearInterval(iv); drawer.remove(); } }, '×')),
      h('div', { class: 'dev-sub' }, 'Prototype mode: emails are not really sent. In production this becomes your email service.'), list);
    document.body.append(drawer);
  };
}

/* ---- Investor support / trouble signing in ---- */
export function supportModal({ kind = 'help', email = '', name = '' } = {}) {
  const inEmail = h('input', { class: 'inp', type: 'email', value: email, placeholder: 'you@example.com', autocomplete: 'email' });
  const inName = h('input', { class: 'inp', value: name, placeholder: 'Your name', autocomplete: 'name' });
  const inMsg = h('textarea', { class: 'inp', rows: 5, placeholder: kind === 'signin' ? "e.g. I didn't get my one-time code / my invitation code isn't accepted." : 'Ask us anything about the presentation, the NDA or the SAFE.' });
  const err = h('div', { class: 'err-t' });
  const body = h('div', {}, h('p', {}, kind === 'signin' ? 'Tell us what happened and a team member will email you, usually within one business day.' : 'Send us a question and we will reply by email.'),
    h('div', { class: 'field' }, h('label', {}, 'Your name'), inName), h('div', { class: 'field' }, h('label', {}, 'Email'), inEmail), h('div', { class: 'field' }, h('label', {}, kind === 'signin' ? 'What went wrong?' : 'Your question'), inMsg), err);
  modal(kind === 'signin' ? 'Trouble with your code?' : 'Investor help', body, { actions: [{ label: 'Cancel', kind: 'ghost', run: c => c() }, { label: 'Send message', run: c => { const r = API.createTicket({ name: inName.value, email: inEmail.value, kind, message: inMsg.value }); if (!r.ok) { err.textContent = r.error; return; } toast('Message sent. Reference ' + r.id); c(); } }] });
}
