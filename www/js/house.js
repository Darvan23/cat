// Paws & Pennies — house: tiers, interior, upstairs, exterior growth, floors
// Classic script: shares globals with the others; load order matters (see index.html).

// ─── House-improvement tiers (coins earned → how good the home is) ───────────────
const HOUSE_TIERS = [
  { coins: 0,   status: 'Hungry & cold…' },
  { coins: 12,  status: 'A little hopeful…' },
  { coins: 30,  status: 'Warming up 🙂' },
  { coins: 55,  status: 'Getting comfortable' },
  { coins: 90,  status: 'Happy & hopeful 😊' },
  { coins: 140, status: 'Safe, warm & together ❤️' },
];
function levelForCoins(c) { let lv = 0; for (let i = 0; i < HOUSE_TIERS.length; i++) if (c >= HOUSE_TIERS[i].coins) lv = i; return lv; }

// ─── Rent deadline tuning ───────────────────────────────────────────────────────
//  goal:    coins owed in total (reaching it also restores the home to its best)
//  days:    winter days available — one ticks down with each job worked
//  trigger: Mr. Crick arrives & the countdown begins once you've earned this much
//  penalty: coins lost as a setback when winter ends before the rent is paid
const RENT = { goal: 100, days: 16, triggerCoins: 40, penalty: 18 };

// ─── Miller home interior (with upgrade tiers) ──────────────────────────────────
// 🎓 Your diplomas hang on the living-room wall — one framed certificate per degree
let _diplomaGroup = null;
function refreshDiplomaWall() {
  if (typeof groundGroup === 'undefined' || !groundGroup) return;
  if (_diplomaGroup) { groundGroup.remove(_diplomaGroup); _diplomaGroup = null; }
  const done = (state.school && state.school.done) || [];
  if (!done.length) return;
  const icons = { logistics: '💼', business: '📊', civics: '🏛️', humanity: '❤️', art: '🎨', park: '🌳', planning: '🏗️' };
  _diplomaGroup = new THREE.Group();
  done.slice(0, 8).forEach((id, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 0.7 + col * 0.68, y = 2.0 - row * 0.55;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.42, 0.05), pbr(0x6a4a2c, 0.8));
    frame.position.set(x, y, -2.92); frame.castShadow = true; _diplomaGroup.add(frame);
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.02),
      (typeof makeTextSign === 'function')
        ? new THREE.MeshStandardMaterial({ map: makeTextSign((icons[id] || '🎓') + ' DIPLOMA', '#f2ead8', '#4a3a22', 210, 96), roughness: 0.85 })
        : pbr(0xf2ead8, 0.9));
    paper.position.set(x, y, -2.885); _diplomaGroup.add(paper);
  });
  groundGroup.add(_diplomaGroup);
}
function buildInterior() {
  const tiers = [];
  groundGroup = new THREE.Group(); houseScene.add(groundGroup);   // the whole ground floor (hidden when upstairs)
  const tierGroup = (from, until) => { const g = new THREE.Group(); groundGroup.add(g); tiers.push({ grp: g, from, until: until == null ? 99 : until }); return g; };
  const add = (m, parent) => { m.castShadow = true; m.receiveShadow = true; (parent || groundGroup).add(m); return m; };
  const B = (w, h, d, m, x, y, z, parent) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); return add(me, parent); };
  const C = (rt, rb, h, seg, m, x, y, z, parent) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); me.position.set(x, y, z); return add(me, parent); };
  const Sp = (r, m, x, y, z, parent) => { const me = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m); me.position.set(x, y, z); me.castShadow = true; (parent || groundGroup).add(me); return me; };

  const floorMat = pbr(0x6b4f38, 0.92);
  const wallA = pbr(0xb9a98c, 0.96), wallB = pbr(0xa89878, 0.96);
  const wood = pbr(0x6a4a2c, 0.8), woodDark = pbr(0x49331f, 0.8);
  const crackMat = pbr(0x3a3026, 1.0);

  // ── permanent shell & big pieces ──
  const floor = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 6), floorMat); floor.position.set(0, -0.05, 0); floor.receiveShadow = true; groundGroup.add(floor);
  const WH = 2.6, WY = 1.3;
  B(7, WH, 0.2, wallA, 0, WY, -3);
  B(0.2, WH, 6, wallB, -3.5, WY, 0);
  B(0.2, WH, 6, wallB, 3.5, WY, 0);
  B(3.3, WH, 0.2, wallA, -1.85, WY, 3);
  B(2.0, WH, 0.2, wallA, 2.5, WY, 3);
  B(1.7, 0.5, 0.2, wallA, 0.65, 2.35, 3);
  B(1.3, 1.05, 0.06, pbr(0xbfe0ff, 0.08, 0), -2.3, 1.7, -2.9);     // window
  B(1.45, 0.08, 0.1, wood, -2.3, 2.25, -2.88);
  B(1.45, 0.08, 0.1, wood, -2.3, 1.15, -2.88);
  B(0.08, 1.1, 0.1, wood, -2.3, 1.7, -2.88);
  // The cat's plate & water bowl — the only comforts this poor family can offer (eat & drink)
  C(0.17, 0.13, 0.07, 14, pbr(0xcc5a4a, 0.5), 1.45, 0.05, 1.9);                  // food bowl (the "plate")
  Sp(0.045, pbr(0x8a5a2a, 0.8), 1.42, 0.11, 1.87); Sp(0.045, pbr(0x9a6a3a, 0.8), 1.5, 0.11, 1.92); Sp(0.045, pbr(0x7a4a26, 0.8), 1.45, 0.11, 1.95);
  C(0.17, 0.13, 0.07, 14, pbr(0x4a88c8, 0.5), 1.85, 0.05, 1.9);                  // water bowl
  C(0.14, 0.14, 0.012, 14, pbr(0x6ab0e0, 0.15, 0.1), 1.85, 0.095, 1.9);         // water surface
  // A little cat bed — the one place the cat has to curl up and sleep
  C(0.42, 0.46, 0.16, 16, pbr(0x9a5a6a, 0.9), 2.5, 0.08, 1.1);                   // bed rim
  C(0.32, 0.32, 0.06, 16, pbr(0xe8d8c0, 0.9), 2.5, 0.16, 1.1);                   // soft cushion
  interiorDrip = null;   // the bare starter house has no furniture — everything else must be bought
  // hanging bulb (stays)
  C(0.012, 0.012, 0.7, 6, pbr(0x222222, 0.5), 0.4, 2.25, -0.2);
  const bulb = Sp(0.085, new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffcf70, emissiveIntensity: 1.3 }), 0.4, 1.9, -0.2);
  // lights
  houseScene.add(new THREE.AmbientLight(0x6a6050, 0.55));
  houseScene.add(new THREE.HemisphereLight(0x9aa6c0, 0x3a2a20, 0.4));
  const bulbLight = new THREE.PointLight(0xffd49a, 0.8, 16, 2); bulbLight.position.set(0.4, 1.9, -0.2); houseScene.add(bulbLight);
  const win = new THREE.DirectionalLight(0xcfe0ee, 0.9); win.position.set(-5, 7, -7); win.castShadow = true;
  win.shadow.mapSize.set(1024, 1024); win.shadow.camera.near = 0.1; win.shadow.camera.far = 30;
  win.shadow.camera.left = -7; win.shadow.camera.right = 7; win.shadow.camera.top = 7; win.shadow.camera.bottom = -7; win.shadow.bias = -0.0005;
  houseScene.add(win);

  // ── Tired old walls that heal as you give money (disrepair, not furniture) ──
  const cracks = tierGroup(0, 1);
  B(0.04, 1.3, 0.02, crackMat, -1.0, 1.55, -2.89, cracks);
  B(0.5, 0.04, 0.02, crackMat, 1.6, 1.95, -2.89, cracks);
  const peel = tierGroup(0, 3);
  B(0.8, 0.6, 0.012, wallB, -2.7, 1.6, -2.88, peel);
  B(0.5, 0.4, 0.012, wallB, 0.4, 0.9, 2.88, peel);

  // A REAL staircase to the second floor — ten walkable steps you actually climb (movable)
  makeFixture('home', 'stairs', tierGroup(3, 99), groundColliders, -2.9, 0.6, (B) => {
    for (let i = 0; i < 10; i++) B(0.95, 0.24, 0.4, wood, 0, 0.12 + i * 0.24, 1.5 - i * 0.33);
    B(0.08, 2.5, 3.4, woodDark, -0.52, 1.25, 0);                                  // side rail panel
    B(0.06, 0.06, 3.4, woodDark, -0.52, 2.55, 0);                                 // handrail
  }, null);

  interior = {
    tiers, wallMats: [wallA, wallB], bulb, bulbLight,
    wallColors: [0xb9a98c, 0xb9a98c, 0xc2b393, 0xccbd9c, 0xe2d6ba, 0xeaddc2],
    bulbs: [{ i: 0.8, c: 0xffd49a }, { i: 0.95, c: 0xffd9a8 }, { i: 1.2, c: 0xffe2b4 }, { i: 1.35, c: 0xffe8c0 }, { i: 1.55, c: 0xfff0cf }, { i: 1.75, c: 0xfff4da }],
  };
}

// ─── The second floor — two bedrooms the family moves into as the home grows ─────
function buildUpstairs() {
  upstairsGroup = new THREE.Group(); upstairsGroup.visible = false; houseScene.add(upstairsGroup);
  const G = upstairsGroup;
  const B = (w, h, d, m, x, y, z, parent) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; (parent || G).add(me); return me; };
  const C = (rt, rb, h, seg, m, x, y, z, parent) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); me.position.set(x, y, z); me.castShadow = true; (parent || G).add(me); return me; };
  const Sp = (r, m, x, y, z, parent) => { const me = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m); me.position.set(x, y, z); me.castShadow = true; (parent || G).add(me); return me; };

  const floorMat = pbr(0x7a5a3c, 0.9), wallU = pbr(0xcdbfa0, 0.96);
  const wood = pbr(0x6a4a2c, 0.8), woodDark = pbr(0x49331f, 0.8);
  const glass = pbr(0xbfe0ff, 0.08, 0);

  // shell — same footprint as downstairs, with a ceiling-less open top for the camera
  const floor = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 6), floorMat); floor.position.set(0, -0.05, 0); floor.receiveShadow = true; G.add(floor);
  const WH = 2.4, WY = 1.2;
  B(7, WH, 0.2, wallU, 0, WY, -3);
  B(0.2, WH, 6, wallU, -3.5, WY, 0);
  B(0.2, WH, 6, wallU, 3.5, WY, 0);
  B(7, WH, 0.2, wallU, 0, WY, 3);
  B(1.0, 0.9, 0.06, glass, -2.0, 1.5, -2.92);   // windows
  B(1.0, 0.9, 0.06, glass, 2.0, 1.5, -2.92);

  // partition walls between the two bedrooms — MOVABLE (drag to reshape the rooms, or delete to open it up)
  makeFixture('upper', 'upartA', G, upstairsColliders, 0, -2.1, (B) => { B(0.18, WH, 1.8, wallU, 0, WY, 0); }, { dx0: -0.13, dx1: 0.13, dz0: -0.9, dz1: 0.9 }, 3);
  makeFixture('upper', 'upartB', G, upstairsColliders, 0, 0.5, (B) => { B(0.18, WH, 1.0, wallU, 0, WY, 0); }, { dx0: -0.13, dx1: 0.13, dz0: -0.5, dz1: 0.5 }, 3);

  // staircase back down (matches the ground-floor stairs spot)
  for (let i = 0; i < 6; i++) B(0.95, 0.18, 0.55, wood, -2.9, 0.09 + i * 0.18, 1.95 + i * 0.16);
  B(0.1, 1.1, 1.3, woodDark, -3.42, 0.6, 2.0);

  // ── Kids' bedroom (left) — movable beds + toy chest ──
  const kidsGrp = new THREE.Group(); G.add(kidsGrp);
  const kidBedFix = (id, x) => makeFixture('upper', id, kidsGrp, upstairsColliders, x, -2.0, (B, C) => {
    B(1.0, 0.3, 1.8, wood, 0, 0.2, 0);
    B(0.9, 0.18, 1.7, pbr(0xeae0cc, 0.9), 0, 0.42, 0);
    B(0.9, 0.12, 0.9, pbr(0x6a9ad0, 0.9), 0, 0.5, 0.5);
    C(0.18, 0.18, 0.12, 12, pbr(0xf2ece0, 0.9), 0, 0.52, -0.55);
  }, { dx0: -0.55, dx1: 0.55, dz0: -0.95, dz1: 0.95 }, 3);
  kidBedFix('ukidbed0', -2.6); kidBedFix('ukidbed1', -1.3);
  B(1.8, 0.02, 1.4, pbr(0x9a5a6a, 0.9), -1.9, 0.012, 0.5, kidsGrp);                 // rug (stays)
  C(0.1, 0.1, 0.2, 8, pbr(0x9a6a3a, 0.95), -1.9, 0.2, 0.5, kidsGrp);                // teddy body
  Sp(0.13, pbr(0x9a6a3a, 0.95), -1.9, 0.42, 0.5, kidsGrp);                          // teddy head
  makeFixture('upper', 'utoychest', kidsGrp, upstairsColliders, -3.05, -0.4, (B) => { B(0.6, 0.4, 0.4, woodDark, 0, 0.2, 0); }, null, 3);

  // ── Parents' bedroom (right) — movable bed + wardrobe ──
  const parentsGrp = new THREE.Group(); G.add(parentsGrp);
  makeFixture('upper', 'uparentbed', parentsGrp, upstairsColliders, 2.1, -1.9, (B, C) => {
    B(2.0, 0.3, 2.0, wood, 0, 0.2, 0);
    B(1.9, 0.2, 1.9, pbr(0xeae0cc, 0.9), 0, 0.42, 0);
    B(1.9, 0.14, 1.1, pbr(0x8a5a9a, 0.9), 0, 0.52, 0.5);
    C(0.2, 0.2, 0.14, 12, pbr(0xf2ece0, 0.9), -0.5, 0.55, -0.6);
    C(0.2, 0.2, 0.14, 12, pbr(0xf2ece0, 0.9), 0.5, 0.55, -0.6);
  }, { dx0: -1.05, dx1: 1.05, dz0: -1.05, dz1: 1.05 }, 4);
  makeFixture('upper', 'uwardrobe', parentsGrp, upstairsColliders, 3.0, 1.5, (B) => { B(1.0, 2.0, 0.6, woodDark, 0, 1.0, 0); }, { dx0: -0.55, dx1: 0.35, dz0: -0.35, dz1: 0.35 }, 4);
  B(2.4, 0.02, 1.6, pbr(0x5a7a9a, 0.9), 2.0, 0.013, 0.7, parentsGrp);               // rug (stays)
  C(0.1, 0.14, 0.18, 12, pbr(0x3a4a6a, 0.6), 3.05, 0.45, -0.7, parentsGrp);         // lamp base
  Sp(0.13, new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd070, emissiveIntensity: 0.9 }), 3.05, 0.62, -0.7, parentsGrp);

  upstairs = { kidsGrp, parentsGrp };
  buildHouseFamily(kidsGrp, parentsGrp);
}

