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
// ═══ THE GRAY HOUSE INTERIOR — four floors of government, one lift ═══
const GRAY_FLOORS = ['🏛️ Grand Lobby', '💻 Operations', '🤝 Meeting Floor', '🎩 Presidential Office'];
const _GF = f => f * 60;                                   // each floor lives 60 units apart in the same scene
const GRAY_LIFT = { x: 13.2, z: -8.6 };                    // lift alcove, same spot every floor

function buildGrayInterior() {
  if (_grayBuilt) return;
  _grayBuilt = true;
  grayScene = new THREE.Scene();
  grayScene.background = new THREE.Color(0x262a36);
  const S = grayScene;
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const B = (w, h, d, m, x, y, z, ry) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); me.position.set(x, y, z); if (ry) me.rotation.y = ry; return me; };
  const CY = (rt, rb, hh, s, m, x, y, z) => { const me = add(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, hh, s), m)); me.position.set(x, y, z); return me; };
  // a WARM palette — no more hospital white
  const wallM = pbr(0xd9c9a8, 0.92), wainscot = pbr(0x31415e, 0.85), trimM = pbr(0xc8a860, 0.5, 0.3);
  const wood = pbr(0x6a4c2c, 0.7), woodDark = pbr(0x40301e, 0.75), redCarpet = pbr(0x8e2732, 0.95);
  const navyCarpet = pbr(0x2c3a54, 0.95), screenM = () => new THREE.MeshStandardMaterial({ color: 0x9fd4ff, emissive: 0x4a90d8, emissiveIntensity: 0.9, roughness: 0.4 });
  const W = GRAY_W + 0.6, D = GRAY_D + 0.6, WH = 4.8;
  S.add(new THREE.AmbientLight(0xffeeda, 0.62));
  S.add(new THREE.HemisphereLight(0xfff2e0, 0x40382c, 0.5));
  state.grayPeople = [];
  state.grayDesks = [];                                     // hireable desks on the ops floor
  const staff = (fx, x, z, ry, cfg, role) => {
    const { group, parts } = buildHuman(cfg);
    group.position.set(fx + x, 0, z); group.rotation.y = ry;
    S.add(group);
    const p = { group, parts, phase: Math.random() * 6, role: role || 'idle', floor: fx, hx: fx + x, hz: z, hr: ry };
    state.grayPeople.push(p);
    return p;
  };

  // ── the shared shell: warm walls, wainscot, gold skirting, open south side, the lift ──
  for (let f = 0; f < 4; f++) {
    const fx = _GF(f);
    add(new THREE.Mesh(new THREE.BoxGeometry(W * 2, 0.1, D * 2), f === 0 ? pbr(0xd8d2c4, 0.4) : wood)).position.set(fx, -0.05, 0);
    B(W * 2, WH, 0.3, wallM, fx, WH / 2, -D);
    B(0.3, WH, D * 2, wallM, fx - W, WH / 2, 0);
    B(0.3, WH, D * 2, wallM, fx + W, WH / 2, 0);
    B(W * 2, 1.4, 0.36, wainscot, fx, 0.7, -D + 0.02);      // navy wainscot band
    [-1, 1].forEach(sd => B(0.36, 1.4, D * 2, wainscot, fx + sd * (W - 0.02), 0.7, 0));
    B(W * 2, 0.4, 0.4, trimM, fx, WH - 0.2, -D + 0.04);     // gold cornice
    // half ceiling over the back (dollhouse view from the south)
    add(new THREE.Mesh(new THREE.BoxGeometry(W * 2, 0.16, D + 2), pbr(0x483c2c, 0.9))).position.set(fx, WH, -D / 2 + 0.4);
    grayColliders.push(
      { type: 'box', x0: fx - W - 0.4, x1: fx - W, z0: -D, z1: D }, { type: 'box', x0: fx + W, x1: fx + W + 0.4, z0: -D, z1: D },
      { type: 'box', x0: fx - W, x1: fx + W, z0: -D - 0.4, z1: -D }, { type: 'box', x0: fx - W, x1: fx + W, z0: D, z1: D + 0.4 });
    // 🛗 the lift: gold doors, floor lamp, call plate
    B(2.6, 3.4, 0.5, pbr(0x8a733e, 0.4, 0.5), fx + GRAY_LIFT.x, 1.7, GRAY_LIFT.z - 1.3);
    B(0.1, 2.6, 0.06, pbr(0x40301e, 0.5), fx + GRAY_LIFT.x, 1.3, GRAY_LIFT.z - 1.02);
    if (typeof makeTextSign === 'function') {
      const fs = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.44, 0.08), new THREE.MeshStandardMaterial({ map: makeTextSign('🛗 FLOOR ' + (f + 1), '#31415e', '#ffe9c0', 170, 46), roughness: 0.6 }));
      fs.position.set(fx + GRAY_LIFT.x, 3.7, GRAY_LIFT.z - 1.28); S.add(fs);
    }
    grayColliders.push({ type: 'box', x0: fx + GRAY_LIFT.x - 1.4, x1: fx + GRAY_LIFT.x + 1.4, z0: GRAY_LIFT.z - 1.6, z1: GRAY_LIFT.z - 1.0 });
    // windows with navy curtains along the north wall
    [-9, -3, 3, 9].forEach(wx2 => {
      if (f === 0 && wx2 === 3) return;
      const win = add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xbdd8ea, emissive: 0x5a7a94, emissiveIntensity: 0.35, roughness: 0.4 })));
      win.position.set(fx + wx2, 2.5, -D + 0.22);
      [-1.15, 1.15].forEach(cd => B(0.34, 2.6, 0.12, navyCarpet, fx + wx2 + cd, 2.5, -D + 0.24));
    });
    // warm ceiling globes
    [[-6, -4], [6, -4], [0, 4]].forEach(([cx, cz]) => {
      const orb = add(new THREE.Mesh(G.sph(0.3, 14, 10), new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd070, emissiveIntensity: 1.0, roughness: 0.4 })));
      orb.position.set(fx + cx, WH - 0.8, cz);
      if (f < 2 || cz < 0) { const pl = new THREE.PointLight(0xffe9c8, 0.55, 26, 2); pl.position.set(fx + cx, WH - 1.1, cz); S.add(pl); }
    });
  }

  buildGrayFloors(add, B, CY, staff, { wallM, wainscot, trimM, wood, woodDark, redCarpet, navyCarpet, screenM });
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
function drawGrayMinimap(g, canvas) {
  const D2 = canvas.width, f = state.grayFloor || 0, fx = _GF(f);
  g.fillStyle = '#2a2436'; g.fillRect(0, 0, D2, D2);
  g.strokeStyle = '#c8a860'; g.lineWidth = 3; g.strokeRect(20, 42, D2 - 40, D2 - 84);
  const MX = x => D2 / 2 + (x - fx) * ((D2 - 56) / 34), MZ = z => D2 / 2 + z * ((D2 - 100) / 24);
  g.font = '13px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('🛗', MX(fx + GRAY_LIFT.x), MZ(GRAY_LIFT.z));
  if (f === 0) { g.fillText('🛎️', MX(fx), MZ(-6)); g.fillText('🔥', MX(fx - 15), MZ(-4)); g.fillText('🛋️', MX(fx - 10.5), MZ(0)); g.fillText('🚩', MX(fx), MZ(6)); }
  if (f === 1) { g.fillText('🖥️', MX(fx - 5), MZ(-4)); g.fillText('🗄️', MX(fx + 14), MZ(-2)); g.fillText('🧑‍💼', MX(fx - 2), MZ(1)); }
  if (f === 2) { g.fillText('🤝', MX(fx - 2), MZ(-1.5)); g.fillText('🎤', MX(fx - 10.5), MZ(4)); g.fillText('📊', MX(fx - 3), MZ(-8)); }
  if (f === 3) { g.fillText('🖥️', MX(fx - 4), MZ(-4.5)); g.fillText('📞', MX(fx - 1.9), MZ(-4.5)); g.fillText('🚩', MX(fx - 3), MZ(-7)); g.fillText('🌍', MX(fx + 6), MZ(-5.5)); }
  (state.grayPeople || []).forEach(p => { const px = p.group.position.x; if (Math.abs(px - fx) < 18) g.fillText('·', MX(px), MZ(p.group.position.z)); });
  const cp = catGroup.position;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(MX(cp.x), MZ(cp.z), 5, 0, 7); g.fill();
  g.fillStyle = '#e05a4a'; g.beginPath(); g.arc(MX(cp.x), MZ(cp.z), 3.4, 0, 7); g.fill();
  g.fillStyle = '#e8d8b0'; g.font = 'bold 10px sans-serif';
  g.fillText(GRAY_FLOORS[f] + '  ·  ' + (f + 1) + '/4', D2 / 2, 16);
}
function buildGrayFloors(add, B, CY, staff, M2) {
  const { wallM, trimM, wood, woodDark, redCarpet, navyCarpet, screenM } = M2;
  const W = GRAY_W + 0.6, D = GRAY_D + 0.6, WH = 4.8;
  const S = grayScene;
  const suit = (skin, hair, style, extra) => Object.assign({ skin, hair, hairStyle: style, shirt: 0x3a4458, pants: 0x262c3a, height: 1.0, build: 'avg', eye: 0x2a1a12 }, extra || {});

  // ═ FLOOR 1 — THE GRAND LOBBY ═
  {
    const fx = _GF(0);
    add(new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.06, 15), redCarpet)).position.set(fx, 0.03, D - 7.5);
    CY(3.6, 3.6, 0.06, 30, redCarpet, fx, 0.03, -2);
    [[-4.5, -6], [4.5, -6], [-4.5, 2.5], [4.5, 2.5]].forEach(([cx, cz]) => { CY(0.34, 0.42, WH, 16, wallM, fx + cx, WH / 2, cz); grayColliders.push({ type: 'circle', x: fx + cx, z: cz, r: 0.52 }); });
    // reception desk, curved, centre-north
    const rd = add(new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 1.0, 24, 1, false, Math.PI, Math.PI), woodDark)); rd.position.set(fx, 0.5, -6.2);
    B(5.2, 0.12, 1.0, trimM, fx, 1.04, -6.2);
    grayColliders.push({ type: 'box', x0: fx - 2.7, x1: fx + 2.7, z0: -7.2, z1: -5.4 });
    if (typeof makeTextSign === 'function') { const ws = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.8, 0.1), new THREE.MeshStandardMaterial({ map: makeTextSign('🏛️ THE GRAY HOUSE', '#31415e', '#ffe9c0', 340, 62), roughness: 0.5 })); ws.position.set(fx + 3, 3.1, -D + 0.26); S.add(ws); }
    // lounge west: two sofas + fireplace
    [[-1.4, 0.6], [1.4, 0.6]].forEach(([dz, ry]) => { B(2.6, 0.55, 1.0, navyCarpet, fx - 10.5, 0.45, dz * 2, ry * Math.PI); B(2.6, 0.8, 0.3, navyCarpet, fx - 10.5 - (dz > 0 ? -0 : 0), 0.9, dz * 2 - 0.5); });
    grayColliders.push({ type: 'box', x0: fx - 12, x1: fx - 9, z0: -3.6, z1: 3.4 });
    B(2.4, 2.2, 0.5, pbr(0x5a4438, 0.9), fx - W + 0.5, 1.1, -4);
    const fire = add(new THREE.Mesh(G.cone(0.4, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0xff9840, emissive: 0xe86820, emissiveIntensity: 1.6 }))); fire.position.set(fx - W + 0.62, 0.5, -4); state._grayFire = fire;
    // portraits of past presidents (cats, naturally)
    [-7, 0, 7].forEach(px => { B(1.5, 1.9, 0.1, wood, fx + px - 3, 2.8, -D + 0.24); B(1.2, 1.6, 0.08, pbr(0xcbb896, 0.9), fx + px - 3, 2.8, -D + 0.3); });
    // twin flags flanking the carpet
    [[-2.2, 6], [2.2, 6]].forEach(([px, pz]) => { CY(0.05, 0.05, 3, 8, trimM, fx + px, 1.5, pz); const fl = makeFlagMesh(1.1); fl.position.set(fx + px + 0.55, 2.55, pz); S.add(fl); });
    staff(fx, 0, -5.0, 0, suit(0xf0c8a0, 0x6a4a2a, 'bun', { shirt: 0x8e2732 }), 'reception');   // Iris on the front desk
    staff(fx, -10.4, 1.2, Math.PI / 2, suit(0x8a5a3a, 0x141414, 'short', { glasses: true }), 'wander');
  }

  // ═ FLOOR 2 — OPERATIONS (the room full of computers) ═
  {
    const fx = _GF(1);
    add(new THREE.Mesh(new THREE.BoxGeometry(24, 0.05, 16), navyCarpet)).position.set(fx, 0.03, -1);
    // the big wall board
    B(9, 3, 0.16, pbr(0x1c2230, 0.6), fx - 5, 2.4, -D + 0.3);
    const big = add(new THREE.Mesh(new THREE.BoxGeometry(8.4, 2.4, 0.06), screenM())); big.position.set(fx - 5, 2.4, -D + 0.4); state._grayBigScreen = big;
    // server racks east wall, lights blinking
    state._grayRacks = [];
    for (let r = 0; r < 4; r++) {
      B(1.1, 3.0, 0.8, pbr(0x232833, 0.5, 0.3), fx + W - 1.4, 1.5, -7 + r * 2.2);
      for (let k = 0; k < 4; k++) { const led = add(new THREE.Mesh(G.sph(0.05, 6, 5), new THREE.MeshStandardMaterial({ color: 0x50e070, emissive: 0x28c048, emissiveIntensity: 1.4 }))); led.position.set(fx + W - 1.95, 0.6 + k * 0.62, -7 + r * 2.2); state._grayRacks.push(led); }
      grayColliders.push({ type: 'box', x0: fx + W - 2, x1: fx + W - 0.8, z0: -7.5 + r * 2.2, z1: -6.5 + r * 2.2 });
    }
    // eight desks in two rows — three staffed, five FOR HIRE from the treasury
    const deskSpots = [];
    for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) deskSpots.push([fx - 9 + col * 4.6, -4.5 + row * 5]);
    deskSpots.forEach(([dx, dz], i) => {
      B(2.6, 0.85, 1.2, wood, dx, 0.42, dz);
      const mon = add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.62, 0.08), pbr(0x232833, 0.5))); mon.position.set(dx, 1.25, dz - 0.1);
      const scr = add(new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.5, 0.04), screenM())); scr.position.set(dx, 1.25, dz - 0.05); scr.material.emissiveIntensity = 0.4;
      grayColliders.push({ type: 'box', x0: dx - 1.4, x1: dx + 1.4, z0: dz - 0.75, z1: dz + 0.75 });
      if (i < 3) staff(0, dx, dz + 1.15, Math.PI, suit([0xe8b890, 0x8a5a3a, 0xd9a884][i], [0x3a2a1a, 0x141414, 0x8a6a3a][i % 3], i % 2 ? 'short' : 'bun', { glasses: i === 1 }), 'typing');
      else { state.grayDesks.push({ x: dx, z: dz, hired: false, screen: scr }); scr.material.emissiveIntensity = 0.05; }   // dark screen until someone's hired
    });
  }

  // ═ FLOOR 3 — THE MEETING FLOOR ═
  {
    const fx = _GF(2);
    add(new THREE.Mesh(new THREE.BoxGeometry(26, 0.05, 17), pbr(0x584434, 0.85))).position.set(fx - 1, 0.03, -0.5);
    // the long table + ten chairs
    B(10.5, 0.16, 3.0, woodDark, fx - 2, 0.92, -1.5);
    [[-2]].forEach(() => {});
    CY(0.3, 0.4, 0.92, 10, woodDark, fx - 6, 0.46, -1.5); CY(0.3, 0.4, 0.92, 10, woodDark, fx + 2, 0.46, -1.5);
    grayColliders.push({ type: 'box', x0: fx - 7.4, x1: fx + 3.4, z0: -3.1, z1: 0.1 });
    for (let c = 0; c < 5; c++) [-1, 1].forEach(sd => { const ch = B(0.8, 0.5, 0.8, navyCarpet, fx - 6 + c * 2, 0.45, -1.5 + sd * 2.3); B(0.8, 0.9, 0.2, navyCarpet, fx - 6 + c * 2, 0.95, -1.5 + sd * 2.3 + (sd > 0 ? 0.3 : -0.3)); });
    // wall chart screen + whiteboard
    const chart = add(new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.6, 0.08), screenM())); chart.position.set(fx - 3, 2.5, -D + 0.34); state._grayChart = chart;
    B(3.2, 2.0, 0.1, pbr(0xf2ede2, 0.6), fx + 5.5, 2.2, -D + 0.3);
    [[-0.8, 0.35], [0.2, -0.2], [-0.2, 0.05]].forEach(([lx, ly]) => B(1.2 + lx * 0.4, 0.07, 0.02, pbr(0xc84a4a, 0.6), fx + 5.5 + lx, 2.2 + ly, -D + 0.36));
    // press corner: podium + backdrop flags
    B(1.1, 1.3, 0.8, woodDark, fx - 10.5, 0.65, 4);
    CY(0.02, 0.02, 0.5, 6, pbr(0x232833, 0.5), fx - 10.2, 1.55, 4);
    grayColliders.push({ type: 'box', x0: fx - 11.1, x1: fx - 9.9, z0: 3.5, z1: 4.5 });
    [[-12, 2.4], [-9, 2.4]].forEach(([px, pz]) => { CY(0.05, 0.05, 3, 8, trimM, fx + px, 1.5, pz); const fl = makeFlagMesh(1.0); fl.position.set(fx + px + 0.5, 2.5, pz); S.add(fl); });
    // water cooler
    CY(0.22, 0.26, 1.1, 10, pbr(0x9ad0e8, 0.4), fx + 9, 0.55, 3.5);
    // four aides mid-meeting
    for (let c = 0; c < 4; c++) staff(0, fx - 6 + c * 2.4, -1.5 + (c % 2 ? 2.6 : -2.6), c % 2 ? Math.PI : 0, suit([0xe8b890, 0x8a5a3a, 0xf0c8a0, 0xd9a884][c], [0x3a2a1a, 0x141414, 0x8a6a3a, 0x6b4a2a][c], c % 2 ? 'bun' : 'short', c === 2 ? { glasses: true } : null), 'meeting');
  }

  // ═ FLOOR 4 — THE PRESIDENTIAL OFFICE ═
  {
    const fx = _GF(3);
    CY(4.2, 4.2, 0.05, 32, pbr(0x2e4a6a, 0.9), fx - 3, 0.03, -2);                                 // the great oval rug
    B(0.5, 0.5, 0.5, trimM, fx - 3, 0.05, -2);
    // the Resolute desk + the President's chair + computer + THE RED PHONE
    const desk = add(new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.95, 24, 1, false, 0, Math.PI), woodDark));
    desk.position.set(fx - 3, 0.48, -4.2); desk.rotation.y = Math.PI;
    grayColliders.push({ type: 'box', x0: fx - 5.2, x1: fx - 0.8, z0: -6.2, z1: -4.0 });
    B(1.2, 1.6, 0.95, pbr(0x3a2a4a, 0.6), fx - 3, 0.8, -6.0);
    const mon = add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 0.08), pbr(0x232833, 0.5))); mon.position.set(fx - 4.1, 1.45, -4.6); mon.rotation.y = 0.4;
    const scr = add(new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.56, 0.04), screenM())); scr.position.set(fx - 4.08, 1.45, -4.55); scr.rotation.y = 0.4; state._grayPCScreen = scr;
    B(0.34, 0.14, 0.22, pbr(0xc23a3a, 0.4), fx - 1.9, 1.02, -4.5);                                 // the red phone!
    CY(0.03, 0.16, 0.12, 8, pbr(0xc23a3a, 0.4), fx - 1.9, 1.14, -4.5);
    // twin flags + bookcases + globe + sofa
    [[-5.4, -7.2], [-0.6, -7.2]].forEach(([px, pz]) => {
      CY(0.05, 0.05, 3, 8, trimM, fx + px, 1.5, pz);
      const fl = makeFlagMesh(1.1); fl.position.set(fx + px + 0.55, 2.55, pz); S.add(fl);
      grayColliders.push({ type: 'circle', x: fx + px, z: pz, r: 0.3 });
    });
    [[-9.5], [-7.1]].forEach(([bx2]) => { B(2.2, 2.6, 0.5, wood, fx + bx2, 1.3, -D + 0.5); for (let sh = 0; sh < 3; sh++) B(1.9, 0.16, 0.4, woodDark, fx + bx2, 0.7 + sh * 0.75, -D + 0.52); });
    grayColliders.push({ type: 'box', x0: fx - 10.8, x1: fx - 5.9, z0: -D + 0.2, z1: -D + 0.85 });
    CY(0.05, 0.05, 1.1, 8, trimM, fx + 6, 0.55, -5.5);
    const globe = add(new THREE.Mesh(G.sph(0.45, 16, 12), pbr(0x4a90c8, 0.5))); globe.position.set(fx + 6, 1.35, -5.5); state._grayGlobe = globe;
    [[0.2, -0.1], [-0.3, 0.25], [0.1, 0.3]].forEach(([gx, gy]) => { const land = add(new THREE.Mesh(G.sph(0.16, 8, 6), pbr(0x6aa050, 0.7))); land.scale.set(1.3, 0.8, 0.4); land.position.set(fx + 6 + gx * 0.4, 1.35 + gy * 0.4, -5.2); });
    B(2.8, 0.55, 1.1, redCarpet, fx + 6, 0.45, 1.5); B(2.8, 0.85, 0.3, redCarpet, fx + 6, 0.95, 0.95);
    grayColliders.push({ type: 'box', x0: fx + 4.5, x1: fx + 7.5, z0: 0.7, z1: 2.2 });
    staff(0, fx + 2.5, -2, 2.6, suit(0xd9a884, 0x1a1a1a, 'short', { glasses: true, shirt: 0x22242c, pants: 0x1a1c24, height: 1.06 }), 'security');
  }
  // restore any analysts hired in an earlier session
  for (let i = 0; i < (state.grayHired || 0) && i < state.grayDesks.length; i++) hireAnalystAt(i, true);
}

