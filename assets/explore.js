// EXPLORE: a small walkable neon plaza. Original code; every sign and texture is generated at runtime.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const RED = '#ff0033';
export const SKINS = [
  { name: 'SIGNAL RED', c: '#ff0033' }, { name: 'CHROME', c: '#d9dde6' }, { name: 'AMBER', c: '#ffb400' },
  { name: 'ICE', c: '#19d3ff' }, { name: 'ULTRAVIOLET', c: '#8b5cff' },
];

/* ---------- canvas helpers ---------- */
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const MONO = '"JetBrains Mono", monospace', BOLD = 'Archivo, sans-serif';

function neonSign(text, { color = '#19d3ff', w = 1024, h = 256, size = 150, vertical = false, frame = true, font = BOLD, weight = 900 } = {}) {
  const [c, x] = vertical ? cv(h, w) : cv(w, h);
  x.fillStyle = 'rgba(0,0,0,0)'; x.clearRect(0, 0, c.width, c.height);
  x.fillStyle = color; x.strokeStyle = color; x.shadowColor = color; x.shadowBlur = 18;
  if (frame) { x.lineWidth = 6; x.strokeRect(10, 10, c.width - 20, c.height - 20); }
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `${weight} ${size}px ${font}`;
  if (vertical) { const ch = [...text]; const step = (c.height - 60) / ch.length; ch.forEach((k, i) => x.fillText(k, c.width / 2, 30 + step * (i + .5))); }
  else { let s = size; while (x.measureText(text).width > c.width - 70 && s > 20) { s -= 6; x.font = `${weight} ${s}px ${font}`; } x.fillText(text, c.width / 2, c.height / 2 + 4); }
  return tex(c);
}

// "holographic UI" panel: generated widgets, labels and katakana
function holoPanel(seed, color = '#7ee8ff', title = 'SYSTEM') {
  const [c, x] = cv(1024, 640); let r = seed;
  const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  x.clearRect(0, 0, 1024, 640); x.strokeStyle = color; x.fillStyle = color; x.lineWidth = 3; x.shadowColor = color; x.shadowBlur = 8;
  x.font = `900 92px ${BOLD}`; x.fillText(title, 30, 110);
  x.font = `600 22px ${MONO}`;
  const labels = ['AUTH OK', 'RBAC', 'QUEUE 0', 'AUDIT', 'SYNC', 'API 200', 'CRON', 'PDF', 'LOG', 'CACHE'];
  for (let i = 0; i < 6; i++) { const bx = 30 + (i % 3) * 330, by = 160 + Math.floor(i / 3) * 230; x.globalAlpha = .9; x.strokeRect(bx, by, 300, 200);
    x.fillText(labels[Math.floor(rnd() * labels.length)], bx + 16, by + 34);
    const kind = Math.floor(rnd() * 3);
    if (kind === 0) for (let b = 0; b < 9; b++) { const hh = 20 + rnd() * 110; x.globalAlpha = .65; x.fillRect(bx + 18 + b * 30, by + 185 - hh, 18, hh); }
    else if (kind === 1) { x.globalAlpha = .8; x.beginPath(); x.arc(bx + 150, by + 115, 58, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (.3 + rnd() * .65)); x.lineWidth = 12; x.stroke(); x.lineWidth = 3; }
    else for (let l = 0; l < 6; l++) { x.globalAlpha = .55; x.fillRect(bx + 18, by + 62 + l * 22, 60 + rnd() * 200, 8); }
  }
  x.globalAlpha = 1; x.font = `700 30px ${MONO}`; x.fillText('システム · 開発者', 640, 110);
  return tex(c);
}

function pillLabel(text, bg = RED, fg = '#000') {
  const [c, x] = cv(512, 128); x.font = `900 52px ${BOLD}`;
  const w = Math.min(500, x.measureText(text).width + 90);
  x.fillStyle = bg; const r = 50, X = (512 - w) / 2, Y = 14, H = 100;
  x.beginPath(); x.roundRect(X, Y, w, H, r); x.fill();
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 66);
  const t = tex(c); return t;
}

