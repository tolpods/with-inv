import { CONFIG } from './config.js';
import * as API from './api.js';
import { brand, mountMailbox } from './ui.js';
import { h, $, esc, toast, modal, fmtDate, emailOk } from './util.js';
import * as S from './store.js';

const app = $('#app'); let tab = location.hash.slice(1) || 'invites'; let me = null;
mountMailbox();

function top(withNav) {
  return h('header', { class: 'top' }, h('div', { class: 'top-in' }, brand('Admin', 'admin.html'),
    withNav ? h('nav', { class: 'adm-nav' }, [['invites', 'Invite investors'], ['admins', 'Admin users'], ['settings', 'Settings']].map(([k, l]) => h('button', { class: tab === k ? 'on' : '', onclick: () => { tab = k; location.hash = k; render(); } }, l)), h('a', { href: 'dashboard.html' }, 'Dashboard ↗')) : null,
    h('span', { class: 'sp', style: 'flex:1' }), withNav ? [h('span', { class: 'who' }, h('b', {}, me.name), ' · ', me.email), h('button', { class: 'btn ghost sm', onclick: () => { API.logout('admin'); render(); } }, 'Sign out')] : null));
}

/* ---- login (email -> one-time code) ---- */
function login(stage = 1, email = '') {
  const err = h('div', { class: 'err-t', role: 'alert' });
  let box;
  if (stage === 1) {
    const inp = h('input', { class: 'inp', type: 'email', placeholder: 'you@tolpods.com', value: email, autocomplete: 'email', 'aria-label': 'Admin email' }); const btn = h('button', { class: 'btn lg', style: 'width:100%' }, 'Email me a code');
    box = h('form', { onsubmit: async e => { e.preventDefault(); err.textContent = ''; btn.disabled = true; const r = await API.adminRequestCode(inp.value); btn.disabled = false; if (!r.ok) { err.textContent = r.error; return; } login(2, inp.value.trim().toLowerCase()); } },
      h('div', { class: 'field' }, h('label', {}, 'Admin email'), inp), err, btn, h('p', { style: 'margin-top:16px;font-size:13.5px;color:var(--faint)' }, 'Investor? ', h('a', { href: 'index.html' }, 'Investor sign in'), ' · ', h('a', { href: '../index.html' }, '← Back to tolpods.com')));
    box = h('div', { class: 'login-box' }, h('h2', {}, 'Admin sign in'), h('p', {}, 'Enter your admin email. We will send you a one-time code.'), box);
  } else {
    const boxes = Array.from({ length: CONFIG.otp.length }, (_, i) => h('input', { inputmode: 'numeric', maxlength: 1, autocomplete: i ? 'off' : 'one-time-code', 'aria-label': 'Digit ' + (i + 1) }));
    boxes.forEach((b, i) => { b.oninput = () => { b.value = b.value.replace(/\D/g, '').slice(-1); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); }; b.onkeydown = e => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); }; b.onpaste = e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, ''); if (t.length > 1) { e.preventDefault(); boxes.forEach((x, j) => x.value = t[j] || ''); } }; });
    const btn = h('button', { class: 'btn lg', style: 'width:100%' }, 'Verify and sign in');
    const form = h('form', { onsubmit: async e => { e.preventDefault(); err.textContent = ''; btn.disabled = true; const r = await API.adminVerify(email, boxes.map(b => b.value).join('')); btn.disabled = false; if (!r.ok) { err.textContent = r.error; boxes.forEach(b => b.value = ''); boxes[0].focus(); return; } render(); } },
      h('div', { class: 'otp' }, boxes), err, btn, h('p', { style: 'text-align:center;margin-top:14px;font-size:14px' }, h('button', { type: 'button', class: 'link', onclick: () => login(1, email) }, 'Use a different email')));
    box = h('div', { class: 'login-box' }, h('h2', {}, 'Check your email'), h('p', {}, 'If ', h('b', {}, email), ' is an authorized admin, a 6-digit code is on its way.'), CONFIG.mode === 'mock' ? h('div', { class: 'banner warn' }, 'Prototype: read the code in the ✉ Dev mailbox (bottom right). Seeded admins: ' + CONFIG.adminSeed.map(a => a.email).join(', ')) : null, form);
    setTimeout(() => boxes[0].focus(), 50);
  }
  const left = h('div', { class: 'login-l' }, h('div', {}, h('div', { class: 'eyebrow', style: 'color:var(--gold);margin-bottom:22px' }, 'Tolpods admin'), h('h1', { html: 'Manage <em>investor access.</em>' }), h('p', {}, 'Invite investors, manage who can sign in, and follow every NDA and SAFE from one place.')), h('div', { class: 'fine' }, 'Authorized staff only'));
  app.replaceChildren(top(false), h('div', { class: 'login' }, left, h('div', { class: 'login-r' }, box)));
}

