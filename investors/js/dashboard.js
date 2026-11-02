import { CONFIG } from './config.js';
import * as API from './api.js';
import { SAFE_VERSIONS, addrLine } from './docs.js';
import { brand, mountMailbox } from './ui.js';
import { h, $, esc, toast, fmtDate, money, download } from './util.js';

const app = $('#app'); let me = null, tab = 'investors', q = '', filter = 'all', openEmail = null;
mountMailbox();
const CHIP = { invited: 'gray', revoked: 'bad', signedin: 'gray', details: 'warn', nda: 'good', reviewing: 'good', safe: 'gold' };
const SAFE_ST = { 'awaiting-countersign': ['Awaiting countersign', 'warn'], countersigned: ['Countersigned', 'good'], funded: ['Funded', 'gold'] };

function top() {
  return h('header', { class: 'top' }, h('div', { class: 'top-in' }, brand('Dashboard', 'dashboard.html'),
    h('nav', { class: 'adm-nav' }, [['investors', 'Investors'], ['support', 'Support inbox'], ['activity', 'Activity']].map(([k, l]) => h('button', { class: tab === k ? 'on' : '', onclick: () => { tab = k; render(); } }, l)), h('a', { href: 'admin.html' }, 'Invites & admins ↗')),
    h('span', { class: 'sp', style: 'flex:1' }), me ? [h('span', { class: 'who' }, h('b', {}, me.name)), h('button', { class: 'btn ghost sm', onclick: () => { API.logout('admin'); render(); } }, 'Sign out')] : null));
}
function gate() {
  app.replaceChildren(top(), h('div', { class: 'wrap' }, h('div', { class: 'card center', style: 'text-align:center;padding:50px' }, h('h2', {}, 'Admin sign-in required'), h('p', {}, 'The investor dashboard is a separate page for admins only.'), h('a', { class: 'btn', href: 'admin.html' }, 'Go to admin sign-in'))));
}
const name = r => r.me?.profile?.legalName || r.invite.name;
function csv(rows) {
  const cols = ['Name', 'Email', 'Invite code', 'Status', 'Type', 'Phone', 'Address', 'Address check', 'NDA signed', 'SAFE signed', 'Stage', 'SAFE version', 'Amount', 'Valuation cap', 'SAFE status', 'Sections viewed'];
  const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const lines = rows.map(r => { const p = r.me?.profile || {}, s = r.me?.safe; return [name(r), r.invite.email, r.invite.code, API.STATUS[r.status], p.type || '', p.phone || '', r.me ? addrLine(p) : '', p.addrStatus || '', r.me?.nda ? new Date(r.me.nda.at).toISOString() : '', s ? new Date(s.at).toISOString() : '', s?.stage || '', s ? SAFE_VERSIONS[s.version].label : '', s?.amount || '', s?.version === 'cap' ? s.terms.cap : '', s?.status || '', r.viewedCount + '/' + API.SECTIONS.length].map(esc).join(','); });
  return 'data:text/csv;charset=utf-8,' + encodeURIComponent([cols.map(esc).join(','), ...lines].join('\n'));
}

