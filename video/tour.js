// Deterministic promo renderer: window.renderAt(t) draws the frame for time t (seconds); render.py captures every frame.
import * as THREE from 'three';
import { buildPod, planToWorld } from '../js/pod.js';
import { createStage, addGround } from '../js/stage.js';
import { buildAirport } from '../js/airport.js';
import { createFx } from '../js/fx.js';
import { fontsReady } from '../js/ready.js';
import { TOURS } from './tour-steps.js';

await fontsReady;
await Promise.all(['700 40px "DM Sans"', 'italic 400 40px "Instrument Serif"', '500 20px "DM Mono"'].map((f) => document.fonts.load(f)));
const canvas = document.getElementById('c');
const { renderer, scene, sun, hemi } = createStage(canvas);
renderer.setPixelRatio(1);
const pod = buildPod(); scene.add(pod.root);
addGround(scene, pod.M.ground).visible = false;
const camera = new THREE.PerspectiveCamera(44, 16 / 9, 1, 20000);
const W = (x, y, z) => planToWorld(x, y, z);
const center = W(45, 72, 25);

const airport = buildAirport(); scene.add(airport.group);
scene.fog = new THREE.Fog(0xcfc9bc, 1300, 6000);
const fillA = new THREE.DirectionalLight(0xffe6cc, 1.15), fillB = new THREE.DirectionalLight(0xdfe8f2, 0.55);
fillA.position.set(420, 140, -300); fillB.position.set(-420, 160, 200); scene.add(fillA, fillB);
try {
  const pm = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(), holder = new THREE.Group();
  holder.position.copy(center).multiplyScalar(-1);
  envScene.add(holder, new THREE.HemisphereLight(0xffffff, 0x8a8478, 1.6), new THREE.AmbientLight(0xffffff, 0.8));
  scene.remove(airport.group); holder.add(airport.group); airport.ceilingG.visible = true;
  const env = pm.fromScene(envScene, 0.02, 1, 20000).texture;
  holder.remove(airport.group); scene.add(airport.group);
  scene.environment = env; scene.environmentIntensity = 0.75;
} catch (e) { console.warn('reflections unavailable', e); try { scene.add(airport.group); } catch (e2) { /* already there */ } }
sun.position.set(70, 430, -90); sun.intensity = 1.7; sun.color.set(0xfff0dc); hemi.intensity = 0.45; renderer.toneMappingExposure = 1.08;
const fx = new URLSearchParams(location.search).has('nofx') ? null : createFx(renderer, scene, camera);

