// zoo.js — 🦁 THE FRONTIER: the tripled map's wild woods, the GRAND PARK, and the TOWN ZOO.
// The zoo is ONE real place in the world: animals live inside the walled compound, the
// gate is CLOSED until you buy a day ticket (10🪙), and you can work the booth for real —
// visitor NPCs queue up with big, clear thought bubbles and you sell each one the ticket
// they're thinking of. No minigame — actual people, actual sales, 2🪙 a ticket.

const GRAND_PARK = { x0: -45, x1: 45, z0: -130, z1: -72 };
const ZOO = { x0: 106, x1: 150, z0: -24, z1: 24, gateX: 106, gateZ: 0 };   // east of town, gate faces west
const ZOO_TICKET = 10, ZOO_SALE_PAY = 2;
const WILD_KINDS = ['tree', 'tree', 'pine', 'blossom', 'oak', 'willow', 'autumn'];   // plain trees stay common

// Plant a permanent wild tree of any planner kind (not a player piece — just scenery)
function plantWildTree(kind, x, z) {
  if (typeof placedVisual !== 'function') return;
  const { group, coll } = placedVisual(kind);
  group.position.set(x, 0, z);
  scene.add(group);
  const collRef = (typeof worldColliderFor === 'function') ? worldColliderFor(coll, x, z, 0) : null;
  if (collRef) worldColliders.push(collRef);
  if (typeof addProp === 'function') addProp({ kind, group, x, z, rotY: 0, coll: collRef, movable: false, use: 'tree' });
}

// ── The frontier build: mixed wild woods + the Grand Park + the zoo ──
function buildFrontier() {
  buildGrandPark();
  buildZoo();
  const IN = (x, z, r) => x > r.x0 - 6 && x < r.x1 + 6 && z > r.z0 - 6 && z < r.z1 + 6;
  const zones = [
    { x0: -155, x1: -100, z0: -135, z1: 50, n: 26 },    // the west wilds
    { x0: 100, x1: 155, z0: -135, z1: -32, n: 16 },     // south-east woods (below the zoo)
    { x0: 100, x1: 155, z0: 30, z1: 52, n: 8 },         // a strip above the zoo
    { x0: -95, x1: 95, z0: -135, z1: -58, n: 26 },      // the southern reach (around the Grand Park)
  ];
  zones.forEach(zn => {
    for (let i = 0; i < zn.n; i++) {
      const x = zn.x0 + Math.random() * (zn.x1 - zn.x0);
      const z = zn.z0 + Math.random() * (zn.z1 - zn.z0);
      if (IN(x, z, GRAND_PARK) || IN(x, z, ZOO)) continue;
      plantWildTree(WILD_KINDS[Math.floor(Math.random() * WILD_KINDS.length)], +x.toFixed(1), +z.toFixed(1));
    }
  });
}