function investorsView(d) {
  const rows = d.rows, count = s => rows.filter(r => s(r)).length, order = ['invited', 'signedin', 'details', 'nda', 'reviewing', 'safe'];
  const atLeast = k => rows.filter(r => r.status !== 'revoked' && order.indexOf(r.status) >= order.indexOf(k)).length;
  const kpis = [['Invited', rows.filter(r => r.status !== 'revoked').length, 'active invitations'], ['NDA signed', atLeast('nda'), 'investors past the NDA'], ['SAFEs signed', atLeast('safe'), 'investors ready to invest'], ['Committed', money(d.committed), 'total SAFE amount'], ['Open questions', d.tickets.filter(t => t.status === 'open').length, 'support messages']];
  const funnel = [['Invited', 'invited'], ['Signed in', 'signedin'], ['Details', 'details'], ['NDA signed', 'nda'], ['Reviewing', 'reviewing'], ['SAFE signed', 'safe']];
  const total = Math.max(1, atLeast('invited'));
  let list = rows.filter(r => (filter === 'all' || r.status === filter) && (!q || (name(r) + r.invite.email + r.invite.code).toLowerCase().includes(q.toLowerCase())));
  const tbody = list.map(r => { const s = r.me?.safe, n = r.me?.nda; return h('tr', { class: 'click', onclick: () => { openEmail = r.invite.email; drawer(); } },
    h('td', {}, h('b', {}, name(r)), h('br'), h('span', { class: 'fine' }, r.invite.email + ' · ' + r.invite.code)), h('td', {}, h('span', { class: 'chip ' + CHIP[r.status] }, API.STATUS[r.status])), h('td', {}, r.me?.profile?.type ? r.me.profile.type[0].toUpperCase() + r.me.profile.type.slice(1) : '-'),
    h('td', {}, n ? h('span', {}, '✓ ', fmtDate(n.at)) : h('span', { class: 'fine' }, '-')), h('td', {}, s ? h('span', {}, h('b', {}, money(s.amount)), h('br'), h('span', { class: 'fine' }, SAFE_VERSIONS[s.version].label)) : h('span', { class: 'fine' }, '-')),
    h('td', {}, s ? h('span', { class: 'chip ' + SAFE_ST[s.status][1] }, SAFE_ST[s.status][0]) : '-'), h('td', {}, n ? r.viewedCount + '/' + API.SECTIONS.length : '-'), h('td', {}, r.me?.lastLogin ? fmtDate(r.me.lastLogin) : '-')); });
  const sel = h('select', { class: 'inp', style: 'max-width:200px;padding:9px 14px', onchange: e => { filter = e.target.value; render(); } }, h('option', { value: 'all' }, 'All statuses'), ...Object.entries(API.STATUS).map(([k, v]) => h('option', { value: k, selected: filter === k }, v)));
  const search = h('input', { class: 'inp', placeholder: 'Search name, email or code', value: q, oninput: e => { q = e.target.value; const pos = e.target.selectionStart; render(); const n = $('.bar-tools input'); n.focus(); n.setSelectionRange(pos, pos); } });
  return h('div', { class: 'adm' }, h('div', { class: 'eyebrow' }, 'Investor pipeline'), h('h1', {}, 'Investor ', h('span', { class: 'serif' }, 'dashboard')),
    h('div', { class: 'kpi-row' }, kpis.map(([a, b, c]) => h('div', { class: 'kpi' }, h('i', {}, a), h('b', {}, b), h('span', {}, c)))),
    h('div', { class: 'funnel' }, funnel.map(([l, k]) => { const n = atLeast(k); return h('div', { class: 'fstep' }, h('b', {}, n), h('span', {}, l), h('i', { style: 'width:' + (n / total * 100) + '%' })); })),
    h('div', { class: 'bar-tools' }, search, sel, h('span', { style: 'flex:1' }), h('button', { class: 'btn ghost sm', onclick: render }, '↻ Refresh'), h('button', { class: 'btn sm', onclick: () => download('tolpods-investors-' + new Date().toISOString().slice(0, 10) + '.csv', csv(list)) }, '⬇ Export CSV')),
    h('div', { class: 'tw' }, list.length ? h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['Investor', 'Status', 'Type', 'NDA', 'SAFE', 'SAFE status', 'Deck viewed', 'Last sign-in'].map(x => h('th', {}, x)))), h('tbody', {}, tbody)) : h('div', { class: 'empty' }, rows.length ? 'No investors match your filters.' : 'No investors yet. Create invitations from the Invites page.')));
}

function drawer() {
  $('.drawer')?.remove(); $('.drawer-back')?.remove(); if (!openEmail) return;
  const d = API.dashboard(), r = d.rows.find(x => x.invite.email === openEmail); if (!r) return;
  const m = r.me, p = m?.profile || {}, close = () => { openEmail = null; $('.drawer')?.remove(); $('.drawer-back')?.remove(); };
  const kv = pairs => h('dl', { class: 'kv' }, pairs.filter(Boolean).flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v ?? '-')]));
  const tick = d.tickets.filter(t => t.email === openEmail);
  const el = h('aside', { class: 'drawer', role: 'dialog', 'aria-label': 'Investor detail' },
    h('div', { style: 'display:flex;justify-content:space-between;gap:10px' }, h('div', {}, h('h2', {}, name(r)), h('span', { class: 'chip ' + CHIP[r.status] }, API.STATUS[r.status])), h('button', { class: 'x', 'aria-label': 'Close', onclick: close }, '×')),
    h('h4', {}, 'Contact'), kv([['Email', r.invite.email], ['Invite code', h('span', { class: 'code' }, r.invite.code)], ['Phone', p.phone], ['Contact email', p.contactEmail], ['Type', p.type]]),
    m && p.legalName ? [h('h4', {}, 'Details'), kv([['Legal name', p.legalName], ['Address', addrLine(p)], ['Address check', p.addrStatus ? h('span', { class: 'chip ' + (p.addrStatus === 'verified' ? 'good' : 'warn') }, p.addrStatus.replace(/-/g, ' ') + (p.addrProvider ? ' · ' + p.addrProvider : '')) : '-'], ...(p.type === 'entity' ? [['State of incorporation', p.stateInc], ['Place of business', p.placeBiz], ['Signing', `${p.signerName}, ${p.signerTitle}`]] : [])])] : null,
    h('h4', {}, 'Documents'),
    h('div', { class: 'acts' }, m?.nda ? h('button', { class: 'btn ghost sm', onclick: () => download(m.nda.id + '.pdf', m.nda.pdf) }, '⬇ NDA · ' + fmtDate(m.nda.at)) : h('span', { class: 'fine' }, 'NDA not signed yet'), m?.safe ? h('button', { class: 'btn ghost sm', onclick: () => download(m.safe.id + '.pdf', m.safe.pdf) }, '⬇ SAFE · ' + money(m.safe.amount)) : null),
    m?.nda ? h('p', { class: 'fine', style: 'margin-top:8px' }, 'NDA hash: ', h('span', { class: 'mono' }, m.nda.hash.slice(0, 20) + '…')) : null,
    m?.safe ? [h('h4', {}, 'SAFE'), kv([['Amount', h('b', {}, money(m.safe.amount))], ['Stage', m.safe.stage], ['Version', SAFE_VERSIONS[m.safe.version].label], m.safe.version === 'cap' ? ['Valuation cap', money(m.safe.terms.cap) + ' (≈' + m.safe.terms.pct + '%)'] : null, ['Signed', fmtDate(m.safe.at)], ['Status', h('select', { class: 'inp', style: 'padding:6px 10px', onchange: e => { API.setSafeStatus(m.email, e.target.value); toast('SAFE status updated'); render(); drawer(); } }, ...Object.entries(SAFE_ST).map(([k, v]) => h('option', { value: k, selected: m.safe.status === k }, v[0])))]])] : null,
    m ? [h('h4', {}, `Presentation progress (${r.viewedCount}/${API.SECTIONS.length})`), h('div', { class: 'secs' }, API.SECTIONS.map(s => h('span', { class: m.viewed?.[s] ? 'on' : '' }, s))), Object.keys(m.clicks || {}).length ? h('p', { class: 'fine', style: 'margin-top:8px' }, 'Clicks: ' + Object.entries(m.clicks).map(([k, v]) => `${k} ×${v}`).join(', ')) : null] : null,
    tick.length ? [h('h4', {}, 'Questions'), ...tick.map(t => h('div', { class: 'tick' }, h('div', { class: 'meta' }, fmtDate(t.createdAt) + ' · ' + t.status), t.message))] : null,
    m?.events?.length ? [h('h4', {}, 'Timeline'), h('ul', { class: 'tl' }, [...m.events].reverse().slice(0, 25).map(e => h('li', {}, e.type + (e.detail ? ': ' + e.detail : ''), h('small', {}, fmtDate(e.at)))))] : null);
  document.body.append(h('div', { class: 'drawer-back', onclick: close }), el);
}

