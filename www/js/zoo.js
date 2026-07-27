// zoo.js — 🦁 THE FRONTIER: the map is now ~3× the old town. The new lands hold wild
// woods, the GRAND PARK (a lawn twice the old park), and the TOWN ZOO — buy a 🎫 at the
// gate to wander among elephants, lions, giraffes, monkeys & penguins… or work the
// ticket booth yourself (Zita the keeper runs the booth minigame).

const GRAND_PARK = { x0: -45, x1: 45, z0: -130, z1: -72 };
const ZOO = { x0: 106, x1: 150, z0: -24, z1: 24, gateX: 106, gateZ: 0 };   // east of town, gate faces west

// ── The frontier build: wild trees + the Grand Park + the zoo compound ──
function buildFrontier() {
  buildGrandPark();
  buildZooExterior();
  // wild woods filling the tripled map — trees only, as ordered
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
      if (typeof regTree === 'function') regTree(+x.toFixed(1), +z.toFixed(1));
    }
  });
}

function buildGrandPark() {
  const P = GRAND_PARK;
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(P.x1 - P.x0, P.z1 - P.z0), new THREE.MeshStandardMaterial({ color: 0x8ccc68, roughness: 0.95 }));
  lawn.rotation.x = -Math.PI / 2; lawn.position.set((P.x0 + P.x1) / 2, 0.02, (P.z0 + P.z1) / 2); lawn.receiveShadow = true; scene.add(lawn);
  // perimeter fence posts (walk through the gaps — it's a park, not a prison)
  const postM = pbr(0x9a8a6a, 0.9);
  for (let x = P.x0; x <= P.x1; x += 6) [P.z0, P.z1].forEach(z => { const p = new THREE.Mesh(G.cyl(0.09, 0.11, 1.0), postM); p.position.set(x, 0.5, z); p.castShadow = true; scene.add(p); });
  for (let z = P.z0; z <= P.z1; z += 6) [P.x0, P.x1].forEach(x => { const p = new THREE.Mesh(G.cyl(0.09, 0.11, 1.0), postM); p.position.set(x, 0.5, z); p.castShadow = true; scene.add(p); });
  // a grand pond (drinkable), trees & benches
  const pondX = 0, pondZ = (P.z0 + P.z1) / 2;
  const shore = new THREE.Mesh(new THREE.CylinderGeometry(9.4, 9.4, 0.16, 36), pbr(0xc8b088, 0.9)); shore.position.set(pondX, 0.08, pondZ); shore.receiveShadow = true; scene.add(shore);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(8.7, 8.7, 0.2, 36), pbr(0x5ab6d8, 0.25)); water.position.set(pondX, 0.18, pondZ); scene.add(water);
  worldColliders.push({ type: 'circle', x: pondX, z: pondZ, r: 8.9 });
  if (typeof addWater === 'function') addWater(pondX, pondZ, 9.2);
  [[-30, -86], [-18, -118], [22, -84], [34, -112], [-34, -102], [30, -124], [12, -76], [-8, -124]].forEach(([x, z]) => { if (typeof regTree === 'function') regTree(x, z); });
  if (typeof regBench === 'function') { /* park benches if the helper exists */ }
  [[-14, -90, 0.6], [16, -100, -0.8], [-24, -116, 0.2]].forEach(([x, z, ry]) => {
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

// ── The zoo compound (exterior) ──
function buildZooExterior() {
  const wallM = pbr(0x8a6a4a, 0.9), postM = pbr(0x6a4a30, 0.9);
  const wall = (x0, z0, x1, z1) => {
    const w = Math.max(Math.abs(x1 - x0), 0.4), d = Math.max(Math.abs(z1 - z0), 0.4);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1.8, d), wallM);
    m.position.set((x0 + x1) / 2, 0.9, (z0 + z1) / 2); m.castShadow = true; m.receiveShadow = true; scene.add(m);
    worldColliders.push({ type: 'box', x0: Math.min(x0, x1) - 0.2, x1: Math.max(x0, x1) + 0.2, z0: Math.min(z0, z1) - 0.2, z1: Math.max(z0, z1) + 0.2 });
  };
  wall(ZOO.x0, ZOO.z0, ZOO.x1, ZOO.z0);                       // south wall
  wall(ZOO.x0, ZOO.z1, ZOO.x1, ZOO.z1);                       // north wall
  wall(ZOO.x1, ZOO.z0, ZOO.x1, ZOO.z1);                       // east wall
  wall(ZOO.x0, ZOO.z0, ZOO.x0, -3.2);                          // west wall, gate gap at z -3.2..3.2
  wall(ZOO.x0, 3.2, ZOO.x0, ZOO.z1);
  // the gate arch + sign
  [-3.2, 3.2].forEach(gz => { const p = new THREE.Mesh(G.cyl(0.28, 0.34, 4.4), postM); p.position.set(ZOO.gateX, 2.2, gz); p.castShadow = true; scene.add(p); });
  const arch = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 7.6), postM); arch.position.set(ZOO.gateX, 4.6, 0); arch.castShadow = true; scene.add(arch);
  if (typeof makeTextSign === 'function') {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.3, 6.8), new THREE.MeshStandardMaterial({ map: makeTextSign('🦁 TOWN ZOO', '#7a3a1a', '#ffe9c0', 420, 80), roughness: 0.6, emissive: 0x1c0e06, emissiveIntensity: 0.4 }));
    sign.rotation.y = -Math.PI / 2;   // read from the town side
    sign.position.set(ZOO.gateX - 0.5, 3.6, 0); scene.add(sign);
  }
  // the ticket booth beside the gate — Zita the keeper sells (or YOU do, in her minigame)
  const booth = new THREE.Group();
  const bw = pbr(0xa85a3a, 0.85);
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 2.2), bw); body.position.y = 1.3; booth.add(body);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.0, 4), pbr(0xe8c060, 0.8)); roof.position.y = 3.1; roof.rotation.y = Math.PI / 4; booth.add(roof);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 1.3), pbr(0x2a1c12, 0.4)); win.position.set(-1.11, 1.5, 0); booth.add(win);
  if (typeof makeTextSign === 'function') {
    const bs = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 2.0), new THREE.MeshStandardMaterial({ map: makeTextSign('🎫 TICKETS 10🪙', '#3a2a14', '#ffe9c0', 300, 56), roughness: 0.6 }));
    bs.rotation.y = 0; bs.position.set(-1.16, 2.35, 0); booth.add(bs);
  }
  booth.position.set(ZOO.gateX + 1.6, 0, -6.4); booth.rotation.y = 0;
  booth.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  scene.add(booth);
  worldColliders.push({ type: 'box', x0: ZOO.gateX + 0.4, x1: ZOO.gateX + 2.8, z0: -7.6, z1: -5.2 });
  // Zita, keeper of the booth — her golden bubble offers the 🎫 ticket-selling job
  if (typeof spawnNPC === 'function') spawnNPC(ZOO.gateX - 2.2, -6.4, 'Zita', state.npcs.length, 'tickets');
}

