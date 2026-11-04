/* Backend API. In 'mock' mode this runs entirely in the browser against store.js.
   In 'live' mode, replace the bodies with fetch() calls to CONFIG.liveApiBase (same function names and return shapes).
   NOTE: in a real deployment, OTP issue/verify, invite lookup, PDF generation and e-mail sending MUST run on the server. */
import { CONFIG } from './config.js';
import * as S from './store.js';
import { sha256, norm, emailOk, money } from './util.js';
import * as D from './docs.js';
import { DECK } from './deckdata.js';

const CODE_CHARS = CONFIG.inviteCode.charset === 'digits' ? '0123456789' : 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // alnum: no 0/O/1/I
const rnd = n => crypto.getRandomValues(new Uint32Array(n));
const uid = () => Array.from(rnd(3), x => x.toString(36)).join('');
const db = () => S.load();
const ok = (x = {}) => ({ ok: true, ...x });
const fail = (error, extra = {}) => ({ ok: false, error, ...extra });

/* ---------- sessions ---------- */
const SK = r => 'tp_inv_session_' + r;
export function session(role) { try { const s = JSON.parse(sessionStorage.getItem(SK(role))); if (s && s.exp > Date.now()) return s; } catch { } return null; }
function startSession(role, email) { sessionStorage.setItem(SK(role), JSON.stringify({ role, email, exp: Date.now() + CONFIG.sessionMin * 60000 })); }
export const logout = role => { try { sessionStorage.removeItem(SK(role)); } catch { } };
const needAdmin = () => { const s = session('admin'); if (!s) throw new Error('Not signed in'); const a = db().admins.find(a => a.email === s.email); if (!a) throw new Error('Not an admin'); return a; };
const needInvestor = () => { const s = session('investor'); if (!s) throw new Error('Not signed in'); const i = db().investors[s.email]; if (!i) throw new Error('No investor record'); return i; };

/* ---------- audit + mail ---------- */
export function audit(actor, action, detail = '') { const d = db(); d.audit.unshift({ at: Date.now(), actor, action, detail }); d.audit.length = Math.min(d.audit.length, 400); S.save(); }
const ev = (inv, type, detail = '') => { inv.events.push({ at: Date.now(), type, detail }); if (inv.events.length > 200) inv.events.shift(); };
export function sendMail({ to, subject, text, attachments = [], kind = 'general' }) {
  const d = db(); d.outbox.unshift({ id: uid(), from: CONFIG.fromEmail, to, subject, text, attachments, kind, at: Date.now() });
  while (JSON.stringify(d.outbox).length > 2.2e6 && d.outbox.length > 4) d.outbox.pop();
  S.save();   // live mode: POST to your mail service (Resend / SendGrid) here
}
const adminEmails = () => db().admins.map(a => a.email);

/* ---------- one-time codes ---------- */
async function issueOtp(scope, email, who) {
  const d = db(), key = scope + ':' + email, prev = d.otps[key];
  if (prev && Date.now() - prev.sentAt < CONFIG.otp.resendSec * 1000) return { wait: Math.ceil((CONFIG.otp.resendSec * 1000 - (Date.now() - prev.sentAt)) / 1000) };
  const code = Array.from(rnd(CONFIG.otp.length), x => x % 10).join('');
  d.otps[key] = { h: await sha256(code + ':' + email), exp: Date.now() + CONFIG.otp.ttlMin * 60000, tries: 0, sentAt: Date.now() };
  S.save();
  sendMail({ to: email, kind: 'otp', subject: `Your Tolpods ${scope === 'admin' ? 'admin' : 'investor'} sign-in code: ${code}`, text: `Hello${who ? ' ' + who : ''},\n\nYour one-time sign-in code is:\n\n    ${code}\n\nIt expires in ${CONFIG.otp.ttlMin} minutes. If you did not request it, you can ignore this email.\n\n- Tolpods` });
  return {};
}
async function checkOtp(scope, email, code) {
  const d = db(), key = scope + ':' + email, o = d.otps[key];
  if (!o) return false; if (Date.now() > o.exp || o.tries >= CONFIG.otp.maxTries) { delete d.otps[key]; S.save(); return false; }
  o.tries++; S.save();
  if (o.h !== await sha256(String(code).trim() + ':' + email)) return false;
  delete d.otps[key]; S.save(); return true;
}