// The Millers, at home in their rooms (shown when the cat visits the upper floor)
function buildHouseFamily(kidsGrp, parentsGrp) {
  state.houseFamily = [];
  const place = (name, cfg, x, z, ry, parent, bed) => {
    const { group, parts } = buildHuman(cfg);
    group.position.set(x, 0, z); group.rotation.y = ry; parent.add(group);
    state.houseFamily.push({ group, parts, name, phase: Math.random() * 6, bed });
  };
  place('Lily',   { skin: 0xf0c49a, hair: 0x7a4a2a, hairStyle: 'long', shirt: 0xe0a0c0, pants: 0x8a6aa0, height: 0.62, build: 'slim', eye: 0x5a3a22 }, -2.6, -0.5, 0.5, kidsGrp, 'ukidbed0');
  place('Noah',   { skin: 0xe0b080, hair: 0x241712, hairStyle: 'child', shirt: 0x5a80c0, pants: 0x3a3a4a, height: 0.74, build: 'slim', eye: 0x241712 }, -1.1, -0.3, -0.4, kidsGrp, 'ukidbed1');
  place('Daniel', { skin: 0xd9a070, hair: 0x3a2a1a, hairStyle: 'short', shirt: 0x5a7a5a, pants: 0x46402e, height: 1.04, build: 'avg', eye: 0x3a2a1a }, 1.4, 0.4, -0.5, parentsGrp, 'uparentbed');
  place('Elena',  { skin: 0xe8b48c, hair: 0x5a3a22, hairStyle: 'long', shirt: 0xc86a7a, pants: 0x5a5070, height: 0.97, build: 'avg', eye: 0x4a3a22 }, 2.7, 0.5, -0.7, parentsGrp, 'uparentbed');
  state.houseFamily[0].home0 = { x: -2.6, z: -0.5, ry: 0.5 };
  state.houseFamily[1].home0 = { x: -1.1, z: -0.3, ry: -0.4 };
  state.houseFamily[2].home0 = { x: 1.4, z: 0.4, ry: -0.5 };
  state.houseFamily[3].home0 = { x: 2.7, z: 0.5, ry: -0.7 };
}

// Upstairs at night: the Millers are asleep in their bedrooms (visible only when 'up')
function updateMillerUpstairs() {
  if (!state.houseFamily) return;
  if (millersMovedOut()) { state.houseFamily.forEach(f => f.group.visible = false); return; }   // moved to their new home
  const hour = state.dayTime * 24;
  state.houseFamily.forEach(f => {
    const plan = millerPlan(f.name, hour);
    f.group.visible = (plan.loc === 'up') && !millerStillOutside(f.name);
    if (!f.group.visible) return;
    const bed = decorReg.upper && decorReg.upper[f.bed];   // sleep in the (movable) bed if it's there
    const sameBed = (f.name === 'Elena') ? 0.5 : (f.name === 'Daniel') ? -0.5 : 0;   // parents share
    if (bed) f.group.position.set(bed.position.x + sameBed, 0.5, bed.position.z + 0.55);
    else f.group.position.set(f.home0.x + sameBed, 0.3, f.home0.z - 1.4);
    sleepPose(f);
  });
}

// ─── Exterior upgrades for the Miller house (smoke, flowers, fresh paint) ────────
function buildExteriorUpgrades() {
  const px = -3, pz = -10, tiers = [];
  const tierG = (from, until) => { const g = new THREE.Group(); scene.add(g); tiers.push({ grp: g, from, until: until == null ? 99 : until }); return g; };
  const Bx = (w, h, d, m, x, y, z, parent) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; parent.add(me); return me; };
  const Spx = (r, m, x, y, z, parent) => { const me = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); me.position.set(x, y, z); me.castShadow = true; parent.add(me); return me; };

  // second storey (from L3 — the home literally grows a floor taller)
  const storey = tierG(3, 99);
  Bx(4, 2.0, 3.5, mat.poorHouse, px, 3.55, pz, storey);
  Bx(0.9, 0.9, 0.08, mat.window, px - 1.0, 3.7, pz + 1.78, storey);
  Bx(0.9, 0.9, 0.08, mat.window, px + 1.0, 3.7, pz + 1.78, storey);

  // chimney smoke (from L2 — the fire is lit)
  const smokeG = tierG(2, 99), smoke = [];
  const smokeMat = new THREE.MeshStandardMaterial({ color: 0xcfcfcf, transparent: true, opacity: 0.5, roughness: 1 });
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), smokeMat.clone());
    p.position.set(px + 1.2, 2.9 + i * 0.55, pz - 0.4);
    smokeG.add(p); smoke.push(p);
  }
  // window flower box (from L4)
  const flowers = tierG(4, 99);
  Bx(1.2, 0.18, 0.25, pbr(0x6a4a2c, 0.8), px - 1.1, 1.0, pz + 1.82, flowers);
  [-0.4, -0.13, 0.14, 0.4].forEach((fx, i) => Spx(0.08, pbr([0xe85a7a, 0xf0c040, 0xc06ad0, 0xe87a3a][i], 0.6), px - 1.1 + fx, 1.2, pz + 1.86, flowers));
  // front garden (from L5)
  const garden = tierG(5, 99);
  Bx(2.4, 0.05, 1.0, pbr(0x4a3a26, 0.95), px + 0.2, 0.06, pz + 2.7, garden);
  for (let i = 0; i < 6; i++) {
    const fx = px - 0.7 + (i % 3) * 0.8, fz = pz + 2.45 + Math.floor(i / 3) * 0.5;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5), pbr(0x3a7a30, 0.9)); stem.position.set(fx, 0.21, fz); garden.add(stem);
    Spx(0.07, pbr([0xf0c040, 0xe85a7a, 0xffffff][i % 3], 0.6), fx, 0.38, fz, garden);
  }

  exterior = { tiers, smoke, wallColors: [0x8a7560, 0x8f7c66, 0x9a8a70, 0xa89a7e, 0xc0b48e, 0xd0c49a] };
}

// Show/hide everything for the current house level, and re-tint walls + lights
function applyHouseLevel(level) {
  if (interior) {
    interior.tiers.forEach(t => { t.grp.visible = (level >= t.from && level <= t.until); });
    const wc = interior.wallColors[Math.min(level, 5)];
    interior.wallMats.forEach(m => m.color.setHex(wc));
    const b = interior.bulbs[Math.min(level, 5)];
    interior.bulbLight.intensity = b.i; interior.bulbLight.color.setHex(b.c);
    interior.bulb.material.emissive.setHex(b.c);
  }
  if (exterior) {
    exterior.tiers.forEach(t => { t.grp.visible = (level >= t.from && level <= t.until); });
    mat.poorHouse.color.setHex(exterior.wallColors[Math.min(level, 5)]);
  }
  // the roof lifts onto the new second storey, and bedrooms furnish as the family grows into them
  if (poorHouse) poorHouse.roof.position.y = (level >= 3 ? 5.05 : 2.75);
  if (upstairs) { upstairs.kidsGrp.visible = level >= 3; upstairs.parentsGrp.visible = level >= 4; }
  if (level < 3 && state.floor === 'upper') { setFloor('ground'); if (state.inHouse) catGroup.position.set(-2.4, 0, 1.9); }
}

function updateEnterPrompt() {
  const btn = document.getElementById('enter-btn');
  if (state.inHouse || state.inShop || state.inShelter || state.inBoughtHome || state.inBiz || state.inWork) { btn.textContent = '🚪 Leave'; btn.classList.add('show'); return; }
  const cp = catGroup.position;
  let target = null, label = '';
  if (Math.hypot(cp.x - (-3), cp.z - (-7.7)) < 2.6) { target = 'house'; label = '🚪 Enter Home'; }
  else if (state.owned.shop && shopIsOpen() && Math.hypot(cp.x - (-18), cp.z - (-6.3)) < 3.2) { target = 'shop'; label = '🚪 Enter Shop'; }
  else if (Math.hypot(cp.x - SHELTER.x, cp.z - (SHELTER.z - 5)) < 4.2) { target = 'shelter'; label = '🚪 Enter Shelter'; }
  else {
    for (const p of PROPERTIES) {
      if (p.type === 'home' && state.owned.homes.includes(p.id) && Math.hypot(cp.x - p.x, cp.z - (p.z + 2.6)) < 3.2) {
        target = 'boughthome'; label = '🚪 Enter Home'; state.nearHomeDoor = { x: p.x, z: p.z + 2.5 }; state.nearHomeId = p.id; break;
      }
    }
    if (!target && typeof BUSINESS_LOTS !== 'undefined') {   // your businesses
      for (const id in BUSINESS_LOTS) {
        const lot = BUSINESS_LOTS[id];
        if (ownsBusiness(id) && Math.hypot(cp.x - lot.x, cp.z - (lot.z + 3)) < 3) {
          target = 'biz'; label = '🚪 Enter ' + bizDef(id).name; state.nearBizId = id; break;
        }
      }
    }
    if (!target && typeof CIVIC_LOTS !== 'undefined') {   // your public works (doors face south)
      for (const id in CIVIC_LOTS) {
        const lot = CIVIC_LOTS[id];
        if (ownsCivic(id) && Math.hypot(cp.x - lot.x, cp.z - (lot.z - 3.5)) < 3.2) {
          target = 'civic'; label = '🚪 Enter ' + civicDef(id).name; state.nearCivicId = id; break;
        }
      }
    }
    if (!target && typeof JOB_SITES !== 'undefined') {   // the shops you can work at — anyone can pop in
      for (const s of JOB_SITES) {
        if (Math.hypot(cp.x - s.x, cp.z - (s.z + 0.3)) < 3.0) {
          target = 'workplace'; label = '🚪 Enter ' + s.name.replace(/^the /, ''); state.nearWorkId = s.id; break;
        }
      }
    }
  }
  state.nearBuilding = target; state.nearHouse = target === 'house';
  if (target) { btn.textContent = label; btn.classList.add('show'); }
  else btn.classList.remove('show');
}

// After jail the Millers have disowned you: the first time you try the door, the dramatic
// rejection cutscene plays (one time only); after that the door just stays shut.
function millerRejection() {
  if (state.seenDisown) {
    showNotif('🚪 The Millers shut the door on you. They don\'t want to see you anymore. 💔');
    return;
  }
  state.seenDisown = true;
  if (typeof saveGame === 'function') saveGame();
  const after = () => { showNotif('💔 The Millers have disowned you. Earn an honest home of your own to start again.'); if (typeof saveGame === 'function') saveGame(); };
  if (typeof playRejectionCutscene === 'function') playRejectionCutscene(after);
  else after();
}

function enterHouse() {
  state.inHouse = true;
  setFloor('ground');                       // always arrive on the ground floor
  refreshDiplomaWall();                     // 🎓 your degrees hang framed on the wall
  houseScene.add(catGroup);                 // moves the cat from the overworld scene
  catGroup.scale.setScalar(CAT_SCALE_IN);   // a real cat is tiny next to the furniture
  catGroup.position.set(0.6, 0, 2.2);
  catGroup.rotation.y = Math.PI;            // face into the room
  state.camYaw = 0; state.camHeight = 6; state.camDist = 4.8;
  camera.position.set(catGroup.position.x, state.camHeight, catGroup.position.z + state.camDist);
  document.getElementById('minimap').style.display = 'none';
  // the welcome-home line grows with the house — no more "cold and empty" once it isn't
  const HOME_LINES = [
    "So this is home… cold, and so little here. I have to help them.",
    "A little warmer than it was… we're getting somewhere, one coin at a time.",
    "Look at that — real furniture, food in the cupboard. This is starting to feel like a home.",
    "Warm lights, a proper bed, laughter in the kitchen… we've come so far.",
    "Our house is lovely now. Who'd believe how it looked when I arrived?",
    "Home sweet home — cosy, bright and full of love. We really did it. ❤️",
  ];
  showDialogue(state.catName + ' 🐱', HOME_LINES[Math.max(0, Math.min(HOME_LINES.length - 1, state.houseLevel || 0))], 5200);
}

function exitHouse() {
  state.inHouse = false;
  setFloor('ground');
  scene.add(catGroup);
  catGroup.scale.setScalar(CAT_SCALE_OUT);
  catGroup.position.set(-3, 0, -7.4);
  catGroup.rotation.y = 0;
  state.camYaw = 0; state.camHeight = 7; state.camDist = 9;
  camera.position.set(catGroup.position.x, state.camHeight, catGroup.position.z + state.camDist);
  document.getElementById('minimap').style.display = '';
  document.getElementById('stairs-btn').classList.remove('show');
  state.nearHouse = false;
}

function toggleHouse() {
  if (typeof sfx === 'function' && (state.inHouse || state.inShop || state.inShelter || state.inBoughtHome || state.inBiz || state.inWork || state.nearBuilding)) sfx('door');
  if (state.inHouse) exitHouse();
  else if (state.inShop) exitShop();
  else if (state.inShelter) exitShelter();
  else if (state.inBoughtHome) exitBoughtHome();
  else if (state.inBiz) exitBusiness();
  else if (state.inWork && typeof exitWorkplace === 'function') exitWorkplace();
  else if (state.nearBuilding === 'house') { if (state.disowned) millerRejection(); else enterHouse(); }
  else if (state.nearBuilding === 'shop') enterShop();
  else if (state.nearBuilding === 'shelter') enterShelter();
  else if (state.nearBuilding === 'boughthome') enterBoughtHome(state.nearHomeDoor);
  else if (state.nearBuilding === 'biz') enterBusiness(state.nearBizId);
  else if (state.nearBuilding === 'civic') enterCivic(state.nearCivicId);
  else if (state.nearBuilding === 'workplace' && typeof enterWorkplace === 'function') enterWorkplace(state.nearWorkId);
}

