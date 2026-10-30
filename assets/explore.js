// EXPLORE: a small walkable sunny meadow island with original creatures. Original code; every texture is generated at runtime.
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
function toonRamp() { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; }

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
void main(){ float f = clamp(1. - vUv.y, 0., 1.); f = f * f * (.12 + uOn * .28);
  vec2 g = vec2(floor(vUv.x * 40.), floor(vUv.y * 10. - uTime * 1.6)); float s = step(.93, h(g)) * (1. - vUv.y) * (.5 + uOn);
  gl_FragColor = vec4(mix(uCol, vec3(1.), .4 + s), clamp(f + s * .7, 0., .9)); }`;
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
  gl_FragColor = vec4(col, 1.);
  #include <colorspace_fragment>
}`;
const skyVS = `varying vec3 vW; void main(){ vW = (modelMatrix * vec4(position, 1.)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const skyFS = `varying vec3 vW; uniform vec3 uTop, uHor, uSun; uniform vec3 uSunDir;
void main(){ vec3 d = normalize(vW + vec3(0., 1e-3, 0.)); float y = clamp(d.y, -1., 1.);
  vec3 col = mix(uHor, uTop, smoothstep(0., .55, y)); col = mix(col, vec3(.86, .95, 1.), (1. - smoothstep(-.1, .08, y)) * .6);
  float s = max(dot(d, normalize(uSunDir)), 0.); col += uSun * (smoothstep(.995, .998, s) * .9 + s * s * s * s * s * s * s * s * .25);
  gl_FragColor = vec4(col, 1.);
  #include <colorspace_fragment>
}`;

/* ---------- creature (original design: round body, big eyes, long ears, curly leaf tail) ---------- */
const RAMP = toonRamp();
function toon(color) { return new THREE.MeshToonMaterial({ color, gradientMap: RAMP }); }
function makeCreature(color, scale = 1, { sprout = true, ears = 'long' } = {}) {
  const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
  const mat = toon(color), cream = toon('#fff6e4'), dark = new THREE.MeshBasicMaterial({ color: 0x12324a }), white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const outline = new THREE.MeshBasicMaterial({ color: 0x12324a, side: THREE.BackSide });
  const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1, ol = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.scale.set(sx, sy, sz); body.add(me);
    if (ol) { const o = new THREE.Mesh(geo, outline); o.position.copy(me.position); o.scale.set(sx * (1 + ol), sy * (1 + ol), sz * (1 + ol)); body.add(o); } return me; };
  const sph = new THREE.SphereGeometry(1, 24, 16);
  add(sph, mat, 0, .62, 0, .6, .58, .55, .05); // round body+head
  add(sph, cream, 0, .5, .3, .36, .32, .26); // belly
  // big eyes: white, dark pupil, shine
  const eyes = new THREE.Group(); body.add(eyes);
  [-.19, .19].forEach(x => {
    const e = new THREE.Mesh(sph, white); e.position.set(x, .78, .45); e.scale.set(.13, .16, .08); eyes.add(e);
    const p = new THREE.Mesh(sph, dark); p.position.set(x * 1.02, .77, .51); p.scale.set(.09, .12, .05); eyes.add(p);
    const s = new THREE.Mesh(sph, white); s.position.set(x * 1.02 + .03, .82, .555); s.scale.set(.03, .035, .02); eyes.add(s);
  });
  const blush = new THREE.MeshBasicMaterial({ color: 0xff9fb2 });
  [-.33, .33].forEach(x => add(sph, blush, x, .62, .42, .07, .04, .03));
  add(new THREE.TorusGeometry(.05, .014, 6, 12, Math.PI), dark, 0, .64, .54).rotation.z = Math.PI;
  // ears
  const earG = ears === 'long' ? new THREE.ConeGeometry(.15, .55, 10) : new THREE.SphereGeometry(.15, 12, 10);
  [-1, 1].forEach(sd => {
    const e = add(earG, mat, sd * .3, ears === 'long' ? 1.28 : 1.15, -.02, 1, 1, .6, .08); e.rotation.z = -sd * .38;
    if (ears === 'long') { const inr = add(new THREE.ConeGeometry(.08, .34, 8), toon('#ffd0dd'), sd * .31, 1.25, .05, 1, 1, .4); inr.rotation.z = -sd * .38; }
  });
  body.children.forEach(m => { if (m.material === outline && Math.abs(m.position.x) > .2 && m.position.y > 1) m.rotation.z = -Math.sign(m.position.x) * .38; });
  // curly tail with a leaf tip
  const tail = new THREE.Group(); tail.position.set(0, .45, -.5); body.add(tail);
  for (let i = 0; i < 5; i++) { const t = i / 4; const m = new THREE.Mesh(sph, i === 4 ? toon('#7fd36b') : mat); m.position.set(0, Math.sin(t * 2.4) * .42, -Math.cos(t * 2.4) * .18 - t * .2); m.scale.setScalar(.12 - t * .015); if (i === 4) m.scale.set(.16, .06, .1); tail.add(m); }
  g.userData.tail = tail;
  // feet
  [-.22, .22].forEach(x => add(sph, mat, x, .07, .12, .14, .08, .17, .1));
  if (sprout) { const st = add(new THREE.CylinderGeometry(.018, .018, .2, 6), toon('#4f9e45'), 0, 1.25, 0); const lf = toon('#7fd36b');
    [-1, 1].forEach(sd => { const l = add(sph, lf, sd * .09, 1.36, 0, .1, .04, .06); l.rotation.z = sd * .5; }); g.userData.tip = st; }
  const sh = new THREE.Mesh(new THREE.CircleGeometry(.6, 24), new THREE.MeshBasicMaterial({ color: 0x2f6f3a, transparent: true, opacity: .28, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = .015; g.add(sh);
  g.scale.setScalar(scale); g.userData = { ...g.userData, body, mat, eyes, shadow: sh };
  return g;
}

/* ================================================================ */
export function createExplore({ renderer, WORKS, PROFILE, getTexture, onZone, onAction, onTalk, mobile, zoom: zoom0 = 1, onZoom }) {
  const scene = new THREE.Scene();
  const SKYH = new THREE.Color('#dff5ff');
  scene.background = SKYH.clone();
  scene.fog = new THREE.Fog(0xdff5ff, 34, 90);
  const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .1, 260);
  const clock = new THREE.Clock();
  const anim = []; // per-frame callbacks
  const solids = []; // xz AABBs {x0,x1,z0,z1} or circles
  const occl = []; // meshes the camera must not pass through
  const solid = (x, z, w, d) => solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  const circ = (x, z, r) => solids.push({ circle: true, x, z, r });
  const sgeo = new THREE.PlaneGeometry(1, 1);

  // sky dome + sun + light
  const SUN = new THREE.Vector3(.45, .55, -.7);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, vertexShader: skyVS, fragmentShader: skyFS,
    uniforms: { uTop: { value: new THREE.Color('#5ec4ff') }, uHor: { value: new THREE.Color('#dff5ff') }, uSun: { value: new THREE.Color('#fff3b0') }, uSunDir: { value: SUN } } }));
  scene.add(sky);
  scene.add(new THREE.HemisphereLight(0xcfefff, 0x7bc86a, 1.5));
  const sunL = new THREE.DirectionalLight(0xfff1d6, 2.2); sunL.position.copy(SUN).multiplyScalar(30); scene.add(sunL);

  // island: flat meadow in the play area, gentle low-poly hills outside, cliffs and a sea around
  const RAD = 36;
  const gg = new THREE.CircleGeometry(RAD, 64, 0, Math.PI * 2); { // add rings of vertices for hills
    const g2 = new THREE.PlaneGeometry(RAD * 2, RAD * 2, 48, 48); const p = g2.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), r = Math.hypot(x, y); // plane is XY before rotation
      const edge = THREE.MathUtils.smoothstep(r, 20, 30); const hill = (Math.sin(x * .35) * Math.cos(y * .3) * .5 + .5) * 3.2 * edge + edge * 1.2;
      const drop = r > RAD - 2 ? -(r - (RAD - 2)) * 2.2 : 0; p.setZ(i, hill + drop); }
    g2.computeVertexNormals(); gg.dispose(); var groundGeo = g2.toNonIndexed(); groundGeo.computeVertexNormals();
  }
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshToonMaterial({ color: '#7fd16b', gradientMap: RAMP })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const cliff = new THREE.Mesh(new THREE.CylinderGeometry(RAD - 1.5, RAD - 4, 6, 40, 1, true), toon('#c99a6b')); cliff.position.y = -3.4; scene.add(cliff);
  const sea = new THREE.Mesh(new THREE.CircleGeometry(220, 48), new THREE.MeshToonMaterial({ color: '#6fd6f2', gradientMap: RAMP })); sea.rotation.x = -Math.PI / 2; sea.position.y = -4.2; scene.add(sea);
  // sandy paths (soft discs) linking the pads
  const pathM = new THREE.MeshBasicMaterial({ color: '#f3e3b5', transparent: true, opacity: .85, depthWrite: false });
  [[0, 2, 5.5], [0, -4, 3], [-5, -1.5, 2.6], [5, -1.5, 2.6], [5, 6, 2.4], [0, 9, 3]].forEach(([x, z, r]) => { const d = new THREE.Mesh(new THREE.CircleGeometry(r, 28), pathM); d.rotation.x = -Math.PI / 2; d.position.set(x, .01, z); scene.add(d); });

  // trees: low-poly trunks with round foliage clusters (camera occluders + solid trunks)
  const trunkM = toon('#9b6a43'), leafMs = ['#4fb54a', '#6cc85a', '#8bd86b', '#3f9e45'].map(toon);
  const ico = new THREE.IcosahedronGeometry(1, 1), trunkG = new THREE.CylinderGeometry(.28, .4, 1, 7);
  function tree(x, z, s = 1, k = 0) {
    const t = new THREE.Mesh(trunkG, trunkM); t.scale.set(s, 2.6 * s, s); t.position.set(x, 1.3 * s, z); scene.add(t); occl.push(t);
    [[0, 3.2, 0, 1.6], [-.8, 2.7, .3, 1.1], [.85, 2.8, -.2, 1.15], [.1, 4.1, .1, 1.05]].forEach(([dx, dy, dz, r], i) => {
      const f = new THREE.Mesh(ico, leafMs[(k + i) % 4]); f.position.set(x + dx * s, dy * s, z + dz * s); f.scale.setScalar(r * s); f.rotation.set(k, i, 0); scene.add(f); occl.push(f); });
    circ(x, z, .55 * s);
  }
  const trees = [[-19, -13, 1.3], [-23, -3, 1.5], [-19, 7, 1.2], [-22, 16, 1.4], [19, -13, 1.35], [23, -2, 1.2], [19, 9, 1.5], [22, 18, 1.3],
    [-10, -20, 1.4], [10, -20, 1.3], [0, -25, 1.6], [-16, -22, 1.2], [16, -23, 1.5], [-10, 23, 1.3], [10, 24, 1.4], [0, 28, 1.5], [-14.5, -9, .9], [14.8, 14.5, .95], [-14.8, 2.5, .85]];
  trees.forEach(([x, z, s], k) => tree(x, z, s, k));
  // rocks
  const rockG = new THREE.DodecahedronGeometry(1, 0), rockM = toon('#b7c3cc');
  [[-12.5, -6, 1.1], [13.2, 3, .9], [-6, 16, .8], [12, -9, .7], [3.5, 15.5, .6], [-15, 13.5, 1.2]].forEach(([x, z, s], i) => {
    const r = new THREE.Mesh(rockG, rockM); r.position.set(x, s * .45, z); r.scale.set(s * 1.2, s * .8, s); r.rotation.set(i, i * 2, 0); scene.add(r); occl.push(r); circ(x, z, s * 1.05); });
  // pond with lily pads
  const pond = new THREE.Mesh(new THREE.CircleGeometry(2.8, 32), new THREE.MeshToonMaterial({ color: '#58c9ee', gradientMap: RAMP })); pond.rotation.x = -Math.PI / 2; pond.position.set(-10.5, .03, 13); scene.add(pond);
  const rim = new THREE.Mesh(new THREE.RingGeometry(2.75, 3.2, 32), toon('#d8c79c')); rim.rotation.x = -Math.PI / 2; rim.position.set(-10.5, .025, 13); scene.add(rim);
  circ(-10.5, 13, 2.9);
  const lily = toon('#3f9e45'); [[-11.3, 12.4], [-9.6, 13.8], [-10.2, 11.9]].forEach(([x, z], i) => { const l = new THREE.Mesh(new THREE.CircleGeometry(.4, 10, .4, 5.6), lily); l.rotation.x = -Math.PI / 2; l.position.set(x, .05, z); scene.add(l);
    anim.push(t => { l.rotation.z = Math.sin(t * .5 + i) * .2; }); });
  // flowers + grass tufts (instanced, cheap)
  {
    const N = mobile ? 160 : 320, fG = new THREE.IcosahedronGeometry(.12, 0), tG = new THREE.ConeGeometry(.08, .35, 4);
    const fl = new THREE.InstancedMesh(fG, new THREE.MeshToonMaterial({ gradientMap: RAMP }), N), tu = new THREE.InstancedMesh(tG, toon('#4fb54a'), N);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(), cols = ['#ffffff', '#ffd447', '#ff9ccb', '#9fd8ff'];
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) { let x, z; do { x = (rnd() - .5) * 34; z = (rnd() - .5) * 34 + 3; } while (Math.hypot(x, z - 1) < 6 || Math.hypot(x + 10.5, z - 13) < 3.3);
      m.compose(new THREE.Vector3(x, .18, z), q, new THREE.Vector3(1, 1, 1)); fl.setMatrixAt(i, m); fl.setColorAt(i, c.set(cols[i % 4]));
      m.compose(new THREE.Vector3(x + .5, .17, z - .3), q, new THREE.Vector3(1, 1 + rnd(), 1)); tu.setMatrixAt(i, m); }
    scene.add(fl, tu);
  }
  // clouds: puffy white spheres that drift
  const cloudM = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: RAMP, fog: false });
  [[-30, 22, -40], [25, 26, -50], [0, 30, -70], [-50, 20, 10], [45, 24, 20], [10, 28, 60]].forEach(([x, y, z], i) => {
    const c = new THREE.Group(); [[0, 0, 0, 4], [3.5, -.6, .5, 3], [-3.6, -.8, 0, 2.8], [1.2, 1.8, 0, 2.6]].forEach(([dx, dy, dz, r]) => { const s = new THREE.Mesh(ico, cloudM); s.position.set(dx, dy, dz); s.scale.set(r, r * .75, r); c.add(s); });
    c.position.set(x, y, z); scene.add(c); anim.push(t => { c.position.x = x + Math.sin(t * .03 + i) * 6; });
  });

  // signboard (works): a wooden board on two posts with a little roof
  const BW = 11, BH = BW * 9 / 16;
  const boardMat = new THREE.ShaderMaterial({ vertexShader: uvVS, fragmentShader: boardFS, toneMapped: false,
    uniforms: { tA: { value: null }, tB: { value: null }, aA: { value: 1.6 }, aB: { value: 1.6 }, uProg: { value: 0 }, uTime: { value: 0 }, uAsp: { value: BW / BH } } });
  const by = BH / 2 + 1.7;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), boardMat); board.position.set(0, by, -12.2); scene.add(board);
  const wood = toon('#b9814f'), woodD = toon('#8d5a33');
  const boardBack = new THREE.Mesh(new THREE.BoxGeometry(BW + 1, BH + 1, .5), wood); boardBack.position.set(0, by, -12.5); scene.add(boardBack); occl.push(boardBack);
  [-1, 1].forEach(sd => { const p = new THREE.Mesh(new THREE.BoxGeometry(.6, by + BH / 2 + 1.4, .6), woodD); p.position.set(sd * (BW / 2 + .2), (by + BH / 2 + 1.4) / 2, -12.4); scene.add(p); occl.push(p); });
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, BW + 2.4, 3, 1), toon('#ff8f6b')); roof.rotation.z = Math.PI / 2; roof.rotation.x = Math.PI; roof.scale.set(1, 1, .9); roof.position.set(0, by + BH / 2 + 1.25, -12.45); scene.add(roof);
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
    const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.16, .16, 40), toon('#e9f4f2')); base.position.set(x, .06, z); scene.add(base);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.1, r * 2.1), new THREE.ShaderMaterial({ uniforms: u, vertexShader: uvVS, fragmentShader: padFS, transparent: true, depthWrite: false, toneMapped: false }));
    p.rotation.x = -Math.PI / 2; p.position.set(x, .16, z); scene.add(p);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(r * .98, r * .98, 3, 40, 1, true), new THREE.ShaderMaterial({ uniforms: u, vertexShader: uvVS, fragmentShader: beamFS, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
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
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, .3), wood); b.position.y = 2.2; g.add(b); occl.push(b);
    [-1, 1].forEach(sd => { const p = new THREE.Mesh(new THREE.BoxGeometry(.25, 3.6, .25), woodD); p.position.set(sd * 1.05, 1.8, -.05); g.add(p); });
    const paper = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.35), new THREE.MeshBasicMaterial({ map: paperTex('About', ['PHP / Laravel', '5+ years', 'Kuala Lumpur', 'Open to roles']), toneMapped: false })); paper.position.set(0, 2.2, .16); g.add(paper);
    const bx = Math.abs(Math.cos(ry)) > .5 ? [2.6, .9] : [.9, 2.6]; solid(x, z, bx[0], bx[1]);
  }
  function postbox(x, z, ry) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.14, .16, 1.6, 8), woodD); post.position.y = .8; g.add(post);
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.1), toon(CY)); box.position.y = 2.05; g.add(box); occl.push(box);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.6, 16, 1, false, 0, Math.PI), toon(CY)); top.rotation.z = Math.PI / 2; top.rotation.y = Math.PI / 2; top.position.y = 2.6; g.add(top);
    const slot = new THREE.Mesh(new THREE.PlaneGeometry(.8, .12), new THREE.MeshBasicMaterial({ color: 0x12324a })); slot.position.set(0, 2.25, .56); g.add(slot);
    const env = new THREE.Mesh(new THREE.PlaneGeometry(.9, .55), new THREE.MeshBasicMaterial({ map: pillLabel('MAIL', '#ffffff'), transparent: true })); env.position.set(0, 1.85, .56); g.add(env);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(.08, .5, .3), toon('#ff8f6b')); flag.position.set(.84, 2.5, .2); g.add(flag);
    anim.push(t => { flag.rotation.x = Math.sin(t * 2) * .25; });
    solid(x, z, 1.4, 1.4);
  }
  notice(-11.2, -1.5, Math.PI / 2);
  postbox(11.2, -1.5, -Math.PI / 2);
  // colour stand: a tree-stump counter with swatch balls on top
  const sm = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.45, 1.6, 12), wood); sm.position.set(7.5, .8, 11.2); scene.add(sm); occl.push(sm); circ(7.5, 11.2, 1.45);
  const smTop = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, .08, 12), toon('#f3d8a8')); smTop.position.set(7.5, 1.62, 11.2); scene.add(smTop);
  SKINS.forEach((s, i) => { const a = i / SKINS.length * Math.PI * 2; const b = new THREE.Mesh(new THREE.SphereGeometry(.26, 14, 10), toon(s.c)); b.position.set(7.5 + Math.cos(a) * .75, 1.92, 11.2 + Math.sin(a) * .75); scene.add(b);
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

  // floating pollen / sparkles
  const D = 260, dp = new Float32Array(D * 3);
  for (let i = 0; i < D; i++) { dp[i * 3] = (Math.random() - .5) * 44; dp[i * 3 + 1] = .4 + Math.random() * 7; dp[i * 3 + 2] = (Math.random() - .5) * 44; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: new THREE.Color('#fff7c2'), size: .09, transparent: true, opacity: .9, depthWrite: false }));
  scene.add(dust); anim.push(t => { dust.rotation.y = t * .01; dust.position.y = Math.sin(t * .4) * .3; });

  /* ---------- player ---------- */
  let skin = 0;
  const player = makeCreature(SKINS[0].c); player.position.set(0, 0, 5); player.rotation.y = Math.PI; scene.add(player);
  function setSkin(i) { skin = (i + SKINS.length) % SKINS.length; const c = new THREE.Color(SKINS[skin].c); const u = player.userData;
    player.traverse(o => { if (o.material === u.mat) o.material.color.copy(c); }); u.mat.color.copy(c); return SKINS[skin]; }
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
  function render(interactive) { if (interactive) update(); else { clock.getDelta(); for (const f of anim) f(t += .016, .016); } renderer.render(scene, camera); }

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
    npcCount: npcLines.length, skinCount: SKINS.length,
    dispose() { clearInterval(boardTimer); },
  };
}