function buildGrandPark() {
  const P = GRAND_PARK;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(P.x1 - P.x0, P.z1 - P.z0), new THREE.MeshStandardMaterial({ color: 0x8ccc68, roughness: 0.95 }));
  lawn.rotation.x = -Math.PI / 2; lawn.position.set((P.x0 + P.x1) / 2, 0.02, (P.z0 + P.z1) / 2); lawn.receiveShadow = true; scene.add(lawn);
  const postM = pbr(0x9a8a6a, 0.9);
  for (let x = P.x0; x <= P.x1; x += 6) [P.z0, P.z1].forEach(z => { const p = new THREE.Mesh(G.cyl(0.09, 0.11, 1.0), postM); p.position.set(x, 0.5, z); p.castShadow = true; scene.add(p); });
  for (let z = P.z0; z <= P.z1; z += 6) [P.x0, P.x1].forEach(x => { const p = new THREE.Mesh(G.cyl(0.09, 0.11, 1.0), postM); p.position.set(x, 0.5, z); p.castShadow = true; scene.add(p); });
  // the grand pond (drinkable)
  const pondX = 0, pondZ = (P.z0 + P.z1) / 2;
  const shore = new THREE.Mesh(new THREE.CylinderGeometry(9.4, 9.4, 0.16, 36), pbr(0xc8b088, 0.9)); shore.position.set(pondX, 0.08, pondZ); shore.receiveShadow = true; scene.add(shore);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(8.7, 8.7, 0.2, 36), pbr(0x5ab6d8, 0.25)); water.position.set(pondX, 0.18, pondZ); scene.add(water);
  worldColliders.push({ type: 'circle', x: pondX, z: pondZ, r: 8.9 });
  if (typeof addWater === 'function') addWater(pondX, pondZ, 9.2);
  // a REAL arboretum: ~20 trees of every kind
  const spots = [
    [-30, -86, 'oak'], [-18, -118, 'willow'], [22, -84, 'blossom'], [34, -112, 'pine'], [-34, -102, 'autumn'],
    [30, -124, 'oak'], [12, -76, 'tree'], [-8, -124, 'blossom'], [-40, -78, 'pine'], [40, -90, 'willow'],
    [-22, -78, 'autumn'], [18, -122, 'tree'], [40, -122, 'blossom'], [-40, -124, 'oak'], [24, -102, 'willow'],
    [-14, -96, 'pine'], [36, -78, 'autumn'], [-28, -126, 'tree'], [8, -116, 'oak'], [-42, -92, 'blossom'],
  ];
  spots.forEach(([x, z, k]) => plantWildTree(k, x, z));
  [[-14, -90, 0.6], [16, -100, -0.8], [-24, -116, 0.2], [28, -88, 2.4]].forEach(([x, z, ry]) => {
    const bench = new THREE.Group();
    const bm = pbr(0x9a7248, 0.85);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.6), bm); seat.position.y = 0.5; bench.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.12), bm); back.position.set(0, 0.78, -0.24); bench.add(back);
    [-0.85, 0.85].forEach(lx => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.5), bm); leg.position.set(lx, 0.25, 0); bench.add(leg); });
    bench.position.set(x, 0, z); bench.rotation.y = ry; bench.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(bench);
    if (typeof addProp === 'function') addProp({ kind: 'bench', group: bench, x, z, rotY: ry, movable: false, use: 'bench' });
  });
  if (typeof makeTextSign === 'function') {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.0, 0.16), new THREE.MeshStandardMaterial({ map: makeTextSign('🌳 GRAND PARK', '#2a5a34', '#eaf6dc', 380, 70), roughness: 0.7 }));
    sign.position.set(0, 2.2, P.z1 + 0.5); sign.castShadow = true; scene.add(sign);
    [-2.4, 2.4].forEach(px => { const p = new THREE.Mesh(G.cyl(0.1, 0.12, 2.2), postM); p.position.set(px, 1.1, P.z1 + 0.5); scene.add(p); });
  }
}