// ── Enter / leave the shop and the cat shelter ──
function enterShop() {
  state.inShop = true;
  shopScene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_IN);
  catGroup.position.set(0, 0, 4); catGroup.rotation.y = Math.PI;
  state.camYaw = 0; state.camHeight = 8; state.camDist = 6.5;
  camera.position.set(0, state.camHeight, 4 + state.camDist);
  document.getElementById('minimap').style.display = 'none';
  if (typeof spawnShopWorkers === 'function') spawnShopWorkers();   // your hired staff, at work
  showDialogue('Daniel 🔧', "Welcome to the shop, little one! Business is good — thanks to you. Have a look around.", 4600);
}
function exitShop() {
  if (typeof clearBizWorkers === 'function') clearBizWorkers();
  state.inShop = false; scene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_OUT);
  catGroup.position.set(-18, 0, -6.0); catGroup.rotation.y = 0;
  state.camYaw = 0; state.camHeight = 7; state.camDist = 9;
  camera.position.set(-18, state.camHeight, -6 + 9);
  document.getElementById('minimap').style.display = '';
}
function enterShelter() {
  state.inShelter = true;
  shelterScene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_IN);
  catGroup.position.set(0, 0, 5); catGroup.rotation.y = Math.PI;
  state.camYaw = 0; state.camHeight = 9; state.camDist = 8;
  camera.position.set(0, state.camHeight, 5 + state.camDist);
  document.getElementById('minimap').style.display = 'none';
  showDialogue(state.catName + ' 🐱', "So many cats… some hoping for a home, some just here for a warm bed. I could nap, or play a while.", 5000);
}
function exitShelter() {
  state.inShelter = false; scene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_OUT);
  catGroup.position.set(SHELTER.x, 0, SHELTER.z - 6); catGroup.rotation.y = 0;
  state.camYaw = 0; state.camHeight = 7; state.camDist = 9;
  camera.position.set(SHELTER.x, state.camHeight, SHELTER.z - 6 + 9);
  document.getElementById('minimap').style.display = '';
}

// ── Moving between floors (the staircase, available once the home has grown) ──
function setFloor(f) {
  state.floor = f;
  if (groundGroup) groundGroup.visible = (f === 'ground');
  if (upstairsGroup) upstairsGroup.visible = (f === 'upper');
}
function goUpstairs() {
  if (state.houseLevel < 3) return;
  setFloor('upper');
  catGroup.position.set(-2.4, 0, 1.6); catGroup.rotation.y = Math.PI;
  state.catBaseY = 0; catGroup.position.y = 0; state._stairCd = 55;
  showDialogue(state.catName + ' 🐱', 'Upstairs… they each have their own room now. We did that. 😊', 3800);
}
function goDownstairs() {
  setFloor('ground');
  const sp = stairsSpot();
  catGroup.position.set(sp.x + 0.9, 0, sp.z + 1.9); catGroup.rotation.y = 0;   // at the FOOT of the stairs
  state.catBaseY = 0; catGroup.position.y = 0; state._stairCd = 55;
}
function toggleStairs() {
  if (!state.inHouse) return;
  if (state.floor === 'upper') goDownstairs(); else goUpstairs();
}
function updateStairsPrompt() {
  const btn = document.getElementById('stairs-btn');
  if (!state.inHouse || state.houseLevel < 3) { btn.classList.remove('show'); return; }
  const sp = stairsSpot();
  const near = Math.hypot(catGroup.position.x - sp.x, catGroup.position.z - sp.z) < 1.8;
  if (near) { btn.textContent = state.floor === 'upper' ? '⬇️ Go Downstairs' : '⬆️ Go Upstairs'; btn.classList.add('show'); }
  else btn.classList.remove('show');
}

// ─── Home Store decor (note 7): things you buy that appear in the Miller home ────
const HOME_ITEMS = [
  { id: 'yarn',     name: 'Ball of Yarn',    icon: '🧶', price: 8 },
  { id: 'rug',      name: 'Plush Rug',       icon: '🟦', price: 15 },
  { id: 'plant',    name: 'Leafy Plant',     icon: '🪴', price: 18 },
  { id: 'catbed',   name: 'Cosy Cat Bed',    icon: '🛏️', price: 22 },
  { id: 'painting', name: 'Family Painting', icon: '🖼️', price: 28 },
  { id: 'cattree',  name: 'Cat Tree Tower',  icon: '🏰', price: 45 },
  { id: 'bookshelf',name: 'Bookshelf',       icon: '🗄️', price: 30 },
  { id: 'lamp',     name: 'Floor Lamp',      icon: '💡', price: 20 },
  { id: 'tv',       name: 'Television',      icon: '📺', price: 40 },
  { id: 'clock',    name: 'Grandfather Clock',icon: '🕰️', price: 26 },
  { id: 'aquarium', name: 'Fish Tank',       icon: '🐠', price: 35 },
  { id: 'crate',    name: 'Stacked Crates',  icon: '📦', price: 12 },
  // The essentials a bare home needs — the poor Millers can't afford these, so you buy them
  { id: 'couch',    name: 'Couch',           icon: '🛋️', price: 35 },
  { id: 'diningset',name: 'Dining Table Set', icon: '🍽️', price: 30 },
  { id: 'bed',      name: 'Family Bed',       icon: '🛌', price: 40 },
  { id: 'counter',  name: 'Kitchen Counter',  icon: '🧑‍🍳', price: 20 },
  { id: 'stove',    name: 'Stove / Oven',     icon: '🍳', price: 22 },
  { id: 'fridge',   name: 'Fridge',           icon: '🧊', price: 28 },
  // Walls you can add as many of as you like — buy, then drag/rotate to divide the rooms
  { id: 'wall',      name: 'Wall Section',    icon: '🧱', price: 15, multi: true },
  { id: 'wallshort', name: 'Short Wall',      icon: '🧱', price: 10, multi: true },
];
// Shop-appropriate stock & fittings (Dad's shop sells these, not couches & beds!)
const SHOP_ITEMS = [
  { id: 'shelfunit',    name: 'Stock Shelf',      icon: '🗄️', price: 25 },
  { id: 'displaystand', name: 'Display Stand',    icon: '🛍️', price: 18 },
  { id: 'produce',      name: 'Produce Crate',    icon: '🧺', price: 15 },
  { id: 'coffeemachine',name: 'Coffee Machine',   icon: '☕', price: 30 },
  { id: 'fridge',       name: 'Display Fridge',   icon: '🧊', price: 28 },
  { id: 'counter',      name: 'Sales Counter',    icon: '🧾', price: 22 },
  { id: 'crate',        name: 'Stacked Crates',   icon: '📦', price: 12 },
  { id: 'plant',        name: 'Potted Plant',     icon: '🪴', price: 18 },
  { id: 'clock',        name: 'Wall Clock',       icon: '🕰️', price: 26 },
  { id: 'lamp',         name: 'Shop Lamp',        icon: '💡', price: 20 },
  { id: 'wall',         name: 'Wall Section',     icon: '🧱', price: 15, multi: true },
  { id: 'wallshort',    name: 'Short Wall',       icon: '🧱', price: 10, multi: true },
];
// Themed fittings for each kind of business — bakery gets baking gear, factory machines, etc.
const BIZ_COMMON = [
  { id: 'crate',    name: 'Stacked Crates', icon: '📦', price: 12 },
  { id: 'plant',    name: 'Potted Plant',   icon: '🪴', price: 18 },
  { id: 'lamp',     name: 'Lamp',           icon: '💡', price: 20 },
  { id: 'clock',    name: 'Wall Clock',     icon: '🕰️', price: 26 },
  { id: 'counter',  name: 'Counter',        icon: '🧾', price: 22 },
  { id: 'wall',     name: 'Wall Section',   icon: '🧱', price: 15, multi: true },
  { id: 'wallshort',name: 'Short Wall',     icon: '🧱', price: 10, multi: true },
];
const BIZ_ITEMS = {
  cafe: [
    { id: 'coffeemachine', name: 'Espresso Machine', icon: '☕', price: 40 },
    { id: 'cafetable',     name: 'Café Table',       icon: '🪑', price: 26 },
    { id: 'displaystand',  name: 'Pastry Stand',     icon: '🧁', price: 24 },
    { id: 'fridge',        name: 'Drinks Fridge',    icon: '🧊', price: 30 },
  ],
  bakery: [
    { id: 'oven',       name: 'Baking Oven',     icon: '🔥', price: 45 },
    { id: 'breadrack',  name: 'Bread Rack',      icon: '🥖', price: 32 },
    { id: 'displaystand',name: 'Cake Display',   icon: '🎂', price: 28 },
    { id: 'fridge',     name: 'Display Fridge',  icon: '🧊', price: 30 },
  ],
  market: [
    { id: 'fruitstand',   name: 'Produce Stand',  icon: '🍎', price: 28 },
    { id: 'produce',      name: 'Produce Crate',  icon: '🧺', price: 15 },
    { id: 'shelfunit',    name: 'Stock Shelf',    icon: '🗄️', price: 25 },
    { id: 'fridge',       name: 'Chiller',        icon: '🧊', price: 30 },
  ],
  factory: [
    { id: 'machine',   name: 'Machine',      icon: '🏭', price: 50 },
    { id: 'barrel',    name: 'Steel Barrel', icon: '🛢️', price: 20 },
    { id: 'shelfunit', name: 'Parts Shelf',  icon: '🗄️', price: 25 },
    { id: 'conveyor',  name: 'Conveyor',     icon: '📦', price: 38 },
  ],
};
// Which catalogue a room shows: Dad's shop stocks shop fittings; homes get furniture; businesses get themed gear
function storeCatalog(ck) {
  if (ck === 'biz') return (BIZ_ITEMS[state.currentBiz] || []).concat(BIZ_COMMON);
  return ck === 'shop' ? SHOP_ITEMS : HOME_ITEMS;
}
// Each decor item is its own movable group, anchored where it originally sat so the
// default layout is unchanged — the editor then lets the player drag/rotate it freely.
const DECOR_ANCHOR = {
  yarn: [0.1, 0.5], rug: [0.4, 0.7], plant: [-3.05, -0.6],
  catbed: [0.35, 1.7], painting: [0.9, -2.9], cattree: [3.05, -1.3],
  bookshelf: [-3.0, -1.6], lamp: [-3.0, 0.2], tv: [-3.0, 2.0],
  clock: [3.0, -0.5], aquarium: [3.0, 2.0], crate: [0.5, 2.2],
  couch: [-2.3, 1.4], diningset: [-0.6, -0.5], bed: [2.55, 1.0],
  counter: [2.4, -2.35], stove: [1.15, -2.35], fridge: [3.05, -2.35],
};
// The three decorable interiors, each with its own scene group, floor bounds & save keys.
const DECOR_CTX = {
  home:   { target: () => groundGroup,     bx: 3.2, bz: 2.6, list: 'decor',       xf: 'decorXf',       label: 'Miller Home',  col: () => groundColliders },
  upper:  { target: () => upstairsGroup,   bx: 3.2, bz: 2.6, list: 'decorUpper',  xf: 'decorXfUpper',  label: 'Upstairs',     col: () => upstairsColliders },
  shop:   { target: () => shopScene,       bx: 6.2, bz: 4.2, list: 'decorShop',   xf: 'decorXfShop',   label: "Dad's Shop",   col: () => shopColliders },
  bought: { target: () => boughtHomeScene, bx: 5.2, bz: 3.9, list: 'decorBought', xf: 'decorXfBought', label: 'New Home',     col: () => boughtHomeColliders },
  // each business you own is decorated separately (stored per business id, see decorList/decorXfMap)
  biz:    { target: () => bizScene,        bx: 6.2, bz: 4.2, list: 'decorBiz',    xf: 'decorXfBiz',    col: () => bizColliders,
            get label() { return (typeof bizDef === 'function' && state.currentBiz) ? bizDef(state.currentBiz).name : 'Business'; } },
};
const decorReg = { home: {}, upper: {}, shop: {}, bought: {}, biz: {} };   // ctx -> { id: THREE.Group }
function decorList(ck)  {
  if (ck === 'biz') { const m = state.owned.decorBiz || (state.owned.decorBiz = {}); const id = state.currentBiz || '_'; return m[id] || (m[id] = []); }
  const n = DECOR_CTX[ck].list; return state.owned[n] || (state.owned[n] = []);
}
function decorXfMap(ck) {
  if (ck === 'biz') { const m = state.decorXfBiz || (state.decorXfBiz = {}); const id = state.currentBiz || '_'; return m[id] || (m[id] = {}); }
  const n = DECOR_CTX[ck].xf; return state[n] || (state[n] = {});
}

