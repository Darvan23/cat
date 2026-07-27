// grayhouse.js — 🏛️ THE GRAY HOUSE: the presidential mansion on the north-west hill.
// Security turns everyone away… until the town elects you President. Inside it is HUGE —
// a marble grand hall, the Oval Office (with a national flag YOU choose), a kitchen wing,
// working staff — and the minimap swaps to the mansion's own floor plan while you're in.

const GRAY_SPOT = { x: -84, z: 54 };            // the far north-west hill — nothing else lives out here
const GRAY_W = 16.4, GRAY_D = 11.4;             // interior half-bounds (movement clamp uses these)

// ── The national flag: 8 designs painted on canvas — the President picks one ──
const FLAG_DESIGNS = [
  { name: 'Sunrise', draw(g, w, h) { g.fillStyle = '#e8762a'; g.fillRect(0, 0, w, h / 3); g.fillStyle = '#f0c020'; g.fillRect(0, h / 3, w, h / 3); g.fillStyle = '#3f8a4a'; g.fillRect(0, 2 * h / 3, w, h / 3); g.fillStyle = '#fff4d0'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.18, 0, 7); g.fill(); } },
  { name: 'Sky Band', draw(g, w, h) { g.fillStyle = '#2a5a9a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f0f4f8'; g.fillRect(0, h * 0.38, w, h * 0.24); g.fillStyle = '#f0c020'; g.font = 'bold ' + (h * 0.3) + 'px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', w / 2, h / 2 + 1); } },
  { name: 'Crimson Cross', draw(g, w, h) { g.fillStyle = '#b8302a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4efe4'; g.fillRect(w * 0.34, 0, w * 0.14, h); g.fillRect(0, h * 0.4, w, h * 0.2); } },
  { name: 'Emerald Dawn', draw(g, w, h) { g.fillStyle = '#2a6a3f'; g.fillRect(0, 0, w, h); g.fillStyle = '#f0c020'; g.beginPath(); g.moveTo(0, h); g.lineTo(w, 0); g.lineTo(w, h * 0.3); g.lineTo(w * 0.3, h); g.closePath(); g.fill(); } },
  { name: 'Royal Orb', draw(g, w, h) { g.fillStyle = '#4a2a6a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f0c020'; g.beginPath(); g.arc(w / 2, h / 2, h * 0.26, 0, 7); g.fill(); g.fillStyle = '#4a2a6a'; g.beginPath(); g.arc(w / 2 + h * 0.08, h / 2 - h * 0.06, h * 0.2, 0, 7); g.fill(); } },
  { name: 'Paw Nation', draw(g, w, h) { g.fillStyle = '#22304a'; g.fillRect(0, 0, w, h); g.fillStyle = '#f4efe4'; g.beginPath(); g.ellipse(w / 2, h * 0.62, h * 0.2, h * 0.16, 0, 0, 7); g.fill(); [[-0.22, -0.1], [-0.08, -0.2], [0.08, -0.2], [0.22, -0.1]].forEach(([dx, dy]) => { g.beginPath(); g.arc(w / 2 + dx * h, h * 0.62 + dy * h, h * 0.07, 0, 7); g.fill(); }); } },
  { name: 'Twin Pillars', draw(g, w, h) { g.fillStyle = '#f4efe4'; g.fillRect(0, 0, w, h); g.fillStyle = '#b8302a'; g.fillRect(0, 0, w * 0.3, h); g.fillRect(w * 0.7, 0, w * 0.3, h); } },
  { name: 'Night Star', draw(g, w, h) { g.fillStyle = '#141a2e'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8ecf4'; g.beginPath(); g.arc(w * 0.38, h * 0.45, h * 0.2, 0, 7); g.fill(); g.fillStyle = '#141a2e'; g.beginPath(); g.arc(w * 0.44, h * 0.41, h * 0.17, 0, 7); g.fill(); g.fillStyle = '#f0c020'; g.font = 'bold ' + (h * 0.22) + 'px Georgia'; g.textAlign = 'center'; g.fillText('★', w * 0.62, h * 0.5); } },
];
const _flagMats = [];                            // every flying flag re-paints when the choice changes
function flagTexture(i) {
  const c = document.createElement('canvas'); c.width = 96; c.height = 64;
  FLAG_DESIGNS[(i || 0) % FLAG_DESIGNS.length].draw(c.getContext('2d'), 96, 64);
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 2;
  return tex;
}
function makeFlagMesh(scale) {
  const m = new THREE.MeshStandardMaterial({ map: flagTexture(state.countryFlag || 0), roughness: 0.75, side: THREE.DoubleSide });
  _flagMats.push(m);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2 * (scale || 1), 0.8 * (scale || 1)), m);
  mesh.castShadow = true;
  return mesh;
}
function applyCountryFlag() {
  _flagMats.forEach(m => { const old = m.map; m.map = flagTexture(state.countryFlag || 0); m.needsUpdate = true; if (old) old.dispose(); });
}

