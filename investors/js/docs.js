/* NDA + SAFE documents (text + PDF). TEMPLATES ONLY - have counsel review before real use. */
import { CONFIG } from './config.js';
import { money, fmtDate, loadScript } from './util.js';

export const US_STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR GU VI AS MP'.split(' ');

export const addrLine = p => [p.street, p.apt, p.city, [p.state, p.zip].filter(Boolean).join(' '), p.country && p.country !== 'United States' ? p.country : ''].filter(Boolean).join(', ');

export function validateProfile(p) {
  const e = {};
  const need = (k, msg) => { if (!String(p[k] || '').trim()) e[k] = msg; };
  if (!p.type) e.type = 'Choose Individual or Entity.';
  need('legalName', p.type === 'entity' ? "Enter the entity's legal name." : 'Enter your full legal name.');
  need('street', 'Enter your street address.'); need('city', 'Enter your city.');
  if (!US_STATES.includes(String(p.state || '').toUpperCase()) && (!p.country || p.country === 'United States')) e.state = 'Enter a valid 2-letter state.';
  if ((!p.country || p.country === 'United States') && !/^\d{5}(-\d{4})?$/.test(String(p.zip || '').trim())) e.zip = 'Enter a 5-digit ZIP code.';
  need('phone', 'Enter a phone number.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(p.contactEmail || '').trim())) e.contactEmail = 'Enter a valid email address.';
  if (p.type === 'entity') {
    need('stateInc', "Enter the entity's state of incorporation."); need('placeBiz', "Enter the entity's place of business.");
    need('signerName', 'Enter your name.'); need('signerTitle', 'Enter your title in the entity.');
  }
  if (!p.addrChecked) e.addr = 'Please verify your address (or confirm it as entered).';
  return e;
}
export const signerName = p => p.type === 'entity' ? p.signerName : p.legalName;
const partyText = p => p.type === 'entity'
  ? `${p.legalName}, a ${p.stateInc} entity with its place of business at ${p.placeBiz} ("Recipient"), acting through ${p.signerName}, ${p.signerTitle}`
  : `${p.legalName}, an individual residing at ${addrLine(p)} ("Recipient")`;

/* ---------------- NDA ---------------- */
/* Text follows the Mutual NDA supplied by the company (Party A = company, Party B = investor).
   Party B details come from the investor's details form: name, address, contact and, for entities, state of
   incorporation, place of business and the signer's name/title. */
const partyB = p => p.type === 'entity'
  ? `${p.legalName}, a ${p.stateInc} entity with its place of business at ${p.placeBiz} and an address at ${addrLine(p)}, acting through ${p.signerName}, ${p.signerTitle}`
  : `${p.legalName}, with an address at ${addrLine(p)}`;
export function ndaDoc(p, when, id) {
  const co = CONFIG.companyLegal, d = fmtDate(when, true), A = CONFIG.companySigner;
  return {
    kind: 'NDA', id, title: 'Mutual Non-Disclosure Agreement', subtitle: 'Confidential investor materials',
    partyA: { company: co, name: A.name, title: A.title, date: d },
    summary: [['Effective date', d], ['Party A', `${co}, ${CONFIG.companyAddress}`], ['Party B', p.legalName + (p.type === 'entity' ? ' (entity)' : ' (individual)')], ['Party B address', addrLine(p)], ['Party B contact', `${p.contactEmail}  |  ${p.phone}`], ...(p.type === 'entity' ? [['Signing for entity', `${p.signerName}, ${p.signerTitle}`], ['State of incorporation', p.stateInc], ['Place of business', p.placeBiz]] : [])],
    parts: [
      { p: [`This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of ${d} (the "Effective Date") by and between ${co}, with an address at ${CONFIG.companyAddress} ("Party A"), and ${partyB(p)} ("Party B").`, 'Party A and Party B may each disclose Confidential Information to the other. Each may be referred to as a "Party" and together as the "Parties."'] },
      { h: '1. Purpose', p: ['The Parties wish to disclose certain Confidential Information solely for the purpose of establishing a business relationship that benefits both parties (the "Purpose").'] },
      { h: '2. Definition of Confidential Information', p: ['"Confidential Information" means any non-public information disclosed by a Party ("Disclosing Party") to the other Party ("Receiving Party"), whether in oral, visual, written, electronic, or other form, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure, including without limitation: business plans, strategies, financial information, customer and supplier information, pricing, product information, designs, software, source code, inventions, trade secrets, processes, know-how, and any analyses, compilations, or materials derived from such information.'] },
      { h: '3. Exclusions', p: ['Confidential Information does not include information that the Receiving Party can demonstrate by written records: a) is or becomes publicly available through no breach of this Agreement; b) was known by the Receiving Party prior to disclosure by the Disclosing Party; c) is received from a third party without breach of any obligation of confidentiality; or d) is independently developed by the Receiving Party without use of or reference to the Disclosing Party\'s Confidential Information.'] },
      { h: '4. Obligations of Receiving Party', p: ['The Receiving Party shall: a) use the Confidential Information only for the Purpose; b) protect the Confidential Information using at least the same degree of care it uses to protect its own confidential information of similar importance, and no less than reasonable care; c) not disclose the Confidential Information to any third party except as permitted in Section 5; and d) promptly notify the Disclosing Party upon becoming aware of any unauthorized use or disclosure.'] },
      { h: '5. Permitted Disclosures', p: ['The Receiving Party may disclose Confidential Information to its employees, officers, directors, affiliates, contractors, professional advisers, or agents who have a need to know for the Purpose, provided that such persons are bound by confidentiality obligations at least as protective as this Agreement. The Receiving Party remains responsible for any breach of this Agreement by such persons.'] },
      { h: '6. Compelled Disclosure', p: ['If the Receiving Party is required by law, regulation, or court order to disclose any Confidential Information, it shall (to the extent legally permitted) provide prompt written notice to the Disclosing Party and reasonably cooperate with the Disclosing Party\'s efforts to seek a protective order or other remedy. The Receiving Party will disclose only the portion of Confidential Information legally required.'] },
      { h: '7. Term; Duration of Confidentiality', p: ['This Agreement begins on the Effective Date and continues for 1 year unless earlier terminated by written agreement. The confidentiality and use restrictions apply for 3 years from the date of each disclosure; however, with respect to trade secrets, the obligations continue for so long as such information remains a trade secret under applicable law.'] },
      { h: '8. Return or Destruction', p: ['Upon the Disclosing Party\'s written request, the Receiving Party shall promptly return or destroy all Confidential Information (including copies) in its possession or control, except that the Receiving Party may retain one archival copy solely for legal/compliance purposes, subject to ongoing confidentiality obligations.'] },
      { h: '9. No License; No Obligation', p: ['All Confidential Information remains the property of the Disclosing Party. No license or other rights are granted under any patent, copyright, trade secret, or other intellectual property right by disclosure of Confidential Information. Nothing in this Agreement requires either Party to proceed with any transaction or relationship.'] },
      { h: '10. Remedies', p: ['The Receiving Party acknowledges that unauthorized use or disclosure may cause irreparable harm for which monetary damages may be inadequate. The Disclosing Party is entitled to seek injunctive or equitable relief, in addition to any other remedies available at law or in equity.'] },
      { h: '11. No Warranty', p: ['All Confidential Information is provided "AS IS." The Disclosing Party makes no representation or warranty regarding accuracy or completeness.'] },
      { h: '12. Governing Law; Venue', p: [`This Agreement is governed by the laws of ${CONFIG.governingLaw} in the United States of America, without regard to conflict of laws principles. The Parties consent to the exclusive jurisdiction and venue of the courts located in Maricopa County in the state of Arizona.`] },
      { h: '13. Miscellaneous', p: ['a) Entire Agreement. This Agreement constitutes the entire agreement regarding its subject matter and supersedes prior discussions or agreements. b) Amendments. Any amendment must be in writing and signed by both Parties. c) Assignment. Neither Party may assign this Agreement without the other Party\'s written consent, except to a successor in connection with a merger, acquisition, or sale of substantially all assets. d) Severability. If any provision is held unenforceable, the remainder will remain in effect, and the provision will be modified to the minimum extent necessary to be enforceable. e) Counterparts; Electronic Signatures. This Agreement may be executed in counterparts and via electronic signatures, each of which is deemed an original.'] },
      { p: ['IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.', `Party A: ${co}. By: ${A.name}, ${A.title}. Date: ${d}.`, `Party B: ${p.legalName}. By: ${signerName(p)}${p.type === 'entity' ? ', ' + p.signerTitle : ''} (electronic signature below). Date: ${d}.`] }
    ]
  };
}

/* ---------------- SAFE ---------------- */
export const SAFE_VERSIONS = {
  cap: { label: 'Post-money valuation cap', short: 'Valuation Cap, no Discount', blurb: 'Converts at the lower of the cap price or the next round price. Matches the % ownership shown in the investment options.' },
  discount: { label: 'Discount', short: 'Discount, no Valuation Cap', blurb: 'Converts at a 20% discount to the next round price, with no cap.' },
  mfn: { label: 'MFN (most favored nation)', short: 'MFN, no Valuation Cap or Discount', blurb: 'Takes the best terms the Company later gives to other SAFE investors.' }
};
export function safeTerms(stage, optIdx, amount, version) {
  const opt = stage.items[optIdx]; const baseCap = Math.round(stage.items[0][0] / (stage.items[0][1] / 100));
  const preset = opt && Number(amount) === opt[0];
  const cap = preset ? Math.round(opt[0] / (opt[1] / 100)) : baseCap;
  const pct = preset ? opt[1] : Math.round((amount / cap) * 10000) / 100;
  return { amount: Number(amount), cap, pct, discount: 20, version };
}
export function safeDoc(p, inv, when, id) {
  const co = CONFIG.companyLegal, d = fmtDate(when, true), t = inv.terms, v = SAFE_VERSIONS[inv.version];
  const price = inv.version === 'cap'
    ? `Post-Money Valuation Cap: ${money(t.cap)}  (about ${t.pct}% of the Company on an as-converted post-money basis, before other future dilution)`
    : inv.version === 'discount' ? 'Discount Rate: 80% of the price paid by new investors (a 20% discount); no Valuation Cap' : 'MFN: no Valuation Cap or Discount; the Investor may elect the better terms of any later SAFE (see 4.3)';
  const conv = inv.version === 'cap'
    ? 'the lower of (i) the Safe Price (the Post-Money Valuation Cap divided by the Company Capitalization) and (ii) the price per share paid by investors in the Equity Financing'
    : inv.version === 'discount' ? 'the Discount Price (the price per share paid by investors in the Equity Financing multiplied by the Discount Rate)' : 'the price per share paid by investors in the Equity Financing, subject to the MFN election in 4.3';
  return {
    kind: 'SAFE', id, title: 'Simple Agreement for Future Equity', subtitle: `${v.short}  |  ${inv.stageName}`,
    legend: 'THIS INSTRUMENT AND ANY SECURITIES ISSUABLE PURSUANT HERETO HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED, OR UNDER THE SECURITIES LAWS OF CERTAIN STATES. THEY MAY NOT BE OFFERED, SOLD OR TRANSFERRED EXCEPT AS PERMITTED UNDER THOSE LAWS.',
    summary: [['Date', d], ['Company', co], ['Investor', p.legalName + (p.type === 'entity' ? ' (entity)' : '')], ['Investor address', addrLine(p)], ['Purchase Amount', money(t.amount)], ['Investment stage', inv.stageName], ['SAFE version', v.label], [inv.version === 'cap' ? 'Valuation Cap' : inv.version === 'discount' ? 'Discount' : 'Terms', inv.version === 'cap' ? money(t.cap) : inv.version === 'discount' ? '20%' : 'MFN']],
    parts: [
      { p: [`This certifies that, in exchange for the payment by ${partyText(p)} (the "Investor") of ${money(t.amount)} (the "Purchase Amount") on or about ${d}, ${co} (the "Company") issues to the Investor the right to certain shares of the Company's capital stock, subject to the terms below.`, price] },
      { h: '1. Events', p: [
        `(a) Equity Financing. If there is an equity financing before this instrument terminates, in which the Company issues and sells preferred stock at a fixed valuation for the principal purpose of raising capital (an "Equity Financing"), this instrument will automatically convert into the number of shares of Safe Preferred Stock equal to the Purchase Amount divided by ${conv}.`,
        '(b) Liquidity Event. If there is a Change of Control, Direct Listing or IPO before conversion (a "Liquidity Event"), the Investor will, at its option, either receive a cash payment equal to the Purchase Amount or receive shares of common stock equal to the Purchase Amount divided by the applicable price above, in each case subject to the priority below.',
        '(c) Dissolution Event. If there is a voluntary termination of operations, a general assignment for the benefit of creditors or other liquidation or dissolution of the Company (a "Dissolution Event") before conversion, the Investor will be due a cash payment equal to the Purchase Amount, payable before holders of common stock and on equal footing with other holders of safes and preferred stock.',
        '(d) Termination. This instrument terminates on the earliest of the issuance of stock to the Investor on conversion or the payment of amounts due to the Investor under (b) or (c).'] },
      { h: '2. Definitions', p: ['"Change of Control" means a transaction in which a person or group acquires more than half of the Company\'s voting power or all or substantially all of its assets. "Company Capitalization" means all issued and outstanding shares (as converted), all options and promised options, the unissued option pool and all converting securities, including this and other safes. "Direct Listing" and "IPO" have their ordinary meaning. "Safe Preferred Stock" means the series of preferred stock issued in the Equity Financing, with identical rights except for a per-share liquidation preference and dividend rate based on the Safe Price.'] },
      { h: '3. Company representations', p: ['The Company is duly organized and in good standing; it has authority to sign and perform this instrument; this instrument is the Company\'s valid and binding obligation; and the issuance does not violate its governing documents or applicable law or require any consent not already obtained.'] },
      { h: '4. Investor representations and other terms', p: [
        '4.1 The Investor is an accredited investor as defined in Rule 501 of Regulation D, has the authority and capacity to sign, is acquiring this instrument for its own account for investment and not with a view to resale, and understands that the securities are restricted and illiquid, may lose all value, and that no public market exists.',
        '4.2 The Investor has read the Company\'s investor presentation, understands that the projections in it are estimates and not guarantees, and has had the chance to ask questions of the Company.',
        inv.version === 'mfn' ? '4.3 If the Company issues any subsequent safe or convertible security with a valuation cap or discount before this instrument converts, the Investor may elect, by notice, to amend this instrument to the terms of that security.' : '4.3 No MFN right is granted under this version.',
        '4.4 The Investor has no rights as a stockholder (including voting, dividend or information rights) until conversion. This instrument does not by itself create any obligation on the Company to issue a particular number of shares before conversion.'] },
      { h: '5. Miscellaneous', p: [`This instrument is governed by the laws of ${CONFIG.governingLaw}. Any provision may be amended or waived only in a writing signed by the Company and the Investor. It is the entire agreement on its subject. The Investor may not assign it without the Company\'s consent, except to an affiliate. If any provision is unenforceable the remainder stays in effect. This instrument may be signed electronically, with the same effect as a handwritten signature, and a PDF copy will be sent to the Investor\'s email address.`, 'The Company\'s acceptance and countersignature, and receipt of the Purchase Amount per the wire instructions it provides separately, are required before this instrument is effective.'] }
    ]
  };
}

/* ---------------- PDF ---------------- */
const INK = [35, 43, 31], GREEN = [95, 122, 86], OAK = [152, 115, 71], MUTED = [98, 100, 90];
export async function makePdf(doc, sig) {
  if (!window.jspdf) await loadScript(new URL('../vendor/jspdf.umd.min.js', import.meta.url).href);
  const { jsPDF } = window.jspdf, pdf = new jsPDF({ unit: 'pt', format: 'letter', compress: true });
  const W = 612, H = 792, M = 60, CW = W - 2 * M; let y = 0;
  const foot = [];
  const newPage = first => { if (!first) pdf.addPage(); y = M + 30; };
  const need = n => { if (y + n > H - 70) newPage(); };
  // title block
  newPage(true);
  pdf.setFillColor(...GREEN); pdf.rect(0, 0, W, 10, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...OAK); pdf.text('TOLPODS', M, 44);
  pdf.setFont('times', 'normal'); pdf.setFontSize(26); pdf.setTextColor(...INK); pdf.text(doc.title, M, 84);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(...MUTED); pdf.text(doc.subtitle, M, 102);
  y = 124;
  if (doc.legend) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); const l = pdf.splitTextToSize(doc.legend, CW); pdf.text(l, M, y); y += l.length * 9.5 + 8; }
  // summary table
  pdf.setDrawColor(213, 207, 191); pdf.setFontSize(9.5);
  const rowsH = doc.summary.map(([, v]) => pdf.splitTextToSize(String(v), CW - 140).length * 12 + 8);
  const tableH = rowsH.reduce((a, b) => a + b, 0);
  pdf.setFillColor(246, 242, 233); pdf.rect(M, y, CW, tableH, 'F'); pdf.rect(M, y, CW, tableH);
  let ty = y;
  doc.summary.forEach(([k, v], i) => {
    pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...MUTED); pdf.text(k.toUpperCase(), M + 10, ty + 14, { charSpace: .3 });
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...INK); pdf.text(pdf.splitTextToSize(String(v), CW - 140), M + 130, ty + 14);
    ty += rowsH[i]; if (i < doc.summary.length - 1) pdf.line(M, ty, M + CW, ty);
  });
  y += tableH + 24;
  // body
  for (const part of doc.parts) {
    if (part.h) { need(40); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(...GREEN); pdf.text(part.h, M, y); y += 16; }
    for (const para of part.p) {
      pdf.setFont('times', 'normal'); pdf.setFontSize(10.5); pdf.setTextColor(...INK);
      const lines = pdf.splitTextToSize(para, CW);
      for (const ln of lines) { need(16); pdf.text(ln, M, y); y += 14.2; }
      y += 6;
    }
    y += 4;
  }
  // signature block
  need(doc.partyA ? 280 : 190); y += 6;
  if (doc.partyA) {
    const A = doc.partyA; pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...GREEN); pdf.text('PARTY A', M, y);
    pdf.setFont('helvetica', 'normal'); pdf.setTextColor(...INK); pdf.text(`${A.company}   |   By: ${A.name}, ${A.title}   |   Date: ${A.date}`, M, y + 15); y += 40;
    pdf.setFont('helvetica', 'bold'); pdf.setTextColor(...GREEN); pdf.text('PARTY B', M, y); y += 8;
  }
  pdf.setDrawColor(...GREEN); pdf.setLineWidth(1); pdf.line(M, y, M + CW, y); y += 22;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(...GREEN); pdf.text('Electronically signed', M, y); y += 14;
  if (sig && sig.image) { try { pdf.addImage(sig.image, /^data:image\/png/.test(sig.image) ? 'PNG' : 'JPEG', M, y, 200, 53); } catch (e) { console.warn(e); } }
  pdf.setDrawColor(...INK); pdf.setLineWidth(.6); pdf.line(M, y + 62, M + 230, y + 62);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(...INK);
  pdf.text(sig?.name || '', M, y + 76); pdf.setTextColor(...MUTED); pdf.setFontSize(9);
  pdf.text(sig?.role || '', M, y + 88);
  const rx = M + 290; let ry = y + 6;
  for (const [k, v] of [['Signed', fmtDate(sig?.when, true)], ['Method', sig?.method === 'typed' ? 'Typed signature' : 'Drawn signature'], ['Email', sig?.email || ''], ['Document ID', doc.id], ['Integrity hash', (sig?.hash || '').slice(0, 24) + '...']]) {
    pdf.setFont('helvetica', 'bold'); pdf.text(k, rx, ry); pdf.setFont('helvetica', 'normal'); pdf.text(String(v), rx + 80, ry); ry += 14;
  }
  // footers
  const n = pdf.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    pdf.setPage(i); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...MUTED);
    pdf.text(`${doc.id}  |  Confidential`, M, H - 36); pdf.text(`Page ${i} of ${n}`, W - M, H - 36, { align: 'right' });
    if (!CONFIG.legalApproved) { pdf.setTextColor(176, 74, 62); pdf.text('Template draft - not yet approved by counsel. Not legal advice.', W / 2, H - 24, { align: 'center' }); }
  }
  return pdf.output('datauristring');
}
export const docText = doc => JSON.stringify({ t: doc.title, s: doc.summary, p: doc.parts });