function bubbleTex() {
  const [c, x] = cv(128, 128); x.fillStyle = RED; x.beginPath(); x.roundRect(14, 10, 100, 86, 26); x.fill();
  x.beginPath(); x.moveTo(50, 92); x.lineTo(64, 118); x.lineTo(78, 92); x.fill();
  x.fillStyle = '#fff'; x.font = `900 70px ${BOLD}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('!', 64, 56);
  return tex(c);
}

function floorTex() {
  const [c, x] = cv(512, 512);
  x.fillStyle = 'rgba(0,0,0,.74)'; x.fillRect(0, 0, 512, 512);
  x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 2; x.strokeRect(1, 1, 510, 510);
  x.strokeStyle = 'rgba(255,255,255,.035)'; x.lineWidth = 1; x.beginPath(); x.moveTo(256, 0); x.lineTo(256, 512); x.moveTo(0, 256); x.lineTo(512, 256); x.stroke();
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(20, 20); return t;
}

/* ---------- shaders ---------- */
const padFS = `uniform float uTime, uOn; uniform vec3 uCol; varying vec2 vUv;
float arc(float r, float w, float a, float spd, float gaps, float rr){ float band = (1. - smoothstep(0., w, abs(rr - r)));
  float g = step(.35, fract((a / 6.2831 + uTime * spd) * gaps)); return band * g; }
void main(){ vec2 p = vUv * 2. - 1.; float rr = length(p); float a = atan(p.y, abs(p.x) < 1e-4 ? 1e-4 : p.x);
  float k = arc(.92, .03, a, .05, 3., rr) + arc(.78, .018, a, -.09, 5., rr) * .9 + arc(.62, .012, a, .14, 2., rr) * .7;
  float pulse = (1. - smoothstep(0., .02, abs(rr - fract(uTime * .45) * .95))) * (1. - rr) * .9;
  float disc = (1. - smoothstep(0., 1., rr)) * .10;
  vec3 col = mix(uCol, vec3(1.), step(.7, fract(a * 1.5 / 6.2831 + uTime * .1)) * .6) * (k + pulse) * (1.4 + uOn * 1.8) + uCol * disc * (1. + uOn * 2.);
  gl_FragColor = vec4(col, 1.); }`;
const beamFS = `uniform float uTime, uOn; uniform vec3 uCol; varying vec2 vUv;
void main(){ float f = pow(clamp(1. - vUv.y, 0., 1.), 2.2) * (.25 + uOn * .55); f *= .7 + .3 * sin(vUv.y * 40. - uTime * 6.); gl_FragColor = vec4(uCol * f * 1.6, 1.); }`;
const uvVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const boardFS = `uniform sampler2D tA, tB; uniform float aA, aB, uProg, uTime, uAsp; varying vec2 vUv;
vec2 fit(vec2 uv, float a){ vec2 s = a > uAsp ? vec2(1., uAsp / a) : vec2(a / uAsp, 1.); return (uv - .5) / s + .5; }
vec4 samp(sampler2D t, vec2 uv, float a){ vec2 q = fit(uv, a); float m = step(0., q.x) * step(q.x, 1.) * step(0., q.y) * step(q.y, 1.); return texture2D(t, q) * m; }
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){ vec2 uv = vUv; float n = h(floor(uv * vec2(32., 18.)) + floor(uTime * 12.) * .0); float m = step(n, uProg);
  float row = h(vec2(floor(uv.y * 60.), floor(uTime * 20.))); float g = (1. - abs(uProg - .5) * 2.) * step(.85, row) * .06; uv.x += g;
  vec3 a = samp(tA, uv, aA).rgb, b = samp(tB, uv, aB).rgb; vec3 col = mix(a, b, m);
  col *= .88 + .12 * sin(vUv.y * 700. + uTime * 5.); col += vec3(1., 0., .2) * (1. - smoothstep(0., .05, abs(n - uProg))) * step(.01, uProg) * step(uProg, .99) * 2.;
  col *= .5; gl_FragColor = vec4(col, 1.);
  #include <colorspace_fragment>
}`;

/* ---------- blob character ---------- */
function blobGeometry(h = 1.25, r = .55) {
  const pts = []; const N = 26;
  for (let i = 0; i <= N; i++) { const t = i / N; // bottom (0) to top (1)
    const y = t * h; const bottom = Math.sin(Math.min(1, t / .18) * Math.PI / 2); const top = Math.cos(Math.max(0, (t - .55) / .45) * Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(.001, r * bottom * Math.pow(top, .8) * (1 + .06 * Math.sin(t * Math.PI))), y)); }
  pts[0].x = .001; const g = new THREE.LatheGeometry(pts, 40); g.computeVertexNormals(); return g;
}
function makeBlob(color, scale = 1, antenna = true) {
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .32, metalness: .1, emissive: new THREE.Color(color), emissiveIntensity: .18 });
  const mesh = new THREE.Mesh(blobGeometry(), mat); body.add(mesh);
  const eyeM = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 4), toneMapped: false });
  const eyeG = new THREE.CapsuleGeometry(.055, .11, 4, 8);
  const eyes = new THREE.Group(); [-.15, .15].forEach(x => { const e = new THREE.Mesh(eyeG, eyeM); e.position.set(x, .78, .47); eyes.add(e); }); body.add(eyes);
  if (antenna) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .28, 6), mat); st.position.y = 1.36; body.add(st);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(3), toneMapped: false })); tip.position.y = 1.52; body.add(tip); g.userData.tip = tip; }
  const sh = new THREE.Mesh(new THREE.CircleGeometry(.6, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .55, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = .015; g.add(sh);
  g.scale.setScalar(scale); g.userData = { ...g.userData, body, mat, eyes, shadow: sh };
  return g;
}

/* ================================================================ */
export function createExplore({ renderer, WORKS, PROFILE, getTexture, onZone, onAction, onTalk, mobile, zoom: zoom0 = 1, onZoom }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020203);
  scene.fog = new THREE.FogExp2(0x020203, .03);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 200);
  const clock = new THREE.Clock();
  const anim = []; // per-frame callbacks
  const solids = []; // xz AABBs {x0,x1,z0,z1}
  const occl = []; // meshes the camera must not pass through
  const solid = (x, z, w, d) => solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });

  scene.add(new THREE.AmbientLight(0x404060, .6));
  scene.add(new THREE.HemisphereLight(0x3344ff, 0x000000, .5));
  const pl = (c, i, x, y, z, d = 28) => { const l = new THREE.PointLight(c, i, d, 1.6); l.position.set(x, y, z); scene.add(l); return l; };
  pl(0xff0033, 60, 0, 5, -8); pl(0x19d3ff, 40, -11, 4, 0); pl(0xff2bd6, 40, 11, 4, 2); pl(0xffb400, 18, 0, 3, 12, 18);

  // floor: reflector + translucent tile overlay
  const scale = mobile ? .4 : .6;
  const mirror = new Reflector(new THREE.PlaneGeometry(120, 120), { textureWidth: innerWidth * scale, textureHeight: innerHeight * scale, color: 0x9a9aa6, clipBias: .003 });
  mirror.rotation.x = -Math.PI / 2; scene.add(mirror);
  const over = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshBasicMaterial({ map: floorTex(), transparent: true, depthWrite: false }));
  over.rotation.x = -Math.PI / 2; over.position.y = .005; scene.add(over);

  // towers around the plaza
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: .45, metalness: .7 });
  const signColors = ['#19d3ff', '#ff2bd6', '#ffb400', '#7dff6a', '#ff0033', '#ffffff'];
  const signs = [
    ['LARAVEL', 0], ['PHP 8', 1], ['MySQL', 2], ['REST API', 3], ['RBAC', 4], ['AUDIT TRAIL', 0], ['LIVEWIRE', 1], ['OPEN TO ROLES', 4],
    ['KUALA LUMPUR', 5], ['5+ YRS', 2], ['100,000+ USERS', 3], ['QUEUES / JOBS', 0],
  ];
  const vsigns = [['開発者', 4], ['電子調達', 0], ['監査証跡', 1], ['クアラルンプール', 2], ['システム', 3], ['承認フロー', 5]];
  const towers = [
    [-19, -14, 6, 24, 6], [-24, -4, 7, 32, 7], [-19, 7, 5, 18, 6], [-23, 16, 7, 26, 7],
    [19, -14, 6, 28, 6], [24, -3, 7, 22, 7], [19, 8, 5, 30, 6], [23, 17, 7, 20, 7],
    [-9, -22, 8, 34, 6], [9, -22, 8, 26, 6], [0, -28, 10, 40, 6], [-16, -24, 6, 20, 6], [16, -25, 6, 36, 6],
    [-10, 24, 7, 18, 6], [10, 25, 7, 22, 6], [0, 30, 9, 30, 6],
  ];
  const sgeo = new THREE.PlaneGeometry(1, 1);
  let si = 0, vi = 0;
  towers.forEach(([x, z, w, h, d], k) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), towerMat); m.position.set(x, h / 2, z); scene.add(m); occl.push(m); solid(x, z, w, d);
    // the face looking at the plaza centre
    const toC = new THREE.Vector2(-x, -z); const faceX = Math.abs(toC.x) > Math.abs(toC.y);
    const nx = faceX ? Math.sign(toC.x) : 0, nz = faceX ? 0 : Math.sign(toC.y); const faceW = faceX ? d : w;
    const place = (mesh, y, along = 0) => { mesh.position.set(x + nx * (w / 2 + .03) + (faceX ? 0 : along), y, z + nz * (d / 2 + .03) + (faceX ? along : 0)); mesh.rotation.y = Math.atan2(nx, nz); scene.add(mesh); };
    const [t1, c1] = signs[si++ % signs.length];
    const col = new THREE.Color(signColors[c1]).multiplyScalar(2.2);
    const s = new THREE.Mesh(sgeo, new THREE.MeshBasicMaterial({ map: neonSign(t1, { color: signColors[c1] }), color: col, transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.set(faceW * .9, faceW * .9 / 4, 1); place(s, 3.2 + (k % 3) * 2.2 + faceW * .1);
    if (k % 2 === 0) { const [t2, c2] = vsigns[vi++ % vsigns.length];
      const v = new THREE.Mesh(sgeo, new THREE.MeshBasicMaterial({ map: neonSign(t2, { color: signColors[c2], vertical: true, size: 120, font: 'sans-serif', weight: 700 }), color: new THREE.Color(signColors[c2]).multiplyScalar(2), transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      v.scale.set(1.3, 5.2, 1); place(v, 9 + (k % 4), faceW * .32);
      const ph = Math.random() * 6; anim.push(t => { v.material.opacity = .75 + .25 * Math.sin(t * 3 + ph) * (Math.sin(t * 17 + ph) > .96 ? 0 : 1); }); }
    // lit window strips
    const strips = new THREE.Mesh(sgeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(signColors[(k + 2) % 6]).multiplyScalar(.5), transparent: true, opacity: .5, toneMapped: false, depthWrite: false }));
    strips.scale.set(faceW * .7, .06, 1); for (let j = 0; j < 4; j++) { const c = strips.clone(); place(c, h * (.55 + j * .1)); }
  });

  // holographic UI walls at the plaza sides (the "billboard street")
  [[-12.5, -2, .42, '#7ee8ff', 'GENERATE'], [12.5, -2, -.42, '#ff7bf0', 'VIRTUAL'], [-13, 9, .9, '#ffd36a', 'DATA'], [13, 9, -.9, '#7ee8ff', 'SYSTEM']].forEach(([x, z, ry, c, t], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 5.6), new THREE.MeshBasicMaterial({ map: holoPanel(17 + i * 31, c, t), color: new THREE.Color(1.6, 1.6, 1.6), transparent: true, opacity: .85, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    m.position.set(x, 3.6, z); m.rotation.y = Math.PI / 2 * Math.sign(-x) - ry * 0 + (x < 0 ? -ry : -ry); scene.add(m);
    const ph = i * 1.7; anim.push(t => { m.material.opacity = .7 + .15 * Math.sin(t * 1.3 + ph) - (Math.sin(t * 23 + ph) > .97 ? .4 : 0); m.position.y = 3.6 + Math.sin(t * .6 + ph) * .08; });
  });

  // red light streaks
  const streakMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, vertexShader: uvVS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    fragmentShader: `uniform float uTime; varying vec2 vUv; void main(){ float head = fract(uTime * .25 + vUv.y * .0); float d = vUv.x - head; float tail = smoothstep(-.45, 0., d) * step(d, 0.); float core = (1. - smoothstep(0., .5, abs(vUv.y - .5)));
      gl_FragColor = vec4(vec3(1., .0, .2) * (tail * 3. + .25) * core, 1.); }` });
  [[-6, 2.2, -12, 26, .2, .25], [8, 6.5, -13, 30, -.15, 0], [-14, 1.2, 4, 22, Math.PI / 2 + .25, 0], [14, 1.6, -4, 22, Math.PI / 2 - .2, 0], [0, 12, -16, 40, .05, 0]].forEach(([x, y, z, L, ry, rz], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, .09), streakMat.clone()); m.position.set(x, y, z); m.rotation.set(0, ry, rz); scene.add(m);
    const off = i * .37; anim.push(t => { m.material.uniforms.uTime.value = t + off * 4; });
  });

  // billboard (works)
  const BW = 13, BH = BW * 9 / 16;
  const boardMat = new THREE.ShaderMaterial({ vertexShader: uvVS, fragmentShader: boardFS, toneMapped: false,
    uniforms: { tA: { value: null }, tB: { value: null }, aA: { value: 1.6 }, aB: { value: 1.6 }, uProg: { value: 0 }, uTime: { value: 0 }, uAsp: { value: BW / BH } } });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), boardMat); board.position.set(0, BH / 2 + 2.2, -12.2); scene.add(board);
  const boardBack = new THREE.Mesh(new THREE.BoxGeometry(BW + .6, BH + .6, .5), towerMat); boardBack.position.set(0, board.position.y, -12.5); scene.add(boardBack); occl.push(boardBack);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, .8), towerMat); legs.position.set(0, 1.2, -12.5); scene.add(legs); solid(0, -12.4, BW + .6, 1.4);
  const fl = new THREE.LineBasicMaterial({ color: new THREE.Color(3, 0, .6), toneMapped: false });
  const hw = BW / 2 + .25, hh = BH / 2 + .25, Lc = 1.1;
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sy]) => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sx * hw, sy * (hh - Lc), 0), new THREE.Vector3(sx * hw, sy * hh, 0), new THREE.Vector3(sx * (hw - Lc), sy * hh, 0)]);
    const l = new THREE.Line(g, fl); l.position.set(0, board.position.y, -12.1); scene.add(l); });
  const [capC, capX] = cv(2048, 160); const capT = tex(capC);
  const cap = new THREE.Mesh(new THREE.PlaneGeometry(BW, BW * 160 / 2048), new THREE.MeshBasicMaterial({ map: capT, transparent: true, toneMapped: false, color: new THREE.Color(1.6, 1.6, 1.6) }));
  cap.position.set(0, board.position.y + BH / 2 + .75, -12.15); scene.add(cap);
  let bIdx = 0, bTween = null;
  const pad2 = n => String(n).padStart(2, '0');
  function drawCap(w) { capX.clearRect(0, 0, 2048, 160); capX.fillStyle = RED; capX.font = `600 40px ${MONO}`; capX.textBaseline = 'middle';
    capX.fillText(`${pad2(WORKS.indexOf(w) + 1)} / ${pad2(WORKS.length)}`, 8, 80); capX.font = `900 86px ${BOLD}`; let s = 86;
    while (capX.measureText(w.title.toUpperCase()).width > 1500 && s > 40) { s -= 4; capX.font = `900 ${s}px ${BOLD}`; }
    capX.fillText(w.title.toUpperCase(), 230, 84); capT.needsUpdate = true; }
  function showBoard(i) {
    bIdx = (i + WORKS.length) % WORKS.length; const w = WORKS[bIdx]; drawCap(w);
    return getTexture(w, 0).then(t => { const u = boardMat.uniforms;
      if (!u.tA.value) { u.tA.value = u.tB.value = t; u.aA.value = u.aB.value = t.userData.aspect; return; }
      u.tA.value = u.tB.value; u.aA.value = u.aB.value; u.tB.value = t; u.aB.value = t.userData.aspect; u.uProg.value = 0; bTween = { s: clock.elapsedTime }; });
  }
  anim.push(t => { boardMat.uniforms.uTime.value = t; if (bTween) { const p = Math.min(1, (t - bTween.s) / 1.1); boardMat.uniforms.uProg.value = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; if (p >= 1) { const u = boardMat.uniforms; u.tA.value = u.tB.value; u.aA.value = u.aB.value; u.uProg.value = 0; bTween = null; } } });
  let boardTimer = setInterval(() => { if (active && !(zone && zone.id === 'works')) showBoard(bIdx + 1); }, 5200);
  // chevrons above the pad
  const chev = new THREE.Mesh(sgeo, new THREE.MeshBasicMaterial({ map: neonSign('▼', { color: RED, frame: false, w: 256, h: 256, size: 200, font: 'sans-serif' }), color: new THREE.Color(3, .2, .6), transparent: true, toneMapped: false, depthWrite: false }));
  chev.scale.set(1.1, 1.1, 1); scene.add(chev);

  // interaction pads
  const zones = [];
  const bubble = bubbleTex();
  function addPad(id, x, z, label, color = RED, r = 1.9) {
    const col = new THREE.Color(color);
    const u = { uTime: { value: 0 }, uOn: { value: 0 }, uCol: { value: col } };
    const p = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.4, r * 2.4), new THREE.ShaderMaterial({ uniforms: u, vertexShader: uvVS, fragmentShader: padFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    p.rotation.x = -Math.PI / 2; p.position.set(x, .02, z); scene.add(p);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 3.2, 40, 1, true), new THREE.ShaderMaterial({ uniforms: u, vertexShader: uvVS, fragmentShader: beamFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
    beam.position.set(x, 1.6, z); scene.add(beam);
    const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: pillLabel(label), toneMapped: false, depthWrite: false, color: new THREE.Color(1.4, 1.4, 1.4) }));
    const ly = id === 'works' ? 3.7 : 3.05; lab.scale.set(3.2, .8, 1); lab.position.set(x, ly, z); scene.add(lab);
    const zn = { id, x, z, r, u, lab, label, kind: 'pad' }; zones.push(zn);
    anim.push(t => { u.uTime.value = t; lab.position.y = ly + Math.sin(t * 2 + x) * .08; });
    return zn;
  }
  addPad('works', 0, -6.4, 'VIEW WORKS');
  addPad('about', -7.6, -1.5, 'ABOUT ME', '#ff0033');
  addPad('contact', 7.6, -1.5, 'SAY HELLO', '#ff0033');
  addPad('skin', 7.5, 8.5, 'NEW SKIN', '#ffffff', 1.6);
  chev.position.set(0, 5.2, -6.4); anim.push(t => { chev.position.y = 5.2 + Math.sin(t * 3) * .15; });

  // pad props: terminal (about) & mail kiosk (contact) & skin machine
  function kiosk(x, z, ry, title, color) {
    const k = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.4, .6), towerMat); k.position.set(x, 1.7, z); k.rotation.y = ry; scene.add(k); occl.push(k);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.6), new THREE.MeshBasicMaterial({ map: holoPanel(x * 7 + 99, color, title), color: new THREE.Color(1.5, 1.5, 1.5), toneMapped: false }));
    sc.position.set(x + Math.sin(ry) * .31, 1.9, z + Math.cos(ry) * .31); sc.rotation.y = ry; scene.add(sc);
    const bx = Math.abs(Math.cos(ry)) > .5 ? [2.4, .9] : [.9, 2.4]; solid(x, z, bx[0], bx[1]);
  }
  kiosk(-11.2, -1.5, Math.PI / 2, 'ABOUT', '#ff4d6d');
  kiosk(11.2, -1.5, -Math.PI / 2, 'MAIL', '#ff4d6d');
  // skin machine: colour swatches
  const sm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.2, .8), towerMat); sm.position.set(7.5, 2.1, 11.2); scene.add(sm); occl.push(sm); solid(7.5, 11.2, 2.6, 1.2);
  SKINS.forEach((s, i) => { const sw = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), new THREE.MeshBasicMaterial({ color: new THREE.Color(s.c).multiplyScalar(2), toneMapped: false }));
    sw.position.set(6.7 + (i % 3) * .8, 3.3 - Math.floor(i / 3) * .8, 10.79); sw.rotation.y = Math.PI; scene.add(sw); });
  const smSign = new THREE.Mesh(sgeo, new THREE.MeshBasicMaterial({ map: neonSign('SKINS', { color: '#ffffff' }), color: new THREE.Color(1.8, 1.8, 1.8), transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  smSign.scale.set(2.2, .55, 1); smSign.position.set(7.5, 1.4, 10.79); smSign.rotation.y = Math.PI; scene.add(smSign);

  // NPC friends: each says one real fact from the profile
  const npcLines = [
    { name: 'FRIEND 01', c: '#19d3ff', x: -4.5, z: 3.5, text: PROFILE.about[0].split('. ')[0] + '.' },
    { name: 'FRIEND 02', c: '#ffb400', x: 4.2, z: 4.2, text: 'He led a national government platform serving 100,000+ users as its sole core developer.' },
    { name: 'FRIEND 03', c: '#ff2bd6', x: -7.5, z: 9.5, text: 'Strongest in Laravel, PHP 8, MySQL, REST APIs, RBAC, audit trails, and query and page performance optimisation.' },
    { name: 'FRIEND 04', c: '#7dff6a', x: 2.5, z: -2.2, text: 'Right now he is building core modules of a government e-procurement platform for a Malaysian city authority.' },
  ];
  const npcs = npcLines.map((n, i) => {
    const b = makeBlob(n.c, .72, false); b.position.set(n.x, 0, n.z); scene.add(b);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubble, toneMapped: false, depthWrite: false, color: new THREE.Color(1.5, 1.5, 1.5) })); s.scale.set(.6, .6, 1); s.position.set(n.x, 1.65, n.z); scene.add(s);
    const zn = { id: 'npc' + i, x: n.x, z: n.z, r: 1.8, kind: 'npc', npc: n, sprite: s, blob: b }; zones.push(zn);
    solids.push({ circle: true, x: n.x, z: n.z, r: .5 });
    const ph = i * 1.3; anim.push((t, dt) => { b.userData.body.position.y = Math.abs(Math.sin(t * 2.2 + ph)) * .12; b.userData.body.scale.set(1 + Math.sin(t * 4.4 + ph) * .02, 1 - Math.sin(t * 4.4 + ph) * .03, 1);
      const dx = player.position.x - n.x, dz = player.position.z - n.z; const want = Math.atan2(dx, dz); b.rotation.y += Math.atan2(Math.sin(want - b.rotation.y), Math.cos(want - b.rotation.y)) * Math.min(1, dt * 3);
      s.position.y = 1.65 + Math.sin(t * 3 + ph) * .07; });
    return b;
  });

  // dust
  const D = 700, dp = new Float32Array(D * 3);
  for (let i = 0; i < D; i++) { dp[i * 3] = (Math.random() - .5) * 60; dp[i * 3 + 1] = Math.random() * 16; dp[i * 3 + 2] = (Math.random() - .5) * 60; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: new THREE.Color(2, .1, .4), size: .05, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(dust); anim.push(t => { dust.rotation.y = t * .01; });

  /* ---------- player ---------- */
  let skin = 0;
  const player = makeBlob(SKINS[0].c); player.position.set(0, 0, 5); player.rotation.y = Math.PI; scene.add(player);
  const plight = new THREE.PointLight(SKINS[0].c, 6, 6, 1.5); plight.position.set(0, 1.2, 0); player.add(plight);
  function setSkin(i) { skin = (i + SKINS.length) % SKINS.length; const c = new THREE.Color(SKINS[skin].c); const u = player.userData;
    u.mat.color.copy(c); u.mat.emissive.copy(c); plight.color.copy(c); if (u.tip) u.tip.material.color.copy(c).multiplyScalar(3); return SKINS[skin]; }
  const vel = new THREE.Vector3(); let vy = 0, grounded = true, squash = 0, blink = 0, nextBlink = 2;
  const keys = new Set(); const joy = new THREE.Vector2(); let jumpReq = false;

  /* ---------- post ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // Guard: some GPUs (notably NVIDIA/ANGLE) emit NaN/Inf for edge-case fragments; bloom then smears them into
  // growing black blocks. Clamp every pixel to a finite HDR range before bloom.
  composer.addPass(new ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: uvVS,
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv);
      bvec4 bad = bvec4(!(c.r >= 0. && c.r < 1e4), !(c.g >= 0. && c.g < 1e4), !(c.b >= 0. && c.b < 1e4), !(c.a >= 0. && c.a < 1e4));
      if (any(bad)) c = vec4(0., 0., 0., 1.); gl_FragColor = vec4(min(c.rgb, vec3(24.)), 1.); }` }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), mobile ? .75 : .95, .55, .62); composer.addPass(bloom);
  composer.addPass(new OutputPass());

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
    camOff.set(0, portrait ? 6.2 : 4.4, portrait ? 11.5 : 9.6); cap.visible = !portrait; lookLift = portrait ? .9 : 0;
    pitch0 = Math.atan2(camOff.y, camOff.z); dist0 = camOff.length(); if (pitchT === null) { pitchT = pitchS = pitch0; }
    composer.setSize(innerWidth, innerHeight); composer.setPixelRatio(renderer.getPixelRatio());
    mirror.getRenderTarget().setSize(innerWidth * scale, innerHeight * scale);
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
    // input
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
    u.shadow.position.y = .015 - player.position.y; u.shadow.scale.setScalar(Math.max(.4, 1 - player.position.y * .15));
    nextBlink -= dt; if (nextBlink < 0) { blink = .14; nextBlink = 2 + Math.random() * 3; } if (blink > 0) blink -= dt; u.eyes.scale.y = blink > 0 ? .15 : 1;
    // camera
    mouseS.lerp(mouse, .04);
    const kc = 1 - Math.exp(-dt * 9);
    yawS += (yawT - yawS) * kc; pitchS += (pitchT - pitchS) * kc; zoomS += (zoomT - zoomS) * kc;
    const yaw = yawS - mouseS.x * .12, pit = THREE.MathUtils.clamp(pitchS + mouseS.y * .05, PMIN, PMAX), dist = dist0 * zoomS;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw); // forward on the ground
    const hd = Math.cos(pit) * dist;
    camWant.set(player.position.x - fx * hd, Math.sin(pit) * dist, player.position.z - fz * hd);
    camPos.lerp(camWant, 1 - Math.exp(-dt * 6));
    // keep the camera out of towers: ray from the player's head to the camera, pull in in front of the first hit
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
  function render(interactive) { if (interactive) update(); else { clock.getDelta(); for (const f of anim) f(t += .016, .016); } composer.render(); }

  showBoard(0);
  return {
    scene, camera, render, resize, interact, setSkin,
    setActive(a) { active = a; if (!a) { keys.clear(); joy.set(0, 0); } },
    key(k, down) { k = k.toLowerCase(); down ? keys.add(k) : keys.delete(k); },
    jump() { jumpReq = true; },
    setJoy(x, y) { joy.set(x, y); },
    setMouse(x, y) { mouse.set(x, y); },
    orbit(dx, dy) { if (!isFinite(dx) || !isFinite(dy)) return; yawT -= dx * .0065; pitchT = THREE.MathUtils.clamp((pitchT ?? pitch0) + dy * .005, PMIN, PMAX); },
    zoom(f) { if (!isFinite(f) || f <= 0) return; zoomT = clampZ(zoomT * f); onZoom && onZoom(zoomT); },
    resetCam() { yawT = Math.round(yawS / (Math.PI * 2)) * Math.PI * 2; pitchT = pitch0; zoomT = 1; onZoom && onZoom(1); },
    get camYaw() { return yawS; }, get camZoom() { return zoomT; },
    get zone() { return zone; },
    get boardIndex() { return bIdx; },
    npcCount: npcLines.length, skinCount: SKINS.length,
    dispose() { clearInterval(boardTimer); },
  };
}