// ── The mansion in town (exterior) ──
function buildGrayHouse() {
  const g = new THREE.Group();
  const white = pbr(0xe8e8ea, 0.85), gray = pbr(0xc9ccd2, 0.9), dark = pbr(0x8a8f98, 0.85);
  const B = (w, h, d, m, x, y, z) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
  B(16, 6, 8, gray, 0, 3, 0);                                            // main block
  B(5.5, 5, 7, white, -10, 2.5, 0.4); B(5.5, 5, 7, white, 10, 2.5, 0.4); // wings
  B(17, 0.6, 8.6, white, 0, 6.3, 0);                                     // cornice
  B(6.4, 1.6, 0.4, white, 0, 7.0, 3.6);                                  // pediment base
  const ped = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.6, 3), white); ped.rotation.z = 0; ped.rotation.y = Math.PI / 2; ped.scale.set(0.4, 1, 2.2); ped.position.set(0, 7.6, 3.55); ped.castShadow = true; g.add(ped);
  [-2.7, -0.9, 0.9, 2.7].forEach(px => { const col = new THREE.Mesh(G.cyl(0.32, 0.36, 5.6), white); col.position.set(px, 2.8, 4.2); col.castShadow = true; g.add(col); });
  B(2.2, 3.2, 0.3, pbr(0x3a2e22, 0.7), 0, 1.6, 4.06);                    // grand door
  [-6, -3.6, 3.6, 6].forEach(px => { B(1.4, 1.8, 0.2, mat.window, px, 3.4, 4.06); B(1.4, 1.8, 0.2, mat.window, px, 1.4, 4.06); });
  if (typeof makeTextSign === 'function') {
    B(7.6, 1.15, 0.2, new THREE.MeshStandardMaterial({ map: makeTextSign('🏛️ GRAY HOUSE', '#3a3f48', '#f0f2f6', 460, 84), roughness: 0.55, emissive: 0x14161c, emissiveIntensity: 0.35 }), 0, 5.3, 4.14);
  }
  // rooftop flag
  const pole = new THREE.Mesh(G.cyl(0.06, 0.06, 3.4), dark); pole.position.set(0, 8.6, 0); pole.castShadow = true; g.add(pole);
  const roofFlag = makeFlagMesh(1.6); roofFlag.position.set(1.0, 9.6, 0); g.add(roofFlag);
  // front fence + gate posts
  [-1, 1].forEach(s => { B(6.4, 1.0, 0.18, white, s * 5.2, 0.5, 7.2); });
  [-8.4, -2, 2, 8.4].forEach(px => B(0.4, 1.4, 0.4, gray, px, 0.7, 7.2));
  g.position.set(GRAY_SPOT.x, 0, GRAY_SPOT.z);
  g.rotation.y = Math.PI;                                                 // door faces the town (south)
  scene.add(g);
  worldColliders.push({ type: 'box', x0: GRAY_SPOT.x - 13, x1: GRAY_SPOT.x + 13, z0: GRAY_SPOT.z - 4.5, z1: GRAY_SPOT.z + 4.5 });
  // the security detail at the gate
  state.grayGuards = [];
  [-2.6, 2.6].forEach(gx => {
    const cfg = { skin: 0xd9a884, hair: 0x1a1a1a, hairStyle: 'short', glasses: true, shirt: 0x22242c, pants: 0x1a1c24, height: 1.06, build: 'avg', eye: 0x2a1a12 };
    const { group, parts } = buildHuman(cfg);
    group.position.set(GRAY_SPOT.x + gx, 0, GRAY_SPOT.z - 7.4);
    group.rotation.y = Math.PI;                                           // facing visitors
    scene.add(group);
    state.grayGuards.push({ group, parts, phase: Math.random() * 6 });
  });
}
function updateGrayGuards(t) {
  (state.grayGuards || []).forEach(gd => { if (gd.group.visible) idleHuman(gd, t); });
}

// ── Entering: the security gate ──
function tryEnterGrayHouse() {
  if (state.politics && state.politics.phase === 'president') { enterGrayHouse(); return; }
  if (typeof sfx === 'function') sfx('sad');
  showDialogue('🕶️ Security', 'Halt. The Gray House is the residence of the PRESIDENT. Come back when the town elects you… if it ever does.', 5200);
}

