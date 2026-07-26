// cutscene.js — a tiny data-driven cutscene director + the intro "Rescue" story.
// Technique B (2D painted panels): full-screen canvas scenes that cross-fade with a
// slow Ken-Burns zoom + captions. Always skippable. (See CUTSCENES.md.)

let _cs = null, _csCanvas = null, _csCtx = null;
function csEnsureDom() {
  _csCanvas = document.getElementById('cs-canvas');
  _csCtx = _csCanvas.getContext('2d');
  csResize();
  if (!window._csResizeBound) { window._csResizeBound = true; window.addEventListener('resize', csResize); }
}
function csResize() {
  if (!_csCanvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  _csCanvas.width = Math.floor(viewW() * dpr);
  _csCanvas.height = Math.floor(viewH() * dpr);
}
function playCutscene(beats, onDone) {
  csEnsureDom();
  document.getElementById('cutscene').classList.add('show');
  document.body.classList.add('cine');   // the HUD steps out of the shot
  _cs = { beats, onDone, i: 0, t0: performance.now(), done: false };
  requestAnimationFrame(csFrame);
}
function csSetMode(cam) {   // painted-panel mode (opaque canvas) vs camera-cinematic mode (see the 3D behind letterbox bars)
  const cv = document.getElementById('cs-canvas'), ov = document.getElementById('cutscene'), bars = document.getElementById('cs-bars');
  if (cv) cv.style.display = cam ? 'none' : 'block';
  if (ov) ov.style.background = cam ? 'transparent' : '#000';
  if (bars) bars.style.display = cam ? 'block' : 'none';
}
function csFinish() {
  if (!_cs) return;
  const cb = _cs.onDone; _cs.done = true; _cs = null;
  state.cinematic = false; state.cineCam = null; csClearConfetti();
  document.getElementById('cutscene').classList.remove('show');
  document.body.classList.remove('cine');
  csSetMode(false);
  const cap = document.getElementById('cs-caption'); if (cap) cap.style.opacity = 0;
  if (cb) cb();
}
function csSkip() { csFinish(); }
const csEase = q => q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
function csFrame(now) {
  if (!_cs || _cs.done) return;
  const beat = _cs.beats[_cs.i], el = now - _cs.t0;
  const FIN = 550, FOUT = 480, hold = beat.dur || 3200, total = FIN + hold + FOUT;
  const p = Math.min(1, el / total);
  const cam = beat.type === 'cam' && Array.isArray(beat.from) && Array.isArray(beat.to) && Array.isArray(beat.look);
  csSetMode(cam);
  if (cam) {
    const ov = document.getElementById('cutscene'); if (ov) ov.style.background = beat.tint || 'transparent';   // dim the live scene (e.g. the storm during "The Fall")
    state.cinematic = true;
    const q = csEase(p), L = (a, b) => a + (b - a) * q, f = beat.from, tt = beat.to, lk = beat.look, lk2 = beat.look2 || lk;
    state.cineCam = { px: L(f[0], tt[0]), py: L(f[1], tt[1]), pz: L(f[2], tt[2]), lx: L(lk[0], lk2[0]), ly: L(lk[1], lk2[1]), lz: L(lk[2], lk2[2]) };
    if (beat.onFrame && !beat._did) { beat._did = true; beat.onFrame(); }
    csUpdateConfetti();
  } else {
    let alpha = 1;
    if (el < FIN) alpha = el / FIN; else if (el > FIN + hold) alpha = Math.max(0, 1 - (el - FIN - hold) / FOUT);
    csDrawBeat(beat, p, alpha);
  }
  const cap = document.getElementById('cs-caption');
  if (cap) { cap.textContent = beat.caption || ''; cap.style.opacity = (el > FIN * 0.7 && el < FIN + hold + FOUT * 0.3) ? 1 : 0; }
  if (el >= total) { _cs.i++; _cs.t0 = now; if (_cs.i >= _cs.beats.length) { csFinish(); return; } }
  requestAnimationFrame(csFrame);
}

// ── 3D confetti for celebration cinematics ──
const _confetti = [];
function csConfetti(cx, cz, n) {
  const cols = [0xf0c020, 0xe05a5a, 0x5a9ae0, 0x6ad08a, 0xd06ad0, 0xf0904a];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), new THREE.MeshBasicMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide }));
    m.position.set(cx + (Math.random() - 0.5) * 22, 9 + Math.random() * 7, cz + (Math.random() - 0.5) * 22);
    m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    scene.add(m);
    _confetti.push({ mesh: m, vy: -(0.03 + Math.random() * 0.05), spin: (Math.random() - 0.5) * 0.32, sway: Math.random() * 6 });
  }
}
function csUpdateConfetti() {
  for (const p of _confetti) { p.mesh.position.y += p.vy; p.mesh.position.x += Math.sin(p.sway + p.mesh.position.y) * 0.02; p.mesh.rotation.z += p.spin; if (p.mesh.position.y < 0.08) p.mesh.position.y = 0.08; }
}
function csClearConfetti() { _confetti.forEach(p => scene.remove(p.mesh)); _confetti.length = 0; }
function csFlash() { const f = document.getElementById('flash'); if (!f) return; f.style.background = '#fff7d6'; f.classList.add('show'); setTimeout(() => { f.classList.remove('show'); f.style.background = ''; }, 500); }
function csDrawBeat(beat, p, alpha) {
  const c = _csCtx, W = _csCanvas.width, H = _csCanvas.height;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = alpha;
  if (typeof beat.draw !== 'function') {   // malformed beat → a warm backdrop so the caption still reads (never a black void)
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2c2436'); g.addColorStop(1, '#17111d'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.globalAlpha = 1; return;
  }
  c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const scale = Math.max(W / 1000, H / 600) * (1 + p * 0.09);   // slow Ken-Burns zoom
  c.setTransform(scale, 0, 0, scale, (W - 1000 * scale) / 2, (H - 600 * scale) / 2 - p * 10 * (H / 600));
  try { beat.draw(c, 1000, 600, p); } catch (e) { /* never let a draw error black the screen */ }
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = alpha;
  csPolish(c, W, H, p);   // every panel gets the same cinematic finish
  c.globalAlpha = 1;
}
// ── Shared finish: a soft vignette + a whisper of film grain over every painted panel ──
function csPolish(c, W, H, p) {
  const v = c.createRadialGradient(W / 2, H * 0.46, Math.min(W, H) * 0.44, W / 2, H / 2, Math.max(W, H) * 0.74);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.44)');
  c.fillStyle = v; c.fillRect(0, 0, W, H);
  const seed = (p * 883) | 0;                                   // grain drifts frame to frame
  c.save(); c.globalAlpha *= 0.05; c.fillStyle = '#fff';
  for (let i = 0; i < 80; i++) c.fillRect((i * 127 + seed * 53) % W, (i * 211 + seed * 97) % H, 2, 2);
  c.restore();
}

