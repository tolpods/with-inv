/* Tiny dependency-free SVG charts. */
import { compact, esc } from './util.js';
const nice = max => { const p = Math.pow(10, Math.floor(Math.log10(max || 1))); const f = max / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
function frame(W, H, pad, max, ticks = 4) {
  const top = nice(max); let g = '';
  for (let i = 0; i <= ticks; i++) { const v = top * i / ticks, y = H - pad.b - (H - pad.t - pad.b) * i / ticks; g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" stroke="var(--c-grid)" stroke-width="1"/><text x="${pad.l - 8}" y="${y + 4}" text-anchor="end" class="ax">${v ? compact(v) : '$0'}</text>`; }
  return { top, g };
}
export function legend(series) { return `<div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`; }
let uid = 0;
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join(''); };
const grad = (id, c) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c, 1.18)}"/><stop offset="1" stop-color="${shade(c, .78)}"/></linearGradient>`;
/* rectangle with only the top corners rounded */
const topRound = (x, y, w, h, r) => { r = Math.min(r, w / 2, h); return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`; };
const smooth = pts => pts.map((p, i) => { if (!i) return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`; const a = pts[i - 1], b = p, t = (b[0] - a[0]) * .38; return `C${(a[0] + t).toFixed(1)} ${a[1].toFixed(1)} ${(b[0] - t).toFixed(1)} ${b[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`; }).join('');
export function groupedBars({ labels, series, W = 1000, H = 420, fmt = compact }) {
  const id = 'g' + (++uid), pad = { l: 64, r: 14, t: 30, b: 50 }, max = Math.max(...series.flatMap(s => s.values)); const { top, g } = frame(W, H, pad, max);
  const gw = (W - pad.l - pad.r) / labels.length, bw = Math.min(54, gw / (series.length + .8)), gap = 6;
  let bars = '', defs = series.map((s, j) => grad(`${id}-${j}`, s.color)).join('');
  labels.forEach((lb, i) => {
    const cx = pad.l + gw * i + gw / 2, tw = series.length * bw + (series.length - 1) * gap;
    series.forEach((s, j) => {
      const v = s.values[i], bh = (H - pad.t - pad.b) * v / top, x = cx - tw / 2 + j * (bw + gap);
      bars += `<path class="bar" d="${topRound(x, H - pad.b - bh, bw, Math.max(bh, 2), 9)}" fill="url(#${id}-${j})" style="--i:${i}"><title>${esc(s.name)} · ${esc(lb)}: ${fmt(v)}</title></path>`;
      if (bh > 0) bars += `<text x="${x + bw / 2}" y="${H - pad.b - bh - 8}" text-anchor="middle" class="val">${fmt(v)}</text>`;
    });
    bars += `<text x="${cx}" y="${H - 20}" text-anchor="middle" class="lb">${esc(lb)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Bar chart"><defs>${defs}</defs>${g}${bars}</svg>`;
}
export function stackedBars({ labels, series, W = 1000, H = 420, totals }) {
  const id = 's' + (++uid), pad = { l: 64, r: 14, t: 34, b: 50 }, sums = labels.map((_, i) => series.reduce((a, s) => a + s.values[i], 0)); const { top, g } = frame(W, H, pad, Math.max(...sums));
  const gw = (W - pad.l - pad.r) / labels.length, bw = Math.min(92, gw * .62); let bars = '', defs = series.map((s, j) => grad(`${id}-${j}`, s.color)).join('');
  labels.forEach((lb, i) => {
    const x = pad.l + gw * i + (gw - bw) / 2; let y = H - pad.b; const live = series.map((s, j) => [s, j]).filter(([s]) => s.values[i] > 0);
    live.forEach(([s, j], k) => { const bh = (H - pad.t - pad.b) * s.values[i] / top; y -= bh; const last = k === live.length - 1;
      bars += last ? `<path class="bar" d="${topRound(x, y, bw, bh, 9)}" fill="url(#${id}-${j})" style="--i:${i}"><title>${esc(s.name)} · ${esc(lb)}: ${compact(s.values[i])}</title></path>`
        : `<rect class="bar" x="${x}" y="${y}" width="${bw}" height="${bh}" fill="url(#${id}-${j})" stroke="var(--c-bg)" stroke-width="1" style="--i:${i}"><title>${esc(s.name)} · ${esc(lb)}: ${compact(s.values[i])}</title></rect>`; });
    bars += `<text x="${x + bw / 2}" y="${y - 9}" text-anchor="middle" class="val">${compact(totals ? totals[i] : sums[i])}</text><text x="${x + bw / 2}" y="${H - 20}" text-anchor="middle" class="lb">${esc(lb)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Stacked bar chart"><defs>${defs}</defs>${g}${bars}</svg>`;
}
/* Smooth line/area chart. notes: optional small captions under each x label (e.g. revenue multiples). */
export function lineChart({ labels, series, W = 1000, H = 420, notes, area = true, fmt = compact }) {
  const id = 'l' + (++uid), pad = { l: 64, r: 34, t: 34, b: notes ? 66 : 50 }, max = Math.max(...series.flatMap(s => s.values)); const { top, g } = frame(W, H, pad, max);
  const gw = (W - pad.l - pad.r) / (labels.length - 1), base = H - pad.b; let out = g, defs = '';
  labels.forEach((lb, i) => { out += `<text x="${pad.l + gw * i}" y="${H - (notes ? 36 : 20)}" text-anchor="middle" class="lb">${esc(lb)}</text>`; if (notes) out += `<text x="${pad.l + gw * i}" y="${H - 16}" text-anchor="middle" class="nt">${esc(notes[i])}</text>`; });
  series.forEach((s, j) => {
    const pts = s.values.map((v, i) => [pad.l + gw * i, base - (H - pad.t - pad.b) * v / top]), d = smooth(pts);
    if (area && series.length < 3) { defs += `<linearGradient id="${id}-${j}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".38"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`; out += `<path class="area" d="${d}L${pts[pts.length - 1][0]} ${base}L${pts[0][0]} ${base}Z" fill="url(#${id}-${j})"/>`; }
    out += `<path class="ln" d="${d}" fill="none" stroke="${s.color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => { out += `<circle cx="${p[0]}" cy="${p[1]}" r="5.5" fill="var(--c-bg)" stroke="${s.color}" stroke-width="3"><title>${esc(s.name)} · ${esc(labels[i])}: ${fmt(s.values[i])}</title></circle>`; });
    const lp = pts[pts.length - 1]; out += `<text x="${lp[0] - 10}" y="${lp[1] - 14}" text-anchor="end" class="val big">${fmt(s.values[s.values.length - 1])}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Line chart"><defs>${defs}</defs>${out}</svg>`;
}

/* Donut / pie. data: [{name,value,color}]. Arcs draw in when an ancestor has .on (see present.css). */
export function donut({ data, size = 280, thick = 38, center = '', sub = '', pie = false, gap = 0.6, fmt = v => compact(v) }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1, r = 50 - (pie ? 0 : thick / 2 * (100 / size)) , R = pie ? 25 : r;
  let acc = 0, arcs = '';
  data.forEach((d, i) => {
    const p = d.value / total * 100, len = Math.max(p - (data.length > 1 ? gap : 0), 0.01);
    const w = pie ? 50 : thick * (100 / size);
    arcs += `<circle class="arc" cx="50" cy="50" r="${R}" pathLength="100" fill="none" stroke="${d.color}" stroke-width="${w}" stroke-dasharray="0 100" style="--d:${len.toFixed(2)} 100;--o:${(-acc).toFixed(2)};--i:${i}" stroke-dashoffset="${(-acc).toFixed(2)}"><title>${esc(d.name)}: ${fmt(d.value)} (${p.toFixed(1)}%)</title></circle>`;
    acc += p;
  });
  const mid = pie ? '' : `<div class="dn-c"><b>${center}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  return `<div class="dn" style="--s:${size}px"><svg viewBox="0 0 100 100" role="img" aria-label="Donut chart"><g transform="rotate(-90 50 50)">${arcs}</g></svg>${mid}</div>`;
}
export function donutLegend(data, total, fmt = compact, pct = true) {
  const t = total ?? data.reduce((a, d) => a + d.value, 0);
  return `<ul class="dn-lg">${data.map(d => `<li><i style="background:${d.color}"></i><span>${esc(d.name)}</span><b>${fmt(d.value)}</b><em>${pct ? (d.value / t * 100).toFixed(d.value / t < .1 ? 1 : 0) + '%' : ''}</em></li>`).join('')}</ul>`;
}