// ─── Built-in furniture ("fixtures") — the pieces you DIDN'T buy but can still move ──
// Each is wrapped in its own group (built relative to an anchor) and registered with the
// editor, so the couch, table, bed, stairs, shop shelves… all drag & rotate like decor.
const fixtureReg = {};   // id -> { group, anchor:{x,z}, coll, collRef, ctx }
function makeFixture(ctx, id, target, colArr, ax, az, buildFn, coll, tierMin) {
  const g = new THREE.Group(); target.add(g);
  const B = (w, h, d, m, x, y, z) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
  const C = (rt, rb, h, s, m, x, y, z) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
  buildFn(B, C);
  const xf = (state.fixtureXf && state.fixtureXf[id]) || { x: ax, z: az, ry: 0 };
  g.position.set(xf.x, 0, xf.z); g.rotation.y = xf.ry || 0;
  g.userData = { id, isDecor: true, fixture: true, ctx };
  decorReg[ctx][id] = g;
  let collRef = null;
  if (coll && colArr) { collRef = { type: 'box', x0: 0, x1: 0, z0: 0, z1: 0 }; if (tierMin) collRef.min = tierMin; colArr.push(collRef); }
  fixtureReg[id] = { group: g, anchor: { x: ax, z: az }, coll, collRef, ctx };
  applyFixtureCollider(id);
  return g;
}
function applyFixtureCollider(id) {
  const f = fixtureReg[id];
  if (!f || !f.coll || !f.collRef) return;
  const g = f.group, c = f.coll;   // axis-aligned box that follows the piece (rotation ignored for collision)
  f.collRef.x0 = g.position.x + c.dx0; f.collRef.x1 = g.position.x + c.dx1;
  f.collRef.z0 = g.position.z + c.dz0; f.collRef.z1 = g.position.z + c.dz1;
}
function applyFixtureXf() {
  Object.keys(fixtureReg).forEach(id => {
    const f = fixtureReg[id];
    const xf = (state.fixtureXf && state.fixtureXf[id]) || { x: f.anchor.x, z: f.anchor.z, ry: 0 };
    f.group.position.set(xf.x, 0, xf.z); f.group.rotation.y = xf.ry || 0;
    applyFixtureCollider(id);
  });
}
// The staircase can be moved, so the "go upstairs" spot follows it
function stairsSpot() {
  const f = fixtureReg.stairs;
  return f ? { x: f.group.position.x, z: f.group.position.z } : { x: -2.7, z: 2.1 };
}
// The stair surface: how high the steps are under (x,z) — 0 when off the staircase.
// Follows the fixture wherever the player moves/rotates it.
function houseStairY(x, z) {
  if (state.houseLevel < 3) return 0;
  const f = fixtureReg.stairs; if (!f) return 0;
  const gp = f.group.position, ry = f.group.rotation.y || 0;
  const dx = x - gp.x, dz = z - gp.z;
  const lx = dx * Math.cos(ry) - dz * Math.sin(ry);        // into the staircase's local space
  const lz = dx * Math.sin(ry) + dz * Math.cos(ry);
  if (Math.abs(lx) > 0.55 || lz > 1.85 || lz < -1.75) return 0;
  const p = (1.72 - lz) / 3.3;                              // 0 at the bottom step → 1 at the top
  return Math.max(0, Math.min(10, Math.ceil(p * 10))) * 0.24;
}
// Walking transitions between the floors (the ⬆️/⬇️ button still works as a shortcut)
function walkUpstairs() {
  if (state.houseLevel < 3) return;
  setFloor('upper');
  catGroup.position.set(-2.4, 0, 1.6); catGroup.rotation.y = Math.PI;   // arrive at the fixed upstairs landing
  state.catBaseY = 0; catGroup.position.y = 0;
  state._stairCd = 55; state._stairArm = false;                          // step off the landing before it can take you down
  if (!state._seenUpWalk) { state._seenUpWalk = true; showDialogue(state.catName + ' 🐱', 'Up the stairs, paw by paw… their own little rooms. We built this. 😊', 4200); }
}
function walkDownstairs() {
  setFloor('ground');
  const f = fixtureReg.stairs, ry = (f && f.group.rotation.y) || 0;
  const sp = stairsSpot();
  // step onto the TOP of the staircase and stroll down it
  catGroup.position.set(sp.x + Math.sin(ry) * -1.4, 0, sp.z + Math.cos(ry) * -1.4);
  state.catBaseY = 2.4; catGroup.position.y = 2.4;
  state._stairCd = 55;
}
// Where a freshly-bought item first appears. Home keeps its cosy hand-placed spots;
// bigger rooms scatter items across the floor so they don't stack.
function decorDefaultPos(id, ck) {
  if (WALL_COLL[id.split('_')[0]]) return { x: (Math.random() - 0.5) * 2, z: (Math.random() - 0.5) * 2 };   // walls drop near the middle
  if (ck === 'home') { const a = DECOR_ANCHOR[id] || [0, 0]; return { x: a[0], z: a[1] }; }
  const b = DECOR_CTX[ck], n = Math.max(decorList(ck).indexOf(id), 0);
  return { x: -b.bx * 0.6 + (n % 3) * (b.bx * 0.6), z: -b.bz * 0.5 + Math.floor(n / 3) * (b.bz * 0.5) };
}
// Buyable walls carry a collider that follows them (so they actually block the cat)
const WALL_COLL = {
  wall:      { dx0: -0.1, dx1: 0.1, dz0: -0.8, dz1: 0.8 },
  wallshort: { dx0: -0.1, dx1: 0.1, dz0: -0.45, dz1: 0.45 },
};
function attachDecorCollider(g, ck, half) {
  const arr = DECOR_CTX[ck].col && DECOR_CTX[ck].col();
  if (!arr) return;
  const ref = { type: 'box', x0: 0, x1: 0, z0: 0, z1: 0 };
  arr.push(ref);
  g.userData.collRef = ref; g.userData.collHalf = half; g.userData.collArr = arr;
  updateDecorCollider(g);
}
function updateDecorCollider(g) {
  const ref = g.userData.collRef, c = g.userData.collHalf;
  if (!ref || !c) return;
  const rot = Math.abs(Math.sin(g.rotation.y)) > 0.5;   // rotated ~90° → swap the footprint
  const dx0 = rot ? c.dz0 : c.dx0, dx1 = rot ? c.dz1 : c.dx1, dz0 = rot ? c.dx0 : c.dz0, dz1 = rot ? c.dx1 : c.dz1;
  ref.x0 = g.position.x + dx0; ref.x1 = g.position.x + dx1;
  ref.z0 = g.position.z + dz0; ref.z1 = g.position.z + dz1;
}
function removeDecorCollider(g) {
  if (g.userData.collRef && g.userData.collArr) {
    const idx = g.userData.collArr.indexOf(g.userData.collRef);
    if (idx >= 0) g.userData.collArr.splice(idx, 1);
  }
  g.userData.collRef = null;
}
function buildDecorItem(id, ck) {
  ck = ck || 'home';
  const target = DECOR_CTX[ck].target();
  if (!target) return;
  const reg = decorReg[ck];
  if (reg[id]) { removeDecorCollider(reg[id]); target.remove(reg[id]); delete reg[id]; }   // avoid duplicates on rebuild
  const g = new THREE.Group();
  const add = m => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const box = (w, h, d, m, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); me.position.set(x, y, z); };
  const cyl = (rt, rb, h, s, m, x, y, z) => { const me = add(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m)); me.position.set(x, y, z); };
  const sph = (r, m, x, y, z) => { const me = add(new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m)); me.position.set(x, y, z); };
  // geometry is built RELATIVE to the item's anchor (so the group can be moved & rotated as one)
  if (id === 'yarn') { sph(0.12, pbr(0xd05a7a, 0.85), 0, 0.12, 0); }
  else if (id === 'rug') { box(1.6, 0.02, 1.1, pbr(0x3a6a9a, 0.95), 0, 0.012, 0); box(1.15, 0.021, 0.65, pbr(0x6a9ac0, 0.95), 0, 0.013, 0); }
  else if (id === 'plant') { cyl(0.18, 0.22, 0.4, 12, pbr(0x8a5a3a, 0.8), 0, 0.2, 0); sph(0.3, pbr(0x3a7a34, 0.9), 0, 0.6, 0); sph(0.22, pbr(0x4a8a44, 0.9), 0.2, 0.75, 0.1); }
  else if (id === 'catbed') { cyl(0.4, 0.44, 0.16, 16, pbr(0x9a5a6a, 0.9), 0, 0.08, 0); cyl(0.3, 0.3, 0.06, 16, pbr(0xe8d8c0, 0.9), 0, 0.16, 0); }
  else if (id === 'painting') { box(0.72, 0.52, 0.05, pbr(0x6a4a2c, 0.7), 0, 1.7, 0); box(0.6, 0.42, 0.02, pbr(0x9ab0c0, 0.5), 0, 1.7, 0.03); }
  else if (id === 'cattree') { cyl(0.12, 0.14, 1.6, 12, pbr(0x8a6a4a, 0.9), 0, 0.8, 0); box(0.6, 0.06, 0.6, pbr(0x9a7a5a, 0.9), 0, 0.72, 0); box(0.7, 0.06, 0.7, pbr(0x9a7a5a, 0.9), 0, 1.52, 0); cyl(0.28, 0.3, 0.12, 14, pbr(0xc06a7a, 0.9), 0, 1.62, 0); }
  else if (id === 'bookshelf') {
    box(1.1, 1.7, 0.35, pbr(0x6a4a2c, 0.85), 0, 0.85, 0);
    for (let s = 0; s < 3; s++) for (let i = 0; i < 5; i++) box(0.14, 0.34, 0.28, pbr([0xc0503a, 0x3a6a9a, 0xd0a040, 0x4a8a5a, 0x8a5aa0][(s * 5 + i) % 5], 0.8), -0.42 + i * 0.2, 0.45 + s * 0.5, 0.03);
  }
  else if (id === 'lamp') {
    cyl(0.18, 0.22, 0.06, 14, pbr(0x3a3a3a, 0.5), 0, 0.03, 0);
    cyl(0.03, 0.03, 1.3, 8, pbr(0x8a8a8a, 0.4, 0.4), 0, 0.7, 0);
    cyl(0.24, 0.32, 0.36, 14, pbr(0xf0e0b0, 0.6), 0, 1.5, 0);
    sph(0.08, new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffcf70, emissiveIntensity: 0.8 }), 0, 1.42, 0);
  }
  else if (id === 'tv') {
    box(1.2, 0.5, 0.4, pbr(0x5a4a3a, 0.8), 0, 0.25, 0);
    box(1.5, 0.9, 0.09, pbr(0x18181c, 0.4), 0, 1.15, 0);
    box(1.32, 0.74, 0.02, new THREE.MeshStandardMaterial({ color: 0x2a3a4a, emissive: 0x1a2a4a, emissiveIntensity: 0.5 }), 0, 1.15, 0.06);
  }
  else if (id === 'clock') {
    box(0.4, 1.7, 0.3, pbr(0x5a3a1e, 0.8), 0, 0.85, 0);
    box(0.28, 0.28, 0.03, pbr(0xf0ece0, 0.6), 0, 1.45, 0.16);
    box(0.02, 0.12, 0.02, pbr(0x2a2a2a, 0.4), 0, 1.5, 0.18);
    box(0.1, 0.02, 0.02, pbr(0x2a2a2a, 0.4), 0.04, 1.45, 0.18);
  }
  else if (id === 'aquarium') {
    box(1.0, 0.5, 0.5, pbr(0x5a4a3a, 0.8), 0, 0.25, 0);
    box(0.9, 0.5, 0.45, new THREE.MeshStandardMaterial({ color: 0x6ab0e0, transparent: true, opacity: 0.4, roughness: 0.1 }), 0, 0.75, 0);
    sph(0.06, pbr(0xe07a3a, 0.5), -0.15, 0.75, 0.12); sph(0.05, pbr(0xf0c040, 0.5), 0.2, 0.82, -0.05);
  }
  else if (id === 'crate') {
    box(0.6, 0.6, 0.6, pbr(0x9a6a3a, 0.85), -0.2, 0.3, 0);
    box(0.6, 0.6, 0.6, pbr(0x8a5a2a, 0.85), 0.35, 0.3, 0.1);
    box(0.6, 0.6, 0.6, pbr(0xa07a4a, 0.85), 0.05, 0.9, -0.05);
  }
  else if (id === 'couch') {
    for (const zz of [[0, 0.35, 0, 1.8, 0.5, 0.75], [0, 0.72, -0.35, 1.8, 0.55, 0.18], [-0.85, 0.55, 0, 0.2, 0.5, 0.75], [0.85, 0.55, 0, 0.2, 0.5, 0.75]])
      box(zz[3], zz[4], zz[5], pbr(0x6a6f7a, 0.96), zz[0], zz[1], zz[2]);
  }
  else if (id === 'diningset') {
    box(1.4, 0.08, 0.9, pbr(0x6a4a2c, 0.8), 0, 0.78, 0);
    [[-0.62,-0.38],[0.62,-0.38],[-0.62,0.38],[0.62,0.38]].forEach(([lx, lz]) => box(0.08, 0.78, 0.08, pbr(0x49331f, 0.8), lx, 0.39, lz));
    // four stools, one at each seat (matches HOME_SEATS so the family actually sits on them)
    const stool = (cx, cz, col) => {
      box(0.42, 0.09, 0.42, pbr(col, 0.8), cx, 0.46, cz);   // seat
      [[-0.14,-0.14],[0.14,-0.14],[-0.14,0.14],[0.14,0.14]].forEach(([qx, qz]) => box(0.05, 0.46, 0.05, pbr(0x49331f, 0.8), cx + qx, 0.23, cz + qz));
    };
    stool(0, 0.72, 0x7a5230); stool(0, -0.72, 0x6a4a2c); stool(0.85, 0, 0x7a5230); stool(-0.85, 0, 0x6a4a2c);
  }
  else if (id === 'bed') {
    box(1.4, 0.3, 2.1, pbr(0x6a4a2c, 0.8), 0, 0.2, 0);
    box(1.3, 0.2, 1.95, pbr(0xeae0cc, 0.9), 0, 0.42, 0);
    box(1.3, 0.14, 0.8, pbr(0x5a7a9a, 0.9), 0, 0.52, 0.55);
    cyl(0.22, 0.22, 0.14, 12, pbr(0xf2ece0, 0.9), 0, 0.55, -0.65);
  }
  else if (id === 'counter') {
    box(1.8, 0.9, 0.6, pbr(0x6a4a2c, 0.8), 0, 0.45, 0);
    box(1.85, 0.08, 0.64, pbr(0x49331f, 0.8), 0, 0.92, 0);
  }
  else if (id === 'stove') {
    box(0.75, 0.9, 0.6, pbr(0x9aa0a6, 0.45, 0.5), 0, 0.45, 0);
    [[-0.18,-0.14],[0.18,-0.14],[-0.18,0.14],[0.18,0.14]].forEach(([bx, bz]) => cyl(0.12, 0.12, 0.02, 14, pbr(0x2a2a2a, 0.6), bx, 0.91, bz));
    box(0.5, 0.35, 0.02, pbr(0x1a1a1a, 0.3), 0, 0.5, 0.31);
  }
  else if (id === 'fridge') {
    box(0.72, 1.5, 0.6, pbr(0xd8d4c8, 0.5), 0, 0.75, 0);
    box(0.72, 0.05, 0.6, pbr(0xc0bcb0, 0.5), 0, 0.98, 0.01);
    box(0.05, 0.34, 0.05, pbr(0x9aa0a6, 0.45, 0.5), -0.33, 0.9, 0.3);
  }
  else if (id === 'shelfunit') {                         // shop stock shelf
    box(2.0, 1.9, 0.5, pbr(0x7a5a3a, 0.85), 0, 0.95, 0);
    for (let s = 0; s < 3; s++) for (let i = 0; i < 4; i++) box(0.4, 0.4, 0.4, pbr([0xc0392b, 0x2a6acc, 0xf0c020, 0x40a060][(s + i) % 4], 0.7), -0.7 + i * 0.46, 0.5 + s * 0.55, 0.06);
  }
  else if (id === 'displaystand') {                      // low display table with goods
    box(1.4, 0.6, 0.9, pbr(0x8a6a4a, 0.85), 0, 0.3, 0);
    box(1.4, 0.06, 0.9, pbr(0x6a4a2c, 0.8), 0, 0.63, 0);
    [[-0.4, 0xd05a4a], [0, 0xe0a83c], [0.4, 0x6a9a4a]].forEach(([dx, c]) => sph(0.12, pbr(c, 0.6), dx, 0.75, 0));
  }
  else if (id === 'produce') {                           // crate of fruit
    box(0.8, 0.4, 0.6, pbr(0x9a6a3a, 0.85), 0, 0.2, 0);
    [[-0.2, 0.1, 0xc0392b], [0.05, 0.12, 0xe0a83c], [0.22, 0.09, 0x8ac040], [-0.05, 0.14, 0xd0603a]].forEach(([x, z, c]) => sph(0.11, pbr(c, 0.6), x, 0.42, z));
  }
  else if (id === 'coffeemachine') {                     // café coffee machine on a stand
    box(0.9, 0.5, 0.6, pbr(0x6a4a2c, 0.8), 0, 0.25, 0);
    box(0.7, 0.55, 0.45, pbr(0x3a3a42, 0.4, 0.4), 0, 0.78, 0);
    box(0.55, 0.12, 0.05, pbr(0x1a1a1e, 0.3), 0, 0.58, 0.24);
    cyl(0.03, 0.03, 0.14, 8, pbr(0xc0c0c8, 0.3, 0.6), -0.12, 0.5, 0.24); cyl(0.03, 0.03, 0.14, 8, pbr(0xc0c0c8, 0.3, 0.6), 0.12, 0.5, 0.24);
    cyl(0.06, 0.05, 0.1, 10, pbr(0xf0ece0, 0.5), -0.12, 0.4, 0.24); cyl(0.06, 0.05, 0.1, 10, pbr(0xf0ece0, 0.5), 0.12, 0.4, 0.24);
  }
  else if (id === 'oven') {                              // bakery oven
    box(1.2, 1.4, 0.9, pbr(0x8a8f99, 0.5, 0.3), 0, 0.7, 0);
    box(0.9, 0.6, 0.06, pbr(0x2a1a12, 0.3), 0, 0.7, 0.46);
    box(0.9, 0.1, 0.04, new THREE.MeshStandardMaterial({ color: 0xffb040, emissive: 0xff6010, emissiveIntensity: 0.9, roughness: 0.4 }), 0, 0.5, 0.48);   // glowing door slit
    cyl(0.05, 0.05, 0.12, 8, pbr(0xc0c0c8, 0.3, 0.6), 0, 1.06, 0.45);
  }
  else if (id === 'breadrack') {                         // rack of loaves
    box(1.4, 1.6, 0.5, pbr(0x7a5a3a, 0.85), 0, 0.8, 0);
    for (let s = 0; s < 3; s++) { box(1.3, 0.05, 0.46, pbr(0x5a3a22, 0.8), 0, 0.5 + s * 0.5, 0); for (let i = 0; i < 4; i++) sph(0.12, pbr(0xd8a860, 0.6), -0.5 + i * 0.33, 0.62 + s * 0.5, 0); }
  }
  else if (id === 'cafetable') {                         // round café table + two stools
    cyl(0.08, 0.08, 0.7, 8, pbr(0x6a4a2c, 0.8), 0, 0.35, 0); cyl(0.55, 0.55, 0.07, 16, pbr(0x8a5a3a, 0.7), 0, 0.72, 0);
    [-0.7, 0.7].forEach(cx => cyl(0.18, 0.2, 0.08, 12, pbr(0x6a4a3a, 0.8), cx, 0.44, 0));
  }
  else if (id === 'fruitstand') {                        // slanted produce stand piled with fruit
    box(1.6, 0.5, 1.0, pbr(0x9a6a3a, 0.85), 0, 0.25, 0);
    box(1.6, 0.05, 1.0, pbr(0x6a4a2c, 0.8), 0, 0.55, -0.1);
    const cols = [0xc0392b, 0xe0a83c, 0x6a9a4a, 0xd06a5a, 0x8ac040, 0xe07a2a];
    for (let i = 0; i < 8; i++) sph(0.13, pbr(cols[i % cols.length], 0.6), -0.6 + (i % 4) * 0.4, 0.66 + (i > 3 ? 0.16 : 0), (i > 3 ? 0.15 : -0.15));
  }
  else if (id === 'machine') {                           // factory machine with pipes
    box(1.4, 1.6, 1.0, pbr(0x8a8f99, 0.5, 0.4), 0, 0.8, 0);
    cyl(0.14, 0.14, 1.2, 10, pbr(0x6a6a72, 0.4, 0.5), -0.5, 1.7, 0); cyl(0.14, 0.14, 1.2, 10, pbr(0x6a6a72, 0.4, 0.5), 0.5, 1.7, 0);
    box(0.5, 0.3, 0.05, pbr(0x2a3a4a, 0.3), 0, 1.0, 0.52); sph(0.08, new THREE.MeshStandardMaterial({ color: 0xff4030, emissive: 0xff2010, emissiveIntensity: 0.8, roughness: 0.3 }), 0.4, 1.3, 0.52);
  }
  else if (id === 'barrel') {                            // steel barrel
    cyl(0.34, 0.34, 0.9, 16, pbr(0x9aa0a6, 0.4, 0.5), 0, 0.45, 0);
    cyl(0.35, 0.35, 0.06, 16, pbr(0x6a6a72, 0.4, 0.5), 0, 0.25, 0); cyl(0.35, 0.35, 0.06, 16, pbr(0x6a6a72, 0.4, 0.5), 0, 0.65, 0);
  }
  else if (id === 'conveyor') {                          // conveyor belt with crates
    box(2.2, 0.4, 0.7, pbr(0x4a4a52, 0.6, 0.3), 0, 0.5, 0);
    box(2.2, 0.06, 0.66, pbr(0x2a2a30, 0.7), 0, 0.72, 0);
    [-0.6, 0.4].forEach(cx => box(0.4, 0.4, 0.4, pbr(0x9a6a3a, 0.85), cx, 0.95, 0));
  }
  else if (id.split('_')[0] === 'wall') { box(0.16, 2.3, 1.6, pbr(0xc8b89a, 0.95), 0, 1.15, 0); }
  else if (id.split('_')[0] === 'wallshort') { box(0.16, 2.3, 0.9, pbr(0xc8b89a, 0.95), 0, 1.15, 0); }
  const base = id.split('_')[0];
  const d = decorDefaultPos(id, ck);
  const xf = decorXfMap(ck)[id] || { x: d.x, z: d.z, ry: 0 };
  g.position.set(xf.x, 0, xf.z); g.rotation.y = xf.ry || 0;
  g.userData = { id, isDecor: true, ctx: ck };
  target.add(g); reg[id] = g;
  if (WALL_COLL[base]) attachDecorCollider(g, ck, WALL_COLL[base]);   // walls block the cat
}
function rebuildDecor() { Object.keys(DECOR_CTX).forEach(ck => decorList(ck).forEach(id => buildDecorItem(id, ck))); }