// ── The interior: a scene of its own, because it is HUGE ──
let grayScene = null;
const grayColliders = [];
let _grayBuilt = false;
function buildGrayInterior() {
  if (_grayBuilt) return;
  _grayBuilt = true;
  grayScene = new THREE.Scene();
  grayScene.background = new THREE.Color(0x2a2c34);
  const S = grayScene;
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const B = (w, h, d, m, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); me.position.set(x, y, z); return me; };
  const CY = (rt, rb, hh, s, m, x, y, z) => { const me = add(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, hh, s), m)); me.position.set(x, y, z); return me; };
  const marble = pbr(0xdfe0e4, 0.35), wallM = pbr(0xe8e4da, 0.95), trimM = pbr(0xc8b070, 0.5, 0.3);
  const wood = pbr(0x5a4028, 0.7), woodDark = pbr(0x3d2c1c, 0.75), redCarpet = pbr(0x9a2a34, 0.95);
  const W = GRAY_W + 0.6, D = GRAY_D + 0.6, WH = 4.6;
  add(new THREE.Mesh(new THREE.BoxGeometry(W * 2, 0.1, D * 2), marble)).position.set(0, -0.05, 0);   // marble floor
  B(W * 2, WH, 0.3, wallM, 0, WH / 2, -D); B(W * 2, WH, 0.3, wallM, 0, WH / 2, D);                    // walls (door gap is visual only)
  B(0.3, WH, D * 2, wallM, -W, WH / 2, 0); B(0.3, WH, D * 2, wallM, W, WH / 2, 0);
  B(W * 2, 0.5, 0.34, trimM, 0, 0.25, -D + 0.02); B(W * 2, 0.5, 0.34, trimM, 0, 0.25, D - 0.02);      // gold skirting
  // interior partitions: Oval Office (west), Kitchen (east) — each with a doorway
  [[-6.5, -1], [6.5, 1]].forEach(([wx]) => {
    B(0.3, WH, 8.2, wallM, wx, WH / 2, -D + 4.1);
    B(0.3, WH, 5.4, wallM, wx, WH / 2, D - 2.7);
    grayColliders.push({ type: 'box', x0: wx - 0.3, x1: wx + 0.3, z0: -D, z1: -D + 8.2 });
    grayColliders.push({ type: 'box', x0: wx - 0.3, x1: wx + 0.3, z0: D - 5.4, z1: D });
  });
  grayColliders.push({ type: 'box', x0: -W - 0.4, x1: -W, z0: -D, z1: D }, { type: 'box', x0: W, x1: W + 0.4, z0: -D, z1: D });
  grayColliders.push({ type: 'box', x0: -W, x1: W, z0: -D - 0.4, z1: -D }, { type: 'box', x0: -W, x1: W, z0: D, z1: D + 0.4 });
  // the red carpet: door → grand hall centre
  add(new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 14), redCarpet)).position.set(0, 0.03, D - 7);
  CY(3.4, 3.4, 0.06, 28, redCarpet, 0, 0.03, -3);                                                     // round rug at the hall's heart
  // columns + chandeliers
  [[-3.6, -6], [3.6, -6], [-3.6, 2], [3.6, 2]].forEach(([cx, cz]) => {
    CY(0.34, 0.4, WH, 16, wallM, cx, WH / 2, cz);
    grayColliders.push({ type: 'circle', x: cx, z: cz, r: 0.5 });
  });
  [[0, -3], [0, 6]].forEach(([cx, cz]) => {
    CY(0.04, 0.04, 1.2, 6, trimM, cx, WH - 0.6, cz);
    const orb = add(new THREE.Mesh(G.sph(0.34, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd070, emissiveIntensity: 1.1, roughness: 0.4 })));
    orb.position.set(cx, WH - 1.3, cz);
    const pl = new THREE.PointLight(0xffeecf, 0.7, 30, 2); pl.position.set(cx, WH - 1.5, cz); S.add(pl);
  });
  S.add(new THREE.AmbientLight(0xfff2e8, 0.6));
  S.add(new THREE.HemisphereLight(0xfff4ee, 0x3a3630, 0.5));

  // ── The OVAL OFFICE (west wing) ──
  CY(3.1, 3.1, 0.05, 30, pbr(0x2e4a6a, 0.9), -11.5, 0.03, -3);                                        // the oval rug
  const desk = add(new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.9, 24, 1, false, 0, Math.PI), woodDark)); // the curved Resolute desk
  desk.position.set(-11.5, 0.45, -4.4); desk.rotation.y = Math.PI;
  grayColliders.push({ type: 'box', x0: -13.4, x1: -9.6, z0: -6.3, z1: -4.2 });
  B(1.1, 1.5, 0.9, pbr(0x3a2a4a, 0.6), -11.5, 0.75, -6.1);                                            // the President's chair
  [[-13.2, -7.4], [-9.8, -7.4]].forEach(([fx, fz]) => {                                               // twin flags behind the desk
    CY(0.05, 0.05, 3, 8, trimM, fx, 1.5, fz);
    const fl = makeFlagMesh(1.1); fl.position.set(fx + 0.55, 2.55, fz); S.add(fl); fl.castShadow = true;
    grayColliders.push({ type: 'circle', x: fx, z: fz, r: 0.3 });
  });
  B(3.6, 2.4, 0.3, wood, -14.8, 1.2, 1.6);                                                            // bookcase
  grayColliders.push({ type: 'box', x0: -16.6, x1: -13, z0: 1.4, z1: 1.9 });

  // ── The KITCHEN (east wing) ──
  B(6.8, 1.0, 1.2, pbr(0xb8bcc2, 0.5, 0.2), 12.6, 0.5, -7.4);                                         // steel counter run
  B(1.4, 1.3, 1.1, pbr(0x8a8f98, 0.5, 0.3), 9.4, 0.65, -7.4);                                         // stove
  B(1.3, 2.2, 1.1, pbr(0xdfe0e4, 0.55), 15.4, 1.1, -7.35);                                            // fridge
  grayColliders.push({ type: 'box', x0: 8.6, x1: 16.2, z0: -8.2, z1: -6.7 });
  B(4.4, 0.9, 1.8, wood, 11.5, 0.45, -1);                                                             // prep table
  grayColliders.push({ type: 'box', x0: 9.2, x1: 13.8, z0: -2, z1: 0 });

  // ── staff desks along the hall's north wall ──
  [[-3.4, -9.4], [0, -9.4], [3.4, -9.4]].forEach(([dx, dz]) => {
    B(2.4, 0.85, 1.1, wood, dx, 0.42, dz);
    grayColliders.push({ type: 'box', x0: dx - 1.3, x1: dx + 1.3, z0: dz - 0.7, z1: dz + 0.7 });
  });
  // portraits of past presidents (cats, naturally)
  [-5, 0, 5].forEach(px => { B(1.5, 1.9, 0.1, wood, px, 2.7, -D + 0.24); B(1.2, 1.6, 0.08, pbr(0xd8c8a8, 0.9), px, 2.7, -D + 0.3); });
  // the staff, hard at work
  state.grayPeople = [];
  const staffCfg = [
    { x: -3.4, z: -8.3, ry: Math.PI, cfg: { skin: 0xe8b890, hair: 0x3a2a1a, hairStyle: 'bun', shirt: 0x4a5568, pants: 0x2e3440, height: 0.98, build: 'avg', eye: 0x3a2a1a } },
    { x: 0, z: -8.3, ry: Math.PI, cfg: { skin: 0x8a5a3a, hair: 0x141414, hairStyle: 'short', glasses: true, shirt: 0x50586a, pants: 0x2e3440, height: 1.03, build: 'avg', eye: 0x2a1a12 } },
    { x: 3.4, z: -8.3, ry: Math.PI, cfg: { skin: 0xf0c8a0, hair: 0x8a6a3a, hairStyle: 'long', shirt: 0x4a5568, pants: 0x2e3440, height: 0.96, build: 'slim', eye: 0x3a5a3a } },
    { x: 12.6, z: -5.8, ry: Math.PI, cfg: { skin: 0xe0a878, hair: 0x6b4a2a, hairStyle: 'short', apron: true, apronColor: 0xf2f2f2, shirt: 0xb05548, pants: 0x4a4030, height: 1.05, build: 'round', eye: 0x4a3a22 } },   // the chef
    { x: -11.5, z: -1, ry: 0.4, cfg: { skin: 0xd9a884, hair: 0x1a1a1a, hairStyle: 'short', glasses: true, shirt: 0x22242c, pants: 0x1a1c24, height: 1.06, build: 'avg', eye: 0x2a1a12 } },   // oval office security
  ];
  staffCfg.forEach(sd => {
    const { group, parts } = buildHuman(sd.cfg);
    group.position.set(sd.x, 0, sd.z); group.rotation.y = sd.ry;
    S.add(group);
    state.grayPeople.push({ group, parts, phase: Math.random() * 6 });
  });
}

