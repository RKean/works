import * as THREE from 'three';
import { WORKS, PROFILE } from './data.js';
import { createExplore, SKINS } from './explore.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const IS_TOUCH = matchMedia('(pointer:coarse)').matches && navigator.maxTouchPoints > 0;
const isMobile = () => innerWidth <= 760;

let current = 0, imgIndex = 0, view = 'explore', explore = null;

/* ================= preloader ================= */
const preNum = $('#pre-num'), preFill = $('#pre-fill');
let preTarget = 0, preShown = 0;
function prePump() {
  preShown += (preTarget - preShown) * 0.12 + 0.2;
  if (preShown > preTarget) preShown = preTarget;
  preNum.textContent = String(Math.floor(preShown)).padStart(3, '0');
  preFill.style.width = preShown + '%';
  if (preShown < 100) requestAnimationFrame(prePump);
  else setTimeout(() => document.body.classList.remove('is-loading'), 350);
}
requestAnimationFrame(prePump);

/* ================= WebGL ================= */
const canvas = $('#gl');
let renderer, gl = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); gl = renderer.getContext(); }
catch (e) { document.documentElement.classList.add('no-gl'); }

const RED = new THREE.Color('#ff0033');
const textures = new Map();
const loader = new THREE.TextureLoader();

function placeholderTexture(w) {
  // Typographic card for confidential projects without screenshots (generated, no external assets).
  const c = document.createElement('canvas'); c.width = 1600; c.height = 1000;
  const x = c.getContext('2d');
  x.fillStyle = '#050001'; x.fillRect(0, 0, 1600, 1000);
  x.strokeStyle = 'rgba(255,0,51,.16)'; x.lineWidth = 1;
  for (let i = 0; i <= 1600; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 1000); x.stroke(); }
  for (let i = 0; i <= 1000; i += 40) { x.beginPath(); x.moveTo(0, i); x.lineTo(1600, i); x.stroke(); }
  x.fillStyle = '#ff0033';
  x.font = '600 26px "JetBrains Mono", monospace';
  x.fillText(`${pad(WORKS.indexOf(w) + 1)} / ${pad(WORKS.length)}`, 90, 120);
  x.fillText((w.images.length ? '' : w.note.replace(/\.$/, '')).toUpperCase(), 90, 900);
  x.textAlign = 'right'; x.fillText(w.sector.toUpperCase(), 1510, 120); x.textAlign = 'left';
  x.font = '900 128px Archivo, sans-serif';
  const words = w.title.toUpperCase().split(' '); let line = '', y = 360; const lines = [];
  for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (x.measureText(t).width > 1400) { lines.push(line); line = wd; } else line = t; }
  lines.push(line);
  lines.forEach((l, i) => x.fillText(l, 84, y + i * 124));
  x.font = '400 30px "JetBrains Mono", monospace'; x.fillStyle = 'rgba(255,255,255,.75)';
  x.fillText(w.stack.join('  ·  '), 90, 840);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.aspect = 1.6; return t;
}
function getTexture(w, i) {
  const key = w.images.length ? w.images[i].src : 'ph:' + w.slug;
  if (textures.has(key)) return Promise.resolve(textures.get(key));
  if (!w.images.length) { const t = placeholderTexture(w); textures.set(key, t); return Promise.resolve(t); }
  return new Promise(res => loader.load(key, t => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.aspect = t.image.width / t.image.height;
    textures.set(key, t); res(t);
  }, undefined, () => { const t = placeholderTexture(w); textures.set(key, t); res(t); }));
}

let scene, camera, screen, screenMat, floorMat, dust, frame, glow, clock;
const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2();
let kick = 0, hoverScreen = 0, hoverTarget = 0;
const raycaster = new THREE.Raycaster();
const SCREEN_W = 16, SCREEN_H = 10;