// ── The animals (procedural, cute-blob style) ──
function zooAnimal(type) {
  const g = new THREE.Group();
  const M = (c, r = 0.85) => pbr(c, r);
  const E = (rad, sx, sy, sz, m, x, y, z) => { const me = new THREE.Mesh(G.sph(rad), m); me.scale.set(sx, sy, sz); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  if (type === 'elephant') {
    const gm = M(0x9aa0ac);
    E(0.7, 1.3, 1.05, 1.7, gm, 0, 0.95, 0);
    const head = E(0.48, 1, 1, 1, gm, 0, 1.35, 1.15);
    [-1, 1].forEach(d => E(0.34, 0.25, 1, 0.9, gm, d * 0.52, 1.45, 1.05));
    for (let i = 0; i < 4; i++) { const seg = new THREE.Mesh(G.cyl(0.13 - i * 0.02, 0.11 - i * 0.02, 0.34), gm); seg.position.set(0, 1.06 - i * 0.3, 1.62 + i * 0.1); seg.rotation.x = 0.5 + i * 0.12; seg.castShadow = true; g.add(seg); g.userData.trunk = g.userData.trunk || []; g.userData.trunk.push(seg); }
    [[-0.42, 0.55], [0.42, 0.55], [-0.42, -0.5], [0.42, -0.5]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.19, 0.22, 0.9), gm); leg.position.set(lx, 0.45, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head;
  } else if (type === 'lion') {
    const tan = M(0xd8a860), mane = M(0x8a5a2a);
    E(0.45, 1.2, 0.95, 1.55, tan, 0, 0.62, 0);
    E(0.42, 1, 1, 1, mane, 0, 0.95, 0.62);
    const head = E(0.3, 1, 0.95, 0.95, tan, 0, 0.98, 0.78);
    [-1, 1].forEach(d => E(0.09, 1, 1, 0.6, tan, d * 0.2, 1.25, 0.72));
    [[-0.3, 0.45], [0.3, 0.45], [-0.3, -0.42], [0.3, -0.42]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.1, 0.11, 0.55), tan); leg.position.set(lx, 0.28, lz); leg.castShadow = true; g.add(leg); });
    const tail = new THREE.Mesh(G.cyl(0.045, 0.045, 0.9), tan); tail.position.set(0, 0.75, -0.85); tail.rotation.x = 0.9; g.add(tail);
    g.userData.head = head;
  } else if (type === 'giraffe') {
    const yel = M(0xe8c470);
    E(0.5, 1.1, 1, 1.5, yel, 0, 1.35, 0);
    [[0.2, 1.5, 0.3], [-0.25, 1.3, -0.3], [0.1, 1.2, -0.55]].forEach(([px, py, pz]) => E(0.13, 1, 0.8, 1, M(0xb08a40), px, py, pz));   // patches
    const neck = new THREE.Mesh(G.cyl(0.16, 0.2, 1.8), yel); neck.position.set(0, 2.5, 0.5); neck.rotation.x = -0.18; neck.castShadow = true; g.add(neck);
    const head = E(0.22, 1.1, 0.85, 1.25, yel, 0, 3.45, 0.75);
    [-1, 1].forEach(d => E(0.05, 1, 1.6, 1, M(0x8a6a3a), d * 0.1, 3.72, 0.68));
    [[-0.32, 0.5], [0.32, 0.5], [-0.32, -0.5], [0.32, -0.5]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.1, 0.12, 1.35), yel); leg.position.set(lx, 0.67, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head; g.userData.neck = neck;
  } else if (type === 'monkey') {
    const br = M(0x8a5a3a);
    E(0.26, 1, 1.1, 1, br, 0, 0.42, 0);
    const head = E(0.2, 1, 0.95, 0.95, br, 0, 0.82, 0.1);
    E(0.13, 1, 0.8, 0.5, M(0xd8b090), 0, 0.78, 0.26);
    [-1, 1].forEach(d => E(0.07, 1, 1, 0.5, br, d * 0.2, 0.9, 0.05));
    const tail = new THREE.Mesh(G.cyl(0.035, 0.035, 0.8), br); tail.position.set(0, 0.5, -0.35); tail.rotation.x = 1.1; g.add(tail);
    g.userData.head = head;
  } else if (type === 'penguin') {
    const bk = M(0x22262e), wh = M(0xf0f2f4);
    E(0.24, 1, 1.35, 1, bk, 0, 0.4, 0);
    E(0.17, 1, 1.15, 0.7, wh, 0, 0.38, 0.13);
    const head = E(0.15, 1, 1, 1, bk, 0, 0.82, 0.02);
    const beak = new THREE.Mesh(G.cone(0.05, 0.16, 8), M(0xe8a030, 0.6)); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.8, 0.2); g.add(beak);
    [-1, 1].forEach(d => E(0.08, 0.4, 1.1, 0.8, bk, d * 0.24, 0.42, 0));
    g.userData.head = head;
  } else if (type === 'bear') {
    const br = M(0x6a4a30);
    E(0.55, 1.25, 1.05, 1.5, br, 0, 0.78, 0);
    const head = E(0.36, 1, 0.95, 1, br, 0, 1.3, 0.6);
    [-1, 1].forEach(d => E(0.11, 1, 1, 0.6, br, d * 0.26, 1.58, 0.5));            // round ears
    E(0.14, 1, 0.8, 0.9, M(0xc8a070), 0, 1.22, 0.9);                              // muzzle
    [[-0.34, 0.42], [0.34, 0.42], [-0.34, -0.42], [0.34, -0.42]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.14, 0.16, 0.6), br); leg.position.set(lx, 0.3, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head;
  } else if (type === 'zebra') {
    const wh = M(0xeef0f2), bk = M(0x2a2c30);
    E(0.42, 1.1, 0.95, 1.5, wh, 0, 0.85, 0);
    for (let i = -2; i <= 2; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.5, 0.1), bk); st.position.set(0, 0.95, i * 0.24); st.rotation.x = 0.15 * i; st.castShadow = true; g.add(st); }   // stripes
    const neck = new THREE.Mesh(G.cyl(0.13, 0.17, 0.9), wh); neck.position.set(0, 1.45, 0.55); neck.rotation.x = -0.5; neck.castShadow = true; g.add(neck);
    const head = E(0.19, 1, 0.85, 1.3, wh, 0, 1.85, 0.85);
    E(0.1, 1, 0.7, 0.9, bk, 0, 1.78, 1.05);                                       // dark muzzle
    [-1, 1].forEach(d => E(0.06, 1, 1.6, 0.6, bk, d * 0.1, 2.05, 0.75));
    [[-0.28, 0.45], [0.28, 0.45], [-0.28, -0.45], [0.28, -0.45]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.08, 0.1, 0.85), wh); leg.position.set(lx, 0.42, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head;
  } else if (type === 'flamingo') {
    const pk = M(0xf090a8);
    E(0.22, 1.2, 1, 1.3, pk, 0, 1.05, 0);                                          // body
    const leg = new THREE.Mesh(G.cyl(0.025, 0.025, 1.0), M(0xd87088)); leg.position.set(0.05, 0.5, 0); leg.castShadow = true; g.add(leg);   // the famous single leg
    const neck = new THREE.Mesh(G.cyl(0.045, 0.055, 0.85), pk); neck.position.set(0, 1.6, 0.22); neck.rotation.x = -0.35; neck.castShadow = true; g.add(neck);
    const head = E(0.1, 1, 1, 1.1, pk, 0, 2.02, 0.42);
    const beak = new THREE.Mesh(G.cone(0.045, 0.2, 8), M(0x2a2c30, 0.6)); beak.rotation.x = Math.PI / 2 + 0.5; beak.position.set(0, 1.96, 0.55); g.add(beak);
    g.userData.head = head; g.userData.neck = neck;
  } else {   // tortoise — the free-roaming zoo mascot
    const sh = M(0x5a7a4a), sk = M(0xa8b078);
    const shell = E(0.34, 1.2, 0.75, 1.4, sh, 0, 0.34, 0);
    E(0.28, 1.1, 0.55, 1.25, M(0x486a3c), 0, 0.5, 0);
    const head = E(0.12, 1, 0.9, 1.15, sk, 0, 0.34, 0.52);
    [[-0.26, 0.3], [0.26, 0.3], [-0.26, -0.3], [0.26, -0.3]].forEach(([lx, lz]) => E(0.09, 1, 0.7, 1, sk, lx, 0.14, lz));
    g.userData.head = head;
  }
  return g;
}

