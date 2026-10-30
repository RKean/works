// EXPLORE: a small walkable island meadow at golden hour, with original creatures. Original code; every texture is generated at runtime.
import * as THREE from 'three';

const CY = '#19d3e6', INK = '#12324a';
export const SKINS = [
  { name: 'SKY CYAN', c: '#19d3e6' }, { name: 'SUNNY', c: '#ffcf3f' }, { name: 'MEADOW', c: '#6cc85a' },
  { name: 'BLOSSOM', c: '#ff9ccb' }, { name: 'COCOA', c: '#b98159' },
];

/* ---------- canvas helpers ---------- */
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const ROUND = 'Fredoka, "Arial Rounded MT Bold", Nunito, Arial, sans-serif', BODY = 'Nunito, Arial, sans-serif';

// sticker-style pill label: cyan (or given) fill, chunky navy outline, navy text
function pillLabel(text, bg = CY, fg = INK) {
  const [c, x] = cv(512, 140); x.font = `700 50px ${ROUND}`;
  let s = 50; while (x.measureText(text).width > 400 && s > 26) { s -= 3; x.font = `700 ${s}px ${ROUND}`; }
  const w = Math.min(496, x.measureText(text).width + 80), X = (512 - w) / 2, Y = 14, H = 96;
  x.fillStyle = INK; x.beginPath(); x.roundRect(X, Y + 8, w, H, 48); x.fill();
  x.fillStyle = bg; x.strokeStyle = INK; x.lineWidth = 7; x.beginPath(); x.roundRect(X, Y, w, H, 48); x.fill(); x.stroke();
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, Y + H / 2 + 3);
  return tex(c);
}
function bubbleTex() {
  const [c, x] = cv(160, 160); x.lineWidth = 8; x.strokeStyle = INK; x.fillStyle = '#ffffff';
  x.beginPath(); x.roundRect(14, 12, 132, 102, 40); x.moveTo(62, 112); x.lineTo(80, 146); x.lineTo(98, 112); x.fill(); x.stroke();
  x.fillStyle = '#ffffff'; x.fillRect(64, 104, 32, 10);
  x.fillStyle = '#00a9bd'; x.font = `700 74px ${ROUND}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('!', 80, 66);
  return tex(c);
}
function arrowTex() {
  const [c, x] = cv(256, 256); x.lineJoin = 'round'; x.lineWidth = 16; x.strokeStyle = INK; x.fillStyle = '#ffd447';
  x.beginPath(); x.moveTo(128, 222); x.lineTo(36, 110); x.lineTo(88, 110); x.lineTo(88, 34); x.lineTo(168, 34); x.lineTo(168, 110); x.lineTo(220, 110); x.closePath(); x.fill(); x.stroke();
  return tex(c);
}
// cosy notice-board paper with hand-drawn style lines
function paperTex(title, lines, accent = CY) {
  const [c, x] = cv(512, 640); x.fillStyle = '#fffaf0'; x.fillRect(0, 0, 512, 640);
  x.fillStyle = accent; x.fillRect(0, 0, 512, 120); x.fillStyle = INK; x.font = `700 64px ${ROUND}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(title, 256, 64);
  x.textAlign = 'left'; x.font = `800 30px ${BODY}`;
  lines.forEach((l, i) => { x.fillStyle = '#ffd447'; x.beginPath(); x.arc(52, 196 + i * 78, 14, 0, 7); x.fill(); x.fillStyle = INK; x.fillText(l, 82, 198 + i * 78); });
  x.strokeStyle = INK; x.lineWidth = 10; x.strokeRect(5, 5, 502, 630);
  return tex(c);
}
function woodTex(base = '#8a5a38') {
  const [c, x] = cv(256, 256); x.fillStyle = base; x.fillRect(0, 0, 256, 256);
  let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 110; i++) { const y = r() * 256; x.strokeStyle = `rgba(${30 + r() * 40 | 0},${15 + r() * 25 | 0},8,${.12 + r() * .25})`; x.lineWidth = 1 + r() * 3;
    x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(80, y + (r() - .5) * 14, 170, y + (r() - .5) * 14, 256, y + (r() - .5) * 8); x.stroke(); }
  for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(40,20,8,.25)'; x.beginPath(); x.ellipse(r() * 256, r() * 256, 4 + r() * 6, 2 + r() * 3, 0, 0, 7); x.fill(); }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function glowTex(col = '#19d3e6') {
  const [c, x] = cv(128, 128); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, col); g.addColorStop(.35, col + 'aa'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return tex(c);
}

/* ---------- shaders ---------- */
const uvVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
// original "portal pad": soft filled disc, two rings, rotating dashes and rising sparkles. NaN-safe (atan guarded).
const padFS = `uniform float uTime, uOn; uniform vec3 uCol; varying vec2 vUv;
float ring(float rr, float r, float w){ return 1. - smoothstep(0., w, abs(rr - r)); }
void main(){ vec2 p = vUv * 2. - 1.; float rr = length(p); if (rr > 1.) discard;
  float a = atan(p.y, abs(p.x) < 1e-4 ? 1e-4 : p.x);
  float dash = step(.45, fract(a / 6.2831 * 12. + uTime * (.15 + uOn * .35)));
  float k = ring(rr, .9, .06) + ring(rr, .7, .03) * dash * .9 + ring(rr, .3, .04) * .7;
  float pulse = ring(rr, fract(uTime * .5) * .9, .05) * (1. - rr) * (.4 + uOn);
  float fill = (1. - smoothstep(.0, .92, rr)) * (.22 + uOn * .22);
  vec3 col = mix(uCol, vec3(1.), clamp(k * .35 + pulse, 0., 1.));
  float al = clamp(k * .95 + pulse + fill, 0., .95);
  gl_FragColor = vec4(col, al); }`;
const beamFS = `uniform float uTime, uOn; uniform vec3 uCol; varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){ float f = clamp(1. - vUv.y, 0., 1.); f = f * f * (.14 + uOn * .3);
  vec2 g = vec2(floor(vUv.x * 40.), floor(vUv.y * 10. - uTime * 1.6)); float s = step(.93, h(g)) * (1. - vUv.y) * (.5 + uOn);
  gl_FragColor = vec4(mix(uCol, vec3(1.), .3 + s), clamp(f + s * .7, 0., .9)); }`;