function enterGrayHouse() {
  buildGrayInterior();
  state.inGray = true;
  grayScene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_IN);
  catGroup.position.set(0, 0, GRAY_D - 1.2); catGroup.rotation.y = Math.PI;
  state.camYaw = 0; state.camHeight = 5.5; state.camDist = 6.5;
  camera.position.set(0, state.camHeight, GRAY_D - 1.2 + state.camDist);
  document.getElementById('minimap').style.display = 'block';   // the minimap STAYS — it shows the mansion's floor plan
  if (typeof sfx === 'function') sfx('door');
  if (!state._seenGray) { state._seenGray = true; showDialogue('🏛️ The Gray House', 'Welcome home, President ' + (state.catName || '') + '. The nation is watching. 🐾', 5600); }
}
function exitGrayHouse() {
  state.inGray = false;
  scene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_OUT);
  catGroup.position.set(GRAY_SPOT.x, 0, GRAY_SPOT.z - 8.5); catGroup.rotation.y = Math.PI;
  if (typeof sfx === 'function') sfx('door');
}

// per-frame interior life (called from the render loop while inside)
function updateGrayFrame(t) {
  (state.grayPeople || []).forEach(p => idleHuman(p, t));
}

// ── The flag picker (Oval Office context action) ──
function openFlagPicker() {
  state.uiOpen = true;
  let h = '<div class="modal-sub">The flag of your nation flies on the Gray House and behind your desk. Choose wisely, President.</div><div class="co-grid">';
  FLAG_DESIGNS.forEach((f, i) => {
    const c = document.createElement('canvas'); c.width = 96; c.height = 64; f.draw(c.getContext('2d'), 96, 64);
    h += `<button onclick="pickCountryFlag(${i})" style="${(state.countryFlag || 0) === i ? 'outline:3px solid #f0c060;' : ''}"><img src="${c.toDataURL()}" style="width:72px;height:48px;border-radius:4px"><small>${f.name}</small></button>`;
  });
  h += '</div>';
  document.getElementById('checkout-title').textContent = '🚩 The National Flag';
  document.getElementById('checkout-body').innerHTML = h + '<button class="modal-close" onclick="closeCheckout()">Close</button>';
  document.getElementById('checkout').classList.add('show');
}
function pickCountryFlag(i) {
  state.countryFlag = i;
  applyCountryFlag();
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif('🚩 The nation flies the "' + FLAG_DESIGNS[i].name + '" — long may it wave!');
  if (typeof saveGame === 'function') saveGame();
  closeCheckout();
  state.uiOpen = false;
}