// ── The zoo compound — everything lives in the WORLD, behind a real closed gate ──
let _zooGateColl = null, _zooDoors = [], _zooGateOpen = false;
function buildZoo() {
  const wallM = pbr(0x8a6a4a, 0.9), postM = pbr(0x6a4a30, 0.9);
  const wall = (x0, z0, x1, z1) => {
    const w = Math.max(Math.abs(x1 - x0), 0.4), d = Math.max(Math.abs(z1 - z0), 0.4);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1.8, d), wallM);
    m.position.set((x0 + x1) / 2, 0.9, (z0 + z1) / 2); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    worldColliders.push({ type: 'box', x0: Math.min(x0, x1) - 0.2, x1: Math.max(x0, x1) + 0.2, z0: Math.min(z0, z1) - 0.2, z1: Math.max(z0, z1) + 0.2 });
  };
  wall(ZOO.x0, ZOO.z0, ZOO.x1, ZOO.z0);
  wall(ZOO.x0, ZOO.z1, ZOO.x1, ZOO.z1);
  wall(ZOO.x1, ZOO.z0, ZOO.x1, ZOO.z1);
  wall(ZOO.x0, ZOO.z0, ZOO.x0, -3.2);
  wall(ZOO.x0, 3.2, ZOO.x0, ZOO.z1);
  // the gate: real double doors, CLOSED until a ticket opens them
  [-1, 1].forEach(s => {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.6, 3.0), pbr(0x7a4a26, 0.8));
    door.position.set(ZOO.gateX, 1.3, s * 1.6);
    door.castShadow = true; scene.add(door);
    _zooDoors.push({ mesh: door, closedZ: s * 1.6, openZ: s * 4.6 });   // doors slide behind the walls
  });
  _zooGateColl = { type: 'box', x0: ZOO.gateX - 0.4, x1: ZOO.gateX + 0.4, z0: -3.2, z1: 3.2 };
  worldColliders.push(_zooGateColl);
  [-3.2, 3.2].forEach(gz => { const p = new THREE.Mesh(G.cyl(0.28, 0.34, 4.4), postM); p.position.set(ZOO.gateX, 2.2, gz); p.castShadow = true; scene.add(p); });
  const arch = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 7.6), postM); arch.position.set(ZOO.gateX, 4.6, 0); arch.castShadow = true; scene.add(arch);
  if (typeof makeTextSign === 'function') {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.3, 6.8), new THREE.MeshStandardMaterial({ map: makeTextSign('🦁 TOWN ZOO', '#7a3a1a', '#ffe9c0', 420, 80), roughness: 0.6, emissive: 0x1c0e06, emissiveIntensity: 0.4 }));
    sign.rotation.y = -Math.PI / 2;
    sign.position.set(ZOO.gateX - 0.5, 3.6, 0); scene.add(sign);
  }
  // the ticket booth (outside, by the gate)
  const booth = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 2.2), pbr(0xa85a3a, 0.85)); body.position.y = 1.3; booth.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.0, 4), pbr(0xe8c060, 0.8)); roof.position.y = 3.1; roof.rotation.y = Math.PI / 4; booth.add(roof);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 1.3), pbr(0x2a1c12, 0.4)); win.position.set(-1.11, 1.5, 0); booth.add(win);
  if (typeof makeTextSign === 'function') {
    const bs = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 2.0), new THREE.MeshStandardMaterial({ map: makeTextSign('🎫 TICKETS 10🪙', '#3a2a14', '#ffe9c0', 300, 56), roughness: 0.6 }));
    bs.position.set(-1.16, 2.35, 0); booth.add(bs);
  }
  booth.position.set(ZOO.gateX + 1.6, 0, -6.4);
  booth.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  scene.add(booth);
  worldColliders.push({ type: 'box', x0: ZOO.gateX + 0.4, x1: ZOO.gateX + 2.8, z0: -7.6, z1: -5.2 });
  // Zita the keeper stands by her booth
  const zc = (typeof NEIGHBOURS !== 'undefined' && NEIGHBOURS['Zita']) || { skin: 0xc89468, hair: 0x241a10, hairStyle: 'bun', shirt: 0x8a7a4a, pants: 0x5a5236 };
  const zk = buildHuman(zc);
  zk.group.position.set(ZOO.gateX + 3.4, 0, -6.4); zk.group.rotation.y = -Math.PI / 2;
  scene.add(zk.group);
  state.zooKeeper = { group: zk.group, parts: zk.parts, phase: Math.random() * 6 };

  // ── the pens & their residents — INSIDE the compound, visible through the gate ──
  state.zooAnimals = [];
  const penFence = pbr(0x7a5a3a, 0.9);
  const pen = (cx, cz, w, d, label, kinds, floorCol) => {
    [[cx - w / 2, cz, 0.16, d], [cx + w / 2, cz, 0.16, d], [cx, cz - d / 2, w, 0.16], [cx, cz + d / 2, w, 0.16]].forEach(([fx, fz, fw, fd]) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(fw, 1.0, fd), penFence); f.position.set(fx, 0.5, fz); f.castShadow = true; scene.add(f);
      worldColliders.push({ type: 'box', x0: fx - fw / 2 - 0.1, x1: fx + fw / 2 + 0.1, z0: fz - fd / 2 - 0.1, z1: fz + fd / 2 + 0.1 });
    });
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, d - 0.4), pbr(floorCol || 0xa8d088, 0.95));
    lawn.rotation.x = -Math.PI / 2; lawn.position.set(cx, 0.05, cz); lawn.receiveShadow = true; scene.add(lawn);
    if (typeof makeTextSign === 'function') {
      const sg = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.55, 0.08), new THREE.MeshStandardMaterial({ map: makeTextSign(label, '#3a2a14', '#ffe9c0', 280, 50), roughness: 0.7 }));
      sg.position.set(cx, 1.4, cz + (cz < 0 ? d / 2 : -d / 2) + (cz < 0 ? 0.06 : -0.06)); scene.add(sg);   // signs face the central path
    }
    kinds.forEach((k, i) => {
      const a = zooAnimal(k);
      a.position.set(cx - w / 2 + 1.6 + (i % 3) * ((w - 3.2) / 2), 0, cz - d / 2 + 1.6 + Math.floor(i / 3) * (d - 3.2));
      a.rotation.y = Math.random() * 6.28;
      scene.add(a);
      state.zooAnimals.push({ group: a, type: k, phase: Math.random() * 6, home: { x: a.position.x, z: a.position.z } });
    });
  };
  // north row (z 5..22) and south row (z -22..-5), path along z ±4 and the crossway
  pen(113, 14, 12, 15, '🐘 ELEPHANTS', ['elephant', 'elephant']);
  pen(127, 14, 12, 15, '🦁 LIONS', ['lion', 'lion']);
  pen(142, 14, 13, 15, '🦒 GIRAFFES', ['giraffe', 'giraffe']);
  pen(113, -14, 12, 15, '🐻 BEARS', ['bear', 'bear']);
  pen(127, -14, 12, 15, '🦓 ZEBRAS', ['zebra', 'zebra']);
  pen(142, -14, 13, 15, '🐒 MONKEYS', ['monkey', 'monkey', 'monkey']);
  pen(146.5, 2.5, 6, 6, '🐧 PENGUINS', ['penguin', 'penguin', 'penguin'], 0xcfe4ec);
  pen(138, 2.5, 8, 6, '🦩 FLAMINGOS', ['flamingo', 'flamingo', 'flamingo'], 0x9ec8d8);
  // Sheldon the tortoise roams the main path, free as anything
  const tort = zooAnimal('tortoise');
  tort.position.set(118, 0, 0); scene.add(tort);
  state.zooAnimals.push({ group: tort, type: 'tortoise', phase: 0, roam: true, dir: 0, home: { x: 118, z: 0 } });
  state.zooVisitors = [];
}