// ─── Sims-style furniture editor: tap to select, drag on the floor, rotate ────────
// Works in whichever decorable interior you're standing in.
let editSelected = null, _dragging = false;
const selRings = { home: null, upper: null, shop: null, bought: null };
const _decorRay = new THREE.Raycaster();
const _decorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);   // the floor, y = 0
const _decorHit = new THREE.Vector3();
let _dragOffX = 0, _dragOffZ = 0;

function currentDecorCtx() {
  if (state.inHouse) return state.floor === 'upper' ? 'upper' : 'home';
  if (state.inShop) return 'shop';
  if (state.inBoughtHome) return 'bought';
  if (state.inBiz) return 'biz';
  return null;
}
function editModeActive() { return state.editMode && currentDecorCtx() !== null; }
function ndcFrom(x, y) {
  // x,y arrive in GAME space (input handlers convert via gamePoint); the canvas fills
  // the whole game viewport, so normalize by the game dims — correct in rotated mode too
  return new THREE.Vector2((x / viewW()) * 2 - 1, -(y / viewH()) * 2 + 1);
}
function floorPoint(x, y) {
  _decorRay.setFromCamera(ndcFrom(x, y), camera);
  return _decorRay.ray.intersectPlane(_decorPlane, _decorHit) ? _decorHit : null;
}
function pickDecor(x, y, ck) {
  _decorRay.setFromCamera(ndcFrom(x, y), camera);
  const shown = g => { let o = g; while (o) { if (o.visible === false) return false; o = o.parent; } return true; };
  const groups = Object.values(decorReg[ck]).filter(shown);   // don't pick furniture hidden by house tier
  const hits = _decorRay.intersectObjects(groups, true);
  if (!hits.length) return null;
  let o = hits[0].object;
  while (o && !(o.userData && o.userData.isDecor)) o = o.parent;
  return o || null;
}
function ensureSelRing(ck) {
  if (selRings[ck]) return selRings[ck];
  const target = DECOR_CTX[ck].target();
  if (!target) return null;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 24),
    new THREE.MeshStandardMaterial({ color: 0xf0d060, emissive: 0x7a5a08, roughness: 0.4 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.03; ring.visible = false;
  target.add(ring); selRings[ck] = ring;
  return ring;
}
function selectDecor(g) {
  const ck = currentDecorCtx();
  Object.values(selRings).forEach(r => { if (r) r.visible = false; });   // clear rings in all rooms
  editSelected = g;
  if (!ck) return;
  const ring = ensureSelRing(ck);
  if (ring && g) { ring.visible = true; ring.position.set(g.position.x, 0.03, g.position.z); }
}
function commitDecorXf() {
  if (!editSelected) return;
  const id = editSelected.userData.id;
  const xf = { x: +editSelected.position.x.toFixed(3), z: +editSelected.position.z.toFixed(3), ry: +editSelected.rotation.y.toFixed(3) };
  if (editSelected.userData.fixture) {
    state.fixtureXf = state.fixtureXf || {};
    state.fixtureXf[id] = xf;
    applyFixtureCollider(id);
  } else {
    decorXfMap(editSelected.userData.ctx)[id] = xf;
    if (editSelected.userData.collRef) updateDecorCollider(editSelected);   // walls: keep the collider on the piece
  }
}
// Delegated pointer handlers (called from the canvas drag handlers). Return true = "handled".
function editorPointerDown(x, y) {
  const ck = currentDecorCtx();
  if (!state.editMode || !ck) return false;
  const hit = pickDecor(x, y, ck);
  if (hit) {
    selectDecor(hit);
    const fp = floorPoint(x, y);
    if (fp) { _dragOffX = hit.position.x - fp.x; _dragOffZ = hit.position.z - fp.z; }
    _dragging = true;
  } else { selectDecor(null); }
  return true;
}
function editorPointerMove(x, y) {
  const ck = currentDecorCtx();
  if (!state.editMode || !ck || !_dragging || !editSelected) return false;
  const fp = floorPoint(x, y); if (!fp) return true;
  const b = DECOR_CTX[ck];
  const nx = Math.max(-b.bx, Math.min(b.bx, fp.x + _dragOffX));
  const nz = Math.max(-b.bz, Math.min(b.bz, fp.z + _dragOffZ));
  editSelected.position.x = nx; editSelected.position.z = nz;
  if (editSelected.userData.collRef) updateDecorCollider(editSelected);
  const ring = selRings[ck]; if (ring) ring.position.set(nx, 0.03, nz);
  return true;
}
function editorPointerUp() {
  if (!editModeActive()) return false;
  if (_dragging) { _dragging = false; commitDecorXf(); if (typeof saveGame === 'function') saveGame(); }
  return true;
}
function rotateDecor() {
  if (!editSelected) { showNotif('Tap a piece of furniture first'); return; }
  if (typeof schoolEvent === 'function') schoolEvent('moveDecor');
  editSelected.rotation.y += Math.PI / 4;
  commitDecorXf(); if (typeof saveGame === 'function') saveGame();
}
// Remove the selected BOUGHT item (walls, decor) — built-in furniture can only be moved
function removeSelectedDecor() {
  if (!editSelected) { showNotif('Tap a piece to remove first'); return; }
  const g = editSelected;
  if (g.userData.fixture) { showNotif("That's built in — you can move it, but not remove it"); return; }
  const id = g.userData.id, ck = g.userData.ctx;
  removeDecorCollider(g);
  DECOR_CTX[ck].target().remove(g);
  delete decorReg[ck][id];
  const list = decorList(ck); const li = list.indexOf(id); if (li >= 0) list.splice(li, 1);
  delete decorXfMap(ck)[id];
  selectDecor(null);
  showNotif('🗑️ Removed');
  if (typeof saveGame === 'function') saveGame();
}
function resetDecorLayout() {
  const ck = currentDecorCtx(); if (!ck) return;
  state[DECOR_CTX[ck].xf] = {};
  Object.keys(decorReg[ck]).forEach(id => {
    if (decorReg[ck][id].userData.fixture) return;   // built-ins reset below
    const d = decorDefaultPos(id, ck);
    decorReg[ck][id].position.set(d.x, 0, d.z); decorReg[ck][id].rotation.y = 0;
  });
  Object.keys(fixtureReg).forEach(id => {           // put built-in furniture back where it started
    const f = fixtureReg[id]; if (f.ctx !== ck) return;
    if (state.fixtureXf) delete state.fixtureXf[id];
    f.group.position.set(f.anchor.x, 0, f.anchor.z); f.group.rotation.y = 0;
    applyFixtureCollider(id);
  });
  selectDecor(null);
  showNotif('↺ Layout reset');
  if (typeof saveGame === 'function') saveGame();
}
function toggleDecorEdit() {
  if (state.editMode) { exitDecorEdit(); return; }
  state.editMode = true;
  document.body.classList.add('editing');       // hide the walk-around HUD — a clear view of the room
  // pull the camera up for a decorator's overview of the whole floor
  state._preEditCam = { h: state.camHeight, d: state.camDist };
  state.camHeight = 8.5; state.camDist = 6.2;
  document.getElementById('decor-tools').classList.add('show');
  document.getElementById('decorate-move-btn').classList.add('active');
  selectDecor(null);
  showNotif('🛠️ Tap any furniture, then drag to move it  ·  🛒 Shop for more');
}
function exitDecorEdit() {
  state.editMode = false;
  document.body.classList.remove('editing');
  if (state._preEditCam) { state.camHeight = state._preEditCam.h; state.camDist = state._preEditCam.d; state._preEditCam = null; }
  selectDecor(null);
  const t = document.getElementById('decor-tools'); if (t) t.classList.remove('show');
  const b = document.getElementById('decorate-move-btn'); if (b) b.classList.remove('active');
  if (typeof saveGame === 'function') saveGame();
}
// Show the 🛠️ button in any decorable interior (home ground floor, shop, bought home)
function updateDecorEditPrompt() {
  const b = document.getElementById('decorate-move-btn');
  if (!b) return;
  const ck = currentDecorCtx();
  const can = ck !== null && !state.uiOpen && !mg.active;
  b.classList.toggle('show', can);
  if (ck === null && state.editMode) exitDecorEdit();
}

// The Millers gathered in the living room — visible inside the home at night
function buildHomeFamily() {
  if (!groundGroup) return;
  state.homeFamily = [];
  const fam = [
    { name: 'Elena',  x: -2.3, z: 0.7,  ry: 0.3,        cfg: { skin: 0xe8b48c, hair: 0x5a3a22, hairStyle: 'long', apron: true, apronColor: 0xc88aa0, shirt: 0xc86a7a, pants: 0x5a5070, height: 0.97, build: 'avg', eye: 0x4a3a22 } },
    { name: 'Lily',   x: -1.0, z: -0.1, ry: -0.4,       cfg: { skin: 0xf0c49a, hair: 0x7a4a2a, hairStyle: 'long', shirt: 0xe0a0c0, pants: 0x8a6aa0, height: 0.62, build: 'slim', eye: 0x5a3a22 } },
    { name: 'Noah',   x: -0.1, z: 1.2,  ry: Math.PI,    cfg: { skin: 0xe0b080, hair: 0x241712, hairStyle: 'child', shirt: 0x5a80c0, pants: 0x3a3a4a, height: 0.74, build: 'slim', eye: 0x241712 } },
    { name: 'Daniel', x: 0.7,  z: 0.4,  ry: Math.PI * 0.9, cfg: { skin: 0xd9a070, hair: 0x3a2a1a, hairStyle: 'short', shirt: 0x5a7a5a, pants: 0x46402e, height: 1.04, build: 'avg', eye: 0x3a2a1a } },
  ];
  fam.forEach(p => {
    const { group, parts } = buildHuman(p.cfg);
    group.position.set(p.x, 0, p.z); group.rotation.y = p.ry; group.visible = false;
    groundGroup.add(group);
    state.homeFamily.push({ group, parts, name: p.name, phase: Math.random() * 6, home0: { x: p.x, z: p.z, ry: p.ry } });
  });
}

// ── The Millers' daily routine — each one does different things at different hours,
//    and they actually USE the furniture you buy (each piece unlocks an activity). ──
const HOME_SEATS = [[0, 0.72], [0, -0.72], [0.85, 0], [-0.85, 0]];
function homeFurn(id) { return decorReg.home[id] || null; }   // a bought piece, or null

// Where is this Miller right now, and what are they doing? loc: 'out' | 'down' | 'up'.
// This is the SINGLE source of truth so they're never in two places at once.
function millerPlan(name, hour) {
  const kid = (name === 'Lily' || name === 'Noah');
  const mum = (name === 'Elena'), dad = (name === 'Daniel');
  // overnight → asleep in bed (kids' room exists from L3, parents' room from L4)
  if (kid ? (hour >= 21.5 || hour < 7) : (hour >= 23 || hour < 6.5)) {
    const up = kid ? state.houseLevel >= 3 : state.houseLevel >= 4;
    return { loc: up ? 'up' : 'down', act: 'sleep' };
  }
  if (hour < 7.5) return { loc: 'down', act: mum ? 'cook' : (kid ? 'sleep' : 'eat') };  // early morning: mum makes breakfast
  if (hour < 8.5) return { loc: 'down', act: mum ? 'cook' : 'eat' };                    // family breakfast
  // out for the day, staggered — kids finish first, then mum, then dad (dad works till the shop shuts)
  if (dad) { if ((state.owned.shop ? hour < 20 : hour < 17)) return { loc: 'out' }; }
  else if (mum) { if (hour < 15.5) return { loc: 'out' }; }
  else if (kid) { if (hour < 16) return { loc: 'out' }; }
  // ── back home; the evening unfolds beat by beat ──
  if (mum && hour < 16.6) return { loc: 'down', act: 'hoover' };                        // mum hoovers the house first
  if (kid && hour < 17.3) return { loc: 'down', act: 'study' };                         // homework before play
  if (kid && hour < 18.5) return { loc: 'down', act: 'play' };                          // then the kids play on the floor
  if (mum && hour < 18.75) return { loc: 'down', act: 'cook' };                         // mum cooks dinner
  if (dad && hour < 18.5) return { loc: 'down', act: 'paper' };                         // dad settles in with the newspaper
  if (hour < 20) return { loc: 'down', act: 'eat' };                                    // dinner together
  if (hour < 21.5) return { loc: 'down', act: dad ? 'tv' : mum ? 'read' : 'play' };      // evening: tv / reading / play
  return { loc: 'down', act: dad ? 'paper' : 'read' };                                  // late (kids already asleep above)
}

// A relaxed lying-in-bed pose (a slight roll onto the side, knees drawn up, arms softened)
// instead of a rigid flat plank.
function sleepPose(f) {
  f.group.rotation.set(-Math.PI / 2, 0, 0.12);
  if (f.parts.legs) f.parts.legs.forEach((l, li) => l.rotation.x = 0.35 + li * 0.06);   // knees up, a little uneven
  if (f.parts.arms) f.parts.arms.forEach(a => a.rotation.x = 0.28);
  if (f.parts.head) f.parts.head.rotation.x = 0.3;                                       // head settled on the pillow
}
// True while this Miller's outdoor walker is still visible out in town (walking home,
// idling at the shops, out with you on an escort). The indoor copies must wait for the
// walker to step through the front door, or you'd see the same Miller in two places at once.
function millerStillOutside(name) {
  for (const f of (state.family || [])) if (f.name === name) return !!(f.group && f.group.visible);
  return false;
}
// The Millers only leave the poor house once YOU tell them to move into a home you own
function millersMovedOut() { return !!(state.millerHome && state.owned && state.owned.homes && state.owned.homes.includes(state.millerHome)); }
function updateMillerHomeLife(t) {
  if (!state.homeFamily) return;
  if (millersMovedOut()) { state.homeFamily.forEach(f => f.group.visible = false); return; }   // poor house now empty — they live elsewhere
  const hour = state.dayTime * 24;
  const bed = homeFurn('bed'), table = homeFurn('diningset'), couch = homeFurn('couch'),
        tv = homeFurn('tv'), stove = homeFurn('stove') || homeFurn('counter'), shelf = homeFurn('bookshelf');
  if (state.homePlayBall) state.homePlayBall.visible = false;   // shown again only while the kids are playing
  state.homeFamily.forEach((f, i) => {
    const plan = millerPlan(f.name, hour);
    f.group.visible = (plan.loc === 'down') && !millerStillOutside(f.name);
    // 💭 Elena's shopping thought: she needs something from town (walk up → 💬 See what Elena needs)
    if (f.name === 'Elena') {
      const want = state.momRequest && !state.momRequest.told && f.group.visible;
      if (want) {
        if (!f.needBubble && typeof bubbleTexture === 'function') {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.62), new THREE.MeshBasicMaterial({ map: bubbleTexture('💭' + state.momRequest.e), transparent: true }));
          m.position.y = 2.5; f.group.add(m); f.needBubble = m; f.needBubbleFor = state.momRequest.itemId;
        }
        if (f.needBubble) {
          if (f.needBubbleFor !== state.momRequest.itemId) { f.group.remove(f.needBubble); f.needBubble = null; }   // request changed → redraw next frame
          else { f.needBubble.visible = true; f.needBubble.position.y = 2.5 + Math.sin(t * 2.6) * 0.08; f.needBubble.lookAt(camera.position); }
        }
      } else if (f.needBubble) f.needBubble.visible = false;
    }
    if (!f.group.visible) return;
    const legs = f.parts.legs;
    const h = f.group.scale.y || 1;
    // sit properly: drop the body so the hips rest on the seat, and fold the legs forward
    const seatOn = (seatTop, x, z, faceY) => {
      f.group.position.set(x, seatTop - 0.84 * h, z);
      f.group.rotation.set(0, faceY, 0);
      if (legs) legs.forEach(l => l.rotation.x = -1.4);
      if (f.parts.arms) f.parts.arms.forEach(a => a.rotation.x = -0.15);
    };
    if (legs) legs.forEach(l => l.rotation.x = 0);                              // reset each frame
    f.group.rotation.x = 0;
    if (f.heldPaper) f.heldPaper.visible = false;                                // held props hide unless this frame uses them
    if (f.hooverMesh) f.hooverMesh.visible = false;
    if (f.heldBook) f.heldBook.visible = false;

    if (plan.act === 'paper') {                    // 📰 dad reads the newspaper (couch if there is one)
      if (!f.heldPaper) {                          // a folded broadsheet held in both hands
        const p = new THREE.Group();
        const sheetM = new THREE.MeshStandardMaterial({ color: 0xf0ead8, roughness: 0.9 });
        [-0.16, 0.16].forEach(sx => { const half = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.01), sheetM); half.position.x = sx; half.rotation.y = sx < 0 ? 0.5 : -0.5; p.add(half); });
        const ink = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.012), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 })); ink.position.set(-0.14, 0.12, 0.005); ink.rotation.y = 0.5; p.add(ink);
        f.group.add(p); f.heldPaper = p;
      }
      f.heldPaper.visible = true;
      f.heldPaper.position.set(0, 1.22, 0.34);
      if (couch) seatOn(0.6, couch.position.x + (i - 1.5) * 0.42, couch.position.z + 0.05, 0);
      else { f.group.position.set(f.home0.x, 0, f.home0.z); f.group.rotation.set(0, f.home0.ry, 0); }
      if (f.parts.arms) f.parts.arms.forEach(a => a.rotation.x = -1.05);        // holding the paper up
      if (f.parts.head) { f.parts.head.rotation.x = 0.32; f.parts.head.rotation.y = Math.sin(t * 0.4) * 0.1; }   // eyes on the page
    } else if (plan.act === 'hoover') {            // 🧹 mum hoovers back & forth across the room
      if (!f.hooverMesh) {
        const hv = new THREE.Group();
        const bodyM = new THREE.MeshStandardMaterial({ color: 0xb0483a, roughness: 0.6 });
        const body2 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), bodyM); body2.scale.set(1, 0.7, 1.3); body2.position.y = 0.12; hv.add(body2);
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 8), new THREE.MeshStandardMaterial({ color: 0x8a8f99, roughness: 0.4 })); stick.position.set(0, 0.55, -0.28); stick.rotation.x = 0.55; hv.add(stick);
        groundGroup.add(hv); f.hooverMesh = hv;
      }
      const sweep = Math.sin(t * 0.7);
      const hx = -1 + sweep * 1.5, hz = 0.6 + Math.sin(t * 0.23) * 0.9;         // slowly covers the whole room
      const face = Math.atan2(Math.cos(t * 0.7) * 1.5, 0.001);                  // faces the direction she's sweeping
      f.group.position.set(hx, 0, hz); f.group.rotation.set(0, face, 0);
      f.hooverMesh.visible = true;
      f.hooverMesh.position.set(hx + Math.sin(face) * 0.55, 0, hz + Math.cos(face) * 0.55);
      f.hooverMesh.rotation.y = face;
      if (f.parts.arms) { f.parts.arms[0].rotation.x = -0.85 + Math.sin(t * 3.2) * 0.12; f.parts.arms[1].rotation.x = -0.2; }
      if (legs) { legs[0].rotation.x = Math.sin(t * 2.6) * 0.2; legs[1].rotation.x = -Math.sin(t * 2.6) * 0.2; }
    } else if (plan.act === 'study' && table) {    // 📚 the kids do their homework at the table
      const s = HOME_SEATS[i % 4];
      seatOn(0.5, table.position.x + s[0], table.position.z + s[1], Math.atan2(-s[0], -s[1]));
      if (!f.heldBook) {
        const bk = new THREE.Group();
        const cov = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.02), new THREE.MeshStandardMaterial({ color: [0x9a4a5a, 0x3a6a9a][i % 2], roughness: 0.8 })); bk.add(cov);
        const pg = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.19, 0.024), new THREE.MeshStandardMaterial({ color: 0xf4eede, roughness: 0.95 })); bk.add(pg);
        f.group.add(bk); f.heldBook = bk;
      }
      f.heldBook.visible = true;
      f.heldBook.position.set(0, 1.16, 0.32); f.heldBook.rotation.x = -0.6;
      if (f.parts.arms) f.parts.arms.forEach(a => a.rotation.x = -0.95);
      if (f.parts.head) { f.parts.head.rotation.x = 0.42; f.parts.head.rotation.y = Math.sin(t * 0.6 + i) * 0.06; }   // nose in the book
    } else if (plan.act === 'play' && (f.name === 'Lily' || f.name === 'Noah')) {   // 🧸 the kids play on the floor with a little ball
      const kidIx = f.name === 'Lily' ? 0 : 1;
      const px = -1.6 + kidIx * 1.1, pz = 1.55;
      f.group.position.set(px, -0.45 * h, pz);
      f.group.rotation.set(0, kidIx === 0 ? Math.PI / 2 : -Math.PI / 2, 0);      // sat facing each other
      if (legs) legs.forEach(l => l.rotation.x = -1.5);                          // criss-cross on the floor
      const roll = Math.sin(t * 2.2);
      if (f.parts.arms) { f.parts.arms[0].rotation.x = -0.7 + (kidIx === 0 ? Math.max(0, roll) : Math.max(0, -roll)) * -0.5; f.parts.arms[1].rotation.x = -0.4; }
      if (f.parts.head) f.parts.head.rotation.x = 0.25;
      if (!state.homePlayBall && groundGroup) {                                  // the little ball they roll between them
        const pb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: 0x5a9ad0, roughness: 0.5 }));
        groundGroup.add(pb); state.homePlayBall = pb;
      }
      if (state.homePlayBall) { state.homePlayBall.visible = true; state.homePlayBall.position.set(-1.05 + roll * 0.34, 0.09, pz); state.homePlayBall.rotation.z -= roll * 0.1; }
    } else if (plan.act === 'sleep') {                    // 🛏️ lie down in the bed (or on the floor)
      if (bed) f.group.position.set(bed.position.x + (i - 1.5) * 0.32, 0.52, bed.position.z + 0.6);
      else f.group.position.set(-2.7 + i * 0.55, 0.16, 1.2);
      sleepPose(f);
    } else if (plan.act === 'eat' && table) {      // 🍽️ sit at the dining table and eat
      const s = HOME_SEATS[i % 4];
      seatOn(0.5, table.position.x + s[0], table.position.z + s[1], Math.atan2(-s[0], -s[1])); idleHuman(f, t);
    } else if (plan.act === 'cook' && stove) {     // 🍳 stand at the stove, stirring
      f.group.position.set(stove.position.x, 0, stove.position.z + 0.7);
      f.group.rotation.set(0, Math.PI, 0);
      if (f.parts.arms) { f.parts.arms[0].rotation.x = -0.9 + Math.sin(t * 4) * 0.25; f.parts.arms[1].rotation.x = -0.5; }
    } else if (plan.act === 'tv' && (tv || couch)) {   // 📺 sit on the couch watching TV
      if (couch) {
        const faceY = tv ? Math.atan2(tv.position.x - couch.position.x, tv.position.z - couch.position.z) : 0;
        seatOn(0.6, couch.position.x + (i - 1.5) * 0.42, couch.position.z + 0.05, faceY);
      } else {
        f.group.position.set(tv.position.x, 0, tv.position.z + 1.2); f.group.rotation.set(0, Math.PI, 0);
      }
      idleHuman(f, t);
    } else if (plan.act === 'read' && (couch || shelf)) {   // 📖 read on the couch or by the shelf
      if (couch) { seatOn(0.6, couch.position.x + (i - 1.5) * 0.42, couch.position.z + 0.05, 0); }
      else { f.group.position.set(shelf.position.x, 0, shelf.position.z + 0.7); f.group.rotation.set(0, Math.PI, 0); }
      idleHuman(f, t);
    } else if (couch && (plan.act === 'tv' || plan.act === 'read' || plan.act === 'play')) {
      // furniture they'd use is missing but there's a couch — flop on it
      seatOn(0.6, couch.position.x + (i - 1.5) * 0.42, couch.position.z + 0.05, 0); idleHuman(f, t);
    } else {                                       // no relevant furniture yet → stand & mill about
      f.group.position.set(f.home0.x, 0, f.home0.z);
      f.group.rotation.set(0, f.home0.ry, 0); idleHuman(f, t);
    }
  });
}