// ── Little painters ──
function csCat(c, x, y, s, glow) {
  const cust = state.catCustom || {};
  const body = cust.body || '#e8c878', accent = cust.accent || '#b88838', eye = cust.eye || '#7cc46a', nose = cust.nose || '#e0788a';
  const now = Date.now();
  c.fillStyle = 'rgba(0,0,0,0.22)';                                              // grounding shadow
  c.beginPath(); c.ellipse(x, y + s * 0.56, s * 0.46, s * 0.09, 0, 0, 7); c.fill();
  const sway = Math.sin(now / 420) * s * 0.07;                                   // tail, gently alive
  c.strokeStyle = accent; c.lineWidth = s * 0.16; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + s * 0.3, y + s * 0.15); c.quadraticCurveTo(x + s * 0.72 + sway, y + s * 0.25, x + s * 0.52 + sway, y - s * 0.32); c.stroke();
  c.fillStyle = body;                                                            // body (sitting)
  c.beginPath(); c.moveTo(x - s * 0.36, y + s * 0.55); c.quadraticCurveTo(x - s * 0.42, y - s * 0.12, x, y - s * 0.16); c.quadraticCurveTo(x + s * 0.42, y - s * 0.12, x + s * 0.36, y + s * 0.55); c.closePath(); c.fill();
  // the cat's OWN coat: soft chest light + patches / tabby stripes from the customiser
  c.fillStyle = 'rgba(255,255,255,0.16)';
  c.beginPath(); c.ellipse(x, y + s * 0.24, s * 0.15, s * 0.26, 0, 0, 7); c.fill();
  const mk = cust.markings;
  if (mk && mk !== 'plain') {
    c.fillStyle = cust.patch1 || accent; c.beginPath(); c.ellipse(x - s * 0.2, y + s * 0.16, s * 0.1, s * 0.14, 0.4, 0, 7); c.fill();
    c.fillStyle = cust.patch2 || accent; c.beginPath(); c.ellipse(x + s * 0.19, y + s * 0.3, s * 0.08, s * 0.12, -0.4, 0, 7); c.fill();
  }
  [-1, 1].forEach(d => {                                                         // front paws
    c.fillStyle = body; c.beginPath(); c.ellipse(x + d * s * 0.16, y + s * 0.52, s * 0.1, s * 0.06, 0, 0, 7); c.fill();
  });
  c.fillStyle = body; c.beginPath(); c.arc(x, y - s * 0.36, s * 0.33, 0, 7); c.fill();   // head
  [-1, 1].forEach(d => {                                                         // ears + rosy inner ears
    c.fillStyle = body; c.beginPath(); c.moveTo(x + d * s * 0.28, y - s * 0.52); c.lineTo(x + d * s * 0.38, y - s * 0.82); c.lineTo(x + d * s * 0.1, y - s * 0.62); c.closePath(); c.fill();
    c.fillStyle = nose; c.globalAlpha *= 0.55; c.beginPath(); c.moveTo(x + d * s * 0.26, y - s * 0.56); c.lineTo(x + d * s * 0.33, y - s * 0.75); c.lineTo(x + d * s * 0.15, y - s * 0.61); c.closePath(); c.fill(); c.globalAlpha /= 0.55;
  });
  if (mk === 'tabby') {                                                          // little forehead stripes
    c.strokeStyle = accent; c.lineWidth = s * 0.028; c.lineCap = 'round';
    [-1, 0, 1].forEach(k => { c.beginPath(); c.moveTo(x + k * s * 0.07, y - s * 0.66); c.lineTo(x + k * s * 0.1, y - s * 0.54); c.stroke(); });
  }
  const blink = (now % 3400) < 130;                                              // an occasional blink
  c.fillStyle = eye;
  if (glow && !blink) { c.shadowColor = eye; c.shadowBlur = s * 0.35; }
  [-1, 1].forEach(d => {
    if (blink) { c.strokeStyle = eye; c.lineWidth = s * 0.02; c.beginPath(); c.moveTo(x + d * s * 0.07, y - s * 0.37); c.lineTo(x + d * s * 0.19, y - s * 0.37); c.stroke(); }
    else { c.beginPath(); c.arc(x + d * s * 0.13, y - s * 0.37, s * 0.062, 0, 7); c.fill(); }
  });
  c.shadowBlur = 0;
  c.fillStyle = nose; c.beginPath(); c.arc(x, y - s * 0.28, s * 0.032, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = s * 0.012;              // whiskers
  [-1, 1].forEach(d => { for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + d * s * 0.05, y - s * 0.27); c.lineTo(x + d * s * 0.42, y - s * 0.27 + k * s * 0.06); c.stroke(); } });
}
// Night-sky twinkle, a soft moon, and drifting snow — reusable scene dressing
function csStars(c, W, H, n, p) {
  c.save();
  for (let i = 0; i < n; i++) {
    const sx = (i * 173) % W, sy = (i * 97) % (H * 0.5);
    c.globalAlpha *= 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + p * 9));
    c.fillStyle = '#dfe8ff'; c.fillRect(sx, sy, 2.4, 2.4);
    c.globalAlpha = 1;
  }
  c.restore();
}
function csMoon(c, x, y, r) {
  c.save();
  c.fillStyle = '#e8ecf4'; c.shadowColor = '#cfd8ea'; c.shadowBlur = r * 0.9;
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.shadowBlur = 0;
  c.fillStyle = 'rgba(160,170,190,0.35)';
  c.beginPath(); c.arc(x - r * 0.3, y - r * 0.15, r * 0.22, 0, 7); c.fill();
  c.beginPath(); c.arc(x + r * 0.25, y + r * 0.3, r * 0.14, 0, 7); c.fill();
  c.restore();
}
function csSnow(c, W, H, p) {
  c.save(); c.fillStyle = 'rgba(235,242,250,0.85)';
  for (let i = 0; i < 60; i++) {
    const sx = (i * 149 + Math.sin(i + p * 5) * 30 + p * 90) % W, sy = (i * 101 + p * 420) % H;
    c.beginPath(); c.arc(sx, sy, 2 + (i % 3), 0, 7); c.fill();
  }
  c.restore();
}
// A graduation mortarboard perched on the cat's head
function csCap(c, x, y, s) {
  c.save();
  c.fillStyle = '#20242e'; c.beginPath(); c.ellipse(x, y + s * 0.1, s * 0.34, s * 0.13, 0, 0, 7); c.fill();   // skull cap
  c.beginPath(); c.moveTo(x - s * 0.52, y); c.lineTo(x, y - s * 0.2); c.lineTo(x + s * 0.52, y); c.lineTo(x, y + s * 0.2); c.closePath(); c.fill();   // the board
  c.strokeStyle = '#f0c020'; c.lineWidth = s * 0.035; c.lineCap = 'round';                                   // tassel
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * 0.3, y + s * 0.1, x + s * 0.34, y + s * 0.34); c.stroke();
  c.fillStyle = '#f0c020'; c.beginPath(); c.arc(x + s * 0.34, y + s * 0.38, s * 0.06, 0, 7); c.fill();
  c.restore();
}
function csHeart(c, x, y, s) { c.beginPath(); c.moveTo(x, y + s * 0.3); c.bezierCurveTo(x - s, y - s * 0.5, x - s * 0.3, y - s, x, y - s * 0.35); c.bezierCurveTo(x + s * 0.3, y - s, x + s, y - s * 0.5, x, y + s * 0.3); c.fill(); }
function csHeartBroken(c, x, y, s) { csHeart(c, x, y, s); c.save(); const bg = c.fillStyle; c.strokeStyle = '#12121a'; c.lineWidth = s * 0.16; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x, y - s * 0.55); c.lineTo(x - s * 0.16, y - s * 0.12); c.lineTo(x + s * 0.12, y + s * 0.04); c.lineTo(x - s * 0.06, y + s * 0.32); c.stroke(); c.restore(); c.fillStyle = bg; }
function csRain(c, W, H, p) {
  c.strokeStyle = 'rgba(150,175,210,0.16)'; c.lineWidth = 1.4;   // far sheet, fine drizzle
  for (let i = 0; i < 55; i++) { const rx = (i * 211 + p * 360) % W, ry = (i * 97 + p * 540) % H; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 4, ry + 13); c.stroke(); }
  c.strokeStyle = 'rgba(172,196,230,0.34)'; c.lineWidth = 2.4;   // near sheet, heavy drops
  for (let i = 0; i < 45; i++) { const rx = (i * 137 + p * 640) % W, ry = (i * 83 + p * 880) % H; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 8, ry + 24); c.stroke(); }
}
function csFigure(c, x, groundY, h, w, col) { c.fillStyle = col; c.beginPath(); c.arc(x, groundY - h - w, w * 0.9, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - w, groundY); c.lineTo(x - w * 0.8, groundY - h); c.quadraticCurveTo(x, groundY - h - w * 0.6, x + w * 0.8, groundY - h); c.lineTo(x + w, groundY); c.closePath(); c.fill(); }

