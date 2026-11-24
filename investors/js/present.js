/* Tolpods investor presentation: a full-screen, slide-by-slide "boarding" experience.
   Keys: → / space next (builds then slides) · ← back · G overview · P auto-play · F full screen. Swipe on phones. */
import { DECK } from './deckdata.js';
import { h, esc, money, compact, $, $$, modal } from './util.js';
import { groupedBars, stackedBars, lineChart, legend, donut, donutLegend } from './charts.js';

const PH = ['MVP', 'Phase I', 'Phase II', 'Phase III', 'Phase IV', 'IPO phase'];
const COL = { green: '#6f9163', oak: '#c79a63', gold: '#e0b55a', sage: '#a9bd9b', clay: '#c98f66', stone: '#8d927f', cream: '#efe6d0', sky: '#7fa7b3' };
const SRC = {
  tsa: ['TSA single-day record (KSL)', 'https://www.ksl.com/article/51412679'],
  iata: ['IATA airline outlook (RTÉ)', 'https://www.rte.ie/news/business/2025/1209/1548087-resilient-airlines-head-for-record-passenger-numbers'],
  aci: ['ACI World forecast (AviationPros)', 'https://www.aviationpros.com/airport-business/press-release/55320211/global-air-travel-forecasted-to-reach-98-billion-passengers-in-2025-nearing-the-historic-10-billion-milestone'],
  aci40: ['ACI airport revenue split (Moodie Davitt)', 'https://moodiedavittreport.com/non-aeronautical-activity-accounts-for-just-under-40-of-airports-income-worldwide-reports-aci/'],
  bts: ['US flight delays (USAFacts, BTS data)', 'https://usafacts.org/reports/facts-in-focus/best-worst-airports-air-travel-delays-ewr-ord-lga-bts'],
  tsa25: ['TSA 2025 total, 906M+ screened (AAA)', 'https://magazine.northeast.aaa.com/daily/newsroom/air-travel-was-up-in-2025-but-growth-slowed-patterns-shifted/'],
  model: ['Tolpods financial model (investor deck)']
};
export const CHAPTERS = [['overview', 'Welcome'], ['market', 'Market'], ['product', 'Product'], ['cashflow', 'Cash flow'], ['roi', 'Returns'], ['capital', 'Capital'], ['options', 'Investment options'], ['questions', 'Talk to us'], ['appendix', 'Appendix']];

