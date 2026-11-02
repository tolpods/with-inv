/* Address verification. Google Address Validation (if a key is set) -> OpenStreetMap Nominatim -> basic format check. */
import { CONFIG } from './config.js';
import { US_STATES, addrLine } from './docs.js';
const timeout = (ms) => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };
export function basicCheck(a) {
  const errs = [];
  if (!/\d/.test(a.street || '') || !/[A-Za-z]/.test(a.street || '')) errs.push('Street should include a number and a street name.');
  if (!/^[A-Za-z .'-]{2,}$/.test(a.city || '')) errs.push('City looks invalid.');
  if ((!a.country || a.country === 'United States')) {
    if (!US_STATES.includes(String(a.state || '').toUpperCase())) errs.push('State should be a valid 2-letter code.');
    if (!/^\d{5}(-\d{4})?$/.test(String(a.zip || '').trim())) errs.push('ZIP should be 5 digits.');
  }
  return errs;
}
async function google(a) {
  const body = { address: { regionCode: 'US', addressLines: [a.street + (a.apt ? ' ' + a.apt : '')], locality: a.city, administrativeArea: a.state, postalCode: a.zip } };
  const r = await fetch('https://addressvalidation.googleapis.com/v1:validateAddress?key=' + encodeURIComponent(CONFIG.googleAddressKey), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: timeout(6000) });
  if (!r.ok) throw new Error('google ' + r.status);
  const j = (await r.json()).result || {}, v = j.verdict || {}, pa = j.address?.postalAddress || {};
  const norm = { street: (pa.addressLines || [])[0] || a.street, city: pa.locality || a.city, state: pa.administrativeArea || a.state, zip: pa.postalCode || a.zip };
  const good = v.addressComplete && !v.hasUnconfirmedComponents;
  return { status: good ? (norm.street.toLowerCase() === a.street.toLowerCase() && norm.zip === a.zip ? 'verified' : 'corrected') : 'unverified', normalized: norm, provider: 'Google Address Validation', formatted: j.address?.formattedAddress };
}
async function nominatim(a) {
  const q = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', limit: '1', street: a.street, city: a.city, state: a.state, postalcode: a.zip, country: a.country || 'United States' });
  const r = await fetch('https://nominatim.openstreetmap.org/search?' + q, { headers: { Accept: 'application/json' }, signal: timeout(6000) });
  if (!r.ok) throw new Error('osm ' + r.status);
  const j = await r.json(); if (!j.length) return { status: 'unverified', provider: 'OpenStreetMap' };
  const ad = j[0].address || {}, city = ad.city || ad.town || ad.village || ad.hamlet || '';
  const norm = { street: [ad.house_number, ad.road].filter(Boolean).join(' ') || a.street, city: city || a.city, state: a.state, zip: ad.postcode || a.zip };
  const cityOk = !city || city.toLowerCase() === a.city.toLowerCase(), zipOk = !ad.postcode || ad.postcode.slice(0, 5) === a.zip.slice(0, 5);
  return { status: cityOk && zipOk ? 'verified' : 'corrected', normalized: norm, provider: 'OpenStreetMap', formatted: j[0].display_name };
}
export async function verifyAddress(a) {
  const errs = basicCheck(a);
  if (errs.length) return { status: 'invalid', errors: errs, provider: 'format check' };
  try {
    if (CONFIG.googleAddressKey) return await google(a);
  } catch (e) { console.warn('google verify failed', e); }
  try { return await nominatim(a); } catch (e) { console.warn('osm verify failed', e); }
  return { status: 'format-only', normalized: a, provider: 'format check', note: 'Could not reach an address service. The format is valid but was not confirmed against postal data.' };
}
export { addrLine };