const screenVS = `
varying vec2 vUv; uniform float uTime; uniform float uBend;
void main(){ vUv = uv; vec3 p = position; p.z -= (p.x*p.x) * uBend; p.y += sin(uTime*.6)*.06;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.); }`;
const screenFS = `
precision highp float; varying vec2 vUv;
uniform sampler2D tA, tB; uniform float aA, aB, uProg, uTime, uHover, uAsp;
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3,289.1)))*43758.5453); }
vec2 fit(vec2 uv, float a){ vec2 s = a > uAsp ? vec2(1., uAsp/a) : vec2(a/uAsp, 1.); return (uv-.5)/s + .5; }
vec4 samp(sampler2D t, vec2 uv, float a, float shift){
  vec2 f = fit(uv, a); float inside = step(0.,f.x)*step(f.x,1.)*step(0.,f.y)*step(f.y,1.);
  vec3 c; c.r = texture2D(t, f + vec2(shift,0.)).r; c.g = texture2D(t, f).g; c.b = texture2D(t, f - vec2(shift,0.)).b;
  return vec4(c, inside); }
void main(){
  vec2 uv = vUv; uv = (uv-.5)*(1. - uHover*.03) + .5;
  float tr = sin(uProg*3.14159);
  float row = floor(uv.y*60.); uv.x += (hash(vec2(row, floor(uTime*20.)))-.5) * tr * .06;
  float sh = .0015 + tr*.012 + uHover*.002;
  vec4 A = samp(tA, uv, aA, sh), B = samp(tB, uv, aB, sh);
  float n = hash(floor(vUv*vec2(32.,20.)));
  float m = smoothstep(n-.08, n+.08, uProg*1.16-.08);
  vec4 C = mix(A, B, m);
  vec2 g = abs(fract(vUv*vec2(32.,20.))-.5);
  float grid = smoothstep(.48,.5,max(g.x,g.y));
  vec3 bg = vec3(.035,0.,.008) + vec3(.35,0.,.06)*grid*.35;
  vec3 col = mix(bg, C.rgb, C.a);
  float edge = (1.-smoothstep(0.,.08,abs(m-.5)))*step(.01,uProg)*step(uProg,.99);
  col += vec3(1.,0.,.2)*edge*1.6;
  col *= .9 + .1*sin(vUv.y*900.+uTime*8.);
  float v = smoothstep(.95,.35,length((vUv-.5)*vec2(1.1,1.3)));
  col *= mix(.55,1.,v);
  col = mix(col, col*vec3(1.,.55,.6), .18);
  gl_FragColor = vec4(col,1.);
  #include <colorspace_fragment>
}`;

function initGL() {
  if (!renderer) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.035);
  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300);
  clock = new THREE.Clock();

  // big curved screen
  const geo = new THREE.PlaneGeometry(SCREEN_W, SCREEN_H, 80, 1);
  screenMat = new THREE.ShaderMaterial({
    vertexShader: screenVS, fragmentShader: screenFS,
    uniforms: { tA: { value: null }, tB: { value: null }, aA: { value: 1.6 }, aB: { value: 1.6 }, uProg: { value: 0 }, uTime: { value: 0 }, uHover: { value: 0 }, uAsp: { value: SCREEN_W / SCREEN_H }, uBend: { value: 0.012 } },
  });
  screen = new THREE.Mesh(geo, screenMat); screen.position.set(0, 1.2, 0); scene.add(screen);

  // frame corners
  const fm = new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: .9 });
  frame = new THREE.Group();
  const hw = SCREEN_W / 2 + .35, hh = SCREEN_H / 2 + .35, L = 1.2;
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sy]) => {
    const z = -(hw * hw) * 0.012;
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(sx * hw, sy * (hh - L), z), new THREE.Vector3(sx * hw, sy * hh, z), new THREE.Vector3(sx * (hw - L), sy * hh, z + .3)]);
    frame.add(new THREE.Line(g, fm));
  });
  frame.position.copy(screen.position); scene.add(frame);

  // glow under screen
  const gc = document.createElement('canvas'); gc.width = gc.height = 256; const gx = gc.getContext('2d');
  const grd = gx.createRadialGradient(128, 128, 0, 128, 128, 128); grd.addColorStop(0, 'rgba(255,0,51,.55)'); grd.addColorStop(1, 'rgba(255,0,51,0)');
  gx.fillStyle = grd; gx.fillRect(0, 0, 256, 256);
  glow = new THREE.Mesh(new THREE.PlaneGeometry(34, 14), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.set(0, -4.4, 1); scene.add(glow);

  // point-field terrain
  const N = 150, S = 1.1, pos = new Float32Array(N * N * 3); let k = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { pos[k++] = (i - N / 2) * S; pos[k++] = 0; pos[k++] = (j - N / 2) * S - 30; }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  floorMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uKick: { value: 0 }, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: `uniform float uTime,uKick,uPR; varying float vA;
      void main(){ vec3 p = position; float d = length(p.xz - vec2(0.,-2.));
        p.y = -4.6 + sin(p.x*.18+uTime*.7)*.45 + cos(p.z*.15+uTime*.5)*.45 + sin(d*.6 - uTime*3.)*uKick*.9*exp(-d*.06);
        vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        gl_PointSize = uPR*(2.2 + uKick*1.5)*(14./-mv.z); vA = clamp(1. - (-mv.z)/70., 0., 1.); }`,
    fragmentShader: `varying float vA; void main(){ vec2 c = gl_PointCoord-.5; if(length(c)>.5) discard; gl_FragColor = vec4(1.,0.,.2, vA*.85); }`,
  });
  scene.add(new THREE.Points(fg, floorMat));

  // floating dust
  const D = 500, dp = new Float32Array(D * 3);
  for (let i = 0; i < D; i++) { dp[i * 3] = (Math.random() - .5) * 60; dp[i * 3 + 1] = Math.random() * 18 - 4; dp[i * 3 + 2] = (Math.random() - .5) * 50 - 5; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: RED, size: .06, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(dust);

  resize();
  addEventListener('resize', resize);
  try {
    explore = createExplore({ renderer, WORKS, PROFILE, getTexture, mobile: IS_TOUCH || isMobile(), onZone, onAction, onTalk });
    addEventListener('resize', () => explore.resize());
    const sk = +localStorage.getItem('rk_skin') || 0; if (sk) explore.setSkin(sk);
  } catch (e) { console.warn('explore disabled', e); explore = null; }
  renderer.setAnimationLoop(tick);
}