/* ---- invites ---- */
const statusChip = i => ({ invited: ['Invited', 'gray'], active: ['Signed in', 'good'], revoked: ['Revoked', 'bad'] }[i.status] || [i.status, 'gray']);
let lastInvite = null;
function invitesView() {
  const name = h('input', { class: 'inp', placeholder: 'Investor name', autocomplete: 'off' }), email = h('input', { class: 'inp', type: 'email', placeholder: 'investor@example.com', autocomplete: 'off' }), note = h('input', { class: 'inp', placeholder: 'Internal note (optional)' });
  const send = h('input', { type: 'checkbox', checked: true }), err = h('div', { class: 'err-t' });
  const form = h('div', { class: 'card' }, h('h3', {}, 'Invite an investor'), h('p', { style: 'font-size:14px' }, 'We generate a 5-character code and email an invitation. The link fills in their email and code.'),
    h('div', { class: 'field' }, h('label', {}, 'Name'), name), h('div', { class: 'field' }, h('label', {}, 'Email'), email), h('div', { class: 'field' }, h('label', {}, 'Note'), note),
    h('label', { class: 'checkrow', style: 'margin-top:0' }, send, h('span', {}, 'Send the invitation email now')), err,
    h('button', { class: 'btn', style: 'width:100%', onclick: () => { err.textContent = ''; const r = API.createInvite({ name: name.value, email: email.value, note: note.value }); if (!r.ok) { err.textContent = r.error; return; } if (send.checked) API.sendInvite(r.invite.code, new URL('index.html', location.href).href); toast(send.checked ? 'Invitation sent to ' + r.invite.email : 'Invitation created: ' + r.invite.code); name.value = email.value = note.value = ''; lastInvite = r.invite; render(); } }, 'Create & send invite'));
  const rows = API.listInvites();
  const table = h('div', { class: 'tw' }, rows.length ? h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Investor', 'Code', 'Status', 'Sent', 'Actions'].map(x => h('th', {}, x)))), h('tbody', {}, rows.map(i => {
    const [lb, cl] = statusChip(i); const link = API.inviteLink(i, new URL('index.html', location.href).href);
    return h('tr', {}, h('td', {}, h('b', {}, i.name), h('br'), h('span', { class: 'fine' }, i.email + (i.note ? ' · ' + i.note : ''))), h('td', {}, h('span', { class: 'code' }, i.code)), h('td', {}, h('span', { class: 'chip ' + cl }, lb)), h('td', {}, i.sentAt ? fmtDate(i.sentAt) + (i.sendCount > 1 ? ` (×${i.sendCount})` : '') : h('span', { class: 'fine' }, 'Not sent')),
      h('td', {}, h('div', { class: 'acts' }, i.status !== 'revoked' ? [h('button', { class: 'btn sm', onclick: () => { API.sendInvite(i.code, new URL('index.html', location.href).href); toast('Invitation ' + (i.sentAt ? 're' : '') + 'sent'); render(); } }, i.sentAt ? 'Resend' : 'Send invite'), h('button', { class: 'btn ghost sm', onclick: () => { navigator.clipboard?.writeText(link); toast('Invite link copied'); } }, 'Copy link'), h('button', { class: 'btn danger sm', onclick: () => modal('Revoke invitation?', h('p', {}, 'This stops ', h('b', {}, i.email), ' from signing in. Their saved data is kept.'), { actions: [{ label: 'Cancel', kind: 'ghost', run: c => c() }, { label: 'Revoke', kind: 'danger', run: c => { API.revokeInvite(i.code); c(); render(); } }] }) }, 'Revoke')] : h('span', { class: 'fine' }, '-'))));
  }))) : h('div', { class: 'empty' }, 'No invitations yet. Create the first one.'));
  const li = lastInvite; lastInvite = null;
  const flash = li ? h('div', { class: 'banner good', style: 'align-items:center;flex-wrap:wrap;gap:14px;margin:14px 0' }, h('span', {}, '✓ Invitation created for ', h('b', {}, li.name), '. Their 5-digit investor code is'), h('span', { class: 'code', style: 'font-size:26px;padding:6px 16px' }, li.code), h('button', { class: 'btn sm', onclick: () => { navigator.clipboard?.writeText(API.inviteLink(li, new URL('index.html', location.href).href)); toast('Invite link copied'); } }, 'Copy invite link'), h('a', { class: 'btn ghost sm', href: 'index.html', target: '_blank' }, 'Open investor sign-in ↗')) : null;
  return h('div', { class: 'adm' }, h('div', { class: 'eyebrow' }, 'Screen 2 of 2'), h('h1', {}, 'Invite ', h('span', { class: 'serif' }, 'investors')), flash, h('div', { class: 'adm-grid' }, form, table));
}