// ── The intro: "The Rescue" ──
function INTRO_CUTSCENE() {
  return [
    { caption: 'Cold nights. An empty tummy. A little cat with no one.', dur: 3400, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a2230'); g.addColorStop(1, '#080b12'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        csStars(c, W, H, 34, p);
        csMoon(c, W * 0.63, H * 0.14, 34);
        c.fillStyle = '#10141d'; c.fillRect(0, H * 0.18, W * 0.34, H); c.fillRect(W * 0.72, H * 0.12, W * 0.28, H);
        c.fillStyle = 'rgba(255,214,140,0.55)'; c.fillRect(W * 0.12, H * 0.3, W * 0.05, H * 0.07);   // one warm lit window — a home that isn't yours
        c.fillStyle = 'rgba(90,110,140,0.18)'; c.beginPath(); c.ellipse(W * 0.5, H * 0.92, W * 0.34, H * 0.05, 0, 0, 7); c.fill();
        c.fillStyle = '#8a6a44'; c.fillRect(W * 0.4, H * 0.62, W * 0.2, H * 0.22); c.fillStyle = '#6a4e2e'; c.fillRect(W * 0.4, H * 0.62, W * 0.2, H * 0.035);
        const eye = (state.catCustom && state.catCustom.eye) || '#7cc46a'; c.fillStyle = eye; c.shadowColor = eye; c.shadowBlur = 20;
        c.beginPath(); c.arc(W * 0.47, H * 0.72, 7, 0, 7); c.fill(); c.beginPath(); c.arc(W * 0.53, H * 0.72, 7, 0, 7); c.fill(); c.shadowBlur = 0;
        csRain(c, W, H, p);
      } },
    { caption: 'Then — a shelter. A roof over your head. But still… waiting.', dur: 3400, draw: (c, W, H) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3c3c46'); g.addColorStop(1, '#24242c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(W * 0.12, H * 0.18, W * 0.76, H * 0.68);
        csCat(c, W * 0.5, H * 0.66, 210, true);
        c.strokeStyle = 'rgba(190,190,200,0.55)'; c.lineWidth = 5;
        for (let x = W * 0.14; x <= W * 0.86; x += 46) { c.beginPath(); c.moveTo(x, H * 0.18); c.lineTo(x, H * 0.86); c.stroke(); }
        [0.18, 0.86].forEach(fy => { c.beginPath(); c.moveTo(W * 0.14, H * fy); c.lineTo(W * 0.86, H * fy); c.stroke(); });
      } },
    { caption: 'The Millers had almost nothing. But they had room in their hearts.', dur: 3600, draw: (c, W, H) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4a3a30'); g.addColorStop(1, '#281e18'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#26323e'; c.fillRect(W * 0.66, H * 0.14, W * 0.22, H * 0.32); c.strokeStyle = '#4a3a2c'; c.lineWidth = 6; c.strokeRect(W * 0.66, H * 0.14, W * 0.22, H * 0.32);
        c.fillStyle = 'rgba(255,220,150,0.10)'; c.beginPath(); c.arc(W * 0.3, H * 0.2, 90, 0, 7); c.fill();
        const gy = H * 0.86;
        csFigure(c, W * 0.34, gy, H * 0.34, W * 0.05, '#7a5a48');
        csFigure(c, W * 0.46, gy, H * 0.31, W * 0.05, '#9a6a6a');
        csFigure(c, W * 0.56, gy, H * 0.2, W * 0.038, '#7a6a9a');
        csFigure(c, W * 0.64, gy, H * 0.17, W * 0.034, '#5a7a8a');
      } },
    { caption: 'They looked past every other cat… and chose you.', dur: 3600, draw: (c, W, H, p) => {
        const g = c.createRadialGradient(W * 0.5, H * 0.42, 40, W * 0.5, H * 0.42, W * 0.62); g.addColorStop(0, '#5c4a38'); g.addColorStop(1, '#26201a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,222,150,0.13)'; c.beginPath(); c.moveTo(W * 0.5, 0); c.lineTo(W * 0.18, H); c.lineTo(W * 0.82, H); c.closePath(); c.fill();
        csCat(c, W * 0.5, H * 0.52 - p * 22, 230, true);
        c.fillStyle = '#e888a4'; [[-95, -70, 14], [100, -46, 17], [4, -128, 12]].forEach(([dx, dy, s]) => csHeart(c, W * 0.5 + dx, H * 0.4 + dy - p * 34, s));
      } },
    { caption: 'A new life begins — and this family needs you as much as you need them.', dur: 4000, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f0b06a'); g.addColorStop(0.5, '#f8d6a0'); g.addColorStop(1, '#a6c674'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,244,200,0.9)'; c.beginPath(); c.arc(W * 0.72, H * 0.28, 62, 0, 7); c.fill();
        c.fillStyle = '#b48a60'; c.fillRect(W * 0.6, H * 0.5, W * 0.22, H * 0.32); c.fillStyle = '#8a4a3a'; c.beginPath(); c.moveTo(W * 0.57, H * 0.5); c.lineTo(W * 0.71, H * 0.34); c.lineTo(W * 0.85, H * 0.5); c.closePath(); c.fill();
        c.fillStyle = '#6b3a1f'; c.fillRect(W * 0.685, H * 0.66, W * 0.05, H * 0.16);
        c.fillStyle = '#c8b088'; c.beginPath(); c.moveTo(0, H); c.lineTo(W * 0.4, H); c.lineTo(W * 0.68, H * 0.72); c.lineTo(W * 0.62, H * 0.72); c.closePath(); c.fill();
        csCat(c, W * 0.2 + p * W * 0.16, H * 0.84, 92, false);
        csFigure(c, W * 0.32 + p * W * 0.16, H * 0.86, H * 0.24, W * 0.03, '#7a5a48');
      } },
  ];
}
// ── "Elected!" — a camera cinematic over the town, with confetti (technique A) ──
function playElectedCutscene(onDone) {
  const cx = catGroup.position.x, cz = catGroup.position.z, look = [cx, 0.9, cz];
  csConfetti(cx, cz, 50);
  playCutscene([
    { type: 'cam', caption: 'The whole town gathered to hear the result…', dur: 3000, from: [cx - 11, 2.2, cz + 10], to: [cx - 6, 5, cz + 8.5], look, onFrame: () => { if (typeof sfx === 'function') sfx('upgrade'); } },
    { type: 'cam', caption: 'By the will of the people…', dur: 3000, from: [cx + 9, 4, cz + 9.5], to: [cx - 9, 6.5, cz + 9.5], look, onFrame: () => { csFlash(); csConfetti(cx, cz, 30); } },
    { type: 'cam', caption: '🎉 ' + (state.catName || 'You') + ' — President of the town! 🎉', dur: 3800, from: [cx, 8.5, cz + 12], to: [cx, 3.2, cz + 5.5], look, look2: [cx, 1, cz], onFrame: () => { csConfetti(cx, cz, 30); if (typeof sfx === 'function') sfx('coin'); } },
  ], onDone);
}