// ── The gate: tickets open it; it closes behind you ──
function zooPassValid() { return state.zooPassDay === (state.dayCount || 0); }
function setZooGate(open) {
  _zooGateOpen = open;
  _zooDoors.forEach(d => { d.mesh.position.z = open ? d.openZ : d.closedZ; });
  const i = worldColliders.indexOf(_zooGateColl);
  if (open && i >= 0) worldColliders.splice(i, 1);
  if (!open && i < 0 && _zooGateColl) worldColliders.push(_zooGateColl);
}
function zooGateAction() {
  if (_zooGateOpen) { setZooGate(false); showNotif('🚪 The zoo gate swings shut.'); if (typeof sfx === 'function') sfx('door'); return; }
  if (state.zooShift || zooPassValid()) {
    setZooGate(true);
    if (typeof sfx === 'function') sfx('door');
    showNotif(state.zooShift ? '🎫 Staff entrance — in you go!' : '🎫 Day pass — welcome back in!');
    return;
  }
  if (state.coins < ZOO_TICKET) { showNotif('🎫 A zoo ticket is ' + ZOO_TICKET + ' 🪙 — earn a little more first!'); if (typeof sfx === 'function') sfx('sad'); return; }
  state.coins -= ZOO_TICKET;
  document.getElementById('coin-count').textContent = state.coins;
  state.zooPassDay = state.dayCount || 0;
  setZooGate(true);
  if (typeof sfx === 'function') sfx('sell');
  showNotif('🎫 One ticket — a DAY PASS! The gate is open, enjoy the zoo.');
  if (!state._seenZoo) { state._seenZoo = true; showDialogue('🦁 Town Zoo', 'Welcome in! Mind the lions, don\'t feed the monkeys, and Sheldon the tortoise owns the path. 🐢', 5600); }
}