/* ---- admin users ---- */
function adminsView() {
  const name = h('input', { class: 'inp', placeholder: 'Full name' }), email = h('input', { class: 'inp', type: 'email', placeholder: 'name@tolpods.com' }), role = h('select', { class: 'inp' }, h('option', { value: 'admin' }, 'Admin'), h('option', { value: 'owner' }, 'Owner')), err = h('div', { class: 'err-t' });
  const form = h('div', { class: 'card' }, h('h3', {}, 'Add a login user'), h('p', { style: 'font-size:14px' }, 'Admins sign in with their email and a one-time code. Owners are the people who send investor invites (KJ / Mahesh).'), h('div', { class: 'field' }, h('label', {}, 'Name'), name), h('div', { class: 'field' }, h('label', {}, 'Email'), email), h('div', { class: 'field' }, h('label', {}, 'Role'), role), err,
    h('button', { class: 'btn', style: 'width:100%', onclick: () => { const r = API.addAdmin({ name: name.value, email: email.value, role: role.value }); if (!r.ok) { err.textContent = r.error; return; } toast('Added ' + email.value); render(); } }, 'Add admin'));
  const rows = API.listAdmins();
  const table = h('div', { class: 'tw' }, h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Name', 'Email', 'Role', 'Added', ''].map(x => h('th', {}, x)))), h('tbody', {}, rows.map(a => h('tr', {}, h('td', {}, h('b', {}, a.name)), h('td', {}, a.email), h('td', {}, h('span', { class: 'chip ' + (a.role === 'owner' ? 'gold' : '') }, a.role)), h('td', {}, fmtDate(a.addedAt)), h('td', {}, a.email === me.email ? h('span', { class: 'fine' }, 'You') : h('button', { class: 'btn danger sm', onclick: () => modal('Remove admin?', h('p', {}, h('b', {}, a.email), ' will no longer be able to sign in.'), { actions: [{ label: 'Cancel', kind: 'ghost', run: c => c() }, { label: 'Remove', kind: 'danger', run: c => { const r = API.removeAdmin(a.email); c(); if (!r.ok) toast(r.error, 'err'); render(); } }] }) }, 'Remove'))))) ));
  return h('div', { class: 'adm' }, h('div', { class: 'eyebrow' }, 'Screen 1 of 2'), h('h1', {}, 'Admin ', h('span', { class: 'serif' }, 'users')), h('div', { class: 'adm-grid' }, form, table));
}

/* ---- settings ---- */
function settingsView() {
  const s = API.getSettings(); const cal = JSON.parse(JSON.stringify(s.calendar)); const sup = h('input', { class: 'inp', value: s.supportEmail });
  const blocks = cal.map(p => h('div', { class: 'card', style: 'margin-bottom:16px' }, h('h3', {}, p.who + ' appointments'),
    h('div', { class: 'row2' }, h('div', { class: 'field' }, h('label', {}, 'Name'), h('input', { class: 'inp', value: p.name, oninput: e => p.name = e.target.value })), h('div', { class: 'field' }, h('label', {}, 'Title'), h('input', { class: 'inp', value: p.title, oninput: e => p.title = e.target.value }))),
    h('div', { class: 'field' }, h('label', {}, 'Calendly link'), h('input', { class: 'inp', value: p.calendly, placeholder: 'https://calendly.com/your-name/30min', oninput: e => p.calendly = e.target.value })),
    h('div', { class: 'field' }, h('label', {}, 'Google Calendar appointment page (used if no Calendly link)'), h('input', { class: 'inp', value: p.google, placeholder: 'https://calendar.app.google/...', oninput: e => p.google = e.target.value }))));
  return h('div', { class: 'adm', style: 'max-width:760px' }, h('h1', {}, 'Settings'), blocks, h('div', { class: 'card' }, h('h3', {}, 'Support'), h('div', { class: 'field' }, h('label', {}, 'Support email shown to investors'), sup)),
    h('div', { class: 'actions' }, h('button', { class: 'btn', onclick: () => { API.saveSettings({ calendar: cal, supportEmail: sup.value }); toast('Settings saved'); } }, 'Save settings'), CONFIG.mode === 'mock' ? h('button', { class: 'btn danger', onclick: () => modal('Reset all demo data?', h('p', {}, 'Deletes every invitation, investor, NDA, SAFE and email stored in this browser and restores the seeded admins.'), { actions: [{ label: 'Cancel', kind: 'ghost', run: c => c() }, { label: 'Reset everything', kind: 'danger', run: c => { S.resetAll(); c(); render(); } }] }) }, 'Reset demo data') : null));
}

function render() {
  me = API.session('admin') ? API.adminMe() : null;
  if (!me) { login(1); return; }
  app.replaceChildren(top(true), tab === 'admins' ? adminsView() : tab === 'settings' ? settingsView() : invitesView());
}
render();