// ── "The Fall" — the jail march (technique A, darker) ──
function csPoliceLights() {
  const f = document.getElementById('flash'); if (!f) return;
  const seq = ['#4a68ff', '#ff4a4a', '#4a68ff', '#ff4a4a'];
  seq.forEach((col, i) => setTimeout(() => { f.style.background = col; f.classList.add('show'); setTimeout(() => f.classList.remove('show'), 150); }, i * 240));
  setTimeout(() => { f.style.background = ''; }, seq.length * 240 + 220);
}
function playFallCutscene(onDone) {
  const cx = catGroup.position.x, cz = catGroup.position.z, look = [cx, 0.8, cz];
  const storm = 'rgba(8,10,20,0.5)';
  playCutscene([
    { type: 'cam', tint: storm, caption: 'Power turned your head…', dur: 3200, from: [cx - 3, 1.5, cz + 7], to: [cx - 1.4, 1.1, cz + 3.4], look, onFrame: () => { if (typeof sfx === 'function') sfx('catch'); } },
    { type: 'cam', tint: storm, caption: '…and the town you robbed turned its back on you.', dur: 3300, from: [cx, 13, cz + 3], to: [cx, 20, cz + 1], look, look2: [cx, 0, cz] },
    { type: 'cam', tint: 'rgba(6,8,16,0.62)', caption: '🚔 Under arrest for corruption, ' + (state.catName || 'you') + '. Twenty days behind bars.', dur: 3900, from: [cx + 2.6, 1.4, cz + 3.4], to: [cx + 1.1, 1.05, cz + 2.1], look, onFrame: () => { csPoliceLights(); if (typeof sfx === 'function') sfx('catch'); } },
  ], onDone);
}

// ── "Dad's Shop Reopens" (technique A) ──
function playShopCutscene(onDone) {
  const sx = -18, sz = -9, look = [sx, 1.4, sz];
  if (typeof updateShopSign === 'function') updateShopSign();
  csConfetti(sx, sz, 26);
  playCutscene([
    { type: 'cam', caption: 'Word spread fast — the old store had a new owner.', dur: 3000, from: [sx - 10, 4.5, sz + 12], to: [sx - 3, 3.4, sz + 8.5], look, onFrame: () => { if (typeof sfx === 'function') sfx('upgrade'); } },
    { type: 'cam', caption: 'The OPEN sign lit up for the first time in months.', dur: 3200, from: [sx + 8, 3.2, sz + 9], to: [sx + 1.5, 2.4, sz + 5.5], look: [sx, 1.6, sz], onFrame: () => { csConfetti(sx, sz, 20); csFlash(); } },
    { type: 'cam', caption: '🏪 Daniel Miller has honest work again. ❤️', dur: 3600, from: [sx, 6, sz + 11], to: [sx, 2.6, sz + 6], look, look2: [sx, 1.4, sz], onFrame: () => { csConfetti(sx, sz, 18); if (typeof sfx === 'function') sfx('coin'); } },
  ], onDone);
}