// ── in, out, and up: the lift ──
function enterGrayHouse() {
  buildGrayInterior();
  state.inGray = true;
  state.grayFloor = 0;
  grayScene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_IN);
  catGroup.position.set(0, 0, GRAY_D - 1.2); catGroup.rotation.y = Math.PI;
  state.camYaw = 0; state.camHeight = 5.5; state.camDist = 6.5;
  camera.position.set(0, state.camHeight, GRAY_D - 1.2 + state.camDist);
  document.getElementById('minimap').style.display = 'block';
  state._grayGreeted = false;                              // Iris will come and welcome you
  if (typeof sfx === 'function') sfx('door');
  // 🎩 the PRESIDENTIAL CAR — delivered the first time the President comes home
  if (state.politics && state.politics.phase === 'president' && typeof CAR_STYLES !== 'undefined' && !(state.myCars || []).includes('presidential')) {
    state.myCars = state.myCars || [];
    state.myCars.push('presidential');
    state.activeCar = 'presidential';
    if (typeof parkCarAt === 'function') parkCarAt(GRAY_SPOT.x + 16, GRAY_SPOT.z - 10, Math.PI / 2);
    showNotif('🎩 PRESIDENTIAL ONE has been delivered — your official car waits outside!');
    if (typeof saveGame === 'function') saveGame();
  }
  if (!state._seenGray) { state._seenGray = true; showDialogue('🏛️ The Gray House', 'Welcome home, President ' + (state.catName || '') + '. Four floors, all yours — the lift is to the east. 🐾', 5600); }
}
function exitGrayHouse() {
  state.inGray = false;
  state.grayFloor = 0;
  scene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_OUT);
  catGroup.position.set(GRAY_SPOT.x, 0, GRAY_SPOT.z - 8.5); catGroup.rotation.y = Math.PI;
  if (typeof sfx === 'function') sfx('door');
}
function gotoGrayFloor(f) {
  closeCheckout();
  state.grayFloor = f;
  const fx = _GF(f);
  catGroup.position.set(fx + GRAY_LIFT.x, 0, GRAY_LIFT.z + 1.6);
  catGroup.rotation.y = Math.PI;
  camera.position.set(fx + GRAY_LIFT.x, state.camHeight, GRAY_LIFT.z + 1.6 + state.camDist);
  if (typeof sfx === 'function') { sfx('door'); setTimeout(() => sfx('ui'), 350); }
  showNotif('🛗 ' + GRAY_FLOORS[f]);
}
function openLift() {
  state.uiOpen = true;
  let h = '<div class="zoo-want">🛗</div><div class="modal-sub">Which floor, President?</div><div class="co-grid" style="grid-template-columns:1fr">';
  GRAY_FLOORS.forEach((nm, f) => { h += `<button ${f === state.grayFloor ? 'disabled' : ''} onclick="gotoGrayFloor(${f})">${nm}${f === state.grayFloor ? ' · here' : ''}</button>`; });
  h += '</div><button class="modal-close" onclick="closeCheckout()">Stay</button>';
  document.getElementById('checkout-title').textContent = '🛗 The lift';
  document.getElementById('checkout-body').innerHTML = h;
  document.getElementById('checkout').classList.add('show');
}

