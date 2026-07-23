// Paws & Pennies — world: ground, road, houses, trees + world colliders
// Classic script: shares globals with the others; load order matters (see index.html).

// ─── World ────────────────────────────────────────────────────────────────────
// Extra materials for town props (created once)
const matLampPole = new THREE.MeshStandardMaterial({ color: 0x33333a, roughness: 0.6, metalness: 0.3 });
const matLampGlow = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd070, emissiveIntensity: 1.2 });
const matStone    = new THREE.MeshStandardMaterial({ color: 0x9a9488, roughness: 0.9 });
const matWater    = new THREE.MeshStandardMaterial({ color: 0x4aa6d0, roughness: 0.2, metalness: 0.1, emissive: 0x143848, emissiveIntensity: 0.4 });
const matBench    = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.8 });
const matShelterWall = new THREE.MeshStandardMaterial({ color: 0xe0b85a, roughness: 0.9 });
const matShelterRoof = new THREE.MeshStandardMaterial({ color: 0x6a4a8a, roughness: 0.8 });
const matSign     = new THREE.MeshStandardMaterial({ color: 0x9a3a6a, roughness: 0.6, emissive: 0x3a1228, emissiveIntensity: 0.5 });

// ── Town props registry — every structure the player can pick up & move in build
// mode, and every prop NPCs can use (sit on a bench, rest under a tree, meet at the
// fountain). Ids are stable across launches (deterministic build order) so saved moves
// re-apply on load.  { id, kind, group, x, z, rotY, coll, npc, movable, use }
const townProps = [];
const _propCounts = {};
function addProp(o) {
  const n = (_propCounts[o.kind] = (_propCounts[o.kind] || 0) + 1) - 1;
  o.id = o.kind + '#' + n;
  townProps.push(o);
  return o;
}
// Reposition a prop (its group, collider, any attached NPC + name sign all follow)
function moveProp(p, x, z, rotY) {
  const dx = x - p.x, dz = z - p.z;
  if (p.group) { p.group.position.x = x; p.group.position.z = z; if (rotY != null) p.group.rotation.y = rotY; }
  if (p.npc) { const n = p.npc; n.group.position.x += dx; n.group.position.z += dz; n.x += dx; n.z += dz;
    if (n.home) { n.home.x += dx; n.home.z += dz; } n.wx += dx; n.wz += dz; if (n.target) { n.target.x += dx; n.target.z += dz; } }
  if (p.sign) { p.sign.position.x += dx; p.sign.position.z += dz; }
  if (p.coll) {
    if (p.coll.type === 'circle') { p.coll.x = x; p.coll.z = z; }
    else if (p.coll.type === 'box') {
      const ew = Math.abs(Math.sin(rotY != null ? rotY : p.rotY || 0)) > 0.5;
      const bw = (p.hw != null) ? p.hw : 2.5, bd = (p.hd != null) ? p.hd : 2.0;   // per-prop footprint (school/shops are bigger than houses)
      const hw = ew ? bd : bw, hd = ew ? bw : bd;
      p.coll.x0 = x - hw; p.coll.x1 = x + hw; p.coll.z0 = z - hd; p.coll.z1 = z + hd;
    }
  }
  p.x = x; p.z = z; if (rotY != null) p.rotY = rotY;
  if (p.onMove) p.onMove(x, z, p.rotY);   // let systems that track this structure follow it (shop spots, bins, water…)
}
// Re-apply the player's saved rearrangements after the town is (re)built
function applyStructXf() {
  const xf = state.structXf || {};
  townProps.forEach(p => { const m = xf[p.id]; if (m) moveProp(p, m.x, m.z, m.rotY); });
}

// ── Drinkable water: the square fountain, the park pond, and anything you build ──
const waterSpots = [];
function addWater(x, z, r) { const w = { x, z, r }; waterSpots.push(w); return w; }
function removeWater(w) { const i = waterSpots.indexOf(w); if (i >= 0) waterSpots.splice(i, 1); }
function nearWater(px, pz) { for (const w of waterSpots) if (Math.hypot(px - w.x, pz - w.z) < w.r + 1.7) return w; return null; }

// The cat-rescue shelter (a big building you can walk up to and free cats from)
const SHELTER = { x: -46, z: 22 };

