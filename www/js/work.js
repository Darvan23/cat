// work.js — a 9-to-5 cashier job (mynotes ~line 230): get hired at a shop, follow the
// schedule (open ~9am, close ~5pm), get paid daily (300–1000 by shop), earn strikes for
// missed/late shifts (3 → fired), and ask for a raise. Blocked while campaigning / President.

const WORK_OPEN = 9, WORK_CLOSE = 17;
// Shops sit on the SOUTH side of Main Street (the z≈-9 row), in the gaps between houses,
// with their doors facing the road — NOT in the middle of the street.
const JOB_SITES = [
  { id: 'cafe',   name: 'the Corner Café',    emoji: '☕', wage: 380, boss: 'Marco',    x: -42, z: -6 },
  { id: 'bakery', name: "Rosa's Bakery",       emoji: '🥐', wage: 520, boss: 'Rosa',     x: 8,   z: -6 },
  { id: 'market', name: 'the Grocery Market',  emoji: '🏬', wage: 700, boss: 'Mr. Osei',  x: 62,  z: -6 },
  { id: 'store',  name: 'the General Store',   emoji: '🏪', wage: 900, boss: 'Ms. Vale',  x: -66, z: -6 },
];

const WORK_THEME = { cafe: 'cafe', bakery: 'bakery', market: 'market', store: 'market' };
const WORK_COLORS = { cafe: 0x8a5a3a, bakery: 0xd8a860, market: 0x5a8a6a, store: 0xb08a5a };
const WORK_AWNING = { cafe: 0x9a3a3a, bakery: 0xd06a8a, market: 0x3a8a5a, store: 0x3a6a9a };
// Each shop owner looks like a shopkeeper (apron, in their shop's colours)
const EMPLOYER_CFG = {
  cafe:   { skin: 0xe0b48c, hair: 0x2a1a10, hairStyle: 'short', apron: true, apronColor: 0x8a3a3a, shirt: 0xf2f2f2, pants: 0x2a2a30, height: 1.02, build: 'avg',   eye: 0x3a2a1a },
  bakery: { skin: 0xf0c8a0, hair: 0x8a6a3a, hairStyle: 'bun',   apron: true, apronColor: 0xf0e0d0, shirt: 0xd06a8a, pants: 0x5a4a3a, height: 0.98, build: 'round', eye: 0x4a3a22 },
  market: { skin: 0x8a5a3a, hair: 0x201810, hairStyle: 'short', apron: true, apronColor: 0x3a8a5a, shirt: 0xe0c060, pants: 0x3a3a44, height: 1.05, build: 'avg',   eye: 0x2a1a12 },
  store:  { skin: 0xd8a878, hair: 0x9a9a9a, hairStyle: 'short', glasses: true, apron: true, apronColor: 0x3a6a9a, shirt: 0x8a8f99, pants: 0x3a3a3a, height: 1.03, build: 'round', eye: 0x3a3a22 },
};
function workStorefront(id, add, box) {
  const sph = (r, color, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshStandardMaterial({ color, roughness: 0.6 })); m.position.set(x, y, z); m.castShadow = true; add(m); };
  if (id === 'cafe') {                                   // two little outdoor tables with umbrellas
    [-2.5, 2.5].forEach(x => {
      box(0.07, 0.7, 0.07, 0x5a4a3a, 0.8, x, 0.35, 3.3);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.06, 14), new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.6 })); top.position.set(x, 0.72, 3.3); add(top);
      box(0.05, 1.3, 0.05, 0x6a5a4a, 0.8, x, 1.0, 3.3);
      const um = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.5, 14), new THREE.MeshStandardMaterial({ color: 0x9a3a3a, roughness: 0.7 })); um.position.set(x, 1.7, 3.3); add(um);
    });
  } else if (id === 'bakery') {                          // a basket of bread out front
    box(1.7, 0.5, 0.7, 0x8a6a4a, 0.8, -2.4, 0.25, 3.1);
    for (let i = 0; i < 5; i++) sph(0.14, [0xd8a860, 0xc89050, 0xe0b878][i % 3], -3.1 + i * 0.36, 0.62, 3.1);
  } else if (id === 'market') {                          // produce crates of colourful fruit & veg
    [-2.5, 2.6].forEach(cx => {
      box(1.3, 0.4, 0.9, 0x9a6a3a, 0.85, cx, 0.2, 3.2);
      const cols = [0xc0392b, 0xe0a83c, 0x6a9a4a, 0xd06a5a, 0x8ac040, 0xe07a2a];
      for (let i = 0; i < 6; i++) sph(0.13, cols[i % 6], cx - 0.45 + (i % 3) * 0.45, 0.5 + (i > 2 ? 0.15 : 0), 3.0 + (i > 2 ? 0.3 : 0));
    });
  } else {                                               // general store: barrels & crates
    [-2.6, 2.6].forEach(cx => { box(0.7, 0.7, 0.7, 0x9a6a3a, 0.85, cx, 0.35, 3.2); box(0.7, 0.7, 0.7, 0x8a5a2a, 0.85, cx + (cx > 0 ? -0.8 : 0.8), 0.35, 3.4); });
  }
}
function buildWorkplaceBuilding(s) {
  const g = new THREE.Group();
  const add = m => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const box = (w, h, d, color, rough, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: rough }))); me.position.set(x, y, z); return me; };
  const wall = WORK_COLORS[s.id] || 0x9a7a5a, awn = WORK_AWNING[s.id] || 0xc04a4a;
  box(6.4, 3.8, 5, wall, 0.9, 0, 1.9, 0);                                                   // main building
  const roof = add(new THREE.Mesh(new THREE.ConeGeometry(4.9, 1.7, 4), new THREE.MeshStandardMaterial({ color: 0x4a3226, roughness: 0.85 }))); roof.position.y = 4.65; roof.rotation.y = Math.PI / 4;
  if (typeof mat !== 'undefined') {
    box(2.0, 1.7, 0.08, 0x241a12, 0.5, -2.0, 1.6, 2.5);                                     // window trim
    box(2.0, 1.7, 0.08, 0x241a12, 0.5, 2.0, 1.6, 2.5);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.4, 0.06), mat.window)).position.set(-2.0, 1.6, 2.55);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.4, 0.06), mat.window)).position.set(2.0, 1.6, 2.55);
    add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.2, 0.16), mat.door)).position.set(0, 1.1, 2.52);   // door centred, faces the street
    add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf0d060, metalness: 0.6, roughness: 0.3 }))).position.set(0.45, 1.1, 2.64);
  }
  // striped awning over the storefront
  const awning = add(new THREE.Mesh(new THREE.BoxGeometry(6.1, 0.1, 1.25), new THREE.MeshStandardMaterial({ color: awn, roughness: 0.7 }))); awning.position.set(0, 2.72, 2.95); awning.rotation.x = -0.32;
  for (let sx = -2.5; sx <= 2.5; sx += 1.0) { const st = add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.11, 1.28), new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 0.7 }))); st.position.set(sx, 2.72, 2.96); st.rotation.x = -0.32; }
  // lit shop name board
  if (typeof makeTextSign === 'function') {
    const tex = makeTextSign(s.emoji + ' ' + s.name.replace('the ', '').toUpperCase(), '#241a12', '#f6e6b8', 380, 66);
    add(new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.76, 0.12), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: 0x2a2010, emissiveIntensity: 0.4 }))).position.set(0, 3.4, 2.62);
  }
  workStorefront(s.id, add, box);
  g.position.set(s.x, 0, s.z - 3); scene.add(g);
  const coll = { type: 'box', x0: s.x - 3.2, x1: s.x + 3.2, z0: s.z - 5.5, z1: s.z - 0.5 };
  if (typeof worldColliders !== 'undefined') worldColliders.push(coll);
  if (typeof addProp === 'function') addProp({ kind: 'work_' + s.id, group: g, x: s.x, z: s.z - 3, rotY: 0, coll, hw: 3.2, hd: 2.5, movable: true,
    onMove: (nx, nz) => {   // the whole shopfront moves: prompts, owner, hiring board, and your job with it
      s.x = nx; s.z = nz + 3;
      const e = (typeof findEmployer === 'function') ? findEmployer(s.id) : null;
      if (e) {
        e.x = s.x; e.z = s.z;
        if (e.group) e.group.position.set(s.x - 1.3, 0, s.z + 0.6);
        if (e.hireSign) e.hireSign.position.set(s.x + 2.2, 0, s.z + 0.6);
      }
      if (state.job && state.job.site === s.id) { state.job.x = s.x; state.job.z = s.z; }
    } });
}
// A standing "WE'RE HIRING!" sandwich board out front (hidden once the post is filled).
function buildHiringSign(x, z) {
  const g = new THREE.Group();
  const legMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.8 });
  [-0.42, 0.42].forEach(lx => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.05, 0.08), legMat); leg.position.set(lx, 0.52, 0); leg.rotation.x = 0.12; leg.castShadow = true; g.add(leg); });
  if (typeof makeTextSign === 'function') {
    const tex = makeTextSign("WE'RE HIRING!", '#1a8a3a', '#fff8e0', 300, 170);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.82, 0.07), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, emissive: 0x0a3a18, emissiveIntensity: 0.4 }));
    board.position.set(0, 0.85, 0.07); board.rotation.x = -0.12; board.castShadow = true; g.add(board);
  }
  g.position.set(x, 0, z); scene.add(g);
  return g;
}
function spawnEmployers() {
  state.employers = [];
  JOB_SITES.forEach(s => {
    buildWorkplaceBuilding(s);
    // the OWNER works INSIDE their shop (you'll meet them at the counter) — outside, just the sign
    const hireSign = buildHiringSign(s.x + 2.2, s.z + 0.6);
    state.employers.push({ site: s, x: s.x, z: s.z, hireSign, phase: Math.random() * 6 });
  });
  refreshEmployerBubbles();
}
function findEmployer(siteId) { return (state.employers || []).find(e => e.site.id === siteId); }
function jobBlocked() { const p = state.politics; return !!(p && (p.phase === 'president' || p.phase === 'running')); }
// The "WE'RE HIRING" boards show only while a vacancy is open to you (no job, not in politics).
function refreshEmployerBubbles() {
  const open = !state.job && !jobBlocked();
  (state.employers || []).forEach(e => { if (e.hireSign) e.hireSign.visible = open; });
}
function updateEmployers(t) { /* owners live inside their shops now — see updateWorkOccupants */ }