function resize() {
  if (!renderer) return;
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  const portrait = innerHeight > innerWidth;
  camera.fov = portrait ? 70 : 52;
  camera.updateProjectionMatrix();
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // distance so the screen fills ~86% (portrait) / ~52% (landscape) of the width, but never too tall
  const byW = (SCREEN_W / 2 + .4) / (tv * camera.aspect) / (portrait ? .94 : .56);
  const byH = (SCREEN_H / 2) / tv / .62;
  camera.userData.dist = Math.max(byW, portrait ? 0 : byH);
  camera.userData.y = portrait ? 2.2 : 1.6;
  // look below the screen on portrait so it sits in the upper half, above the title block
  camera.userData.lookY = portrait ? -(tv * camera.userData.dist) * .38 : -.9;
  camera.userData.lookX = portrait ? 0 : -1.2;
}

let last = performance.now(), fpsAcc = 0, fpsN = 0, frameMs = 0;
const statusEl = $('#status');
function tick() {
  const t = clock.getElapsedTime(), now = performance.now(), dt = now - last; last = now;
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 500) { const fps = Math.round(1000 / (fpsAcc / fpsN)); statusEl.textContent = `Status: OPEN TO ROLES, Engine: WebGL${renderer.capabilities.isWebGL2 ? '2' : ''}, Frame: ${frameMs.toFixed(1)} ms, ${fps} FPS`; fpsAcc = 0; fpsN = 0; }
  const t0 = performance.now();
  mouseS.lerp(mouse, .05);
  kick += (0 - kick) * .03; hoverScreen += (hoverTarget - hoverScreen) * .1;
  const d = camera.userData.dist;
  camera.position.set(camera.userData.lookX + mouseS.x * 2.2 + Math.sin(t * .3) * .3, camera.userData.y + mouseS.y * 1.1 + Math.cos(t * .25) * .2, d - kick * 1.6 - hoverScreen * .8);
  camera.lookAt(camera.userData.lookX + mouseS.x * .8, screen.position.y + camera.userData.lookY, 0);
  screen.rotation.y = -mouseS.x * .06; frame.rotation.y = screen.rotation.y;
  screenMat.uniforms.uTime.value = t; screenMat.uniforms.uHover.value = hoverScreen;
  floorMat.uniforms.uTime.value = t; floorMat.uniforms.uKick.value = kick;
  dust.rotation.y = t * .01; dust.position.y = Math.sin(t * .2) * .4;
  if (view === 'works' && !IS_TOUCH) {
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObject(screen).length > 0 && !document.body.classList.contains('info-open') && !overUI;
    if (hit !== (hoverTarget === 1)) { hoverTarget = hit ? 1 : 0; cursorState(hit, hit ? 'VIEW DETAILS' : ''); }
  }
  if (view === 'works' || !explore) renderer.render(scene, camera);
  else explore.render(view === 'explore' && !document.hidden);
  frameMs = performance.now() - t0;
}