// ── "Redemption" — a disgraced ex-president earns their way back (technique B panels) ──
function REDEMPTION_CUTSCENE() {
  return [
    { caption: 'Out of jail. Nothing to your name — but your paws, and your pride.', dur: 3400, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141a2a'); g.addColorStop(1, '#242032'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(220,225,240,0.6)'; for (let i = 0; i < 44; i++) { const sx = (i * 89) % W, sy = (i * 57) % (H * 0.55); c.globalAlpha = 0.6 * (1 - p); c.fillRect(sx, sy, 2, 2); } c.globalAlpha = 1;
        c.fillStyle = '#2a2a30'; c.fillRect(0, H * 0.8, W, H * 0.2);
        csCat(c, W * 0.5, H * 0.74, 120, true);
      } },
    { caption: 'You worked. Honestly. One earned coin at a time.', dur: 3200, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a4a5a'); g.addColorStop(1, '#5a6a52'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#4a6a3a'; c.fillRect(0, H * 0.8, W, H * 0.2);
        csCat(c, W * 0.4, H * 0.72, 118, false);
        c.strokeStyle = '#b88818'; c.lineWidth = 3;
        [[0.6, 0.42, 26], [0.68, 0.56, 20], [0.55, 0.3, 16]].forEach(([fx, fy, r]) => { const yy = H * fy - p * 26; c.fillStyle = '#f0c020'; c.beginPath(); c.arc(W * fx, yy, r, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#c89a10'; c.font = (r) + 'px Georgia'; c.textAlign = 'center'; c.fillText('¢', W * fx, yy + r * 0.35); });
      } },
    { caption: 'And bought a little home that is truly your own.', dur: 3400, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f0b06a'); g.addColorStop(1, '#f6d29a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#b48a60'; c.fillRect(W * 0.34, H * 0.4, W * 0.32, H * 0.42);
        c.fillStyle = '#8a4a3a'; c.beginPath(); c.moveTo(W * 0.31, H * 0.4); c.lineTo(W * 0.5, H * 0.22); c.lineTo(W * 0.69, H * 0.4); c.closePath(); c.fill();
        c.fillStyle = '#6b3a1f'; c.fillRect(W * 0.46, H * 0.56, W * 0.08, H * 0.26);
        c.fillStyle = '#f0d060'; c.shadowColor = '#f0d060'; c.shadowBlur = 22; c.beginPath(); c.arc(W * 0.525, H * 0.69, 6, 0, 7); c.fill(); c.shadowBlur = 0;
        csCat(c, W * 0.5, H * 0.86, 80, false);
      } },
    { caption: 'The disgrace lifts with the morning. A fresh start — honest, this time. 🌅', dur: 4000, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffd98a'); g.addColorStop(0.5, '#f9c98a'); g.addColorStop(1, '#a6c674'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,245,205,0.95)'; c.beginPath(); c.arc(W * 0.5, H * 0.36 - p * 12, 66 + p * 12, 0, 7); c.fill();
        c.fillStyle = '#c8b088'; c.fillRect(0, H * 0.82, W, H * 0.18);
        csCat(c, W * 0.5, H * 0.8, 130, true);
        c.fillStyle = '#e888a4'; [[-70, -40, 12], [80, -30, 14]].forEach(([dx, dy, s]) => csHeart(c, W * 0.5 + dx, H * 0.6 + dy - p * 22, s));
      } },
  ];
}
function playRedemptionCutscene(onDone) { playCutscene(REDEMPTION_CUTSCENE(), onDone); }

// ── Civic ribbon-cutting (technique A) — hospital / school / shelter grand opening ──
function playRibbonCutscene(id, onDone) {
  const lot = (typeof CIVIC_LOTS !== 'undefined') && CIVIC_LOTS[id];
  if (!lot) { if (onDone) onDone(); return; }
  const def = (typeof civicDef === 'function') && civicDef(id);
  const icon = def ? def.icon : '🎀', name = def ? def.name : 'the new building';
  const x = lot.x, z = lot.z, look = [x, 1.6, z - 4];
  csConfetti(x, z - 4, 30);
  playCutscene([
    { type: 'cam', caption: 'The whole town gathered for the grand opening…', dur: 3000, from: [x - 12, 4.5, z - 16], to: [x - 4, 3.6, z - 12], look, onFrame: () => { if (typeof sfx === 'function') sfx('upgrade'); } },
    { type: 'cam', caption: '✂️ Snip! The ribbon falls.', dur: 3000, from: [x + 9, 3, z - 12], to: [x + 1.5, 2.6, z - 8], look, onFrame: () => { csFlash(); csConfetti(x, z - 4, 24); } },
    { type: 'cam', caption: icon + ' ' + name + ' — a gift to the whole town. ❤️', dur: 3600, from: [x, 7, z - 15], to: [x, 3, z - 8], look, look2: [x, 1.4, z - 3], onFrame: () => { csConfetti(x, z - 4, 20); if (typeof sfx === 'function') sfx('coin'); } },
  ], onDone);
}

// ── "Disowned" — the Millers turn you away after jail (technique B panels, dramatic) ──
function REJECTION_CUTSCENE() {
  const nm = state.catName || 'you';
  return [
    { caption: '“I’ve served my time… maybe they’ll still have me.”', dur: 3400, draw: (c, W, H) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a2230'); g.addColorStop(1, '#161320'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#3a2e28'; c.fillRect(W * 0.28, H * 0.1, W * 0.44, H * 0.82);                 // house wall
        c.fillStyle = '#e8b86a'; c.fillRect(W * 0.44, H * 0.32, W * 0.12, H * 0.52);               // warm doorway
        c.fillStyle = 'rgba(255,220,150,0.16)'; c.beginPath(); c.arc(W * 0.5, H * 0.5, 130, 0, 7); c.fill();
        csCat(c, W * 0.5, H * 0.86, 80, true);                                                     // small, hopeful, at the step
      } },
    { caption: 'Daniel: “No. You stole from this whole town while we defended you.”', dur: 4000, draw: (c, W, H) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4a3a30'); g.addColorStop(1, '#221812'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,210,140,0.13)'; c.fillRect(W * 0.34, H * 0.18, W * 0.34, H * 0.74);  // doorway light
        const gy = H * 0.9;
        csFigure(c, W * 0.5, gy, H * 0.4, W * 0.055, '#7a5a48');                                    // Daniel blocking the door
        c.strokeStyle = '#7a5a48'; c.lineWidth = W * 0.02; c.lineCap = 'round';                     // arm, pointing OUT
        c.beginPath(); c.moveTo(W * 0.5, gy - H * 0.33); c.lineTo(W * 0.3, gy - H * 0.41); c.stroke();
        csFigure(c, W * 0.6, gy, H * 0.3, W * 0.045, '#8a5a5a');                                    // family behind
        csCat(c, W * 0.17, H * 0.9, 62, false);                                                     // cat pushed to the side
      } },
    { caption: 'Elena: “We loved you like family, ' + nm + '… please, just go. 😢”', dur: 4000, draw: (c, W, H) => {
        const g = c.createRadialGradient(W * 0.5, H * 0.4, 40, W * 0.5, H * 0.4, W * 0.62); g.addColorStop(0, '#5a4238'); g.addColorStop(1, '#201610'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        const gy = H * 0.92;
        csFigure(c, W * 0.46, gy, H * 0.32, W * 0.05, '#9a6a6a');                                   // Elena
        csFigure(c, W * 0.58, gy, H * 0.18, W * 0.035, '#7a6a9a');                                  // kid clinging
        csFigure(c, W * 0.36, gy, H * 0.16, W * 0.032, '#5a7a8a');                                  // kid clinging
        c.fillStyle = 'rgba(150,190,235,0.85)';                                                     // tears
        c.beginPath(); c.arc(W * 0.44, H * 0.52, 4, 0, 7); c.fill(); c.beginPath(); c.arc(W * 0.49, H * 0.55, 4, 0, 7); c.fill();
      } },
    { caption: 'The door you once walked through as family… closed for good. 💔', dur: 4400, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#20222c'); g.addColorStop(1, '#0e0e16'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#2e2620'; c.fillRect(W * 0.28, H * 0.1, W * 0.44, H * 0.82);                 // wall
        c.fillStyle = '#241c16'; c.fillRect(W * 0.44, H * 0.32, W * 0.12, H * 0.52);               // shut, dark door
        c.fillStyle = '#c85a6a'; csHeartBroken(c, W * 0.5, H * 0.32 - p * 12, 30);                  // breaking heart
        csCat(c, W * 0.5, H * 0.88, 84, true);                                                      // alone on the cold step
        csRain(c, W, H, p);
      } },
  ];
}
function playRejectionCutscene(onDone) { playCutscene(REJECTION_CUTSCENE(), onDone); }