// Called by updateContextButton (outdoors) — shift shortcuts at your own shopfront.
// (Applying for a job now happens INSIDE, at the owner's counter.)
function jobContext(cp) {
  if (state.job) {
    const j = state.job;
    if (Math.hypot(cp.x - j.x, cp.z - j.z) < 2.6) {
      const st = shiftState();
      if (st === 'canOpen')  return { action: 'shift', label: '🔓 Open shop' };
      if (st === 'canClose') return { action: 'shift', label: '🔒 Close shop · +' + (j.late ? Math.round(j.wage * 0.7) : j.wage) + '🪙' };
      return null;   // off-shift: enter via the door (🚪 Enter) to look around
    }
  }
  return null;
}
// Called by updateContextButton when you're INSIDE your workplace (at the counter).
function workRegisterContext(cp) {
  if (!state.job || state.job.site !== state.inWork) return null;   // only YOUR workplace has a shift to run
  if (Math.hypot(cp.x - 0, cp.z - (-3.2)) > 2.4) return null;      // must be at the service counter
  const j = state.job, st = shiftState();
  if (st === 'canOpen')  return { action: 'shift', label: '🔓 Open shop (start shift)' };
  if (st === 'canClose') return { action: 'shift', label: '🔒 Close shop · +' + (j.late ? Math.round(j.wage * 0.7) : j.wage) + '🪙' };
  if (st === 'working')  return { action: 'jobinfo', label: '🛒 On shift — closes at 5pm' };
  if (st === 'done')     return { action: 'jobinfo', label: '✅ Shift done for today' };
  return { action: 'jobinfo', label: '💤 Off-hours' };
}
// ── The shop's products (what customers browse for & buy at your till) ──
const WORK_PRODUCTS = {
  cafe:   [{ id: 'coffee', name: 'Coffee', e: '☕', price: 3 }, { id: 'cookie', name: 'Cookie', e: '🍪', price: 2 }, { id: 'cake', name: 'Cake slice', e: '🍰', price: 4 }, { id: 'tea', name: 'Tea', e: '🍵', price: 2 }],
  bakery: [{ id: 'bread', name: 'Bread', e: '🍞', price: 3 }, { id: 'croiss', name: 'Croissant', e: '🥐', price: 2 }, { id: 'cupcake', name: 'Cupcake', e: '🧁', price: 3 }, { id: 'pie', name: 'Pie', e: '🥧', price: 5 }],
  market: [{ id: 'apple', name: 'Apples', e: '🍎', price: 2 }, { id: 'beans', name: 'Beans', e: '🥫', price: 3 }, { id: 'milk', name: 'Milk', e: '🥛', price: 2 }, { id: 'carrot', name: 'Carrots', e: '🥕', price: 2 }, { id: 'fish', name: 'Fish', e: '🐟', price: 6 }],
  store:  [{ id: 'soap', name: 'Soap', e: '🧼', price: 2 }, { id: 'rope', name: 'Rope', e: '🪢', price: 4 }, { id: 'match', name: 'Matches', e: '🔥', price: 1 }, { id: 'lamp', name: 'Lamp oil', e: '🪔', price: 3 }, { id: 'tin', name: 'Tinned stew', e: '🥫', price: 3 }],
};
function workProducts(id) { return WORK_PRODUCTS[id] || WORK_PRODUCTS.market; }