// Every house in town. `name` = the neighbour who hires you (null = backdrop).
// `rotY` rotates the house so its door faces the right street (default 0 = door +z).
const FACE_S = Math.PI;   // door faces south (-z)
const HOUSES = [
  // ── Main Street, north side — the neighbours who give jobs ──
  { x: -48, z: 8, wall: mat.house2, roof: mat.roofBlue, name: 'Dr. Amara' },
  { x: -34, z: 8, wall: mat.house1, roof: mat.roofRed,  name: 'Mr. Bloom' },
  { x: -20, z: 8, wall: mat.house1, roof: mat.roofRed,  name: 'Farmer Bob' },
  { x:  -6, z: 9, wall: mat.house2, roof: mat.roofBlue, name: 'Old Tom' },
  { x:   8, z: 8, wall: mat.house1, roof: mat.roofRed,  name: null },   // Mrs. Chen moved her shopping to Dad's store
  { x:  22, z: 8, wall: mat.house2, roof: mat.roofBlue, name: 'Rosa' },
  { x:  38, z: 8, wall: mat.house1, roof: mat.roofRed,  name: null },
  { x:  54, z: 8, wall: mat.house2, roof: mat.roofBlue, name: null },
  { x: -62, z: 8, wall: mat.house1, roof: mat.roofRed,  name: null },
  // ── Main Street, south side — backdrop houses ──
  { x: -54, z: -9, wall: mat.house2, roof: mat.roofBlue, name: null },
  { x: -30, z: -9, wall: mat.house1, roof: mat.roofRed,  name: null },
  { x:  18, z: -9, wall: mat.house2, roof: mat.roofBlue, name: null },
  { x:  34, z: -9, wall: mat.house1, roof: mat.roofRed,  name: null },
  { x:  52, z: -9, wall: mat.house2, roof: mat.roofBlue, name: null },
  // ── North Avenue (residential) — facing the town square ──
  { x: -36, z: 32, wall: mat.house1, roof: mat.roofRed,  name: null, rotY: FACE_S },
  { x: -14, z: 32, wall: mat.house2, roof: mat.roofBlue, name: null, rotY: FACE_S },
  { x:  14, z: 32, wall: mat.house1, roof: mat.roofRed,  name: null, rotY: FACE_S },
  { x:  36, z: 32, wall: mat.house2, roof: mat.roofBlue, name: null, rotY: FACE_S },
  // ── North Avenue, far row ──
  { x: -38, z: 46, wall: mat.house2, roof: mat.roofBlue, name: null, rotY: FACE_S },
  { x: -14, z: 46, wall: mat.house1, roof: mat.roofRed,  name: null, rotY: FACE_S },
  { x:  14, z: 46, wall: mat.house2, roof: mat.roofBlue, name: null, rotY: FACE_S },
  { x:  38, z: 46, wall: mat.house1, roof: mat.roofRed,  name: null, rotY: FACE_S },
  // ── South Lane (residential), north side facing the lane ──
  { x: -34, z: -20, wall: mat.house1, roof: mat.roofRed,  name: null, rotY: FACE_S },
  { x: -14, z: -20, wall: mat.house2, roof: mat.roofBlue, name: null, rotY: FACE_S },
  { x:  14, z: -20, wall: mat.house1, roof: mat.roofRed,  name: null, rotY: FACE_S },
  { x:  34, z: -20, wall: mat.house2, roof: mat.roofBlue, name: null, rotY: FACE_S },
  // ── South Lane, far row (doors face north toward the lane) ──
  { x: -24, z: -34, wall: mat.house2, roof: mat.roofBlue, name: null },
  { x:   0, z: -34, wall: mat.house1, roof: mat.roofRed,  name: null },
  { x:  24, z: -34, wall: mat.house2, roof: mat.roofBlue, name: null },
  // ── Outer blocks (the bigger town: more streets west, a few more east) ──
  { x: -78, z: 8,  wall: mat.house2, roof: mat.roofBlue, name: null },
  { x: -92, z: 8,  wall: mat.house1, roof: mat.roofRed,  name: null },
  { x: -72, z: -9, wall: mat.house1, roof: mat.roofRed,  name: null },
  { x: -90, z: -9, wall: mat.house2, roof: mat.roofBlue, name: null },
  { x:  70, z: -9, wall: mat.house1, roof: mat.roofRed,  name: null },
  { x:  86, z: -9, wall: mat.house2, roof: mat.roofBlue, name: null },
  { x: -58, z: 32, wall: mat.house2, roof: mat.roofBlue, name: null, rotY: FACE_S },
  { x: -60, z: 46, wall: mat.house1, roof: mat.roofRed,  name: null, rotY: FACE_S },
  { x: -52, z: -20, wall: mat.house2, roof: mat.roofBlue, name: null, rotY: FACE_S },
  { x:  48, z: -20, wall: mat.house1, roof: mat.roofRed,  name: null, rotY: FACE_S },
  { x: -48, z: -34, wall: mat.house1, roof: mat.roofRed,  name: null },
  { x:  48, z: -34, wall: mat.house2, roof: mat.roofBlue, name: null },
];

