// zoo.js — 🦁 THE FRONTIER: wild woods, the GRAND PARK, and the TOWN ZOO.
// The zoo is one real place in the world: a BIG walled compound (64×80) laid out as a
// hedge MAZE — 14 pens, 16 species, 34 animals that actually DO things (lions yawn,
// bears stand up, penguins belly-slide, crocs snap, peacocks fan their tails…), plus
// a restaurant and a gift shop inside. While you're in the zoo, the minimap becomes
// the ZOO's own map. Gate: closed doors, 10🪙 day pass — or work the ticket booth.

const GRAND_PARK = { x0: -45, x1: 45, z0: -130, z1: -72 };
const ZOO = { x0: 106, x1: 210, z0: -60, z1: 60, gateX: 106, gateZ: 0 };   // east of town, gate faces west — a SAFARI-scale estate
const ZOO_TICKET = 10, ZOO_SALE_PAY = 2, ZOO_MEAL = 8, ZOO_PLUSH = 15;
const WILD_KINDS = ['tree', 'tree', 'pine', 'blossom', 'oak', 'willow', 'autumn'];   // plain trees stay common

// ── The zoo layout as DATA — the world build and the zoo map both read it ──
const ZOO_PENS = [
  { x: 118, z: 50, w: 18, d: 16, label: '🐘 ELEPHANTS', kinds: ['elephant', 'elephant'] },
  { x: 140, z: 50, w: 16, d: 16, label: '🦒 GIRAFFES', kinds: ['giraffe', 'giraffe'] },
  { x: 160, z: 50, w: 16, d: 16, label: '🦘 KANGAROOS', kinds: ['kangaroo', 'kangaroo'] },
  { x: 180, z: 50, w: 16, d: 16, label: '🦓 ZEBRAS', kinds: ['zebra', 'zebra'] },
  { x: 200, z: 50, w: 16, d: 16, label: '🐫 CAMELS', kinds: ['camel', 'camel'], floor: 0xd8c088 },
  { x: 126, z: 28, w: 14, d: 12, label: '🐼 PANDAS', kinds: ['panda', 'panda'], floor: 0x9ec87c },
  { x: 146, z: 28, w: 14, d: 12, label: '🐒 MONKEYS', kinds: ['monkey', 'monkey', 'monkey'] },
  { x: 164, z: 28, w: 12, d: 12, label: '🦜 AVIARY', kinds: ['parrot', 'parrot', 'parrot'], floor: 0xb8d49a },
  { x: 182, z: 28, w: 16, d: 12, label: '🦌 DEER', kinds: ['deer', 'deer', 'deer'] },
  { x: 200, z: 28, w: 14, d: 12, label: '🦥 SLOTHS', kinds: ['sloth', 'sloth'], floor: 0x9ab87c },
  { x: 118, z: -50, w: 18, d: 16, label: '🦁 LIONS', kinds: ['lion', 'lion'], floor: 0xc8b070 },
  { x: 140, z: -50, w: 16, d: 16, label: '🐻 BEARS', kinds: ['bear', 'bear'] },
  { x: 160, z: -50, w: 16, d: 16, label: '🐺 WOLVES', kinds: ['wolf', 'wolf'], floor: 0x8aa06a },
  { x: 180, z: -50, w: 16, d: 16, label: '🐊 CROCS', kinds: ['croc', 'croc'], floor: 0x7ab8a0 },
  { x: 200, z: -50, w: 16, d: 16, label: '🦊 FOXES', kinds: ['fox', 'fox'], floor: 0xa8c088 },
  { x: 126, z: -28, w: 14, d: 12, label: '🦛 HIPPO POOL', kinds: ['hippo', 'hippo'], floor: 0x6fb6d8 },
  { x: 146, z: -28, w: 14, d: 12, label: '🐧 PENGUINS', kinds: ['penguin', 'penguin', 'penguin'], floor: 0xcfe4ec },
  { x: 164, z: -28, w: 12, d: 12, label: '🦩 FLAMINGOS', kinds: ['flamingo', 'flamingo', 'flamingo'], floor: 0x9ec8d8 },
  { x: 182, z: -28, w: 16, d: 12, label: '🦭 SEALS', kinds: ['seal', 'seal', 'seal'], floor: 0x8ac4dc },
  { x: 200, z: -28, w: 14, d: 12, label: '🐍 SNAKES', kinds: ['snake', 'snake'], floor: 0xd8c8a0 },
  { x: 112, z: 8, w: 8, d: 7, label: '🦔 HEDGEHOGS', kinds: ['hedgehog', 'hedgehog', 'hedgehog'], floor: 0xb0a878 },
];
const ZOO_BENCHES = [[124, 14, Math.PI], [142, -14, 0], [158, 14, Math.PI], [176, -14, 0], [194, 12, Math.PI], [194, -12, 0]];   // [x, z, faceRy] along the boulevards
const ZOO_HEDGES = [];   // the maze experiment is over — open boulevards, see everything
const ZOO_CAFE = { x: 181, z: 8 };      // 🍔 The Hungry Lion — the counter INSIDE the pavilion
const ZOO_GIFT = { x: 113, z: -8.5 };   // 🎁 the gift shop — the counter INSIDE

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
    { x0: -155, x1: -100, z0: -135, z1: 50, n: 26 },
    { x0: 100, x1: 210, z0: -135, z1: -68, n: 16 },
    { x0: 196, x1: 230, z0: -60, z1: 60, n: 0 },
    { x0: -95, x1: 95, z0: -135, z1: -58, n: 26 },
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
  const pondX = 0, pondZ = (P.z0 + P.z1) / 2;
  const shore = new THREE.Mesh(new THREE.CylinderGeometry(9.4, 9.4, 0.16, 36), pbr(0xc8b088, 0.9)); shore.position.set(pondX, 0.08, pondZ); shore.receiveShadow = true; scene.add(shore);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(8.7, 8.7, 0.2, 36), pbr(0x5ab6d8, 0.25)); water.position.set(pondX, 0.18, pondZ); scene.add(water);
  worldColliders.push({ type: 'circle', x: pondX, z: pondZ, r: 8.9 });
  if (typeof addWater === 'function') addWater(pondX, pondZ, 9.2);
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