// ── A dedicated workplace interior: counter you can WALK BEHIND, register, safe, shelves ──
const WORK_SHELF_SPOTS = [[-4.6, -1.2], [4.9, -1.2], [-4.6, 1.8], [4.9, 1.8]];   // where browsing customers stand
const WORK_WAIT_SPOTS = [[0.2, -2.2], [1.6, -2.2], [-1.1, -2.2]];                // queue spots at the counter front
function buildWorkInterior(id) {
  if (typeof _clearScene === 'function') _clearScene(bizScene); bizColliders.length = 0;
  state.civicGiver = null;   // no lobby minigame host in the work shops
  const S = bizScene;
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const B = (w, h, d, m, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); me.position.set(x, y, z); return me; };
  const floorMat = pbr(0x8a7a5c, 0.9), wallMat = pbr(0xc4b494, 0.96), wood = pbr(0x6a4a2c, 0.8), woodDark = pbr(0x49331f, 0.8);   // warmer, less glaring
  add(new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 10), floorMat)).position.y = -0.05;
  const WH = 3, WY = 1.5;
  B(14, WH, 0.2, wallMat, 0, WY, -5); B(0.2, WH, 10, wallMat, -7, WY, 0); B(0.2, WH, 10, wallMat, 7, WY, 0);
  B(4.5, WH, 0.2, wallMat, -4.75, WY, 5); B(4.5, WH, 0.2, wallMat, 4.75, WY, 5); B(2.4, 0.5, 0.2, wallMat, 0, 2.75, 5);
  S.add(new THREE.AmbientLight(0xfff0e0, 0.48)); S.add(new THREE.HemisphereLight(0xfff2e0, 0x3a2a20, 0.34));
  [[-3.5, -2], [3.5, -2], [0, 2]].forEach(([lx, lz]) => { const pl = new THREE.PointLight(0xffe8c0, 0.6, 22, 2); pl.position.set(lx, 3.6, lz); S.add(pl); });
  // the SERVICE COUNTER — open on the left so you can walk behind it and work the till
  B(4.8, 1.0, 0.6, wood, 0.6, 0.5, -3.4);                                       // main counter (x -1.8 → 3.0)
  B(4.0, 1.0, 0.6, wood, 5.0, 0.5, -3.4);                                       // right return to the wall
  bizColliders.push({ type: 'box', x0: -1.8, x1: 3.0, z0: -3.7, z1: -3.1 }, { type: 'box', x0: 3.0, x1: 7.0, z0: -3.7, z1: -3.1 });
  B(0.6, 0.4, 0.5, pbr(0x2a2a2a, 0.5), 1.8, 1.2, -3.4);                          // the register
  // the SAFE (back-right, behind the counter) — stash your takings here
  B(0.9, 0.9, 0.9, pbr(0x2e4436, 0.4, 0.4), 6.2, 0.45, -4.4);
  const dial = add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), pbr(0xd8b04a, 0.3, 0.7)));
  dial.position.set(5.72, 0.5, -4.4); dial.rotation.z = Math.PI / 2;   // gold dial on the safe's front face
  bizColliders.push({ type: 'box', x0: 5.7, x1: 6.7, z0: -4.9, z1: -3.9 });
  // stock shelves behind the counter (staff side)
  B(3.6, 1.8, 0.4, woodDark, -3.6, 0.9, -4.7); B(0.2, 0.06, 0.3, wood, -3.6, 1.2, -4.55);
  // product shelves along the side walls, piled with this shop's goods
  const prods = workProducts(id);
  [[-6.4, -1.2, 0], [6.4, -1.2, 1], [-6.4, 1.8, 2], [6.4, 1.8, 3]].forEach(([x, z, pi], k) => {
    B(0.6, 1.5, 2.2, woodDark, x, 0.75, z);
    B(0.7, 0.06, 2.3, wood, x, 0.85, z); B(0.7, 0.06, 2.3, wood, x, 1.45, z);
    const p = prods[pi % prods.length];
    const colr = [0xc0392b, 0xe0a83c, 0x6a9a4a, 0x6a8ac0, 0xd06a5a][k % 5];
    for (let i = 0; i < 4; i++) { const s2 = add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), pbr(colr, 0.6))); s2.position.set(x + (x > 0 ? -0.18 : 0.18), 0.98 + (i % 2) * 0.6, z - 0.7 + Math.floor(i / 2) * 0.9); }
    if (typeof makeTextSign === 'function') {
      const sign = add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 1.4), new THREE.MeshStandardMaterial({ map: makeTextSign(p.e + ' ' + p.price + '🪙', '#f6ecd4', '#4a3a22', 170, 70), roughness: 0.7 })));
      sign.position.set(x + (x > 0 ? -0.36 : 0.36), 1.95, z); sign.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
    }
    bizColliders.push({ type: 'box', x0: x - 0.4, x1: x + 0.4, z0: z - 1.2, z1: z + 1.2 });
  });
  // a doormat by the entrance
  B(1.8, 0.02, 1.0, pbr(0x8a4a3a, 0.95), 0, 0.011, 4.3);
  if (typeof applyComfortLighting === 'function') applyComfortLighting(bizScene);   // respect 🌙 comfort mode on rebuild
}

// ── Live customers during your shift: help them find things & ring them up ──
function bubbleTexture(text) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 84;
  const g = c.getContext('2d');
  g.fillStyle = '#fffdf4'; g.strokeStyle = '#6a5a4a'; g.lineWidth = 4;
  g.beginPath();
  if (g.roundRect) g.roundRect(4, 4, 120, 60, 16); else g.rect(4, 4, 120, 60);   // roundRect fallback for older WebViews
  g.fill(); g.stroke();
  g.beginPath(); g.moveTo(56, 62); g.lineTo(64, 80); g.lineTo(74, 62); g.closePath(); g.fill();
  g.font = '34px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 64, 35);
  return new THREE.CanvasTexture(c);
}
function setCustomerBubble(c, text) {
  if (c.bubble) { c.group.remove(c.bubble); c.bubble = null; }
  if (!text) return;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.62), new THREE.MeshBasicMaterial({ map: bubbleTexture(text), transparent: true }));
  m.position.y = 2.35; c.group.add(m); c.bubble = m;
}
function shiftRunning() { const j = state.job; return !!(j && state.inWork === j.site && j.openedToday && !j.closedToday); }
function spawnWorkCustomer() {
  if (!shiftRunning() || typeof buildHuman !== 'function') return;
  const prods = workProducts(state.inWork);
  const cfg = (typeof randomPersonCfg === 'function') ? randomPersonCfg() : {};
  const h = buildHuman(cfg);
  h.group.position.set(0, 0, 4.6); bizScene.add(h.group);
  const helpMode = Math.random() < 0.5;
  const want = prods[Math.floor(Math.random() * prods.length)];
  const items = [];                                              // what they'll buy at the till
  const n = helpMode ? 1 : 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) items.push(prods[Math.floor(Math.random() * prods.length)]);
  const spot = WORK_SHELF_SPOTS[Math.floor(Math.random() * WORK_SHELF_SPOTS.length)];
  const c = { group: h.group, parts: h.parts, wx: 0, wz: 4.6, x: 0, z: 4.6, phase: Math.random() * 6,
    mode: helpMode ? 'toShelf' : 'toBrowse', want: helpMode ? want : null, items: helpMode ? [want] : items,
    tx: spot[0], tz: spot[1], patience: 46, bubble: null, wrong: 0 };
  state.workCustomers.push(c);
}
function customerToCounter(c) {
  const spot = WORK_WAIT_SPOTS[state.workCustomers.filter(k => k.mode === 'toPay' || k.mode === 'pay').length % WORK_WAIT_SPOTS.length];
  c.mode = 'toPay'; c.tx = spot[0]; c.tz = spot[1]; c.patience = 46;
  setCustomerBubble(c, c.items.map(i => i.e).join(''));
}
function updateWorkCustomers(t) {
  if (!state.workCustomers) return;
  // spawn a trickle while the shift is open (max 3 in the shop)
  if (shiftRunning()) {
    state._custT = (state._custT || 0) - 0.016;
    if (state._custT <= 0 && state.workCustomers.length < 3) { spawnWorkCustomer(); state._custT = 8 + Math.random() * 7; }
  }
  for (let i = state.workCustomers.length - 1; i >= 0; i--) {
    const c = state.workCustomers[i];
    c.x = c.wx; c.z = c.wz;
    if (c.bubble) { c.bubble.position.y = 2.35 + Math.sin(t * 2.4 + c.phase) * 0.06; c.bubble.lookAt(camera.position); }
    if (c.mode === 'toShelf' || c.mode === 'toBrowse' || c.mode === 'toPay' || c.mode === 'leave') {
      if (walkToward(c, c.tx, c.tz, 0.035)) {
        if (c.mode === 'toShelf') { c.mode = 'need'; standPose(c); setCustomerBubble(c, '💭' + c.want.e); }
        else if (c.mode === 'toBrowse') { c.mode = 'browse'; c.timer = 3 + Math.random() * 3; standPose(c); }
        else if (c.mode === 'toPay') { c.mode = 'pay'; standPose(c); c.group.rotation.y = Math.PI; }
        else { setCustomerBubble(c, null); bizScene.remove(c.group); state.workCustomers.splice(i, 1); continue; }
      }
    } else if (c.mode === 'browse') {
      if (typeof idleHuman === 'function') idleHuman(c, t);
      c.timer -= 0.016;
      if (c.timer <= 0) customerToCounter(c);
    } else if (c.mode === 'need' || c.mode === 'pay') {
      if (typeof idleHuman === 'function') idleHuman(c, t);
      c.patience -= 0.016;
      if (c.patience <= 0) { c.mode = 'leave'; c.tx = 0; c.tz = 4.7; setCustomerBubble(c, '💨'); showNotif('😾 A customer got tired of waiting and left…'); }
    }
  }
}
function clearWorkCustomers() {
  (state.workCustomers || []).forEach(c => { setCustomerBubble(c, null); bizScene.remove(c.group); });
  state.workCustomers = [];
}
function nearestWorkCustomer(cp, mode, r) {
  let best = null, bestD = r;
  for (const c of (state.workCustomers || [])) { if (c.mode !== mode) continue; const d = Math.hypot(c.wx - cp.x, c.wz - cp.z); if (d < bestD) { bestD = d; best = c; } }
  return best;
}

