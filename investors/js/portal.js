import { CONFIG } from './config.js';
import * as API from './api.js';
import * as D from './docs.js';
import { verifyAddress } from './address.js';
import { signaturePad } from './sign.js';
import { renderDeck, NAV } from './deck.js';
import { DECK } from './deckdata.js';
import { brand, mountMailbox, supportModal } from './ui.js';
import { h, $, $$, esc, toast, download, money, fmtDate, emailOk } from './util.js';

const app = $('#app');
const DIG = CONFIG.inviteCode.charset === 'digits';
let me = null, deckCtl = null;
const qs = new URLSearchParams(location.search);
const invite = { e: qs.get('e') || '', c: (qs.get('c') || '').toUpperCase() };
if (qs.has('e') || qs.has('c')) history.replaceState(null, '', location.pathname + location.hash);   // keep the code out of history
mountMailbox();

/* ---------------- shell ---------------- */
const STEPS = [['details', 'Your details'], ['nda', 'NDA'], ['deck', 'Presentation'], ['invest', 'Invest']];
function shell(body, { step, tools = true } = {}) {
  const idx = STEPS.findIndex(s => s[0] === step);
  const stepBtns = me ? STEPS.map(([k, l], i) => {
    const done = (k === 'details' && me.nda) || (k === 'nda' && me.nda) || (k === 'invest' && me.safe), lock = (k !== 'details' && !D_ok()) || ((k === 'deck' || k === 'invest') && !me.nda);
    return h('button', { class: 'stp' + (k === step ? ' on' : '') + (done ? ' done' : ''), disabled: lock, onclick: () => go(k), 'aria-current': k === step ? 'step' : null }, h('i', {}, done ? '✓' : String(i + 1)), h('span', {}, l));
  }) : [];
  const top = h('header', { class: 'top' }, h('div', { class: 'top-in' }, brand('Investors'), me ? h('nav', { class: 'steps', 'aria-label': 'Progress' }, stepBtns) : h('span', { class: 'sp' }), me ? h('span', { class: 'sp' }) : null,
    me && tools ? [h('span', { class: 'who' }, h('b', {}, me.email)), h('button', { class: 'btn ghost sm', onclick: () => supportModal({ kind: 'help', email: me.email, name: me.profile.signerName || me.name }) }, 'Help'), h('button', { class: 'btn ghost sm', onclick: signOut }, 'Sign out')] : null));
  app.replaceChildren(top, body);
}
const D_ok = () => !Object.keys(D.validateProfile(me.profile || {})).length;
function go(view) { location.hash = '#' + view; }
function signOut() { API.logout('investor'); me = null; location.hash = ''; render(); }
async function saveExit(profile) {
  if (profile && !me.nda) { const r = API.saveProfile(profile, { exit: true }); if (!r.ok) return toast(r.error, 'err'); }
  API.logout('investor'); const email = me.email; me = null; location.hash = '';
  shell(h('div', { class: 'wrap' }, h('div', { class: 'card center', style: 'text-align:center;padding:56px 28px' }, h('div', { style: 'font-size:44px' }, '✓'), h('h2', {}, 'Saved. See you soon.'), h('p', {}, 'Your progress is saved. Come back any time and sign in with your email and invitation code - we will take you right back to where you stopped.'), h('button', { class: 'btn', onclick: render }, 'Sign in again'))), { step: null });
}

