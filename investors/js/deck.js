/* The investor presentation site (from the 21-slide deck). */
import { DECK } from './deckdata.js';
import { h, esc, money, money2, compact, $, $$ } from './util.js';
import { groupedBars, stackedBars, lineChart, legend } from './charts.js';
import { SAFE_VERSIONS } from './docs.js';

const PH = ['MVP', 'Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Phase V'];
const PHL = ['MVP', 'Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Phase V · Pre-IPO'];
const COL = { green: '#5f7a56', oak: '#987347', gold: '#e0b55a', sage: '#9db08f', ink: '#232b1f', clay: '#b9825a', stone: '#8a8878', night: '#2b3a2a' };
export const NAV = [['overview', 'Overview'], ['market', 'Market'], ['product', 'Product'], ['cashflow', 'Cash flow'], ['roi', 'Returns'], ['capital', 'Capital'], ['options', 'Investment options'], ['questions', 'Questions']];

const table = (head, rows, { cls = '', firstW } = {}) => `<div class="tbl-wrap"><table class="tbl ${cls}"><thead><tr>${head.map((x, i) => `<th${i ? '' : ' class="l"'}>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr class="${r.cls || ''}">${r.c.map((x, i) => `<${i ? 'td' : 'th'}${i ? '' : ' class="l"'}>${x}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const sec = (id, cls, inner) => `<section id="${id}" class="ds ${cls}" data-sec="${id}"><div class="ds-in">${inner}</div></section>`;
const head = (eye, title, sub) => `<div class="ds-head"><div class="eyebrow">${eye}</div><h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
const calendly = u => u && !/YOUR-/i.test(u);

export function renderDeck(root, { me, settings, onInvest, onHelp, onTrack, productHref }) {
  const D = DECK, R = D.revenue, E = D.expenses, ROI = D.roi, C = D.capital;
  const money0 = v => money(v);
  /* ---------- overview ---------- */
  const agenda = ['Product Details', 'Cashflow Projections', 'Return on Investment Projections', 'Capital Requirements', 'Investment Options'].map((t, i) => `<li><b>0${i + 1}</b><span>${t}</span></li>`).join('');
  const s1 = sec('overview', 'dark hero', `
    <div class="eyebrow gold">Investors by invitation only</div>
    <h1 class="hero-h">Tolpods<span class="serif"> - our focus is on the people.</span></h1>
    <p class="hero-p">Welcome, ${esc(me.profile.signerName || me.profile.legalName || me.name)}. Thank you for signing the NDA. This presentation takes about <b>20 to 25 minutes</b>.</p>
    <ol class="agenda">${agenda}</ol>
    <div class="trio">
      <div><i>01</i><h3>A private luxury suite</h3><p>Tolpods are fully private, luxury suite experiences in the middle of the busy airport.</p></div>
      <div><i>02</i><h3>Across the airport</h3><p>Tolpods will be located at different locations within the airport.</p></div>
      <div><i>03</i><h3>Technology meets hospitality</h3><p>Cutting-edge technology, artificial intelligence and premium hospitality create a private, secure and comfortable space.</p></div>
    </div>
    <a class="scroll-cue" href="#market" aria-label="Continue">Scroll<span>↓</span></a>`);
  /* ---------- market ---------- */
  const s2 = sec('market', 'light', head('Airport travel industry', 'A market that moves <span class="serif">every single day</span>') + `
    <div class="stat-grid">
      <div class="stat-card"><div class="eyebrow">United States</div><div class="big"><span data-count="2.5" data-dec="1">2.5</span><small> million</small></div><p>people travel through U.S. airports every day.</p><div class="rule"></div><div class="mid"><b data-count="20000">20,000</b> tolpods</div><p>to capture one tenth of this market, installed across the U.S.</p></div>
      <div class="stat-card dark"><div class="eyebrow gold">Worldwide</div><div class="big"><span data-count="13" data-dec="0">13</span><small> million</small></div><p>people travel through airports around the world every day.</p><div class="rule"></div><div class="mid"><b data-count="100000">100,000</b> tolpods</div><p>to capture one tenth of this market, installed worldwide.</p></div>
    </div>`);
  /* ---------- product ---------- */
  const s3 = sec('product', 'dark product', `<div class="prod-grid"><div>${head('Product', 'See a tolpod <span class="serif">for yourself</span>', 'Step inside our interactive 3D model: walk around the exterior, enter the cabin and try the chair, the minibars and the lights.')}
      <a class="btn gold lg" href="${esc(productHref)}" data-track="product">Open the interactive tolpod →</a>
      <p class="fine">Opens in this window. Use <b>Back to presentation</b> in the top corner to return to this slide.</p></div>
    <a class="prod-img" href="${esc(productHref)}" data-track="product" aria-label="Open the interactive tolpod"><img src="../assets/hero.jpg" alt="Tolpod 3D preview" loading="lazy"><span>Interactive 3D</span></a></div>`);
  /* ---------- cashflow ---------- */
  const phCards = D.phases.map((p, i) => `<div class="ph"><i>${PH[i]}</i><b>${p.clusters}</b><span>${p.clusters === 1 ? 'cluster' : 'clusters'}</span><small>${p.pods} tolpods</small></div>`).join('');
  const cashTbl = table(['Monthly, at 75% capacity', ...PH], [
    { c: ['1 cluster at 75% capacity', ...R.cluster75.map(money0)] }, { c: ['Elite membership fees', ...R.elite.map(money0)] }, { c: ['Other sales items', ...R.other.map(money0)] }, { c: ['Cleaning fees ($50 - $150 per incident)', ...R.cleaning.map(money0)] },
    { cls: 'sum', c: ['Total revenues', ...R.total.map(money0)] }, { c: ['Cluster monthly expenses*', ...E.cluster.map(money0)] }, { c: ['Corporate monthly expenses', ...E.corporate.map(money0)] },
    { cls: 'sum', c: ['Total monthly expenses', ...E.total.map(money0)] }, { cls: 'good', c: ['Monthly surplus / wiggle room', ...D.profit.map(money0)] }]);
  const mvpExp = D.mvpExpenses.filter(r => r[1] && !/^Total/.test(r[0])); const mvpMax = Math.max(...mvpExp.map(r => parseFloat(r[1].replace(/[$,]/g, ''))));
  const expBars = mvpExp.map(r => { const v = parseFloat(r[1].replace(/[$,]/g, '')); return `<li><span>${esc(r[0].replace(/\*+$/, ''))}</span><div><i style="width:${(v / mvpMax * 100).toFixed(1)}%"></i></div><b>${money(v)}</b></li>`; }).join('');
  const mvpRev = D.mvpRevenue.filter(r => !/^\*/.test(r[0]) && r[1]).map(r => ({ c: [esc(r[0].replace(/\*+$/, '')), esc(r[1])], cls: /^Total/.test(r[0]) ? 'sum' : '' }));
  const rates = D.rates.filter(r => r[1] || r[2]).map(r => ({ c: [esc(r[0]), esc(r[1] || ''), esc(r[2] || '')], cls: /^Total/.test(r[0]) ? 'sum' : '' }));
  const s4 = sec('cashflow', 'soft', head('Cash flow projections', '7 years, 5 phases <span class="serif">to IPO</span>', 'Revenue projections are calculated conservatively. Expense projections are calculated toward the higher end. One cluster has 10 tolpods.') + `
    <div class="ph-row">${phCards}</div>
    <div class="panel"><h3>Monthly revenue vs expenses by phase</h3>${legend([{ name: 'Revenue (75% capacity)', color: COL.green }, { name: 'Expenses', color: COL.oak }])}
      ${groupedBars({ labels: PH, series: [{ name: 'Revenue', color: COL.green, values: R.total }, { name: 'Expenses', color: COL.oak, values: E.total }] })}
      <details class="more"><summary>Show the full table</summary>${cashTbl}<p class="fine">*Monthly expenses decrease by 5% per phase due to economies of scale and other technology developments.</p></details></div>
    <h3 class="sub-h">Inside the MVP: one cluster, ten tolpods</h3>
    <div class="two">
      <div class="panel"><h4>Monthly revenue</h4>${table(['Item', 'Per month'], mvpRev)}<p class="fine">Elite membership: 5 members per day per cluster averaging $4.58 per month. Cleaning: one per day on average at $75.</p></div>
      <div class="panel"><h4>Monthly expenses at launch</h4><ul class="hb">${expBars}</ul><div class="hb-total"><span>Total monthly expenses</span><b>${money(87274.04)}</b></div>
        <details class="more"><summary>Footnotes</summary><ul class="notes">${D.mvpExpenseNotes.filter(x => /^\*|^\$/.test(x)).map(x => `<li>${esc(x)}</li>`).join('')}</ul></details></div>
    </div>
    <div class="callout"><div><b>${money(14223.21)}</b><span>monthly surplus at MVP, after ${money(97274.04)} of total expenses</span></div></div>
    <details class="more panel"><summary>Rental rates and revenue per tolpod</summary>${table(['Usage', 'Regular', 'Elite'], rates)}<p class="fine">Numbers based on 75% usage. Column labels assumed from the deck's "average of elite and regular".</p></details>`);
  /* ---------- roi ---------- */
  const roiTbl = table(['Projection', ...PHL], [
    { c: ['Monthly revenues', ...R.total.map(money0)] }, { c: ['Monthly expenses', ...E.total.map(money0)] }, { cls: 'sum', c: ['Gross profits', ...D.profit.map(money0)] },
    { cls: 'sum', c: ['Company value (4× revenue multiple)', ...ROI.value.map(money0)] },
    { c: ['Value of a 1% stake (about $50k)', ...ROI.s1.map(money0)] }, { c: ['Value of a 5% stake (about $200k)', ...ROI.s5.map(money0)] }, { c: ['Value of a 20% stake (about $600k)', ...ROI.s20.map(money0)] },
    { cls: 'good', c: ['Approximate ROI (1% stake)', ...ROI.pct.map(v => (v > 0 ? '+' : '') + v.toFixed(2) + '%')] }]);
  const s5 = sec('roi', 'dark', head('Return on investment', 'What a stake could be <span class="serif">worth</span>', 'Company value is modeled at a 4× revenue multiple. Stake values are for illustration and are not guaranteed.') + `
    <div class="panel dk"><h3>Value of a stake by phase</h3>${legend([{ name: '20% stake', color: COL.gold }, { name: '5% stake', color: '#e8cf90' }, { name: '1% stake', color: '#f3ead2' }])}
      ${lineChart({ labels: PH, series: [{ name: '20% stake', color: COL.gold, values: ROI.s20 }, { name: '5% stake', color: '#e8cf90', values: ROI.s5 }, { name: '1% stake', color: '#f3ead2', values: ROI.s1 }] })}</div>
    <div class="roi-pills">${ROI.pct.map((v, i) => `<div class="${v < 0 ? 'neg' : 'pos'}"><i>${PH[i]}</i><b>${v > 0 ? '+' : ''}${Math.round(v).toLocaleString('en-US')}%</b></div>`).join('')}</div>
    <p class="fine light">Approximate ROI is based on a 1% stake (about $50k).</p>
    <details class="more dk"><summary>Show the full table</summary>${roiTbl}</details>`);
  /* ---------- capital ---------- */
  const cap = [['Product purchase', C['Product Purchase'], COL.green], ['Inventory purchase', C['Inventory'], COL.oak], ['Other equipment', C['Other Equipment'], COL.sage], ['Lease & other deposits', C['Lease'], COL.gold], ['Product development', C['Product Development'], COL.ink], ['Loan servicing', C['Loan Servicing'], COL.stone], ['Miscellaneous', C['Miscellaneous'], COL.clay]];
  const capTbl = table(['Capital requirement', ...PH.map((p, i) => `${p}<br><small>Month ${D.capMonths[i]}</small>`)], [
    ...cap.map(c => ({ c: [c[0], ...c[1].map(money0)] })), { cls: 'sum', c: ['Total capital requirement', ...C['Total Capital'].map(money0)] }, { c: ['Projected gross profits', ...C['Projected Gross'].map(money0)] }, { cls: 'sum', c: ['Net capital requirement', ...C['Net Capital'].map(money0)] }, { cls: 'good', c: ['Potential dividends', ...C['Potential'].map(money0)] }]);
  const s6 = sec('capital', 'light', head('Capital requirements', 'Funding the path <span class="serif">phase by phase</span>', 'Profits from each phase help fund the next, which is why the net capital requirement falls to zero by Phase IV.') + `
    <div class="panel"><h3>Capital required by phase</h3>${legend(cap.map(c => ({ name: c[0], color: c[2] })))}
      ${stackedBars({ labels: PH, series: cap.map(c => ({ name: c[0], color: c[2], values: c[1] })), totals: C['Total Capital'] })}</div>
    <div class="kpis">${PH.map((p, i) => `<div><i>${p} · month ${D.capMonths[i]}</i><b>${compact(C['Net Capital'][i])}</b><span>net capital needed</span></div>`).join('')}</div>
    <details class="more panel"><summary>Show the full table</summary>${capTbl}<ul class="notes">${D.capNotes.filter(x => x.startsWith('*') || x.startsWith('until')).map(x => `<li>${esc(x)}</li>`).join('')}</ul></details>`);
  /* ---------- options ---------- */
  const stageNames = Object.keys(D.options);
  const optHtml = stageNames.map((sn, si) => { const st = D.options[sn]; return `<div class="opt-panel" data-stage="${sn}" ${si ? 'hidden' : ''}><p class="sub">${esc(st.note)} · seed target ${money(st.target)}</p><div class="opts">${st.items.map((it, i) => `<div class="opt"><i>Option ${i + 1}</i><b>${money(it[0])}</b><span>for ${it[1]}%</span><small>${money(Math.round(it[0] / it[1] * 100))} post-money valuation</small></div>`).join('')}</div></div>`; }).join('');
  const s7 = sec('options', 'sage', head('Investment options', 'Choose how you want <span class="serif">to join</span>', 'Investments are made with a SAFE (Simple Agreement for Future Equity). First-come, first-served.') + `
    <div class="seg-row dark">${stageNames.map((sn, i) => `<button type="button" class="seg ${i ? '' : 'on'}" data-stage-tab="${sn}">${sn}</button>`).join('')}</div>${optHtml}`);
  /* ---------- questions ---------- */
  const people = (settings.calendar || []).map((p, i) => `<div class="who-card" data-who="${i}"><div><div class="eyebrow">${esc(p.who)}</div><h3>${esc(p.title || p.who)}</h3><p>Book a call with our ${esc(p.who)} to ask anything about the plan, the product or the terms.</p></div>
    <div class="who-actions"><button class="btn" data-avail="${i}">Show availability</button></div><div class="cal-embed" hidden></div></div>`).join('');
  const s8 = sec('questions', 'dark', head('Questions or concerns?', 'Talk to us <span class="serif">before you decide</span>', 'Schedule an appointment with a member of our team, or send a question and we will reply by email.') + `
    <div class="who-grid">${people}</div>
    <p class="center"><button class="btn ghost light" data-help>Ask a question by email</button></p>
    <div class="invest-cta"><div><div class="eyebrow gold">Ready to invest</div><h2>Ready when you are.</h2><p>Complete your SAFE (Simple Agreement for Future Equity). Your NDA and SAFE are both emailed to you.</p></div><button class="btn gold lg" data-invest>Ready to invest: SAFE →</button></div>
    <p class="fine light disclaim">Projections are estimates based on the assumptions in this presentation and are not guarantees. This is not an offer to sell securities except under the definitive signed documents. Investing in early-stage companies is risky and you could lose your entire investment.</p>`);

  root.innerHTML = [s1, s2, s3, s4, s5, s6, s7, s8].join('');

  /* ---------- behaviour ---------- */
  $$('[data-stage-tab]', root).forEach(b => b.onclick = () => { $$('[data-stage-tab]', root).forEach(x => x.classList.toggle('on', x === b)); $$('.opt-panel', root).forEach(p => p.hidden = p.dataset.stage !== b.dataset.stageTab); });
  $$('[data-invest]', root).forEach(b => b.onclick = onInvest); $$('[data-help]', root).forEach(b => b.onclick = onHelp);
  $$('[data-track]', root).forEach(a => a.addEventListener('click', () => onTrack(a.dataset.track)));
  $$('[data-avail]', root).forEach(b => b.onclick = () => {
    const i = +b.dataset.avail, p = settings.calendar[i], box = b.closest('.who-card').querySelector('.cal-embed'); onTrack('schedule-' + p.who.toLowerCase());
    if (!box.hidden) { box.hidden = true; b.textContent = 'Show availability'; return; }
    const url = calendly(p.calendly) ? p.calendly : (p.google || ''); box.hidden = false; b.textContent = 'Hide availability';
    if (!url || /YOUR-/i.test(url)) { box.innerHTML = `<div class="banner warn">The scheduling link for the ${esc(p.who)} has not been set up yet. Please use <b>Ask a question by email</b> and we will find a time with you.</div>`; return; }
    const src = new URL(url); if (/calendly\.com/.test(src.host)) { src.searchParams.set('embed_domain', location.hostname || 'tolpods'); src.searchParams.set('embed_type', 'Inline'); src.searchParams.set('hide_gdpr_banner', '1'); }
    box.innerHTML = `<iframe src="${esc(src.href)}" title="${esc(p.who)} availability" loading="lazy"></iframe><a class="btn ghost light sm" target="_blank" rel="noopener" href="${esc(url)}">Open in a new tab ↗</a>`;
  });
  // count-up
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = el => { const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0); if (reduce) return; const t0 = performance.now(); const step = t => { const k = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };
  // section tracking + chart reveal
  const seen = new Set(), nav = $('#deck-nav');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const id = e.target.dataset.sec; e.target.classList.add('in');
    if (!seen.has(id)) { seen.add(id); onTrack('view:' + id); $$('[data-count]', e.target).forEach(count); }
    if (nav) $$('a', nav).forEach(a => a.classList.toggle('on', a.dataset.s === id));
  }), { threshold: 0, rootMargin: '-35% 0px -60% 0px' });
  $$('.ds', root).forEach(s => io.observe(s));
  return { destroy: () => io.disconnect() };
}