// ── The 🔎 "help them find it" interaction (like Mrs. Chen's game, but in-world) ──
function openHelpFind(c) {
  if (!c) return;
  state.uiOpen = true; state._helpCust = c;
  const prods = workProducts(state.inWork);
  document.getElementById('checkout-title').textContent = '🔎 What are they after?';
  document.getElementById('checkout-body').innerHTML =
    `<div class="modal-sub">The customer mumbles a description… their thought bubble is the clue!</div>` +
    `<div class="co-grid">` + prods.map(p => `<button onclick="pickHelpItem('${p.id}')">${p.e}<small>${p.name}</small></button>`).join('') + `</div>` +
    `<button class="modal-close" onclick="closeCheckout()">Not now</button>`;
  document.getElementById('checkout').classList.add('show');
}
function pickHelpItem(pid) {
  const c = state._helpCust; if (!c || c.mode !== 'need') { closeCheckout(); return; }
  if (c.want && pid === c.want.id) {
    closeCheckout();
    const tip = 1 + Math.floor(Math.random() * 2);
    state.coins += tip; state.earned = (state.earned || 0) + tip;
    document.getElementById('coin-count').textContent = state.coins;
    if (state.job) state.job.helps = (state.job.helps || 0) + 1;
    if (typeof sfx === 'function') sfx('coin');
    setCustomerBubble(c, '❤️');
    showNotif('🔎 Found it for them! +' + tip + ' 🪙 tip — they\'re heading to your till.');
    if (typeof schoolEvent === 'function') schoolEvent('helped');
    setTimeout(() => customerToCounter(c), 900);
  } else {
    c.wrong = (c.wrong || 0) + 1;
    if (c.wrong >= 3) { closeCheckout(); c.mode = 'leave'; c.tx = 0; c.tz = 4.7; setCustomerBubble(c, '💢'); showNotif('💢 Third wrong guess — they gave up and left.'); }
    else showNotif('🙅 "No, not that…" — look at their thought bubble! (' + c.wrong + '/3)');
  }
}

// ── The 💰 checkout: ring up their items and give the RIGHT change ──
function openCheckout(c) {
  if (!c) return;
  state.uiOpen = true; state._payCust = c;
  const total = c.items.reduce((s, p) => s + p.price, 0);
  const notes = [5, 10, 20];
  const paid = total % 5 === 0 && Math.random() < 0.4 ? total : (notes.find(n => n >= total) || 20);
  const change = paid - total;
  c._paid = paid; c._change = change;
  const lines = c.items.map(p => `<div class="co-line"><span>${p.e} ${p.name}</span><span>${p.price} 🪙</span></div>`).join('');
  let h = `<div class="co-receipt">${lines}<div class="co-line co-total"><span>Total</span><span>${total} 🪙</span></div>` +
          `<div class="co-line co-paid"><span>They hand you</span><span>${paid} 🪙</span></div></div>`;
  if (change === 0) {
    h += `<div class="modal-sub">Exact money — lovely!</div><button class="pol-primary" onclick="pickChange(0)">✅ Take ${paid} 🪙 — no change needed</button>`;
  } else {
    const opts = [change, change + 1, Math.max(0, change - 1), change + 2].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).sort(() => Math.random() - 0.5);
    h += `<div class="modal-sub">How much change do you give back?</div>` +
         `<div class="co-grid">` + opts.map(v => `<button onclick="pickChange(${v})">${v} 🪙</button>`).join('') + `</div>`;
  }
  h += `<button class="modal-close" onclick="closeCheckout()">Not now</button>`;
  document.getElementById('checkout-title').textContent = '💰 Ring it up';
  document.getElementById('checkout-body').innerHTML = h;
  document.getElementById('checkout').classList.add('show');
}
function pickChange(v) {
  const c = state._payCust; if (!c || c.mode !== 'pay') { closeCheckout(); return; }
  const total = c.items.reduce((s, p) => s + p.price, 0);
  closeCheckout();
  const j = state.job;
  if (v === c._change) {
    if (j) { j.till = (j.till || 0) + total; j.sales = (j.sales || 0) + 1; }
    const tip = Math.random() < 0.35 ? 1 : 0;
    if (tip) { state.coins += tip; state.earned = (state.earned || 0) + tip; document.getElementById('coin-count').textContent = state.coins; }
    if (typeof sfx === 'function') sfx('coin');
    setCustomerBubble(c, '😊');
    showNotif('💰 Perfect change! +' + total + ' 🪙 to the till' + (tip ? ' (+1 tip!)' : '') + ' — stash it in the safe.');
    if (typeof schoolEvent === 'function') schoolEvent('change');
  } else {
    if (j) { j.till = (j.till || 0) + total; j.sales = (j.sales || 0) + 1; }
    setCustomerBubble(c, '🤨');
    showNotif('🤨 "That\'s not right…" — they count out their own change. No tip this time.');
  }
  c.mode = 'leave'; c.tx = 0; c.tz = 4.7;
  setTimeout(() => setCustomerBubble(c, null), 1400);
  if (typeof updateJobHUD === 'function') updateJobHUD();
  if (typeof saveGame === 'function') saveGame();
}
function closeCheckout() { state.uiOpen = false; document.getElementById('checkout').classList.remove('show'); }
function stashCash() {
  const j = state.job; if (!j || !(j.till > 0)) return;
  j.banked = (j.banked || 0) + j.till;
  if (typeof schoolEvent === 'function') schoolEvent('stashed', j.till);
  showNotif('🏦 Stashed ' + j.till + ' 🪙 in the safe. Banked today: ' + j.banked + ' 🪙');
  j.till = 0;
  if (typeof sfx === 'function') sfx('coin');
  if (typeof saveGame === 'function') saveGame();
}
// True when you're standing in the staff area behind the counter
function behindCounter(cp) { return cp.z < -3.1 && cp.z > -4.9 && cp.x > -1.9 && cp.x < 6.9; }
// The full in-shop context: help a browser, ring up a payer, stash cash, run the shift —
// or, at someone ELSE's counter: apply for the job / buy something to take home.
function workShiftContext(cp) {
  if (state.job && state.job.site === state.inWork) {
    const helpC = nearestWorkCustomer(cp, 'need', 1.9);
    if (helpC) { state._helpCust = helpC; return { action: 'helpfind', label: '🔎 See what they need' }; }
    if (behindCounter(cp)) {
      const payC = nearestWorkCustomer(cp, 'pay', 3.4);
      if (payC) { state._payCust = payC; return { action: 'ringup', label: '💰 Ring up the customer' }; }
      if ((state.job.till || 0) > 0 && Math.hypot(cp.x - 6.2, cp.z - (-4.4)) < 2.0) return { action: 'stashcash', label: '🏦 Stash ' + state.job.till + ' 🪙 in the safe' };
    }
  }
  // at the owner's counter (they're running the till) — buying is handled by its own
  // 🛍️ button (canShopBuy), so shopping never hides behind the job application
  const ow = state.workOwner;
  if (ow && ow.site === state.inWork && ow.group.visible && !ow.visiting && Math.hypot(cp.x - 0.6, cp.z - (-2.8)) < 2.3) {
    const s = JOB_SITES.find(x => x.id === state.inWork);
    if (!state.job && !jobBlocked() && s) { state.jobTarget = findEmployer(s.id); return { action: 'applyjob', label: '💼 Ask ' + ow.name + ' for the job · ' + s.wage + '🪙/day' }; }
  }
  return workRegisterContext(cp);
}
// Anyone can shop at the owner's counter — customer or employee, job or no job
function canShopBuy(cp) {
  const ow = state.workOwner;
  return !!(ow && ow.site === state.inWork && ow.group.visible && !ow.visiting &&
    Math.hypot(cp.x - 0.6, cp.z - (-2.8)) < 2.3 && !state.carryBag && !shiftRunning());
}

