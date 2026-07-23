// life.js — ambient NPC life. Townsfolk (state.peds) notice the props around them and
// USE them: sit on benches, rest under trees, picnic on the park blankets, and gather at
// the fountain to photograph each other. Job-giver NPCs & commuters keep their own routines.

// ── Finding something to do nearby ──
function pickUsable(p, use, maxDist) {
  let best = null, bd = maxDist * maxDist;
  for (const q of townProps) {
    if (q.use !== use || q.taken) continue;
    const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2;
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}
function nearestFreePed(p, maxDist) {
  let best = null, bd = maxDist * maxDist;
  for (const q of state.peds) {
    if (q === p || q.act || (q.petT || 0) > 0) continue;
    const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2;
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}

// ── Low-level movement / pose helpers (reuse the wander walk cycle) ──
function walkToward(p, tx, tz, speed) {
  const dx = tx - p.wx, dz = tz - p.wz, dist = Math.hypot(dx, dz);
  if (dist < 0.12) return true;
  const step = Math.min(speed, dist);
  const nx = p.wx + dx / dist * step, nz = p.wz + dz / dist * step;
  const wc = collide(nx, nz, worldColliders, 0.28);   // no more walking through walls & trees
  if (Math.hypot(wc.x - nx, wc.z - nz) > 0.02) {      // blocked — count it, and give up rather than grind forever
    p.blockT = (p.blockT || 0) + 1;
    if (p.blockT > 90) { p.blockT = 0; return true; } // "arrived" — the activity moves on & they re-plan
  } else p.blockT = 0;
  p.wx = wc.x; p.wz = wc.z;
  p.group.position.x = p.wx; p.group.position.z = p.wz; p.x = p.wx; p.z = p.wz;
  const heading = Math.atan2(dx, dz);
  p.group.rotation.y += (((heading - p.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.2;
  p.walkT = (p.walkT || 0) + 0.3;
  const sw = Math.sin(p.walkT);
  if (p.parts.legs) { p.parts.legs[0].rotation.x = sw * 0.5; p.parts.legs[1].rotation.x = -sw * 0.5; }
  if (p.parts.arms) { p.parts.arms[0].rotation.x = -sw * 0.4; p.parts.arms[1].rotation.x = sw * 0.4; }
  p.group.position.y = Math.abs(Math.sin(p.walkT)) * 0.02;
  p.group.rotation.z = sw * 0.03;                            // subtle hip sway while walking
  return false;
}
function standPose(p) {
  p.group.position.y = 0;
  p.group.rotation.z = 0;
  if (p.parts.legs) p.parts.legs.forEach(l => l.rotation.x = 0);
  if (p.parts.arms) p.parts.arms.forEach(a => a.rotation.x = 0);
}
function breatheSeated(p, t) {
  if (p.parts.torso) p.parts.torso.scale.y = 1 + Math.sin(t * 2 + (p.phase || 0)) * 0.015;
  if (p.parts.head) p.parts.head.rotation.y = Math.sin(t * 0.4 + (p.phase || 0)) * 0.2;
}

// ── Starting / running a sit-down activity (bench, tree, picnic) ──
function startSit(p, prop, kind) {
  prop.taken = true;
  let sx = prop.x, sz = prop.z, face = prop.rotY || 0;
  if (kind === 'tree') { const a = Math.random() * Math.PI * 2; sx = prop.x + Math.sin(a) * 0.95; sz = prop.z + Math.cos(a) * 0.95; face = a; }
  else if (kind === 'picnic') { const a = Math.random() * Math.PI * 2; sx = prop.x + Math.sin(a) * 0.95; sz = prop.z + Math.cos(a) * 0.95; face = a + Math.PI; }
  const read = (kind !== 'picnic' && Math.random() < 0.45);   // often, they sit down with a book
  p.act = { use: kind, prop, tx: sx, tz: sz, face, read, phase: 'walk', timer: 0 };
}
function makeBook() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.22), new THREE.MeshStandardMaterial({ color: 0x8a3a3a, roughness: 0.7 })));
  const pages = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.03, 0.19), new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.9 })); pages.position.y = 0.02; g.add(pages);
  g.rotation.x = -0.7; g.position.set(0, 1.15, 0.34);   // held up to read
  return g;
}
function applySit(p, a) {
  const h = p.group.scale.y || 1;
  // seat the hips ON the bench seat (0.5 high) and settle slightly back toward the backrest
  const backX = a.use === 'bench' ? a.tx - Math.sin(a.face) * 0.1 : a.tx;
  const backZ = a.use === 'bench' ? a.tz - Math.cos(a.face) * 0.1 : a.tz;
  p.group.position.set(backX, (a.use === 'bench' ? (0.5 - 0.84 * h) : -0.42 * h), backZ);
  p.wx = a.tx; p.wz = a.tz; p.x = a.tx; p.z = a.tz;
  p.group.rotation.y = a.face;
  const fwd = a.use === 'bench' ? -1.35 : -1.5;   // negative folds the legs FORWARD (seated), not backward
  if (p.parts.legs) p.parts.legs.forEach(l => l.rotation.x = fwd);
  if (a.read) {   // reading a book: hands up, head tilted down over the pages
    if (p.parts.arms) p.parts.arms.forEach(arm => arm.rotation.x = -1.35);
    if (p.parts.head) p.parts.head.rotation.x = 0.35;
    if (!p._book) { p._book = makeBook(); p.group.add(p._book); }
  } else if (p.parts.arms) p.parts.arms.forEach(arm => arm.rotation.x = a.use === 'bench' ? -0.35 : -0.25);
}
function endAct(p) {
  const a = p.act; if (!a) return;
  if (a.prop) a.prop.taken = false;
  if (p._book) { p.group.remove(p._book); p._book = null; }
  standPose(p);
  p.act = null; p.wstate = 'idle'; p.wtimer = 80 + Math.random() * 160;
}