// ── The zoo grounds (an interior scene of their own) ──
let zooScene = null;
const zooColliders = [];
let _zooBuilt = false;
const ZW = 20, ZD = 13.5;   // interior half-bounds
function zooAnimal(type) {
  const g = new THREE.Group();
  const M = (c, r = 0.85) => pbr(c, r);
  const E = (rad, sx, sy, sz, m, x, y, z) => { const me = new THREE.Mesh(G.sph(rad), m); me.scale.set(sx, sy, sz); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  if (type === 'elephant') {
    const gm = M(0x9aa0ac);
    E(0.7, 1.3, 1.05, 1.7, gm, 0, 0.95, 0);                                     // body
    const head = E(0.48, 1, 1, 1, gm, 0, 1.35, 1.15);
    [-1, 1].forEach(d => E(0.34, 0.25, 1, 0.9, gm, d * 0.52, 1.45, 1.05));      // ears
    for (let i = 0; i < 4; i++) { const seg = new THREE.Mesh(G.cyl(0.13 - i * 0.02, 0.11 - i * 0.02, 0.34), gm); seg.position.set(0, 1.06 - i * 0.3, 1.62 + i * 0.1); seg.rotation.x = 0.5 + i * 0.12; seg.castShadow = true; g.add(seg); }   // trunk
    [[-0.42, 0.55], [0.42, 0.55], [-0.42, -0.5], [0.42, -0.5]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.19, 0.22, 0.9), gm); leg.position.set(lx, 0.45, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head;
  } else if (type === 'lion') {
    const tan = M(0xd8a860), mane = M(0x8a5a2a);
    E(0.45, 1.2, 0.95, 1.55, tan, 0, 0.62, 0);
    E(0.42, 1, 1, 1, mane, 0, 0.95, 0.62);                                      // the mane
    const head = E(0.3, 1, 0.95, 0.95, tan, 0, 0.98, 0.78);
    [-1, 1].forEach(d => E(0.09, 1, 1, 0.6, tan, d * 0.2, 1.25, 0.72));
    [[-0.3, 0.45], [0.3, 0.45], [-0.3, -0.42], [0.3, -0.42]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.1, 0.11, 0.55), tan); leg.position.set(lx, 0.28, lz); leg.castShadow = true; g.add(leg); });
    const tail = new THREE.Mesh(G.cyl(0.045, 0.045, 0.9), tan); tail.position.set(0, 0.75, -0.85); tail.rotation.x = 0.9; g.add(tail);
    g.userData.head = head;
  } else if (type === 'giraffe') {
    const yel = M(0xe8c470);
    E(0.5, 1.1, 1, 1.5, yel, 0, 1.35, 0);
    const neck = new THREE.Mesh(G.cyl(0.16, 0.2, 1.8), yel); neck.position.set(0, 2.5, 0.5); neck.rotation.x = -0.18; neck.castShadow = true; g.add(neck);
    const head = E(0.22, 1.1, 0.85, 1.25, yel, 0, 3.45, 0.75);
    [-1, 1].forEach(d => E(0.05, 1, 1.6, 1, M(0x8a6a3a), d * 0.1, 3.72, 0.68)); // ossicones
    [[-0.32, 0.5], [0.32, 0.5], [-0.32, -0.5], [0.32, -0.5]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.1, 0.12, 1.35), yel); leg.position.set(lx, 0.67, lz); leg.castShadow = true; g.add(leg); });
    g.userData.head = head; g.userData.neck = neck;
  } else if (type === 'monkey') {
    const br = M(0x8a5a3a);
    E(0.26, 1, 1.1, 1, br, 0, 0.42, 0);
    const head = E(0.2, 1, 0.95, 0.95, br, 0, 0.82, 0.1);
    E(0.13, 1, 0.8, 0.5, M(0xd8b090), 0, 0.78, 0.26);                            // face
    [-1, 1].forEach(d => E(0.07, 1, 1, 0.5, br, d * 0.2, 0.9, 0.05));
    const tail = new THREE.Mesh(G.cyl(0.035, 0.035, 0.8), br); tail.position.set(0, 0.5, -0.35); tail.rotation.x = 1.1; g.add(tail);
    g.userData.head = head;
  } else {   // penguin
    const bk = M(0x22262e), wh = M(0xf0f2f4);
    E(0.24, 1, 1.35, 1, bk, 0, 0.4, 0);
    E(0.17, 1, 1.15, 0.7, wh, 0, 0.38, 0.13);                                    // belly
    const head = E(0.15, 1, 1, 1, bk, 0, 0.82, 0.02);
    const beak = new THREE.Mesh(G.cone(0.05, 0.16, 8), M(0xe8a030, 0.6)); beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.8, 0.2); g.add(beak);
    [-1, 1].forEach(d => E(0.08, 0.4, 1.1, 0.8, bk, d * 0.24, 0.42, 0));         // flippers
    g.userData.head = head;
  }
  return g;
}
function buildZooGrounds() {
  if (_zooBuilt) return;
  _zooBuilt = true;
  zooScene = new THREE.Scene();
  zooScene.background = new THREE.Color(0x9cc4e0);
  const S = zooScene;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(ZW * 2 + 4, ZD * 2 + 4), pbr(0x9ec87a, 0.95));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
  const path = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, ZD * 2), pbr(0xd9ccb4, 0.9)); path.position.set(0, 0.03, 0); path.receiveShadow = true; S.add(path);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(ZW * 2, 0.05, 3.2), pbr(0xd9ccb4, 0.9)); cross.position.set(0, 0.03, 0); cross.receiveShadow = true; S.add(cross);
  S.add(new THREE.AmbientLight(0xfff4e8, 0.75));
  const sun2 = new THREE.DirectionalLight(0xfff4e0, 1.8); sun2.position.set(10, 18, 8); sun2.castShadow = true;
  sun2.shadow.mapSize.set(1024, 1024); sun2.shadow.camera.left = -24; sun2.shadow.camera.right = 24; sun2.shadow.camera.top = 24; sun2.shadow.camera.bottom = -24;
  S.add(sun2);
  // boundary colliders
  zooColliders.push({ type: 'box', x0: -ZW - 1, x1: -ZW, z0: -ZD, z1: ZD }, { type: 'box', x0: ZW, x1: ZW + 1, z0: -ZD, z1: ZD });
  zooColliders.push({ type: 'box', x0: -ZW, x1: ZW, z0: -ZD - 1, z1: -ZD }, { type: 'box', x0: -ZW, x1: ZW, z0: ZD, z1: ZD + 1 });
  // enclosures: [x, z, w, d, label, animals]
  state.zooAnimals = [];
  const penFence = pbr(0x7a5a3a, 0.9);
  const pen = (cx, cz, w, d, label, kinds) => {
    [[cx - w / 2, cz, 0.16, d], [cx + w / 2, cz, 0.16, d], [cx, cz - d / 2, w, 0.16], [cx, cz + d / 2, w, 0.16]].forEach(([fx, fz, fw, fd]) => {
      const f = new THREE.Mesh(new THREE.BoxGeometry(fw, 1.0, fd), penFence); f.position.set(fx, 0.5, fz); f.castShadow = true; S.add(f);
      zooColliders.push({ type: 'box', x0: fx - fw / 2 - 0.1, x1: fx + fw / 2 + 0.1, z0: fz - fd / 2 - 0.1, z1: fz + fd / 2 + 0.1 });
    });
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.4, d - 0.4), pbr(kinds[0] === 'penguin' ? 0xcfe4ec : 0xa8d088, 0.95));
    lawn.rotation.x = -Math.PI / 2; lawn.position.set(cx, 0.04, cz); S.add(lawn);
    if (typeof makeTextSign === 'function') {
      const sg = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 0.08), new THREE.MeshStandardMaterial({ map: makeTextSign(label, '#3a2a14', '#ffe9c0', 260, 48), roughness: 0.7 }));
      sg.position.set(cx, 1.35, cz + d / 2 + 0.05); S.add(sg);
    }
    kinds.forEach((k, i) => {
      const a = zooAnimal(k.split('#')[0]);
      a.position.set(cx - w / 4 + (i % 2) * (w / 2 - 1) + 0.5, 0, cz - d / 4 + Math.floor(i / 2) * (d / 2 - 1) + 0.5);
      a.rotation.y = Math.random() * 6.28;
      S.add(a);
      state.zooAnimals.push({ group: a, type: k.split('#')[0], phase: Math.random() * 6 });
    });
  };
  pen(-12, -7, 12, 9, '🐘 ELEPHANTS', ['elephant', 'elephant#2']);
  pen(12, -7, 12, 9, '🦁 LIONS', ['lion', 'lion#2']);
  pen(-12, 7, 12, 9, '🦒 GIRAFFES', ['giraffe']);
  pen(12, 7, 12, 9, '🐒 MONKEYS', ['monkey', 'monkey#2', 'monkey#3']);
  pen(0, -10.5, 7, 5, '🐧 PENGUINS', ['penguin', 'penguin#2', 'penguin#3']);
  // a few visitors enjoying the day
  state.zooPeople = [];
  [[-4.5, 2, 0.6], [4.5, -2.5, -2.2], [0, 5.5, 3.1]].forEach(([px, pz, ry]) => {
    const { group, parts } = buildHuman((typeof randomPersonCfg === 'function') ? randomPersonCfg() : { skin: 0xe2b48c, hair: 0x3a2a1c, shirt: 0x6a8ac0, pants: 0x3a3a4a });
    group.position.set(px, 0, pz); group.rotation.y = ry; S.add(group);
    state.zooPeople.push({ group, parts, phase: Math.random() * 6 });
  });
}
function enterZoo() {
  buildZooGrounds();
  state.inZoo = true;
  zooScene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_OUT);
  catGroup.position.set(-ZW + 1.6, 0, 0); catGroup.rotation.y = Math.PI / 2;
  state.camYaw = -Math.PI / 2; state.camHeight = 6; state.camDist = 7;
  camera.position.set(-ZW + 1.6 - 7, 6, 0);
  document.getElementById('minimap').style.display = 'none';
  if (typeof sfx === 'function') sfx('door');
  if (!state._seenZoo) { state._seenZoo = true; showDialogue('🦁 Town Zoo', 'Welcome in! Mind the lions, don\'t feed the monkeys, and the penguins have opinions. Enjoy! 🎫', 5600); }
}
function exitZoo() {
  state.inZoo = false;
  scene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_OUT);
  catGroup.position.set(ZOO.gateX - 2.5, 0, ZOO.gateZ); catGroup.rotation.y = Math.PI / 2;
  document.getElementById('minimap').style.display = 'block';
  if (typeof sfx === 'function') sfx('door');
}
function tryEnterZoo() {
  const price = 10;
  if (state.coins < price) { showNotif('🎫 A zoo ticket is ' + price + ' 🪙 — earn a little more first!'); if (typeof sfx === 'function') sfx('sad'); return; }
  state.coins -= price;
  document.getElementById('coin-count').textContent = state.coins;
  if (typeof sfx === 'function') sfx('sell');
  showNotif('🎫 One ticket! Welcome to the Town Zoo.');
  enterZoo();
}
// per-frame zoo life — every animal breathes, sways and looks about
function updateZooFrame(t) {
  (state.zooPeople || []).forEach(p => idleHuman(p, t));
  (state.zooAnimals || []).forEach(a => {
    const g = a.group, ph = a.phase;
    g.position.y = Math.abs(Math.sin(t * 1.1 + ph)) * 0.02;
    g.rotation.y += Math.sin(t * 0.4 + ph) * 0.0035;
    const head = g.userData.head;
    if (head) { head.rotation.y = Math.sin(t * 0.7 + ph) * 0.3; head.rotation.x = Math.sin(t * 0.5 + ph * 2) * 0.08; }
    if (a.type === 'penguin') g.rotation.z = Math.sin(t * 2.2 + ph) * 0.08;           // the waddle
    if (a.type === 'elephant') g.children.forEach((c, i) => { if (i >= 4 && i <= 7) c.rotation.x = 0.5 + (i - 4) * 0.12 + Math.sin(t * 1.4 + ph) * 0.1; });   // the trunk sways
    if (a.type === 'giraffe' && g.userData.neck) g.userData.neck.rotation.x = -0.18 + Math.sin(t * 0.6 + ph) * 0.08;
  });
}