// ── 🛍️ Buying from a shop: pick an item, the owner bags it, you carry it home in your mouth ──
function openShopBuy() {
  const id = state.inWork; if (!id) return;
  const prods = workProducts(id);
  state.uiOpen = true;
  document.getElementById('checkout-title').textContent = '🛍️ What would you like?';
  document.getElementById('checkout-body').innerHTML =
    `<div class="modal-sub">The owner will pop it in a little bag for you. 🪙 ${state.coins}</div>` +
    `<div class="co-grid">` + prods.map(p => `<button ${state.coins >= p.price ? '' : 'disabled'} onclick="buyShopBagItem('${p.id}')">${p.e}<small>${p.name} · ${p.price} 🪙</small></button>`).join('') + `</div>` +
    `<button class="modal-close" onclick="closeCheckout()">Not today</button>`;
  document.getElementById('checkout').classList.add('show');
}
function buyShopBagItem(pid) {
  const id = state.inWork; if (!id) { closeCheckout(); return; }
  const p = workProducts(id).find(x => x.id === pid); if (!p) return;
  if (state.coins < p.price) { showNotif('Not enough coins…'); return; }
  state.coins -= p.price; document.getElementById('coin-count').textContent = state.coins;
  closeCheckout();
  const s = JOB_SITES.find(x => x.id === id);
  if (typeof setCarryBag === 'function') setCarryBag({ id: p.id, name: p.name, e: p.e, price: p.price }, s ? s.name : 'the shop');
  if (typeof sfx === 'function') sfx('coin');
  showNotif('🛍️ ' + p.e + ' ' + p.name + ' — bagged up! Carry it home to the Millers (no running with a full mouth!)');
}

// Enter / leave the shop interior (a dedicated layout — counter you can walk behind).
function enterWorkplace(id) {
  const s = JOB_SITES.find(x => x.id === id); if (!s) return;
  state.inWork = id;
  buildWorkInterior(id);
  if (bizScene.background) bizScene.background.set(0x2a2622);
  bizScene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_IN);
  catGroup.position.set(0, 0, 4); catGroup.rotation.y = Math.PI;
  state.camYaw = 0; state.camHeight = 8; state.camDist = 6.5;
  camera.position.set(0, state.camHeight, 4 + state.camDist);
  document.getElementById('minimap').style.display = 'none';
  state.workCustomers = []; state.workOccupants = [];
  const mine = state.job && state.job.site === id;
  // the OWNER runs their own shop: behind the counter at the register, facing the room
  if (typeof buildHuman === 'function') {
    const oc = buildHuman(EMPLOYER_CFG[id] || ((typeof randomPersonCfg === 'function') ? randomPersonCfg() : {}));
    oc.group.position.set(0.6, 0, -4.2); oc.group.rotation.y = 0; bizScene.add(oc.group);
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshStandardMaterial({ color: 0x6ac0f0, emissive: 0x1060a0, emissiveIntensity: 0.8, roughness: 0.4 }));
    bubble.position.y = 2.5; oc.group.add(bubble);
    state.workOwner = { site: id, name: s.boss, group: oc.group, parts: oc.parts, bubble, phase: Math.random() * 6,
      visitT: 45 + Math.random() * 30, visiting: false, mode: null, wx: 0.6, wz: -4.2 };   // first 👔 check-in ~a minute into your shift
    // a couple of ambient shoppers so the place never feels dead
    [[-3, 0], [3, 1]].forEach(([x, z]) => {
      const cfg = (typeof randomPersonCfg === 'function') ? randomPersonCfg() : {};
      const h = buildHuman(cfg); h.group.position.set(x, 0, z); h.group.rotation.y = Math.random() * 6; bizScene.add(h.group);
      state.workOccupants.push({ group: h.group, parts: h.parts, phase: Math.random() * 6 });
    });
  }
  const st = shiftState();
  showDialogue(s.emoji + ' ' + s.name,
    mine ? (st === 'canOpen' ? 'Time to open up! Get behind the counter and tap 🔓 Open shop.'
          : state.job.openedToday ? 'You\'re on shift — help browsers find things (🔎), ring up buyers at the till (💰), and stash the cash in the safe (🏦).'
          : 'Your shift is 9 to 5 — open up behind the counter in the morning.')
         : 'Welcome! Have a look around the shop. 🛍️', 5600);
  if (mine && typeof showTutorial === 'function') showTutorial('workshift', [   // 🎓 first-shift walkthrough — the arrow glows on the action button
    { text: '🛒 <b>Your first shift!</b> Walk BEHIND the counter — through the gap on the left. That\'s your side now. ➡️', glow: null },
    { text: '🔓 At the register, the glowing button opens the shop. Do it around <b>9am</b> — opening late costs pay!', glow: 'context-btn' },
    { text: '💭 Customers with a thought bubble need help — walk up and tap <b>🔎 See what they need</b>, then pick what their bubble shows. Tips! 🪙', glow: 'context-btn' },
    { text: '💰 Buyers queue at the counter. From BEHIND it, tap <b>Ring up</b> — charge their items and hand back the <b>correct change</b>.', glow: 'context-btn' },
    { text: '🏦 Sales fill your till — stash it in the safe (back-right corner). At <b>5pm</b> close up: wage + 10% commission. Good luck! 🐾', glow: 'context-btn' },
  ]);
}
function exitWorkplace() {
  const s = JOB_SITES.find(x => x.id === state.inWork) || { x: 0, z: 0 };
  state.inWork = null;
  state.workOwner = null;   // the owner lives in the scene we just left
  clearWorkCustomers();
  (state.workOccupants || []).forEach(o => bizScene.remove(o.group)); state.workOccupants = [];
  scene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_OUT);
  catGroup.position.set(s.x, 0, s.z + 1.6); catGroup.rotation.y = 0;
  state.camYaw = 0; state.camHeight = 7; state.camDist = 9;
  camera.position.set(s.x, state.camHeight, s.z + 1.6 + 9);
  document.getElementById('minimap').style.display = '';
}
function updateWorkOccupants(t) {
  (state.workOccupants || []).forEach(o => { if (typeof idleHuman === 'function') idleHuman(o, t); });
  const ow = state.workOwner;
  if (ow && ow.site === state.inWork) {
    if (shiftRunning()) {
      updateBossCheckin(ow, t);   // YOUR shift: the boss drops in every so often to check on you
    } else {
      // owner at the till, running their own shop
      ow.group.visible = true;
      ow.group.position.set(0.6, 0, -4.2); ow.group.rotation.y = 0;
      if (typeof idleHuman === 'function') idleHuman(ow, t);
      if (ow.bubble) { ow.bubble.visible = !state.job && !jobBlocked(); ow.bubble.position.y = 2.5 + Math.sin(t * 3 + ow.phase) * 0.08; }   // 💼 hiring bubble over the owner
    }
  }
  updateWorkCustomers(t);
}