// ── The mansion minimap: the floor plan replaces the town while you're inside ──
function drawGrayMinimap(ctx, cv) {
  const Dm = cv.width;
  ctx.fillStyle = '#2e3038'; ctx.fillRect(0, 0, Dm, Dm);
  const sx = Dm / (GRAY_W * 2 + 2), sz = Dm / (GRAY_D * 2 + 2);
  const X = x => Dm / 2 + x * sx, Z = z => Dm / 2 + z * sz;
  const room = (x0, z0, x1, z1, col) => { ctx.fillStyle = col; ctx.fillRect(X(x0), Z(z0), (x1 - x0) * sx, (z1 - z0) * sz); ctx.strokeStyle = '#8a8f98'; ctx.lineWidth = 2; ctx.strokeRect(X(x0), Z(z0), (x1 - x0) * sx, (z1 - z0) * sz); };
  room(-GRAY_W, -GRAY_D, -6.5, GRAY_D, '#3a4256');       // oval office wing
  room(-6.5, -GRAY_D, 6.5, GRAY_D, '#414653');           // grand hall
  room(6.5, -GRAY_D, GRAY_W, GRAY_D, '#4a4440');         // kitchen wing
  ctx.fillStyle = '#9a2a34'; ctx.fillRect(X(-1.6), Z(GRAY_D - 14), 3.2 * sx, 14 * sz);   // the red carpet
  ctx.fillStyle = '#dfe3ec'; ctx.font = 'bold 22px Georgia'; ctx.textAlign = 'center';
  ctx.fillText('OVAL', X(-11.5), Z(0)); ctx.fillText('HALL', X(0), Z(3)); ctx.fillText('KITCHEN', X(11.5), Z(0));
  ctx.fillStyle = '#f0c020'; ctx.fillRect(X(-13.5), Z(-7.8), 8, 8); ctx.fillRect(X(-10), Z(-7.8), 8, 8);   // the flags
  // you
  const cp = catGroup.position;
  ctx.fillStyle = '#f0b828'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(X(cp.x), Z(cp.z), 9, 0, 7); ctx.fill(); ctx.stroke();
}