// ── hiring analysts (from the treasury, never your own coins) ──
const HIRE_COST = 400;
function hireAnalystAt(i, silent) {
  const d = state.grayDesks[i]; if (!d || d.hired) return;
  d.hired = true;
  d.screen.material.emissiveIntensity = 0.4;
  const cfgs = [0xe8b890, 0x8a5a3a, 0xf0c8a0, 0xd9a884, 0xe0a878];
  const { group, parts } = buildHuman({ skin: cfgs[i % 5], hair: [0x3a2a1a, 0x141414, 0x8a6a3a][i % 3], hairStyle: i % 2 ? 'bun' : 'short', glasses: i % 3 === 0, shirt: 0x3a4458, pants: 0x262c3a, height: 0.98 + (i % 3) * 0.03, build: 'avg', eye: 0x2a1a12 });
  group.position.set(d.x, 0, d.z + 1.15); group.rotation.y = Math.PI;
  grayScene.add(group);
  state.grayPeople.push({ group, parts, phase: Math.random() * 6, role: 'typing', hx: d.x, hz: d.z + 1.15 });
  if (!silent) {
    if (typeof sfx === 'function') sfx('upgrade');
    showNotif('🧑‍💼 Analyst hired — they take their desk at once. (' + (state.grayHired || 0) + ' hired, paid by the treasury)');
  }
}
function grayHire() {
  const i = state.grayDesks.findIndex(d => !d.hired);
  if (i < 0) { showNotif('💼 Every desk is filled — Operations is at full strength!'); return; }
  if (!state.gov || (state.gov.treasury || 0) < HIRE_COST) { showNotif('🏛️ The treasury needs ' + HIRE_COST + ' 🪙 to fund this post. Raise taxes, President.'); if (typeof sfx === 'function') sfx('sad'); return; }
  state.gov.treasury -= HIRE_COST;
  state.grayHired = (state.grayHired || 0) + 1;
  hireAnalystAt(i);
  if (typeof updateHappyHUD === 'function') updateHappyHUD();
  if (typeof saveGame === 'function') saveGame();
}