/* ---------- admin auth ---------- */
export async function adminRequestCode(email) {
  email = norm(email); if (!emailOk(email)) return fail('Enter a valid email address.');
  const a = db().admins.find(x => x.email === email);
  if (a) { const r = await issueOtp('admin', email, a.name); if (r.wait) return fail('Please wait ' + r.wait + 's before requesting another code.'); }
  return ok();   // same answer whether or not the address is an admin
}
export async function adminVerify(email, code) {
  email = norm(email);
  if (!(await checkOtp('admin', email, code))) return fail('That code is wrong or has expired.');
  startSession('admin', email); audit(email, 'admin.login'); return ok();
}
export const adminMe = () => { try { return needAdmin(); } catch { return null; } };

/* ---------- admin: users ---------- */
export const listAdmins = () => { needAdmin(); return db().admins; };
export function addAdmin({ name, email, role }) {
  const me = needAdmin(); email = norm(email);
  if (!name?.trim() || !emailOk(email)) return fail('Enter a name and a valid email.');
  const d = db(); if (d.admins.some(a => a.email === email)) return fail('That person is already an admin.');
  d.admins.push({ name: name.trim(), email, role: role === 'owner' ? 'owner' : 'admin', addedBy: me.email, addedAt: Date.now() }); S.save();
  audit(me.email, 'admin.add', email); return ok();
}
export function removeAdmin(email) {
  const me = needAdmin(); const d = db();
  if (email === me.email) return fail("You can't remove yourself.");
  if (d.admins.length <= 1) return fail('At least one admin is required.');
  d.admins = d.admins.filter(a => a.email !== email); S.save(); audit(me.email, 'admin.remove', email); return ok();
}

/* ---------- admin: invites ---------- */
function newCode() { const d = db(); for (; ;) { const c = Array.from(rnd(CONFIG.inviteCode.length), x => CODE_CHARS[x % CODE_CHARS.length]).join(''); if (!d.invites.some(i => i.code === c)) return c; } }
export const listInvites = () => { needAdmin(); return db().invites; };
export function createInvite({ name, email, note }) {
  const me = needAdmin(); email = norm(email);
  if (!name?.trim() || !emailOk(email)) return fail('Enter the investor\'s name and a valid email.');
  const d = db(); if (d.invites.some(i => i.email === email && i.status !== 'revoked')) return fail('That email already has an active invitation.');
  const inv = { code: newCode(), name: name.trim(), email, note: note || '', status: 'invited', createdAt: Date.now(), createdBy: me.email, sentAt: null, sendCount: 0 };
  d.invites.unshift(inv); S.save(); audit(me.email, 'invite.create', email + ' ' + inv.code); return ok({ invite: inv });
}
export function inviteLink(inv, base) {
  const u = new URL('index.html', base || location.href); u.searchParams.set('e', inv.email); u.searchParams.set('c', inv.code); return u.href;
}
function mailInvite(inv, base, sender) {
  const link = inviteLink(inv, base);
  sendMail({ to: inv.email, kind: 'invite', subject: 'You are invited: Tolpods investor presentation', text: `Hello ${inv.name},\n\nYou have been invited to review the Tolpods investor presentation (by invitation only).\n\nYour invitation code: ${inv.code}\n\nClick to start - your email and code are filled in for you:\n${link}\n\nOr go to the investor sign-in page and enter this email address and the 5-digit invitation code above. For your security we will then email a one-time verification code each time you sign in.\n\nHaving trouble? Use "Trouble with your code?" on the sign-in page, or reply to this email.\n\n- ${sender}, Tolpods` });
  inv.sentAt = Date.now(); inv.sendCount++; S.save();
}
export function sendInvite(code, base) {
  const me = needAdmin(), inv = db().invites.find(i => i.code === code); if (!inv) return fail('Invitation not found.');
  if (inv.status === 'revoked') return fail('That invitation was revoked.');
  mailInvite(inv, base, me.name); audit(me.email, 'invite.send', inv.email); return ok();
}
/* Prototype only: one click creates a sample investor invitation so the investor flow can be tried without the admin screens. */
export function createDemoInvite(base) {
  if (CONFIG.mode !== 'mock') return fail('Demo invites are only available in prototype mode.');
  const d = db(); let n = 1, email; do { email = `demo${n === 1 ? '' : n}@example.com`; n++; } while (d.invites.some(i => i.email === email && i.status !== 'revoked'));
  const inv = { code: newCode(), name: 'Demo Investor', email, note: 'Sample invite from Dev mailbox', status: 'invited', createdAt: Date.now(), createdBy: 'demo', sentAt: null, sendCount: 0 };
  d.invites.unshift(inv); S.save(); mailInvite(inv, base, 'KJ'); audit('demo', 'invite.demo', email + ' ' + inv.code); return ok({ invite: inv });
}
export function revokeInvite(code) { const me = needAdmin(), i = db().invites.find(x => x.code === code); if (!i) return fail('Not found.'); i.status = 'revoked'; S.save(); audit(me.email, 'invite.revoke', i.email); return ok(); }