function supportView(d) {
  const list = d.tickets;
  return h('div', { class: 'adm', style: 'max-width:860px' }, h('h1', {}, 'Support ', h('span', { class: 'serif' }, 'inbox')), h('p', {}, 'Questions and sign-in trouble sent by investors. Replying emails the investor.'),
    list.length ? list.map(t => { const ta = h('textarea', { class: 'inp', rows: 3, placeholder: 'Write a reply…' }); return h('div', { class: 'tick' },
      h('div', { class: 'meta' }, h('span', { class: 'chip ' + (t.kind === 'signin' ? 'warn' : '') }, t.kind === 'signin' ? 'Sign-in trouble' : 'Question'), ' ', h('span', { class: 'chip ' + (t.status === 'open' ? 'bad' : t.status === 'answered' ? 'good' : 'gray') }, t.status), ' ', `${t.name || ''} <${t.email}> · ${fmtDate(t.createdAt)} · ref ${t.id}`),
      h('div', {}, t.message), ...t.replies.map(r => h('div', { class: 'rep' }, h('small', { class: 'fine' }, r.by + ' · ' + fmtDate(r.at)), h('div', {}, r.text))),
      t.status !== 'closed' ? h('div', { style: 'margin-top:10px' }, ta, h('div', { class: 'acts', style: 'margin-top:8px' }, h('button', { class: 'btn sm', onclick: () => { const x = API.replyTicket(t.id, ta.value); if (!x.ok) return toast(x.error, 'err'); toast('Reply sent'); render(); } }, 'Send reply'), h('button', { class: 'btn ghost sm', onclick: () => { API.setTicketStatus(t.id, 'closed'); render(); } }, 'Mark resolved'))) : h('button', { class: 'btn ghost sm', onclick: () => { API.setTicketStatus(t.id, 'open'); render(); } }, 'Reopen')); }) : h('div', { class: 'empty card' }, 'No questions yet.'));
}
function activityView(d) {
  return h('div', { class: 'adm' }, h('h1', {}, 'Admin ', h('span', { class: 'serif' }, 'activity')), h('div', { class: 'tw' }, d.audit.length ? h('table', { class: 't' }, h('thead', {}, h('tr', {}, ['When', 'Who', 'Action', 'Detail'].map(x => h('th', {}, x)))), h('tbody', {}, d.audit.map(a => h('tr', {}, h('td', {}, fmtDate(a.at)), h('td', {}, a.actor), h('td', {}, h('span', { class: 'chip gray' }, a.action)), h('td', {}, a.detail))))) : h('div', { class: 'empty' }, 'Nothing yet.')));
}
function render() {
  me = API.session('admin') ? API.adminMe() : null;
  if (!me) { gate(); return; }
  const d = API.dashboard();
  app.replaceChildren(top(), tab === 'support' ? supportView(d) : tab === 'activity' ? activityView(d) : investorsView(d)); drawer();
}
addEventListener('focus', () => { if (me && !document.querySelector('textarea:focus')) render(); });
addEventListener('storage', () => { if (me && !document.querySelector('textarea:focus')) render(); });
render();