/* ---------------- sign in ---------------- */
function loginView(stage = 1, ctx = {}) {
  const left = h('div', { class: 'login-l' }, h('div', {}, h('div', { class: 'eyebrow', style: 'color:var(--gold);margin-bottom:22px' }, 'Investors by invitation only'),
    h('h1', { html: 'Tolpods. <em>Our focus is on the people.</em>' }), h('p', {}, 'A private, secure space to review the Tolpods investment opportunity: the product, the projections and the terms.')),
    h('div', { class: 'fine' }, 'Confidential · NDA required'));
  let right;
  if (stage === 1) {
    const email = h('input', { class: 'inp', type: 'email', value: ctx.email ?? invite.e, placeholder: 'you@example.com', autocomplete: 'email', inputmode: 'email', 'aria-label': 'Email address' });
    const code = h('input', { class: 'inp code-inp', value: ctx.code ?? invite.c, maxlength: 5, placeholder: DIG ? '00000' : 'XXXXX', autocomplete: 'off', inputmode: DIG ? 'numeric' : 'text', pattern: DIG ? '[0-9]*' : null, autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Invitation code' });
    code.addEventListener('input', () => code.value = code.value.toUpperCase().replace(DIG ? /[^0-9]/g : /[^A-Z0-9]/g, ''));
    const err = h('div', { class: 'err-t', role: 'alert' }), btn = h('button', { class: 'btn lg', style: 'width:100%' }, 'Continue');
    const form = h('form', { onsubmit: async e => { e.preventDefault(); err.textContent = ''; btn.disabled = true; const r = await API.investorRequestCode(email.value, code.value); btn.disabled = false; if (!r.ok) { err.textContent = r.error; return; } loginView(2, { email: email.value.trim().toLowerCase(), code: code.value }); } },
      invite.e && invite.c ? h('div', { class: 'banner good' }, '✓ Your email and invitation code were filled in from your invitation. Tap Continue.') : null,
      h('div', { class: 'field' }, h('label', {}, 'Email address'), email), h('div', { class: 'field' }, h('label', {}, 'Invitation code'), code, h('span', { class: 'hint' }, DIG ? 'The 5-digit number from your invitation email. This is not the 6-digit code we email after you continue.' : 'The 5-character code from your invitation email.')), err, btn,
      h('p', { style: 'margin-top:18px;font-size:14px' }, h('button', { type: 'button', class: 'link', onclick: () => supportModal({ kind: 'signin', email: email.value }) }, 'Trouble with your code?')), h('p', { style: 'font-size:13.5px;color:var(--faint)' }, 'Tolpods team member? ', h('a', { href: 'admin.html' }, 'Admin sign in'), ' · ', h('a', { href: '../index.html' }, '← Back to tolpods.com')));
    right = h('div', { class: 'login-box' }, h('h2', {}, 'Sign in'), h('p', {}, 'Enter your email and invitation code. We will then email you a one-time verification code.'), form);
  } else {
    const boxes = Array.from({ length: CONFIG.otp.length }, (_, i) => h('input', { inputmode: 'numeric', maxlength: 1, autocomplete: i ? 'off' : 'one-time-code', 'aria-label': 'Digit ' + (i + 1) }));
    const err = h('div', { class: 'err-t', role: 'alert', style: 'text-align:center' }), btn = h('button', { class: 'btn lg', style: 'width:100%' }, 'Verify and sign in');
    boxes.forEach((b, i) => {
      b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, '').slice(-1); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); });
      b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
      b.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, ''); if (t.length > 1) { e.preventDefault(); boxes.forEach((x, j) => x.value = t[j] || ''); (boxes[Math.min(t.length, boxes.length) - 1]).focus(); } });
    });
    const resend = h('button', { type: 'button', class: 'link' }, 'Resend code'); let cd = CONFIG.otp.resendSec;
    const tick = () => { if (!resend.isConnected) return; resend.disabled = cd > 0; resend.textContent = cd > 0 ? `Resend code in ${cd}s` : 'Resend code'; if (cd-- > 0) setTimeout(tick, 1000); }; tick();
    resend.onclick = async () => { const r = await API.investorRequestCode(ctx.email, ctx.code); if (!r.ok) return toast(r.error, 'err'); cd = CONFIG.otp.resendSec; tick(); toast('A new code was sent'); };
    const form = h('form', { onsubmit: async e => { e.preventDefault(); err.textContent = ''; btn.disabled = true; const r = await API.investorVerify(ctx.email, ctx.code, boxes.map(b => b.value).join('')); btn.disabled = false; if (!r.ok) { err.textContent = r.error; boxes.forEach(b => b.value = ''); boxes[0].focus(); return; } me = API.investorMe(); toast('Signed in'); location.hash = ''; render(); } },
      h('div', { class: 'otp' }, boxes), err, btn,
      h('p', { style: 'text-align:center;margin-top:16px;font-size:14px' }, resend, ' · ', h('button', { type: 'button', class: 'link', onclick: () => loginView(1, ctx) }, 'Use a different email')),
      h('p', { style: 'text-align:center;font-size:14px' }, h('button', { type: 'button', class: 'link', onclick: () => supportModal({ kind: 'signin', email: ctx.email }) }, "Didn't get a code? Get help")));
    right = h('div', { class: 'login-box' }, h('h2', {}, 'Check your email'), h('p', {}, `We sent a ${CONFIG.otp.length}-digit code to `, h('b', {}, ctx.email), `. It expires in ${CONFIG.otp.ttlMin} minutes.`), CONFIG.mode === 'mock' ? h('div', { class: 'banner warn' }, 'Prototype: open the ✉ Dev mailbox (bottom right) to read your code.') : null, form);
    setTimeout(() => boxes[0].focus(), 50);
  }
  shell(h('div', { class: 'login' }, left, h('div', { class: 'login-r' }, right)), { step: null });
}