function buildWorld() {
  // Ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), mat.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Three east-west streets: South Lane (z -26), Main Street (z 0), North Avenue (z 38)
  const street = (z, w) => {
    box(300, 0.05, w, mat.road, 0, 0.03, z);
    box(300, 0.07, 1.5, mat.sidewalk, 0, 0.04, z + w / 2 + 1);
    box(300, 0.07, 1.5, mat.sidewalk, 0, 0.04, z - w / 2 - 1);
  };
  street(0, 7); street(38, 7); street(-26, 6);

  // Houses (from data) + a collider for each (rotation-aware footprint)
  HOUSES.forEach(h => {
    const built = buildHouse(h.x, 0, h.z, h.wall, h.roof, h.name, h.rotY || 0);
    const ew = Math.abs(Math.sin(h.rotY || 0)) > 0.5;       // rotated to face east/west?
    const hw = ew ? 2.0 : 2.5, hd = ew ? 2.5 : 2.0;
    const coll = { type: 'box', x0: h.x - hw, x1: h.x + hw, z0: h.z - hd, z1: h.z + hd };
    worldColliders.push(coll);
    // A shop-front name board over the door, facing the street (south side)
    const sign = (h.name && SHOP_SIGNS[h.name]) ? buildNameSign(h.x, 3.05, h.z - 2.06, SHOP_SIGNS[h.name], true) : null;
    // registered so you can pick it up & move it in build mode (its NPC + sign follow).
    // Backdrop houses can be demolished; the shopkeeper/job houses (they have an npc) cannot.
    addProp({ kind: 'house', group: built.group, npc: built.npc, sign, x: h.x, z: h.z, rotY: h.rotY || 0, coll, movable: true, destroyable: !built.npc });
  });

  // Poor family house - left side (special)
  buildPoorHouse(-3, 0, -10);
  buildFamily();
  spawnCrick();
  buildPedestrians();
  buildCommuters();    // townsfolk who walk the streets between shops
  buildFootball();     // kids playing football in the square you can join
  spawnStreetCats();   // ambient cats roaming the whole town
  worldColliders.push({ type: 'box', x0: -5.0, x1: -1.0, z0: -11.6, z1: -8.4 }); // Miller house body

  // The town square (between Main Street and North Avenue, well clear of the houses)
  buildTownSquare(0, 20);
  // The big cat-rescue shelter (west of the square)
  buildCatShelter(SHELTER.x, SHELTER.z);
  // A busy highway in the distance — you can see it, but a barrier keeps you out
  buildHighway();
  // The town park (catch mice for the Mayor, hunt birds for the Butcher)
  buildPark();
  // Little pick-up minigames scattered around town — walk up to anyone with a ✨ over their head
  spawnStreetMinigames();
  // Rummage-able trash bins dotted around the streets & alleys
  buildTrashCans();
  // For-sale properties: houses for the Millers + a shop for Dad (notes 8 & 9)
  buildForSaleSigns();
  // Street-name blades + district signs, so the town reads like a real place
  buildStreetSigns();

  // Trees dotted around town
  const trees = [
    [2, 5.5], [-26, 5.5], [30, 5.5], [-56, 5.5], [46, 5.5],
    [0, -5.2], [-10, -5.5], [26, -5.5], [-36, -5.2], [44, -5.5],   // shifted clear of the café & bakery storefronts
    [48, 20], [-26, 46], [26, 46], [0, 13], [0, 27], [-58, 14],
    [-44, -20], [44, -20], [-12, -34], [12, -34],
  ];
  trees.forEach(([tx, tz]) => regTree(tx, tz));

  // Street lamps along all three streets
  [-50, -22, 6, 34, 56].forEach(lx => { regLamp(lx, 6.5); regLamp(lx, 31.5); regLamp(lx, -22.5); });
}

function buildHouse(x, y, z, wallMat, roofMat, npcName, rotY = 0) {
  const g = new THREE.Group();
  // Walls
  const walls = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 4), wallMat);
  walls.castShadow = true; walls.receiveShadow = true;
  g.add(walls);
  // Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2, 4), roofMat);
  roof.position.y = 2.75; roof.rotation.y = Math.PI/4;
  roof.castShadow = true;
  g.add(roof);
  // Door + frame + step
  const dframe = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.6, 0.08), mat.door);
  dframe.position.set(0, -1.0, 2.0); g.add(dframe);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.1), mat.door);
  door.position.set(0, -1.05, 2.06);
  g.add(door);
  const step = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 0.5), mat.sidewalk);
  step.position.set(0, -1.72, 2.25); step.castShadow = true; step.receiveShadow = true; g.add(step);
  // Windows + frames + flower boxes underneath
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.85 });
  const bloomCols = [0xd8607a, 0xe0b040, 0xc06ad0, 0xe07a3a];
  [-1.3, 1.3].forEach((wx, wi) => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.02, 0.08), mat.door);
    frame.position.set(wx, 0.4, 2.0); frame.castShadow = true; g.add(frame);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.1), mat.window);
    win.position.set(wx, 0.4, 2.06);
    g.add(win);
    const fbox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.22), boxMat);   // window flower box
    fbox.position.set(wx, -0.2, 2.12); fbox.castShadow = true; g.add(fbox);
    for (let fi = 0; fi < 3; fi++) {
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: bloomCols[(wi * 2 + fi) % 4], roughness: 0.6 }));
      bloom.position.set(wx - 0.26 + fi * 0.26, -0.06, 2.12); g.add(bloom);
    }
  });
  // A trim band under the roofline ties the walls together
  const trim = new THREE.Mesh(new THREE.BoxGeometry(4.15, 0.16, 4.15), new THREE.MeshStandardMaterial({ color: 0xefe6d2, roughness: 0.85 }));
  trim.position.set(0, 1.72, 0); g.add(trim);
  // Chimney (with a cap)
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.5), mat.brick);
  chimney.position.set(1.3, 2.5, -0.5); chimney.castShadow = true; g.add(chimney);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 0.62), new THREE.MeshStandardMaterial({ color: 0x3a3230, roughness: 0.8 }));
  cap.position.set(1.3, 3.2, -0.5); g.add(cap);
  // a little paved path from the doorstep
  const path = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 1.1), mat.sidewalk);
  path.position.set(0, -1.78, 3.0); path.receiveShadow = true; g.add(path);
  g.position.set(x, y + 1.75, z);
  g.rotation.y = rotY;       // backdrop houses rotate to face their street
  scene.add(g);

  // NPC on the street side (only the main-street neighbours pass a name)
  const npc = npcName ? spawnNPC(x, z - 3, npcName, state.npcs.length) : null;
  return { group: g, npc };
}

function buildPoorHouse(x, y, z) {
  // Smaller, rougher looking
  const base = box(4, 2.5, 3.5, mat.poorHouse, x, y + 1.25, z);
  const roof = cone(2.8, 1.5, 4, mat.roofRed, x, y + 2.75, z, Math.PI/4);
  poorHouse = { base, roof };
  box(0.7, 1.2, 0.1, mat.door, x, y + 0.35, z + 1.75);
  box(0.9, 0.9, 0.08, mat.window, x - 1.1, y + 1.3, z + 1.76);
  // crooked chimney
  box(0.45, 1.1, 0.45, mat.brick, x + 1.2, y + 2.4, z - 0.4);
  // Sign
  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.9, metalness: 0 }));
  sign.position.set(x, y + 1.6, z + 1.76);
  scene.add(sign);
}