// signboard: two works cross-fade through soft "bubbles" (round cells that pop in) with a white sparkle rim
const boardFS = `uniform sampler2D tA, tB; uniform float aA, aB, uProg, uTime, uAsp; varying vec2 vUv;
vec2 fit(vec2 uv, float a){ vec2 s = a > uAsp ? vec2(1., uAsp / a) : vec2(a / uAsp, 1.); return (uv - .5) / s + .5; }
vec4 samp(sampler2D t, vec2 uv, float a){ vec2 q = fit(uv, a); float m = step(0., q.x) * step(q.x, 1.) * step(0., q.y) * step(q.y, 1.); return texture2D(t, q) * m; }
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){ vec2 uv = vUv; vec2 cell = uv * vec2(16., 9.); vec2 id = floor(cell); float n = h(id);
  float r = clamp(uProg * 1.6 - n * .6, 0., 1.); float d = length(fract(cell) - .5);
  float m = 1. - smoothstep(r * .75 - .04, r * .75, d); m = uProg >= .999 ? 1. : m;
  vec3 a = samp(tA, uv, aA).rgb, b = samp(tB, uv, aB).rgb;
  vec3 bg = vec3(.93, .98, 1.);
  a = mix(bg, a, step(.001, a.r + a.g + a.b)); b = mix(bg, b, step(.001, b.r + b.g + b.b));
  vec3 col = mix(a, b, m);
  float rim = (1. - smoothstep(0., .05, abs(d - r * .75))) * step(.01, uProg) * step(uProg, .99) * step(.02, r);
  col = mix(col, vec3(1.), rim * .85);
  col *= vec3(1., .93, .86); // warm evening cast so the screen sits in the sunset
  gl_FragColor = vec4(col, 1.);
  #include <colorspace_fragment>
}`;
// value noise shared by ground, sky and water (prefixed names so they never clash with three's chunks)
const NOISE = `float nzH(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float nz(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(nzH(i), nzH(i + vec2(1., 0.)), f.x), mix(nzH(i + vec2(0., 1.)), nzH(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * nz(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return s / .9375; }
`;
// golden-hour sky: zenith blue-violet -> pink -> orange horizon, glow around a low sun, fbm clouds lit from below
const SKYFN = `uniform vec3 uZen, uMid, uHor, uFogC, uSunDir, uSunC; uniform float uTime;
vec3 skyCol(vec3 d, float clouds){
  float y = d.y; vec3 sd = normalize(uSunDir + vec3(0., 1e-4, 0.)); float s = clamp(dot(d, sd), 0., 1.);
  vec3 col = mix(uHor, uMid, smoothstep(.0, .22, y)); col = mix(col, uZen, smoothstep(.18, .75, y));
  col += vec3(1., .45, .18) * pow(s, 6.) * .55 + vec3(1., .7, .4) * pow(s, 48.) * .9;
  if (clouds > 0. && y > 0.) {
    vec2 uv = d.xz / (y + .12) * .55 + vec2(uTime * .006, uTime * .002);
    float c = fbm(uv) * .7 + fbm(uv * 2.7 + 4.) * .3;
    c = smoothstep(.48, .78, c) * smoothstep(.0, .12, y) * (1. - smoothstep(.45, .85, y)) * clouds;
    float under = smoothstep(.5, .9, fbm(uv * 1.3 + 9.));
    vec3 cc = mix(vec3(.42, .26, .42), vec3(1., .5, .38), .35 + .65 * pow(s, 1.5));
    cc = mix(cc, vec3(1., .72, .45), under * .5) + vec3(1., .6, .3) * pow(s, 8.) * 1.4;
    col = mix(col, cc, c * .9);
  }
  col += uSunC * smoothstep(.9986, .9994, s) * 6.;
  col = mix(col, uFogC, 1. - smoothstep(-.04, .07, y));
  return col;
}`;
const skyVS = `varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position, 1.)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const skyFS = `varying vec3 vW; ${NOISE} ${SKYFN}
void main(){ vec3 d = normalize(vW - cameraPosition * vec3(1., 0., 1.) + vec3(0., 1e-3, 0.)); gl_FragColor = vec4(skyCol(d, 1.), 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
// water: animated normals, fresnel reflection of the same sunset sky, sun glitter, soft shore (pond) and distance haze
const waterFS = `varying vec3 vW; ${NOISE} ${SKYFN}
uniform vec3 uDeep, uShal, uCenter; uniform float uRad, uRip, uFogN, uFogF;
void main(){ vec2 p = vW.xz; float t = uTime;
  vec2 g = vec2(sin(p.x * 2.1 + t * 1.3) + sin(p.x * 3.7 - p.y * 2.3 + t * 1.9) * .5, cos(p.y * 2.4 + t * 1.1) + cos(p.y * 4.1 + p.x * 1.7 - t * 1.6) * .5);
  g += (vec2(nz(p * 3. + t * .3), nz(p * 3. - t * .3 + 7.)) - .5) * 1.6;
  vec3 n = normalize(vec3(g.x * uRip, 1., g.y * uRip));
  vec3 v = cameraPosition - vW; float dist = max(length(v), 1e-3); v /= dist;
  vec3 r = reflect(-v, n); r.y = abs(r.y) + .03; r = normalize(r);
  float fr = .04 + .96 * pow(1. - clamp(dot(n, v), 0., 1.), 5.);
  float e = uRad > 0. ? clamp(length(p - uCenter.xz) / uRad, 0., 1.) : .4;
  vec3 base = mix(uDeep, uShal, e * e);
  float sp = max(dot(r, normalize(uSunDir)), 0.);
  vec3 col = mix(base, skyCol(r, .6), clamp(fr * 1.2, 0., 1.)) + uSunC * (pow(sp, 600.) * 10. + pow(sp, 60.) * .5);
  col = mix(col, uFogC, smoothstep(uFogN, uFogF, dist));
  float a = uRad > 0. ? 1. - smoothstep(.9, 1., e) : 1.;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
// fireflies + pollen: additive soft points that drift and pulse
const flyVS = `attribute vec4 aS; uniform float uTime, uPR, uMot; varying float vA; varying float vK;
void main(){ vec3 p = position; float t = uTime * uMot;
  p.x += sin(t * .4 + aS.x * 6.283) * 1.1; p.z += cos(t * .33 + aS.y * 6.283) * 1.1; p.y += sin(t * .7 + aS.z * 6.283) * .45;
  vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
  float fl = .5 + .5 * sin(uTime * (1.2 + aS.w * 2.4) + aS.x * 40.); fl = mix(.8, fl * fl, step(.55, aS.w));
  vA = fl; vK = step(.55, aS.w);
  gl_PointSize = clamp(mix(5., 22., vK) * uPR * (.45 + .55 * fl) / max(-mv.z, .5) * 6., 1., 64.); }`;
const flyFS = `varying float vA; varying float vK;
void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); float a = smoothstep(.5, 0., d); a *= a;
  vec3 col = mix(vec3(1., .86, .6), vec3(1., .9, .45), vK) * (a * 1.3 + smoothstep(.12, 0., d) * vK);
  gl_FragColor = vec4(col * vA * mix(.35, 1., vK), 1.); }`;

/* ---------- materials ---------- */
function std(color, roughness = .85, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra }); }
// warm back-lit rim (fresnel added to emissive) so silhouettes catch the sunset
function addRim(m, col = '#ffb070', k = .55) {
  const rc = new THREE.Color(col);
  m.onBeforeCompile = s => { s.uniforms.uRimC = { value: rc }; s.uniforms.uRimK = { value: k };
    s.fragmentShader = 'uniform vec3 uRimC; uniform float uRimK;\n' + s.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
    { vec3 vdR = normalize(vViewPosition + vec3(0., 0., 1e-5)); float frR = 1. - clamp(dot(normal, vdR), 0., 1.); totalEmissiveRadiance += uRimC * uRimK * frR * frR * frR; }`); };
  m.customProgramCacheKey = () => 'rim' + k; return m;
}
// soft fur-ish creature skin: sheen + rim
function fur(color) { const c = new THREE.Color(color);
  return addRim(new THREE.MeshPhysicalMaterial({ color: c, roughness: .78, metalness: 0, sheen: .45, sheenRoughness: .6, sheenColor: c.clone().lerp(new THREE.Color('#ffffff'), .55) }), '#ffb27a', .32); }