// ── 📞 the red phone: presidential services ──
function openPhone() {
  state.uiOpen = true;
  const gd = state.guard;
  let h = '<div class="zoo-want">📞</div><div class="modal-sub">"Yes, President? Right away."</div><div class="co-grid" style="grid-template-columns:1fr">';
  if (!gd) {
    h += `<button onclick="phoneGuard('human')">🕴️<small>Bodyguard — a suited pro · 500 treasury</small></button>`;
    h += `<button onclick="phoneGuard('cat')">🐈‍⬛<small>Cat guard — silent, loyal · 300 treasury</small></button>`;
  } else h += `<button onclick="closeCheckout();openGuardOrders()">🛡️<small>Speak to your bodyguard</small></button>`;
  h += `<button onclick="phoneFood()">🍽️<small>Bring me food — the kitchen delivers</small></button>`;
  h += `<button onclick="phoneCar()">🚗<small>Bring my car around front</small></button>`;
  h += '</div><button class="modal-close" onclick="closeCheckout()">Hang up</button>';
  document.getElementById('checkout-title').textContent = '📞 Presidential services';
  document.getElementById('checkout-body').innerHTML = h;
  document.getElementById('checkout').classList.add('show');
}
function phoneGuard(kind) {
  closeCheckout();
  const cost = kind === 'human' ? 500 : 300;
  if (!state.gov || (state.gov.treasury || 0) < cost) { showNotif('🏛️ The treasury needs ' + cost + ' 🪙 for a protection detail.'); if (typeof sfx === 'function') sfx('sad'); return; }
  state.gov.treasury -= cost;
  state.guard = { kind, mode: 'follow' };
  spawnGuardMesh();
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif(kind === 'human' ? '🕴️ Your bodyguard reports for duty — they won\'t leave your side.' : '🐈‍⬛ A shadow with whiskers joins you. Nobody will see them coming.');
  if (typeof updateHappyHUD === 'function') updateHappyHUD();
  if (typeof saveGame === 'function') saveGame();
}
function phoneFood() {
  closeCheckout();
  state._foodT = 3;
  showNotif('🍽️ "The kitchen is on it, President." …');
  if (typeof sfx === 'function') sfx('ui');
}
function phoneCar() {
  closeCheckout();
  if (!state.activeCar) { showNotif('🚗 You don\'t own a car yet — Whisker Motors is by the Gray House!'); return; }
  if (typeof parkCarAt === 'function') parkCarAt(GRAY_SPOT.x + 16, GRAY_SPOT.z - 10, Math.PI / 2);
  if (typeof sfx === 'function') sfx('meow');
  showNotif('🚗 "Bringing it around now." Your ' + CAR_STYLES[state.activeCar].name + ' waits out front.');
}