// ── 👔 Boss check-ins: during your shift the owner wanders in, walks up to YOU, and asks
//    how things are going. Pick an answer — upbeat, honest, or grumpy — and your standing
//    (reputation) with employers shifts accordingly. ──
const BOSS_CHECKINS = [
  { q: "How's the shop running today?", a: [
    { t: "😺 Smooth as cream — all good here!",           rep: 2,  r: "That's what I like to hear. Keep it up! 🐾" },
    { t: "😼 Busy — but I'm on top of it.",               rep: 2,  r: "A cool head on a busy day. That's rare — well done." },
    { t: "😿 Honestly… it's been a rough one.",           rep: 1,  r: "Thanks for telling me straight. Hang in there — rough days pass." },
  ] },
  { q: "Any trouble with the customers?", a: [
    { t: "😺 None at all — they leave purring!",          rep: 2,  r: "Wonderful. Happy customers always come back." },
    { t: "🙀 A few grumpy ones, but I stayed polite.",    rep: 2,  r: "Exactly the right way to handle it. I'm impressed." },
    { t: "😾 They're driving me up the wall!",            rep: -1, r: "Easy now — we never hiss at customers. Deep breaths." },
  ] },
  { q: "Are you happy working here?", a: [
    { t: "😻 Best job in town!",                          rep: 2,  r: "Ha! And you might be the best cashier I've ever had." },
    { t: "😐 It's fine… the pay could be better though.", rep: 0,  r: "Everyone says that! Keep your shifts clean and ask me for a raise properly." },
    { t: "😿 Not really, to be honest…",                  rep: -1, r: "Sorry to hear it. Chin up — or maybe this isn't the place for you." },
  ] },
  { q: "Till and safe all adding up?", a: [
    { t: "😺 Every last coin — counted twice!",           rep: 2,  r: "Music to my ears. Carry on!" },
    { t: "😼 The takings are stashed safe in the safe.",  rep: 2,  r: "Good habits. That's how a shop stays standing." },
    { t: "🙀 Umm… I lost count somewhere…",               rep: -1, r: "Hmm. Count it again — carefully. I'm trusting you to sort it." },
  ] },
  { q: "Anything you need from me?", a: [
    { t: "😺 Nothing — it's all under control!",          rep: 2,  r: "Then I'll leave you to it. Good work!" },
    { t: "🙏 More stock — the shelves are getting bare.", rep: 1,  r: "Good eye! I'll put an order in this evening." },
    { t: "😾 A day off. And double pay.",                 rep: -1, r: "Ha! Cheeky. Back to work with you." },
  ] },
];
function updateBossCheckin(ow, t) {
  if (ow.bubble) ow.bubble.visible = false;
  if (!ow.visiting) {                    // off the floor, minding their own business
    ow.group.visible = false;
    ow.visitT -= 0.016;
    if (ow.visitT <= 0) {                // time for a visit: in through the front door
      ow.visiting = true; ow.mode = 'walkIn'; ow.asked = false; ow.waitT = 0;
      ow.wx = 0; ow.wz = 4.6; ow.group.position.set(0, 0, 4.6);
      showNotif('👀 ' + ow.name + ' came in to see how you\'re getting on…');
    }
    return;
  }
  ow.group.visible = true;
  if (ow.mode === 'walkIn') {            // walk over to wherever you are (stopping short of the counter)
    const cp = catGroup.position;
    const tx = Math.max(-6, Math.min(6, cp.x)), tz = Math.max(-2.2, Math.min(4.2, cp.z + 1.1));
    if (walkToward(ow, tx, tz, 0.032) || Math.hypot(ow.wx - cp.x, ow.wz - cp.z) < 1.7) {
      ow.mode = 'chat';
      if (typeof standPose === 'function') standPose(ow);
    }
  } else if (ow.mode === 'chat') {       // face you and ask — waits politely if you're mid-sale
    const cp = catGroup.position;
    ow.group.rotation.y = Math.atan2(cp.x - ow.group.position.x, cp.z - ow.group.position.z);
    if (typeof idleHuman === 'function') idleHuman(ow, t);
    if (!ow.asked) {
      if (!state.uiOpen) { ow.asked = true; openBossCheckin(); }
      else if ((ow.waitT += 0.016) > 22) {   // you're clearly busy — leaves you to it
        showNotif('👔 ' + ow.name + ': "You look busy — carry on!"');
        bossCheckinDone(0);
      }
    } else if (!state._bossQ && !state.uiOpen) {
      ow.mode = 'leave';   // chat resolved (or the dialog was dismissed some other way) — head out
    }
  } else if (ow.mode === 'leave') {      // stroll back out through the door
    if (walkToward(ow, 0, 4.6, 0.032)) {
      ow.visiting = false; ow.mode = null; ow.group.visible = false;
      ow.visitT = 85 + Math.random() * 60;   // until the next check-in
    }
  }
}
// The shared little Q&A chat modal (used by your shift boss AND Daniel at the family shop).
// Answers are {t: button text, rep: reputation change, r: their reply}; onPick gets the choice.
function openCheckinModal(title, sub, answers, onPick) {
  state.uiOpen = true; state._chkAnswers = answers; state._chkOn = onPick;
  const tt = document.getElementById('job-title'); if (tt) tt.textContent = title;
  document.getElementById('job-body').innerHTML =
    `<div class="modal-sub">${sub}</div>` +
    `<div class="modal-row" style="flex-direction:column;gap:8px">` +
    answers.map((a, i) => `<button class="cust-pat" onclick="pickCheckinAnswer(${i})">${a.t}</button>`).join('') +
    `</div>`;
  document.getElementById('job').classList.add('show');
}
function pickCheckinAnswer(i) {
  const a = (state._chkAnswers || [])[i], on = state._chkOn;
  state._chkAnswers = null; state._chkOn = null;
  state.uiOpen = false; document.getElementById('job').classList.remove('show');
  if (a && on) on(a);
}
function openBossCheckin() {
  const ow = state.workOwner, j = state.job; if (!ow || !j) return;
  const q = BOSS_CHECKINS[Math.floor(Math.random() * BOSS_CHECKINS.length)];
  state._bossQ = q;   // updateBossCheckin watches this to know the chat is still open
  openCheckinModal('👔 ' + ow.name + ' checks in',
    `${j.emoji} <b>${ow.name}</b> wanders over for a chat:<br>“${q.q}”`,
    q.a,
    (a) => { state._bossQ = null; showDialogue('👔 ' + ow.name, a.r, 5200); bossCheckinDone(a.rep); });
}
// 🔧 Daniel's version, for when he drops by the family shop while you're there —
// same chat, warmer questions (he's family, not your boss).
const DANIEL_CHECKINS = [
  { q: "How's our little shop looking, partner?", a: [
    { t: "😺 Business is purring along!",        rep: 1, r: "That's the spirit! This place saved us — let's keep it shining." },
    { t: "😼 The staff are doing a fine job.",   rep: 1, r: "Aren't they just? I'll bring them something nice tomorrow." },
    { t: "😿 It's been a slow day…",             rep: 0, r: "Slow days happen. We've weathered far worse together, eh?" },
  ] },
  { q: "Everything alright with you, little one?", a: [
    { t: "😻 Never better!",                     rep: 1, r: "Good. Elena worries about you out here, you know." },
    { t: "😼 Busy — lots to look after.",        rep: 1, r: "Ha — the hardest worker in this family has four paws." },
    { t: "😿 A bit tired, honestly…",            rep: 0, r: "Then rest, you daft thing. The shop will keep. Family first." },
  ] },
];
function openDanielCheckin() {
  const q = DANIEL_CHECKINS[Math.floor(Math.random() * DANIEL_CHECKINS.length)];
  openCheckinModal('🔧 Daniel drops by',
    `🏪 <b>Daniel</b> looks the family shop over, then down at you:<br>“${q.q}”`,
    q.a,
    (a) => { showDialogue('🔧 Daniel', a.r, 5200); if (a.rep) addWorkRep(a.rep); if (typeof saveGame === 'function') saveGame(); });
}
function bossCheckinDone(rep) {
  const ow = state.workOwner;
  if (rep) addWorkRep(rep);
  if (ow) { ow.asked = true; ow.mode = 'leave'; }
  if (typeof saveGame === 'function') saveGame();
}
function addWorkRep(n) {
  state.workRep = Math.max(-10, Math.min(30, (state.workRep || 0) + n));
  if (n > 0) showNotif('⭐ Reputation +' + n + ' — the boss left with a good impression.');
  else if (n < 0) showNotif('💢 Reputation ' + n + ' — grumbling never looks good.');
}
function bossOpinion() {
  const wr = state.workRep || 0;
  return wr >= 12 ? 'Delighted with you 🌟' : wr >= 5 ? 'Pleased with you 😊' : wr >= 0 ? 'No complaints 🙂' : 'A little grumpy with you 😕';
}