// ── Fountain photos (a pair — one holds the camera, one poses) ──
function startPhoto(p, q, fountain) {
  const ang = Math.random() * Math.PI * 2, ax = Math.sin(ang), az = Math.cos(ang), R = 3.6;
  const px = fountain.x + ax * R, pz = fountain.z + az * R;
  const qx = fountain.x - ax * R, qz = fountain.z - az * R;
  p.act = { use: 'photo', role: 'photog',  partner: q, tx: px, tz: pz, face: Math.atan2(qx - px, qz - pz), phase: 'walk' };
  q.act = { use: 'photo', role: 'subject', partner: p, tx: qx, tz: qz, face: Math.atan2(px - qx, pz - qz), phase: 'walk' };
}
function makeCamera() {
  const cam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.12), new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.5 }));
  cam.position.set(0, 1.62, 0.34);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 10), new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.2, metalness: 0.6 }));
  lens.rotation.x = Math.PI / 2; lens.position.set(0, 1.62, 0.42); cam.add(lens);
  return cam;
}
const _flashes = [];
function doFlash(target) {
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
  f.position.set(target.x, 1.7, target.z); scene.add(f);
  _flashes.push({ mesh: f, life: 1 });
  if (typeof sfx === 'function' && !isNight()) sfx('sell');
}
function updateFlashes() {
  for (let i = _flashes.length - 1; i >= 0; i--) {
    const fl = _flashes[i]; fl.life -= 0.06;
    fl.mesh.material.opacity = Math.max(0, fl.life * 0.9); fl.mesh.scale.setScalar(1 + (1 - fl.life) * 1.5);
    if (fl.life <= 0) { scene.remove(fl.mesh); _flashes.splice(i, 1); }
  }
}
function endPhoto(p) {
  if (p._cam) { p.group.remove(p._cam); p._cam = null; }
  standPose(p); p.act = null; p.wstate = 'idle'; p.wtimer = 100 + Math.random() * 160;
}
function runPhoto(p, t) {
  const a = p.act;
  if (a.phase === 'walk') {
    if (walkToward(p, a.tx, a.tz, p.wspeed || 0.02)) { a.phase = 'ready'; standPose(p); p.group.rotation.y = a.face; }
    return;
  }
  p.group.rotation.y = a.face;
  if (a.phase === 'ready') {
    const pa = a.partner && a.partner.act;
    if (!pa) { endPhoto(p); return; }                          // partner wandered off — abort cleanly
    if (pa.phase === 'ready' || pa.phase === 'pose') { a.phase = 'pose'; a.timer = 240; a.flashed = false; }
    else if ((a.wait = (a.wait || 0) + 1) > 400) endPhoto(p);  // waited too long
    return;
  }
  // posing
  a.timer--;
  if (a.role === 'photog') {
    if (p.parts.arms) p.parts.arms.forEach(arm => arm.rotation.x = -1.5);
    if (!p._cam) { p._cam = makeCamera(); p.group.add(p._cam); }
    if (!a.flashed && a.timer < 170) { a.flashed = true; doFlash(a.partner || p); }
  } else {
    if (p.parts.arms) { p.parts.arms[1].rotation.x = -1.7; p.parts.arms[0].rotation.x = 0.2; }
    if (p.parts.head) p.parts.head.rotation.y = Math.sin(t * 3) * 0.12;
  }
  if (a.timer <= 0) endPhoto(p);
}