/* ---------------- step 1: details ---------------- */
function detailsView() {
  const locked = !!me.nda, p = { ...(me.profile || {}) }; p.contactEmail ||= me.email; p.country ||= 'United States';
  const inputs = {}; let tm = null, savedAt = 0;
  const status = h('span', { class: 'fine' }, '');
  const save = (exit) => { const r = API.saveProfile(p); if (r.ok) { savedAt = Date.now(); status.textContent = 'Saved ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } return r; };
  const auto = () => { if (locked) return; status.textContent = 'Saving…'; clearTimeout(tm); tm = setTimeout(save, 700); };
  const F = (key, label, o = {}) => {
    const el = h(o.area ? 'textarea' : 'input', { class: 'inp', value: p[key] || '', rows: o.area ? 2 : null, placeholder: o.ph || '', autocomplete: o.ac || 'off', inputmode: o.im || null, maxlength: o.max || null, readonly: locked || null, 'aria-label': label });
    if (o.area) el.textContent = p[key] || '';
    const er = h('div', { class: 'err-t', id: 'e-' + key, role: 'alert' });
    el.addEventListener('input', () => { p[key] = o.upper ? el.value.toUpperCase() : el.value; if (o.upper) el.value = p[key]; el.classList.remove('err'); er.textContent = ''; if (o.addr) { p.addrChecked = false; verifyBox.replaceChildren(); } auto(); });
    inputs[key] = el; return h('div', { class: 'field' + (o.cls ? ' ' + o.cls : '') }, h('label', {}, label), el, o.hint ? h('span', { class: 'hint' }, o.hint) : null, er);
  };
  const entityBox = h('div', { class: 'entity', hidden: p.type !== 'entity' },
    h('div', { class: 'row2' }, F('stateInc', "Entity's state of incorporation", { ph: 'e.g. Nevada' }), F('signerTitle', 'Your title in the entity', { ph: 'e.g. Managing Partner' })),
    F('signerName', 'Your name (the person signing for the entity)', { ac: 'name' }), F('placeBiz', "Entity's place of business", { area: true, ph: 'Street, city, state, ZIP' }));
  const typeTiles = h('div', { class: 'tiles', style: 'margin-bottom:18px' }, [['individual', 'Individual', 'Investing in your own name'], ['entity', 'Entity', 'A company, trust, fund or other entity']].map(([k, t, s]) => h('button', { type: 'button', class: 'tile' + (p.type === k ? ' on' : ''), disabled: locked || null, 'aria-pressed': p.type === k ? 'true' : 'false', onclick: e => { p.type = k; $$('.tile', typeTiles).forEach(x => x.classList.remove('on')); e.currentTarget.classList.add('on'); entityBox.hidden = k !== 'entity'; $('#e-type').textContent = ''; auto(); } }, h('b', {}, t), h('small', {}, s))));
  const verifyBox = h('div', {});
  const renderVerify = r => {
    verifyBox.replaceChildren(); if (!r) return;
    const ban = (cls, msg, extra) => verifyBox.append(h('div', { class: 'banner ' + cls }, h('div', {}, msg, extra ? [h('br'), extra] : null)));
    if (r.status === 'verified') { p.addrChecked = true; p.addrStatus = 'verified'; p.addrProvider = r.provider; ban('good', `✓ Address verified (${r.provider}).`); }
    else if (r.status === 'corrected') { p.addrChecked = false; ban('warn', `We found a slightly different version of this address (${r.provider}):`, h('span', {}, h('b', {}, [r.normalized.street, r.normalized.city, r.normalized.state, r.normalized.zip].join(', ')), ' ', h('button', { type: 'button', class: 'btn sm', onclick: () => { Object.assign(p, r.normalized); p.addrChecked = true; p.addrStatus = 'verified'; p.addrProvider = r.provider; ['street', 'city', 'state', 'zip'].forEach(k => inputs[k].value = p[k]); renderVerify({ status: 'verified', provider: r.provider }); auto(); } }, 'Use this address'), ' ', h('button', { type: 'button', class: 'btn ghost sm', onclick: () => { p.addrChecked = true; p.addrStatus = 'confirmed-as-entered'; p.addrProvider = r.provider; renderVerify({ status: 'confirmed' }); auto(); } }, 'Keep what I typed'))); }
    else if (r.status === 'invalid') { p.addrChecked = false; ban('bad', 'Please check the address:', h('ul', { style: 'margin:6px 0 0;padding-left:18px' }, r.errors.map(e => h('li', {}, e)))); }
    else if (r.status === 'confirmed') { ban('good', '✓ Address confirmed as entered.'); }
    else { /* unverified or format-only */ p.addrChecked = false; ban('warn', r.status === 'format-only' ? (r.note || 'We could not reach an address service.') : `We could not match this address (${r.provider}). Check for typos.`, h('button', { type: 'button', class: 'btn ghost sm', style: 'margin-top:8px', onclick: () => { p.addrChecked = true; p.addrStatus = r.status === 'format-only' ? 'format-only' : 'confirmed-as-entered'; p.addrProvider = r.provider; renderVerify({ status: 'confirmed' }); auto(); } }, 'It is correct - use it anyway')); }
    $('#e-addr') && ($('#e-addr').textContent = '');
  };
  const vbtn = h('button', { type: 'button', class: 'btn ghost', disabled: locked || null, onclick: async e => { const b = e.currentTarget; b.disabled = true; b.textContent = 'Verifying…'; const r = await verifyAddress(p); b.disabled = false; b.textContent = 'Verify address'; renderVerify(r); auto(); } }, 'Verify address');
  if (p.addrChecked) renderVerify(p.addrStatus === 'verified' ? { status: 'verified', provider: p.addrProvider || 'address service' } : { status: 'confirmed' });
  const err = h('div', { class: 'err-t', id: 'e-addr', role: 'alert' });
  const body = h('div', { class: 'wrap' }, h('div', { class: 'eyebrow' }, 'Step 1 of 4'), h('h1', {}, 'Tell us about ', h('span', { class: 'serif' }, 'you')), h('p', {}, 'We use these details to prepare your Non-Disclosure Agreement. You can save and finish later.'),
    locked ? h('div', { class: 'banner good' }, '🔒 Your details are locked because you signed the NDA. Contact us if something needs to change.') : null,
    h('div', { class: 'card' },
      h('div', { class: 'field' }, h('label', {}, 'Investor invitation code'), h('input', { class: 'inp', value: me.code, readonly: true, style: 'font-family:var(--mono);letter-spacing:.3em;max-width:200px' }), h('span', { class: 'lock' }, '🔒 Verified from your invitation')),
      h('div', { class: 'lbl', style: 'margin-bottom:8px' }, 'Are you an "Individual" or an "Entity"?'), typeTiles, h('div', { class: 'err-t', id: 'e-type' }),
      F('legalName', 'Your (or your entity\'s) legal name', { ac: 'name' }),
      entityBox,
      h('div', { class: 'lbl', style: 'margin:6px 0 8px' }, 'Your physical address'),
      F('street', 'Street address', { ac: 'address-line1', addr: true }), h('div', { class: 'row3' }, F('city', 'City', { ac: 'address-level2', addr: true }), F('state', 'State', { ac: 'address-level1', max: 2, upper: true, addr: true, ph: 'NV' }), F('zip', 'ZIP code', { ac: 'postal-code', im: 'numeric', max: 10, addr: true })), F('apt', 'Apartment / suite (optional)', { ac: 'address-line2', addr: true }),
      h('div', { style: 'margin:-4px 0 6px' }, vbtn), verifyBox, err,
      h('div', { class: 'lbl', style: 'margin:18px 0 8px' }, 'Your contact information'),
      h('div', { class: 'row2' }, F('phone', 'Phone number', { ac: 'tel', im: 'tel' }), F('contactEmail', 'Email address', { ac: 'email', im: 'email' }))),
    h('div', { class: 'actions' }, locked ? h('button', { class: 'btn', onclick: () => go('nda') }, 'View your NDA →') : [
      h('button', { class: 'btn ghost', onclick: () => saveExit(p) }, 'Save & exit'), status, h('span', { class: 'sp', style: 'flex:1' }),
      h('button', { class: 'btn', onclick: () => { const r = save(); if (!r.ok) return toast(r.error, 'err'); const errs = D.validateProfile(p); Object.entries(errs).forEach(([k, m]) => { const e = $('#e-' + k); if (e) e.textContent = m; inputs[k]?.classList.add('err'); }); const keys = Object.keys(errs); if (keys.length) { toast('Please fix the highlighted fields', 'err'); ($('#e-' + keys[0])?.closest('.field, .card'))?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; } me = API.investorMe(); go('nda'); } }, 'Save & continue to NDA →')]));
  shell(body, { step: 'details' });
}

/* ---------------- documents ---------------- */
const docHtml = doc => `${doc.legend ? `<p class="legend">${esc(doc.legend)}</p>` : ''}<h2 style="font:400 26px Georgia,serif;margin:0 0 4px;color:#222">${esc(doc.title)}</h2><p style="margin:0 0 14px;font-family:sans-serif;font-size:12.5px;color:#777">${esc(doc.subtitle)}</p><table>${doc.summary.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>${doc.parts.map(p => (p.h ? `<h4>${esc(p.h)}</h4>` : '') + p.p.map(t => `<p>${esc(t)}</p>`).join('')).join('')}${CONFIG.legalApproved ? '' : '<p style="font:12px sans-serif;color:#b04a3e;margin-top:18px">Template draft: not yet approved by counsel. Not legal advice.</p>'}`;
function readGate(box, onDone) { const chk = () => { if (box.scrollTop + box.clientHeight >= box.scrollHeight - 12) { onDone(); return true; } }; box.addEventListener('scroll', chk); setTimeout(chk, 200); }
const dl = (name, url) => h('button', { class: 'btn ghost', onclick: () => download(name + '.pdf', url) }, '⬇ Download ' + name + '.pdf');

/* ---------------- step 2: NDA ---------------- */
function ndaView() {
  const signed = !!me.nda;
  const doc = signed ? D.ndaDoc(me.nda.profile, me.nda.at, me.nda.id) : D.ndaDoc(me.profile, Date.now(), 'NDA-' + me.code);
  const box = h('div', { class: 'doc', tabindex: 0, 'aria-label': 'Non-Disclosure Agreement', html: docHtml(doc) });
  let body;
  if (signed) {
    body = h('div', { class: 'wrap' }, h('div', { class: 'eyebrow' }, 'Step 2 of 4'), h('h1', {}, 'Your NDA is ', h('span', { class: 'serif' }, 'signed')),
      h('div', { class: 'banner good' }, '🔒 Signed ', fmtDate(me.nda.at, true), '. This agreement can no longer be edited. A copy was emailed to ', h('b', {}, me.email), '.'),
      box, h('div', { class: 'actions' }, dl(me.nda.id, me.nda.pdf), h('span', { class: 'sp', style: 'flex:1' }), h('button', { class: 'btn', onclick: () => go('deck') }, 'Continue to the presentation →')));
  } else {
    const chk = h('input', { type: 'checkbox', disabled: true }), pad = h('div', {}), sigHost = pad; const sp = signaturePad(pad, { name: D.signerName(me.profile) || '' });
    const hint = h('div', { class: 'scrollhint' }, '↓ Scroll to the end of the agreement to continue');
    const btn = h('button', { class: 'btn lg', disabled: true }, 'Sign NDA & continue');
    const sync = () => { btn.disabled = !(chk.checked && !chk.disabled); };
    readGate(box, () => { chk.disabled = false; hint.textContent = '✓ You have read the whole agreement'; hint.style.color = 'var(--green-d)'; });
    chk.onchange = sync;
    btn.onclick = async () => { if (sp.isEmpty()) return toast('Please add your signature', 'err'); btn.disabled = true; btn.textContent = 'Signing…'; const r = await API.signNda({ sig: sp.get() }); if (!r.ok) { btn.disabled = false; btn.textContent = 'Sign NDA & continue'; return toast(r.error, 'err'); } sp.lock(); me = API.investorMe(); toast('NDA signed. A copy was emailed to you.'); ndaView(); window.scrollTo({ top: 0 }); };
    body = h('div', { class: 'wrap' }, h('div', { class: 'eyebrow' }, 'Step 2 of 4'), h('h1', {}, 'Review and sign the ', h('span', { class: 'serif' }, 'NDA')), h('p', {}, 'Open, review and sign this agreement before continuing. It is filled in from the details you gave us. ', h('button', { class: 'link', onclick: () => go('details') }, 'Edit my details'), '.'),
      box, hint,
      h('div', { class: 'card' }, h('label', { class: 'checkrow' }, chk, h('span', {}, 'I have read and agree to this Non-Disclosure Agreement, and I consent to sign it electronically.')), h('div', { class: 'lbl', style: 'margin:14px 0 8px' }, 'Your signature'), pad,
        h('p', { class: 'fine', style: 'margin-top:12px' }, 'After you sign, this document cannot be edited. A signed PDF copy is emailed to you.')),
      h('div', { class: 'actions' }, h('button', { class: 'btn ghost', onclick: () => saveExit() }, 'Save & exit'), h('span', { class: 'sp', style: 'flex:1' }), btn));
  }
  shell(body, { step: 'nda' });
}

/* ---------------- step 3: presentation ---------------- */
function deckView(anchor) {
  const nav = h('div', { class: 'deck-nav', id: 'deck-nav' }, h('div', { class: 'deck-nav-in' }, NAV.map(([id, l]) => h('a', { href: '#deck/' + id, 'data-s': id, onclick: e => { e.preventDefault(); history.replaceState(null, '', '#deck/' + id); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); } }, l))), h('div', { class: 'deck-prog' }, h('i')));
  const root = h('div', { id: 'deck-root' });
  shell(h('div', {}, nav, root), { step: 'deck' });
  nav.style.top = $('.top').offsetHeight + 'px';
  const settings = API.publicSettings();
  deckCtl?.destroy();
  deckCtl = renderDeck(root, {
    me, settings, productHref: '../explorer.html?return=' + encodeURIComponent('investors/index.html#deck/product'),
    onInvest: () => go('invest'), onHelp: () => supportModal({ kind: 'help', email: me.email, name: me.profile.signerName || me.name }),
    onTrack: k => { if (k.startsWith('view:')) API.markViewed(k.slice(5)); else API.click(k); }
  });
  const bar = $('.deck-prog i'), upd = () => { const t = document.documentElement.scrollHeight - innerHeight; bar.style.width = (t > 0 ? scrollY / t * 100 : 0) + '%'; };
  addEventListener('scroll', upd, { passive: true }); upd();
  if (anchor) setTimeout(() => document.getElementById(anchor)?.scrollIntoView(), 60); else window.scrollTo({ top: 0 });
}

/* ---------------- step 4: invest (SAFE) ---------------- */
function investView() {
  if (me.safe) return doneView();
  const dr = me.draft || {}; const st = { stage: dr.stage || 'Stage 1', opt: dr.opt ?? 0, custom: dr.custom || '', version: dr.version || 'cap' };
  const draftSave = () => API.saveDraft(st);
  const preview = h('div', { class: 'doc', tabindex: 0 }), sumBox = h('div', { class: 'sumbox' });
  const stageTabs = h('div', { class: 'seg-row' }), optBox = h('div', { class: 'tiles' }), verBox = h('div', { class: 'tiles' });
  const amountNow = () => st.opt === 'custom' ? Math.round(Number(String(st.custom).replace(/[^\d.]/g, ''))) || 0 : DECK.options[st.stage].items[st.opt]?.[0] || 0;
  const terms = () => D.safeTerms(DECK.options[st.stage], st.opt === 'custom' ? -1 : st.opt, amountNow(), st.version);
  let gate = false; const chk = h('input', { type: 'checkbox' }), btn = h('button', { class: 'btn gold lg' }, 'Sign SAFE & submit'); const hint = h('div', { class: 'scrollhint' }, '↓ Scroll to the end of the SAFE to continue');
  const drawStages = () => stageTabs.replaceChildren(...Object.keys(DECK.options).map(sn => h('button', { type: 'button', class: 'seg' + (st.stage === sn ? ' on' : ''), onclick: () => { st.stage = sn; st.opt = 0; draftSave(); drawAll(); } }, sn)));
  const drawOpts = () => { const s = DECK.options[st.stage]; optBox.replaceChildren(...s.items.map((it, i) => h('button', { type: 'button', class: 'tile' + (st.opt === i ? ' on' : ''), onclick: () => { st.opt = i; draftSave(); drawAll(); } }, h('b', {}, money(it[0])), h('small', {}, `for ${it[1]}% · ${money(Math.round(it[0] / it[1] * 100))} cap`))),
    h('div', { class: 'tile' + (st.opt === 'custom' ? ' on' : ''), onclick: () => { st.opt = 'custom'; draftSave(); drawAll(); setTimeout(() => $('#custom-amt')?.focus(), 30); }, role: 'button', tabindex: 0 }, h('b', {}, 'Other amount'), st.opt === 'custom' ? h('input', { id: 'custom-amt', class: 'inp', inputmode: 'numeric', placeholder: '$ amount (min $10,000)', value: st.custom, style: 'margin-top:8px', oninput: e => { st.custom = e.target.value; draftSave(); drawPrev(); } }) : h('small', {}, 'Min $10,000')));
    $('#stage-note').textContent = s.note + ' · seed target ' + money(s.target); };
  const drawVers = () => verBox.replaceChildren(...Object.entries(D.SAFE_VERSIONS).map(([k, v]) => h('button', { type: 'button', class: 'tile' + (st.version === k ? ' on' : ''), onclick: () => { st.version = k; draftSave(); drawAll(); } }, h('b', {}, v.label), h('small', {}, v.blurb))));
  const drawPrev = () => {
    const t = terms(), inv = { stage: st.stage, stageName: st.stage + ' seed round', version: st.version, terms: t };
    preview.innerHTML = docHtml(D.safeDoc(me.profile, inv, Date.now(), 'SAFE-' + me.code));
    sumBox.innerHTML = `<div class="eyebrow">Your investment</div><div class="sum-amt">${t.amount ? money(t.amount) : '$-'}</div><dl><dt>Stage</dt><dd>${esc(st.stage)}</dd><dt>SAFE version</dt><dd>${esc(D.SAFE_VERSIONS[st.version].label)}</dd>${st.version === 'cap' && t.amount ? `<dt>Valuation cap</dt><dd>${money(t.cap)}</dd><dt>Approx. ownership</dt><dd>${t.pct}%</dd>` : ''}${st.version === 'discount' ? '<dt>Discount</dt><dd>20%</dd>' : ''}<dt>NDA</dt><dd>✓ Signed</dd></dl>`;
    ok();
  };
  const ok = () => { const a = amountNow(); btn.disabled = !(a >= 10000 && chk.checked && gate); };
  const drawAll = () => { drawStages(); drawOpts(); drawVers(); drawPrev(); };
  chk.onchange = ok; const pad = h('div', {}), sp = signaturePad(pad, { name: D.signerName(me.profile) });
  readGate(preview, () => { gate = true; hint.textContent = '✓ You have read the whole SAFE'; hint.style.color = 'var(--green-d)'; ok(); });
  // preview re-renders reset scroll; re-gate on scroll
  preview.addEventListener('scroll', () => { if (preview.scrollTop + preview.clientHeight >= preview.scrollHeight - 12) { gate = true; hint.textContent = '✓ You have read the whole SAFE'; hint.style.color = 'var(--green-d)'; ok(); } });
  btn.onclick = async () => {
    if (sp.isEmpty()) return toast('Please add your signature', 'err'); const t = terms();
    btn.disabled = true; btn.textContent = 'Submitting…';
    const r = await API.submitSafe({ stage: st.stage, optIdx: st.opt === 'custom' ? -1 : st.opt, amount: t.amount, version: st.version, accredited: chk.checked, sig: sp.get() });
    if (!r.ok) { btn.disabled = false; btn.textContent = 'Sign SAFE & submit'; return toast(r.error, 'err'); }
    me = API.investorMe(); doneView(true);
  };
  const body = h('div', { class: 'wrap wide' }, h('div', { class: 'eyebrow' }, 'Step 4 of 4'), h('h1', {}, 'Ready to ', h('span', { class: 'serif' }, 'invest')),
    h('div', { class: 'flow' }, h('span', { class: 'chip good' }, '✓ NDA signed'), h('i', {}, '→'), h('span', { class: 'chip gold' }, 'SAFE'), h('i', {}, '→'), h('span', { class: 'chip gray' }, 'Copies emailed to you')),
    h('div', { class: 'invest-grid' }, h('div', {},
      h('div', { class: 'card' }, h('h3', {}, '1. How much would you like to invest?'), stageTabs, h('p', { id: 'stage-note', class: 'fine', style: 'margin:0 0 12px' }), optBox),
      h('div', { class: 'card', style: 'margin-top:18px' }, h('h3', {}, '2. Choose your SAFE version'), verBox),
      h('div', { class: 'card', style: 'margin-top:18px' }, h('h3', {}, '3. Review your SAFE'), preview, hint),
      h('div', { class: 'card', style: 'margin-top:18px' }, h('h3', {}, '4. Confirm and sign'),
        h('label', { class: 'checkrow' }, chk, h('span', {}, 'I confirm that I am an accredited investor, I have read the SAFE and the investor presentation, I understand this is a high-risk, illiquid investment, and I consent to sign electronically.')),
        h('div', { class: 'lbl', style: 'margin:14px 0 8px' }, 'Your signature'), pad, h('p', { class: 'fine', style: 'margin-top:12px' }, 'The SAFE is not effective until the Company countersigns and receives your funds. We will email you the signed SAFE and your NDA, and send wire instructions separately.'))),
      h('aside', {}, h('div', { class: 'sticky' }, sumBox, btn, h('button', { class: 'btn ghost', style: 'width:100%;margin-top:10px', onclick: () => { API.saveDraft(st); saveExit(); } }, 'Save & exit'), h('button', { class: 'btn ghost', style: 'width:100%;margin-top:10px', onclick: () => supportModal({ kind: 'help', email: me.email, name: me.name }) }, 'Have a question?')))));
  shell(body, { step: 'invest' }); drawAll();
}
function doneView(fresh) {
  const s = me.safe, n = me.nda;
  shell(h('div', { class: 'wrap' }, h('div', { class: 'card', style: 'text-align:center;padding:48px 28px' },
    h('div', { style: 'font-size:46px' }, '✓'), h('h1', {}, 'Thank you, ', h('span', { class: 'serif' }, me.profile.signerName || me.profile.legalName)),
    h('p', { style: 'font-size:18px' }, fresh ? 'Your SAFE and NDA have been sent to ' : 'Your SAFE and NDA were sent to ', h('b', {}, me.email), '.'),
    h('div', { class: 'recap' }, h('div', {}, h('i', {}, 'Amount'), h('b', {}, money(s.amount))), h('div', {}, h('i', {}, 'SAFE version'), h('b', {}, D.SAFE_VERSIONS[s.version].label)), s.version === 'cap' ? h('div', {}, h('i', {}, 'Valuation cap'), h('b', {}, money(s.terms.cap))) : null, h('div', {}, h('i', {}, 'Signed'), h('b', {}, fmtDate(s.at)))),
    h('div', { class: 'actions', style: 'justify-content:center;flex-wrap:wrap' }, dl(s.id, s.pdf), dl(n.id, n.pdf)),
    h('h3', { style: 'margin-top:36px' }, 'What happens next'), h('ol', { class: 'next' }, h('li', {}, 'A member of the Tolpods team reviews and countersigns your SAFE.'), h('li', {}, 'We email you wire instructions and the countersigned copy.'), h('li', {}, 'Your SAFE becomes effective when the Company countersigns and funds are received.')),
    h('p', { class: 'fine' }, 'Questions? Use Help at the top, or ', h('button', { class: 'link', onclick: () => go('deck/questions') }, 'schedule a call'), '.'), h('button', { class: 'btn ghost', onclick: () => go('deck') }, '← Back to the presentation'))), { step: 'invest' });
  window.scrollTo({ top: 0 });
}

/* ---------------- router ---------------- */
function render() {
  me = API.session('investor') ? API.investorMe() : null;
  if (!me) { loginView(1); return; }
  const [view, anchor] = location.hash.slice(1).split('/');
  const ready = D_ok(), signed = !!me.nda;
  let v = view || (me.safe ? 'invest' : signed ? 'deck' : ready ? 'nda' : 'details');
  if (!ready && v !== 'details') v = 'details';
  if ((v === 'deck' || v === 'invest') && !signed) v = ready ? 'nda' : 'details';
  if (v === 'nda' && !ready) v = 'details';
  if (!['details', 'nda', 'deck', 'invest'].includes(v)) v = 'details';
  if (v === 'details') detailsView(); else if (v === 'nda') ndaView(); else if (v === 'deck') deckView(anchor); else investView();
  if (v !== 'deck') { deckCtl?.destroy(); deckCtl = null; if (view) window.scrollTo({ top: 0 }); }
  document.title = 'Tolpods Investors';
}
addEventListener('hashchange', () => { if (API.session('investor')) render(); });
setInterval(() => { if (!API.session('investor') && me) { me = null; render(); } }, 15000);
render();