function shiftState() {
  const j = state.job; if (!j) return 'off';
  const h = state.dayTime * 24;
  if (h < WORK_OPEN - 1 || h >= WORK_CLOSE + 1) return 'off';   // outside working hours
  if (!j.openedToday) return (h < WORK_CLOSE) ? 'canOpen' : 'off';
  if (!j.closedToday) return (h >= WORK_CLOSE - 1) ? 'canClose' : 'working';   // can close from 4pm
  return 'done';
}

function applyForJob(e) {
  if (!e) return;
  if (jobBlocked()) { showNotif('Not while you\'re in politics — finish the campaign first.'); return; }
  if (state.job) { showNotif('You already have a job.'); return; }
  const s = e.site;
  const wage = Math.round(s.wage * ((typeof schoolHas === 'function' && schoolHas('logistics')) ? 1.25 : 1));   // 💼 diploma = better pay
  state.job = { site: s.id, name: s.name, emoji: s.emoji, boss: s.boss, wage: wage, x: e.x, z: e.z,
    strikes: 0, shifts: 0, lastRaiseShift: 0, raises: 0, openedToday: false, closedToday: false, late: false,
    hireDayCount: state.dayCount || 0, remOpen: -1, remClose: -1 };
  refreshEmployerBubbles();
  const cvList = (state.cvJobs = state.cvJobs || []);   // 📄 the job goes straight onto your CV
  if (!cvList.some(r => r.name === s.name)) cvList.push({ name: s.name, emoji: s.emoji, shifts: 0 });
  if (typeof inboxAdd === 'function') inboxAdd(s.boss + ' ' + s.emoji, 'Your employment at ' + s.name.replace(/^the /, ''),
    `Dear ${state.catName} Miller,<br><br>Welcome aboard as our <b>cashier</b>!<br>• 🔓 Open at <b>9:00 am</b><br>• 🔒 Close at <b>5:00 pm</b><br>• 💰 ${wage} 🪙/day + 10% of takings<br><br>Three strikes (late or missed shifts) and we part ways. Do well and ask for a raise.<br>— ${s.boss}`);
  showNotif('📬 You got the job at ' + s.name + '! Read your schedule letter.');
  if (typeof schoolEvent === 'function') schoolEvent('hired');
  showJobLetter();   // the boss hands you a letter with your schedule
  updateJobHUD();
  if (typeof saveGame === 'function') saveGame();
}
// The schedule, delivered as a letter (shown on hire, re-readable from the 💼 panel).
function showJobLetter() {
  const j = state.job; if (!j) return;
  state.uiOpen = true;
  const tt = document.getElementById('job-title'); if (tt) tt.textContent = '📬 A letter for you';
  document.getElementById('job-body').innerHTML =
    `<div class="job-letter">` +
      `<p class="jl-head">${j.emoji} ${j.name} — Employment</p>` +
      `<p>Dear ${state.catName},</p>` +
      `<p>Welcome aboard as our new <b>cashier</b>! Here is your schedule:</p>` +
      `<ul>` +
        `<li>🔓 <b>Open</b> the shop at <b>9:00 am</b></li>` +
        `<li>🔒 <b>Close</b> up at <b>5:00 pm</b></li>` +
        `<li>💰 Pay: <b>${j.wage} 🪙 / day</b>, in your paw at closing</li>` +
      `</ul>` +
      `<p>Be on time — <b>3 strikes</b> (late or missed shifts) and we let you go. Do well and you can ask for a raise.</p>` +
      `<p class="jl-sign">— ${j.boss} ${j.emoji}</p>` +
    `</div>` +
    `<button class="pol-primary" onclick="closeJobPanel()">Got it — I'll be there! 🐾</button>`;
  document.getElementById('job').classList.add('show');
}
function doShiftAction() {
  const j = state.job; if (!j) return;
  const st = shiftState(), h = state.dayTime * 24;
  if (st === 'canOpen') {
    j.openedToday = true; j.late = h > WORK_OPEN + 0.75;
    if (typeof sfx === 'function') sfx('coin');
    showNotif(j.late ? '⚠️ Opened late — the boss frowned.' : '🔓 Opened up right on time! Mind the till till five.');
    if (!state.inWork) enterWorkplace(j.site);   // opening the shop steps you inside to work
  } else if (st === 'canClose') {
    j.closedToday = true;
    if ((j.till || 0) > 0) { j.banked = (j.banked || 0) + j.till; j.till = 0; }   // sweep the till into the safe at close
    const base = j.late ? Math.round(j.wage * 0.7) : j.wage;
    const commission = Math.round((j.banked || 0) * 0.10);                        // 10% of the day's takings
    const pay = base + commission;
    state.coins += pay; state.earned = (state.earned || 0) + pay;
    document.getElementById('coin-count').textContent = state.coins;
    j.shifts++;
    const cvRec = (state.cvJobs || []).find(r => r.name === j.name);   // 📄 the CV keeps count
    if (cvRec) cvRec.shifts = (cvRec.shifts || 0) + 1;
    if (typeof sfx === 'function') sfx('coin');
    if (typeof addGoodwill === 'function') addGoodwill(3, 'A day of honest work');
    showNotif('🔒 Shift done — +' + base + ' 🪙 wage' + (commission ? ' +' + commission + ' 🪙 commission (' + (j.sales || 0) + ' sales)' : '') + (j.late ? ' (docked for lateness)' : ''));
    if (raiseReady()) showNotif('⭐ You\'ve earned the right to ask for a raise — tap 💼 Your job.');
    j.banked = 0; j.sales = 0; j.helps = 0;
    if (state.inWork) exitWorkplace();   // closing up sends you home
    if (typeof saveGame === 'function') saveGame();
  } else {
    openJobPanel();
  }
  updateJobHUD();
}
function raiseReady() { const j = state.job; return !!(j && (j.shifts - (j.lastRaiseShift || 0)) >= 5 && (j.raises || 0) < 3); }