// ── 🛡️ THE BODYGUARD — follows you EVERYWHERE (even into the car) ──
function spawnGuardMesh() {
  const gd = state.guard; if (!gd || gd.group) return;
  if (gd.kind === 'cat') {
    const m = buildCatModel({ body: 0x26262e, accent: 0x3a3a44, eye: 0xd8b830, markings: 'solid' });
    m.group.scale.setScalar(CAT_SCALE_OUT);
    gd.group = m.group; gd.parts = null; gd.catParts = m;
  } else {
    const { group, parts } = buildHuman({ skin: 0xd9a884, hair: 0x141414, hairStyle: 'short', glasses: true, shirt: 0x1c1e26, pants: 0x14161c, height: 1.08, build: 'avg', eye: 0x2a1a12 });
    gd.group = group; gd.parts = parts;
  }
  gd.phase = Math.random() * 6;
  gd.group.position.set(catGroup.position.x + 1.4, 0, catGroup.position.z);
  (state.inGray ? grayScene : scene).add(gd.group);
  gd.inGray = !!state.inGray;
}
function dismissGuard() {
  const gd = state.guard; if (!gd) return;
  if (gd.group) (gd.inGray ? grayScene : scene).remove(gd.group);
  state.guard = null;
  showNotif('🛡️ "Understood, President." Your guard heads home for a well-earned rest.');
  if (typeof sfx === 'function') sfx('ui');
  if (typeof saveGame === 'function') saveGame();
}
function openGuardOrders() {
  const gd = state.guard; if (!gd) return;
  state.uiOpen = true;
  let h = '<div class="zoo-want">' + (gd.kind === 'cat' ? '🐈‍⬛' : '🕴️') + '</div><div class="modal-sub">"Orders, President?"</div><div class="co-grid" style="grid-template-columns:1fr">';
  h += `<button ${gd.mode === 'follow' ? 'disabled' : ''} onclick="guardOrder('follow')">🚶<small>Follow me${gd.mode === 'follow' ? ' · current' : ''}</small></button>`;
  h += `<button ${gd.mode === 'wait' ? 'disabled' : ''} onclick="guardOrder('wait')">🧍<small>Wait right here${gd.mode === 'wait' ? ' · current' : ''}</small></button>`;
  h += `<button onclick="guardOrder('home')">🏠<small>Go home (dismiss)</small></button>`;
  h += '</div><button class="modal-close" onclick="closeCheckout()">Carry on</button>';
  document.getElementById('checkout-title').textContent = '🛡️ Your bodyguard';
  document.getElementById('checkout-body').innerHTML = h;
  document.getElementById('checkout').classList.add('show');
}
function guardOrder(o) {
  closeCheckout();
  const gd = state.guard; if (!gd) return;
  if (o === 'home') { dismissGuard(); return; }
  gd.mode = o;
  showNotif(o === 'wait' ? '🧍 "I\'ll hold this spot." Your guard stands watch.' : '🚶 "Right behind you." Your guard falls in.');
  if (typeof sfx === 'function') sfx('ui');
  if (typeof saveGame === 'function') saveGame();
}
function updateGuard(t) {
  // 🍽️ pending kitchen delivery ticks anywhere
  if ((state._foodT || 0) > 0) {
    state._foodT -= 0.016;
    if (state._foodT <= 0) {
      state.needs.hunger = 100; state.needs.thirst = 100;
      _catHappyT = 1.8; if (typeof spawnHeart === 'function') spawnHeart();
      if (typeof sfx === 'function') sfx('eat');
      showNotif('🍽️ Dinner is served, President — the kitchen outdid itself.');
    }
  }
  const gd = state.guard; if (!gd) return;
  if (!gd.group) { spawnGuardMesh(); return; }
  if (state.driving) { gd.group.visible = false; return; }                     // riding along in the car
  const inG = !!state.inGray;
  if (gd.inGray !== inG) { (inG ? grayScene : scene).add(gd.group); gd.inGray = inG; gd.group.position.set(catGroup.position.x + 1.2, 0, catGroup.position.z); }
  if (typeof playerIndoors === 'function' && playerIndoors() && !inG) { gd.group.visible = false; return; }   // waits outside the shops
  gd.group.visible = true;
  const gp = gd.group.position, cp = catGroup.position;
  if (gd.mode === 'follow') {
    const dx = cp.x - gp.x, dz = cp.z - gp.z, d = Math.hypot(dx, dz);
    if (d > 30) { gp.set(cp.x + 1.3, 0, cp.z); }                                // never left behind
    else if (d > 1.8) {
      const sp = Math.min(0.11, (d - 1.6) * 0.06);
      gp.x += dx / d * sp; gp.z += dz / d * sp;
      gd.group.rotation.y = Math.atan2(dx, dz);
      gd.walkT = (gd.walkT || 0) + 0.28;
      if (gd.parts) {                                                           // suited stride
        const sw = Math.sin(gd.walkT);
        if (gd.parts.legs) { gd.parts.legs[0].rotation.x = sw * 0.5; gd.parts.legs[1].rotation.x = -sw * 0.5; }
        if (gd.parts.arms) { gd.parts.arms[0].rotation.x = -sw * 0.35; gd.parts.arms[1].rotation.x = sw * 0.35; }
        gp.y = Math.abs(Math.sin(gd.walkT)) * 0.02;
      } else gp.y = Math.abs(Math.sin(gd.walkT * 1.4)) * 0.05;                  // cat-guard trot
    } else {
      if (gd.parts) { if (gd.parts.legs) gd.parts.legs.forEach(l => l.rotation.x *= 0.8); gp.y = 0; if (typeof idleHuman === 'function') idleHuman(gd, t); }
      else gp.y = Math.abs(Math.sin(t * 1.2 + gd.phase)) * 0.01;
      gd.group.rotation.y += (Math.atan2(cp.x - gp.x, cp.z - gp.z) - gd.group.rotation.y) * 0.08;   // keeps eyes on you
    }
  } else if (gd.parts && typeof idleHuman === 'function') idleHuman(gd, t);     // standing watch
}
function guardContext(cp) {
  const gd = state.guard;
  if (!gd || !gd.group || !gd.group.visible || state.driving) return null;
  if (Math.hypot(cp.x - gd.group.position.x, cp.z - gd.group.position.z) > 2.2) return null;
  return { id: 'guard:menu', label: '🛡️ Bodyguard orders' };
}

