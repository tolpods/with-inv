/* Mock database (localStorage). Replaced by a real backend when CONFIG.mode = 'live'. */
import { CONFIG } from './config.js';
const KEY = 'tp_investor_db_v1';
let mem = null;
function blank() {
  return { admins: CONFIG.adminSeed.map(a => ({ ...a, addedBy: 'system', addedAt: Date.now() })), invites: [], investors: {}, tickets: [], outbox: [], otps: {}, audit: [], settings: { calendar: CONFIG.calendar, supportEmail: CONFIG.supportEmail } };
}
export function load() {
  if (mem) return mem;
  try { const r = localStorage.getItem(KEY); if (r) { mem = JSON.parse(r); return mem; } } catch { }
  mem = blank(); save(); return mem;
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { console.warn('storage full or blocked', e); } }
export function refresh() { mem = null; return load(); }
window.addEventListener('storage', e => { if (e.key === KEY) mem = null; });
export function resetAll() { try { localStorage.removeItem(KEY); sessionStorage.clear(); } catch { } mem = null; }