/* Scheduling cards. Older saved settings used a CEO/CTO shape; map those to the two generic topics. */
export function scheduling(settings) {
  const base = [
    { id: 'investment', label: 'Investment questions', blurb: 'The round, the SAFE, ownership, timing and risk. Ask anything about the terms.', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M15 7h5v5"/></svg>' },
    { id: 'product', label: 'Product questions', blurb: 'How Tolpods works: the technology, airport rollout and operations. Ask anything about the product.', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>' }
  ];
  const have = settings?.calendar || [];
  return base.map((b, i) => { const c = have.find(x => x.id === b.id) || have[i] || {}; return { ...b, calendly: c.calendly || '', google: c.google || '' }; });
}

const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join(''); };
const dollars = v => parseFloat(String(v).replace(/[$,]/g, ''));
const fl = (txt, d0 = 0) => [...String(txt)].map((c, i) => `<span class="fl" style="--d:${d0 + i * 28}ms">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('');
const src = keys => (keys = keys.filter(k => k !== 'model')).length ? `<footer class="sl-src"><span>Sources</span>${keys.map(k => { const s = SRC[k]; return s[1] ? `<a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a>` : `<em>${esc(s[0])}</em>`; }).join('')}</footer>` : '';
const nb = v => `<b class="num">${v}</b>`;
const stbl = (head, rows) => `<div class="tbl-wrap"><table class="stbl"><thead><tr>${head.map((x, i) => `<th${i ? '' : ' class="l"'}>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr class="${r.cls || ''}">${r.c.map((x, i) => `<${i ? 'td' : 'th'}${i ? '' : ' class="l"'}>${x}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const tag = (t, c = '') => `<div class="eyebrow ${c}">${t}</div>`;
const table = (head, rows) => `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((x, i) => `<th${i ? '' : ' class="l"'}>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr class="${r.cls || ''}">${r.c.map((x, i) => `<${i ? 'td' : 'th'}${i ? '' : ' class="l"'}>${x}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;

const logo = () => { const a = h('span', { class: 'p-logo', 'aria-label': 'Tolpods' }); a.innerHTML = '<svg viewBox="0 0 30 40" aria-hidden="true"><defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc08a"/><stop offset="1" stop-color="#47683e"/></linearGradient></defs><rect x="2" y="2" width="26" height="33" rx="8" fill="url(#lg1)"/><rect x="7" y="8" width="16" height="12" rx="3.5" fill="#e0b55a"/><rect x="7" y="23" width="16" height="3" rx="1.5" fill="#1f2d1c" opacity=".35"/><rect x="8" y="36" width="14" height="3" rx="1.5" fill="#33432e"/></svg><b>Tolpods</b>'; return a; };
function slidesFor({ me, settings, productHref, onHelp, onTrack, ...opts }) {
  const D = DECK, R = D.revenue, E = D.expenses, ROI = D.roi, C = D.capital, name = me.profile?.signerName || me.profile?.legalName || me.name || 'investor';
  const out = [];
  const HL = /\$?(?:101,873|87,274)(?:\.\d+)?/g;
  const add = s => { s.html = s.html.replace(HL, m => `<b class="hl">${m}</b>`); out.push(s); };
  const IPO = PH.length - 1;

  /* ---- Welcome */
  add({ id: 'welcome', ch: 'overview', th: 'night', cls: 'cover', title: 'Welcome aboard', html: `
    <div class="radar" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    ${tag('Investors by invitation only', 'gold')}
    <h1 class="mega">Tolpods<span class="serif">Our focus is on the people.</span></h1>
    <p class="lede big-l" data-b="1">Welcome aboard, please set aside <b>30 mins</b> for this presentation.</p>
    <div class="cover-chips" data-b="2"><span>Private space</span><span>In the middle of the airport</span><span>Technology + hospitality</span></div>
    <div class="cue" data-b="3">Press <kbd>→</kbd> or swipe to begin</div>` });

  add({ id: 'aboard', ch: 'overview', th: 'night', title: 'Welcome aboard', html: `
    ${tag('Welcome', 'gold')}<h2>Welcome aboard, <span class="serif">${esc(name)}</span></h2>
    <p class="lede" data-b="1">Set aside about <b>30 minutes</b> to fly the whole plan: the product, the cash flow, the returns, the capital and your options. You can always come back to where you left off. Use <kbd>→</kbd> to move through it.</p>
    <div class="trio" data-b="2">
      <div><i>01</i><h3>A private luxury space</h3><p>A fully private, luxury space/experience in the middle of the busy airport.</p></div>
      <div><i>02</i><h3>All across the airport</h3><p>Tolpods at different locations throughout the airport.</p></div>
      <div><i>03</i><h3>Technology meets hospitality</h3><p>Cutting-edge technology, AI and premium hospitality in a private, secure, comfortable space.</p></div>
    </div>` });

  /* ---- Agenda */
  const rows = [['Product details', 'overview'], ['Cashflow projections', 'route'], ['Return on investment', 'roi'], ['Capital requirements', 'capital'], ['Investment options', 'options']];
  add({ id: 'agenda', ch: 'overview', th: 'night', title: 'Today’s agenda', html: `
    ${tag('Presentation details', 'gold')}<h2>Today’s <span class="serif">agenda</span></h2>
    <div class="board" role="list"><div class="bh"><span>Flight</span><span>Destination</span><span>Status</span></div>
    ${rows.map((r, i) => `<button class="br" data-b="${i + 1}" data-go="${r[1]}" role="listitem"><span>${fl('TP ' + (101 + i), i * 60)}</span><span class="dest">${fl(r[0].toUpperCase(), i * 60 + 120)}</span><span class="st ${i === 0 ? 'now' : ''}">${i === 0 ? 'BOARDING' : 'ON TIME'}</span></button>`).join('')}
    </div><p class="fine light" data-b="6">About 30 minutes. Tap any flight to jump straight to it.</p>` });

  /* ---- Overview: where Tolpods sit */
  const pods = n => Array.from({ length: n }, () => '<u></u>').join('');
  add({ id: 'overview', ch: 'overview', th: 'paper', title: 'What Tolpods are', html: `
    ${tag('Tolpods: overview')}<h2>A private space in the <span class="serif">middle of the airport</span></h2>
    <div class="airmap" aria-label="Airport map: Tolpods before and beyond security">
      <svg viewBox="0 0 1000 330" role="img">
        <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb27f"/><stop offset="1" stop-color="#4a6a41"/></linearGradient>
          <g id="pod"><rect x="-15" y="-24" width="30" height="46" rx="8" fill="url(#pg)"/><rect x="-9" y="-17" width="18" height="11" rx="3" fill="#e0b55a"/><rect x="-6" y="22" width="12" height="3" rx="1.5" fill="#33432e" opacity=".5"/></g>
          <g id="plane"><path d="M-12 -2.5 L5 -2.5 L12 0 L5 2.5 L-12 2.5 L-8 0 Z M-4 -2.5 L-8 -10 L-4.5 -10 L1.5 -2.5 Z M-4 2.5 L-8 10 L-4.5 10 L1.5 2.5 Z" fill="#7a7c70"/></g></defs>
        <g data-b="1">
          <rect x="14" y="20" width="400" height="290" rx="26" fill="#faf7f0" stroke="#cfc8b5" stroke-width="2"/>
          <text x="38" y="52" class="am-h">BEFORE SECURITY · PUBLIC TERMINAL</text>
          ${[0, 1, 2, 3].map(i => `<rect x="${44 + i * 60}" y="74" width="44" height="16" rx="4" fill="#d9d3c3"/>`).join('')}<text x="44" y="112" class="am-s">Check-in</text>
          ${[0, 1, 2].map(i => `<use href="#pod" x="${96 + i * 90}" y="214"/>`).join('')}
          <text x="96" y="268" class="am-t">TOLPODS</text><text x="96" y="286" class="am-s">in the public terminal</text>
        </g>
        <g data-b="2">
          <rect x="424" y="20" width="62" height="290" rx="14" fill="#232b1f"/>
          ${[0, 1, 2, 3, 4].map(i => `<rect x="436" y="${60 + i * 46}" width="38" height="26" rx="5" fill="#3a463a"/>`).join('')}
          <text x="455" y="46" text-anchor="middle" class="am-h" style="font-size:10px;letter-spacing:.04em" fill="#e0b55a">SECURITY</text>
          <rect x="498" y="20" width="488" height="290" rx="26" fill="#faf7f0" stroke="#cfc8b5" stroke-width="2"/>
          <text x="522" y="52" class="am-h">BEYOND SECURITY · CONCOURSE</text>
          ${[0, 1, 2, 3, 4].map(i => `<rect x="${524 + i * 90}" y="70" width="70" height="40" rx="8" fill="#ece6d6"/><use href="#plane" x="${559 + i * 90}" y="90"/><text x="${559 + i * 90}" y="128" text-anchor="middle" class="am-s">Gate ${i + 1}</text>`).join('')}
          ${[0, 1, 2, 3, 4].map(i => `<use href="#pod" x="${560 + i * 90}" y="214"/>`).join('')}
          <text x="524" y="268" class="am-t">TOLPODS</text><text x="524" y="286" class="am-s">before and beyond airport security</text>
        </g>
        <path id="walk" d="M30 160 H960" fill="none"/>
        ${[0, 1, 2, 3, 4, 5].map(i => `<circle r="5" fill="#c79a63"><animateMotion dur="14s" begin="${-i * 2.3}s" repeatCount="indefinite" path="M30 ${150 + (i % 3) * 14} H960"/></circle>`).join('')}
      </svg>
      <div class="am-cap" data-b="2"><p>Tolpods within the public terminal.</p><p>Tolpods before and beyond airport security.</p></div>
    </div>
    <div class="quad" data-b="3">
      <div><b>Private and secure</b><p>A fully private luxury space/experience with premium hospitality.</p></div>
      <div><b>Technology and AI</b><p>Cutting-edge technology with the help of AI.</p></div>
      <div><b>Open 24/7</b><p>Access through the mobile app, any time the airport is open.</p></div>
      <div><b>Launching in a busy hub</b><p>We plan to start at a busy airport such as Las Vegas or Los Angeles.</p></div>
    </div>` });

  /* ---- Why now */
  add({ id: 'why-now', ch: 'market', th: 'night', title: 'Airports are full', src: ['tsa', 'iata', 'aci', 'tsa25', 'bts'], html: `
    ${tag('The opportunity', 'gold')}<h2>Airports have never been <span class="serif">this full</span></h2>
    <div class="big3">
      <div data-b="1"><b><span data-count="3.13" data-dec="2">3.13</span><small>M</small></b><p>people screened by TSA in <em>one day</em>, a new record (late Nov 2025).</p></div>
      <div data-b="2"><b><span data-count="5.2" data-dec="1">5.2</span><small>B</small></b><p>airline passengers forecast by IATA for 2026, up from <span class="nowrap">4.98B</span> in 2025.</p></div>
      <div data-b="3"><b>~1<small> in 4</small></b><p>US domestic flights arrived 15+ minutes late in Q2 2025.</p></div>
    </div>
    <div class="stats4" data-b="4"><div>${nb('9.8B')}<span>airport passengers worldwide in 2025 (ACI forecast)</span></div><div>${nb('2.5M')}<span>people passing through U.S. airports every day (906M+ TSA screenings in 2025 ÷ 365)</span></div><div>${nb('13M')}<span>people passing through airports worldwide every day (IATA 4.98B airline passengers in 2025 ÷ 365 ≈ 13.6M)</span></div></div>
    <p class="lede" data-b="5">Crowded gates, long waits and delays. Travelers want somewhere calm, private and clean to rest and recharge. <b>Tolpods are here.</b></p>` });

  /* ---- Market (deck numbers) */
  const share = (pct, label) => donut({ data: [{ name: 'Captured', value: pct, color: '#c9a2ff' }, { name: 'Rest of market', value: 100 - pct, color: '#2b1d4a' }], size: 200, thick: 28, center: '1/10', sub: label });
  add({ id: 'market', ch: 'market', th: 'plum', title: 'Your slice of the sky', src: ['model', 'iata'], html: `
    ${tag('Airport travel industry', 'gold')}<h2>Capture one <span class="serif">tenth</span></h2>
    <div class="duo mk2">
      <div class="mk" data-b="1"><div class="eyebrow">United States</div>${share(10, 'of daily travelers')}
        <div class="mk-t"><b><span data-count="2.5" data-dec="1">2.5</span><small class="mil">million</small></b><p>people travel through U.S. airports <strong>every day</strong>.</p><div class="mk-pods"><b data-count="${D.usPods}">${D.usPods.toLocaleString('en-US')}</b> Tolpods needed across the U.S. to capture 1/10 of the U.S. market.</div></div></div>
      <div class="mk" data-b="2"><div class="eyebrow">Worldwide</div>${share(10, 'of daily travelers')}
        <div class="mk-t"><b><span data-count="13" data-dec="0">13</span><small class="mil">million</small></b><p>people travel through airports worldwide <strong>every day</strong>.</p><div class="mk-pods"><b data-count="${D.worldPods}">${D.worldPods.toLocaleString('en-US')}</b> Tolpods needed worldwide to capture 1/10 of the world market.</div></div></div>
    </div>
    <div class="goal" data-b="3"><div><i class="goal-l">Our goal</i><b data-count="${D.goalPods}">${D.goalPods.toLocaleString('en-US')}</b><span><strong>Tolpods in 7 years.</strong> That is only <em>0.24%</em> of the market.</span></div><div class="goal-bar" aria-hidden="true"><i></i></div></div>` });

  /* ---- Airports want this */
  const acid = [{ name: 'Aeronautical (landing, gate fees)', value: 55.8, color: '#3a4a3f' }, { name: 'Non-aeronautical (retail, services, property)', value: 39.9, color: COL.gold }, { name: 'Non-operating', value: 4.3, color: COL.stone }];
  add({ id: 'airport-money', ch: 'market', th: 'night', title: 'Airports want this too', src: ['aci40', 'aci', 'model'], html: `
    ${tag('Airports are large economic hubs', 'gold')}<h2>Airports are looking for <span class="serif">new revenue</span></h2>
    <div class="panel xl dk ap-box" data-b="1">
      <div class="ap-grid">
        <div class="dn-wrap">${donut({ data: acid, size: 300, thick: 42, center: '39.9%', sub: 'non-flight income', fmt: v => v + '%' })}</div>
        <div class="ap-side">
          <h4>Where airport revenue comes from</h4>
          ${donutLegend(acid, 100, v => v + '%', false)}
          <div class="ap-stat"><b>$7.08</b><div><strong>per passenger</strong><span>Non-aeronautical revenue, worldwide (ACI, FY2017, latest figure we could verify)</span></div></div>
        </div>
      </div>
      <p class="ap-note">ACI World forecasts about 9.8B airport passengers in 2025. Airports count every arrival and departure, which is why that is roughly double the airline figure.</p>
    </div>` });

  /* ---- Product */
  add({ id: 'product', ch: 'product', th: 'night', title: 'The product', src: ['model'], html: `
    <div class="prod">
      <div>${tag('Tolpods: product', 'gold')}<h2>Step <span class="serif">inside Tolpods</span></h2>
        <p class="lede" data-b="1">A 3-minute tour of a Tolpods space.</p>
        <ul class="ticks" data-b="2"><li>Fully private space</li><li>Massage-style chair and minibars</li><li>AI and smart controls</li></ul>
        <p class="fine light" data-b="2">Prefer to explore on your own? <a href="${esc(productHref)}" data-track="product">Open the interactive Tolpods</a> (use Back to presentation to return).</p></div>
      <div class="vid" data-b="1"><video controls preload="metadata" playsinline poster="../assets/hero.jpg" data-track="tour-video"><source src="../assets/tolpods-tour.mp4" type="video/mp4"></video><div class="vid-ph">Tour video coming soon</div></div>
    </div>` , init(el) { const v = $('video', el), ph = $('.vid-ph', el); const bad = () => { ph.hidden = false; }; ph.hidden = true; v.addEventListener('error', bad, true); $('source', v).addEventListener('error', bad); v.addEventListener('play', () => onTrack('tour-video')); } });

  /* ---- Cashflow - Finance (7 years, 5 stages) */
  const clu = n => `<small class="cl">${n} ${n === 1 ? 'cluster' : 'clusters'}</small>`;
  const head = lab => [lab, ...PH.map((p, i) => `${p}<br>${clu(D.phases[i].clusters)}`)];
  add({ id: 'route', ch: 'cashflow', th: 'night', title: 'Cashflow - Finance', src: ['model'], html: `
    ${tag('7 years path to IPO in 5 phases', 'gold')}<h2>Cashflow <span class="serif">- Finance</span></h2>
    <div class="panel dk" data-b="1"><h4>Revenue <small class="hint-b">per month, at 75% capacity · 1 cluster = 10 Tolpods</small></h4>${stbl(head('Revenue'), [
      { c: ['1 cluster (10 Tolpods) at 75%', ...R.cluster75.map(money)] }, { c: ['Elite membership fees', ...R.elite.map(money)] }, { c: ['Other sales items', ...R.other.map(money)] }, { c: ['Cleaning fees', ...R.cleaning.map(money)] },
      { cls: 'sum', c: ['Total revenue', ...R.total.map(x => nb(money(x)))] }])}</div>
    <div class="panel dk" data-b="2"><h4>Expenditure and profit <small class="hint-b">per month</small></h4>${stbl(head('Expenditure'), [
      { c: ['1 cluster monthly expenditure*', ...E.cluster.map(money)] }, { c: ['Corporate monthly expenditure', ...E.corporate.map(money)] }, { cls: 'sum', c: ['Total monthly expenditure', ...E.total.map(x => nb(money(x)))] },
      { cls: 'good', c: ['Monthly profit', ...D.profit.map(x => nb(money(x)))] }])}
      <p class="fine light">*Monthly expenditure decreases 5% per phase due to economies of scale and technological developments.</p></div>` });

  /* ---- One cluster, one month: tables */
  const ex = Object.fromEntries(D.mvpExpenses.filter(r => r[1]).map(r => [r[0].replace(/\*+$/, '').trim(), dollars(r[1])]));
  const sum = (...k) => k.reduce((a, x) => a + (ex[x] || 0), 0);
  const expRows = [['Airport rent (35% of gross revenue)', ex['Rent']], ['People (3 full-time, 4 part-time, payroll)', sum('Salaries - Full Time Employees', 'Salaries - Part time Employees', 'Payroll & Related Expenses')], ['Marketing & advertising', ex['Marketing & Advertising']], ['Office & equipment', sum('Equipment Rental', 'Office Space', 'Office Expenses')], ['Maintenance, tech, insurance, other', sum('Tolpods Maintenance', 'Other Tolpods Misc. Expenses', 'Technology Costs', 'Insurance & Other Fees', 'Misc. & Unexpected Expenses', 'Travel')]];
  const usd2 = v => '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  add({ id: 'cluster', ch: 'cashflow', th: 'paper', title: 'One cluster, monthly data', html: `
    ${tag('Cash flow: the MVP')}<h2>One cluster. Ten Tolpods. <span class="serif">Monthly data.</span></h2>
    <div class="duo tight">
      <div class="panel" data-b="1"><h4>Minimum Viable Product: Revenues <small class="hint-b">MVP monthly cashflow · 1 cluster has 10 Tolpods</small></h4>${stbl(['Revenues', 'Per month'], [{ cls: 'hi', c: ['1 cluster at 75% capacity', usd2(R.cluster75[0])] }, { c: ['Elite membership fees*', usd2(R.elite[0])] }, { c: ['Other sales items', usd2(R.other[0])] }, { c: ['Cleaning fees (from $50 to $150 an incident)**', usd2(R.cleaning[0])] }, { cls: 'sum', c: ['Total revenues at 75% capacity', nb(usd2(R.total[0]))] }])}
        <ul class="foot"><li>*Elite membership is 5 members per day per cluster averaging $4.58 per month</li><li>**1 cleaning on average per day at $75 average</li></ul></div>
      <div class="panel" data-b="2"><h4>Minimum Viable Product: Expenditure and profits <small class="hint-b">MVP monthly cashflow · 1 cluster has 10 Tolpods</small></h4>${stbl(['Expenditure', 'Per month'], [{ cls: 'hi', c: ['Cluster monthly expenditure', usd2(E.cluster[0])] }, { c: ['Corporate monthly expenditure', usd2(E.corporate[0])] }, { cls: 'sum', c: ['Total monthly expenditure', nb(usd2(E.total[0]))] }, { cls: 'good grand', c: ['Monthly profit', nb(usd2(D.profit[0]))] }])}</div>
    </div>` });

  /* ---- How we reach $101,873 (pricing) */
  const RT = [['Long-term', '4 hours or more', 19.99, 15.99], ['Short-term', '1 to 4 hours', 21.99, 17.99], ['One hour or less', 'per hour', 23.99, 19.99]];
  const day = { reg: [119.94, 263.88, 109.95], pre: [95.94, 215.88, 99.95] };
  const dayBar = (a, col) => { const t = a.reduce((x, y) => x + y, 0); return `<div class="dbar">${a.map((v, i) => `<i style="flex:${v};background:${shade(col, [1.12, 1, .84][i])};color:${col === COL.gold ? '#2a2108' : '#fff'}" title="${RT[i][0]}: $${v.toFixed(2)}"><span>$${v.toFixed(0)}</span></i>`).join('')}</div><small>$${t.toFixed(2)} a day</small>`; };
  add({ id: 'pricing', ch: 'cashflow', th: 'night', title: 'MVP’s revenues', cls: 'lg', src: ['model'], html: `
    ${tag('MVP’s revenues', 'gold')}<h2>How one cluster reaches <span class="serif hi-n">${money(Math.round(R.cluster75[0]))}</span></h2>
    <div class="rates" data-b="1">${RT.map(r => `<div class="rate"><i>${r[0]}</i><small>${r[1]}</small><div><span>Regular</span><b>$${r[2]}</b></div><div><span>Premier</span><b class="gold">$${r[3]}</b></div><em>per hour</em></div>`).join('')}</div>
    <div class="panel dk" data-b="2"><h4>One Tolpods, one full day <small>6 h long-term · 12 h short-term · 5 h one-hour rate (1 h for cleaning)</small></h4><div class="days"><div><span>Regular member</span>${dayBar(day.reg, COL.green)}</div><div><span>Premier member</span>${dayBar(day.pre, COL.gold)}</div></div></div>
    <div class="chain" data-b="3"><div><i>Average at 75% capacity</i><b>$339.58</b><small>per Tolpods, per day</small></div><span>×10</span><div><i>One cluster</i><b>$3,395.78</b><small>per day</small></div><span>×30</span><div class="end"><i>One cluster</i><b>${money(R.cluster75[0])}</b><small>per month</small></div></div>
    <p class="fine light" data-b="3">Regular members are free; Premier members pay a membership and get lower rates. We assume about half of customers are each. Short-term rates apply about half of the day.</p>` });

  /* ---- Occupancy simulator */
  const FULL = dollars(D.mvpRevenue[0][1]), FIXREV = R.elite[0] + R.other[0] + R.cleaning[0], RENT = .35, FIXC = E.cluster[0] - ex['Rent'] + E.corporate[0];
  const profitAt = o => (1 - RENT) * (FULL * o + FIXREV) - FIXC, BE = ((FIXC / (1 - RENT)) - FIXREV) / FULL;
  add({ id: 'occupancy', ch: 'appendix', app: true, th: 'paper', title: 'How full does it need to be?', src: ['model'], html: `
    ${tag('Try it yourself')}<h2>How full does it <span class="serif">need to be?</span></h2>
    <div class="sim light" data-b="1">
      <div class="sim-ctl"><label for="occ">Share of the day each Tolpods is rented</label><div class="sim-v"><b id="occ-v">75%</b><small id="occ-h"></small></div>
        <input id="occ" type="range" min="20" max="100" step="1" value="75" aria-describedby="occ-note"></div>
      <div class="sim-grid"><div class="sim-k"><i>Revenue / month</i><b id="o-rev"></b></div><div class="sim-k"><i>Expenditure / month</i><b id="o-exp"></b></div><div class="sim-k hl"><i>Profit / month</i><b id="o-pro"></b></div><div class="sim-k"><i>Profit / year</i><b id="o-yr"></b></div></div>
      <div id="occ-chart" class="sim-chart"></div>
    </div>
    <p id="occ-note" class="fine" data-b="2">One cluster breaks even at about <b>${Math.round(BE * 100)}%</b> rented. Our plan assumes 75%. Illustrative model: rental revenue scales with bookings; membership, sales and cleaning stay fixed; rent is 35% of gross revenue; other costs fixed.</p>`,
    init(el) {
      const inp = $('#occ', el), set = () => {
        const o = inp.value / 100, R_ = FULL * o + FIXREV, P = profitAt(o), Ex = R_ - P;
        $('#occ-v', el).textContent = inp.value + '%'; $('#occ-h', el).textContent = `about ${(o * 24).toFixed(1)} hours rented per Tolpods per day`;
        $('#o-rev', el).textContent = money(R_); $('#o-exp', el).textContent = money(Ex); const pe = $('#o-pro', el); pe.textContent = money(P); pe.className = P < 0 ? 'neg' : ''; $('#o-yr', el).textContent = money(P * 12);
        const W = 760, H = 220, pad = 36, xs = x => pad + (W - 2 * pad) * (x - .2) / .8, lo = profitAt(.2), hi = profitAt(1), ys = y => 18 + (H - 46) * (1 - (y - lo) / (hi - lo));
        const pts = [.2, 1].map(x => `${xs(x)},${ys(profitAt(x))}`).join(' ');
        $('#occ-chart', el).innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Monthly profit versus bookings"><line x1="${pad}" x2="${W - pad}" y1="${ys(0)}" y2="${ys(0)}" stroke="#9a9a8a" stroke-dasharray="4 5"/><text x="${W - pad}" y="${ys(0) - 6}" text-anchor="end" class="ax">break-even</text>
          <polyline points="${pts}" fill="none" stroke="${COL.oak}" stroke-width="3" stroke-linecap="round"/>
          <circle cx="${xs(BE)}" cy="${ys(0)}" r="6" fill="#f1ecdf" stroke="${COL.green}" stroke-width="3"/><text x="${xs(BE)}" y="${ys(0) + 24}" text-anchor="middle" class="lb">${Math.round(BE * 100)}%</text>
          <line x1="${xs(o)}" x2="${xs(o)}" y1="${ys(P)}" y2="${H - 24}" stroke="${COL.oak}" stroke-opacity=".45"/><circle cx="${xs(o)}" cy="${ys(P)}" r="8" fill="${P < 0 ? '#c0604f' : COL.oak}"/>
          ${[20, 40, 60, 80, 100].map(t => `<text x="${xs(t / 100)}" y="${H - 6}" text-anchor="middle" class="ax">${t}%</text>`).join('')}</svg>`;
      }; inp.addEventListener('input', set); set();
    } });

  /* ---- MVP expenses & profits (+ details) */
  add({ id: 'mvp-expenses', ch: 'cashflow', th: 'paper', title: 'MVP’s expenditure and profits', src: ['model'], html: `
    ${tag('MVP’s expenditure and profits')}<h2>What it costs, and <span class="serif">what is left</span></h2>
    <div class="panel xl" data-b="1">${stbl(['Monthly, 1 cluster (10 Tolpods)', 'Per month'], [{ c: ['Cluster monthly expenditure', nb(money(E.cluster[0]))] }, { c: ['Corporate monthly expenditure', money(E.corporate[0])] }, { cls: 'sum', c: ['Total monthly expenditure', nb(money(E.total[0]))] }, { cls: 'good grand', c: ['Monthly profit', nb(money(D.profit[0]))] }])}</div>
    <p class="fine fine-xl" data-b="2">Profit is revenue of ${money(R.total[0])} less expenditure of ${money(E.total[0])}, at 75% capacity. <button class="lnk" data-go="mvp-detail">Tolpods expenditure in detail</button></p>` });
  const clean = t => String(t).replace(/\*+/g, '').replace(/expenses/gi, m => m[0] === 'E' ? 'Expenditure' : 'expenditure').replace(/\bcluster\b/gi, 'Tolpods').replace(/\s+/g, ' ').trim();
  const detRows = D.mvpExpenses.slice(2).filter(r => r[1]).map(r => ({ cls: /^Total/.test(r[0]) ? 'sum' : '', c: [esc(clean(r[0])), /^Total/.test(r[0]) ? nb(r[1]) : r[1]] }));
  const nt = D.mvpExpenseNotes.map(clean), mk = nt.findIndex(x => /^Marketing & Advertising$/.test(x));
  const noteMain = nt.slice(0, mk), noteMk = nt.slice(mk + 1);
  const detPie = expRows.map((r, i) => ({ name: r[0], value: r[1], color: [COL.oak, COL.green, COL.gold, COL.sky, COL.stone][i] }));
  add({ id: 'mvp-detail', ch: 'cashflow', th: 'paper', title: 'Tolpods expenditure in detail', src: ['model'], html: `
    ${tag('Tolpods monthly expenditure at launch of MVP')}<h2>Where the ${money(E.cluster[0])} <span class="serif">goes</span></h2>
    <div class="tri">
      <div class="panel" data-b="1"><h4>Share of spend</h4><div class="dn-col">${donut({ data: detPie, size: 210, thick: 34, center: compact(E.cluster[0]), sub: 'per month' })}${donutLegend(detPie, E.cluster[0], money)}</div></div>
      <div class="panel" data-b="1">${stbl(['Expenditure line', 'Per month'], detRows)}</div>
      <div class="panel notes2" data-b="2"><h4>Notes</h4><ul>${noteMain.map(x => `<li>${esc(x)}</li>`).join('')}</ul><h5>Marketing &amp; advertising</h5><ul>${noteMk.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>` });

  /* ---- Cash flow by phase (big chart) */
  const cashTbl = table(['Monthly, at 75% capacity', ...PH], [
    { c: ['Tolpods rentals (75%)', ...R.cluster75.map(money)] }, { c: ['Elite membership fees', ...R.elite.map(money)] }, { c: ['Other sales items', ...R.other.map(money)] }, { c: ['Cleaning fees', ...R.cleaning.map(money)] },
    { cls: 'sum', c: ['Total revenue', ...R.total.map(money)] }, { c: ['Cluster expenditure*', ...E.cluster.map(money)] }, { c: ['Corporate expenditure', ...E.corporate.map(money)] }, { cls: 'sum', c: ['Total expenditure', ...E.total.map(money)] }, { cls: 'good', c: ['Monthly profit', ...D.profit.map(money)] }]);
  add({ id: 'cashflow', ch: 'appendix', app: true, th: 'paper', title: 'Cash flow by phase', src: ['model'], html: `
    ${tag('Cash flow projections')}<h2>Revenue outruns cost <span class="serif">at every phase</span></h2>
    <div class="panel xl" data-b="1">${legend([{ name: 'Monthly revenue (75% rented)', color: COL.green }, { name: 'Monthly expenditure', color: COL.oak }])}${groupedBars({ labels: PH, series: [{ name: 'Revenue', color: COL.green, values: R.total }, { name: 'Expenditure', color: COL.oak, values: E.total }], H: 370 })}</div>
    <div class="pills" data-b="2">${D.profit.map((v, i) => `<div><i>${PH[i]}</i><b>${compact(v)}</b><span>profit / month</span></div>`).join('')}</div>
    <p class="fine" data-b="2">Revenue is modeled conservatively. *Monthly expenditure decreases 5% per phase from economies of scale and technology. <button class="lnk" data-sheet="cash">Full table</button></p>`, sheets: { cash: ['Monthly cash flow projections', cashTbl] } });

  /* ---- Return on investment (table, like the deck) */
  const roiHead = ['Return on investment', ...PH.map((p, i) => `${p}<br>${clu(D.phases[i].clusters)}`)];
  const roiTbl = stbl(roiHead, [{ c: ['Revenue', ...R.total.map(money)] }, { c: ['Expenditure', ...E.total.map(money)] }, { cls: 'good', c: ['Gross profit', ...D.profit.map(money)] }, { cls: 'sum', c: [`Company value (${ROI.mult[0]}×–${ROI.mult[5]}× revenue)*`, ...ROI.value.map(x => nb(money(x)))] }, { cls: 'stk-row', c: ['Value of 1% stake (about $50k)', ...ROI.s1.map(money)] }, { cls: 'stk-row', c: ['Value of 5% stake (about $200k)', ...ROI.s5.map(money)] }, { cls: 'stk-row', c: ['Value of 20% stake (about $600k)', ...ROI.s20.map(money)] }, { cls: 'good', c: ['Approximate ROI (1% stake)', ...ROI.pct.map(v => nb(v.toLocaleString('en-US') + '%'))] }]);
  const stakeCard = (lab, amt, arr) => `<div class="stk"><i>${lab} stake <small>about ${amt}</small></i><div><span>Phase III</span><b>${compact(arr[3])}</b></div><div><span>IPO phase</span><b class="gold">${compact(arr[5])}</b></div></div>`;
  add({ id: 'roi', ch: 'roi', th: 'night', title: 'Return on investment', src: ['model'], html: `
    ${tag('Return on investment', 'gold')}<h2>What the company could <span class="serif">be worth</span></h2>
    <div class="panel xl dk" data-b="1">${roiTbl}</div>
    <p class="fine light fine-xl" data-b="2">*Revenue multiple increases 1× with every new phase, from ${ROI.mult[0]}× to ${ROI.mult[5]}×. Modeled, not guaranteed. <button class="lnk" data-go="roi-more">See the value chart and stake cards →</button></p>` });
  add({ id: 'roi-more', ch: 'appendix', app: true, th: 'night', title: 'Company value and stakes', src: ['model'], html: `
    ${tag('Return on investment: more', 'gold')}<h2>Company value and <span class="serif">your stake</span></h2>
    <div class="panel xl dk" data-b="1"><h4>Company value, price-to-sales model <small>revenue multiple rises 1× per phase, from ${ROI.mult[0]}× to ${ROI.mult[5]}×</small></h4>${lineChart({ labels: PH, series: [{ name: 'Company value', color: COL.gold, values: ROI.value }], notes: ROI.mult.map(m => m + '× revenue'), H: 340 })}</div>
    <div class="stks" data-b="2">${stakeCard('1%', '$50k', ROI.s1)}${stakeCard('5%', '$200k', ROI.s5)}${stakeCard('20%', '$600k', ROI.s20)}<div class="stk roi"><i>Approximate ROI, 1% stake</i><div><span>Phase III</span><b>+${Math.round(ROI.pct[3]).toLocaleString('en-US')}%</b></div><div><span>IPO phase</span><b class="gold">+${Math.round(ROI.pct[5]).toLocaleString('en-US')}%</b></div></div></div>` });

  /* ---- Stake simulator */
  const flat = [[50000, 1], [200000, 5], [600000, 20]].map(([amt, pct]) => ({ amt, pct }));
  add({ id: 'stake', ch: 'roi', th: 'paper', title: 'Your investment, over time', src: ['model'], html: `
    ${tag('Try it yourself')}<h2>What would <span class="serif">your investment</span> be worth?</h2>
    <div class="sim light xl" data-b="1">
      <div class="sim-ctl"><label for="stk">Pick an investment</label><select id="stk" class="inp">${flat.map((f, i) => `<option value="${i}">${money(f.amt)} for ${f.pct}%</option>`).join('')}</select></div>
      <div class="sim-grid"><div class="sim-k"><i>You invest</i><b id="k-in"></b></div><div class="sim-k"><i>Your investment buys</i><b id="k-pct"></b></div><div class="sim-k key"><i>Value at Phase III</i><b id="k-p3"></b></div><div class="sim-k"><i>Value at IPO phase</i><b id="k-p5"></b></div></div>
      <div id="stk-chart"></div>
    </div>
    <p class="fine fine-xl" data-b="2">Value = your % × modeled company value (${ROI.mult[0]}×–${ROI.mult[5]}× revenue). Before dilution from later rounds and before the SAFE converts, so actual outcomes will differ. Illustrative, not a forecast or guarantee.</p>`,
    init(el) {
      const sel = $('#stk', el), set = () => {
        const f = flat[+sel.value], vals = ROI.value.map(v => v * f.pct / 100);
        $('#k-in', el).textContent = money(f.amt); $('#k-pct', el).textContent = f.pct + '%'; $('#k-p3', el).textContent = `${compact(vals[3])} · ${(vals[3] / f.amt).toFixed(1)}×`; $('#k-p5', el).textContent = `${compact(vals[5])} · ${Math.round(vals[5] / f.amt)}×`;
        $('#stk-chart', el).innerHTML = legend([{ name: 'Invested', color: COL.stone }, { name: 'Modeled stake value', color: COL.green }]) + groupedBars({ labels: PH, series: [{ name: 'Invested', color: COL.stone, values: PH.map(() => f.amt) }, { name: 'Stake value', color: COL.green, values: vals }], H: 300 });
      }; sel.addEventListener('change', set); set();
    } });

  /* ---- Capital: where the money goes */
  const STAR = ['#c79a63', '#4f8a3c', '#c8643c', '#3f7fb3', '#8b5cf6', '#c23b5c', '#6b7280'];
  const cap = [['Product development', C['Product Development'], COL.cream, 1], ['Product purchase', C['Product Purchase'], COL.green, 2], ['Inventory purchase', C['Inventory'], COL.oak, 3], ['Other equipment', C['Other Equipment'], COL.sage, 4], ['Lease & other deposits', C['Lease'], COL.gold, 5], ['Loan servicing', C['Loan Servicing'], COL.stone, 7], ['Miscellaneous', C['Miscellaneous'], COL.clay, 6]];
  const stars = n => `<span class="stars" style="color:${STAR[n - 1]}">${n === 7 ? '†' : '*'.repeat(n)}</span>`;
  const capNote = ['One-time cost for product development', 'First cluster at $50,000 per Tolpods, 10% cheaper thereafter', 'Inventory purchase at $2,000 per Tolpods, on average', 'Other equipment: vehicles for transport; warehouse', 'Leases include office space and other, $20k per airport', 'Miscellaneous includes all human resources costs', 'Loan servicing: until revenues are generated; $10k per cluster after'];
  const capHead = ['Capital requirement', ...PH.map((p, i) => `${p}<br><small class="mo">Month ${D.capMonths[i]}</small>`)];
  const capTbl = stbl(capHead, [...cap.map(c => ({ c: [c[0] + stars(c[3]), ...c[1].map(money)] })), { cls: 'sum', c: ['Total capital requirement', ...C['Total Capital'].map(x => nb(money(x)))] }, { c: ['Projected gross profits', ...C['Projected Gross'].map(money)] }, { cls: 'sum', c: ['Net capital requirement', ...C['Net Capital'].map(money)] }, { cls: 'good divs', c: ['Potential dividends', ...C['Potential'].map(x => nb(money(x)))] }]);
  const capPies = [0, 3, 5].map(i => `<div class="cp"><b>${PH[i]}</b>${donut({ data: cap.map(c => ({ name: c[0], value: c[1][i], color: c[2] })), size: 190, thick: 30, center: compact(C['Total Capital'][i]), sub: 'total', fmt: compact })}</div>`).join('');
  add({ id: 'capital', ch: 'capital', th: 'paper', cls: 'wide', title: 'Investment Dollars Needed', html: `
    ${tag('Capital requirements')}<h2>Investment <span class="serif">Dollars Needed</span></h2>
    <div class="cap-grid" data-b="1">
      <div class="panel xl"><h4>Capital requirement projections</h4>${capTbl}</div>
      <aside class="panel xl stn"><h4>What the stars mean</h4>
        <ol class="stnotes">${cap.slice().sort((a, b) => a[3] - b[3]).map(c => { const t = capNote[c[3] === 7 ? 6 : c[3] - 1].replace(/^[^:]+: /, ''); return `<li>${stars(c[3])}<span><b>${esc(c[0])}</b>${esc(t.charAt(0).toUpperCase() + t.slice(1))}</span></li>`; }).join('')}</ol></aside>
    </div>
    <div class="panel xl" data-b="2"><h4>What each phase pays for</h4>${legend(cap.map(c => ({ name: c[0], color: c[2] })))}<div class="pie-row"><div class="cps">${capPies}</div><p class="pie-note">The largest line is the Tolpods themselves: the first cluster at $50,000 per Tolpods, 10% cheaper with every new phase as orders grow. Inventory averages $2,000 per Tolpods.</p></div></div>` });

  /* ---- Funding: flywheel + sources */
  const src2 = [['MVP', 'Founders, seed investors and debt capital'], ['Phase I', 'Founders and debt capital'], ['Phase II', 'Venture capital firm and debt capital'], ['Phase III', 'Debt capital'], ['Phase IV', 'Profits from operation']];
  add({ id: 'funding', ch: 'capital', th: 'night', title: 'How it gets funded', src: ['model'], html: `
    ${tag('Capital: how we fund it', 'gold')}<h2>Profits start <span class="serif">funding the plan</span></h2>
    <div class="panel xl dk" data-b="1">${legend([{ name: 'Capital needed', color: COL.oak }, { name: 'Projected gross profits', color: COL.green }, { name: 'Net capital needed', color: COL.gold }])}${lineChart({ labels: PH, series: [{ name: 'Capital needed', color: COL.oak, values: C['Total Capital'] }, { name: 'Gross profits', color: COL.green, values: C['Projected Gross'] }, { name: 'Net capital', color: COL.gold, values: C['Net Capital'] }], H: 320 })}</div>
    <div data-b="2"><h3 class="sub-h">Potential Funding Sources</h3><div class="srcs five">${src2.map((x, i) => `<div><i>${x[0]}</i><b>${x[1]}</b></div>`).join('')}</div></div>
    <div class="pair" data-b="3"><div><b>${compact(C['Potential'][4])}</b><span>potential dividends in Phase IV</span></div><div><b>${compact(C['Potential'][5])}</b><span>potential dividends in the IPO phase</span></div></div>` });

  /* ---- Options (seed only) */
  const stageNames = Object.keys(D.options);
  add({ id: 'options', ch: 'options', th: 'night', title: 'Choose how to join', src: ['model'], html: `
    ${tag('Investment options', 'gold')}<h2>Choose how you want <span class="serif">to join</span></h2>
    <div class="split opt-split" data-b="1"><div class="dn-wrap" id="opt-dn"></div><div><p class="sub" id="opt-note"></p><div class="opts" id="opt-list"></div><div class="opt-detail" id="opt-detail"></div></div></div>
    <p class="fine light fine-xl opt-foot" data-b="2">First-come, first-served. Like any startup, this carries real risk. Value is modeled, not guaranteed.</p>`,
    init(el) {
      const st = stageNames[0]; let ix = 0; const draw = () => {
        const s = D.options[st], it = s.items[ix];
        $('#opt-note', el).textContent = `${s.note} · seed investment target ${money(s.target)}`;
        $('#opt-list', el).innerHTML = s.items.map((x, i) => `<button type="button" class="opt ${i === ix ? 'on' : ''}" data-i="${i}"><i>Option ${i + 1}</i><b>${money(x[0])}</b><span>for ${x[1]}%</span></button>`).join('');
        $('#opt-dn', el).innerHTML = donut({ data: [{ name: 'Your stake', value: it[1], color: COL.gold }, { name: 'Everyone else', value: 100 - it[1], color: '#2f3a33' }], size: 250, thick: 36, center: it[1] + '%', sub: 'ownership', fmt: v => v + '%' });
        $('#opt-detail', el).innerHTML = `<dl><dt>Investment</dt><dd>${money(it[0])}</dd><dt>Post-money valuation cap</dt><dd>${money(Math.round(it[0] / it[1] * 100))}</dd><dt>Modeled stake value, IPO phase</dt><dd>${money(Math.round(ROI.value[5] * it[1] / 100))}</dd></dl>`;
        const dn = $('#opt-dn', el); dn.classList.remove('re'); void dn.offsetWidth; dn.classList.add('re');
      };
      el.addEventListener('click', e => { const o = e.target.closest('.opt'); if (o) { ix = +o.dataset.i; draw(); } });
      draw();
    } });

  /* ---- Questions (generic scheduling) */
  const cards = scheduling(settings);
  add({ id: 'questions', ch: 'questions', th: 'night', title: 'Talk to us', html: `
    ${tag('Pick a time with someone on the team', 'gold')}<h2>Talk <span class="serif">to us</span></h2>
    <p class="lede" data-b="1">Pick a time with someone on the team who can answer exactly what you are wondering about. Or send a question and we will reply by email.</p>
    <div class="ask-grid" data-b="2">${cards.map((c, i) => `<div class="ask" data-i="${i}"><div class="ask-i" aria-hidden="true">${c.icon}</div><div><h3>${esc(c.label)}</h3><p>${esc(c.blurb)}</p></div><div class="ask-a"><button class="btn gold" data-avail="${i}">Pick a time</button></div><div class="cal-embed" hidden></div></div>`).join('')}</div>
    <p class="center" data-b="3"><button class="btn ghost light" data-help>Ask a question by email</button></p>` });

  /* ---- Ready to invest: choose an option, we confirm it in the portal */
  const sOpt = D.options[stageNames[0]], MSG = {
    opt: 'THANK YOU FOR INVESTING. Someone from Tolpods will reach out to you via email with the SAFE Contract.',
    other: 'Thank you for your interest. Someone from Tolpods will reach out to you soon.',
    next: 'Thank you for your interest. Please feel free to give us feedback here. We will reach out to you in our next investment stage.',
    no: 'Thank you for your time. Please feel free to give us feedback here. We will remove you from our list of potential investors.' };
  const CH = [...sOpt.items.map((x, i) => ({ key: 'opt' + (i + 1), kind: 'opt', label: `Option ${i + 1}`, amount: x[0], pct: x[1] })),
    { key: 'other', kind: 'other', label: 'Investing: other' }, { key: 'next', kind: 'next', label: 'Contact me in the next stage' }, { key: 'no', kind: 'no', label: 'Not interested' }];
  add({ id: 'boarding', ch: 'questions', th: 'night', title: 'Ready to invest', html: `
    ${tag('Ready to invest', 'gold')}<h2>Your seat <span class="serif">is waiting.</span></h2>
    <p class="lede sm" data-b="1">First-come, first-served · seed investment target <b>${money(sOpt.target)}</b></p>
    <div class="choose" data-b="1" id="choose">
      <div class="ch-row r1">${CH.slice(0, 4).map((c, i) => `<button type="button" class="ch" data-k="${c.key}"><i>SAFE investing</i><em>Option ${i + 1}</em><b>${money(c.amount)}</b><span>for ${c.pct}%</span></button>`).join('')}</div>
      <div class="ch-row r2"><button type="button" class="ch alt" data-k="other"><i>Investing</i><b>OTHER</b></button><button type="button" class="ch alt" data-k="next"><b>CONTACT ME</b><i>in the next stage</i></button><button type="button" class="ch alt no" data-k="no"><b>NOT INTERESTED</b></button></div>
      <div class="ch-confirm" id="ch-confirm" hidden></div>
      <div class="ch-done" id="ch-done" hidden></div>
    </div>
    <p class="fine light disclaim" data-b="2">Choosing an option does not sign anything online. We record your selection in this portal and someone from Tolpods will follow up by email with the SAFE contract. Projections are estimates based on the assumptions in this presentation and are not guarantees. This is not an offer to sell securities except under the definitive signed documents. Investing in early-stage companies is risky and you could lose your entire investment.</p>`,
    init(el) {
      const box = $('#choose', el), conf = $('#ch-confirm', el), done = $('#ch-done', el);
      const showDone = ch => { conf.hidden = true; $$('.ch', box).forEach(b => b.classList.toggle('on', b.dataset.k === ch.key)); done.hidden = false;
        done.innerHTML = `<div class="ch-msg"><b>${esc(ch.kind === 'opt' ? `${ch.label}: ${money(ch.amount)} for ${ch.pct}%` : ch.label)}</b><p>${esc(MSG[ch.kind])}</p><div class="ch-links"><button type="button" class="btn gold" data-portal>Go to my investor portal →</button></div></div>`; };
      if (me.choice) showDone(CH.find(c => c.key === me.choice.key) || CH[0]);
      box.addEventListener('click', async e => {
        if (e.target.closest('[data-portal]')) { opts.onPortal?.(); return; }
        if (e.target.closest('[data-change]')) { done.hidden = true; $$('.ch', box).forEach(b => b.classList.remove('on')); return; }
        const b = e.target.closest('.ch'); if (b) { const ch = CH.find(c => c.key === b.dataset.k); $$('.ch', box).forEach(x => x.classList.toggle('on', x === b)); done.hidden = true;
          const fb = ch.kind !== 'opt'; conf.hidden = false;
          conf.innerHTML = `<div class="ch-c"><h4>${ch.kind === 'opt' ? `Confirm: ${esc(ch.label)}, ${money(ch.amount)} for ${ch.pct}%` : `Confirm: ${esc(ch.label)}`}</h4>
            <label for="ch-fb">${ch.kind === 'other' ? 'Tell us what you have in mind (amount, timing)' : fb ? 'Feedback (optional)' : 'Anything you would like us to know (optional)'}</label><textarea id="ch-fb" class="inp" rows="2" maxlength="800"></textarea>
            <div class="ch-act"><button type="button" class="btn gold" data-confirm="${ch.key}">Confirm my selection</button><span class="fine light" id="ch-err" role="alert"></span></div></div>`;
          conf.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
        const cb = e.target.closest('[data-confirm]'); if (cb) { const ch = CH.find(c => c.key === cb.dataset.confirm); cb.disabled = true; const fb = $('#ch-fb', el).value.trim();
          const r = await opts.onChoose({ key: ch.key, kind: ch.kind, label: ch.label, amount: ch.amount || 0, pct: ch.pct || 0, feedback: fb }); cb.disabled = false;
          if (!r.ok) { $('#ch-err', el).textContent = r.error || 'Could not save. Try again.'; return; } me.choice = r.choice; showDone(ch); setTimeout(() => opts.onPortal?.(), 2600); } });
    } });
  return [...out.filter(x => !x.app), ...out.filter(x => x.app)];
}

/* ---------------- engine ---------------- */
export function renderPresentation(root, opts) {
  const { onHelp, onTrack, onExit, settings } = opts;
  const slides = slidesFor(opts);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = h('div', { class: 'stage' });
  const seen = new Set(); let cur = -1, step = 0, play = null, timer = null, lastMain = 0;
  const mainN = slides.filter(x => !x.app).length;

  slides.forEach((s, i) => {
    const el = h('section', { class: `slide th-${s.th}${s.cls ? ' ' + s.cls : ''}`, 'data-i': i, 'data-ch': s.ch, 'aria-label': s.title, 'aria-hidden': 'true' });
    el.innerHTML = `<div class="sl-in">${s.html}${s.src ? src(s.src) : ''}</div>`;
    stage.append(el); s.el = el; s.max = s.steps ?? Math.max(0, ...$$('[data-b]', el).map(x => +x.dataset.b));
    s.init?.call(s, el);
  });

  const chLabel = h('span', { class: 'p-ch' }), counter = h('span', { class: 'p-n' }), ticks = h('div', { class: 'ticks-bar', role: 'tablist' }), titleEl = h('b', { class: 'p-t' });
  const prev = h('button', { class: 'nb', 'aria-label': 'Previous', onclick: () => back() }, '←'), next = h('button', { class: 'nb pri', 'aria-label': 'Next', onclick: () => fwd() }, h('span', {}, 'Next'), h('i', {}, '→'));
  const bPlay = h('button', { class: 'ib', title: 'Auto-play (P)', 'aria-label': 'Auto-play', onclick: () => togglePlay() }, '▶'), bGrid = h('button', { class: 'ib', title: 'All slides (G)', 'aria-label': 'All slides', onclick: () => grid(true) }, '▦'), bFs = h('button', { class: 'ib fs', title: 'Full screen (F)', 'aria-label': 'Full screen', onclick: () => fullscreen() }, '⤢');
  const top = h('div', { class: 'pres-top' }, h('div', { class: 'p-brand' }, logo(), h('small', {}, 'Investor presentation')), h('div', { class: 'p-mid' }, chLabel, titleEl), h('div', { class: 'p-tools' }, bPlay, bGrid, bFs, opts.onDoc ? h('button', { class: 'btn ghost sm', title: 'Download your signed NDA (PDF)', onclick: () => opts.onDoc() }, 'Signed NDA ⬇') : null, h('button', { class: 'btn ghost sm', onclick: () => onHelp() }, 'Help'), h('button', { class: 'btn ghost sm', onclick: () => onExit() }, 'Save & exit'), h('button', { class: 'btn gold sm', onclick: () => show(slides.findIndex(x => x.id === 'boarding'), 0) }, 'Invest →')));
  slides.forEach((s, i) => s.app ? null : ticks.append(h('button', { class: 'tk', role: 'tab', 'aria-label': `Slide ${i + 1}: ${s.title}`, title: s.title, onclick: () => show(i, 0) })));
  const bottom = h('div', { class: 'pres-bot' }, prev, h('div', { class: 'p-prog' }, ticks, h('div', { class: 'p-meta' }, counter)), next);
  const gridEl = h('div', { class: 'pgrid', hidden: true, role: 'dialog', 'aria-label': 'All slides' });
  const pres = h('div', { class: 'pres' }, top, stage, bottom, gridEl);
  root.replaceChildren(pres); document.body.classList.add('pres-on');

  function applyBuilds(s, scroll = true) {
    $$('[data-b]', s.el).forEach(x => x.classList.toggle('bon', +x.dataset.b <= step));
    if (scroll && step > 0 && !reduce) { const last = $$('[data-b]', s.el).filter(x => +x.dataset.b === step).pop(); if (last) setTimeout(() => last.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 120); }
    s.onStep?.(s.el, step);
  }
  const countUp = el => $$('[data-count]', el).forEach(n => {
    const to = parseFloat(n.dataset.count), dec = +(n.dataset.dec || 0), fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (reduce) { n.textContent = fmt(to); return; } const t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - k, 3); n.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f);
  });
  function show(i, st = 0, full = false) {
    i = Math.max(0, Math.min(slides.length - 1, i)); const s = slides[i], changed = i !== cur;
    if (changed) {
      slides.forEach((x, j) => { x.el.classList.toggle('on', j === i); x.el.classList.toggle('past', j < i); x.el.classList.toggle('future', j > i); x.el.setAttribute('aria-hidden', j === i ? 'false' : 'true'); if (j === i) x.el.scrollTop = 0; });
      if (!s.app) lastMain = i; cur = i; history.replaceState(null, '', '#deck/' + s.id);
      if (!seen.has(s.ch)) { seen.add(s.ch); onTrack('view:' + s.ch); }
    }
    step = full ? s.max : Math.min(st, s.max); applyBuilds(s, !full); if (changed) countUp(s.el);
    const ch = CHAPTERS.find(c => c[0] === s.ch); chLabel.textContent = ch ? ch[1] : ''; titleEl.textContent = s.title;
    counter.textContent = s.app ? 'Appendix' : `${i + 1} / ${mainN}`; $$('.tk', ticks).forEach((t, j) => { t.classList.toggle('on', j === i); t.classList.toggle('done', j < i); t.setAttribute('aria-selected', j === i); });
    const lastS = !s.app && (i === slides.length - 1 || slides[i + 1].app); prev.disabled = i === 0 && step === 0; next.classList.toggle('last', lastS && step >= s.max); next.querySelector('span').textContent = s.app && step >= s.max ? 'Back to presentation' : 'Next'; next.disabled = lastS && step >= s.max;
  }
  function fwd() { const s = slides[cur]; if (step < s.max) return show(cur, step + 1); if (s.app) return lastMain + 1 < slides.length && !slides[lastMain + 1].app ? show(lastMain + 1, 0) : show(lastMain, 0, true); if (cur < slides.length - 1 && !slides[cur + 1].app) show(cur + 1, 0); }
  function back() { const s = slides[cur]; if (step > 0) return show(cur, step - 1); if (s.app) return show(lastMain, 0, true); if (cur > 0) show(cur - 1, 0, true); }
  function togglePlay() { if (play) { clearInterval(play); play = null; bPlay.textContent = '▶'; bPlay.classList.remove('on'); return; } bPlay.textContent = '❚❚'; bPlay.classList.add('on'); play = setInterval(() => { if (slides[cur].app || (cur === slides.length - 1 || slides[cur + 1].app) && step >= slides[cur].max) return togglePlay(); fwd(); }, 3800); }
  function fullscreen() { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => { }); }
  function grid(open) {
    gridEl.hidden = !open; if (!open) return;
    gridEl.replaceChildren(h('div', { class: 'pg-in' }, h('div', { class: 'pg-h' }, h('h3', {}, 'All slides'), h('button', { class: 'btn ghost sm', onclick: () => grid(false) }, 'Close')),
      h('div', { class: 'pg-list' }, slides.map((s, i) => h('button', { class: 'pg-c' + (i === cur ? ' on' : ''), onclick: () => { grid(false); show(i, 0); } }, h('i', {}, s.app ? 'A' : String(i + 1).padStart(2, '0')), h('b', {}, s.title), h('small', {}, CHAPTERS.find(c => c[0] === s.ch)[1]))))));
    gridEl.querySelector('.pg-c.on')?.focus();
  }

  /* input */
  const onKey = e => {
    if (e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.modal-back')) return;
    const t = e.target, tn = t.tagName, formy = tn === 'INPUT' || tn === 'SELECT' || tn === 'TEXTAREA', clicky = tn === 'BUTTON' || tn === 'A', k = e.key;
    if (!gridEl.hidden) { if (k === 'Escape' || k === 'g' || k === 'G') grid(false); return; }
    if (k === 'ArrowRight' || k === 'PageDown') { if (formy) return; e.preventDefault(); fwd(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { if (formy) return; e.preventDefault(); back(); }
    else if ((k === ' ' || k === 'Enter') && !formy && !clicky) { e.preventDefault(); fwd(); }
    else if (k === 'Home' && !formy) show(0, 0); else if (k === 'End' && !formy) show(slides.length - 1, 0);
    else if (formy) return; else if (k === 'g' || k === 'G') grid(true); else if (k === 'p' || k === 'P') togglePlay(); else if (k === 'f' || k === 'F') fullscreen();
  };
  document.addEventListener('keydown', onKey);
  let sx = 0, sy = 0, st0 = 0;
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; st0 = Date.now(); }, { passive: true });
  stage.addEventListener('touchend', e => { if (e.target.closest('input,select,.cal-embed,.tbl-wrap')) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4 && Date.now() - st0 < 700) dx < 0 ? fwd() : back(); }, { passive: true });

  /* in-slide behaviour */
  const jump = i => show(i, 0);
  stage.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g) { const at = slides.findIndex(x => x.id === g.dataset.go); return jump(at < 0 ? 0 : at); }
    const sh = e.target.closest('[data-sheet]'); if (sh) { const s = slides[cur].sheets[sh.dataset.sheet]; const body = h('div', {}); body.innerHTML = s[1]; return modal(s[0], body, { wide: true }); }
    if (e.target.closest('[data-invest]')) return show(slides.findIndex(x => x.id === 'boarding'), 0); if (e.target.closest('[data-help]')) return onHelp();
    const tr = e.target.closest('[data-track]'); if (tr) onTrack(tr.dataset.track);
    const av = e.target.closest('[data-avail]'); if (av) {
      const p = scheduling(settings)[+av.dataset.avail], box = av.closest('.ask').querySelector('.cal-embed'); onTrack('schedule-' + p.id);
      if (!box.hidden) { box.hidden = true; av.textContent = 'Pick a time'; return; }
      const url = p.calendly && !/YOUR-/i.test(p.calendly) ? p.calendly : p.google; box.hidden = false; av.textContent = 'Hide calendar';
      if (!url || /YOUR-/i.test(url)) { box.innerHTML = `<div class="banner warn">Booking for <b>${esc(p.label)}</b> is not switched on yet. Please use <b>Ask a question by email</b> and we will find a time with you.</div>`; return; }
      const u = new URL(url); if (/calendly\.com/.test(u.host)) { u.searchParams.set('embed_domain', location.hostname || 'Tolpods'); u.searchParams.set('embed_type', 'Inline'); u.searchParams.set('hide_gdpr_banner', '1'); }
      box.innerHTML = `<iframe src="${esc(u.href)}" title="${esc(p.label)} calendar" loading="lazy"></iframe><a class="btn ghost light sm" target="_blank" rel="noopener" href="${esc(url)}">Open in a new tab ↗</a>`;
    }
  });

  /* start */
  const want = (opts.start || '').split('/')[0];
  let at = slides.findIndex(s => s.id === want); if (at < 0) at = slides.findIndex(s => s.ch === want); if (at < 0 && /^\d+$/.test(want)) at = +want - 1; if (at < 0) at = 0;
  show(at, 0, at > 0);
  return { destroy() { document.removeEventListener('keydown', onKey); clearInterval(play); document.body.classList.remove('pres-on'); if (document.fullscreenElement) document.exitFullscreen?.(); }, show };
}