// ── the living floors: everyone has a job to do ──
function updateGrayFrame(t) {
  (state.grayPeople || []).forEach(p => {
    if (p.role === 'typing') {
      if (p.parts.arms) { p.parts.arms[0].rotation.x = -0.9 + Math.sin(t * 7 + p.phase) * 0.14; p.parts.arms[1].rotation.x = -0.9 + Math.cos(t * 6.4 + p.phase) * 0.14; }
      p.group.position.y = Math.abs(Math.sin(t * 1.1 + p.phase)) * 0.012;
    } else if (p.role === 'meeting') {
      p.group.rotation.y = p.hr + Math.sin(t * 0.5 + p.phase) * 0.25;           // turning to whoever speaks
      if (p.parts.arms && Math.sin(t * 0.3 + p.phase * 2) > 0.92) p.parts.arms[0].rotation.x = -1.2;   // a point made
      else if (p.parts.arms) p.parts.arms[0].rotation.x *= 0.9;
      idleHuman(p, t);
    } else if (p.role === 'reception') {
      // Iris comes out to WELCOME you, then returns to her post
      const cp = catGroup.position, onLobby = (state.grayFloor || 0) === 0;
      if (onLobby && !state._grayGreeted && Math.hypot(cp.x, cp.z - (GRAY_D - 1)) < 7) state._grayGreeted = 'walking';
      if (state._grayGreeted === 'walking') {
        const tx = cp.x * 0.4, tz = cp.z - 2;
        const dx = tx - p.group.position.x, dz = tz - p.group.position.z, d = Math.hypot(dx, dz);
        if (d > 0.4) { p.group.position.x += dx / d * 0.055; p.group.position.z += dz / d * 0.055; p.group.rotation.y = Math.atan2(dx, dz); const sw = Math.sin(t * 9); if (p.parts.legs) { p.parts.legs[0].rotation.x = sw * 0.5; p.parts.legs[1].rotation.x = -sw * 0.5; } }
        else {
          state._grayGreeted = true;
          showDialogue('Iris 🏛️', 'Welcome home, President ' + (state.catName || '') + '! The lift is just east — your office is on Floor 4. 💛', 4600);
          if (p.parts.arms) p.parts.arms[0].rotation.x = -2.6;                   // a little wave
        }
      } else if (state._grayGreeted === true) {
        const dx = p.hx - p.group.position.x, dz = p.hz - p.group.position.z, d = Math.hypot(dx, dz);
        if (d > 0.3) { p.group.position.x += dx / d * 0.04; p.group.position.z += dz / d * 0.04; p.group.rotation.y = Math.atan2(dx, dz); }
        else { p.group.rotation.y = p.hr; idleHuman(p, t); }
      } else idleHuman(p, t);
    } else if (p.role === 'wander') {
      p.wT = (p.wT || 0) - 0.016;
      if (p.wT <= 0) { p.wtx = p.hx + (Math.random() - 0.5) * 8; p.wtz = p.hz + (Math.random() - 0.5) * 6; p.wT = 6 + Math.random() * 6; }
      const dx = p.wtx - p.group.position.x, dz = p.wtz - p.group.position.z, d = Math.hypot(dx, dz);
      if (d > 0.4) { p.group.position.x += dx / d * 0.03; p.group.position.z += dz / d * 0.03; p.group.rotation.y = Math.atan2(dx, dz); const sw = Math.sin(t * 8); if (p.parts.legs) { p.parts.legs[0].rotation.x = sw * 0.4; p.parts.legs[1].rotation.x = -sw * 0.4; } }
      else idleHuman(p, t);
    } else if (p.role === 'security') {
      idleHuman(p, t);
      p.group.rotation.y = p.hr + Math.sin(t * 0.4 + p.phase) * 0.5;            // scanning the room
    } else idleHuman(p, t);
  });
  // ambient life: fire, screens, racks, globe
  if (state._grayFire) { state._grayFire.scale.y = 1 + Math.sin(t * 9) * 0.2; state._grayFire.material.emissiveIntensity = 1.4 + Math.sin(t * 13) * 0.3; }
  if (state._grayBigScreen) state._grayBigScreen.material.emissiveIntensity = 0.75 + Math.sin(t * 2.2) * 0.2;
  if (state._grayChart) state._grayChart.material.emissiveIntensity = 0.7 + Math.sin(t * 1.6) * 0.15;
  if (state._grayPCScreen) state._grayPCScreen.material.emissiveIntensity = 0.7 + Math.sin(t * 3) * 0.2;
  (state._grayRacks || []).forEach((led, i) => { led.material.emissiveIntensity = Math.sin(t * 5 + i * 1.7) > 0 ? 1.4 : 0.2; });
  if (state._grayGlobe) state._grayGlobe.rotation.y = t * 0.3;
}