// ---------------------------------------------------------------- timeline (guided tour film, ~3.5 min)
const R = pod.api.rigs, SC = 1.28, INTRO = 4, OUTRO = 6;
const ease = (x) => x * x * (3 - 2 * x);
const key = (ks, t) => { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { const [a, va] = ks[i - 1], [b, vb] = ks[i]; return va + (vb - va) * (t - a) / (b - a); } return ks.at(-1)[1]; };
const fade = (t, a, b, f = 0.5) => Math.max(0, Math.min(1, Math.min((t - a) / f, (b - t) / f)));
const $ = (id) => document.getElementById(id);
// build segments: each step = move (camera flies) then dwell (slow drift + caption)
const segs = []; let T = INTRO; const first = { outside: TOURS.outside[0], inside: TOURS.inside[0] };
for (const part of ['outside', 'inside']) {
  let prev = null; const partStart = T;
  TOURS[part].forEach((s, i) => {
    const mv = s.move * SC, dw = s.dwell * SC;
    const from = prev || { pos: [s.pos[0] + (part === 'outside' ? 60 : 0), s.pos[1] + (part === 'outside' ? 40 : 20), s.pos[2] + 20], look: s.look };
    segs.push({ part, i, t0: T, tm: T + mv, t1: T + mv + dw, from, to: s, title: s.title, text: s.text, first: i === 0, partStart });
    T += mv + dw; prev = s;
  });
  T += 0.8; // gap for the dip between parts
  segs.at(-1).end = true;
}
const DUR = T + OUTRO; const OUT0 = T;
const INSIDE0 = segs.find((s) => s.part === 'inside').t0;
const byTitle = (t) => segs.find((s) => s.title === t);
const sMass = byTitle('The massage chair (1)'), sPrem = byTitle('Premium storage'), sStep = byTitle('Stepping in');
// rig keyframes (absolute seconds)
const K = {
  chair: [[0, 0.45], [sMass.tm, 0.45], [sMass.tm + 4, 1], [sMass.t1 - 1.2, 1], [sMass.t1, 0.45]],
  legext: [[0, 0], [sMass.tm + 2, 0], [sMass.tm + 3.4, 1], [sMass.t1 - 1.2, 1], [sMass.t1, 0]],
  glass1: [[0, 0], [sStep.tm + 1, 0], [sStep.t1 - 0.5, 1], [sStep.t1 + 4, 1], [sStep.t1 + 5, 0]],
  glass2: [[0, 0], [sStep.tm + 0.6, 0], [sStep.t1 - 0.9, 1], [sStep.t1 + 3.6, 1], [sStep.t1 + 4.6, 0]],
  premium: [[0, 0], [sPrem.tm + 0.5, 0], [sPrem.tm + 2.2, 1], [sPrem.t1, 1], [sPrem.t1 + 1, 0]],
  tv: [[0, 0], [INSIDE0 - 1, 0], [INSIDE0 + 4, 0]],
};
window.DUR = DUR;
window.__segs = segs.map((s) => [s.part, s.title, +s.t0.toFixed(1), +s.t1.toFixed(1)]);
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
window.renderAt = (t) => {
  for (const n in K) { const r = R[n]; if (!r) continue; r.t = r.target = key(K[n], t); r.apply(ease(r.t)); }
  let s = segs.find((x) => t >= x.t0 && t < x.t1) || (t < INTRO ? segs[0] : segs.at(-1));
  let pos, look;
  if (t < s.t0) { pos = s.from.pos; look = s.from.look; }
  else if (t < s.tm) { const k = ease((t - s.t0) / (s.tm - s.t0)); pos = lerp3(s.from.pos, s.to.pos, k); look = lerp3(s.from.look, s.to.look, k); }
  else { const k = (t - s.tm) / (s.t1 - s.tm); const dir = s.to.pos.map((v, i) => (s.to.look[i] - v)); pos = s.to.pos.map((v, i) => v + dir[i] * 0.035 * k); look = s.to.look; }
  if (t >= OUT0) { const k = ease(Math.min(1, (t - OUT0) / OUTRO)); const L = segs.find((x) => x.part === 'outside' && x.i === 0).to; pos = lerp3([-110, 230, 85], [175, 300, 230], k); look = lerp3([30, 144, 50], [42, 80, 70], k); }
  camera.position.copy(W(...pos)); camera.lookAt(W(...look));
  const inside = t >= INSIDE0 - 0.2 && t < OUT0 - 0.8;
  airport.group.visible = !inside; pod.api.setRoof(true);
  airport.update(camera);
  if (fx) fx.render(); else renderer.render(scene, camera);
  // overlays
  const dwellS = segs.find((x) => t >= x.tm - 0.6 && t <= x.t1 + 0.1);
  if (dwellS && dwellS.title) { $('cap').style.opacity = fade(t, dwellS.tm - 0.6, dwellS.t1 + 0.1); $('capE').textContent = dwellS.part === 'outside' ? 'The outside' : 'The inside'; $('capL').textContent = dwellS.title; $('capT').textContent = dwellS.text; } else $('cap').style.opacity = 0;
  const dips = [INSIDE0 - 0.4, OUT0 + 0.0];
  const prt = segs.filter((x) => x.i === 0).map((x) => x.t0);
  $('dip').style.opacity = Math.max(0, ...[INSIDE0 - 0.6].map((c) => 1 - Math.abs(t - c) / 0.5));
  $('intro').style.opacity = t < INTRO - 0.6 ? 1 : Math.max(0, 1 - (t - (INTRO - 0.6)) / 0.6);
  $('outro').style.opacity = t > OUT0 + OUTRO * 0.45 ? Math.min(1, (t - OUT0 - OUTRO * 0.45) / 1.2) : 0;
};
function size(w, h) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (fx) fx.setSize(w, h); }
size(innerWidth, innerHeight);
window.renderAt(0);
document.title = 'ready';