// ── "Forgiven" — you won the Millers back with kindness (technique B panels) ──
function RECONCILE_CUTSCENE() {
  const nm = state.catName || 'you';
  return [
    { caption: 'Day after day, you gave — coins, kindness, honest work. And the town noticed.', dur: 3600, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a4a6a'); g.addColorStop(1, '#2a3a52'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,240,200,0.12)'; c.beginPath(); c.arc(W * 0.5, H * 0.3, 120, 0, 7); c.fill();
        csCat(c, W * 0.5, H * 0.72, 120, false);
        c.fillStyle = '#f0c020'; c.strokeStyle = '#b88818'; c.lineWidth = 3;   // coins of kindness rising
        [[0.34, 0.5, 16], [0.66, 0.44, 20], [0.5, 0.34, 14]].forEach(([fx, fy, r]) => { const yy = H * fy - p * 24; c.fillStyle = '#f0c020'; c.beginPath(); c.arc(W * fx, yy, r, 0, 7); c.fill(); c.stroke(); });
      } },
    { caption: 'Word of it reached a little house on the corner…', dur: 3400, draw: (c, W, H) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f0c07a'); g.addColorStop(1, '#e0a860'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#b48a60'; c.fillRect(W * 0.32, H * 0.34, W * 0.36, H * 0.5);
        c.fillStyle = '#8a4a3a'; c.beginPath(); c.moveTo(W * 0.29, H * 0.34); c.lineTo(W * 0.5, H * 0.16); c.lineTo(W * 0.71, H * 0.34); c.closePath(); c.fill();
        c.fillStyle = '#e8c86a'; c.fillRect(W * 0.45, H * 0.5, W * 0.1, H * 0.34);   // the door glowing open
        c.fillStyle = 'rgba(255,240,200,0.5)'; c.beginPath(); c.arc(W * 0.5, H * 0.62, 60, 0, 7); c.fill();
        const gy = H * 0.9; csFigure(c, W * 0.5, gy, H * 0.28, W * 0.045, '#7a5a48');   // a Miller in the doorway, waiting
      } },
    { caption: 'Elena: “Come in from the cold, ' + nm + '. This is your home too.”', dur: 3900, draw: (c, W, H) => {
        const g = c.createRadialGradient(W * 0.5, H * 0.45, 40, W * 0.5, H * 0.45, W * 0.62); g.addColorStop(0, '#ffe6b0'); g.addColorStop(1, '#d8a860'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        const gy = H * 0.92;
        csFigure(c, W * 0.36, gy, H * 0.34, W * 0.05, '#7a5a48');    // Daniel
        csFigure(c, W * 0.5, gy, H * 0.31, W * 0.05, '#9a6a6a');     // Elena, arms open
        csFigure(c, W * 0.62, gy, H * 0.18, W * 0.035, '#7a6a9a');   // Lily
        csCat(c, W * 0.5, H * 0.82, 74, true);                       // the cat, welcomed in
      } },
    { caption: 'Forgiven. Home again — and this time, for good. ❤️', dur: 4200, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffd98a'); g.addColorStop(0.5, '#f7c98a'); g.addColorStop(1, '#a6c674'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,246,208,0.95)'; c.beginPath(); c.arc(W * 0.5, H * 0.34 - p * 10, 60 + p * 10, 0, 7); c.fill();
        c.fillStyle = '#c8b088'; c.fillRect(0, H * 0.82, W, H * 0.18);
        csCat(c, W * 0.5, H * 0.8, 128, true);
        c.fillStyle = '#e888a4'; [[-78, -46, 13], [86, -34, 15], [6, -120, 12]].forEach(([dx, dy, s]) => csHeart(c, W * 0.5 + dx, H * 0.6 + dy - p * 26, s));
      } },
  ];
}
function playReconcileCutscene(onDone) { playCutscene(RECONCILE_CUTSCENE(), onDone); }