function buildTree(x, y, z) {
  const g = new THREE.Group();
  const cy = (rt, rb, h, s, m, py) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m); me.position.set(0, py, 0); me.castShadow = true; me.receiveShadow = true; g.add(me); };
  const sp = (r, m, px, py, pz) => { const me = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); me.position.set(px, py, pz); me.castShadow = true; me.receiveShadow = true; g.add(me); };
  cy(0.16, 0.3, 1.9, 8, mat.treeTrunk, 0.95);           // tapered trunk
  sp(1.25, mat.tree,     0,     2.4, 0);                 // layered canopy
  sp(0.95, mat.treeDark, 0.85,  2.1, 0.2);
  sp(0.9,  mat.treeDark, -0.8,  2.2, -0.25);
  sp(0.85, mat.tree,     0.1,   3.0, -0.1);
  sp(0.8,  mat.tree,     -0.3,  2.5, 0.7);
  g.position.set(x, y, z);
  scene.add(g);
  return g;
}

// ─── Town props ─────────────────────────────────────────────────────────────────
function buildLamp(x, z) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 8), matLampPole); pole.position.y = 1.3; pole.castShadow = true; g.add(pole);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), matLampGlow); glow.position.y = 2.7; g.add(glow);
  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}

function buildBench(x, z, rotY) {
  const g = new THREE.Group();
  const add = m => { m.castShadow = true; m.receiveShadow = true; g.add(m); };
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.6), matBench); seat.position.y = 0.5; add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.12), matBench); back.position.set(0, 0.78, -0.24); add(back);
  [-0.85, 0.85].forEach(lx => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.5), matBench); leg.position.set(lx, 0.25, 0); add(leg); });
  g.position.set(x, 0, z); g.rotation.y = rotY || 0;
  scene.add(g);
  return g;
}
// Build + register the movable/usable props so they can be rearranged in build mode
// and NPCs can sit on / rest under them.
function regTree(x, z)  { const g = buildTree(x, 0, z); const coll = { type: 'circle', x, z, r: 0.8 }; worldColliders.push(coll); return addProp({ kind: 'tree',  group: g, x, z, rotY: 0, coll, movable: true, use: 'tree' }); }
function regLamp(x, z)  { const g = buildLamp(x, z);     return addProp({ kind: 'lamp',  group: g, x, z, rotY: 0, coll: null, movable: true }); }
function regBench(x, z, rotY) { const g = buildBench(x, z, rotY); return addProp({ kind: 'bench', group: g, x, z, rotY: rotY || 0, coll: null, movable: true, use: 'bench' }); }
// A picnic blanket with a basket + food — a spot for townsfolk to sit and eat
function buildPicnic(x, z) {
  const g = new THREE.Group();
  const check = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 2.6), new THREE.MeshStandardMaterial({ color: 0xc0413a, roughness: 0.95 }));
  check.position.y = 0.03; check.receiveShadow = true; g.add(check);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 1.5), new THREE.MeshStandardMaterial({ color: 0xe8d8c0, roughness: 0.95 }));
  inner.position.y = 0.05; g.add(inner);
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.36), new THREE.MeshStandardMaterial({ color: 0x9a6a34, roughness: 0.9 }));
  basket.position.set(0.7, 0.2, 0.7); basket.castShadow = true; g.add(basket);
  [[-0.5, 0.2, 0x6aa84a], [-0.2, -0.5, 0xf0c040], [0.4, -0.3, 0xc85a5a]].forEach(([px, pz, c]) => {
    const food = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
    food.position.set(px, 0.13, pz); food.castShadow = true; g.add(food);
  });
  g.position.set(x, 0, z); scene.add(g);
  return addProp({ kind: 'picnic', group: g, x, z, rotY: 0, coll: null, movable: true, use: 'picnic' });
}

// A paved square with a fountain, benches, lamps and trees
function buildTownSquare(cx, cz) {
  box(66, 0.05, 16, mat.sidewalk, cx, 0.045, cz);            // paved plaza
  // fountain
  cylinder(2.0, 2.2, 0.6, 20, matStone, cx, 0.3, cz);        // basin wall
  cylinder(1.7, 1.7, 0.2, 20, matWater, cx, 0.55, cz);       // water
  cylinder(0.25, 0.35, 1.4, 12, matStone, cx, 1.0, cz);      // centre column
  sphere(0.45, matWater, cx, 1.9, cz);                        // water orb
  worldColliders.push({ type: 'circle', x: cx, z: cz, r: 2.4 });
  addProp({ kind: 'fountain', x: cx, z: cz, r: 2.4, movable: false, use: 'fountain' });   // townsfolk gather here for photos
  addWater(cx, cz, 2.4);   // drink here
  // benches facing the fountain
  regBench(cx - 13, cz - 6, 0); regBench(cx + 13, cz - 6, 0);
  regBench(cx - 13, cz + 6, Math.PI); regBench(cx + 13, cz + 6, Math.PI);
  // corner lamps
  [[-28, -7], [28, -7], [-28, 7], [28, 7]].forEach(([lx, lz]) => regLamp(cx + lx, cz + lz));
}