// ── The animals (procedural, cute-blob style) — 16 species ──
function zooAnimal(type) {
  const g = new THREE.Group();
  const M = (c, r = 0.85) => pbr(c, r);
  const E = (rad, sx, sy, sz, m, x, y, z) => { const me = new THREE.Mesh(G.sph(rad), m); me.scale.set(sx, sy, sz); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  if (type === 'elephant') {
    const gm = M(0x9aa0ac);
    E(0.7, 1.3, 1.05, 1.7, gm, 0, 0.95, 0);
    const head = E(0.48, 1, 1, 1, gm, 0, 1.35, 1.15);
    [-1, 1].forEach(d => E(0.34, 0.25, 1, 0.9, gm, d * 0.52, 1.45, 1.05));
    g.userData.trunk = [];
    for (let i = 0; i < 4; i++) { const seg = new THREE.Mesh(G.cyl(0.13 - i * 0.02, 0.11 - i * 0.02, 0.34), gm); seg.position.set(0, 1.06 - i * 0.3, 1.62 + i * 0.1); seg.rotation.x = 0.5 + i * 0.12; seg.castShadow = true; g.add(seg); g.userData.trunk.push(seg); }
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
    [[0.2, 1.5, 0.3], [-0.25, 1.3, -0.3], [0.1, 1.2, -0.55]].forEach(([px, py, pz]) => E(0.13, 1, 0.8, 1, M(0xb08a40), px, py, pz));
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
    [-1, 1].forEach(d => E(0.11, 1, 1, 0.6, br, d * 0.26, 1.58, 0.5));
    E(0.14, 1, 0.8, 0.9, M(0xc8a070), 0, 1.22, 0.9);
    [[-0.34, 0.42], [0.34, 0.42], [-0.34, -0.42], [0.34, -0.42]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.14, 0.16, 0.6), br); leg.position.set(lx, 0.3, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head;
  } else if (type === 'zebra') {
    const wh = M(0xeef0f2), bk = M(0x2a2c30);
    E(0.42, 1.1, 0.95, 1.5, wh, 0, 0.85, 0);
    for (let i = -2; i <= 2; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.5, 0.1), bk); st.position.set(0, 0.95, i * 0.24); st.rotation.x = 0.15 * i; st.castShadow = true; g.add(st); }
    const neck = new THREE.Mesh(G.cyl(0.13, 0.17, 0.9), wh); neck.position.set(0, 1.45, 0.55); neck.rotation.x = -0.5; neck.castShadow = true; g.add(neck);
    const head = E(0.19, 1, 0.85, 1.3, wh, 0, 1.85, 0.85);
    E(0.1, 1, 0.7, 0.9, bk, 0, 1.78, 1.05);
    [-1, 1].forEach(d => E(0.06, 1, 1.6, 0.6, bk, d * 0.1, 2.05, 0.75));
    [[-0.28, 0.45], [0.28, 0.45], [-0.28, -0.45], [0.28, -0.45]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.08, 0.1, 0.85), wh); leg.position.set(lx, 0.42, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head; g.userData.neck = neck;
  } else if (type === 'flamingo') {
    const pk = M(0xf090a8);
    E(0.22, 1.2, 1, 1.3, pk, 0, 1.05, 0);
    const leg = new THREE.Mesh(G.cyl(0.025, 0.025, 1.0), M(0xd87088)); leg.position.set(0.05, 0.5, 0); leg.castShadow = true; g.add(leg);
    const neck = new THREE.Mesh(G.cyl(0.045, 0.055, 0.85), pk); neck.position.set(0, 1.6, 0.22); neck.rotation.x = -0.35; neck.castShadow = true; g.add(neck);
    const head = E(0.1, 1, 1, 1.1, pk, 0, 2.02, 0.42);
    const beak = new THREE.Mesh(G.cone(0.045, 0.2, 8), M(0x2a2c30, 0.6)); beak.rotation.x = Math.PI / 2 + 0.5; beak.position.set(0, 1.96, 0.55); g.add(beak);
    g.userData.head = head; g.userData.neck = neck;
  } else if (type === 'croc') {
    const gr = M(0x5a8a4a);
    E(0.32, 1.4, 0.55, 2.4, gr, 0, 0.3, 0);                                        // long low body
    const snout = E(0.16, 1.2, 0.5, 2.0, gr, 0, 0.28, 1.05);                       // upper snout
    const jaw = new THREE.Mesh(G.sph(0.14), M(0x4a7a3c)); jaw.scale.set(1.15, 0.35, 1.9); jaw.position.set(0, 0.17, 1.05); jaw.castShadow = true; g.add(jaw);
    [-1, 1].forEach(d => E(0.06, 1, 1, 1, M(0xe8e070, 0.5), d * 0.12, 0.48, 0.62));   // watchful eyes
    const tail = E(0.16, 1, 0.6, 1.8, gr, 0, 0.26, -1.15);
    for (let i = -3; i <= 3; i++) E(0.05, 1, 1.4, 1, M(0x486a3c), 0, 0.52, i * 0.26); // back ridges
    [[-0.34, 0.5], [0.34, 0.5], [-0.34, -0.5], [0.34, -0.5]].forEach(([lx, lz]) => E(0.09, 1, 0.6, 1, gr, lx, 0.12, lz));
    g.userData.head = snout; g.userData.jaw = jaw; g.userData.tail = tail;
  } else if (type === 'hippo') {
    const hp = M(0x8a7a8c);
    E(0.62, 1.3, 0.95, 1.6, hp, 0, 0.62, 0);
    const head = E(0.4, 1.1, 0.85, 1.1, hp, 0, 0.85, 0.95);
    E(0.3, 1.2, 0.7, 1.0, M(0x9a8a9c), 0, 0.68, 1.3);                              // the great muzzle
    [-1, 1].forEach(d => E(0.07, 1, 1, 0.7, hp, d * 0.28, 1.18, 0.8));             // little ears
    [-1, 1].forEach(d => E(0.05, 1, 1, 1, M(0x2a2c30, 0.4), d * 0.18, 1.05, 1.15));
    [[-0.4, 0.45], [0.4, 0.45], [-0.4, -0.45], [0.4, -0.45]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.15, 0.17, 0.5), hp); leg.position.set(lx, 0.25, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head;
  } else if (type === 'panda') {
    const wh = M(0xf0f0ec), bk = M(0x2a2c30);
    E(0.45, 1.15, 1.0, 1.35, wh, 0, 0.62, 0);
    const head = E(0.32, 1, 0.95, 0.95, wh, 0, 1.15, 0.42);
    [-1, 1].forEach(d => E(0.1, 1, 1, 0.6, bk, d * 0.24, 1.42, 0.36));             // black ears
    [-1, 1].forEach(d => E(0.09, 1, 1.2, 0.5, bk, d * 0.13, 1.18, 0.68));          // eye patches
    E(0.05, 1, 0.8, 1, bk, 0, 1.06, 0.72);                                          // nose
    [[-0.3, 0.4], [0.3, 0.4], [-0.3, -0.4], [0.3, -0.4]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.12, 0.14, 0.5), bk); leg.position.set(lx, 0.25, lz); leg.castShadow = true; g.add(leg); });
    E(0.3, 1.1, 0.5, 0.7, bk, 0, 0.92, 0.1);                                        // the black shoulder band
    g.userData.head = head;
  } else if (type === 'kangaroo') {
    const rd = M(0xb8845a);
    const body = E(0.34, 1, 1.5, 1.05, rd, 0, 0.85, 0);                             // upright body
    const head = E(0.2, 1, 1.05, 1.2, rd, 0, 1.62, 0.18);
    [-1, 1].forEach(d => E(0.07, 1, 1.9, 0.6, rd, d * 0.12, 1.92, 0.05));           // tall ears
    [-1, 1].forEach(d => E(0.09, 0.5, 1.3, 0.6, rd, d * 0.3, 0.55, 0.05));          // mighty thighs
    [-1, 1].forEach(d => E(0.09, 0.6, 0.35, 1.8, rd, d * 0.26, 0.12, 0.28));        // long feet
    [-1, 1].forEach(d => E(0.05, 0.6, 1.1, 0.6, rd, d * 0.2, 1.15, 0.3));           // little arms
    const tail = E(0.13, 1, 0.7, 2.2, rd, 0, 0.3, -0.75);                            // thick tail
    g.userData.head = head; g.userData.tail = tail; g.userData.body = body;
  } else if (type === 'wolf') {
    const gy = M(0x8a8f96);
    E(0.34, 1.1, 0.9, 1.55, gy, 0, 0.62, 0);
    const head = E(0.22, 1, 0.9, 1.1, gy, 0, 0.98, 0.62);
    E(0.1, 1, 0.7, 1.4, M(0xa8adb4), 0, 0.9, 0.85);                                 // snout
    [-1, 1].forEach(d => E(0.07, 0.7, 1.5, 0.6, gy, d * 0.14, 1.24, 0.52));         // pointy ears
    const tail = E(0.11, 0.8, 0.8, 1.9, M(0x7a7f86), 0, 0.55, -0.85);               // bushy tail
    [[-0.24, 0.42], [0.24, 0.42], [-0.24, -0.42], [0.24, -0.42]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.07, 0.08, 0.6), gy); leg.position.set(lx, 0.3, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head; g.userData.tail = tail;
  } else if (type === 'parrot') {
    const rd = M(0xd84a3a), bl = M(0x3a6ad0), yl = M(0xe8c040);
    E(0.14, 1, 1.35, 1, rd, 0, 0.9, 0);
    const head = E(0.1, 1, 1, 1, rd, 0, 1.18, 0.06);
    const beak = new THREE.Mesh(G.cone(0.04, 0.12, 8), M(0x3a3a40, 0.5)); beak.rotation.x = Math.PI / 2 + 0.3; beak.position.set(0, 1.16, 0.16); g.add(beak);
    [-1, 1].forEach(d => E(0.07, 0.4, 1.1, 0.8, bl, d * 0.13, 0.9, -0.02));         // blue wings
    E(0.05, 0.8, 1.8, 0.6, yl, 0, 0.62, -0.16);                                     // yellow tail feathers
    const perch = new THREE.Mesh(G.cyl(0.03, 0.03, 0.7), M(0x6a4a30)); perch.rotation.z = Math.PI / 2; perch.position.set(0, 0.7, 0); g.add(perch);
    const post = new THREE.Mesh(G.cyl(0.05, 0.06, 0.72), M(0x6a4a30)); post.position.set(0, 0.35, 0); g.add(post);
    g.userData.head = head;
  } else if (type === 'peacock') {
    const bl = M(0x2a5ab0);
    E(0.2, 1, 1.15, 1.2, bl, 0, 0.62, 0);
    const neck = new THREE.Mesh(G.cyl(0.05, 0.07, 0.55), bl); neck.position.set(0, 1.0, 0.16); neck.rotation.x = -0.2; neck.castShadow = true; g.add(neck);
    const head = E(0.09, 1, 1, 1.1, bl, 0, 1.3, 0.26);
    [-0.04, 0, 0.04].forEach(dx => E(0.025, 1, 1, 1, M(0x48c890, 0.5), dx, 1.48, 0.24));   // crest
    const fan = new THREE.Group();                                                   // THE fan
    for (let i = -3; i <= 3; i++) {
      const f = new THREE.Mesh(G.sph(0.16), M(i % 2 ? 0x3a9a6a : 0x2a6ad0, 0.7));
      f.scale.set(0.5, 2.2, 0.12);
      const a = i * 0.28;
      f.position.set(Math.sin(a) * 0.55, 0.55, -0.1 - Math.abs(i) * 0.015);
      f.rotation.z = -a;
      f.castShadow = true; fan.add(f);
    }
    fan.position.set(0, 0.5, -0.25); fan.scale.set(0.25, 0.25, 0.25);                // furled until the show
    g.add(fan);
    [[-0.09, 0], [0.09, 0]].forEach(([lx]) => { const leg = new THREE.Mesh(G.cyl(0.022, 0.022, 0.5), M(0x8a7a4a)); leg.position.set(lx, 0.25, 0.05); g.add(leg); });
    g.userData.head = head; g.userData.fan = fan;
  } else if (type === 'fox') {
    const or = M(0xd87838), wh = M(0xf0e8dc), bk = M(0x2a2c30);
    E(0.3, 1.1, 0.9, 1.5, or, 0, 0.52, 0);
    E(0.2, 1, 0.85, 0.9, wh, 0, 0.42, 0.4);                                        // white chest
    const head = E(0.2, 1, 0.9, 1.15, or, 0, 0.88, 0.55);
    E(0.09, 1, 0.7, 1.4, wh, 0, 0.8, 0.78);                                        // white snout
    [-1, 1].forEach(d => E(0.07, 0.7, 1.6, 0.5, or, d * 0.13, 1.14, 0.45));        // big ears
    const tail = E(0.12, 0.9, 0.9, 2.1, or, 0, 0.5, -0.75);
    E(0.07, 1, 1, 1, wh, 0, 0.5, -1.05);                                           // white tail tip
    [[-0.2, 0.36], [0.2, 0.36], [-0.2, -0.36], [0.2, -0.36]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.055, 0.065, 0.5), bk); leg.position.set(lx, 0.25, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head; g.userData.tail = tail;
  } else if (type === 'deer') {
    const tn = M(0xc09a6a);
    E(0.34, 1.05, 0.9, 1.45, tn, 0, 0.92, 0);
    [[0.15, 1.0, -0.2], [-0.18, 0.95, 0.15], [0.05, 1.05, 0.35]].forEach(([px, py, pz]) => E(0.05, 1, 1, 1, M(0xf0e8d8), px, py, pz));   // white dapples
    const neck = new THREE.Mesh(G.cyl(0.1, 0.13, 0.8), tn); neck.position.set(0, 1.45, 0.5); neck.rotation.x = -0.4; neck.castShadow = true; g.add(neck);
    const head = E(0.16, 1, 0.85, 1.25, tn, 0, 1.85, 0.72);
    [-1, 1].forEach(d => E(0.06, 0.6, 1.3, 0.5, tn, d * 0.12, 2.05, 0.62));        // ears
    [-1, 1].forEach(d => {                                                          // antlers
      const a1 = new THREE.Mesh(G.cyl(0.02, 0.03, 0.5), M(0x8a6a4a)); a1.position.set(d * 0.1, 2.25, 0.6); a1.rotation.z = d * 0.5; a1.castShadow = true; g.add(a1);
      const a2 = new THREE.Mesh(G.cyl(0.015, 0.02, 0.3), M(0x8a6a4a)); a2.position.set(d * 0.24, 2.4, 0.6); a2.rotation.z = d * 1.1; g.add(a2);
    });
    [[-0.22, 0.42], [0.22, 0.42], [-0.22, -0.42], [0.22, -0.42]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.05, 0.06, 0.9), tn); leg.position.set(lx, 0.45, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head; g.userData.neck = neck;
  } else if (type === 'camel') {
    const cm = M(0xd8b070);
    E(0.44, 1.15, 0.9, 1.6, cm, 0, 1.1, 0);
    E(0.24, 1, 1.2, 1, cm, 0, 1.6, -0.35);                                          // hump one
    E(0.24, 1, 1.2, 1, cm, 0, 1.6, 0.25);                                           // hump two
    const neck = new THREE.Mesh(G.cyl(0.13, 0.17, 1.0), cm); neck.position.set(0, 1.75, 0.72); neck.rotation.x = -0.35; neck.castShadow = true; g.add(neck);
    const head = E(0.17, 1, 0.85, 1.35, cm, 0, 2.25, 0.95);
    [-1, 1].forEach(d => E(0.05, 1, 1.2, 0.6, cm, d * 0.11, 2.42, 0.85));
    [[-0.3, 0.5], [0.3, 0.5], [-0.3, -0.5], [0.3, -0.5]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.08, 0.1, 1.1), cm); leg.position.set(lx, 0.55, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head; g.userData.neck = neck;
  } else if (type === 'seal') {
    const sl = M(0x9aa4ae);
    const body = E(0.32, 1.05, 0.85, 1.9, sl, 0, 0.32, 0);                          // sleek sausage
    const head = E(0.2, 1, 0.9, 1, sl, 0, 0.55, 0.62);
    E(0.03, 1, 1, 1, M(0x2a2c30, 0.4), 0, 0.58, 0.82);                              // nose
    [-1, 1].forEach(d => E(0.11, 0.5, 0.3, 1.3, sl, d * 0.3, 0.2, 0.25));           // fore flippers
    E(0.13, 1.3, 0.3, 0.8, sl, 0, 0.24, -0.75);                                     // tail flipper
    g.userData.head = head; g.userData.body = body;
  } else if (type === 'snake') {
    const sn = M(0x6a9a4a), sd = M(0x557a3c);
    g.userData.coils = [];
    for (let i = 0; i < 7; i++) {                                                    // a coiled body
      const a = i * 0.9;
      const c2 = E(0.11 - i * 0.008, 1, 0.9, 1, i % 2 ? sd : sn, Math.cos(a) * (0.32 - i * 0.02), 0.1, Math.sin(a) * (0.32 - i * 0.02));
      g.userData.coils.push(c2);
    }
    const head = E(0.1, 1.1, 0.8, 1.3, sn, 0.34, 0.28, 0);                           // head raised off the coil
    [-1, 1].forEach(d => E(0.02, 1, 1, 1, M(0xe8c030, 0.4), 0.4, 0.32, d * 0.05));   // eyes
    g.userData.head = head;
  } else if (type === 'sloth') {
    const st = M(0x9a8a6a);
    const bar = new THREE.Mesh(G.cyl(0.05, 0.05, 1.6), M(0x6a4a30)); bar.rotation.z = Math.PI / 2; bar.position.set(0, 1.7, 0); bar.castShadow = true; g.add(bar);
    [[-0.7], [0.7]].forEach(([px]) => { const post = new THREE.Mesh(G.cyl(0.07, 0.09, 1.7), M(0x6a4a30)); post.position.set(px, 0.85, 0); post.castShadow = true; g.add(post); });
    const body = E(0.26, 1, 1.35, 0.9, st, 0, 1.15, 0);                              // hanging body
    const head = E(0.17, 1, 0.9, 0.95, st, 0, 0.82, 0.05);                           // head hangs LOW
    E(0.1, 1, 0.75, 0.6, M(0xc8b890), 0, 0.8, 0.18);                                 // pale face
    [-1, 1].forEach(d => { const arm = new THREE.Mesh(G.cyl(0.05, 0.06, 0.7), st); arm.position.set(d * 0.18, 1.5, 0); arm.rotation.z = d * 0.25; arm.castShadow = true; g.add(arm); });
    g.userData.head = head; g.userData.body = body; g.userData.hangs = true;
  } else if (type === 'hedgehog') {
    const br = M(0x8a6a4a), spikeM = M(0x5a4630);
    E(0.16, 1.2, 0.85, 1.35, br, 0, 0.16, 0);                                       // little body
    const head = E(0.09, 1, 0.85, 1.3, M(0xc8a888), 0, 0.14, 0.24);                 // pale snoot
    E(0.02, 1, 1, 1, M(0x2a2c30, 0.4), 0, 0.15, 0.36);                              // nose
    g.userData.spikes = [];
    for (let i = 0; i < 9; i++) {                                                   // the spikes
      const sp = new THREE.Mesh(G.cone(0.045, 0.16, 6), spikeM);
      const a = (i / 9) * Math.PI * 2;
      sp.position.set(Math.cos(a) * 0.1, 0.26 + (i % 3) * 0.02, -0.02 + Math.sin(a) * 0.12);
      sp.rotation.x = -0.4 + Math.sin(a) * 0.4; sp.rotation.z = Math.cos(a) * 0.5;
      sp.castShadow = true; g.add(sp); g.userData.spikes.push(sp);
    }
    g.userData.head = head;
  } else {   // tortoise — Sheldon, who owns the path
    const sh = M(0x5a7a4a), sk = M(0xa8b078);
    E(0.34, 1.2, 0.75, 1.4, sh, 0, 0.34, 0);
    E(0.28, 1.1, 0.55, 1.25, M(0x486a3c), 0, 0.5, 0);
    const head = E(0.12, 1, 0.9, 1.15, sk, 0, 0.34, 0.52);
    [[-0.26, 0.3], [0.26, 0.3], [-0.26, -0.3], [0.26, -0.3]].forEach(([lx, lz]) => E(0.09, 1, 0.7, 1, sk, lx, 0.14, lz));
    g.userData.head = head;
  }
  return g;
}