/* ---------- investor auth ---------- */
export async function investorRequestCode(email, code) {
  email = norm(email); code = String(code || '').trim().toUpperCase();
  if (!emailOk(email) || !/^[A-Z0-9]{5}$/.test(code)) return fail(CONFIG.inviteCode.charset === 'digits' ? 'Enter your email and the 5-digit invitation code.' : 'Enter your email and the 5-character invitation code.');
  const inv = db().invites.find(i => i.code === code && i.email === email && i.status !== 'revoked');
  if (!inv) return fail("That email and invitation code don't match. Check your invitation, or tap \"Trouble with your code?\".");
  const r = await issueOtp('investor', email, inv.name); if (r.wait) return fail('Please wait ' + r.wait + 's before requesting another code.');
  return ok();
}
export async function investorVerify(email, code, otp) {
  email = norm(email); code = String(code || '').trim().toUpperCase();
  const d = db(), inv = d.invites.find(i => i.code === code && i.email === email && i.status !== 'revoked');
  if (!inv || !(await checkOtp('investor', email, otp))) return fail('That code is wrong or has expired.');
  let me = d.investors[email];
  if (!me) { me = d.investors[email] = { email, code, name: inv.name, profile: { contactEmail: email }, nda: null, safe: null, viewed: {}, clicks: {}, events: [], createdAt: Date.now() }; ev(me, 'first-login'); }
  inv.status = 'active'; me.lastLogin = Date.now(); ev(me, 'login'); S.save(); startSession('investor', email); return ok();
}
export const investorMe = () => { try { return needInvestor(); } catch { return null; } };

/* ---------- investor: details / NDA ---------- */
export function saveProfile(profile, { exit = false } = {}) {
  const me = needInvestor(); if (me.nda) return fail('Your details are locked because the NDA has been signed.');
  me.profile = { ...me.profile, ...profile }; ev(me, exit ? 'save-exit' : 'save-details'); S.save(); return ok();
}
async function signCommon(me, doc, sigIn, kind) {
  const when = Date.now();
  const hash = await sha256(D.docText(doc) + '|' + sigIn.image.length + '|' + when + '|' + me.email);
  const pdf = await D.makePdf(doc, { image: sigIn.image, method: sigIn.method, name: sigIn.typed || D.signerName(me.profile), role: me.profile.type === 'entity' ? me.profile.signerTitle + ', ' + me.profile.legalName : 'Individual', when, email: me.email, hash });
  return { id: doc.id, at: when, hash, pdf, method: sigIn.method, signature: sigIn.image.length < 40000 ? sigIn.image : null, kind };
}
export async function signNda({ sig }) {
  const me = needInvestor(); if (me.nda) return fail('The NDA is already signed.');
  const errs = D.validateProfile(me.profile); if (Object.keys(errs).length) return fail('Please complete your details first.');
  if (!sig?.image) return fail('Please add your signature.');
  const id = 'NDA-' + me.code + '-' + new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const doc = D.ndaDoc(me.profile, Date.now(), id);
  me.nda = await signCommon(me, doc, sig, 'NDA'); me.nda.profile = { ...me.profile };
  ev(me, 'nda-signed', id); S.save();
  const att = [{ name: id + '.pdf', dataUrl: me.nda.pdf }];
  sendMail({ to: me.email, kind: 'nda', attachments: att, subject: 'Your signed Tolpods NDA (copy attached)', text: `Hello ${me.name},\n\nThank you for signing the Tolpods Non-Disclosure Agreement. A copy is attached for your records.\n\nYou can now continue to the investor presentation.\n\n- Tolpods` });
  for (const a of adminEmails()) sendMail({ to: a, kind: 'admin-nda', attachments: att, subject: `NDA signed: ${me.profile.legalName}`, text: `${me.profile.legalName} (${me.email}, code ${me.code}) signed the NDA.\nDocument: ${id}` });
  return ok({ id });
}

