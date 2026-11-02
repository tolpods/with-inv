/* Tiny dependency-free SVG charts. */
import { compact, esc } from './util.js';
const nice = max => { const p = Math.pow(10, Math.floor(Math.log10(max || 1))); const f = max / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
function frame(W, H, pad, max, ticks = 4) {
  const top = nice(max); let g = '';
  for (let i = 0; i <= ticks; i++) { const v = top * i / ticks, y = H - pad.b - (H - pad.t - pad.b) * i / ticks; g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" stroke="var(--c-grid)" stroke-width="1"/><text x="${pad.l - 8}" y="${y + 4}" text-anchor="end" class="ax">${v ? compact(v) : '$0'}</text>`; }
  return { top, g };
}
export function legend(series) { return `<div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`; }
export function groupedBars({ labels, series, W = 760, H = 330, fmt = compact }) {
  const pad = { l: 56, r: 10, t: 16, b: 44 }, max = Math.max(...series.flatMap(s => s.values)); const { top, g } = frame(W, H, pad, max);
  const gw = (W - pad.l - pad.r) / labels.length, bw = Math.min(34, gw / (series.length + 1));
  let bars = '';
  labels.forEach((lb, i) => {
    const cx = pad.l + gw * i + gw / 2;
    series.forEach((s, j) => {
      const v = s.values[i], bh = (H - pad.t - pad.b) * v / top, x = cx - (series.length * bw) / 2 + j * bw + 1;
      bars += `<rect class="bar" x="${x}" y="${H - pad.b - bh}" width="${bw - 2}" height="${Math.max(bh, 1)}" rx="3" fill="${s.color}" style="--i:${i}"><title>${esc(s.name)}: ${fmt(v)}</title></rect>`;
      if (gw > 70 && bh > 0) bars += `<text x="${x + (bw - 2) / 2}" y="${H - pad.b - bh - 5}" text-anchor="middle" class="val">${fmt(v)}</text>`;
    });
    bars += `<text x="${cx}" y="${H - 18}" text-anchor="middle" class="lb">${esc(lb)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Bar chart">${g}${bars}</svg>`;
}
export function stackedBars({ labels, series, W = 760, H = 330, totals }) {
  const pad = { l: 56, r: 10, t: 22, b: 44 }, sums = labels.map((_, i) => series.reduce((a, s) => a + s.values[i], 0)); const { top, g } = frame(W, H, pad, Math.max(...sums));
  const gw = (W - pad.l - pad.r) / labels.length, bw = Math.min(64, gw * .6); let bars = '';
  labels.forEach((lb, i) => {
    const x = pad.l + gw * i + (gw - bw) / 2; let y = H - pad.b;
    series.forEach(s => { const bh = (H - pad.t - pad.b) * s.values[i] / top; if (bh <= 0) return; y -= bh; bars += `<rect class="bar" x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${s.color}" style="--i:${i}"><title>${esc(s.name)}: ${compact(s.values[i])}</title></rect>`; });
    bars += `<text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" class="val">${compact(totals ? totals[i] : sums[i])}</text><text x="${x + bw / 2}" y="${H - 18}" text-anchor="middle" class="lb">${esc(lb)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Stacked bar chart">${g}${bars}</svg>`;
}
export function lineChart({ labels, series, W = 760, H = 320 }) {
  const pad = { l: 56, r: 20, t: 20, b: 44 }, max = Math.max(...series.flatMap(s => s.values)); const { top, g } = frame(W, H, pad, max);
  const gw = (W - pad.l - pad.r) / (labels.length - 1); let out = g;
  labels.forEach((lb, i) => { out += `<text x="${pad.l + gw * i}" y="${H - 18}" text-anchor="middle" class="lb">${esc(lb)}</text>`; });
  series.forEach(s => {
    const pts = s.values.map((v, i) => [pad.l + gw * i, H - pad.b - (H - pad.t - pad.b) * v / top]);
    out += `<path class="ln" d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => { out += `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--c-bg)" stroke="${s.color}" stroke-width="2.5"><title>${esc(s.name)} ${esc(labels[i])}: ${compact(s.values[i])}</title></circle>`; });
    const lp = pts[pts.length - 1]; out += `<text x="${lp[0] - 8}" y="${lp[1] - 12}" text-anchor="end" class="val">${compact(s.values[s.values.length - 1])}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Line chart">${out}</svg>`;
}