/* ---------- creature (original design: round body, big eyes, long ears, curly leaf tail) ---------- */
function makeCreature(color, scale = 1, { sprout = true, ears = 'long' } = {}) {
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
  const mat = fur(color), cream = fur('#fff1dc'), dark = std('#151a24', .25), white = std('#ffffff', .2), shineM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.scale.set(sx, sy, sz); me.castShadow = true; body.add(me); return me; };
  const sph = new THREE.SphereGeometry(1, 32, 20);
  add(sph, mat, 0, .62, 0, .6, .58, .55); // round body+head
  add(sph, cream, 0, .5, .3, .36, .32, .26); // belly
  // big glossy eyes: white, dark pupil, shine
  const eyes = new THREE.Group(); body.add(eyes);
  [-.19, .19].forEach(x => {
    const e = new THREE.Mesh(sph, white); e.position.set(x, .78, .45); e.scale.set(.13, .16, .08); eyes.add(e);
    const p = new THREE.Mesh(sph, dark); p.position.set(x * 1.02, .77, .51); p.scale.set(.09, .12, .05); eyes.add(p);
    const s = new THREE.Mesh(sph, shineM); s.position.set(x * 1.02 + .03, .82, .555); s.scale.set(.03, .035, .02); eyes.add(s);
  });
  const blush = std('#ff8fa6', .9, { transparent: true, opacity: .75 });
  [-.33, .33].forEach(x => add(sph, blush, x, .62, .42, .07, .04, .03).castShadow = false);
  add(new THREE.TorusGeometry(.05, .014, 6, 12, Math.PI), dark, 0, .64, .54).rotation.z = Math.PI;
  // ears
  const earG = ears === 'long' ? new THREE.ConeGeometry(.15, .55, 16) : new THREE.SphereGeometry(.15, 16, 12);
  [-1, 1].forEach(sd => {
    const e = add(earG, mat, sd * .3, ears === 'long' ? 1.28 : 1.15, -.02, 1, 1, .6); e.rotation.z = -sd * .38;
    if (ears === 'long') { const inr = add(new THREE.ConeGeometry(.08, .34, 12), fur('#ffc8d6'), sd * .31, 1.25, .05, 1, 1, .4); inr.rotation.z = -sd * .38; }
  });
  // curly tail with a leaf tip
  const tail = new THREE.Group(); tail.position.set(0, .45, -.5); body.add(tail);
  const leafM = std('#6fbf55', .6);
  for (let i = 0; i < 5; i++) { const t = i / 4; const m = new THREE.Mesh(sph, i === 4 ? leafM : mat); m.castShadow = true; m.position.set(0, Math.sin(t * 2.4) * .42, -Math.cos(t * 2.4) * .18 - t * .2); m.scale.setScalar(.12 - t * .015); if (i === 4) m.scale.set(.16, .06, .1); tail.add(m); }
  g.userData.tail = tail;
  // feet
  [-.22, .22].forEach(x => add(sph, mat, x, .07, .12, .14, .08, .17));
  if (sprout) { const st = add(new THREE.CylinderGeometry(.018, .018, .2, 6), std('#4f8e3d', .7), 0, 1.25, 0);
    [-1, 1].forEach(sd => { const l = add(sph, leafM, sd * .09, 1.36, 0, .1, .04, .06); l.rotation.z = sd * .5; }); g.userData.tip = st; }
  // soft contact shadow (the real sun shadow is cast by the shadow map)
  const sh = new THREE.Mesh(new THREE.CircleGeometry(.55, 24), new THREE.MeshBasicMaterial({ color: 0x1a1408, transparent: true, opacity: .32, depthWrite: false, map: SOFT }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = .015; g.add(sh);
  g.scale.setScalar(scale); g.userData = { ...g.userData, body, mat, eyes, shadow: sh };
  return g;
}
let SOFT = null;
function softTex() { const [c, x] = cv(64, 64); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, '#fff'); g.addColorStop(.5, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }

// seeded random so the island looks the same on every visit
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }
// island height (world x/z): flat meadow inside r 20, rolling hills to r 30, a drop at the rim
const RAD = 36;
function hgt(x, z) { const r = Math.hypot(x, z), y = -z; const edge = THREE.MathUtils.smoothstep(r, 25, 31);
  const hill = (Math.sin(x * .35) * Math.cos(y * .3) * .5 + .5) * 3.2 * edge + edge * 1.2 + (Math.sin(x * 1.3 + y * .7) * Math.cos(y * 1.1 - x * .4)) * .25 * edge;
  return hill + (r > RAD - 2 ? -(r - (RAD - 2)) * 2.2 : 0); }
const PATHS = [[0, 2, 5.5], [0, -4, 3], [-5, -1.5, 2.6], [5, -1.5, 2.6], [5, 6, 2.4], [0, 9, 3]];
const PADS = [[0, -6.4, 2.1], [-7.6, -1.5, 2.1], [7.6, -1.5, 2.1], [7.5, 8.5, 1.8], [7.5, 11.2, 1.6], [-11.2, -1.5, 1.6], [11.2, -1.5, 1.1], [-10.5, 13, 3.3]];
const onPath = (x, z) => PATHS.some(([px, pz, r]) => Math.hypot(x - px, z - pz) < r - .3);
const blocked = (x, z) => PADS.some(([px, pz, r]) => Math.hypot(x - px, z - pz) < r) || (Math.abs(x) < 6.8 && z < -11.4 && z > -13.4);