export function saveDraft(draft) { try { const me = needInvestor(); me.draft = { ...(me.draft || {}), ...draft }; S.save(); } catch { } }

/* ---------- investor: presentation tracking ---------- */
export function markViewed(section) { try { const me = needInvestor(); if (!me.nda) return; if (!me.viewed[section]) { me.viewed[section] = Date.now(); S.save(); } } catch { } }
export function click(kind) { try { const me = needInvestor(); me.clicks[kind] = (me.clicks[kind] || 0) + 1; ev(me, 'click', kind); S.save(); } catch { } }

/* ---------- investor: SAFE ---------- */
export async function submitSafe({ stage, optIdx, amount, version, accredited, sig }) {
  const me = needInvestor(); if (!me.nda) return fail('Please sign the NDA first.'); if (me.safe) return fail('Your SAFE has already been submitted.');
  const st = DECK.options[stage]; if (!st) return fail('Choose an investment stage.');
  amount = Math.round(Number(amount)); if (!(amount >= 10000)) return fail('The minimum investment is $10,000.');
  if (!D.SAFE_VERSIONS[version]) return fail('Choose a SAFE version.');
  if (!accredited) return fail('Please confirm the investor representations.');
  if (!sig?.image) return fail('Please add your signature.');
  const terms = D.safeTerms(st, optIdx, amount, version);
  const invest = { stage, stageName: stage + ' seed round', optIdx, version, terms, accredited: true };
  const id = 'SAFE-' + me.code + '-' + new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const doc = D.safeDoc(me.profile, invest, Date.now(), id);
  me.safe = { ...(await signCommon(me, doc, sig, 'SAFE')), ...invest, amount: terms.amount, status: 'awaiting-countersign' };
  ev(me, 'safe-signed', `${money(amount)} ${version}`); S.save();
  const att = [{ name: me.nda.id + '.pdf', dataUrl: me.nda.pdf }, { name: id + '.pdf', dataUrl: me.safe.pdf }];
  sendMail({ to: me.email, kind: 'safe', attachments: att, subject: 'Your signed SAFE and NDA (copies attached)', text: `Hello ${me.name},\n\nThank you. We received your signed SAFE for ${money(amount)} (${D.SAFE_VERSIONS[version].label}). Copies of your signed SAFE and NDA are attached.\n\nNext steps: a member of the Tolpods team will countersign and send wire instructions separately. Your SAFE is not effective until the Company countersigns and funds are received.\n\n- Tolpods` });
  for (const a of adminEmails()) sendMail({ to: a, kind: 'admin-safe', attachments: att, subject: `SAFE signed: ${me.profile.legalName} - ${money(amount)}`, text: `${me.profile.legalName} (${me.email}) signed a SAFE.\nAmount: ${money(amount)}\nStage: ${stage}\nVersion: ${D.SAFE_VERSIONS[version].label}${version === 'cap' ? '\nCap: ' + money(terms.cap) : ''}` });
  return ok({ id });
}