// ─── Dad's shop interior (enterable): shelves, a counter, Dad the cashier, shoppers ─
function buildShopInterior() {
  const S = shopScene;
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const B = (w, h, d, mat, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); me.position.set(x, y, z); return me; };
  const floorMat = pbr(0x9a8a6a, 0.9), wallMat = pbr(0xd8cba8, 0.96), wood = pbr(0x6a4a2c, 0.8), shelfMat = pbr(0x7a5a3a, 0.85);
  const floor = add(new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 10), floorMat)); floor.position.y = -0.05;
  const WH = 3, WY = 1.5;
  B(14, WH, 0.2, wallMat, 0, WY, -5);
  B(0.2, WH, 10, wallMat, -7, WY, 0);
  B(0.2, WH, 10, wallMat, 7, WY, 0);
  B(4.5, WH, 0.2, wallMat, -4.75, WY, 5); B(4.5, WH, 0.2, wallMat, 4.75, WY, 5); B(2.4, 0.5, 0.2, wallMat, 0, 2.75, 5);   // front + door lintel
  S.add(new THREE.AmbientLight(0xfff0e0, 0.55));
  S.add(new THREE.HemisphereLight(0xfff2e0, 0x3a2a20, 0.4));
  [[-3.5, -2], [3.5, -2], [0, 2]].forEach(([lx, lz]) => { const pl = new THREE.PointLight(0xffe8c0, 0.7, 22, 2); pl.position.set(lx, 3.6, lz); S.add(pl); });
  // Stock shelves — movable built-in furniture (customers walk to these to grab items)
  [[-4, -2.5], [0, -2.5], [4, -2.5], [-4.5, 1], [4.5, 1]].forEach(([x, z], idx) => {
    makeFixture('shop', 'shelf' + idx, shopScene, shopColliders, x, z, (B) => {
      B(3.2, 2.0, 0.6, shelfMat, 0, 1.0, 0);
      for (let s = 0; s < 3; s++) for (let i = 0; i < 4; i++) B(0.5, 0.42, 0.42, pbr([0xc0392b, 0x2a6acc, 0xf0c020, 0x40a060, 0xd06aa0, 0xe07a2a][(s * 4 + i) % 6], 0.7), -1.2 + i * 0.8, 0.55 + s * 0.62, 0.06);
    }, { dx0: -1.7, dx1: 1.7, dz0: -0.4, dz1: 0.4 });
  });
  // service counter — REDESIGNED: open at both ends so you can walk behind & stand with Dad
  B(4.8, 1.0, 0.6, wood, 0.6, 0.5, -3.8);                                                  // counter slab (x -1.8 → 3.0)
  B(0.6, 0.4, 0.5, pbr(0x2a2a2a, 0.5), 1.8, 1.15, -3.8);                                   // register
  B(2.8, 1.6, 0.4, pbr(0x49331f, 0.8), -4.2, 0.8, -4.75);                                  // staff-side stock shelf
  B(0.8, 0.8, 0.8, pbr(0x2e4436, 0.4, 0.4), 5.6, 0.4, -4.5);                               // the shop safe
  shopColliders.push({ type: 'box', x0: -1.8, x1: 3.0, z0: -4.1, z1: -3.5 }, { type: 'box', x0: 5.2, x1: 6.0, z0: -4.9, z1: -4.1 });
  const dad = buildHuman({ skin: 0xd9a070, hair: 0x3a2a1a, hairStyle: 'short', apron: true, apronColor: 0x8a7a5a, shirt: 0x5a7a5a, pants: 0x46402e, height: 1.04, build: 'avg', eye: 0x3a2a1a });
  dad.group.position.set(0, 0, -4.4); S.add(dad.group);
  state.shopDad = { group: dad.group, parts: dad.parts, phase: 1 };
  // Mrs. Chen shops here now — help her find the items on her list (grocery minigame)
  const chen = buildHuman(NEIGHBOURS['Mrs. Chen']);
  chen.group.position.set(-1.5, 0, 1.5); chen.group.rotation.y = 0; S.add(chen.group);
  const chenBubble = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xf0d080, emissive: 0x806000, emissiveIntensity: 0.8, roughness: 0.4 }));
  chenBubble.position.y = 2.2; chen.group.add(chenBubble);
  state.shopChen = { name: 'Mrs. Chen', job: 'grocery', hasJob: true, group: chen.group, parts: chen.parts, bubble: chenBubble, phase: 2, bobT: 0 };

  // A varied cast of other shoppers — they wait offstage and drift in & out on their own timers
  state.shopPeople = [];
  const shopperCfgs = [
    { skin: 0xe6b894, hair: 0x3a2a1a, hairStyle: 'bun',   shirt: 0x9a6fb0, pants: 0x4a4a52, height: 0.98, build: 'round', eye: 0x4a3a2a },
    { skin: 0xc89a6a, hair: 0x141414, hairStyle: 'short', shirt: 0x4a9a6a, pants: 0x4a4030, height: 1.02, build: 'avg',   eye: 0x2a1a10 },
    { skin: 0xe8c0a0, hair: 0x6a4a2a, hairStyle: 'long',  shirt: 0x8a6ac0, pants: 0x3a3a4a, height: 0.96, build: 'avg',   eye: 0x3a2a1a },
    { skin: 0xd8a878, hair: 0x3a2a18, hairStyle: 'short', hat: 'cap', hatColor: 0x7a3a3a, shirt: 0xc0a040, pants: 0x4a4a5a, height: 1.0,  build: 'avg', eye: 0x3a2a1a },
    { skin: 0xb88858, hair: 0x141414, hairStyle: 'long',  shirt: 0x6a5aa0, pants: 0x3a3a3a, height: 0.94, build: 'round', eye: 0x2a1a10 },
    { skin: 0xf0d0b0, hair: 0x8a6a3a, hairStyle: 'bun',   shirt: 0xd06a5a, pants: 0x5a5070, height: 0.9,  build: 'round', eye: 0x4a3a22 },
    { skin: 0x8a5a3a, hair: 0x141414, hairStyle: 'short', shirt: 0x5a8a9a, pants: 0x3a3a44, height: 1.05, build: 'avg',   eye: 0x2a1a12 },
    { skin: 0xe0b080, hair: 0x9a7a4a, hairStyle: 'bun',   shirt: 0x4aa0a0, pants: 0x4a4030, height: 0.92, build: 'round', eye: 0x3a2a1a },
  ];
  shopperCfgs.forEach(cfg => {
    const { group, parts } = buildHuman(cfg || DEFAULT_PERSON);
    group.position.set(0, 0, 6.2); group.rotation.y = Math.PI; group.visible = false; S.add(group);
    state.shopPeople.push({ group, parts, phase: Math.random() * 6, spd: 0.025 + Math.random() * 0.016 });
  });
}