/* screen transitions */
let tween = null;
function showOnScreen(w, i, immediate) {
  const fallbackImg = $('#fallback img');
  if (!renderer) { fallbackImg.src = w.images.length ? w.images[i].src : ''; fallbackImg.style.display = w.images.length ? '' : 'none'; return Promise.resolve(); }
  return getTexture(w, i).then(tex => {
    const u = screenMat.uniforms;
    if (immediate || !u.tA.value) { u.tA.value = u.tB.value = tex; u.aA.value = u.aB.value = tex.userData.aspect; u.uProg.value = 0; return; }
    if (tween) { cancelAnimationFrame(tween.raf); u.tA.value = u.tB.value; u.aA.value = u.aB.value; }
    u.tB.value = tex; u.aB.value = tex.userData.aspect; u.uProg.value = 0;
    const start = performance.now(), dur = 1100;
    tween = {};
    const step = () => {
      const p = Math.min(1, (performance.now() - start) / dur);
      u.uProg.value = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      if (p < 1) tween.raf = requestAnimationFrame(step);
      else { u.tA.value = tex; u.aA.value = tex.userData.aspect; u.uProg.value = 0; tween = null; }
    };
    tween.raf = requestAnimationFrame(step);
  });
}

/* ================= UI: works ================= */
const meta = $('.work-meta');
const splitWords = s => s.split(' ').map((w, i) => `<span class="split"><span style="transition-delay:${i * 45}ms">${esc(w)}</span></span>`).join(' ');
function renderMeta() {
  const w = WORKS[current];
  meta.classList.remove('in');
  $('#w-idx').textContent = pad(current + 1);
  $('#w-tag').textContent = w.tag;
  $('#w-title').innerHTML = splitWords(w.title.toUpperCase());
  $('#w-sub').textContent = `${w.sector} · ${w.year}`;
  updateCaption();
  requestAnimationFrame(() => requestAnimationFrame(() => meta.classList.add('in')));
  $$('.bar-item').forEach((b, i) => { b.classList.toggle('active', i === current); b.setAttribute('aria-selected', i === current); });
}
function updateCaption() {
  const w = WORKS[current];
  $('#w-caption').textContent = w.images.length ? `${pad(imgIndex + 1)}/${pad(w.images.length)} — ${w.images[imgIndex].caption}` : w.note;
}
let cycleTimer = null;
function startCycle() {
  clearInterval(cycleTimer);
  cycleTimer = setInterval(() => {
    const w = WORKS[current];
    if (view !== 'works' || w.images.length < 2 || document.hidden) return;
    imgIndex = (imgIndex + 1) % w.images.length; showOnScreen(w, imgIndex); updateCaption(); syncGallery();
  }, 4200);
}
function go(n, opts = {}) {
  const next = (n + WORKS.length) % WORKS.length;
  if (next === current && !opts.force) return;
  current = next; imgIndex = 0; kick = 1;
  renderMeta(); showOnScreen(WORKS[current], 0, opts.immediate); startCycle();
  if (document.body.classList.contains('info-open')) fillInfo();
  preloadAround();
  if (!opts.noHash && view === 'works') history.replaceState(null, '', '#works/' + WORKS[current].slug);
}
function preloadAround() { [1, -1].forEach(d => { const w = WORKS[(current + d + WORKS.length) % WORKS.length]; if (renderer) getTexture(w, 0); }); }

function buildBar() {
  $('#w-total').textContent = pad(WORKS.length);
  $('#bar').innerHTML = WORKS.map((w, i) => `<button class="bar-item" role="tab" aria-label="${esc(w.title)}" data-i="${i}"><span class="bar-num">${pad(i + 1)}</span><span class="bar-tip">${esc(w.title)}</span></button>`).join('');
  $$('.bar-item').forEach(b => b.addEventListener('click', () => go(+b.dataset.i)));
}