/* ---------- support ---------- */
export function createTicket({ name, email, kind, message }) {
  email = norm(email); if (!emailOk(email) || !message?.trim()) return fail('Enter your email and a message.');
  const d = db(); const t = { id: uid().toUpperCase(), name: (name || '').trim(), email, kind: kind || 'help', message: message.trim().slice(0, 4000), createdAt: Date.now(), status: 'open', replies: [] };
  d.tickets.unshift(t); S.save();
  sendMail({ to: email, kind: 'support-receipt', subject: 'We received your message (ref ' + t.id + ')', text: `Hello ${t.name || ''},\n\nWe received your message and a member of the team will reply by email.\n\nYour message:\n${t.message}\n\nReference: ${t.id}\n\n- Tolpods` });
  for (const a of adminEmails()) sendMail({ to: a, kind: 'admin-ticket', subject: `Investor ${t.kind === 'signin' ? 'sign-in trouble' : 'question'}: ${t.email}`, text: `${t.name} <${t.email}> (${t.kind}):\n\n${t.message}\n\nOpen the dashboard to reply (ref ${t.id}).` });
  const inv = d.investors[email]; if (inv) { ev(inv, 'ticket', t.id); S.save(); }
  return ok({ id: t.id });
}
export const listTickets = () => { needAdmin(); return db().tickets; };
export function replyTicket(id, text) {
  const me = needAdmin(), t = db().tickets.find(x => x.id === id); if (!t || !text.trim()) return fail('Enter a reply.');
  t.replies.push({ at: Date.now(), by: me.email, text: text.trim() }); t.status = 'answered'; S.save();
  sendMail({ to: t.email, kind: 'support-reply', subject: 'Re: your question (ref ' + t.id + ')', text: text.trim() + '\n\n- ' + me.name + ', Tolpods' }); audit(me.email, 'ticket.reply', id); return ok();
}
export function setTicketStatus(id, status) { const me = needAdmin(), t = db().tickets.find(x => x.id === id); if (t) { t.status = status; S.save(); audit(me.email, 'ticket.' + status, id); } return ok(); }

/* ---------- dashboard ---------- */
export const STATUS = { invited: 'Invited', revoked: 'Revoked', signedin: 'Signed in', details: 'Details saved', nda: 'NDA signed', reviewing: 'Reviewing deck', safe: 'SAFE signed' };
export const SECTIONS = ['overview', 'market', 'product', 'cashflow', 'roi', 'capital', 'options', 'questions'];
export function statusOf(inv, me) {
  if (inv.status === 'revoked') return 'revoked';
  if (!me) return 'invited';
  if (me.safe) return 'safe'; if (me.nda) return Object.keys(me.viewed || {}).length ? 'reviewing' : 'nda';
  return me.profile?.legalName ? 'details' : 'signedin';
}
export function dashboard() {
  needAdmin(); const d = db();
  const rows = d.invites.map(inv => { const me = d.investors[inv.email]; const st = statusOf(inv, me); return { invite: inv, me, status: st, viewedCount: me ? Object.keys(me.viewed || {}).length : 0 }; });
  const committed = rows.reduce((s, r) => s + (r.me?.safe?.amount || 0), 0);
  return { rows, committed, tickets: d.tickets, audit: d.audit, outbox: d.outbox.length };
}
export function setSafeStatus(email, status) { const me = needAdmin(), i = db().investors[email]; if (i?.safe) { i.safe.status = status; ev(i, 'safe-status', status); S.save(); audit(me.email, 'safe.status', email + ' ' + status); } return ok(); }
/* Scheduling is generic: "Investment questions" and "Product questions". Older saved settings (CEO / CTO) are mapped onto these. */
const CAL_DEFAULT = CONFIG.calendar;
const normCal = cal => CAL_DEFAULT.map((d, i) => { const c = (cal || []).find(x => x.id === d.id) || (cal || [])[i] || {}; return { id: d.id, label: d.label, blurb: d.blurb, calendly: /YOUR-/i.test(c.calendly || '') ? '' : (c.calendly || ''), google: c.google || '' }; });
const withCal = s => ({ ...s, calendar: normCal(s.calendar) });
export const getSettings = () => withCal(db().settings);
export function saveSettings(s) { const me = needAdmin(); db().settings = { ...db().settings, ...s }; S.save(); audit(me.email, 'settings.save'); return ok(); }
export const publicSettings = () => withCal(db().settings);

/* ---------- dev mailbox (mock only) ---------- */
export const mailbox = () => db().outbox;
export function clearMailbox() { db().outbox = []; S.save(); }