// The big cat-rescue shelter — door + sign face south toward the street, with a play yard out front
function buildCatShelter(x, z) {
  const g = new THREE.Group();
  const add = m => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  add(new THREE.Mesh(new THREE.BoxGeometry(13, 5, 8), matShelterWall)).position.y = 2.5;          // big hall
  const roof = add(new THREE.Mesh(new THREE.ConeGeometry(9.2, 2.6, 4), matShelterRoof)); roof.position.y = 6.3; roof.rotation.y = Math.PI / 4;
  add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.2), mat.door)).position.set(0, 1.6, 4.05); // door
  [-4.2, 4.2].forEach(wx => add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 0.2), mat.window)).position.set(wx, 2.8, 4.02));
  const shelterTex = makeTextSign('🐾 CAT SHELTER', '#c14a2a', '#fff4e0', 384, 72);
  add(new THREE.Mesh(new THREE.BoxGeometry(7, 1.3, 0.3), new THREE.MeshStandardMaterial({ map: shelterTex, roughness: 0.7 }))).position.set(0, 4.5, 4.15);     // 🐾 sign banner (box faces read upright from outside — no flip needed)
  g.position.set(x, 0, z); g.rotation.y = Math.PI;   // face south, toward the yard & street
  scene.add(g);
  // low picket fence around the play yard in front (south)
  for (let fx = -6; fx <= 6; fx += 1.5) box(0.12, 0.7, 0.12, mat.fence, x + fx, 0.45, z - 9);
  [-9, -7.5, -6, -4.5].forEach(fz => { box(0.12, 0.7, 0.12, mat.fence, x - 6, 0.45, z + fz); box(0.12, 0.7, 0.12, mat.fence, x + 6, 0.45, z + fz); });
  worldColliders.push({ type: 'box', x0: x - 6.5, x1: x + 6.5, z0: z - 4, z1: z + 4 });
}

// A distant highway with looping traffic, fenced off behind a crash barrier
function buildHighway() {
  const z = 66;
  box(220, 0.05, 12, mat.road, 0, 0.02, z);                                  // tarmac
  const dashMat = new THREE.MeshStandardMaterial({ color: 0xf0e0a0, roughness: 0.8 });
  for (let x = -104; x <= 104; x += 6) box(2, 0.06, 0.4, dashMat, x, 0.05, z);   // centre dashes
  // crash barrier between the town and the highway
  const railMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, roughness: 0.4, metalness: 0.4 });
  box(220, 0.25, 0.2, railMat, 0, 0.9, 58);
  for (let x = -104; x <= 104; x += 5) box(0.18, 0.9, 0.18, matLampPole, x, 0.45, 58);
  // traffic (two directions, looping)
  const carColors = [0xc0392b, 0x2a6acc, 0xf0c020, 0x40a060, 0xe6e6ea, 0x9a3a8a, 0xe07a2a, 0x2aa0a0];
  state.cars = [];
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Group();
    const cm = new THREE.MeshStandardMaterial({ color: carColors[i % carColors.length], roughness: 0.4, metalness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 1.7), cm); body.position.y = 0.6; body.castShadow = true; c.add(body);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.8, 1.6), cm); cab.position.set(-0.2, 1.3, 0); cab.castShadow = true; c.add(cab);
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.62), new THREE.MeshStandardMaterial({ color: 0x223040, roughness: 0.2, metalness: 0.4 }));
    win.position.set(-0.2, 1.3, 0); c.add(win);
    const wheelM = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.6 });
    [[-1.1, 0.85], [1.1, 0.85], [-1.1, -0.85], [1.1, -0.85]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.3, 10), wheelM); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.36, wz); c.add(w);
    });
    const dir = i % 2 === 0 ? 1 : -1;
    c.position.set(-110 + Math.random() * 220, 0, dir > 0 ? z - 3 : z + 3);
    c.rotation.y = dir > 0 ? 0 : Math.PI;
    scene.add(c);
    state.cars.push({ group: c, dir, speed: 16 + Math.random() * 14 });
  }
}