// ── The zoo compound — a walled hedge-maze full of life ──
let _zooGateColl = null, _zooDoors = [], _zooGateOpen = false;
function buildZoo() {
  const wallM = pbr(0x8a6a4a, 0.9), postM = pbr(0x6a4a30, 0.9), hedgeM = pbr(0x4a7a3c, 0.95);
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
  // the maze hedges
  ZOO_HEDGES.forEach(([x0, z0, x1, z1]) => {
    const w = Math.max(Math.abs(x1 - x0), 0.8), d = Math.max(Math.abs(z1 - z0), 0.8);
    const h = new THREE.Mesh(new THREE.BoxGeometry(w, 3.4, d), hedgeM);   // taller than any camera angle
    h.position.set((x0 + x1) / 2, 1.7, (z0 + z1) / 2); h.castShadow = true; h.receiveShadow = true; scene.add(h);
    worldColliders.push({ type: 'box', x0: Math.min(x0, x1) - 0.3, x1: Math.max(x0, x1) + 0.3, z0: Math.min(z0, z1) - 0.3, z1: Math.max(z0, z1) + 0.3 });
  });
  // the gate: real double doors, CLOSED until a ticket opens them
  [-1, 1].forEach(s => {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.6, 3.0), pbr(0x7a4a26, 0.8));
    door.position.set(ZOO.gateX, 1.3, s * 1.6);
    door.castShadow = true; scene.add(door);
    _zooDoors.push({ mesh: door, closedZ: s * 1.6, openZ: s * 4.6 });
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
  const zc = (typeof NEIGHBOURS !== 'undefined' && NEIGHBOURS['Zita']) || { skin: 0xc89468, hair: 0x241a10, hairStyle: 'bun', shirt: 0x8a7a4a, pants: 0x5a5236 };
  const zk = buildHuman(zc);
  zk.group.position.set(ZOO.gateX + 3.4, 0, -6.4); zk.group.rotation.y = -Math.PI / 2;
  scene.add(zk.group);
  state.zooKeeper = { group: zk.group, parts: zk.parts, phase: Math.random() * 6 };

  // ── the pens (from ZOO_PENS data) ──
  state.zooAnimals = [];
  const penFence = pbr(0x7a5a3a, 0.9);
  ZOO_PENS.forEach(P => {
    const { x: cx, z: cz, w, d } = P;
    [[cx - w / 2, cz, 0.16, d], [cx + w / 2, cz, 0.16, d], [cx, cz - d / 2, w, 0.16], [cx, cz + d / 2, w, 0.16]].forEach(([fx, fz, fw, fd]) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(fw, 1.0, fd), penFence); f.position.set(fx, 0.5, fz); f.castShadow = true; scene.add(f);
      worldColliders.push({ type: 'box', x0: fx - fw / 2 - 0.1, x1: fx + fw / 2 + 0.1, z0: fz - fd / 2 - 0.1, z1: fz + fd / 2 + 0.1 });
    });
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, d - 0.4), pbr(P.floor || 0xa8d088, 0.95));
    lawn.rotation.x = -Math.PI / 2; lawn.position.set(cx, 0.05, cz); lawn.receiveShadow = true; scene.add(lawn);
    if (typeof makeTextSign === 'function') {
      const sg = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.55, 0.08), new THREE.MeshStandardMaterial({ map: makeTextSign(P.label, '#3a2a14', '#ffe9c0', 280, 50), roughness: 0.7 }));
      sg.position.set(cx, 1.4, cz + (cz < 0 ? d / 2 : -d / 2) + (cz < 0 ? 0.06 : -0.06)); scene.add(sg);
    }
    P.kinds.forEach((k, i) => {
      const a = zooAnimal(k);
      a.position.set(cx - w / 2 + 1.8 + (i % 3) * ((w - 3.6) / 2), 0, cz - d / 2 + 1.8 + Math.floor(i / 3) * (d - 3.6));
      a.rotation.y = Math.random() * 6.28;
      scene.add(a);
      state.zooAnimals.push({ group: a, type: k, phase: Math.random() * 6, home: { x: a.position.x, z: a.position.z }, pen: P });
    });
  });
  // the free-roamers: Sheldon the tortoise + Percy the peacock own the paths
  [['tortoise', 118, 0], ['peacock', 158, 2]].forEach(([k, x, z]) => {
    const a = zooAnimal(k);
    a.position.set(x, 0, z); scene.add(a);
    state.zooAnimals.push({ group: a, type: k, phase: Math.random() * 6, roam: true, dir: Math.random() * 6, home: { x, z } });
  });

  // ── 🍔 THE HUNGRY LION — an open-air pavilion you WALK INTO ──
  const cafeWall = pbr(0xe8d8b8, 0.9);
  const wallSeg = (x0, z0, x1, z1, m, hgt) => {
    const w = Math.max(Math.abs(x1 - x0), 0.3), d = Math.max(Math.abs(z1 - z0), 0.3);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(w, hgt || 2.4, d), m);
    seg.position.set((x0 + x1) / 2, (hgt || 2.4) / 2, (z0 + z1) / 2); seg.castShadow = true; seg.receiveShadow = true; scene.add(seg);
    worldColliders.push({ type: 'box', x0: Math.min(x0, x1) - 0.15, x1: Math.max(x0, x1) + 0.15, z0: Math.min(z0, z1) - 0.15, z1: Math.max(z0, z1) + 0.15 });
    return seg;
  };
  // pavilion shell x175..187, z3..11 — door gap on the south wall
  wallSeg(175, 3, 179, 3, cafeWall); wallSeg(183, 3, 187, 3, cafeWall);
  wallSeg(175, 11, 187, 11, cafeWall);
  wallSeg(175, 3, 175, 11, cafeWall); wallSeg(187, 3, 187, 11, cafeWall);
  // awning ring (open centre — the sky is the ceiling, and the camera sees in)
  [[181, 3, 12.6], [181, 11, 12.6]].forEach(([ax, az, aw]) => { const aw2 = new THREE.Mesh(new THREE.BoxGeometry(aw, 0.18, 1.6), pbr(0xc0563a, 0.8)); aw2.position.set(ax, 2.6, az); aw2.rotation.x = az > 7 ? -0.3 : 0.3; aw2.castShadow = true; scene.add(aw2); });
  [[175, 7], [187, 7]].forEach(([ax, az]) => { const aw2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 8.6), pbr(0xc0563a, 0.8)); aw2.position.set(ax, 2.6, az); aw2.rotation.z = ax > 181 ? 0.3 : -0.3; aw2.castShadow = true; scene.add(aw2); });
  if (typeof makeTextSign === 'function') {
    const cs = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.9, 0.14), new THREE.MeshStandardMaterial({ map: makeTextSign('🍔 THE HUNGRY LION', '#7a3a1a', '#ffe9c0', 400, 66), roughness: 0.6 }));
    cs.position.set(181, 2.9, 2.94); cs.castShadow = true; scene.add(cs);
  }
  // inside: the serving counter (north wall), the kitchen line behind it
  wallSeg(177.5, 8.6, 184.5, 8.6, pbr(0xb8bcc2, 0.5, 0.2), 1.0);
  const stove2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.0), pbr(0x8a8f98, 0.5, 0.3)); stove2.position.set(177.2, 0.6, 10.2); stove2.castShadow = true; scene.add(stove2);
  const fridge2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 1.0), pbr(0xdfe0e4, 0.55)); fridge2.position.set(185.2, 1.0, 10.2); fridge2.castShadow = true; scene.add(fridge2);
  // indoor tables + stools
  const ZOO_TABLES = [];
  [[178, 5.4], [184, 5.4]].forEach(([tx, tz]) => {
    const tab = new THREE.Mesh(G.cyl(0.7, 0.7, 0.08, 14), pbr(0xd8c8a8, 0.8)); tab.position.set(tx, 0.72, tz); tab.castShadow = true; scene.add(tab);
    const tleg = new THREE.Mesh(G.cyl(0.06, 0.08, 0.72), pbr(0x8a6a4a, 0.8)); tleg.position.set(tx, 0.36, tz); scene.add(tleg);
    worldColliders.push({ type: 'circle', x: tx, z: tz, r: 0.75 });
    ZOO_TABLES.push([tx + 1.1, tz]);
  });
  // parasol tables out front (south of the door)
  [[177.5, 0.8], [181, -0.4], [184.5, 1.0]].forEach(([tx, tz]) => {
    const tab = new THREE.Mesh(G.cyl(0.7, 0.7, 0.08, 14), pbr(0xd8c8a8, 0.8)); tab.position.set(tx, 0.72, tz); tab.castShadow = true; scene.add(tab);
    const tleg = new THREE.Mesh(G.cyl(0.06, 0.08, 0.72), pbr(0x8a6a4a, 0.8)); tleg.position.set(tx, 0.36, tz); scene.add(tleg);
    const pole = new THREE.Mesh(G.cyl(0.03, 0.03, 1.6), pbr(0x8a6a4a, 0.8)); pole.position.set(tx, 1.6, tz); scene.add(pole);
    const um = new THREE.Mesh(G.cone(1.0, 0.5, 8), pbr([0xd0563a, 0xe8c060, 0x5a9ad0][Math.floor(Math.random() * 3)], 0.8)); um.position.set(tx, 2.5, tz); um.castShadow = true; scene.add(um);
    worldColliders.push({ type: 'circle', x: tx, z: tz, r: 0.75 });
    ZOO_TABLES.push([tx + 1.1, tz]);
  });
  state.zooTables = ZOO_TABLES;
  const cook = buildHuman({ skin: 0xe0a878, hair: 0x3a2a1a, hairStyle: 'short', apron: true, apronColor: 0xf2f2f2, shirt: 0xc0563a, pants: 0x4a4030, height: 1.04, build: 'round', eye: 0x3a2a1a });
  cook.group.position.set(181, 0, 9.6); cook.group.rotation.y = Math.PI;
  scene.add(cook.group);
  state.zooCook = { group: cook.group, parts: cook.parts, phase: Math.random() * 6 };

  // ── 🎁 THE GIFT SHOP — a little pavilion you WALK INTO ──
  const giftWall = pbr(0xc8a0c8, 0.9);
  // shell x109..117, z -11.5..-4.5 — door gap on the north wall
  wallSeg(109, -4.5, 111.5, -4.5, giftWall); wallSeg(114.5, -4.5, 117, -4.5, giftWall);
  wallSeg(109, -11.5, 117, -11.5, giftWall);
  wallSeg(109, -11.5, 109, -4.5, giftWall); wallSeg(117, -11.5, 117, -4.5, giftWall);
  [[113, -4.5], [113, -11.5]].forEach(([ax, az]) => { const aw2 = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.18, 1.4), pbr(0x8a5a9a, 0.85)); aw2.position.set(ax, 2.55, az); aw2.rotation.x = az < -8 ? -0.3 : 0.3; aw2.castShadow = true; scene.add(aw2); });
  if (typeof makeTextSign === 'function') {
    const gs = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.7, 0.14), new THREE.MeshStandardMaterial({ map: makeTextSign('🎁 GIFT SHOP', '#5a2a6a', '#ffe9f0', 300, 56), roughness: 0.6 }));
    gs.position.set(113, 2.85, -4.44); gs.castShadow = true; scene.add(gs);
  }
  // inside: counter + plush-lined shelves
  wallSeg(111, -9.6, 115, -9.6, pbr(0xd8c0d8, 0.7), 1.0);
  [[109.8, -6.2], [116.2, -6.2], [109.8, -8.2], [116.2, -8.2]].forEach(([sx, sz], i) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 1.6), pbr(0x8a6a4a, 0.85)); shelf.position.set(sx, 0.6, sz); shelf.castShadow = true; scene.add(shelf);
    for (let k = 0; k < 3; k++) {
      const plush = new THREE.Mesh(G.sph(0.14, 12, 10), pbr([0xd8a860, 0xf090a8, 0x9aa0ac, 0x6a4a30][((i + k) % 4)], 0.9));
      plush.position.set(sx, 1.35 + 0.0, sz - 0.5 + k * 0.5); plush.castShadow = true; scene.add(plush);
    }
    worldColliders.push({ type: 'box', x0: sx - 0.5, x1: sx + 0.5, z0: sz - 0.85, z1: sz + 0.85 });
  });
  const clerk = buildHuman({ skin: 0xf0c8a0, hair: 0xd06a8a, hairStyle: 'long', shirt: 0x9a5aa8, pants: 0x4a3a52, height: 0.96, build: 'slim', eye: 0x3a5a3a });
  clerk.group.position.set(113, 0, -10.4);
  scene.add(clerk.group);
  state.zooClerk = { group: clerk.group, parts: clerk.parts, phase: Math.random() * 6 };

  // ── benches along the paths (the cat can rest; so do the visitors) ──
  ZOO_BENCHES.forEach(([bx, bz, ry]) => {
    const bench = new THREE.Group();
    const bm = pbr(0x9a7248, 0.85);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.6), bm); seat.position.y = 0.5; bench.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.12), bm); back.position.set(0, 0.78, -0.24); bench.add(back);
    [-0.85, 0.85].forEach(lx => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.5), bm); leg.position.set(lx, 0.25, 0); bench.add(leg); });
    bench.position.set(bx, 0, bz); bench.rotation.y = ry; bench.traverse(m => { if (m.isMesh) m.castShadow = true; }); scene.add(bench);
    if (typeof addProp === 'function') addProp({ kind: 'bench', group: bench, x: bx, z: bz, rotY: ry, movable: false, use: 'bench' });
  });

  // ── the visiting public: they wander, watch, photograph, snack and rest ──
  spawnZooCrowd();

  state.zooVisitors = [];

}