function openJobPanel() {
  const j = state.job; if (!j) return;
  state.uiOpen = true;
  const tt = document.getElementById('job-title'); if (tt) tt.textContent = '💼 Your Job';
  const rr = raiseReady();
  document.getElementById('job-body').innerHTML =
    `<div class="modal-sub">${j.emoji} <b>${j.name}</b><br>Cashier · ${j.wage} 🪙/day + 10% of takings · shift 9–5<br>Shifts worked: <b>${j.shifts}</b> &nbsp;·&nbsp; Strikes: <b>${j.strikes}/3</b><br>Today: 🛒 <b>${j.sales || 0}</b> sales · 🔎 <b>${j.helps || 0}</b> helped · 💰 till <b>${j.till || 0}</b> · 🏦 safe <b>${j.banked || 0}</b><br>👔 ${j.boss}'s opinion: <b>${bossOpinion()}</b></div>` +
    `<div class="modal-row" style="flex-direction:column;gap:8px">` +
      (rr ? `<button class="pol-primary" onclick="askForRaise()">⭐ Ask for a raise</button>`
          : `<button class="pol-primary" disabled>⭐ Raise available after ${5 - (j.shifts - (j.lastRaiseShift || 0))} more shift(s)</button>`) +
      `<button class="cust-pat" onclick="showJobLetter()">📬 Re-read your schedule</button>` +
      `<button class="gov-lux" onclick="quitJob()">🚪 Quit this job</button>` +
    `</div>` +
    `<button class="modal-close" onclick="closeJobPanel()">Close</button>`;
  document.getElementById('job').classList.add('show');
}
function closeJobPanel() { state.uiOpen = false; document.getElementById('job').classList.remove('show'); }
function askForRaise() {
  const j = state.job; if (!j || !raiseReady()) return;
  j.lastRaiseShift = j.shifts;
  closeJobPanel();
  if (Math.random() < 0.75) {
    j.wage += Math.round(j.wage * 0.2); j.raises = (j.raises || 0) + 1;
    showNotif('🎉 Raise granted! You now earn ' + j.wage + ' 🪙/day.');
    showDialogue(j.boss + ' ' + j.emoji, 'You\'ve earned it — you\'re our best cashier. Here\'s a little more in your pay packet.', 5000);
  } else {
    showNotif('😕 "Not just yet — keep up the good work and ask again."');
  }
  updateJobHUD();
  if (typeof saveGame === 'function') saveGame();
}
function quitJob() {
  if (!state.job) return;
  const name = state.job.name;
  state.job = null; refreshEmployerBubbles(); closeJobPanel();
  showNotif('🚪 You quit your job at ' + name + '.');
  updateJobHUD();
  if (typeof saveGame === 'function') saveGame();
}

// New-day grading (called from updateDayNight)
function processJobDay() {
  const j = state.job; if (!j) return;
  if (jobBlocked()) { j.openedToday = false; j.closedToday = false; j.late = false; return; }   // no strikes while in politics
  if ((state.dayCount || 0) - 1 <= (j.hireDayCount || 0)) {   // excuse your hire day
    j.openedToday = false; j.closedToday = false; j.late = false; j.remOpen = -1; j.remClose = -1; updateJobHUD(); return;
  }
  if (!j.openedToday || !j.closedToday) {
    j.strikes = (j.strikes || 0) + 1;
    showNotif('⚠️ You skipped your shift at ' + j.name + '! Strike ' + j.strikes + ' of 3.');
    if (j.strikes >= 3) { fireFromJob(); return; }
  } else if (j.late) {
    j.strikes = (j.strikes || 0) + 1;
    showNotif('⚠️ Late again at ' + j.name + '. Strike ' + j.strikes + ' of 3.');
    if (j.strikes >= 3) { fireFromJob(); return; }
  } else {
    j.strikes = Math.max(0, (j.strikes || 0) - 1);   // a clean, on-time day earns back trust
  }
  j.openedToday = false; j.closedToday = false; j.late = false; j.remOpen = -1; j.remClose = -1;
  j.till = 0; j.banked = 0; j.sales = 0; j.helps = 0;   // a fresh trading day
  updateJobHUD();
}
function fireFromJob() {
  const boss = state.job.boss, name = state.job.name;
  const cvRec = (state.cvJobs || []).find(r => r.name === name);   // 📄 it goes on your record…
  if (cvRec) cvRec.fired = true;
  state.job = null; refreshEmployerBubbles();
  showDialogue('📋 ' + boss, 'That\'s the last straw — you\'ve let ' + name + ' down too many times. You\'re fired.', 6000);
  updateJobHUD();
  if (typeof saveGame === 'function') saveGame();
}

function updateJobHUD() {
  const el = document.getElementById('jobhud'); if (!el) return;
  const show = state.job && !jobBlocked() && !(state.inHouse || state.inShop || state.inShelter || state.inBoughtHome || state.inBiz || state.inJail);
  el.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const j = state.job, st = shiftState();
  let status = '💤 off-hours';
  if (st === 'canOpen') status = '🔔 open up!';
  else if (st === 'working') status = '🛒 on shift';
  else if (st === 'canClose') status = '🔔 close up!';
  else if (st === 'done') status = '✅ done today';
  el.querySelector('.jobhud-text').textContent = j.emoji + ' ' + j.name.replace('the ', '') + ' · 9–5 · ' + status;
  el.classList.toggle('alert', st === 'canOpen' || st === 'canClose');
  // once-per-day reminders when each window opens
  const day = state.dayCount || 0;
  if (st === 'canOpen' && j.remOpen !== day) { j.remOpen = day; showNotif('🔔 Time to open ' + j.name + '! Head over and start your shift.'); }
  if (st === 'canClose' && j.remClose !== day && j.openedToday) { j.remClose = day; showNotif('🔔 Five o\'clock — go close up ' + j.name + ' to get paid.'); }
}