// ─── The town park ──────────────────────────────────────────────────────────────
const PARK = { x0: 50, x1: 92, z0: 12, z1: 54 };
function buildPark() {
  const { x0, x1, z0, z1 } = PARK, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  box(x1 - x0, 0.04, z1 - z0, new THREE.MeshStandardMaterial({ color: 0x5a8a3a, roughness: 1 }), cx, 0.045, cz); // lawn
  box(9, 0.05, 2.4, mat.sidewalk, x0 + 5, 0.06, cz);                                                              // entry path
  // perimeter fence with a gap at the west gate
  for (let x = x0; x <= x1; x += 2) { box(0.12, 0.7, 0.12, mat.fence, x, 0.45, z0); box(0.12, 0.7, 0.12, mat.fence, x, 0.45, z1); }
  for (let z = z0; z <= z1; z += 2) { if (Math.abs(z - cz) < 2.6) continue; box(0.12, 0.7, 0.12, mat.fence, x0, 0.45, z); box(0.12, 0.7, 0.12, mat.fence, x1, 0.45, z); }
  // gate posts + sign arch
  box(0.4, 2.4, 0.4, matLampPole, x0, 1.2, cz - 2.6); box(0.4, 2.4, 0.4, matLampPole, x0, 1.2, cz + 2.6);
  box(0.5, 0.6, 5.8, matSign, x0, 2.5, cz);
  // pond
  cylinder(3.0, 3.2, 0.3, 24, matStone, cx + 4, 0.15, z1 - 6);
  cylinder(2.7, 2.7, 0.2, 24, matWater, cx + 4, 0.3, z1 - 6);
  worldColliders.push({ type: 'circle', x: cx + 4, z: z1 - 6, r: 3.2 });
  addWater(cx + 4, z1 - 6, 3.2);   // the park pond is drinkable too
  // trees, flowers, benches
  [[x0 + 4, z1 - 4], [x1 - 4, z0 + 3], [x1 - 5, z1 - 5], [x0 + 6, cz + 9]].forEach(([tx, tz]) => regTree(tx, tz));
  regBench(cx - 2, z0 + 3, 0); regBench(cx + 6, z0 + 3, 0);
  regLamp(x0 + 3, cz - 4); regLamp(x1 - 3, cz + 6);
  // butcher's stall (east)
  const stallM = new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8 });
  box(2.6, 1.0, 1.2, stallM, x1 - 4, 0.5, z0 + 5);
  box(3.0, 0.15, 1.7, new THREE.MeshStandardMaterial({ color: 0xc04a4a, roughness: 0.7 }), x1 - 4, 1.85, z0 + 5);
  box(0.12, 1.8, 0.12, stallM, x1 - 5.2, 0.9, z0 + 5.7); box(0.12, 1.8, 0.12, stallM, x1 - 2.8, 0.9, z0 + 5.7);
  worldColliders.push({ type: 'box', x0: x1 - 5.4, x1: x1 - 2.6, z0: z0 + 4.2, z1: z0 + 5.8 });
  // the Mayor (by the gate) and the Butcher (at the stall)
  spawnNPC(x0 + 6, cz + 1, 'Mayor Pickle', state.npcs.length);
  spawnNPC(x1 - 4, z0 + 6.6, 'Bert the Butcher', state.npcs.length);
  // park minigame folk — butterflies & bubbles among the trees
  spawnNPC(cx + 3, cz - 4, 'Poppy', state.npcs.length, 'butterfly');
  spawnNPC(cx - 6, cz + 7, 'Pip', state.npcs.length, 'bubbles');
  // lots of trees dotted through the park
  [[cx - 14, cz - 8], [cx - 10, cz + 9], [cx + 8, cz - 6], [cx + 12, cz + 8], [cx - 6, cz + 14],
   [cx + 4, cz + 16], [cx - 16, cz + 2], [cx + 16, cz - 2], [cx - 2, cz - 12], [cx + 14, cz + 15],
   [cx - 12, cz + 15], [cx + 6, cz - 12]].forEach(([tx, tz]) => {
    if (tx < x0 + 2 || tx > x1 - 2 || tz < z0 + 2 || tz > z1 - 2) return;
    regTree(tx, tz);
  });
  // picnic blankets on the lawn — spots for townsfolk to sit and eat
  buildPicnic(cx - 9, cz - 3); buildPicnic(cx + 11, cz + 11);
  // more benches + folk relaxing in the park (join state.peds so they mill about, and go home at night)
  regBench(cx - 8, cz + 6, 0.4); regBench(cx + 8, cz - 3, -0.5); regBench(cx - 3, cz + 12, Math.PI);
  const chillCfgs = [
    { skin: 0xc89a6a, hair: 0x141414, hairStyle: 'short', shirt: 0x4a9a6a, pants: 0x4a4030, height: 1.0, build: 'avg', eye: 0x2a1a10 },
    { skin: 0xf0c8a0, hair: 0x8a6a3a, hairStyle: 'bun', shirt: 0xc06a9a, pants: 0x5a5070, height: 0.92, build: 'round', eye: 0x4a3a22 },
    { skin: 0xe8c0a0, hair: 0x2a1a10, hairStyle: 'long', shirt: 0x6a8ac0, pants: 0x3a3a4a, height: 0.97, build: 'avg', eye: 0x3a2a1a },
    { skin: 0xb07a4a, hair: 0x3a2a18, hairStyle: 'short', hat: 'cap', hatColor: 0x7a3a3a, shirt: 0xc0a040, pants: 0x3a3a3a, height: 1.03, build: 'avg', eye: 0x2a1a10 },
  ];
  [[cx - 7, cz + 5], [cx + 10, cz + 3], [cx + 2, cz + 14], [cx - 4, cz - 6]].forEach(([px, pz], i) => {
    const { group, parts } = buildHuman(chillCfgs[i % chillCfgs.length]);
    group.position.set(px, 0, pz); scene.add(group);
    const ped = { group, parts, x: px, z: pz, phase: Math.random() * 6 };
    state.peds.push(ped);
    initWander(ped, 2.5, 0.013);
  });
  spawnParkCritters();
}

// ── Trash bins you can rummage for food (some full, some scraps, some empty) ──
const TRASH_SPOTS = [   // audited: all on pavements/verges — none on roads or inside house footprints
  [-30, 3], [24, 5.0], [46, -4.6], [-52, -5], [9, 17], [-20, -21.8], [37, 13],
  [-40, 25], [63, 5], [16, -29], [-8, 33], [30, 29], [-67, 5.2], [52, 40],
];
function buildTrashCans() {
  state.trashCans = [];
  const canM = pbr(0x46564a, 0.85), lidM = pbr(0x35453a, 0.7), ridgeM = pbr(0x3a4a40, 0.8);
  TRASH_SPOTS.forEach(([x, z]) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.29, 0.82, 16), canM); body.position.y = 0.41; body.castShadow = true; body.receiveShadow = true; g.add(body);
    for (let ry = 0.2; ry < 0.8; ry += 0.18) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.02, 6, 18), ridgeM); r.position.y = ry; r.rotation.x = Math.PI / 2; g.add(r); }
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.08, 16), lidM); lid.position.set(0.06, 0.86, 0); lid.rotation.z = 0.14; lid.castShadow = true; g.add(lid);   // slightly ajar
    g.position.set(x, 0, z); g.rotation.y = Math.random() * 6; scene.add(g);
    const can = { x, z, group: g, lid, refillAt: 0 };
    state.trashCans.push(can);
    const coll = { type: 'circle', x, z, r: 0.42 };
    if (typeof worldColliders !== 'undefined') worldColliders.push(coll);
    addProp({ kind: 'bin', group: g, x, z, rotY: g.rotation.y, coll, movable: true, onMove: (nx, nz) => { can.x = nx; can.z = nz; } });   // movable in the planner; searching follows it
  });
}
function nearestTrashCan(pos, r) {
  let best = null, bestD = r;
  for (const c of state.trashCans) { const d = Math.hypot(c.x - pos.x, c.z - pos.z); if (d < bestD) { bestD = d; best = c; } }
  return best;
}