/* ================= info panel ================= */
function fillInfo() {
  const w = WORKS[current];
  $('#i-count').textContent = `${pad(current + 1)} / ${pad(WORKS.length)}`;
  $('#i-tag').textContent = w.tag;
  $('#i-title').textContent = w.title;
  $('#i-sub').textContent = `${w.sector} · ${w.year}`;
  $('#i-desc').textContent = w.desc;
  $('#i-points').innerHTML = w.points.map(p => `<li>${esc(p)}</li>`).join('');
  $('#i-stack').innerHTML = w.stack.map(s => `<span class="chip">${esc(s)}</span>`).join('');
  $('#i-gallery').innerHTML = w.images.map((im, i) => `<button data-i="${i}" aria-label="${esc(im.caption)}"><img loading="lazy" src="${im.src}" alt="${esc(im.caption)}"></button>`).join('');
  $('#i-note').textContent = w.note;
  $$('#i-gallery button').forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i; imgIndex = i; showOnScreen(w, i); updateCaption(); syncGallery(); openLightbox(w.images[i]);
  }));
  syncGallery();
  $('#info').scrollTop = 0;
}
function syncGallery() { $$('#i-gallery button').forEach((b, i) => b.classList.toggle('cur', i === imgIndex)); }
function openInfo() { fillInfo(); document.body.classList.add('info-open'); $('#info').setAttribute('aria-hidden', 'false'); cursorState(false); }
function closeInfo() { document.body.classList.remove('info-open'); $('#info').setAttribute('aria-hidden', 'true'); }

const lb = $('#lightbox');
function openLightbox(im) { $('img', lb).src = im.src; $('img', lb).alt = im.caption; $('figcaption', lb).textContent = im.caption; lb.classList.add('on'); lb.setAttribute('aria-hidden', 'false'); }
function closeLightbox() { lb.classList.remove('on'); lb.setAttribute('aria-hidden', 'true'); }
lb.addEventListener('click', closeLightbox);

/* ================= index ================= */
function buildIndex() {
  $('#index-list').innerHTML = WORKS.map((w, i) => `<li><a class="index-row" href="#works/${w.slug}" data-i="${i}">
    <span class="ir-n">${pad(i + 1)}</span><span class="ir-t">${esc(w.title)}</span><span class="ir-s">${esc(w.sector)}</span><span class="ir-y">${esc(w.year)}</span><span class="ir-a">→</span></a></li>`).join('');
  const fl = $('#index-float'), fimg = $('img', fl);
  let fx = 0, fy = 0, tx = 0, ty = 0, on = false;
  $$('.index-row').forEach(r => {
    r.addEventListener('mouseenter', () => { const w = WORKS[+r.dataset.i]; if (w.images.length) { fimg.src = w.images[0].src; fl.classList.add('on'); on = true; } else { fl.classList.remove('on'); on = false; } });
    r.addEventListener('mouseleave', () => { fl.classList.remove('on'); on = false; });
  });
  addEventListener('mousemove', e => { tx = e.clientX + 200; ty = e.clientY; });
  (function loop() { fx += (tx - fx) * .12; fy += (ty - fy) * .12; if (on) fl.style.left = fx + 'px', fl.style.top = fy + 'px'; requestAnimationFrame(loop); })();
}

/* ================= about ================= */
function buildAbout() {
  const P = PROFILE;
  $('#about-text').innerHTML = `<p>${esc(P.intro)}</p>` + P.about.map(p => `<p>${esc(p)}</p>`).join('');
  $('#facts').innerHTML = P.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  $('#links').innerHTML = `<a class="bracket" href="mailto:${P.email}">[ EMAIL ] ${esc(P.email)}</a><a class="bracket" href="${P.phoneHref}">[ PHONE ] ${esc(P.phone)}</a>`;
  $('#stats').innerHTML = P.stats.map(([b, s]) => `<div class="stat"><b data-count="${esc(b)}">${esc(b)}</b><span>${esc(s)}</span></div>`).join('');
  $('#skills').innerHTML = Object.entries(P.skills).map(([k, arr]) => `<div><h4>${esc(k)}</h4><div class="chips">${arr.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div></div>`).join('');
  $('#exp').innerHTML = P.experience.map(e => `<li><div class="when">${esc(e.when)}</div><div><h4>${esc(e.role)}</h4><p class="where">${esc(e.where)}</p><ul>${e.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div></li>`).join('');
}