// ── "The Landlord" — Mr. Crick delivers the rent ultimatum (technique B, ominous) ──
function CRICK_CUTSCENE() {
  return [
    { caption: 'A knock at the door. Slow. Heavy. Certain.', dur: 3400, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#141824'); g.addColorStop(1, '#0a0c14'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        csStars(c, W, H, 20, p);
        c.fillStyle = '#241c16'; c.fillRect(W * 0.24, H * 0.1, W * 0.52, H * 0.84);                  // the Millers' wall
        c.fillStyle = '#8a6a44'; c.fillRect(W * 0.44, H * 0.36, W * 0.12, H * 0.48);                 // the door
        c.fillStyle = 'rgba(255,214,140,0.3)'; c.fillRect(W * 0.3, H * 0.44, W * 0.07, H * 0.09);   // a nervous lit window
        // the long shadow of a man in a tall hat, thrown ACROSS the door
        c.fillStyle = 'rgba(0,0,0,0.55)';
        c.beginPath(); c.ellipse(W * 0.5, H * 0.62 - p * 8, W * 0.045, H * 0.2, 0, 0, 7); c.fill();
        c.beginPath(); c.arc(W * 0.5, H * 0.4 - p * 8, W * 0.032, 0, 7); c.fill();
        c.fillRect(W * 0.462, H * 0.3 - p * 8, W * 0.076, H * 0.045);                                // top hat brim
        c.fillRect(W * 0.474, H * 0.24 - p * 8, W * 0.052, H * 0.07);                                // top hat crown
        csRain(c, W, H, p);
      } },
    { caption: 'Mr. Crick, the landlord: “The rent. ALL of it. By winter\'s end… or out you go.”', dur: 4200, draw: (c, W, H, p) => {
        const g = c.createRadialGradient(W * 0.5, H * 0.4, 40, W * 0.5, H * 0.4, W * 0.6); g.addColorStop(0, '#3a3440'); g.addColorStop(1, '#12101a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        const gy = H * 0.94;
        c.fillStyle = '#1c1a22';                                                                     // Crick, tall and thin
        c.beginPath(); c.moveTo(W * 0.5 - W * 0.05, gy); c.lineTo(W * 0.5 - W * 0.035, gy - H * 0.52); c.lineTo(W * 0.5 + W * 0.035, gy - H * 0.52); c.lineTo(W * 0.5 + W * 0.05, gy); c.closePath(); c.fill();
        c.fillStyle = '#d8b494'; c.beginPath(); c.arc(W * 0.5, gy - H * 0.56, W * 0.035, 0, 7); c.fill();   // gaunt face
        c.fillStyle = '#16141c'; c.fillRect(W * 0.44, gy - H * 0.63, W * 0.12, H * 0.028);           // hat brim
        c.fillRect(W * 0.462, gy - H * 0.72, W * 0.076, H * 0.09);                                   // hat crown
        c.strokeStyle = '#1c1a22'; c.lineWidth = W * 0.016; c.lineCap = 'round';                     // arm, holding out the bill
        c.beginPath(); c.moveTo(W * 0.53, gy - H * 0.44); c.lineTo(W * 0.64, gy - H * 0.4); c.stroke();
        c.save(); c.translate(W * 0.68, gy - H * 0.42); c.rotate(0.08);                              // THE BILL
        c.fillStyle = '#f2ead6'; c.fillRect(-W * 0.045, -H * 0.07, W * 0.09, H * 0.14);
        c.strokeStyle = '#a09070'; c.lineWidth = 2;
        for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(-W * 0.032, -H * 0.04 + k * H * 0.025); c.lineTo(W * 0.032, -H * 0.04 + k * H * 0.025); c.stroke(); }
        c.fillStyle = '#b03a2a'; c.font = 'bold ' + (H * 0.035) + 'px Georgia'; c.textAlign = 'center'; c.fillText('DUE', 0, H * 0.062);
        c.restore();
        c.fillStyle = 'rgba(255,255,255,0.06)'; c.beginPath(); c.moveTo(W * 0.5, 0); c.lineTo(W * 0.3, H); c.lineTo(W * 0.7, H); c.closePath(); c.fill();   // cold spotlight
      } },
    { caption: (state.daysLeft || 16) + ' days. One little cat against the winter. ❄️', dur: 3800, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#232c3c'); g.addColorStop(1, '#131a26'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        const gy = H * 0.9;
        c.fillStyle = 'rgba(255,214,140,0.1)'; c.beginPath(); c.arc(W * 0.66, H * 0.5, 120, 0, 7); c.fill();
        csFigure(c, W * 0.66, gy, H * 0.3, W * 0.045, '#6a5044');                                    // the family, huddled small
        csFigure(c, W * 0.74, gy, H * 0.27, W * 0.042, '#8a5a5a');
        csFigure(c, W * 0.81, gy, H * 0.16, W * 0.03, '#6a5a80');
        csCat(c, W * 0.3, H * 0.84, 100, true);                                                      // the cat, stepping forward
        csSnow(c, W, H, p);
      } },
  ];
}
function playCrickCutscene(onDone) { playCutscene(CRICK_CUTSCENE(), onDone); }

// ── "Paid in Full" — the rent is beaten (technique B, warm) ──
function RENTWON_CUTSCENE() {
  return [
    { caption: 'Every last penny — earned by paw, and paid in full.', dur: 3400, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4a3a2c'); g.addColorStop(1, '#2a2018'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,224,150,0.16)'; c.beginPath(); c.arc(W * 0.5, H * 0.42, 150, 0, 7); c.fill();
        c.save(); c.translate(W * 0.5, H * 0.44); c.rotate(-0.05);                                   // the receipt
        c.fillStyle = '#f6eeda'; c.fillRect(-W * 0.09, -H * 0.13, W * 0.18, H * 0.26);
        c.strokeStyle = '#b0a080'; c.lineWidth = 2;
        for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-W * 0.065, -H * 0.07 + k * H * 0.032); c.lineTo(W * 0.065, -H * 0.07 + k * H * 0.032); c.stroke(); }
        c.strokeStyle = '#3a8a4a'; c.lineWidth = 7; c.lineCap = 'round';                             // the big green tick
        c.beginPath(); c.moveTo(-W * 0.04, H * 0.055); c.lineTo(-W * 0.008, H * 0.095); c.lineTo(W * 0.05, H * 0.015); c.stroke();
        c.restore();
        c.fillStyle = '#f0c020'; c.strokeStyle = '#b88818'; c.lineWidth = 3;                         // stacked coins
        [[0.32, 0.72, 22], [0.36, 0.68, 22], [0.34, 0.64, 22], [0.66, 0.72, 20], [0.69, 0.68, 20]].forEach(([fx, fy, r]) => { c.beginPath(); c.ellipse(W * fx, H * fy, r, r * 0.42, 0, 0, 7); c.fill(); c.stroke(); });
        csCat(c, W * 0.5, H * 0.84, 86, true);
      } },
    { caption: 'The little house is truly theirs now. No one can take it away. ❤️', dur: 4200, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffd98a'); g.addColorStop(0.55, '#f7c98a'); g.addColorStop(1, '#a6c674'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,246,208,0.95)'; c.beginPath(); c.arc(W * 0.76, H * 0.2, 56, 0, 7); c.fill();
        c.fillStyle = '#b48a60'; c.fillRect(W * 0.34, H * 0.42, W * 0.32, H * 0.4);                  // the house
        c.fillStyle = '#8a4a3a'; c.beginPath(); c.moveTo(W * 0.31, H * 0.42); c.lineTo(W * 0.5, H * 0.24); c.lineTo(W * 0.69, H * 0.42); c.closePath(); c.fill();
        c.fillStyle = '#6b3a1f'; c.fillRect(W * 0.46, H * 0.58, W * 0.08, H * 0.24);
        c.fillStyle = 'rgba(255,224,150,0.8)'; c.fillRect(W * 0.38, H * 0.5, W * 0.05, H * 0.07); c.fillRect(W * 0.57, H * 0.5, W * 0.05, H * 0.07);
        const gy = H * 0.9;
        csFigure(c, W * 0.24, gy, H * 0.3, W * 0.045, '#7a5a48');                                    // the family out front, together
        csFigure(c, W * 0.31, gy, H * 0.27, W * 0.042, '#9a6a6a');
        csFigure(c, W * 0.76, gy, H * 0.16, W * 0.03, '#7a6a9a');
        csCat(c, W * 0.5, H * 0.88, 74, true);
        c.fillStyle = '#e888a4'; [[-120, -80, 13], [130, -60, 15], [0, -150, 12]].forEach(([dx, dy, s]) => csHeart(c, W * 0.5 + dx, H * 0.5 + dy - p * 24, s));
      } },
  ];
}
function playRentWonCutscene(onDone) { playCutscene(RENTWON_CUTSCENE(), onDone); }