// ── The visiting public — 8 guests who live a little zoo day on loop ──
function spawnZooCrowd() {
  state.zooCrowd = [];
  for (let i = 0; i < 8; i++) {
    const cfg = (typeof randomPersonCfg === 'function') ? randomPersonCfg() : { skin: 0xe2b48c, hair: 0x3a2a1c, shirt: 0x6a8ac0, pants: 0x3a3a4a };
    const { group, parts } = buildHuman(cfg);
    group.position.set(112 + Math.random() * 8, 0, -2 + Math.random() * 4);   // scattered on the entrance plaza
    scene.add(group);
    const cam = (typeof makeCamera === 'function') ? makeCamera() : null;
    if (cam) { cam.visible = false; group.add(cam); }
    const burger = new THREE.Mesh(G.sph(0.09, 10, 8), pbr(0xc08a4a, 0.8));
    burger.position.set(0.32, 1.05, 0.3); burger.visible = false; group.add(burger);
    const v = { group, parts, cam, burger, wx: group.position.x, wz: group.position.z, phase: Math.random() * 6, mode: 'idle', timer: 2 + i * 1.5, photographer: Math.random() < 0.45 };
    state.zooCrowd.push(v);
  }
}
function zooPickOuting(v) {
  const r = Math.random();
  if (r < 0.55) {                                       // go watch a pen (prefer a nearby one)
    const near = ZOO_PENS.filter(P => Math.hypot(P.x - v.wx, P.z - v.wz) < 34);
    const P = (near.length ? near : ZOO_PENS)[Math.floor(Math.random() * (near.length ? near.length : ZOO_PENS.length))];
    v.pen = P;
    v.tx = P.x - P.w / 2 + 2 + Math.random() * (P.w - 4);
    v.tz = P.z > 0 ? P.z - P.d / 2 - 1.1 : P.z + P.d / 2 + 1.1;    // the path side of the fence
    v.faceRy = Math.atan2(P.x - v.tx, P.z - v.tz);
    v.next = 'watch';
  } else if (r < 0.75) {                                // rest on a bench
    const b = ZOO_BENCHES[Math.floor(Math.random() * ZOO_BENCHES.length)];
    v.bench = b;
    v.tx = b[0] + (Math.random() - 0.5); v.tz = b[1] + (b[2] === 0 ? 0.9 : -0.9);
    v.next = 'sit';
  } else {                                              // grab a bite at the Hungry Lion
    const tb = (state.zooTables && state.zooTables.length) ? state.zooTables[Math.floor(Math.random() * state.zooTables.length)] : [181, 5];
    v.tx = tb[0]; v.tz = tb[1];
    v.faceRy = Math.atan2((tb[0] - 1.1) - tb[0], 0) || -Math.PI / 2;
    v.next = 'eat';
  }
  v.mode = 'walk';
}
function updateZooCrowd(t) {
  (state.zooCrowd || []).forEach(v => {
    v.timer -= 0.016;
    if (v.mode === 'walk') {
      if (walkToward(v, v.tx, v.tz, 0.032)) {
        v.mode = v.next; v.timer = 7 + Math.random() * 9;
        if (v.mode === 'sit' && v.bench) {
          const h = v.group.scale.y || 1;
          v.group.position.set(v.bench[0] + (Math.random() - 0.5) * 0.7, 0.5 - 0.84 * h, v.bench[1]);
          v.wx = v.group.position.x; v.wz = v.group.position.z;
          v.group.rotation.y = v.bench[2];
          if (v.parts.legs) v.parts.legs.forEach(l => l.rotation.x = -1.5);
        } else if (v.faceRy != null) v.group.rotation.y = v.faceRy;
      }
      return;
    }
    if (v.mode === 'idle') { if (v.timer <= 0) zooPickOuting(v); idleHuman(v, t); return; }
    // in an activity
    if (v.mode !== 'sit') idleHuman(v, t);
    else if (v.parts.torso) v.parts.torso.scale.y = 1 + Math.sin(t * 1.8 + v.phase) * 0.02;   // seated breathing
    if (v.mode === 'watch') {
      v.group.rotation.y = v.faceRy;                                       // eyes on the animals
      if (v.photographer && v.cam) {
        v.cam.visible = true;
        if (!v._flashT || t > v._flashT) {                                  // 📸 a flash every few seconds
          v._flashT = t + 3 + Math.random() * 4;
          if (typeof doFlash === 'function') doFlash({ x: v.wx + Math.sin(v.faceRy) * 1.4, z: v.wz + Math.cos(v.faceRy) * 1.4 });
        }
      }
    } else if (v.mode === 'eat' && v.burger) {
      v.burger.visible = true;
      if (v.parts.arms && v.parts.arms[1]) v.parts.arms[1].rotation.x = -1.1 + Math.sin(t * 2.4 + v.phase) * 0.25;   // munch munch
    }
    if (v.timer <= 0) {                                                     // outing over — stand up, pack up, move on
      if (v.cam) v.cam.visible = false;
      if (v.burger) v.burger.visible = false;
      if (v.mode === 'sit') { v.group.position.y = 0; if (v.parts.legs) v.parts.legs.forEach(l => l.rotation.x = 0); }
      if (v.parts.arms) v.parts.arms.forEach(a => a.rotation.x = 0);
      v.mode = 'idle'; v.timer = 1 + Math.random() * 3;
    }
  });
}