/* ================= navigation ================= */
const pillBg = $('.pill-bg');
function movePill() {
  const a = $(`.pill-nav a[data-nav="${view === 'index' ? 'works' : view}"]`), nav = $('.pill-nav');
  const r = a.getBoundingClientRect(), n = nav.getBoundingClientRect();
  pillBg.style.width = r.width + 'px'; pillBg.style.transform = `translateX(${r.left - n.left}px)`;
  $$('.pill-nav a').forEach(x => x.classList.toggle('active', x === a));
}
function setView(v) {
  if (v === 'explore' && !explore) v = 'works';
  view = v; document.body.dataset.view = v; movePill();
  if (explore) explore.setActive(v === 'explore');
  markSection(v === 'index' ? 'works' : v);
  if (v !== 'works') closeInfo();
  const el = $(`#${v}-view`); if (el && v !== 'works') el.scrollTop = 0;
  hoverTarget = 0; cursorState(false);
}
function route() {
  const h = location.hash.replace('#', '');
  if (h.startsWith('works/')) { const i = WORKS.findIndex(w => w.slug === h.slice(6)); setView('works'); if (i >= 0) go(i, { noHash: true, force: i !== current }); return; }
  setView(['index', 'about', 'works'].includes(h) ? h : 'explore');
}
addEventListener('hashchange', route);

/* ================= input ================= */
let overUI = false;
const flash = sel => { const k = $(sel); if (!k) return; k.classList.add('flash'); setTimeout(() => k.classList.remove('flash'), 160); };
addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (lb.classList.contains('on')) return closeLightbox(); if (document.body.classList.contains('info-open')) return closeInfo(); if (view === 'index') { location.hash = 'works'; return; } if (view === 'about' || view === 'works') location.hash = 'explore'; return; }
  if (view === 'explore') return exploreKey(e, true);
  if (view !== 'works' || lb.classList.contains('on')) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); flash(e.key === 'ArrowRight' ? '.k-r' : '.k-dn'); go(current + 1); }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); flash(e.key === 'ArrowLeft' ? '.k-l' : '.k-up'); go(current - 1); }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flash('.k-enter'); document.body.classList.contains('info-open') ? closeInfo() : openInfo(); }
});
let wheelLock = 0;
addEventListener('wheel', e => {
  if (view !== 'works' || document.body.classList.contains('info-open') || lb.classList.contains('on')) return;
  const now = performance.now(); if (now - wheelLock < 700 || Math.abs(e.deltaY) < 12) return;
  wheelLock = now; go(current + (e.deltaY > 0 ? 1 : -1));
}, { passive: true });
let ty0 = null, tx0 = null;
addEventListener('touchstart', e => { if (view !== 'works' || document.body.classList.contains('info-open')) return; ty0 = e.touches[0].clientY; tx0 = e.touches[0].clientX; }, { passive: true });
addEventListener('touchend', e => {
  if (ty0 === null) return;
  const dy = e.changedTouches[0].clientY - ty0, dx = e.changedTouches[0].clientX - tx0; ty0 = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 40) return;
  if (Math.abs(dy) > Math.abs(dx)) go(current + (dy < 0 ? 1 : -1)); else go(current + (dx < 0 ? 1 : -1));
}, { passive: true });
canvas.addEventListener('click', () => { if (view === 'works' && hoverTarget) openInfo(); });
if (IS_TOUCH) canvas.addEventListener('click', () => { if (view === 'works') openInfo(); });

$('#prev').addEventListener('click', () => go(current - 1));
$('#next').addEventListener('click', () => go(current + 1));
$('#w-open').addEventListener('click', openInfo);
$('#i-close').addEventListener('click', closeInfo);
$('#i-prev').addEventListener('click', () => go(current - 1));
$('#i-next').addEventListener('click', () => go(current + 1));
$('#index-list').addEventListener('click', e => { const r = e.target.closest('.index-row'); if (!r) return; });

/* ================= cursor ================= */
const cur = $('#cursor'), dot = $('.c-dot', cur), ring = $('.c-ring', cur), lab = $('.c-label', cur);
let cx = innerWidth / 2, cy = innerHeight / 2, rx = cx, ry = cy;
function cursorState(on, label = '') { cur.classList.toggle('hover', !!on); cur.classList.toggle('labelled', !!label); if (label) lab.textContent = label; }
addEventListener('mousemove', e => {
  cx = e.clientX; cy = e.clientY;
  mouse.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  if (explore) explore.setMouse(mouse.x, mouse.y);
  const t = e.target.closest('a,button');
  overUI = !!e.target.closest('a,button,#info,.work-meta,#works-bar,.title-container,.pill-nav');
  if (t) cursorState(true, t.classList.contains('index-row') ? 'OPEN' : '');
  else if (!hoverTarget) cursorState(false);
});
addEventListener('keyup', e => { if (explore) explore.key(e.key, false); });
addEventListener('blur', () => explore && explore.setActive(view === 'explore'));
addEventListener('mousedown', () => cur.classList.add('down'));
addEventListener('mouseup', () => cur.classList.remove('down'));
(function cloop() { rx += (cx - rx) * .18; ry += (cy - ry) * .18; dot.style.transform = `translate(${cx}px,${cy}px)`; ring.style.transform = `translate(${rx}px,${ry}px)`; lab.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(cloop); })();