// ── "Mayor!" — winning the first election (technique A, over the live town) ──
function playMayorCutscene(onDone) {
  const cx = catGroup.position.x, cz = catGroup.position.z, look = [cx, 0.9, cz];
  csConfetti(cx, cz, 34);
  playCutscene([
    { type: 'cam', caption: 'The votes are counted, the square holds its breath…', dur: 2900, from: [cx - 10, 2.4, cz + 9.5], to: [cx - 4.5, 4.6, cz + 7.5], look, onFrame: () => { if (typeof sfx === 'function') sfx('upgrade'); } },
    { type: 'cam', caption: '🎩 Mayor ' + (state.catName || 'Whiskers') + '! The town is yours to serve.', dur: 3800, from: [cx, 7.5, cz + 11], to: [cx, 2.8, cz + 5], look, look2: [cx, 1, cz], onFrame: () => { csFlash(); csConfetti(cx, cz, 26); if (typeof sfx === 'function') sfx('coin'); } },
  ], onDone);
}

// ── "Graduation Day" — a degree earned (technique B); the 7th plays the Professor finale ──
function GRAD_CUTSCENE(course, all) {
  const beats = [
    { caption: 'Every lesson passed. Every task done. The exam — aced.', dur: 3200, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8ab4d8'); g.addColorStop(1, '#c8d8b0'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#b0553f'; c.fillRect(W * 0.3, H * 0.34, W * 0.4, H * 0.48);                   // the schoolhouse
        c.fillStyle = '#3d5a4a'; c.beginPath(); c.moveTo(W * 0.26, H * 0.34); c.lineTo(W * 0.5, H * 0.14); c.lineTo(W * 0.74, H * 0.34); c.closePath(); c.fill();
        c.fillStyle = '#a04a36'; c.fillRect(W * 0.465, H * 0.08, W * 0.07, H * 0.09);                // bell tower
        c.fillStyle = '#d8b04a'; c.beginPath(); c.arc(W * 0.5, H * 0.13, 9, 0, 7); c.fill();         // the bell, mid-ring
        c.strokeStyle = 'rgba(216,176,74,0.6)'; c.lineWidth = 3;
        c.beginPath(); c.arc(W * 0.5, H * 0.13, 16 + p * 10, -0.6, 0.6); c.stroke();                 // ring-ring
        c.fillStyle = '#6a3a2a'; c.fillRect(W * 0.46, H * 0.6, W * 0.08, H * 0.22);                  // door
        c.fillStyle = 'rgba(255,240,190,0.8)'; c.fillRect(W * 0.35, H * 0.46, W * 0.06, H * 0.08); c.fillRect(W * 0.59, H * 0.46, W * 0.06, H * 0.08);
        csCat(c, W * 0.5, H * 0.88, 84, true);
      } },
    { caption: '🎓 ' + course.name + ' — signed, sealed, and framed on the wall.', dur: 3800, draw: (c, W, H, p) => {
        const g = c.createRadialGradient(W * 0.5, H * 0.4, 40, W * 0.5, H * 0.4, W * 0.62); g.addColorStop(0, '#ffe6b0'); g.addColorStop(1, '#c89858'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        // tossed caps sail overhead
        [[0.24, 0.24, 0.9], [0.5, 0.14, -0.4], [0.76, 0.26, 0.5]].forEach(([fx, fy, rot], i) => {
          c.save(); c.translate(W * fx, H * fy - p * 26); c.rotate(rot + p * 0.6); c.fillStyle = '#20242e';
          c.beginPath(); c.moveTo(-34, 0); c.lineTo(0, -13); c.lineTo(34, 0); c.lineTo(0, 13); c.closePath(); c.fill(); c.restore();
        });
        csCat(c, W * 0.5, H * 0.66, 170, true);
        csCap(c, W * 0.5, H * 0.66 - 170 * 0.78, 110);                                              // the mortarboard, proudly worn
        c.fillStyle = '#e888a4'; [[-110, 0, 13], [118, 14, 15]].forEach(([dx, dy, s]) => csHeart(c, W * 0.5 + dx, H * 0.5 + dy - p * 20, s));
      } },
  ];
  if (all) beats.push(
    { caption: '👑 Seven courses. Seven degrees. The town has a new legend: PROFESSOR PAWS.', dur: 4600, draw: (c, W, H, p) => {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a2440'); g.addColorStop(1, '#141020'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        csStars(c, W, H, 40, p);
        // the seven degree icons arc overhead like constellations
        const icons = ['❤️', '🎨', '💼', '🌳', '📊', '🏗️', '🏛️'];
        icons.forEach((ic, i) => {
          const a = Math.PI * (0.15 + 0.7 * (i / 6)), r = W * 0.3;
          const ix = W * 0.5 - Math.cos(a) * r, iy = H * 0.48 - Math.sin(a) * (H * 0.3) - p * 8;
          c.font = (H * 0.075) + 'px Georgia'; c.textAlign = 'center';
          c.save(); c.shadowColor = '#f0d080'; c.shadowBlur = 14; c.fillText(ic, ix, iy); c.restore();
        });
        csCat(c, W * 0.5, H * 0.74, 150, true);
        csCap(c, W * 0.5, H * 0.74 - 150 * 0.78, 96);
        c.fillStyle = 'rgba(240,208,128,0.9)'; c.font = 'bold ' + (H * 0.05) + 'px Georgia'; c.textAlign = 'center';
        c.fillText('PROFESSOR PAWS', W * 0.5, H * 0.93);
      } });
  return beats;
}
function playGradCutscene(course, all, onDone) { playCutscene(GRAD_CUTSCENE(course, all), onDone); }

// Wired to the "Start Adventure" button (new game). Resuming a save skips it.
function beginAdventure() {
  if (typeof unlockVoice === 'function') unlockVoice();
  if (typeof initAudio === 'function') initAudio();
  document.getElementById('intro').style.display = 'none';
  if (typeof playCutscene === 'function' && state.chosenCat) playCutscene(INTRO_CUTSCENE(), () => startGame());
  else startGame();
}