// ── contexts inside the Gray House ──
function grayContext(cp) {
  const gc = guardContext(cp); if (gc) return gc;
  const f = state.grayFloor || 0, fx = _GF(f);
  if (Math.hypot(cp.x - (fx + GRAY_LIFT.x), cp.z - GRAY_LIFT.z) < 2.4) return { id: 'gray:lift', label: '🛗 Take the lift' };
  if (f === 3) {
    if (Math.hypot(cp.x - (fx - 1.9), cp.z - (-4.5)) < 2.6) return { id: 'gray:phone', label: '📞 Presidential services' };
    if (Math.hypot(cp.x - (fx - 3), cp.z - (-7.2)) < 3.0) return { id: 'gray:flag', label: '🚩 Choose the nation’s flag' };
  }
  if (f === 1) {
    for (const d of state.grayDesks || []) {
      if (!d.hired && Math.hypot(cp.x - d.x, cp.z - d.z) < 2.2) return { id: 'gray:hire', label: '🧑‍💼 Hire an analyst · ' + HIRE_COST + ' treasury' };
    }
  }
  return null;
}
function grayAction(ctx) {
  if (ctx.id === 'gray:lift') openLift();
  else if (ctx.id === 'gray:phone') openPhone();
  else if (ctx.id === 'gray:flag') { if (typeof openFlagPicker === 'function') openFlagPicker(); }
  else if (ctx.id === 'gray:hire') grayHire();
  else if (ctx.id === 'guard:menu') openGuardOrders();
}