/* ================= boot ================= */
async function boot() {
  buildBar(); buildIndex(); buildAbout();
  preTarget = 25;
  try { await Promise.race([Promise.all([document.fonts.load('900 128px Archivo'), document.fonts.load('600 26px "JetBrains Mono"'), document.fonts.load('400 30px "JetBrains Mono"')]).then(() => document.fonts.ready), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
  preTarget = 45;
  initGL();
  const h = location.hash.replace('#', '');
  const start = h.startsWith('works/') ? Math.max(0, WORKS.findIndex(w => w.slug === h.slice(6))) : 0;
  current = start;
  const firsts = renderer ? WORKS.slice(0, 3).map(w => getTexture(w, 0)) : [];
  let done = 0; firsts.forEach(p => p.then(() => { done++; preTarget = 45 + done / firsts.length * 50; }));
  await Promise.race([Promise.all(firsts), new Promise(r => setTimeout(r, 6000))]);
  await showOnScreen(WORKS[current], 0, true);
  renderMeta(); startCycle(); preloadAround(); renderTasks(); route(); movePill();
  if (view === 'explore') maybeTutorial();
  addEventListener('resize', movePill);
  preTarget = 100;
}
boot();

/* ================= explore UI ================= */
const promptEl = $('#prompt'), promptLabel = $('#prompt-label'), dlg = $('#dialog');
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const tasks = store.get('rk_tasks', { sections: [], friends: 0, skins: [0] });
function markSection(v) { if (!['explore', 'works', 'about'].includes(v) || tasks.sections.includes(v)) return; tasks.sections.push(v); saveTasks(); }
function saveTasks() { store.set('rk_tasks', tasks); renderTasks(); }
let allDoneShown = store.get('rk_done', false);
function renderTasks() {
  const el = $('#tasks'); if (!el) return;
  const nf = explore ? explore.npcCount : 4, ns = SKINS.length;
  const rows = [['Visit all sections', Math.min(3, tasks.sections.length), 3], ['Talk to all my friends', Math.min(nf, tasks.friends), nf], ['Try on all skins', Math.min(ns, tasks.skins.length), ns]];
  el.innerHTML = '<div class="t-h">TASKS / 任務</div>' + rows.map(([t, a, b]) => `<div class="t-row${a >= b ? ' done' : ''}"><i></i><span>${t}</span><b>${a}/${b}</b></div>`).join('');
  if (!allDoneShown && rows.every(([, a, b]) => a >= b)) { allDoneShown = true; store.set('rk_done', true); toast('ALL TASKS DONE · THANKS FOR EXPLORING'); }
}
let toastT = null;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200); }
function onTalk(n) { tasks.friends = Math.max(tasks.friends, n); saveTasks(); tutDone('ring'); }
function showDialog(name, text, links = '') { $('#dlg-name').textContent = name; $('#dlg-text').textContent = text; $('#dlg-links').innerHTML = links; dlg.classList.add('on'); }
function onZone(z) {
  promptEl.classList.remove('on'); dlg.classList.remove('on');
  if (!z) return;
  tutDone('ring');
  if (z.kind === 'npc') return showDialog(z.name, z.text);
  const labels = { works: 'VIEW WORKS', about: 'ABOUT ME', contact: 'SAY HELLO', skin: 'NEW SKIN' };
  promptLabel.textContent = z.id === 'works' ? `VIEW ${z.work.title}` : labels[z.id];
  $('.prompt-key', promptEl).textContent = IS_TOUCH ? 'TAP' : 'E';
  promptEl.classList.add('on');
  if (z.id === 'contact') showDialog('CONTACT', `Email or call: ${PROFILE.email} · ${PROFILE.phone}`, `<a class="bracket" href="mailto:${esc(PROFILE.email)}">[ EMAIL ]</a><a class="bracket" href="${esc(PROFILE.phoneHref)}">[ CALL ]</a>`);
}
function onAction(id, d) {
  if (id === 'works') { location.hash = 'works/' + d.work.slug; return; }
  if (id === 'about') { location.hash = 'about'; return; }
  if (id === 'contact') { location.href = 'mailto:' + PROFILE.email; return; }
  if (id === 'skin') { store.set('rk_skin', d.index); if (!tasks.skins.includes(d.index)) tasks.skins.push(d.index); saveTasks(); toast(`SKIN · ${d.skin.name}`); }
}
const doInteract = () => explore && explore.interact();
promptEl.addEventListener('click', doInteract);
const KEYMAP = { ArrowUp: '.k-up', ArrowDown: '.k-dn', ArrowLeft: '.k-l', ArrowRight: '.k-r', w: '.k-up', s: '.k-dn', a: '.k-l', d: '.k-r' };
function exploreKey(e) {
  if (!explore || e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (KEYMAP[k] || KEYMAP[k.toLowerCase()] || ['z', 'q'].includes(k.toLowerCase())) { e.preventDefault(); explore.key(k, true); flash(KEYMAP[k] || KEYMAP[k.toLowerCase()]); tutDone('move'); }
  else if (k === ' ') { e.preventDefault(); if (!e.repeat) { explore.jump(); flash('.k-space'); tutDone('jump'); } }
  else if (k === 'Enter' || k.toLowerCase() === 'e') { e.preventDefault(); flash('.k-e'); doInteract(); }
}

/* tutorial */
const TUT = () => [
  ['move', IS_TOUCH ? 'DRAG ANYWHERE TO MOVE' : 'USE ◀ ▲ ▼ ▶ OR WASD TO MOVE'],
  ['jump', IS_TOUCH ? 'TAP JUMP TO JUMP' : 'PRESS SPACE TO JUMP'],
  ['ring', 'WALK INTO A GLOWING RING'],
];
let tutOn = false; const tutState = new Set();
function maybeTutorial() {
  if (!explore || store.get('rk_tut', false)) return;
  tutOn = true; document.body.classList.add('tut-on'); drawTut();
}
function drawTut() { $('#tut-steps').innerHTML = TUT().map(([id, t], i) => `<div class="tut-step${tutState.has(id) ? ' done' : ''}"><span class="mono">0${i + 1}</span><b class="bold">${t}</b></div>`).join(''); }
function tutDone(id) { if (!tutOn || tutState.has(id)) return; tutState.add(id); drawTut(); if (tutState.size >= 3) setTimeout(endTut, 900); }
function endTut() { if (!tutOn) return; tutOn = false; store.set('rk_tut', true); document.body.classList.remove('tut-on'); }
$('#tut-skip').addEventListener('click', endTut);

/* touch joystick + jump */
const joyEl = $('#joy'), knob = $('i', joyEl); let joyId = null, jx0 = 0, jy0 = 0;
canvas.addEventListener('touchstart', e => {
  if (view !== 'explore' || !explore || joyId !== null) return;
  const t = e.changedTouches[0]; joyId = t.identifier; jx0 = t.clientX; jy0 = t.clientY;
  joyEl.style.left = jx0 + 'px'; joyEl.style.top = jy0 + 'px'; joyEl.classList.add('on'); knob.style.transform = '';
}, { passive: true });
canvas.addEventListener('touchmove', e => {
  if (joyId === null) return; const t = [...e.changedTouches].find(x => x.identifier === joyId); if (!t) return;
  let dx = t.clientX - jx0, dy = t.clientY - jy0; const L = Math.hypot(dx, dy), M = 46; if (L > M) { dx *= M / L; dy *= M / L; }
  knob.style.transform = `translate(${dx}px,${dy}px)`; explore.setJoy(dx / M, dy / M); if (L > 12) tutDone('move');
}, { passive: true });
const joyEnd = e => { if (joyId === null || ![...e.changedTouches].some(x => x.identifier === joyId)) return; joyId = null; joyEl.classList.remove('on'); explore && explore.setJoy(0, 0); };
canvas.addEventListener('touchend', joyEnd); canvas.addEventListener('touchcancel', joyEnd);
$('#jump-btn').addEventListener('touchstart', e => { e.preventDefault(); explore && explore.jump(); tutDone('jump'); }, { passive: false });
$('#jump-btn').addEventListener('click', () => { explore && explore.jump(); tutDone('jump'); });