// ── Working the booth: REAL visitors with BIG clear thought bubbles ──
function makeThoughtSprite(want) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(255,253,247,0.97)';
  g.beginPath(); g.roundRect ? g.roundRect(4, 4, 248, 96, 22) : g.rect(4, 4, 248, 96); g.fill();
  g.strokeStyle = '#c8a86a'; g.lineWidth = 5; g.stroke();
  g.beginPath(); g.arc(46, 112, 9, 0, 7); g.fillStyle = 'rgba(255,253,247,0.97)'; g.fill(); g.stroke();
  g.font = '54px Georgia'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(want.e, 52, 52);
  g.font = 'bold 40px Georgia'; g.fillStyle = '#4a3218';
  g.fillText(want.name, 158, 54);
  const tex = new THREE.CanvasTexture(c);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  spr.scale.set(2.3, 1.15, 1);
  spr.position.y = 2.75;
  return spr;
}
const ZOO_TICKET_TYPES = [
  { id: 'adult', e: '🧑', name: 'ADULT' },
  { id: 'child', e: '🧒', name: 'CHILD' },
  { id: 'family', e: '👪', name: 'FAMILY' },
];
function toggleZooShift() {
  state.zooShift = !state.zooShift;
  if (state.zooShift) {
    state._zooSpawnT = 0.5;
    showNotif('🎫 You\'re on the booth! Visitors are coming — sell each one the ticket in their thought bubble.');
    if (typeof sfx === 'function') sfx('ui');
  } else {
    showNotif('🎫 Booth shift over — ' + (state._zooSold || 0) + ' tickets sold today. Zita takes back the stool.');
    (state.zooVisitors || []).forEach(v => { v.leaving = true; });
    if (typeof sfx === 'function') sfx('ui');
  }
}
function spawnZooVisitor() {
  const cfg = (typeof randomPersonCfg === 'function') ? randomPersonCfg() : { skin: 0xe2b48c, hair: 0x3a2a1c, shirt: 0x6a8ac0, pants: 0x3a3a4a };
  const { group, parts } = buildHuman(cfg);
  const want = ZOO_TICKET_TYPES[Math.floor(Math.random() * ZOO_TICKET_TYPES.length)];
  group.position.set(ZOO.gateX - 16 - Math.random() * 6, 0, -6.4 + (Math.random() - 0.5) * 6);
  scene.add(group);
  const spr = makeThoughtSprite(want); spr.visible = false; group.add(spr);
  state.zooVisitors.push({ group, parts, want, spr, wx: group.position.x, wz: group.position.z, phase: Math.random() * 6, state: 'queue' });
}
// queue spots in front of the booth window
function zooQueueSpot(i) { return { x: ZOO.gateX - 0.4 - i * 1.3, z: -6.4 }; }
function updateZooBooth(t) {
  const V = state.zooVisitors || [];
  if (state.zooShift) {
    state._zooSpawnT = (state._zooSpawnT || 0) - 0.016;
    const queued = V.filter(v => v.state === 'queue').length;
    if (state._zooSpawnT <= 0 && queued < 4) { spawnZooVisitor(); state._zooSpawnT = 5 + Math.random() * 5; }
    // shift auto-ends if you wander off the booth
    const d = Math.hypot(catGroup.position.x - (ZOO.gateX + 1.6), catGroup.position.z - (-6.4));
    if (d > 8) toggleZooShift();
  }
  for (let i = V.length - 1; i >= 0; i--) {
    const v = V[i];
    if (v.leaving) {                                             // walk off west & vanish
      v.spr.visible = false;
      if (walkToward(v, ZOO.gateX - 22, -8, 0.05)) { scene.remove(v.group); V.splice(i, 1); }
      continue;
    }
    if (v.state === 'enter') {                                   // a happy customer walks through the gate
      v.spr.visible = false;
      const inside = walkToward(v, ZOO.gateX + 4, 0, 0.045);
      if (inside) { scene.remove(v.group); V.splice(i, 1); }
      continue;
    }
    const qi = V.filter(o => o.state === 'queue' && V.indexOf(o) < i).length;
    const spot = zooQueueSpot(qi);
    const arrived = walkToward(v, spot.x, spot.z, 0.04);
    if (arrived) { v.group.rotation.y = Math.PI / 2; idleHuman(v, t); }
    v.spr.visible = qi === 0 && Math.hypot(v.wx - spot.x, v.wz - spot.z) < 0.6;   // the BIG clear bubble — front of the queue only
  }
}
function zooFrontVisitor() {
  return (state.zooVisitors || []).find(v => v.state === 'queue' &&
    Math.hypot(v.wx - zooQueueSpot(0).x, v.wz - zooQueueSpot(0).z) < 0.5);
}
function openZooServe() {
  const v = zooFrontVisitor(); if (!v) return;
  state.uiOpen = true; state._zooServing = v;
  let h = `<div class="zoo-want">${v.want.e}</div>`;
  h += `<div class="modal-sub" style="font-size:1rem">“One <b>${v.want.name}</b> ticket, please!”</div>`;
  h += `<div class="co-grid" style="grid-template-columns:repeat(3,1fr)">`;
  ZOO_TICKET_TYPES.forEach(tk => { h += `<button onclick="sellZooTicket('${tk.id}')">${tk.e}<small>${tk.name} 🎫</small></button>`; });
  h += `</div><button class="modal-close" onclick="closeCheckout()">Not now</button>`;
  document.getElementById('checkout-title').textContent = '🎫 Sell a ticket';
  document.getElementById('checkout-body').innerHTML = h;
  document.getElementById('checkout').classList.add('show');
}
function sellZooTicket(id) {
  const v = state._zooServing; state._zooServing = null;
  closeCheckout(); state.uiOpen = false;
  if (!v || v.state !== 'queue') return;
  if (id === v.want.id) {
    v.state = 'enter';
    state.coins += ZOO_SALE_PAY; state.earned = (state.earned || 0) + ZOO_SALE_PAY;
    state._zooSold = (state._zooSold || 0) + 1;
    document.getElementById('coin-count').textContent = state.coins;
    if (typeof sfx === 'function') sfx('sell');
    showNotif('🎫 Sold! +' + ZOO_SALE_PAY + ' 🪙 — they\'re heading in happy.');
    if (typeof schoolEvent === 'function') schoolEvent('minigame');   // counts as honest odd-job work
  } else {
    v.leaving = true;
    if (typeof sfx === 'function') sfx('sad');
    showNotif('💢 Wrong ticket! They stormed off. READ the thought bubble…');
  }
}