// ── Customers shopping: walk to a shelf, grab an item, pay Dad, repeat (this earns money) ──
const SHOP_TILL_CAP = 200;
const SHOP_COUNTER = { x: 0, z: -3.0 };   // where customers queue to pay
function shopShelfSpots() {
  return Object.keys(fixtureReg).filter(k => k.startsWith('shelf'))
    .map(k => fixtureReg[k].group.position);
}
function pickShelfTarget(shelves) {
  if (!shelves.length) return { x: 0, z: -1 };
  const s = shelves[Math.floor(Math.random() * shelves.length)];
  return { x: s.x + (Math.random() - 0.5) * 1.6, z: s.z + 0.9 };   // stand just in front of the shelf
}
function stepPersonTo(p, tx, tz, speed) {
  const dx = tx - p.group.position.x, dz = tz - p.group.position.z, d = Math.hypot(dx, dz);
  if (d < 0.35) return true;
  const step = Math.min(speed, d);
  p.group.position.x += dx / d * step; p.group.position.z += dz / d * step;
  const heading = Math.atan2(dx, dz);
  p.group.rotation.y += (((heading - p.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.2;
  p.walkT = (p.walkT || 0) + 0.32; const sw = Math.sin(p.walkT);
  if (p.parts.legs) { p.parts.legs[0].rotation.x = sw * 0.5; p.parts.legs[1].rotation.x = -sw * 0.5; }
  if (p.parts.arms) { p.parts.arms[0].rotation.x = -sw * 0.4; p.parts.arms[1].rotation.x = sw * 0.4; }
  p.group.position.y = Math.abs(sw) * 0.02;
  return false;
}
// Customers come in the front door, browse a few shelves, pay Dad, and leave again.
// Everyone runs on their OWN random clock, so the shop drifts between empty and busy.
const SHOP_DOOR_IN = { x: 0, z: 3.8 }, SHOP_DOOR_OUT = { x: 0, z: 6.2 };
function updateShopCustomers(t) {
  const shelves = shopShelfSpots();
  state.shopPeople.forEach((p, i) => {
    if (p.cstate === undefined) { p.cstate = 'gone'; p.ctimer = Math.floor(30 + i * 35 + Math.random() * 680); p.group.visible = false; }
    const spd = p.spd || 0.03;
    switch (p.cstate) {
      case 'gone':                                   // waiting offstage on a long random timer
        if (--p.ctimer <= 0) {
          p.group.position.set(SHOP_DOOR_OUT.x, 0, SHOP_DOOR_OUT.z);
          p.group.visible = true; p.cstate = 'entering'; p.target = SHOP_DOOR_IN;
          p.browse = 1 + Math.floor(Math.random() * 3);   // some grab one thing, some browse a few
        }
        return;
      case 'entering':                               // step in the door, then pick a shelf
        if (stepPersonTo(p, p.target.x, p.target.z, spd)) { p.cstate = 'toShelf'; p.target = pickShelfTarget(shelves); }
        return;
      case 'toShelf':
        if (stepPersonTo(p, p.target.x, p.target.z, spd)) { p.cstate = 'grab'; p.ctimer = 35 + Math.random() * 95; }
        return;
      case 'grab':                                    // browse this shelf, then maybe another, then pay
        idleHuman(p, t);
        if (--p.ctimer <= 0) {
          if (--p.browse > 0 && Math.random() < 0.75) { p.cstate = 'toShelf'; p.target = pickShelfTarget(shelves); }
          else { p.cstate = 'toCounter'; p.target = { x: SHOP_COUNTER.x + (Math.random() - 0.5) * 1.6, z: SHOP_COUNTER.z }; }
        }
        return;
      case 'toCounter':
        if (stepPersonTo(p, p.target.x, p.target.z, spd)) { p.cstate = 'pay'; p.ctimer = 45 + Math.random() * 75; }
        return;
      case 'pay':                                     // pay at the till — a sale rings up
        idleHuman(p, t);
        if (--p.ctimer <= 0) { state.shopTill = Math.min(SHOP_TILL_CAP, (state.shopTill || 0) + 3); p.cstate = 'leaving'; p.target = SHOP_DOOR_IN; }
        return;
      case 'leaving':                                 // back to the doorway…
        if (stepPersonTo(p, p.target.x, p.target.z, spd + 0.004)) { p.cstate = 'exiting'; p.target = SHOP_DOOR_OUT; }
        return;
      case 'exiting':                                 // …and out; wait a good while before returning
        if (stepPersonTo(p, p.target.x, p.target.z, spd + 0.006)) { p.cstate = 'gone'; p.ctimer = 180 + Math.random() * 700; p.group.visible = false; }
        return;
    }
  });
}

// ─── Cat-shelter interior (enterable): a big room full of cats + a place to sleep ──
// The cat castle's climbable tiers (top surface heights) — read by the movement/jump code.
const SHELTER_PLATFORMS = [
  { x0: -1.7, x1: 1.7, z0: -3.7, z1: -0.3, y: 0.45 },
  { x0: -1.2, x1: 1.2, z0: -3.2, z1: -0.8, y: 0.9 },
  { x0: -0.7, x1: 0.7, z0: -2.7, z1: -1.3, y: 1.35 },
];
function shelterSurfaceY(x, z) {
  let y = 0;
  for (const p of SHELTER_PLATFORMS) if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1 && p.y > y) y = p.y;
  return y;
}
function buildShelterInterior() {
  const S = shelterScene;
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const B = (w, h, d, mat, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); me.position.set(x, y, z); return me; };
  const floorMat = pbr(0x8a8f86, 0.9), wallMat = pbr(0xc8d0d4, 0.96), wood = pbr(0x6a4a2c, 0.8), carpet = pbr(0x7a5a8a, 0.95);
  add(new THREE.Mesh(new THREE.BoxGeometry(24, 0.1, 16), floorMat)).position.set(0, -0.05, 0);   // bigger 24×16 room
  const WH = 3.4, WY = 1.7;
  B(24, WH, 0.2, wallMat, 0, WY, -8);                                       // back wall
  B(0.2, WH, 16, wallMat, -12, WY, 0); B(0.2, WH, 16, wallMat, 12, WY, 0);  // side walls
  B(9, WH, 0.2, wallMat, -7.5, WY, 8); B(9, WH, 0.2, wallMat, 7.5, WY, 8);  // front walls (door gap centre)
  S.add(new THREE.AmbientLight(0xfff2e8, 0.62));
  S.add(new THREE.HemisphereLight(0xfff4ee, 0x3a3230, 0.48));
  [[-7, -4], [7, -4], [0, 3], [-7, 4], [7, 4], [0, -6]].forEach(([lx, lz]) => { const pl = new THREE.PointLight(0xffeecf, 0.5, 26, 2); pl.position.set(lx, 4.0, lz); S.add(pl); });

  // ── the CAT CASTLE — a stepped tower you can hop up and play on (centre) ──
  B(3.4, 0.45, 3.4, pbr(0xb98a5a, 0.9), 0, 0.225, -2);   // tier 1
  B(2.4, 0.45, 2.4, pbr(0xcfa06a, 0.9), 0, 0.675, -2);   // tier 2
  B(1.4, 0.45, 1.4, pbr(0xe0b57a, 0.9), 0, 1.125, -2);   // tier 3
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.16, 18), pbr(0xd06a7a, 0.9))).position.set(0, 1.43, -2);   // plush crown on top
  [[-1.4, -3.4], [1.4, -3.4], [-1.4, -0.6], [1.4, -0.6]].forEach(([px, pz]) => {   // corner scratch-posts
    B(0.16, 0.9, 0.16, pbr(0x9a8a6a, 0.95), px, 0.9, pz);
    add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), pbr(0xc0a060, 0.8))).position.set(px, 1.38, pz);
  });
  B(0.05, 0.9, 0.05, wood, 0, 2.0, -2);                                     // flag pole
  const flag = add(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.32), new THREE.MeshStandardMaterial({ color: 0x6ac0d0, roughness: 0.7, side: THREE.DoubleSide }))); flag.position.set(0.26, 2.3, -2);
  const toy = add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), pbr(0xe0d060, 0.7))); toy.position.set(2.2, 1.4, -2); state.shelterToy = toy;   // a dangling feather toy

  // reception desk (back-left) + the caretaker
  B(3, 1.0, 0.9, wood, -8.5, 0.5, -6.6);
  const rec = buildHuman(NEIGHBOURS['Dr. Amara'] || DEFAULT_PERSON);
  rec.group.position.set(-8.5, 0, -7.1); S.add(rec.group);
  state.shelterPeople = [{ group: rec.group, parts: rec.parts, phase: 2 }];

  // 💝 the donation box beside the desk — drop in 5 🪙 to help the cats (a good deed)
  B(0.55, 0.55, 0.55, wood, -6.2, 0.85, -6.6);                                   // box…
  B(0.7, 0.9, 0.7, pbr(0x8a6a4a, 0.9), -6.2, 0.3, -6.6);                         // …on a little stand
  B(0.3, 0.04, 0.1, pbr(0x241610, 0.95), -6.2, 1.14, -6.5);                      // the coin slot
  add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), pbr(0xd04a5a, 0.6))).position.set(-6.2, 1.32, -6.6);   // a little heart on top
  if (typeof makeTextSign === 'function') {
    add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.06),
      new THREE.MeshStandardMaterial({ map: makeTextSign('💝 DONATIONS', '#5a2a34', '#f6e6d8', 220, 56), roughness: 0.6 })))
      .position.set(-6.2, 1.75, -6.85);
  }

  // cat beds around the edges (more of them now)
  const catBed = (x, z, c) => { add(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.78, 0.2, 16), pbr(c, 0.9))).position.set(x, 0.1, z); add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 16), pbr(0xeee0d0, 0.9))).position.set(x, 0.2, z); };
  [[-9, -3, 0xc06a7a], [9, -3, 0x6a9ad0], [-9, 3, 0x8ac06a], [9, 3, 0xd0a060], [-9, 0.5, 0xc0906a], [9, 0.5, 0x9a7ac0], [-4, -6, 0x6ac0a0], [4, -6, 0xd07a9a]].forEach(([x, z, c]) => catBed(x, z, c));

  // tall cat trees in the back corners
  const catTree = (x, z) => { B(0.2, 2.4, 0.2, wood, x, 1.2, z); B(0.9, 0.1, 0.9, wood, x, 1.0, z); B(1.0, 0.1, 1.0, wood, x, 2.2, z); add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.16, 14), pbr(0xc06a7a, 0.9))).position.set(x, 2.32, z); };
  catTree(-10.6, -6.5); catTree(10.6, -6.5);

  // the big nap bed (front-left) — walk up & 😴 Nap here
  B(2.6, 0.3, 1.9, wood, -8, 0.15, 5.4);
  add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 1.7), carpet)).position.set(-8, 0.36, 5.4);

  // 🧶 a play ball the shelter cats chase & bat around
  const ballMesh = add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), pbr(0xc85a5a, 0.6)));
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 6, 16), pbr(0xf0e0c0, 0.6)); stripe.rotation.x = Math.PI / 2; ballMesh.add(stripe);
  ballMesh.position.set(5, 0.14, 1);
  state.shelterBall = { mesh: ballMesh, x: 5, z: 1, vx: 0.03, vz: 0.02 };

  // ── a play-with-yarn volunteer (a minigame giver — just walk up, no button hunting) ──
  const vol = buildHuman(NEIGHBOURS['Poppy'] || DEFAULT_PERSON);
  vol.group.position.set(6, 0, 4); vol.group.rotation.y = Math.PI; S.add(vol.group);
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf0d080, emissive: 0x806000, emissiveIntensity: 0.8, roughness: 0.4 }));
  bubble.position.y = 2.5; vol.group.add(bubble);
  state.shelterGiver = { group: vol.group, parts: vol.parts, x: 6, z: 4, name: 'Kai the Volunteer', job: 'yarn', hasJob: true, bubble, phase: 1 };
  state.shelterPeople.push({ group: vol.group, parts: vol.parts, phase: 1 });

  shelterColliders.push(
    { type: 'box', x0: -10.0, x1: -7.0, z0: -7.1, z1: -6.1 },   // reception desk
    { type: 'box', x0: -10.9, x1: -10.3, z0: -6.8, z1: -6.2 },  // a cat-tree post
    { type: 'box', x0: 10.3, x1: 10.9, z0: -6.8, z1: -6.2 }
  );
  buildShelterCats();
}
// A cosy furnished home the Millers move into once you buy them a house (shared by both)
function buildBoughtHome() {
  const S = boughtHomeScene;
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const B = (w, h, d, mat, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); me.position.set(x, y, z); return me; };
  const floorMat = pbr(0x8a6a4a, 0.9), wallMat = pbr(0xd8c8a8, 0.96), wood = pbr(0x6a4a2c, 0.8), woodDark = pbr(0x49331f, 0.8);
  add(new THREE.Mesh(new THREE.BoxGeometry(12, 0.1, 9), floorMat)).position.y = -0.05;
  const WH = 2.8, WY = 1.4;
  B(12, WH, 0.2, wallMat, 0, WY, -4.5);
  B(0.2, WH, 9, wallMat, -6, WY, 0); B(0.2, WH, 9, wallMat, 6, WY, 0);
  B(3.5, WH, 0.2, wallMat, -4.25, WY, 4.5); B(3.5, WH, 0.2, wallMat, 4.25, WY, 4.5); B(2.5, 0.5, 0.2, wallMat, 0, 2.55, 4.5);
  B(1.6, 1.1, 0.06, pbr(0xbfe0ff, 0.08, 0), -3.5, 1.5, -4.4);   // window
  S.add(new THREE.AmbientLight(0xffe8d0, 0.6));
  S.add(new THREE.HemisphereLight(0xfff0e0, 0x3a2a20, 0.4));
  [[-3, -2], [3, 2]].forEach(([lx, lz]) => { const pl = new THREE.PointLight(0xffe6c0, 0.8, 20, 2); pl.position.set(lx, 2.6, lz); S.add(pl); });
  // Furniture you can drag & rearrange (same as the Miller home), plus a static rug
  B(3.2, 0.02, 2.4, pbr(0x9a5a4a, 0.9), -3.2, 0.012, -2.2);   // area rug (stays put)
  makeFixture('bought', 'bsofa', boughtHomeScene, boughtHomeColliders, -3.6, -2.6, (B) => {
    B(2.4, 0.5, 0.9, pbr(0x6a7f9a, 0.95), 0, 0.35, 0);
    B(2.4, 0.55, 0.25, pbr(0x6a7f9a, 0.95), 0, 0.7, -0.4);
  }, { dx0: -1.2, dx1: 1.2, dz0: -0.6, dz1: 0.5 });
  makeFixture('bought', 'bcoffee', boughtHomeScene, boughtHomeColliders, -3.6, -1.4, (B) => { B(1.2, 0.4, 0.7, wood, 0, 0.2, 0); }, null);
  makeFixture('bought', 'btable', boughtHomeScene, boughtHomeColliders, 2.6, -1.8, (B) => {
    B(1.6, 0.08, 1.0, wood, 0, 0.78, 0);
    [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].forEach(([lx, lz]) => B(0.08, 0.78, 0.08, woodDark, lx, 0.39, lz));
  }, { dx0: -0.9, dx1: 0.9, dz0: -0.6, dz1: 0.6 });
  makeFixture('bought', 'bbed', boughtHomeScene, boughtHomeColliders, 4.4, 2.6, (B) => {
    B(2.0, 0.3, 2.4, wood, 0, 0.2, 0);
    B(1.9, 0.2, 2.3, pbr(0xeae0cc, 0.9), 0, 0.42, 0);
    B(1.9, 0.14, 1.2, pbr(0x5a7a9a, 0.9), 0, 0.52, 0.6);
  }, { dx0: -1.1, dx1: 1.1, dz0: -1.3, dz1: 1.3 });
  makeFixture('bought', 'bwardrobe', boughtHomeScene, boughtHomeColliders, -5.2, 2.6, (B) => { B(1.2, 2.2, 0.6, woodDark, 0, 1.1, 0); }, { dx0: -0.7, dx1: 0.6, dz0: -0.4, dz1: 0.4 });
  // plant, lamp, pictures
  C(0.16, 0.2, 0.4, 12, pbr(0x8a5a3a, 0.8), 5.4, 0.2, -3.5, S); const pl = add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), pbr(0x3a7a30, 0.9))); pl.position.set(5.4, 0.6, -3.5);
  B(0.5, 0.36, 0.04, wood, -1.5, 1.7, -4.4); B(0.44, 0.3, 0.02, pbr(0xc0a0b0, 0.5), -1.5, 1.7, -4.37);
  B(0.5, 0.36, 0.04, wood, 0.6, 1.7, -4.4); B(0.44, 0.3, 0.02, pbr(0x9ab0c0, 0.5), 0.6, 1.7, -4.37);
  // the Millers, living here once they've moved in (driven by the same daily schedule)
  state.boughtHomePeople = [];
  [{ name: 'Elena',  cfg: { skin: 0xe8b48c, hair: 0x5a3a22, hairStyle: 'long', apron: true, apronColor: 0xc88aa0, shirt: 0xc86a7a, pants: 0x5a5070, height: 0.97, build: 'avg', eye: 0x4a3a22 }, x: -3.4, z: -1.4, ry: 0.4 },
   { name: 'Daniel', cfg: { skin: 0xd9a070, hair: 0x3a2a1a, hairStyle: 'short', shirt: 0x5a7a5a, pants: 0x46402e, height: 1.04, build: 'avg', eye: 0x3a2a1a }, x: -2.2, z: -2.4, ry: 0.2 },
   { name: 'Noah',   cfg: { skin: 0xe0b080, hair: 0x241712, hairStyle: 'child', shirt: 0x5a80c0, pants: 0x3a3a4a, height: 0.74, build: 'slim', eye: 0x241712 }, x: 3.0, z: 1.2, ry: Math.PI },
   { name: 'Lily',   cfg: { skin: 0xf0c49a, hair: 0x7a4a2a, hairStyle: 'long', shirt: 0xe0a0c0, pants: 0x8a6aa0, height: 0.62, build: 'slim', eye: 0x5a3a22 }, x: 2.4, z: 0.4, ry: Math.PI }].forEach(p => {
    const { group, parts } = buildHuman(p.cfg);
    group.position.set(p.x, 0, p.z); group.rotation.y = p.ry; S.add(group);
    state.boughtHomePeople.push({ group, parts, name: p.name, home0: { x: p.x, z: p.z, ry: p.ry }, phase: Math.random() * 6 });
  });
}