// Friendly folk standing around town, each offering a quick pick-up minigame (walk up to them).
function spawnStreetMinigames() {
  spawnNPC(-24, 8, 'Sunny', state.npcs.length, 'balloons');    // near the west stroll
  spawnNPC(36, 6, 'Willow', state.npcs.length, 'leaves');      // east side of the square
}

function spawnParkCritters() {
  state.parkCritters = [];
  for (let i = 0; i < 13; i++) addParkCritter('mouse');
  for (let i = 0; i < 9; i++) addParkCritter('bird');
}
function addParkCritter(type) {
  const g = type === 'mouse' ? buildParkMouse() : buildParkBird();
  const x = PARK.x0 + 2 + Math.random() * (PARK.x1 - PARK.x0 - 4);
  const z = PARK.z0 + 2 + Math.random() * (PARK.z1 - PARK.z0 - 4);
  g.position.set(x, 0, z); scene.add(g);
  state.parkCritters.push({ group: g, type, x, z, dir: Math.random() * Math.PI * 2, baseSpeed: type === 'bird' ? 2.0 : 1.5, speed: type === 'bird' ? 2.0 : 1.5, turnT: 0, hop: Math.random() * 6 });
}
function buildParkMouse() {
  const g = new THREE.Group();
  const grey = new THREE.MeshStandardMaterial({ color: 0x7a756c, roughness: 0.9 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xc8a89a, roughness: 0.8 });
  const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.scale.set(sx, sy, sz); me.castShadow = true; g.add(me); return me; };
  add(new THREE.SphereGeometry(0.13, 10, 8), grey, 0, 0.1, 0, 1, 0.85, 1.5);   // body (forward +z)
  add(new THREE.SphereGeometry(0.1, 10, 8), grey, 0, 0.12, 0.16);              // head
  [-0.06, 0.06].forEach(ex => add(new THREE.SphereGeometry(0.05, 8, 6), grey, ex, 0.2, 0.13)); // ears
  add(new THREE.SphereGeometry(0.02, 6, 6), pink, 0, 0.1, 0.28);              // nose
  add(new THREE.CylinderGeometry(0.01, 0.02, 0.3, 5), pink, 0, 0.1, -0.22).rotation.x = 1.4; // tail
  g.scale.setScalar(0.6);
  return g;
}
// ─── For-sale properties (notes 8 & 9) ──────────────────────────────────────────
const PROPERTIES = [
  // Houses are a serious investment now — you fund them from business income, not pocket change.
  { id: 'home1', type: 'home', x: 18, z: -9, price: 60000 },    // a modest home for the Millers
  { id: 'home2', type: 'home', x: 52, z: -9, price: 150000 },   // a big family house
  { id: 'shop',  type: 'shop', x: -18, z: -9, price: 800 },     // Dad's shop — your affordable first business
];
const PROP_SIGNS = {};
// A little canvas texture so the sign actually reads "FOR SALE"
function makeSignTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#c03a3a'; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(8, 8, 240, 112);
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 46px Georgia'; g.fillText('FOR', 128, 42);
  g.font = 'bold 46px Georgia'; g.fillText('SALE', 128, 90);
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
  return tex;
}