// ── per-frame zoo life (runs in the overworld loop) ──
function updateZooLife(t) {
  if (state.zooKeeper) idleHuman(state.zooKeeper, t);
  updateZooBooth(t);
  // the gate closes itself once you've wandered away from the zoo
  if (_zooGateOpen && Math.abs(catGroup.position.x - ZOO.gateX) > 10 && catGroup.position.x < ZOO.x0 - 6) setZooGate(false);
  (state.zooAnimals || []).forEach(a => {
    const g = a.group, ph = a.phase;
    g.position.y = Math.abs(Math.sin(t * 1.1 + ph)) * 0.02;
    const head = g.userData.head;
    if (head) { head.rotation.y = Math.sin(t * 0.7 + ph) * 0.3; head.rotation.x = Math.sin(t * 0.5 + ph * 2) * 0.08; }
    if (a.type === 'penguin') g.rotation.z = Math.sin(t * 2.2 + ph) * 0.08;
    if (a.type === 'elephant' && g.userData.trunk) g.userData.trunk.forEach((seg, i) => { seg.rotation.x = 0.5 + i * 0.12 + Math.sin(t * 1.4 + ph) * 0.1; });
    if ((a.type === 'giraffe' || a.type === 'flamingo') && g.userData.neck) g.userData.neck.rotation.x = (a.type === 'giraffe' ? -0.18 : -0.35) + Math.sin(t * 0.6 + ph) * 0.08;
    if (a.roam) {                                                // Sheldon patrols the path, slowly
      a.dir += (Math.random() - 0.5) * 0.02;
      const nx = g.position.x + Math.cos(a.dir) * 0.008, nz = g.position.z + Math.sin(a.dir) * 0.008;
      if (nx > ZOO.x0 + 3 && nx < ZOO.x1 - 3 && nz > -3 && nz < 3) { g.position.x = nx; g.position.z = nz; g.rotation.y = -a.dir + Math.PI / 2; }
      else a.dir += Math.PI / 2;
    } else if (!a._wanderT || t > a._wanderT) {                  // penned animals amble to a new corner now and then
      a._wanderT = t + 6 + Math.random() * 8;
      a._tx = a.home.x + (Math.random() - 0.5) * 3; a._tz = a.home.z + (Math.random() - 0.5) * 3;
    } else if (a._tx != null) {
      const dx = a._tx - g.position.x, dz = a._tz - g.position.z, d = Math.hypot(dx, dz);
      if (d > 0.1) {
        g.position.x += dx / d * 0.012; g.position.z += dz / d * 0.012;
        const want = Math.atan2(dx, dz);
        g.rotation.y += (((want - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.05;
      }
    }
  });
}