// convenience: cylinder helper for the bought home (S-scoped)
function C(rt, rb, h, seg, mat, x, y, z, S) { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat); me.position.set(x, y, z); me.castShadow = true; (S || boughtHomeScene).add(me); return me; }

function enterBoughtHome(door) {
  state.inBoughtHome = true; state.boughtHomeExit = door || { x: 18, z: -6.5 };
  state.currentBoughtHome = state.nearHomeId || null;   // remember which house this is (for move-in & who lives here)
  boughtHomeScene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_IN);
  catGroup.position.set(0, 0, 3.5); catGroup.rotation.y = Math.PI;
  state.camYaw = 0; state.camHeight = 7; state.camDist = 6;
  camera.position.set(0, state.camHeight, 3.5 + state.camDist);
  document.getElementById('minimap').style.display = 'none';
  showDialogue('🏠 The Millers', "A whole home of our own — thanks to you. Make yourself at home, little one. ❤️", 4600);
}
function exitBoughtHome() {
  state.inBoughtHome = false; scene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_OUT);
  const d = state.boughtHomeExit || { x: 18, z: -6.5 };
  catGroup.position.set(d.x, 0, d.z); catGroup.rotation.y = 0;
  state.camYaw = 0; state.camHeight = 7; state.camDist = 9;
  camera.position.set(d.x, state.camHeight, d.z + 9);
  document.getElementById('minimap').style.display = '';
}

function buildShelterCats() {
  state.shelterCats = [];
  const looks = STREET_CAT_LOOKS.concat([
    { body: '#efdcb8', accent: '#d6b483', eye: '#e0a83c', markings: 'solid' },
    { body: '#f0e3c8', accent: '#d98a3a', patch1: '#d98a3a', patch2: '#3a3530', eye: '#e0a83c', markings: 'calico' },
    { body: '#6b4a32', accent: '#4a3320', eye: '#f0c040', markings: 'solid' },
    { body: '#b8bcc4', accent: '#7a7e88', eye: '#7cc46a', markings: 'tabby' },
  ]);
  // spread around the bigger room, clear of the central cat castle, the reception desk & the nap bed
  const spots = [[-9, -3], [-9.7, -2.2], [9, -3], [8.3, -2.4], [-9, 3], [9, 3], [9.7, 3.7], [-4, -6], [3.5, -6.2], [4.5, 3.6], [6.5, -0.5], [-6, 2.2], [-3.5, 4.2], [-6.5, -4], [5, 5.2], [-4.5, 5.4]];
  const names = ['Waffles', 'Nutmeg', 'Pickle', 'Domino', 'Toast', 'Bramble', 'Sooty', 'Maple', 'Chai', 'Pudding', 'Basil', 'Twix', 'Nimbus', 'Sprout', 'Cocoa', 'Wisp'];
  spots.forEach((sp, i) => {
    const look = looks[i % looks.length];
    const m = buildCatModel(look); m.group.scale.setScalar(CAT_SCALE_IN * 1.4);
    m.group.position.set(sp[0], 0, sp[1]); m.group.rotation.y = Math.random() * Math.PI * 2;
    const nightOnly = i >= 8;                  // the first 8 are always here; the rest arrive at night
    if (nightOnly) m.group.visible = false;
    shelterScene.add(m.group);
    state.shelterCats.push({ group: m.group, legs: m.legs, tail: m.tail, body: m.body, name: names[i % names.length], phase: Math.random() * 6, nightOnly, playT: 0 });
  });
}