// ── Two townsfolk stop for a chat (face each other, gesture, nod) ──
function startChat(p, q) {
  const mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2, ang = Math.atan2(q.x - p.x, q.z - p.z), off = 0.75;
  p.act = { use: 'chat', partner: q, tx: mx - Math.sin(ang) * off, tz: mz - Math.cos(ang) * off, face: ang, phase: 'walk' };
  q.act = { use: 'chat', partner: p, tx: mx + Math.sin(ang) * off, tz: mz + Math.cos(ang) * off, face: ang + Math.PI, phase: 'walk' };
}
function runChat(p, t) {
  const a = p.act;
  if (a.phase === 'walk') { if (walkToward(p, a.tx, a.tz, p.wspeed || 0.02)) { a.phase = 'ready'; standPose(p); p.group.rotation.y = a.face; } return; }
  p.group.rotation.y = a.face;
  if (a.phase === 'ready') {
    const pa = a.partner && a.partner.act;
    if (!pa) { endAct(p); return; }
    if (pa.phase === 'ready' || pa.phase === 'talk') { a.phase = 'talk'; a.timer = 200 + Math.random() * 220; }
    else if ((a.wait = (a.wait || 0) + 1) > 400) endAct(p);
    return;
  }
  const ph = p.phase || 0;   // talking: gesturing hands + a nod
  if (p.parts.arms) { p.parts.arms[0].rotation.x = -0.5 + Math.sin(t * 4 + ph) * 0.35; p.parts.arms[1].rotation.x = -0.3 + Math.sin(t * 3.3 + ph + 1) * 0.3; }
  if (p.parts.head) p.parts.head.rotation.x = Math.sin(t * 2.5 + ph) * 0.12;
  if (p.parts.torso) p.parts.torso.scale.y = 1 + Math.sin(t * 2 + ph) * 0.012;
  if (--a.timer <= 0) endAct(p);
}

// ── Window-shopping: admire a nearby building's front ──
function nearestBuilding(p, maxDist) {
  let best = null, bd = maxDist * maxDist;
  for (const q of townProps) { if (q.kind !== 'house') continue; const d = (q.x - p.x) ** 2 + (q.z - p.z) ** 2; if (d < bd) { bd = d; best = q; } }
  return best;
}
function startWindow(p, b) {
  const dx = p.x - b.x, dz = p.z - b.z, d = Math.hypot(dx, dz) || 1;   // stand on the side they're coming from (the street side)
  const tx = b.x + dx / d * 3.2, tz = b.z + dz / d * 3.2;
  p.act = { use: 'window', tx, tz, face: Math.atan2(b.x - tx, b.z - tz), phase: 'walk' };
}
function runWindow(p, t) {
  const a = p.act;
  if (a.phase === 'walk') { if (walkToward(p, a.tx, a.tz, p.wspeed || 0.02)) { a.phase = 'look'; a.timer = 190 + Math.random() * 200; standPose(p); p.group.rotation.y = a.face; } return; }
  p.group.rotation.y = a.face;
  const ph = p.phase || 0;
  if (p.parts.head) { p.parts.head.rotation.x = -0.18 + Math.sin(t * 0.6 + ph) * 0.1; p.parts.head.rotation.y = Math.sin(t * 0.4 + ph) * 0.25; }   // gazing up & around
  if (p.parts.arms) { const point = Math.sin(t * 0.5 + ph) > 0.7; p.parts.arms[0].rotation.x = point ? -1.4 : Math.sin(t + ph) * 0.05; }
  if (p.parts.torso) p.parts.torso.scale.y = 1 + Math.sin(t * 2 + ph) * 0.012;
  if (--a.timer <= 0) endAct(p);
}