// ── The gate: tickets open it; it closes behind you ──
function zooPassValid() { return state.zooPassDay === (state.dayCount || 0); }
function catInZoo() { const p = catGroup.position; return p.x > ZOO.x0 && p.x < ZOO.x1 && p.z > ZOO.z0 && p.z < ZOO.z1; }
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
  if (!state._seenZoo) { state._seenZoo = true; showDialogue('🦁 Town Zoo', 'Welcome in! The paths twist like a maze — check your map. Lunch at the Hungry Lion, souvenirs at the gift shop, and Sheldon owns the walkway. 🐢', 6400); }
}

// ── The restaurant & gift shop counters ──
function zooEatMeal() {
  if (state.coins < ZOO_MEAL) { showNotif('🍔 A zoo lunch is ' + ZOO_MEAL + ' 🪙…'); if (typeof sfx === 'function') sfx('sad'); return; }
  state.coins -= ZOO_MEAL;
  document.getElementById('coin-count').textContent = state.coins;
  state.needs.hunger = 100; state.needs.thirst = 100;
  if (typeof sfx === 'function') sfx('eat');
  _catHappyT = 1.6; if (typeof spawnHeart === 'function') spawnHeart();
  showNotif('🍔 A Hungry Lion special — belly full, whiskers greasy. Delicious!');
}
function zooBuyGift() {
  if (state.carryBag) { showNotif('🛍️ Your mouth is full — deliver what you\'re carrying first!'); return; }
  if (state.coins < ZOO_PLUSH) { showNotif('🧸 The plush lion is ' + ZOO_PLUSH + ' 🪙…'); if (typeof sfx === 'function') sfx('sad'); return; }
  state.coins -= ZOO_PLUSH;
  document.getElementById('coin-count').textContent = state.coins;
  if (typeof setCarryBag === 'function') setCarryBag({ id: 'plush', name: 'Plush Lion', e: '🧸', price: ZOO_PLUSH }, 'the Zoo Gift Shop');
  if (typeof sfx === 'function') sfx('sell');
  showNotif('🧸 One plush lion, bagged! Carry it home — the Miller kids will love it.');
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
function zooQueueSpot(i) { return { x: ZOO.gateX - 0.4 - i * 1.3, z: -6.4 }; }
function updateZooBooth(t) {
  const V = state.zooVisitors || [];
  if (state.zooShift) {
    state._zooSpawnT = (state._zooSpawnT || 0) - 0.016;
    const queued = V.filter(v => v.state === 'queue').length;
    if (state._zooSpawnT <= 0 && queued < 4) { spawnZooVisitor(); state._zooSpawnT = 5 + Math.random() * 5; }
    const d = Math.hypot(catGroup.position.x - (ZOO.gateX + 1.6), catGroup.position.z - (-6.4));
    if (d > 8) toggleZooShift();
  }
  for (let i = V.length - 1; i >= 0; i--) {
    const v = V[i];
    if (v.leaving) {
      v.spr.visible = false;
      if (walkToward(v, ZOO.gateX - 22, -8, 0.05)) { scene.remove(v.group); V.splice(i, 1); }
      continue;
    }
    if (v.state === 'enter') {
      v.spr.visible = false;
      const inside = walkToward(v, ZOO.gateX + 4, 0, 0.045);
      if (inside) { scene.remove(v.group); V.splice(i, 1); }
      continue;
    }
    const qi = V.filter(o => o.state === 'queue' && V.indexOf(o) < i).length;
    const spot = zooQueueSpot(qi);
    const arrived = walkToward(v, spot.x, spot.z, 0.04);
    if (arrived) { v.group.rotation.y = Math.PI / 2; idleHuman(v, t); }
    v.spr.visible = qi === 0 && Math.hypot(v.wx - spot.x, v.wz - spot.z) < 0.6;
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
    if (typeof schoolEvent === 'function') schoolEvent('minigame');
  } else {
    v.leaving = true;
    if (typeof sfx === 'function') sfx('sad');
    showNotif('💢 Wrong ticket! They stormed off. READ the thought bubble…');
  }
}

// ── The zoo's OWN map: pens, maze hedges, shops — shown on the minimap while inside ──
function drawZooMinimap(ctx, cv) {
  const D = cv.width;
  ctx.fillStyle = '#d8c9a0'; ctx.fillRect(0, 0, D, D);
  const sx = D / (ZOO.x1 - ZOO.x0 + 4), sz = D / (ZOO.z1 - ZOO.z0 + 4);
  const X = x => (x - ZOO.x0 + 2) * sx, Z = z => (z - ZOO.z0 + 2) * sz;
  ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 4;
  ctx.strokeRect(X(ZOO.x0), Z(ZOO.z0), (ZOO.x1 - ZOO.x0) * sx, (ZOO.z1 - ZOO.z0) * sz);
  ZOO_PENS.forEach(P => {
    ctx.fillStyle = '#' + (P.floor || 0xa8d088).toString(16).padStart(6, '0');
    ctx.fillRect(X(P.x - P.w / 2), Z(P.z - P.d / 2), P.w * sx, P.d * sz);
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 1.5;
    ctx.strokeRect(X(P.x - P.w / 2), Z(P.z - P.d / 2), P.w * sx, P.d * sz);
    ctx.font = (11 * sx) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(P.label.split(' ')[0], X(P.x), Z(P.z));
  });
  ctx.strokeStyle = '#3f6b2e'; ctx.lineWidth = Math.max(3, 1.2 * sx); ctx.lineCap = 'round';
  ZOO_HEDGES.forEach(([x0, z0, x1, z1]) => { ctx.beginPath(); ctx.moveTo(X(x0), Z(z0)); ctx.lineTo(X(x1), Z(z1)); ctx.stroke(); });
  ctx.font = (12 * sx) + 'px serif'; ctx.textAlign = 'center';
  ctx.fillText('🍔', X(ZOO_CAFE.x), Z(ZOO_CAFE.z + 2));
  ctx.fillText('🎁', X(ZOO_GIFT.x), Z(ZOO_GIFT.z - 2));
  ctx.fillText('🚪', X(ZOO.gateX + 1), Z(0));
  const cp = catGroup.position;
  ctx.fillStyle = '#f0b828'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(X(cp.x), Z(cp.z), 8, 0, 7); ctx.fill(); ctx.stroke();
}

// ── per-frame zoo life — every animal has its own MOMENTS ──
let _zooFog = false;
function updateZooLife(t) {
  if (state.zooKeeper) idleHuman(state.zooKeeper, t);
  if (state.zooCook) idleHuman(state.zooCook, t);
  if (state.zooClerk) idleHuman(state.zooClerk, t);
  updateZooBooth(t);
  updateZooCrowd(t);
  if (_zooGateOpen && Math.abs(catGroup.position.x - ZOO.gateX) > 10 && catGroup.position.x < ZOO.x0 - 6) setZooGate(false);
  (state.zooAnimals || []).forEach(a => {
    const g = a.group, ph = a.phase, ud = g.userData;
    if (!ud.hangs) g.position.y = Math.abs(Math.sin(t * 1.1 + ph)) * 0.02;
    if (ud.head) { ud.head.rotation.y = Math.sin(t * 0.7 + ph) * 0.3; ud.head.rotation.x = Math.sin(t * 0.5 + ph * 2) * 0.08; }
    // every animal gets an occasional MOMENT — its signature move
    if (!a._mT || t > a._mT + 1.6) { if (Math.random() < 0.003) { a._mT = t; } }
    const inMoment = a._mT && t - a._mT < 1.6;
    const q = inMoment ? Math.sin(((t - a._mT) / 1.6) * Math.PI) : 0;   // 0→1→0 over the moment
    switch (a.type) {
      case 'elephant': if (ud.trunk) ud.trunk.forEach((seg, i) => { seg.rotation.x = 0.5 + i * 0.12 + Math.sin(t * 1.4 + ph) * 0.1 - q * (0.5 + i * 0.2); }); break;   // trumpets: trunk swings UP
      case 'lion': if (ud.head) ud.head.rotation.x += q * 0.55; g.rotation.z = q * 0.06; break;                       // the great yawn
      case 'bear': g.rotation.x = -q * 0.5; break;                                                                    // stands right up
      case 'penguin': g.rotation.z = Math.sin(t * 2.2 + ph) * 0.08; g.rotation.x = -q * 1.2; g.position.y += q * 0.06; break;   // belly slide!
      case 'monkey': g.position.y = Math.abs(Math.sin(t * (inMoment ? 6 : 1.4) + ph)) * (inMoment ? 0.3 : 0.05); break;         // bounces wild
      case 'kangaroo': g.position.y = Math.abs(Math.sin(t * 4 + ph)) * (inMoment ? 0.4 : 0.06); if (ud.tail) ud.tail.rotation.x = 0.2 + q * 0.3; break;
      case 'giraffe': if (ud.neck) ud.neck.rotation.x = -0.18 + Math.sin(t * 0.6 + ph) * 0.08 + q * 0.9; break;       // dips down to graze
      case 'zebra': if (ud.neck) ud.neck.rotation.x = -0.5 + q * 0.8; break;                                          // grazes too
      case 'croc': if (ud.jaw) ud.jaw.rotation.x = q * 0.55; if (ud.tail) ud.tail.rotation.y = Math.sin(t * 1.8 + ph) * 0.2; break;   // SNAP
      case 'hippo': g.position.y = -0.22 + q * 0.24 + Math.sin(t * 0.9 + ph) * 0.04; break;                           // wallows, surfaces to breathe
      case 'wolf': if (ud.tail) ud.tail.rotation.z = Math.sin(t * (inMoment ? 9 : 2) + ph) * (inMoment ? 0.4 : 0.12); if (inMoment && ud.head) ud.head.rotation.x = -0.5 * q; break;   // howls at nothing
      case 'parrot': g.position.y = Math.abs(Math.sin(t * (inMoment ? 8 : 2) + ph)) * (inMoment ? 0.16 : 0.04) + 0.0; break;   // flutters on the perch
      case 'peacock': if (ud.fan) { const s = 0.25 + q * 0.85; ud.fan.scale.set(s, s, s); } break;                    // THE fan display
      case 'flamingo': if (ud.neck) ud.neck.rotation.x = -0.35 + Math.sin(t * 0.6 + ph) * 0.08 + q * 0.7; break;      // dabbles in the water
      case 'hedgehog': if (ud.head) ud.head.scale.setScalar(Math.max(0.05, 1 - q)); g.scale.y = 1 - q * 0.25; g.rotation.z = Math.sin(t * 10) * q * 0.06; break;   // curls into a wobbling ball
      case 'fox': g.position.y = Math.abs(Math.sin(t * 5 + ph)) * q * 0.35; if (ud.tail) ud.tail.rotation.z = Math.sin(t * 4 + ph) * (0.1 + q * 0.3); break;   // the mousing pounce
      case 'deer': if (ud.neck) ud.neck.rotation.x = -0.4 + q * 0.85 - (inMoment ? 0 : Math.sin(t * 0.5 + ph) * 0.05); break;   // grazes, then snaps alert
      case 'camel': if (ud.head) ud.head.rotation.z = Math.sin(t * 3 + ph) * q * 0.25; break;   // that sideways chew
      case 'seal': g.rotation.x = -q * 0.5; g.position.y += q * 0.12; if (ud.body) ud.body.rotation.z = Math.sin(t * 6) * q * 0.15; break;   // balances up, clapping
      case 'snake': if (ud.head) { ud.head.position.y = 0.28 + q * 0.3; ud.head.rotation.z = Math.sin(t * 2 + ph) * 0.2; } if (ud.coils) ud.coils.forEach((c2, i) => c2.position.y = 0.1 + Math.sin(t * 2.4 + i * 0.9 + ph) * 0.02); break;   // rises to look around
      case 'sloth': if (ud.head) ud.head.rotation.y = Math.sin(t * 0.25 + ph) * 0.5 + q * 0.3; g.position.y = 0; break;   // the slowest look-around in the zoo
    }
    if (a.roam) {                                                    // Sheldon & Percy patrol the paths
      const sp = a.type === 'peacock' ? 0.014 : 0.008;
      a.dir += (Math.random() - 0.5) * 0.02;
      const nx = g.position.x + Math.cos(a.dir) * sp, nz = g.position.z + Math.sin(a.dir) * sp;
      const onPath = nx > ZOO.x0 + 3 && nx < ZOO.x1 - 3 && nz > -20 && nz < 20 && !(nx < 119 && nz > 3) && !(nx < 118 && nz < -3.5);   // the central esplanade (clear of the hedgehogs & gift shop)
      if (onPath) { g.position.x = nx; g.position.z = nz; g.rotation.y = -a.dir + Math.PI / 2; }
      else a.dir += Math.PI / 2;
    } else if (ud.hangs || a.type === 'snake') { /* sloths hang, snakes coil — no ambling */ } else if (!a._wanderT || t > a._wanderT) {
      a._wanderT = t + 6 + Math.random() * 8;
      const P = a.pen;
      a._tx = P ? P.x + (Math.random() - 0.5) * (P.w - 4) : a.home.x;
      a._tz = P ? P.z + (Math.random() - 0.5) * (P.d - 4) : a.home.z;
    } else if (a._tx != null && !inMoment) {
      const dx = a._tx - g.position.x, dz = a._tz - g.position.z, d = Math.hypot(dx, dz);
      if (d > 0.1) {
        g.position.x += dx / d * 0.012; g.position.z += dz / d * 0.012;
        const want = Math.atan2(dx, dz);
        g.rotation.y += (((want - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.05;
      }
    }
  });
}