/* ================================================================ */
export function createExplore({ renderer, WORKS, PROFILE, getTexture, onZone, onAction, onTalk, mobile, zoom: zoom0 = 1, onZoom }) {
  SOFT = SOFT || softTex();
  const params = new URLSearchParams(location.search), qp = params.get('q');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = new THREE.Scene();
  const HOR = new THREE.Color('#ff9f6e'), FOG = new THREE.Color('#e8987a');
  scene.background = FOG.clone();
  scene.fog = new THREE.Fog(FOG, 26, 115);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 260);
  const clock = new THREE.Clock();
  const anim = []; // per-frame callbacks
  const solids = []; // xz AABBs {x0,x1,z0,z1} or circles
  const occl = []; // meshes the camera must not pass through
  const solid = (x, z, w, d) => solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  const circ = (x, z, r) => solids.push({ circle: true, x, z, r });
  const sgeo = new THREE.PlaneGeometry(1, 1);
  const cast = (m, c = true, r = true) => { m.castShadow = c; m.receiveShadow = r; return m; };

  /* ---------- renderer: filmic, soft shadows ---------- */
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  /* ---------- sky + low sun ---------- */
  const SUN = new THREE.Vector3(.5, .12, -.86).normalize();
  const skyU = { uZen: { value: new THREE.Color('#3b4a8c') }, uMid: { value: new THREE.Color('#d9789a') }, uHor: { value: HOR }, uFogC: { value: FOG },
    uSunDir: { value: SUN }, uSunC: { value: new THREE.Color('#fff0c8') }, uTime: { value: 0 } };
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, vertexShader: skyVS, fragmentShader: skyFS, uniforms: skyU });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 48, 24), skyMat); sky.renderOrder = -1; scene.add(sky);
  anim.push(t => { skyU.uTime.value = reduce ? 0 : t; sky.position.set(camera.position.x, 0, camera.position.z); });
  scene.add(new THREE.HemisphereLight(0xffcfa6, 0x34466e, 1.05));
  const sunL = new THREE.DirectionalLight(0xffb06a, 3.6); sunL.position.copy(SUN).multiplyScalar(60); sunL.castShadow = true;
  { const sc = sunL.shadow.camera; sc.left = sc.bottom = -26; sc.right = sc.top = 26; sc.near = 1; sc.far = 140; }
  sunL.shadow.bias = -.0004; sunL.shadow.normalBias = .04; sunL.shadow.radius = 3;
  scene.add(sunL, sunL.target);
  const fill = new THREE.DirectionalLight(0x8f8cff, .45); fill.position.set(-.5, .6, .8).multiplyScalar(30); scene.add(fill);
  // image-based lighting from the sunset sky (re-baked after a GPU context restore)
  let envRT = null;
  function bakeEnv(restored) { try { const es = new THREE.Scene(); const m = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMat); es.add(m);
      const pm = new THREE.PMREMGenerator(renderer); const rt = pm.fromScene(es, .03); pm.dispose(); m.geometry.dispose();
      if (envRT && !restored) envRT.dispose(); envRT = rt; /* after a context loss the old target's GL handles are already gone */ scene.environment = rt.texture; scene.environmentIntensity = .55; } catch (e) { scene.environment = null; } }
  bakeEnv();
  const onRestore = () => setTimeout(() => bakeEnv(true), 50); renderer.domElement.addEventListener('webglcontextrestored', onRestore);

  /* ---------- island ---------- */
  const groundGeo = new THREE.PlaneGeometry(RAD * 2, RAD * 2, mobile ? 110 : 150, mobile ? 110 : 150); {
    const p = groundGeo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, hgt(p.getX(i), -p.getY(i))); // plane is XY before rotation (world z = -y)
    groundGeo.computeVertexNormals(); }
  const groundMat = std('#ffffff', 1);
  groundMat.onBeforeCompile = s => {
    s.uniforms.uPaths = { value: PATHS.map(([x, z, r]) => new THREE.Vector3(x, z, r)) };
    s.vertexShader = 'varying vec3 vWp;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWp = (modelMatrix * vec4(transformed, 1.)).xyz;');
    s.fragmentShader = 'varying vec3 vWp; uniform vec3 uPaths[6];\n' + NOISE + s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
    { vec2 p = vWp.xz; float n1 = fbm(p * .16), n2 = nz(p * 1.7), n3 = nz(p * 7.);
      vec3 c = mix(vec3(.1, .2, .035), vec3(.22, .33, .06), n1);
      c = mix(c, vec3(.34, .29, .1), smoothstep(.55, .85, fbm(p * .07 + 3.)) * .55); c *= .82 + .36 * n3;
      float pm = 0.; for (int i = 0; i < 6; i++){ vec3 q = uPaths[i]; float d = length(p - q.xy) - q.z; pm = max(pm, 1. - smoothstep(-.9, -.1 + n2 * .5, d)); }
      vec3 dirt = mix(vec3(.5, .37, .2), vec3(.66, .52, .31), n2) * (.82 + .36 * n3);
      c = mix(c, dirt, pm * .92);
      float pd = length(p - vec2(-10.5, 13.)); c = mix(c, vec3(.2, .15, .1), 1. - smoothstep(2.6, 3.7, pd));
      c = mix(c, vec3(.32, .24, .16), smoothstep(-.4, -2., vWp.y));
      diffuseColor.rgb *= c; }`);
  };
  groundMat.customProgramCacheKey = () => 'ground';
  const ground = cast(new THREE.Mesh(groundGeo, groundMat), false, true); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const cliffG = new THREE.CylinderGeometry(RAD - 1.5, RAD - 4, 6, 64, 6, true); { const p = cliffG.attributes.position, r = rng(5);
    for (let i = 0; i < p.count; i++) { const k = 1 + (Math.sin(p.getY(i) * 3 + i) * .5 + r() - .5) * .04; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } cliffG.computeVertexNormals(); }
  const cliff = new THREE.Mesh(cliffG, std('#8b5f48', .95)); cliff.position.y = -3.4; scene.add(cliff);
  const waterU = (deep, shal, rad, cx, cz, rip, fn, ff) => ({ ...skyU, uDeep: { value: new THREE.Color(deep) }, uShal: { value: new THREE.Color(shal) }, uRad: { value: rad },
    uCenter: { value: new THREE.Vector3(cx, 0, cz) }, uRip: { value: rip }, uFogN: { value: fn }, uFogF: { value: ff } });
  const seaMat = new THREE.ShaderMaterial({ vertexShader: skyVS, fragmentShader: waterFS, fog: false, uniforms: waterU('#1b2a4a', '#2d4a6a', 0, 0, 0, .05, 40, 200) });
  const sea = new THREE.Mesh(new THREE.CircleGeometry(220, 64), seaMat); sea.rotation.x = -Math.PI / 2; sea.position.y = -4.2; scene.add(sea);

  /* ---------- trees: tapered trunks + layered noisy foliage that sways ---------- */
  const barkT = woodTex('#5a3c28'); barkT.repeat.set(1, 3);
  const trunkM = std('#ffffff', .95, { map: barkT });
  const leafM = std('#ffffff', .8, { vertexColors: true });
  const foliage = [0, 1, 2].map(v => { const g = new THREE.IcosahedronGeometry(1, mobile ? 2 : 3), p = g.attributes.position, r = rng(31 + v * 7), c = new THREE.Color(), cols = [];
    const ph = [r() * 9, r() * 9, r() * 9];
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = Math.sin(x * 3.1 + ph[0]) * Math.sin(y * 2.7 + ph[1]) * Math.sin(z * 3.3 + ph[2]) * .16 + Math.sin(x * 7 + y * 5 + z * 6) * .04;
      p.setXYZ(i, x * (1 + n), y * (1 + n) * .85, z * (1 + n));
      const k = .5 + y * .35 + n * 1.2; c.setRGB(.08 + k * .1, .17 + k * .17, .04 + k * .04); cols.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals(); return g; });
  const trunkG = new THREE.CylinderGeometry(.22, .4, 1, 9, 3); { const p = trunkG.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) + Math.sin(y * 3) * .05); } trunkG.computeVertexNormals(); }
  function tree(x, z, s = 1, k = 0, collide = true) {
    const y0 = hgt(x, z);
    const t = cast(new THREE.Mesh(trunkG, trunkM)); t.scale.set(s, 3 * s, s); t.position.set(x, y0 + 1.5 * s, z); scene.add(t); occl.push(t);
    const crown = new THREE.Group(); crown.position.set(x, y0 + 1.6 * s, z); scene.add(crown);
    [[0, 2.1, 0, 1.75], [-.95, 1.5, .35, 1.2], [.95, 1.6, -.25, 1.25], [.2, 1.3, .95, 1.05], [-.3, 1.4, -.9, 1.1], [.1, 3.05, .1, 1.2], [.55, 3.7, -.2, .75]].forEach(([dx, dy, dz, r], i) => {
      const f = cast(new THREE.Mesh(foliage[(k + i) % 3], leafM)); f.position.set(dx * s, dy * s, dz * s); f.scale.setScalar(r * s); f.rotation.set(k + i, i * 1.7, k * .3); crown.add(f); occl.push(f); });
    const ph = k * 1.37; anim.push(t => { if (reduce) return; crown.rotation.z = Math.sin(t * .9 + ph) * .018; crown.rotation.x = Math.sin(t * .7 + ph * 1.3) * .014; });
    if (collide) circ(x, z, .55 * s);
  }
  const trees = [[-19, -13, 1.3], [-23, -3, 1.5], [-19, 7, 1.2], [-22, 16, 1.4], [19, -13, 1.35], [23, -2, 1.2], [19, 9, 1.5], [22, 18, 1.3],
    [-10, -20, 1.4], [10, -20, 1.3], [0, -25, 1.6], [-16, -22, 1.2], [16, -23, 1.5], [-10, 23, 1.3], [10, 24, 1.4], [0, 28, 1.5], [-14.5, -9, .9], [14.8, 14.5, .95], [-14.8, 2.5, .85]];
  trees.forEach(([x, z, s], k) => tree(x, z, s, k));
  { const r = rng(77); for (let i = 0; i < (mobile ? 10 : 18); i++) { const a = r() * Math.PI * 2, d = 25 + r() * 7; tree(Math.cos(a) * d, Math.sin(a) * d, 1 + r() * .6, 20 + i, false); } }

  /* ---------- rocks: jittered, mossy on top ---------- */
  const rockG = new THREE.DodecahedronGeometry(1, 2); { const p = rockG.attributes.position, cols = [], c = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const n = 1 + Math.sin(x * 4 + z * 3) * Math.cos(y * 5 - x * 2) * .12 + Math.sin(x * 11 + y * 9) * .03;
      p.setXYZ(i, x * n, y * n, z * n); const moss = THREE.MathUtils.smoothstep(y, .2, .7); const g = .3 + Math.sin(x * 9 + y * 7 + z * 5) * .05;
      c.setRGB(g * .94, g * .96, g * 1.).lerp(new THREE.Color(.16, .24, .07), moss * .8); cols.push(c.r, c.g, c.b); }
    rockG.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); rockG.computeVertexNormals(); }
  const rockM = std('#ffffff', .92, { vertexColors: true, flatShading: true });
  [[-12.5, -6, 1.1], [13.2, 3, .9], [-6, 16, .8], [12, -9, .7], [3.5, 15.5, .6], [-15, 13.5, 1.2]].forEach(([x, z, s], i) => {
    const r = cast(new THREE.Mesh(rockG, rockM)); r.position.set(x, s * .38, z); r.scale.set(s * 1.2, s * .8, s); r.rotation.set(i, i * 2, 0); scene.add(r); occl.push(r); circ(x, z, s * 1.05); });

  /* ---------- pond: sunset-reflecting water + lily pads ---------- */
  const pondMat = new THREE.ShaderMaterial({ vertexShader: skyVS, fragmentShader: waterFS, fog: false, transparent: true, uniforms: waterU('#14202e', '#3c4a3a', 3.05, -10.5, 13, .07, 26, 115) });
  const pond = new THREE.Mesh(new THREE.CircleGeometry(3.05, 48), pondMat); pond.rotation.x = -Math.PI / 2; pond.position.set(-10.5, .03, 13); scene.add(pond);
  circ(-10.5, 13, 2.9);
  const lily = std('#3f7a2e', .55, { side: THREE.DoubleSide }); [[-11.3, 12.4], [-9.6, 13.8], [-10.2, 11.9]].forEach(([x, z], i) => { const l = cast(new THREE.Mesh(new THREE.CircleGeometry(.4, 16, .4, 5.6), lily), false, true); l.rotation.x = -Math.PI / 2; l.position.set(x, .05, z); scene.add(l);
    anim.push(t => { l.rotation.z = Math.sin(t * .5 + i) * .2; }); });
  // a few reeds at the pond edge
  { const reedM = std('#5d6b2a', .8), rg = new THREE.CylinderGeometry(.015, .03, 1, 5); const r = rng(91);
    for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = 2.7 + r() * .5; const m = cast(new THREE.Mesh(rg, reedM), true, false); const h = .7 + r() * .7; m.scale.y = h;
      m.position.set(-10.5 + Math.cos(a) * d, h / 2, 13 + Math.sin(a) * d); m.rotation.set((r() - .5) * .3, 0, (r() - .5) * .3); scene.add(m); const ph = r() * 9; anim.push(t => { if (!reduce) m.rotation.z = Math.sin(t * 1.3 + ph) * .08; }); } }

  /* ---------- instanced grass blades with wind sway ---------- */
  const wind = { uTime: { value: 0 }, uWind: { value: reduce ? .2 : 1 } };
  const GN = mobile ? 16000 : 42000;
  const bladeG = (() => { const g = new THREE.BufferGeometry(), pos = [], col = [], nor = [], idx = [], SEG = 3;
    for (let j = 0; j <= SEG; j++) { const v = j / SEG, w = .5 * (1 - v * .92), bend = v * v * .12;
      pos.push(-w, v, bend, w, v, bend); const c0 = [.06, .12, .03], c1 = [.42, .48, .16];
      for (let s = 0; s < 2; s++) { col.push(c0[0] + (c1[0] - c0[0]) * v, c0[1] + (c1[1] - c0[1]) * v, c0[2] + (c1[2] - c0[2]) * v); nor.push(0, 1, .25); } }
    for (let j = 0; j < SEG; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g; })();
  const grassM = std('#ffffff', .9, { vertexColors: true, side: THREE.DoubleSide });
  grassM.onBeforeCompile = s => { s.uniforms.uTime = wind.uTime; s.uniforms.uWind = wind.uWind;
    s.vertexShader = 'uniform float uTime, uWind;\n' + s.vertexShader.replace('#include <project_vertex>', `vec4 mvPosition = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
      mvPosition = instanceMatrix * mvPosition;
    #endif
    { float hh = clamp(position.y, 0., 1.); vec2 ip = mvPosition.xz;
      float w = sin(uTime * 1.6 + ip.x * .3 + ip.y * .2) * .7 + sin(uTime * 2.9 + ip.x * 1.1 - ip.y * .7) * .3 + .35;
      mvPosition.x += w * hh * hh * .16 * uWind; mvPosition.z += w * hh * hh * .09 * uWind; }
    mvPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;`); };
  grassM.customProgramCacheKey = () => 'grass';
  const grass = new THREE.InstancedMesh(bladeG, grassM, GN); grass.receiveShadow = true; grass.frustumCulled = false;
  { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(), r = rng(13), v = new THREE.Vector3(), sc = new THREE.Vector3();
    let n = 0, guard = 0;
    while (n < GN && guard++ < GN * 6) { const cx = (r() - .5) * 62, cz = (r() - .5) * 62; if (Math.hypot(cx, cz) > RAD - 3.5 || blocked(cx, cz)) continue;
      const path = onPath(cx, cz); if (path && r() > .12) continue;
      const tuft = 6 + (r() * 8 | 0);
      for (let k = 0; k < tuft && n < GN; k++) { const x = cx + (r() - .5) * .7, z = cz + (r() - .5) * .7; if (blocked(x, z)) continue;
        const h = (path ? .18 : .26) + r() * .34; e.set((r() - .5) * .35, r() * Math.PI * 2, (r() - .5) * .35); q.setFromEuler(e);
        m.compose(v.set(x, hgt(x, z) - .02, z), q, sc.set(.035 + r() * .03, h, 1)); grass.setMatrixAt(n, m);
        const tone = r(); grass.setColorAt(n, c.setRGB(.8 + tone * .45, .85 + tone * .3, .7 + r() * .3)); n++; } }
    grass.count = n; grass.userData.full = n; }
  scene.add(grass);
  anim.push(t => { wind.uTime.value = t; });
  // wild flowers (instanced)
  { const N = mobile ? 140 : 260, fG = new THREE.IcosahedronGeometry(.06, 1).scale(1, .62, 1);
    const fl = cast(new THREE.InstancedMesh(fG, std('#ffffff', .6), N), false, true), stem = cast(new THREE.InstancedMesh(new THREE.CylinderGeometry(.008, .012, 1, 4), std('#3e5a22', .8), N), false, true);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(), cols = ['#fff4e0', '#ffd15a', '#ff8fb8', '#b9a4ff'], r = rng(7), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < N; i++) { let x, z; do { x = (r() - .5) * 40; z = (r() - .5) * 40 + 3; } while (Math.hypot(x, z - 1) < 6 || blocked(x, z) || Math.hypot(x, z) > 30);
      const h = .2 + r() * .16, y0 = hgt(x, z); m.compose(v.set(x, y0 + h, z), q, one); fl.setMatrixAt(i, m); fl.setColorAt(i, c.set(cols[i % 4]));
      m.compose(v.set(x, y0 + h / 2, z), q, new THREE.Vector3(1, h, 1)); stem.setMatrixAt(i, m); }
    scene.add(fl, stem); }

  // signboard (works): a wooden board on two posts with a little roof
  const BW = 11, BH = BW * 9 / 16;
  const boardMat = new THREE.ShaderMaterial({ vertexShader: uvVS, fragmentShader: boardFS, toneMapped: false,
    uniforms: { tA: { value: null }, tB: { value: null }, aA: { value: 1.6 }, aB: { value: 1.6 }, uProg: { value: 0 }, uTime: { value: 0 }, uAsp: { value: BW / BH } } });
  const by = BH / 2 + 1.7;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), boardMat); board.position.set(0, by, -12.2); scene.add(board);
  const woodT = woodTex('#9a6a45'), wood = std('#ffffff', .85, { map: woodT }), woodD = std('#b59a88', .9, { map: woodT });
  const boardBack = cast(new THREE.Mesh(new THREE.BoxGeometry(BW + 1, BH + 1, .5), wood)); boardBack.position.set(0, by, -12.5); scene.add(boardBack); occl.push(boardBack);
  [-1, 1].forEach(sd => { const p = cast(new THREE.Mesh(new THREE.BoxGeometry(.6, by + BH / 2 + 1.4, .6), woodD)); p.position.set(sd * (BW / 2 + .2), (by + BH / 2 + 1.4) / 2, -12.4); scene.add(p); occl.push(p); });
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, BW + 2.4, 3, 1), std('#a3493a', .75)); roof.rotation.z = Math.PI / 2; roof.rotation.x = Math.PI; roof.scale.set(1, 1, .9); roof.position.set(0, by + BH / 2 + 1.25, -12.45); scene.add(roof);
  solid(0, -12.4, BW + 1, 1.4);
  const [capC, capX] = cv(2048, 200); const capT = tex(capC);
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(BW * .9, BW * .9 * 200 / 2048), new THREE.MeshBasicMaterial({ map: capT, transparent: true, toneMapped: false }));
  cap.position.set(0, by - BH / 2 - .75, -12.1); scene.add(cap);
  let bIdx = 0, bTween = null;
  const pad2 = n => String(n).padStart(2, '0');
  function drawCap(w) { capX.clearRect(0, 0, 2048, 200); capX.fillStyle = '#ffffff'; capX.strokeStyle = INK; capX.lineWidth = 12; capX.beginPath(); capX.roundRect(8, 14, 2032, 172, 86); capX.fill(); capX.stroke();
    capX.fillStyle = CY; capX.beginPath(); capX.roundRect(30, 36, 240, 128, 64); capX.fill(); capX.fillStyle = INK; capX.font = `700 64px ${ROUND}`; capX.textBaseline = 'middle'; capX.textAlign = 'center';
    capX.fillText(`${pad2(WORKS.indexOf(w) + 1)}/${pad2(WORKS.length)}`, 150, 104); capX.textAlign = 'left'; let s = 84; capX.font = `700 ${s}px ${ROUND}`;
    while (capX.measureText(w.title).width > 1680 && s > 40) { s -= 4; capX.font = `700 ${s}px ${ROUND}`; }
    capX.fillText(w.title, 310, 106); capT.needsUpdate = true; }
  function showBoard(i) {
    bIdx = (i + WORKS.length) % WORKS.length; const w = WORKS[bIdx]; drawCap(w);
    return getTexture(w, 0).then(t => { const u = boardMat.uniforms;
      if (!u.tA.value) { u.tA.value = u.tB.value = t; u.aA.value = u.aB.value = t.userData.aspect; return; }
      u.tA.value = u.tB.value; u.aA.value = u.aB.value; u.tB.value = t; u.aB.value = t.userData.aspect; u.uProg.value = 0; bTween = { s: clock.elapsedTime }; });
  }
  anim.push(t => { boardMat.uniforms.uTime.value = t; if (bTween) { const p = Math.min(1, (t - bTween.s) / 1.2); boardMat.uniforms.uProg.value = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; if (p >= 1) { const u = boardMat.uniforms; u.tA.value = u.tB.value; u.aA.value = u.aB.value; u.uProg.value = 0; bTween = null; } } });
  let boardTimer = setInterval(() => { if (active && !(zone && zone.id === 'works')) showBoard(bIdx + 1); }, 5200);
  const chev = new THREE.Sprite(new THREE.SpriteMaterial({ map: arrowTex(), depthWrite: false })); chev.scale.set(1.1, 1.1, 1); scene.add(chev);

  // interaction pads: glowing cyan portal circles
  const zones = [];
  const bubble = bubbleTex();
  function addPad(id, x, z, label, color = CY, r = 1.9, lbg = CY) {
    const col = new THREE.Color(color);
    const u = { uTime: { value: 0 }, uOn: { value: 0 }, uCol: { value: col } };
    const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.16, .16, 40), std('#a89c8e', .9)); cast(base, false, true); base.position.set(x, .06, z); scene.add(base);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(r * 4.2, r * 4.2), new THREE.MeshBasicMaterial({ map: glowTex(color), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    glow.rotation.x = -Math.PI / 2; glow.position.set(x, .03, z); scene.add(glow);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.1, r * 2.1), new THREE.ShaderMaterial({ uniforms: u, vertexShader: uvVS, fragmentShader: padFS, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
    p.rotation.x = -Math.PI / 2; p.position.set(x, .16, z); scene.add(p);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(r * .98, r * .98, 3, 40, 1, true), new THREE.ShaderMaterial({ uniforms: u, vertexShader: uvVS, fragmentShader: beamFS, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending }));
    beam.position.set(x, 1.65, z); scene.add(beam);
    const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: pillLabel(label, lbg), toneMapped: false, depthWrite: false }));
    const ly = id === 'works' ? 3.7 : 3.05; lab.scale.set(3.2, .875, 1); lab.position.set(x, ly, z); scene.add(lab);
    const zn = { id, x, z, r, u, lab, label, kind: 'pad' }; zones.push(zn);
    anim.push(t => { u.uTime.value = t; lab.position.y = ly + Math.sin(t * 2 + x) * .08; });
    return zn;
  }
  addPad('works', 0, -6.4, 'VIEW WORKS');
  addPad('about', -7.6, -1.5, 'ABOUT ME');
  addPad('contact', 7.6, -1.5, 'SAY HELLO');
  addPad('skin', 7.5, 8.5, 'NEW COLOUR', '#ffcf3f', 1.6, '#ffd447');
  chev.position.set(0, 5.2, -6.4); anim.push(t => { chev.position.y = 5.2 + Math.abs(Math.sin(t * 3)) * .3; });

  // pad props: notice board (about), post box (contact), colour stand (skins)
  function notice(x, z, ry) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    const b = cast(new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, .3), wood)); b.position.y = 2.2; g.add(b); occl.push(b);
    [-1, 1].forEach(sd => { const p = cast(new THREE.Mesh(new THREE.BoxGeometry(.25, 3.6, .25), woodD)); p.position.set(sd * 1.05, 1.8, -.05); g.add(p); });
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.35), std('#ffffff', .9, { map: paperTex('About', ['PHP / Laravel', '5+ years', 'Kuala Lumpur', 'Open to roles']), emissive: '#ffffff', emissiveIntensity: .12 })); paper.position.set(0, 2.2, .16); g.add(paper);
    const bx = Math.abs(Math.cos(ry)) > .5 ? [2.6, .9] : [.9, 2.6]; solid(x, z, bx[0], bx[1]);
  }
  function postbox(x, z, ry) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    const post = cast(new THREE.Mesh(new THREE.CylinderGeometry(.14, .16, 1.6, 8), woodD)); post.position.y = .8; g.add(post);
    const pbM = std(CY, .42, { metalness: .25 }); const box = cast(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.1), pbM)); box.position.y = 2.05; g.add(box); occl.push(box);
    const top = cast(new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.6, 24, 1, false, 0, Math.PI), pbM)); top.rotation.z = Math.PI / 2; top.rotation.y = Math.PI / 2; top.position.y = 2.6; g.add(top);
    const slot = new THREE.Mesh(new THREE.PlaneGeometry(.8, .12), new THREE.MeshBasicMaterial({ color: 0x12324a })); slot.position.set(0, 2.25, .56); g.add(slot);
    const env = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), new THREE.MeshBasicMaterial({ map: pillLabel('MAIL', '#ffffff'), transparent: true })); env.position.set(0, 1.85, .56); g.add(env);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(.08, .5, .3), std('#e0603e', .7)); flag.castShadow = true; flag.position.set(.84, 2.5, .2); g.add(flag);
    anim.push(t => { flag.rotation.x = Math.sin(t * 2) * .25; });
    solid(x, z, 1.4, 1.4);
  }
  notice(-11.2, -1.5, Math.PI / 2);
  postbox(11.2, -1.5, -Math.PI / 2);
  // colour stand: a tree-stump counter with swatch balls on top
  const sm = cast(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.45, 1.6, 24), std('#ffffff', .95, { map: barkT }))); sm.position.set(7.5, .8, 11.2); scene.add(sm); occl.push(sm); circ(7.5, 11.2, 1.45);
  const smTop = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, .08, 24), std('#c9a273', .8)); cast(smTop, false, true); smTop.position.set(7.5, 1.62, 11.2); scene.add(smTop);
  SKINS.forEach((s, i) => { const a = i / SKINS.length * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(.26, 24, 16), std(s.c, .35)); b.castShadow = true; b.position.set(7.5 + Math.cos(a) * .75, 1.92, 11.2 + Math.sin(a) * .75); scene.add(b);
    anim.push(t => { b.position.y = 1.92 + Math.abs(Math.sin(t * 2.4 + i)) * .14; }); });
  const smSign = new THREE.Sprite(new THREE.SpriteMaterial({ map: pillLabel('COLOURS', '#ffffff'), depthWrite: false })); smSign.scale.set(2.4, .66, 1); smSign.position.set(7.5, 2.75, 11.2); scene.add(smSign);

  // NPC friends: small wandering creatures; each says one real fact from the profile
  const npcLines = [
    { name: 'PIP', c: '#9fd8ff', x: -4.5, z: 3.5, ears: 'round', text: PROFILE.about[0].split('. ')[0] + '.' },
    { name: 'MOSS', c: '#8bd86b', x: 4.2, z: 4.2, ears: 'long', text: 'He led a national government platform serving 100,000+ users as its sole core developer.' },
    { name: 'BLOOM', c: '#ffb3d1', x: -6.5, z: 8.5, ears: 'round', text: 'Strongest in Laravel, PHP 8, MySQL, REST APIs, RBAC, audit trails, and query and page performance optimisation.' },
    { name: 'TOFFEE', c: '#ffcf6b', x: 2.5, z: -2.2, ears: 'long', text: 'Right now he is building core modules of a government e-procurement platform for a Malaysian city authority.' },
  ];
  const npcs = npcLines.map((n, i) => {
    const b = makeCreature(n.c, .72, { sprout: false, ears: n.ears }); b.position.set(n.x, 0, n.z); scene.add(b);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubble, toneMapped: false, depthWrite: false })); s.scale.set(.75, .75, 1); s.position.set(n.x, 1.75, n.z); scene.add(s);
    const zn = { id: 'npc' + i, x: n.x, z: n.z, r: 1.8, kind: 'npc', npc: n, sprite: s, blob: b }; zones.push(zn);
    circ(n.x, n.z, .5);
    const ph = i * 1.3; let wa = 0;
    anim.push((t, dt) => {
      const near = Math.hypot(player.position.x - n.x, player.position.z - n.z) < 3.2;
      // gentle wander on a small loop around home (stops to face you when you come close)
      if (!near) wa += dt * .5; const wx = n.x + Math.cos(wa + ph) * .55, wz = n.z + Math.sin(wa + ph) * .55;
      b.position.x += (wx - b.position.x) * Math.min(1, dt * 2); b.position.z += (wz - b.position.z) * Math.min(1, dt * 2);
      b.userData.body.position.y = Math.abs(Math.sin(t * (near ? 2.2 : 5) + ph)) * .12; b.userData.body.scale.set(1 + Math.sin(t * 4.4 + ph) * .02, 1 - Math.sin(t * 4.4 + ph) * .03, 1);
      if (b.userData.tail) b.userData.tail.rotation.y = Math.sin(t * 6 + ph) * .4;
      const want = near ? Math.atan2(player.position.x - b.position.x, player.position.z - b.position.z) : Math.atan2(-Math.sin(wa + ph), Math.cos(wa + ph));
      b.rotation.y += Math.atan2(Math.sin(want - b.rotation.y), Math.cos(want - b.rotation.y)) * Math.min(1, dt * 3);
      s.position.set(b.position.x, 1.75 + Math.sin(t * 3 + ph) * .07, b.position.z); });
    return b;
  });
  roof.castShadow = true;

  // fireflies + drifting pollen glowing in the dusk
  const FN = mobile ? 110 : 220, fp = new Float32Array(FN * 3), fs = new Float32Array(FN * 4); { const r = rng(55);
    for (let i = 0; i < FN; i++) { const x = (r() - .5) * 40, z = (r() - .5) * 38 + 3; fp.set([x, hgt(x, z) + .3 + r() * 3.2, z], i * 3); fs.set([r(), r(), r(), r()], i * 4); } }
  const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.BufferAttribute(fp, 3)); fgeo.setAttribute('aS', new THREE.BufferAttribute(fs, 4));
  const flyU = { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uMot: { value: reduce ? .15 : 1 } };
  const flies = new THREE.Points(fgeo, new THREE.ShaderMaterial({ vertexShader: flyVS, fragmentShader: flyFS, uniforms: flyU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  flies.frustumCulled = false; scene.add(flies);
  anim.push(t => { flyU.uTime.value = t; pondMat.uniforms.uTime.value = t; });

  /* ---------- player ---------- */
  let skin = 0;
  const player = makeCreature(SKINS[0].c); player.position.set(0, 0, 5); player.rotation.y = Math.PI; scene.add(player);
  function setSkin(i) { skin = (i + SKINS.length) % SKINS.length; const c = new THREE.Color(SKINS[skin].c); const u = player.userData;
    u.mat.color.copy(c); u.mat.sheenColor.copy(c).lerp(new THREE.Color('#ffffff'), .55); return SKINS[skin]; }
  const vel = new THREE.Vector3(); let vy = 0, grounded = true, squash = 0, blink = 0, nextBlink = 2;
  const keys = new Set(); const joy = new THREE.Vector2(); let jumpReq = false;

  /* ---------- camera ---------- */
  let lookLift = 0; const camOff = new THREE.Vector3(), camPos = new THREE.Vector3(0, 5, 14), look = new THREE.Vector3(0, 1.5, 0), lookS = new THREE.Vector3(0, 1.5, 0);
  // adjustable orbit camera: yaw around the player, clamped pitch, clamped zoom (multiplier on the default distance)
  const ZMIN = .45, ZMAX = 1.8, PMIN = .1, PMAX = 1.25;
  const clampZ = z => THREE.MathUtils.clamp(isFinite(z) ? z : 1, ZMIN, ZMAX);
  let pitch0 = .43, dist0 = 10.6, yawT = 0, yawS = 0, pitchT = null, pitchS = .43, zoomT = clampZ(zoom0), zoomS = zoomT;
  const ray = new THREE.Raycaster(), rayDir = new THREE.Vector3(), pivot = new THREE.Vector3(), camWant = new THREE.Vector3();
  function resize() {
    camera.aspect = innerWidth / innerHeight; const portrait = innerHeight > innerWidth;
    camera.fov = portrait ? 68 : 50; camera.updateProjectionMatrix();
    camOff.set(0, portrait ? 6.2 : 4.4, portrait ? 11.5 : 9.6); cap.visible = true; lookLift = portrait ? .9 : 0;
    pitch0 = Math.atan2(camOff.y, camOff.z); dist0 = camOff.length(); if (pitchT === null) { pitchT = pitchS = pitch0; }
  }
  resize();

  /* ---------- zones ---------- */
  let zone = null; const talked = new Set();
  function zoneUpdate() {
    let best = null, bd = 1e9;
    for (const z of zones) { const d = Math.hypot(player.position.x - z.x, player.position.z - z.z); if (d < z.r && d < bd) { bd = d; best = z; } }
    if (best !== zone) {
      if (zone && zone.u) zone.u.uOn.value = 0;
      zone = best; if (zone && zone.u) zone.u.uOn.value = 1;
      if (zone && zone.kind === 'npc') { zone.sprite.visible = false; if (!talked.has(zone.id)) { talked.add(zone.id); onTalk && onTalk(talked.size, npcLines.length); } }
      onZone && onZone(zone ? (zone.kind === 'npc' ? { kind: 'npc', name: zone.npc.name, text: zone.npc.text, color: zone.npc.c } : { kind: 'pad', id: zone.id, label: zone.label, work: WORKS[bIdx] }) : null);
    }
  }
  function interact() { if (!zone || zone.kind !== 'pad') return false; if (zone.id === 'skin') { const s = setSkin(skin + 1); onAction && onAction('skin', { skin: s, index: skin }); squash = .35; return true; }
    onAction && onAction(zone.id, { work: WORKS[bIdx] }); return true; }

  /* ---------- update ---------- */
  let active = false, t = 0;
  function collide(p) {
    p.x = THREE.MathUtils.clamp(p.x, -15.5, 15.5); p.z = THREE.MathUtils.clamp(p.z, -11.2, 19);
    const R = .5;
    for (const s of solids) {
      if (s.circle) { const dx = p.x - s.x, dz = p.z - s.z, d = Math.hypot(dx, dz), m = R + s.r; if (d < m && d > 1e-4) { p.x = s.x + dx / d * m; p.z = s.z + dz / d * m; } continue; }
      const cx = THREE.MathUtils.clamp(p.x, s.x0, s.x1), cz = THREE.MathUtils.clamp(p.z, s.z0, s.z1); const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
      if (d < R) { if (d > 1e-4) { p.x = cx + dx / d * R; p.z = cz + dz / d * R; } else { p.z = s.z1 + R; } }
    }
  }
  const mouseS = new THREE.Vector2(), mouse = new THREE.Vector2();
  function update() {
    const dt = Math.min(.05, clock.getDelta()); t += dt;
    let ix = 0, iz = 0;
    if (keys.has('arrowleft') || keys.has('a') || keys.has('q')) ix -= 1; if (keys.has('arrowright') || keys.has('d')) ix += 1;
    if (keys.has('arrowup') || keys.has('w') || keys.has('z')) iz -= 1; if (keys.has('arrowdown') || keys.has('s')) iz += 1;
    ix += joy.x; iz += joy.y; const il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; }
    { const c = Math.cos(yawS), sn = Math.sin(yawS), rx = ix * c + iz * sn, rz = -ix * sn + iz * c; ix = rx; iz = rz; } // camera-relative
    const speed = 6.2; const k = 1 - Math.exp(-dt * 10);
    vel.x += (ix * speed - vel.x) * k; vel.z += (iz * speed - vel.z) * k;
    player.position.x += vel.x * dt; player.position.z += vel.z * dt; collide(player.position);
    if (jumpReq && grounded) { vy = 9.2; grounded = false; squash = -.25; }
    jumpReq = false;
    if (!grounded) { vy -= 26 * dt; player.position.y += vy * dt; if (player.position.y <= 0) { player.position.y = 0; grounded = true; squash = .3; vy = 0; } }
    const sp = Math.hypot(vel.x, vel.z);
    if (sp > .3) { const want = Math.atan2(vel.x, vel.z); player.rotation.y += Math.atan2(Math.sin(want - player.rotation.y), Math.cos(want - player.rotation.y)) * Math.min(1, dt * 12); }
    const u = player.userData; squash += (0 - squash) * Math.min(1, dt * 9);
    const bob = grounded ? Math.abs(Math.sin(t * 11)) * .1 * Math.min(1, sp / 4) : 0;
    const st = grounded ? squash : -Math.min(.22, Math.abs(vy) * .025);
    u.body.scale.set(1 + st * .5, 1 - st, 1 + st * .5); u.body.position.y = bob; u.body.rotation.x = Math.min(.25, sp * .035);
    if (u.tail) u.tail.rotation.y = Math.sin(t * (sp > .5 ? 14 : 4)) * (sp > .5 ? .5 : .25);
    u.shadow.position.y = .015 - player.position.y; u.shadow.scale.setScalar(Math.max(.4, 1 - player.position.y * .15));
    nextBlink -= dt; if (nextBlink < 0) { blink = .14; nextBlink = 2 + Math.random() * 3; } if (blink > 0) blink -= dt; u.eyes.scale.y = blink > 0 ? .15 : 1;
    // camera
    mouseS.lerp(mouse, .04);
    const kc = 1 - Math.exp(-dt * 9);
    yawS += (yawT - yawS) * kc; pitchS += (pitchT - pitchS) * kc; zoomS += (zoomT - zoomS) * kc;
    const yaw = yawS - mouseS.x * .12, pit = THREE.MathUtils.clamp(pitchS + mouseS.y * .05, PMIN, PMAX), dist = dist0 * zoomS;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const hd = Math.cos(pit) * dist;
    camWant.set(player.position.x - fx * hd, Math.sin(pit) * dist, player.position.z - fz * hd);
    camPos.lerp(camWant, 1 - Math.exp(-dt * 6));
    // keep the camera out of trees/rocks/props: ray from the player's head to the camera, pull in in front of the first hit
    pivot.set(player.position.x, 1.4 + player.position.y * .5, player.position.z);
    rayDir.subVectors(camPos, pivot); const want = rayDir.length();
    camera.position.copy(camPos);
    if (want > 1e-3) {
      rayDir.multiplyScalar(1 / want); ray.set(pivot, rayDir); ray.far = want + .6;
      const hit = ray.intersectObjects(occl, false)[0];
      if (hit) { const d = Math.max(1.2, hit.distance - .6); if (d < want) camera.position.copy(pivot).addScaledVector(rayDir, d); }
    }
    if (camera.position.y < .35) camera.position.y = .35;
    const ahead = 3.2 * Math.min(1, zoomS);
    look.set(player.position.x + fx * ahead, 1.3 + lookLift * Math.min(1, zoomS) + player.position.y * .35, player.position.z + fz * ahead);
    lookS.lerp(look, 1 - Math.exp(-dt * 5)); camera.lookAt(lookS);
    zoneUpdate();
    for (const f of anim) f(t, dt);
  }
  /* ---------- adaptive quality: pixel ratio, grass density and shadow resolution step down if frames are slow ---------- */
  const PR = mobile ? [1, 1.25, 1.5] : [1, 1.5, 2], GRASS = [.35, .65, 1];
  const qLock = qp === 'high' || qp === 'low';
  let tier = -1;
  function setTier(n) { if (n === tier) return; tier = n;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, PR[n])); flyU.uPR.value = renderer.getPixelRatio();
    grass.count = Math.floor(grass.userData.full * GRASS[n]);
    const ms = n === 2 && !mobile ? 2048 : 1024;
    if (sunL.shadow.mapSize.x !== ms) { sunL.shadow.mapSize.set(ms, ms); if (sunL.shadow.map) { sunL.shadow.map.dispose(); sunL.shadow.map = null; } }
  }
  setTier(qp === 'low' ? 0 : 2);
  let wall = performance.now(), warm = 0, fT = 0, fN = 0;
  function adapt() { const now = performance.now(), d = (now - wall) / 1000; wall = now;
    if (qLock || document.hidden || d <= 0 || d > .5) return; warm += d; if (warm < 3) return;
    fT += d; fN++; if (fT >= 2) { const fps = fN / fT; fT = 0; fN = 0; if (fps < 45 && tier > 0) setTier(tier - 1); } }

  function render(interactive) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    if (interactive) update(); else { clock.getDelta(); for (const f of anim) f(t += .016, .016); }
    adapt(); renderer.render(scene, camera);
  }

  showBoard(0);
  return {
    scene, camera, render, resize, interact, setSkin,
    setActive(a) { active = a; if (!a) { keys.clear(); joy.set(0, 0); } },
    key(k, down) { k = k.toLowerCase(); down ? keys.add(k) : keys.delete(k); },
    jump() { jumpReq = true; },
    setJoy(x, y) { joy.set(isFinite(x) ? x : 0, isFinite(y) ? y : 0); },
    setMouse(x, y) { if (isFinite(x) && isFinite(y)) mouse.set(x, y); },
    orbit(dx, dy) { if (!isFinite(dx) || !isFinite(dy)) return; yawT -= dx * .0065; pitchT = THREE.MathUtils.clamp((pitchT ?? pitch0) + dy * .005, PMIN, PMAX); },
    zoom(f) { if (!isFinite(f) || f <= 0) return; zoomT = clampZ(zoomT * f); onZoom && onZoom(zoomT); },
    resetCam() { yawT = Math.round(yawS / (Math.PI * 2)) * Math.PI * 2; pitchT = pitch0; zoomT = 1; onZoom && onZoom(1); },
    get camYaw() { return yawS; }, get camZoom() { return zoomT; },
    get zone() { return zone; },
    get boardIndex() { return bIdx; },
    get quality() { return tier; },
    npcCount: npcLines.length, skinCount: SKINS.length,
    dispose() { clearInterval(boardTimer); renderer.domElement.removeEventListener('webglcontextrestored', onRestore); if (envRT) { try { envRT.dispose(); } catch (e) {} } },
  };
}