// ── A quick stretch on the spot ──
function startStretch(p) { p.act = { use: 'stretch', phase: 'do', timer: 130 + Math.random() * 110 }; }
function runStretch(p, t) {
  const a = p.act, ph = p.phase || 0, s = Math.sin(t * 3 + ph);
  if (p.parts.arms) { p.parts.arms[0].rotation.x = -1.6 + s * 0.4; p.parts.arms[1].rotation.x = -1.6 - s * 0.4; }
  if (p.parts.torso) p.parts.torso.scale.y = 1 + Math.sin(t * 2 + ph) * 0.02;
  if (p.parts.head) p.parts.head.rotation.x = Math.sin(t * 1.5 + ph) * 0.1;
  p.group.position.y = Math.abs(Math.sin(t * 3 + ph)) * 0.03;
  if (--a.timer <= 0) { p.group.position.y = 0; endAct(p); }
}

// ── Decide + run activities; falls back to the normal gentle wander ──
function tryStartActivity(p) {
  const inPark = p.x > PARK.x0 - 3 && p.x < PARK.x1 + 3 && p.z > PARK.z0 - 3 && p.z < PARK.z1 + 3;
  const fountain = pickUsable(p, 'fountain', 26);
  if (fountain && Math.random() < 0.3) { const partner = nearestFreePed(p, 30); if (partner) { startPhoto(p, partner, fountain); return true; } }
  if (Math.random() < 0.28) { const partner = nearestFreePed(p, 8); if (partner) { startChat(p, partner); return true; } }   // stop for a chat
  if (inPark) { const pic = pickUsable(p, 'picnic', 30); if (pic && Math.random() < 0.5) { startSit(p, pic, 'picnic'); return true; } }
  const bench = pickUsable(p, 'bench', 22); if (bench && Math.random() < 0.55) { startSit(p, bench, 'bench'); return true; }
  const tree = pickUsable(p, 'tree', 15); if (tree && Math.random() < 0.45) { startSit(p, tree, 'tree'); return true; }
  if (Math.random() < 0.3) { const b = nearestBuilding(p, 13); if (b) { startWindow(p, b); return true; } }   // window-shop / admire a building
  if (Math.random() < 0.35) { startStretch(p); return true; }                                                // a quick stretch
  return false;
}
function runAct(p, t) {
  const a = p.act;
  if (a.use === 'photo') { runPhoto(p, t); return; }
  if (a.use === 'chat') { runChat(p, t); return; }
  if (a.use === 'window') { runWindow(p, t); return; }
  if (a.use === 'stretch') { runStretch(p, t); return; }
  if (a.phase === 'walk') {
    if (walkToward(p, a.tx, a.tz, p.wspeed || 0.02)) { a.phase = 'do'; a.timer = 220 + Math.random() * 300; applySit(p, a); }
    return;
  }
  breatheSeated(p, t);
  if (a.read && p._book) p._book.rotation.z = Math.sin(t * 1.4 + (p.phase || 0)) * 0.12;   // turning the pages
  if (--a.timer <= 0) endAct(p);
}
function updatePersonLife(p, t) {
  if (typeof isNight === 'function' && isNight()) {          // dusk — wrap up and drift home
    if (p.act) { p.act.use === 'photo' ? endPhoto(p) : endAct(p); }
    updateWander(p); if (p.wstate === 'idle') idleHuman(p, t); return;
  }
  if (p.act) { runAct(p, t); return; }
  p._lifeCd = (p._lifeCd == null) ? 150 + Math.random() * 300 : p._lifeCd - 1;
  if (p._lifeCd <= 0 && p.wstate === 'idle') { p._lifeCd = 240 + Math.random() * 360; tryStartActivity(p); }
  if (!p.act) { updateWander(p); if (p.wstate === 'idle') idleHuman(p, t); }
}
