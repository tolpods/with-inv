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
  model: ['Tolpods financial model (investor deck)']
};
export const CHAPTERS = [['overview', 'Welcome'], ['market', 'Market'], ['product', 'Product'], ['cashflow', 'Cash flow'], ['roi', 'Returns'], ['capital', 'Capital'], ['options', 'Investment options'], ['questions', 'Questions']];

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
const src = keys => `<footer class="sl-src"><span>Sources</span>${keys.map(k => { const s = SRC[k]; return s[1] ? `<a href="${esc(s[1])}" target="_blank" rel="noopener">${esc(s[0])}</a>` : `<em>${esc(s[0])}</em>`; }).join('')}</footer>`;
const tag = (t, c = '') => `<div class="eyebrow ${c}">${t}</div>`;
const table = (head, rows) => `<div class="tbl-wrap"><table class="tbl"><thead><tr>${head.map((x, i) => `<th${i ? '' : ' class="l"'}>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr class="${r.cls || ''}">${r.c.map((x, i) => `<${i ? 'td' : 'th'}${i ? '' : ' class="l"'}>${x}</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;

function slidesFor({ me, settings, productHref, onInvest, onHelp, onTrack }) {
  const D = DECK, R = D.revenue, E = D.expenses, ROI = D.roi, C = D.capital, name = me.profile?.signerName || me.profile?.legalName || me.name || 'investor';
  const out = [];
  const add = s => out.push(s);
  const IPO = PH.length - 1;

  /* ---- Welcome */
  add({ id: 'welcome', ch: 'overview', th: 'night', title: 'Welcome aboard', html: `
    <div class="radar" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    ${tag('Investors by invitation only', 'gold')}
    <h1 class="mega">Tolpods<span class="serif">our focus is on the people.</span></h1>
    <p class="lede" data-b="1">Welcome aboard, <b>${esc(name)}</b>. Set aside about <b>30 minutes</b> to fly the whole plan: the product, the cash flow, the returns, the capital and your options. You can always come back to where you left off. Use <kbd>→</kbd> to move through it.</p>
    <div class="trio" data-b="2">
      <div><i>01</i><h3>A private luxury suite</h3><p>A fully private, luxury suite experience in the middle of the busy airport.</p></div>
      <div><i>02</i><h3>All across the airport</h3><p>Tolpods at different locations throughout the terminal.</p></div>
      <div><i>03</i><h3>Technology meets hospitality</h3><p>Cutting-edge technology, AI and premium hospitality in a private, secure, comfortable space.</p></div>
    </div>
    <div class="cue" data-b="3">Press <kbd>→</kbd> or swipe to begin</div>` });

  /* ---- Agenda: departures board */
  const rows = [['Product details', 'A1', 'overview'], ['Cash flow projections', 'B2', 'cluster'], ['Return on investment', 'B4', 'value'], ['Capital requirements', 'C1', 'capital'], ['Investment options', 'C3', 'options'], ['Your questions', 'D2', 'questions']];
  add({ id: 'agenda', ch: 'overview', th: 'night', title: 'Today’s flight plan', html: `
    ${tag('Departures', 'gold')}<h2>Today’s <span class="serif">flight plan</span></h2>
    <div class="board" role="list"><div class="bh"><span>Flight</span><span>Destination</span><span>Gate</span><span>Status</span></div>
    ${rows.map((r, i) => `<button class="br" data-b="${i + 1}" data-go="${r[2]}" role="listitem"><span>${fl('TP ' + (101 + i), i * 60)}</span><span class="dest">${fl(r[0].toUpperCase(), i * 60 + 120)}</span><span>${fl(r[1], i * 60 + 300)}</span><span class="st ${i === 0 ? 'now' : ''}">${i === 0 ? 'BOARDING' : 'ON TIME'}</span></button>`).join('')}
    </div><p class="fine light" data-b="7">About 30 minutes. Tap any flight to jump straight to it.</p>` });

  /* ---- Overview: where Tolpods sit */
  const pods = n => Array.from({ length: n }, () => '<u></u>').join('');
  add({ id: 'overview', ch: 'overview', th: 'paper', title: 'What Tolpods are', html: `
    ${tag('Tolpods: overview')}<h2>A private suite in the <span class="serif">middle of the airport</span></h2>
    <div class="terminal" aria-label="Tolpods before and after security">
      <div class="zone" data-b="1"><h4>Before security</h4><div class="podrow">${pods(3)}</div><p>Tolpods in the public terminal.</p></div>
      <div class="gate" data-b="2" aria-hidden="true"><span>Security</span></div>
      <div class="zone" data-b="2"><h4>Beyond security</h4><div class="podrow">${pods(5)}</div><p>Tolpods at the gates, where travelers wait.</p></div>
    </div>
    <div class="quad" data-b="3">
      <div><b>Private and secure</b><p>A fully private luxury suite experience with premium hospitality.</p></div>
      <div><b>Technology and AI</b><p>Cutting-edge technology with the help of AI. That is why this works now and would not have five years ago.</p></div>
      <div><b>Open 24/7</b><p>Access through the mobile app, any time the airport is open.</p></div>
      <div><b>Launching in a busy hub</b><p>We plan to start at a busy airport such as Las Vegas or Los Angeles.</p></div>
    </div>` });

  /* ---- Why now */
  add({ id: 'why-now', ch: 'market', th: 'night', title: 'Airports are full', src: ['tsa', 'iata', 'bts'], html: `
    ${tag('The airport opportunity', 'gold')}<h2>Airports have never been <span class="serif">this full</span></h2>
    <div class="big3">
      <div data-b="1"><b><span data-count="3.13" data-dec="2">3.13</span><small>M</small></b><p>people screened by TSA in <em>one day</em>, a new record (late Nov 2025).</p></div>
      <div data-b="2"><b><span data-count="5.2" data-dec="1">5.2</span><small>B</small></b><p>airline passengers forecast by IATA for 2026, up from <span class="nowrap">4.98B</span> in 2025.</p></div>
      <div data-b="3"><b>~1<small> in 4</small></b><p>US domestic flights arrived 15+ minutes late in Q2 2025.</p></div>
    </div>
    <p class="lede" data-b="4">Crowded gates, long waits and delays. Travelers want somewhere calm, private and clean to rest and recharge. <b>That is Tolpods.</b></p>` });

  /* ---- Market (deck numbers) */
  const share = (pct, label) => donut({ data: [{ name: 'Captured', value: pct, color: COL.gold }, { name: 'Rest of market', value: 100 - pct, color: '#d6cfbd' }], size: 190, thick: 26, center: pct + '%', sub: label });
  add({ id: 'market', ch: 'market', th: 'paper', title: 'Your slice of the sky', src: ['model', 'iata'], html: `
    ${tag('Airport travel industry')}<h2>Capture one tenth, <span class="serif">build an empire</span></h2>
    <div class="duo">
      <div class="mk" data-b="1"><div class="eyebrow">United States</div>${share(10, 'of daily travelers')}
        <div class="mk-t"><b><span data-count="2.5" data-dec="1">2.5</span><small> million</small></b><p>people travel through U.S. airports every day.</p><div class="mk-pods"><b data-count="${D.usPods}">${D.usPods.toLocaleString('en-US')}</b> Tolpods installed across the U.S. to capture 1/10th.</div></div></div>
      <div class="mk" data-b="2"><div class="eyebrow">Worldwide</div>${share(10, 'of daily travelers')}
        <div class="mk-t"><b><span data-count="13" data-dec="0">13</span><small> million</small></b><p>people travel through airports worldwide every day.</p><div class="mk-pods"><b data-count="${D.worldPods}">${D.worldPods.toLocaleString('en-US')}</b> Tolpods installed worldwide to capture 1/10th.</div></div></div>
    </div>
    <div class="goal" data-b="3"><div><b data-count="${D.goalPods}">${D.goalPods.toLocaleString('en-US')}</b><span>Tolpods worldwide in seven years is our goal. That is only <em>0.24%</em> of the market.</span></div><div class="goal-bar" aria-hidden="true"><i></i></div></div>
    <p class="fine" data-b="3">Cross-check: IATA’s 4.98B airline passengers in 2025 is about 13.6M a day, in line with the 13M figure above (our arithmetic).</p>` });

  /* ---- Airports want this */
  const acid = [{ name: 'Aeronautical (landing, gate fees)', value: 55.8, color: '#3a4a3f' }, { name: 'Non-aeronautical (retail, services, property)', value: 39.9, color: COL.gold }, { name: 'Non-operating', value: 4.3, color: COL.stone }];
  add({ id: 'airport-money', ch: 'market', th: 'night', title: 'Airports want this too', src: ['aci40', 'aci', 'model'], html: `
    ${tag('Why airports say yes', 'gold')}<h2>Airports are looking for <span class="serif">new revenue</span></h2>
    <div class="split">
      <div class="dn-wrap" data-b="1">${donut({ data: acid, size: 280, thick: 40, center: '39.9%', sub: 'non-flight income', fmt: v => v + '%' })}</div>
      <div>
        ${donutLegend(acid, 100, v => v + '%', false)}
        <div class="fact" data-b="2"><b>$7.08</b><span>non-aeronautical revenue per passenger, worldwide (ACI, FY2017, latest figure we could verify).</span></div>
        <div class="fact" data-b="3"><b>35%</b><span>of gross revenue is what our model pays the airport as rent, so the airport earns on every booking.</span></div>
      </div>
    </div>
    <p class="fine light" data-b="3">ACI World forecasts about 9.8B airport passengers in 2025. Airports count every arrival and departure, which is why that is roughly double the airline figure.</p>` });

  /* ---- Product */
  add({ id: 'product', ch: 'product', th: 'night', title: 'The product', src: ['model'], html: `
    <div class="prod">
      <div>${tag('Tolpods: product', 'gold')}<h2>Step <span class="serif">inside Tolpods</span></h2>
        <p class="lede" data-b="1">Take a tour of a Tolpods model, generated with AI and very close to what Tolpods will look like in real life. Walk around the exterior, enter the cabin, try the chair, the minibars and the lights, all in your browser.</p>
        <ul class="ticks" data-b="2"><li>Fully private suite</li><li>Massage-style chair and minibars</li><li>AI and smart controls</li><li>Cleaned between every guest</li></ul>
        <a class="btn gold lg" data-b="3" href="${esc(productHref)}" data-track="product">Open the interactive Tolpods →</a>
        <p class="fine light" data-b="3">Opens in this window. Use <b>Back to presentation</b> to return to this slide.</p></div>
      <a class="prod-img" data-b="1" href="${esc(productHref)}" data-track="product" aria-label="Open the interactive Tolpods"><img src="../assets/hero.jpg" alt="Tolpods 3D preview"><span>Interactive 3D</span></a>
    </div>` });

  /* ---- Route map (7 years, 5 phases) */
  add({ id: 'route', ch: 'cashflow', th: 'night', title: 'The route to IPO', src: ['model'], steps: 5, html: `
    ${tag('Seven years, five phases', 'gold')}<h2>The route <span class="serif">to IPO</span></h2>
    <div class="route"><svg id="rt" viewBox="0 0 1000 340" role="img" aria-label="Expansion route from MVP to the IPO phase">
      <path id="rt-p" d="M40 270 C 170 270, 190 120, 330 140 S 520 290, 620 190 S 800 40, 960 70" fill="none" stroke="#2c3a36" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
      <path id="rt-d" d="M40 270 C 170 270, 190 120, 330 140 S 520 290, 620 190 S 800 40, 960 70" fill="none" stroke="${COL.gold}" stroke-width="4" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
      <g id="rt-w"></g><g id="rt-pl" class="plane"><path d="M-14 -3 L6 -3 L14 0 L6 3 L-14 3 L-9 0 Z M-4 -3 L-9 -12 L-5 -12 L2 -3 Z M-4 3 L-9 12 L-5 12 L2 3 Z" fill="#fff"/></g></svg>
      <div id="rt-card" class="rt-card"></div></div>
    <p class="fine light">Press <kbd>→</kbd> to fly to the next phase. One cluster is 10 Tolpods. We aim to reach the IPO level within seven years of launching the MVP.</p>`,
    init(el) {
      const p = $('#rt-p', el), L = p.getTotalLength(), g = $('#rt-w', el); const pts = D.phases.map((_, i) => { const l = L * i / 5; const q = p.getPointAtLength(l); return { l, x: q.x, y: q.y }; });
      g.innerHTML = pts.map((q, i) => `<g class="wp" data-i="${i}"><circle cx="${q.x}" cy="${q.y}" r="${7 + i * 1.6}"/><text x="${q.x}" y="${q.y + (i % 2 ? 34 : -22)}" text-anchor="middle">${PH[i]}</text></g>`).join('');
      this.onStep = (e, s) => {
        $$('.wp', e).forEach((w, i) => w.classList.toggle('lit', i <= s));
        const q = pts[s], a = p.getPointAtLength(Math.max(0, q.l - 2)), b = p.getPointAtLength(Math.min(L, q.l + 2)); const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
        $('#rt-pl', e).style.transform = `translate(${q.x}px,${q.y}px) rotate(${ang}deg) scale(1.15)`;
        $('#rt-d', e).style.strokeDashoffset = String(1 - s / 5);
        const ph = D.phases[s]; $('#rt-card', e).innerHTML = `<div class="eyebrow gold">${s === IPO ? 'IPO phase' : s ? 'Phase ' + ['', 'I', 'II', 'III', 'IV'][s] + ' expansion' : 'MVP'} · month ${D.capMonths[s]}</div><div class="rt-n"><b>${ph.pods.toLocaleString('en-US')}</b><span>Tolpods in <em>${ph.clusters}</em> ${ph.clusters === 1 ? 'cluster' : 'clusters'}</span></div><dl><dt>Monthly revenue</dt><dd>${compact(R.total[s])}</dd><dt>Monthly profit</dt><dd>${compact(D.profit[s])}</dd><dt>Capital needed</dt><dd>${compact(C['Total Capital'][s])}</dd></dl>`;
      };
    } });

  /* ---- One cluster, one month: two donuts */
  const ex = Object.fromEntries(D.mvpExpenses.filter(r => r[1]).map(r => [r[0].replace(/\*+$/, '').trim(), dollars(r[1])]));
  const sum = (...k) => k.reduce((a, x) => a + (ex[x] || 0), 0);
  const expG = [
    { name: 'Airport rent (35% of gross revenue)', value: ex['Rent'], color: COL.oak },
    { name: 'People (3 full-time, 4 part-time, payroll)', value: sum('Salaries - Full Time Employees', 'Salaries - Part time Employees', 'Payroll & Related Expenses'), color: COL.green },
    { name: 'Marketing & advertising', value: ex['Marketing & Advertising'], color: COL.gold },
    { name: 'Office & equipment', value: sum('Equipment Rental', 'Office Space', 'Office Expenses'), color: COL.sky },
    { name: 'Maintenance, tech, insurance, other', value: sum('Tolpods Maintenance', 'Other Tolpods Misc. Expenses', 'Technology Costs', 'Insurance & Other Fees', 'Misc. & Unexpected Expenses', 'Travel'), color: COL.stone }
  ];
  const revG = [{ name: 'Tolpods rentals (75% booked)', value: R.cluster75[0], color: COL.green }, { name: 'Elite membership fees', value: R.elite[0], color: COL.gold }, { name: 'Other sales items', value: R.other[0], color: COL.sky }, { name: 'Cleaning fees', value: R.cleaning[0], color: COL.clay }];
  add({ id: 'cluster', ch: 'cashflow', th: 'paper', title: 'One cluster, one month', src: ['model'], html: `
    ${tag('Cash flow: the MVP')}<h2>One cluster. Ten Tolpods. <span class="serif">One month.</span></h2>
    <div class="duo tight">
      <div class="panel" data-b="1"><h4>Revenue <small>${money(R.total[0])} / month</small></h4><div class="dn-row">${donut({ data: revG, size: 190, thick: 28, center: compact(R.total[0]), sub: 'revenue' })}${donutLegend(revG, null, money)}</div></div>
      <div class="panel" data-b="2"><h4>Expenditure <small>${money(E.cluster[0])} cluster · ${money(E.corporate[0])} corporate</small></h4><div class="dn-row">${donut({ data: expG, size: 190, thick: 28, center: compact(E.cluster[0]), sub: 'cluster' })}${donutLegend(expG, null, money)}</div></div>
    </div>
    <div class="callout" data-b="3"><b>${money(D.profit[0])}</b><span>monthly profit at launch, after ${money(E.total[0])} of total expenditure, with every Tolpods rented 75% of the time. Elite membership is 5 members a day per cluster at about $4.58 a month; cleaning averages one a day at $75.</span></div>` });

  /* ---- How we reach $101,873 (pricing) */
  const RT = [['Long-term', '4 hours or more', 19.99, 15.99], ['Short-term', '1 to 4 hours', 21.99, 17.99], ['One hour or less', 'per hour', 23.99, 19.99]];
  const day = { reg: [119.94, 263.88, 109.95], pre: [95.94, 215.88, 99.95] };
  const dayBar = (a, col) => { const t = a.reduce((x, y) => x + y, 0); return `<div class="dbar">${a.map((v, i) => `<i style="flex:${v};background:${shade(col, [1.12, 1, .84][i])};color:${col === COL.gold ? '#2a2108' : '#fff'}" title="${RT[i][0]}: $${v.toFixed(2)}"><span>$${v.toFixed(0)}</span></i>`).join('')}</div><small>$${t.toFixed(2)} a day</small>`; };
  add({ id: 'pricing', ch: 'cashflow', th: 'night', title: 'How we reach $101,873', src: ['model'], html: `
    ${tag('Cash flow: revenue', 'gold')}<h2>How one cluster reaches <span class="serif">${money(Math.round(R.cluster75[0]))}</span></h2>
    <div class="rates" data-b="1">${RT.map(r => `<div class="rate"><i>${r[0]}</i><small>${r[1]}</small><div><span>Regular</span><b>$${r[2]}</b></div><div><span>Premier</span><b class="gold">$${r[3]}</b></div><em>per hour</em></div>`).join('')}</div>
    <div class="panel dk" data-b="2"><h4>One Tolpods, one full day <small>6 h long-term · 12 h short-term · 5 h one-hour rate (1 h for cleaning)</small></h4><div class="days"><div><span>Regular member</span>${dayBar(day.reg, COL.green)}</div><div><span>Premier member</span>${dayBar(day.pre, COL.gold)}</div></div></div>
    <div class="chain" data-b="3"><div><i>Average at 75% capacity</i><b>$339.58</b><small>per Tolpods, per day</small></div><span>×10</span><div><i>One cluster</i><b>$3,395.78</b><small>per day</small></div><span>×30</span><div class="end"><i>One cluster</i><b>${money(R.cluster75[0])}</b><small>per month</small></div></div>
    <p class="fine light" data-b="3">Regular members are free; Premier members pay a membership and get lower rates. We assume about half of customers are each. Short-term rates apply about half of the day.</p>` });

  /* ---- Occupancy simulator */
  const FULL = dollars(D.mvpRevenue[0][1]), FIXREV = R.elite[0] + R.other[0] + R.cleaning[0], RENT = .35, FIXC = E.cluster[0] - ex['Rent'] + E.corporate[0];
  const profitAt = o => (1 - RENT) * (FULL * o + FIXREV) - FIXC, BE = ((FIXC / (1 - RENT)) - FIXREV) / FULL;
  add({ id: 'occupancy', ch: 'cashflow', th: 'paper', title: 'How full does it need to be?', src: ['model'], html: `
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

  /* ---- Cash flow by phase (big chart) */
  const cashTbl = table(['Monthly, at 75% capacity', ...PH], [
    { c: ['Tolpods rentals (75%)', ...R.cluster75.map(money)] }, { c: ['Elite membership fees', ...R.elite.map(money)] }, { c: ['Other sales items', ...R.other.map(money)] }, { c: ['Cleaning fees', ...R.cleaning.map(money)] },
    { cls: 'sum', c: ['Total revenue', ...R.total.map(money)] }, { c: ['Cluster expenditure*', ...E.cluster.map(money)] }, { c: ['Corporate expenditure', ...E.corporate.map(money)] }, { cls: 'sum', c: ['Total expenditure', ...E.total.map(money)] }, { cls: 'good', c: ['Monthly profit', ...D.profit.map(money)] }]);
  add({ id: 'cashflow', ch: 'cashflow', th: 'paper', title: 'Cash flow by phase', src: ['model'], html: `
    ${tag('Cash flow projections')}<h2>Revenue outruns cost <span class="serif">at every phase</span></h2>
    <div class="panel xl" data-b="1">${legend([{ name: 'Monthly revenue (75% rented)', color: COL.green }, { name: 'Monthly expenditure', color: COL.oak }])}${groupedBars({ labels: PH, series: [{ name: 'Revenue', color: COL.green, values: R.total }, { name: 'Expenditure', color: COL.oak, values: E.total }], H: 370 })}</div>
    <div class="pills" data-b="2">${D.profit.map((v, i) => `<div><i>${PH[i]}</i><b>${compact(v)}</b><span>profit / month</span></div>`).join('')}</div>
    <p class="fine" data-b="2">Revenue is modeled conservatively. *Monthly expenditure decreases 5% per phase from economies of scale and technology. <button class="lnk" data-sheet="cash">Full table</button></p>`, sheets: { cash: ['Monthly cash flow projections', cashTbl] } });

  /* ---- Company value + stake values */
  const roiTbl = table(['', ...PH], [{ c: ['Revenue', ...R.total.map(money)] }, { c: ['Expenditure', ...E.total.map(money)] }, { cls: 'good', c: ['Gross profit', ...D.profit.map(money)] }, { cls: 'sum', c: [`Company value (${ROI.mult[0]}×–${ROI.mult[5]}× revenue)`, ...ROI.value.map(money)] }, { c: ['1% stake (about $50k)', ...ROI.s1.map(money)] }, { c: ['5% stake (about $200k)', ...ROI.s5.map(money)] }, { c: ['20% stake (about $600k)', ...ROI.s20.map(money)] }, { cls: 'good', c: ['Approximate ROI (1% stake)', ...ROI.pct.map(v => v.toLocaleString('en-US') + '%')] }]);
  const stakeCard = (lab, amt, arr) => `<div class="stk"><i>${lab} stake <small>about ${amt}</small></i><div><span>Phase III</span><b>${compact(arr[3])}</b></div><div><span>IPO phase</span><b class="gold">${compact(arr[5])}</b></div></div>`;
  add({ id: 'value', ch: 'roi', th: 'night', title: 'What the company could be worth', src: ['model'], html: `
    ${tag('Return on investment', 'gold')}<h2>What the company could <span class="serif">be worth</span></h2>
    <div class="panel xl dk" data-b="1"><h4>Company value, price-to-sales model <small>revenue multiple rises 1× per phase, from ${ROI.mult[0]}× to ${ROI.mult[5]}×</small></h4>${lineChart({ labels: PH, series: [{ name: 'Company value', color: COL.gold, values: ROI.value }], notes: ROI.mult.map(m => m + '× revenue'), H: 360 })}</div>
    <div class="stks" data-b="2">${stakeCard('1%', '$50k', ROI.s1)}${stakeCard('5%', '$200k', ROI.s5)}${stakeCard('20%', '$600k', ROI.s20)}<div class="stk roi"><i>Approximate ROI, 1% stake</i><div><span>Phase III</span><b>+${Math.round(ROI.pct[3]).toLocaleString('en-US')}%</b></div><div><span>IPO phase</span><b class="gold">+${Math.round(ROI.pct[5]).toLocaleString('en-US')}%</b></div></div></div>
    <p class="fine light" data-b="2">Conservative early on. Modeled, not guaranteed. At the IPO phase we would hold only 0.24% of the worldwide market. <button class="lnk" data-sheet="roi">Full table</button></p>`, sheets: { roi: ['Return on investment projections', roiTbl] } });

  /* ---- Stake simulator */
  const flat = []; Object.entries(D.options).forEach(([sn, st]) => st.items.forEach(([amt, pct]) => flat.push({ sn, amt, pct })));
  add({ id: 'stake', ch: 'roi', th: 'paper', title: 'Your stake, over time', src: ['model'], html: `
    ${tag('Try it yourself')}<h2>What would <span class="serif">your stake</span> be worth?</h2>
    <div class="sim light xl" data-b="1">
      <div class="sim-ctl"><label for="stk">Pick an investment</label><select id="stk" class="inp">${flat.map((f, i) => `<option value="${i}">${money(f.amt)} for ${f.pct}%</option>`).join('')}</select></div>
      <div class="sim-grid"><div class="sim-k"><i>You invest</i><b id="k-in"></b></div><div class="sim-k"><i>Your stake</i><b id="k-pct"></b></div><div class="sim-k hl"><i>Value at Phase III</i><b id="k-p3"></b></div><div class="sim-k"><i>Value at IPO phase</i><b id="k-p5"></b></div></div>
      <div id="stk-chart"></div>
    </div>
    <p class="fine" data-b="2">Value = your % × modeled company value (${ROI.mult[0]}×–${ROI.mult[5]}× revenue). Before dilution from later rounds and before the SAFE converts, so actual outcomes will differ. Illustrative, not a forecast or guarantee.</p>`,
    init(el) {
      const sel = $('#stk', el), set = () => {
        const f = flat[+sel.value], vals = ROI.value.map(v => v * f.pct / 100);
        $('#k-in', el).textContent = money(f.amt); $('#k-pct', el).textContent = f.pct + '%'; $('#k-p3', el).textContent = `${compact(vals[3])} · ${(vals[3] / f.amt).toFixed(1)}×`; $('#k-p5', el).textContent = `${compact(vals[5])} · ${Math.round(vals[5] / f.amt)}×`;
        $('#stk-chart', el).innerHTML = legend([{ name: 'Invested', color: COL.stone }, { name: 'Modeled stake value', color: COL.green }]) + groupedBars({ labels: PH, series: [{ name: 'Invested', color: COL.stone, values: PH.map(() => f.amt) }, { name: 'Stake value', color: COL.green, values: vals }], H: 300 });
      }; sel.addEventListener('change', set); set();
    } });

  /* ---- Capital: where the money goes */
  const cap = [['Product purchase', C['Product Purchase'], COL.green], ['Inventory', C['Inventory'], COL.oak], ['Other equipment', C['Other Equipment'], COL.sage], ['Leases & deposits', C['Lease'], COL.gold], ['Product development', C['Product Development'], COL.cream], ['Loan servicing', C['Loan Servicing'], COL.stone], ['Miscellaneous (incl. HR)', C['Miscellaneous'], COL.clay]];
  const capTot = cap.map(c => ({ name: c[0], value: c[1].reduce((a, b) => a + b, 0), color: c[2] })), capSum = capTot.reduce((a, b) => a + b.value, 0);
  const capTbl = table(['Capital requirement', ...PH.map((p, i) => `${p}<br><small>Month ${D.capMonths[i]}</small>`)], [...cap.map(c => ({ c: [c[0], ...c[1].map(money)] })), { cls: 'sum', c: ['Total capital requirement', ...C['Total Capital'].map(money)] }, { c: ['Projected gross profits', ...C['Projected Gross'].map(money)] }, { cls: 'sum', c: ['Net capital requirement', ...C['Net Capital'].map(money)] }, { cls: 'good', c: ['Potential dividends', ...C['Potential'].map(money)] }]);
  add({ id: 'capital', ch: 'capital', th: 'paper', title: 'Where the money goes', src: ['model'], html: `
    ${tag('Capital requirements')}<h2>Where every dollar <span class="serif">goes</span></h2>
    <div class="panel xl" data-b="1"><h4>By phase <small>total capital requirement ${compact(capSum)}</small></h4>${legend(cap.map(c => ({ name: c[0], color: c[2] })))}${stackedBars({ labels: PH, series: cap.map(c => ({ name: c[0], color: c[2], values: c[1] })), totals: C['Total Capital'], H: 360 })}</div>
    <div class="panel" data-b="2"><h4>Across all six phases <small>${compact(capSum)}</small></h4><div class="dn-row">${donut({ data: capTot, size: 190, thick: 28, center: compact(capSum), sub: 'total capital' })}${donutLegend(capTot, capSum, compact)}</div></div>
    <p class="fine" data-b="2">The largest line is the Tolpods themselves: the first cluster at $50,000 per Tolpods, 10% cheaper with every new phase as orders grow. Inventory averages $2,000 per Tolpods. <button class="lnk" data-sheet="cap">Full table and notes</button></p>`, sheets: { cap: ['Capital requirements by phase', capTbl + `<ul class="notes">${D.capNotes.filter(x => x.startsWith('*') || x.startsWith('until')).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`] } });

  /* ---- Funding: flywheel + sources */
  const src2 = [['Founders', 'A big share of the capital to reach MVP, provided by the founders.'], ['Friends & family', 'A limited chance for our closest circle to invest on the ground floor.'], ['Bank and business loans', 'Private and commercial loans fill the remaining gaps if needed.'], ['One venture capital round', 'Capital plus expertise to expand, for up to 25% equity.']];
  add({ id: 'funding', ch: 'capital', th: 'night', title: 'How it gets funded', src: ['model'], html: `
    ${tag('Capital: how we fund it', 'gold')}<h2>Profits start <span class="serif">funding the plan</span></h2>
    <div class="panel xl dk" data-b="1">${legend([{ name: 'Capital needed', color: COL.oak }, { name: 'Projected gross profits', color: COL.green }, { name: 'Net capital needed', color: COL.gold }])}${lineChart({ labels: PH, series: [{ name: 'Capital needed', color: COL.oak, values: C['Total Capital'] }, { name: 'Gross profits', color: COL.green, values: C['Projected Gross'] }, { name: 'Net capital', color: COL.gold, values: C['Net Capital'] }], H: 340 })}</div>
    <div class="srcs" data-b="2">${src2.map((s, i) => `<div><i>0${i + 1}</i><b>${s[0]}</b><p>${s[1]}</p></div>`).join('')}</div>
    <div class="callout" data-b="3"><b>${compact(C['Potential'][4])}</b><span>potential dividends in Phase IV (month ${D.capMonths[4]}), rising to <b class="in">${compact(C['Potential'][5])}</b> in the IPO phase. No outside funding is needed once Tolpods reaches Phase IV. We expect only a small equity share at seed level, before MVP.</span></div>` });

  /* ---- Options (seed only) */
  const stageNames = Object.keys(D.options);
  add({ id: 'options', ch: 'options', th: 'night', title: 'Choose how to join', src: ['model'], html: `
    ${tag('Investment options', 'gold')}<h2>Choose how you want <span class="serif">to join</span></h2>
    <div class="split opt-split" data-b="1"><div class="dn-wrap" id="opt-dn"></div><div><p class="sub" id="opt-note"></p><div class="opts" id="opt-list"></div><div class="opt-detail" id="opt-detail"></div></div></div>
    <div class="callout" data-b="2"><b>1–10%</b><span>of Tolpods for up to $300k, at the ground floor. Once MVP is reached, the investment needed for these ownership levels rises significantly. Like any startup, this carries real risk.</span></div>`,
    init(el) {
      const st = stageNames[0]; let ix = 0; const draw = () => {
        const s = D.options[st], it = s.items[ix];
        $('#opt-note', el).textContent = `${s.note} · seed investment target ${money(s.target)}`;
        $('#opt-list', el).innerHTML = s.items.map((x, i) => `<button type="button" class="opt ${i === ix ? 'on' : ''}" data-i="${i}"><i>Option ${i + 1}</i><b>${money(x[0])}</b><span>for ${x[1]}%</span></button>`).join('');
        $('#opt-dn', el).innerHTML = donut({ data: [{ name: 'Your stake', value: it[1], color: COL.gold }, { name: 'Everyone else', value: 100 - it[1], color: '#2f3a33' }], size: 250, thick: 36, center: it[1] + '%', sub: 'ownership', fmt: v => v + '%' });
        $('#opt-detail', el).innerHTML = `<dl><dt>Investment</dt><dd>${money(it[0])}</dd><dt>Post-money valuation cap</dt><dd>${money(Math.round(it[0] / it[1] * 100))}</dd></dl>`;
        const dn = $('#opt-dn', el); dn.classList.remove('re'); void dn.offsetWidth; dn.classList.add('re');
      };
      el.addEventListener('click', e => { const o = e.target.closest('.opt'); if (o) { ix = +o.dataset.i; draw(); } });
      draw();
    } });

  /* ---- Questions (generic scheduling) */
  const cards = scheduling(settings);
  add({ id: 'questions', ch: 'questions', th: 'night', title: 'Talk to us', html: `
    ${tag('Before you decide', 'gold')}<h2>Talk to us <span class="serif">before you decide</span></h2>
    <p class="lede" data-b="1">Pick a time with someone on the team who can answer exactly what you are wondering about. Or send a question and we will reply by email.</p>
    <div class="ask-grid" data-b="2">${cards.map((c, i) => `<div class="ask" data-i="${i}"><div class="ask-i" aria-hidden="true">${c.icon}</div><div><h3>${esc(c.label)}</h3><p>${esc(c.blurb)}</p></div><div class="ask-a"><button class="btn gold" data-avail="${i}">Pick a time</button></div><div class="cal-embed" hidden></div></div>`).join('')}</div>
    <p class="center" data-b="3"><button class="btn ghost light" data-help>Ask a question by email</button></p>` });

  /* ---- Boarding pass */
  const bars = Array.from({ length: 46 }, (_, i) => { const w = [2, 1, 3, 1, 2, 4, 1, 2][(i * 5 + 3) % 8]; return `<i style="width:${w}px"></i>`; }).join('');
  add({ id: 'boarding', ch: 'questions', th: 'night', title: 'Ready to board?', html: `
    ${tag('Ready to invest', 'gold')}<h2>Your seat <span class="serif">is waiting.</span></h2>
    <div class="pass" data-b="1">
      <div class="pass-main"><div class="pass-top"><b>Tolpods</b><span>BOARDING PASS · SEED ROUND</span></div>
        <div class="pass-row"><div><i>Passenger</i><b>${esc(String(name).toUpperCase())}</b></div><div><i>From</i><b>CURIOUS</b></div><div><i>To</i><b>INVESTOR</b></div></div>
        <div class="pass-row"><div><i>Flight</i><b>TP 001</b></div><div><i>Gate</i><b>SAFE</b></div><div><i>Seat</i><b>SEED</b></div><div><i>Boarding</i><b>NOW</b></div></div></div>
      <div class="pass-stub"><div class="barcode" aria-hidden="true">${bars}</div><button class="btn gold lg" data-invest>Board: sign the SAFE →</button></div>
    </div>
    <p class="fine light disclaim" data-b="2">Complete your SAFE (Simple Agreement for Future Equity); your NDA and SAFE are both emailed to you. Projections are estimates based on the assumptions in this presentation and are not guarantees. This is not an offer to sell securities except under the definitive signed documents. Investing in early-stage companies is risky and you could lose your entire investment.</p>` });
  return out;
}

/* ---------------- engine ---------------- */
export function renderPresentation(root, opts) {
  const { onInvest, onHelp, onTrack, onExit, settings } = opts;
  const slides = slidesFor(opts);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = h('div', { class: 'stage' });
  const seen = new Set(); let cur = -1, step = 0, play = null, timer = null;

  slides.forEach((s, i) => {
    const el = h('section', { class: `slide th-${s.th}`, 'data-i': i, 'data-ch': s.ch, 'aria-label': s.title, 'aria-hidden': 'true' });
    el.innerHTML = `<div class="sl-in">${s.html}${s.src ? src(s.src) : ''}</div>`;
    stage.append(el); s.el = el; s.max = s.steps ?? Math.max(0, ...$$('[data-b]', el).map(x => +x.dataset.b));
    s.init?.call(s, el);
  });

  const chLabel = h('span', { class: 'p-ch' }), counter = h('span', { class: 'p-n' }), ticks = h('div', { class: 'ticks-bar', role: 'tablist' }), titleEl = h('b', { class: 'p-t' });
  const prev = h('button', { class: 'nb', 'aria-label': 'Previous', onclick: () => back() }, '←'), next = h('button', { class: 'nb pri', 'aria-label': 'Next', onclick: () => fwd() }, h('span', {}, 'Next'), h('i', {}, '→'));
  const bPlay = h('button', { class: 'ib', title: 'Auto-play (P)', 'aria-label': 'Auto-play', onclick: () => togglePlay() }, '▶'), bGrid = h('button', { class: 'ib', title: 'All slides (G)', 'aria-label': 'All slides', onclick: () => grid(true) }, '▦'), bFs = h('button', { class: 'ib fs', title: 'Full screen (F)', 'aria-label': 'Full screen', onclick: () => fullscreen() }, '⤢');
  const top = h('div', { class: 'pres-top' }, h('div', { class: 'p-brand' }, h('b', {}, 'Tolpods'), h('small', {}, 'Investor presentation')), h('div', { class: 'p-mid' }, chLabel, titleEl), h('div', { class: 'p-tools' }, bPlay, bGrid, bFs, opts.onDoc ? h('button', { class: 'btn ghost sm', title: 'Download your signed NDA (PDF)', onclick: () => opts.onDoc() }, 'Signed NDA ⬇') : null, h('button', { class: 'btn ghost sm', onclick: () => onHelp() }, 'Help'), h('button', { class: 'btn ghost sm', onclick: () => onExit() }, 'Save & exit'), h('button', { class: 'btn gold sm', onclick: () => onInvest() }, 'Invest →')));
  slides.forEach((s, i) => ticks.append(h('button', { class: 'tk', role: 'tab', 'aria-label': `Slide ${i + 1}: ${s.title}`, title: s.title, onclick: () => show(i, 0) })));
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
      cur = i; history.replaceState(null, '', '#deck/' + s.id);
      if (!seen.has(s.ch)) { seen.add(s.ch); onTrack('view:' + s.ch); }
    }
    step = full ? s.max : Math.min(st, s.max); applyBuilds(s, !full); if (changed) countUp(s.el);
    const ch = CHAPTERS.find(c => c[0] === s.ch); chLabel.textContent = ch ? ch[1] : ''; titleEl.textContent = s.title;
    counter.textContent = `${i + 1} / ${slides.length}`; $$('.tk', ticks).forEach((t, j) => { t.classList.toggle('on', j === i); t.classList.toggle('done', j < i); t.setAttribute('aria-selected', j === i); });
    prev.disabled = i === 0 && step === 0; next.classList.toggle('last', i === slides.length - 1 && step >= s.max); next.querySelector('span').textContent = i === slides.length - 1 && step >= s.max ? 'Invest' : 'Next';
  }
  function fwd() { const s = slides[cur]; if (step < s.max) show(cur, step + 1); else if (cur < slides.length - 1) show(cur + 1, 0); else onInvest(); }
  function back() { if (step > 0) show(cur, step - 1); else if (cur > 0) show(cur - 1, 0, true); }
  function togglePlay() { if (play) { clearInterval(play); play = null; bPlay.textContent = '▶'; bPlay.classList.remove('on'); return; } bPlay.textContent = '❚❚'; bPlay.classList.add('on'); play = setInterval(() => { if (cur === slides.length - 1 && step >= slides[cur].max) return togglePlay(); fwd(); }, 3800); }
  function fullscreen() { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => { }); }
  function grid(open) {
    gridEl.hidden = !open; if (!open) return;
    gridEl.replaceChildren(h('div', { class: 'pg-in' }, h('div', { class: 'pg-h' }, h('h3', {}, 'All slides'), h('button', { class: 'btn ghost sm', onclick: () => grid(false) }, 'Close')),
      h('div', { class: 'pg-list' }, slides.map((s, i) => h('button', { class: 'pg-c' + (i === cur ? ' on' : ''), onclick: () => { grid(false); show(i, 0); } }, h('i', {}, String(i + 1).padStart(2, '0')), h('b', {}, s.title), h('small', {}, CHAPTERS.find(c => c[0] === s.ch)[1]))))));
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
    if (e.target.closest('[data-invest]')) return onInvest(); if (e.target.closest('[data-help]')) return onHelp();
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