// ─── Readable name signs for shops, houses & streets ─────────────────────────────
// A generic canvas → texture with a title (auto-fit) on a coloured plate.
function makeTextSign(text, bg, fg, w = 256, h = 64) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = Math.min(Math.floor(h * 0.5), Math.floor((w - 20) / (text.length * 0.62)));
  fs = Math.max(14, fs);
  g.font = 'bold ' + fs + 'px Georgia';
  g.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
  return tex;
}
// A shop/house name board mounted on a wall. faceSouth flips it (and its text) to read from the south.
function buildNameSign(x, y, z, text, faceSouth, bg, fg) {
  const tex = makeTextSign(text, bg || '#6a4028', fg || '#f5e8cc', 256, 60);
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.6, 0.08),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  board.position.set(x, y, z); board.rotation.y = faceSouth ? Math.PI : 0;
  board.castShadow = true; scene.add(board);
  return board;
}
// A green street-name blade on a pole (readable from both approaches)
const streetSigns = { main: [], north: [], south: [] };
function buildStreetSign(x, z, text, rotY, key) {
  cylinder(0.06, 0.08, 2.6, 8, matLampPole, x, 1.3, z);
  const tex = makeTextSign(text, '#2a6a3a', '#ffffff', 256, 52);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.48, 0.06),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
  blade.position.set(x, 2.45, z); blade.rotation.y = rotY || 0; blade.castShadow = true;
  scene.add(blade);
  if (key && streetSigns[key]) streetSigns[key].push(blade);
  return blade;
}
// Which trade each named neighbour runs — shown on a sign over their door
const SHOP_SIGNS = {
  'Mrs. Chen': "CHEN'S GROCERY", 'Rosa': "ROSA'S BAKERY", 'Dr. Amara': 'AMARA · VET',
  'Mr. Bloom': "BLOOM'S GARDEN", 'Farmer Bob': "BOB'S FARM", 'Old Tom': "OLD TOM'S",
};
function buildStreetSigns() {
  buildStreetSign(-60, 4.9, 'MAIN STREET', 0, 'main');
  buildStreetSign(60, 4.9, 'MAIN STREET', 0, 'main');
  buildStreetSign(-52, 34.6, 'NORTH AVENUE', 0, 'north');
  buildStreetSign(30, 34.6, 'NORTH AVENUE', 0, 'north');
  buildStreetSign(-46, -23.4, 'SOUTH LANE', 0, 'south');
  buildStreetSign(32, -23.4, 'SOUTH LANE', 0, 'south');
  buildStreetSign(-30, 12.6, 'TOWN SQUARE');
  buildStreetSign(48, 30, 'TOWN PARK');
}
function buildForSaleSigns() {
  buildShop(-18, -9);
  const signTex = makeSignTexture();
  PROPERTIES.forEach(p => {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), mat.door); post.position.y = 0.75; post.castShadow = true; g.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.08), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6 }));
    board.position.y = 1.5; board.castShadow = true; g.add(board);
    g.position.set(p.x + 2.4, 0, p.z + 2.7);
    scene.add(g);
    PROP_SIGNS[p.id] = g;   // store the whole sign so it can be removed once bought
  });
}
function buildShop(x, z) {
  const g = new THREE.Group();
  const add = m => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  add(new THREE.Mesh(new THREE.BoxGeometry(5, 3.2, 4), mat.house1)).position.y = 1.6;
  const roof = add(new THREE.Mesh(new THREE.ConeGeometry(3.7, 1.6, 4), mat.roofBlue)); roof.position.y = 4.0; roof.rotation.y = Math.PI / 4;
  add(new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.3, 1.6), new THREE.MeshStandardMaterial({ color: 0x3a7a5a, roughness: 0.7 }))).position.set(0, 2.6, 2.15);   // awning
  add(new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.6, 0.1), mat.window)).position.set(0.5, 1.4, 2.02);   // display window
  add(new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.1), mat.door)).position.set(-1.7, 1.0, 2.02);    // door
  add(new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 0.15), new THREE.MeshStandardMaterial({ map: makeTextSign('GENERAL STORE', '#2f5a3f', '#f2ead0', 300, 56), roughness: 0.6 }))).position.set(0, 2.95, 2.08);  // sign board
  // OPEN / CLOSED sign by the door — flips with Dad's hours (hidden until you own the shop)
  const openTex = makeTextSign('OPEN', '#2a8a3a', '#ffffff', 200, 100);
  const closedTex = makeTextSign('CLOSED', '#b83030', '#ffffff', 220, 100);
  const statusMat = new THREE.MeshStandardMaterial({ map: closedTex, roughness: 0.5 });
  const statusSign = add(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.42, 0.06), statusMat));
  statusSign.position.set(-1.7, 2.05, 2.08); statusSign.visible = false;
  shopStatusSign = { mat: statusMat, mesh: statusSign, openTex, closedTex, wasOpen: null };
  g.position.set(x, 0, z); scene.add(g);
  worldColliders.push({ type: 'box', x0: x - 2.5, x1: x + 2.5, z0: z - 2, z1: z + 2 });
}
let shopStatusSign = null;
// Flip the OPEN/CLOSED sign with the shop's hours (only once you own it)
function updateShopSign() {
  if (!shopStatusSign) return;
  const owned = state.owned.shop;
  shopStatusSign.mesh.visible = owned;
  if (!owned) return;
  const open = (typeof shopIsOpen === 'function') && shopIsOpen();
  if (open !== shopStatusSign.wasOpen) {
    shopStatusSign.wasOpen = open;
    shopStatusSign.mat.map = open ? shopStatusSign.openTex : shopStatusSign.closedTex;
    shopStatusSign.mat.needsUpdate = true;
  }
}

function buildParkBird() {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc05030, roughness: 0.7 });
  const beakM = new THREE.MeshStandardMaterial({ color: 0xe0a030, roughness: 0.5 });
  const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.scale.set(sx, sy, sz); me.castShadow = true; g.add(me); return me; };
  add(new THREE.SphereGeometry(0.13, 10, 8), body, 0, 0.15, 0, 1, 1, 1.3);    // body (forward +z)
  add(new THREE.SphereGeometry(0.1, 10, 8), red, 0, 0.15, 0.12, 1, 1, 0.9);   // red breast
  add(new THREE.SphereGeometry(0.09, 10, 8), body, 0, 0.26, 0.1);             // head
  add(new THREE.ConeGeometry(0.03, 0.1, 6), beakM, 0, 0.26, 0.2).rotation.x = Math.PI / 2; // beak
  add(new THREE.BoxGeometry(0.1, 0.03, 0.18), body, 0, 0.16, -0.16).rotation.x = 0.3;       // tail
  [-1, 1].forEach(s => add(new THREE.BoxGeometry(0.04, 0.1, 0.2), body, s * 0.13, 0.16, 0)); // wings
  g.scale.setScalar(0.6);
  return g;
}
