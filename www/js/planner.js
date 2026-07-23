// planner.js — SimCity-style build mode: the camera lifts up over the REAL 3D town,
// a translucent 3D preview of the piece sits under a centre crosshair, you drag to look
// around and tap Place to drop it. Rotate, undo, zoom, and rename the streets too.

const PLANNER_ITEMS = [
  { type: 'house',   icon: '🏠', name: 'House',   cost: 80000 },
  { type: 'shelter', icon: '🐾', name: 'Shelter', cost: 60000 },
  { type: 'tree',    icon: '🌳', name: 'Tree',    cost: 600 },
  { type: 'pine',    icon: '🌲', name: 'Pine',    cost: 550 },
  { type: 'blossom', icon: '🌸', name: 'Blossom', cost: 800 },
  { type: 'flowers', icon: '🌼', name: 'Flowers', cost: 250 },
  { type: 'bin',     icon: '🗑️', name: 'Bin',     cost: 400 },
  { type: 'bench',   icon: '🪑', name: 'Bench',   cost: 1200 },
  { type: 'lamp',    icon: '💡', name: 'Lamp',    cost: 1500 },
  { type: 'fence',   icon: '🚧', name: 'Fence',   cost: 500 },
  { type: 'road',    icon: '🛣️', name: 'Road',    cost: 300 },
  { type: 'fountain',icon: '⛲', name: 'Fountain', cost: 3000 },
  { type: 'pond',    icon: '💧', name: 'Pond',    cost: 1200 },
  { type: 'lake',    icon: '🌊', name: 'Lake',    cost: 6000 },
];
const plannerMeshes = [];   // runtime {group, collRef} aligned with state.placed (for undo)

// ── Visuals: build one piece as a group at the origin; return { group, coll } ──
// coll is a *relative* collider template: {hw,hd} box, {circle:true,r}, or null (no block).
function placedVisual(type) {
  const g = new THREE.Group();
  const B = (w, h, d, m, px, py, pz) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(px, py, pz); me.castShadow = true; me.receiveShadow = true; g.add(me); return me; };
  const CY = (rt, rb, hh, s, m, px, py, pz) => { const me = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, hh, s), m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  const SP = (r, m, px, py, pz) => { const me = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); me.position.set(px, py, pz); me.castShadow = true; g.add(me); return me; };
  let coll = null;
  if (type === 'house') {
    B(6, 4, 6, mat.house1, 0, 2, 0);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.2, 4), mat.roofRed); roof.position.set(0, 5.1, 0); roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    B(1.4, 2.4, 0.2, mat.door, 0, 1.2, 3.02);
    B(1.3, 1.3, 0.2, mat.window, -1.8, 2.4, 3.02); B(1.3, 1.3, 0.2, mat.window, 1.8, 2.4, 3.02);
    coll = { hw: 3.2, hd: 3.2 };
  } else if (type === 'shelter') {
    B(9, 5, 6.5, new THREE.MeshStandardMaterial({ color: 0xc8d0d4, roughness: 0.9 }), 0, 2.5, 0);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.6, 2.6, 4), new THREE.MeshStandardMaterial({ color: 0x6a8a9a, roughness: 0.8 })); roof.position.set(0, 6.3, 0); roof.rotation.y = Math.PI / 4; roof.castShadow = true; g.add(roof);
    B(2.2, 3, 0.2, mat.door, 0, 1.5, 3.28);
    B(5, 1.1, 0.2, new THREE.MeshStandardMaterial({ map: makeTextSign('🐾 SHELTER', '#c14a2a', '#fff4e0', 320, 72), roughness: 0.7 }), 0, 4.1, 3.32);
    coll = { hw: 4.6, hd: 3.4 };
  } else if (type === 'tree') {
    CY(0.16, 0.3, 1.9, 8, mat.treeTrunk, 0, 0.95, 0);
    [[0, 2.4, 0, 1.25, 0], [0.85, 2.1, 0.2, 0.95, 1], [-0.8, 2.2, -0.25, 0.9, 1], [0.1, 3.0, -0.1, 0.85, 0], [-0.3, 2.5, 0.7, 0.8, 0]]
      .forEach(([px, py, pz, r, d]) => SP(r, d ? mat.treeDark : mat.tree, px, py, pz));
    coll = { circle: true, r: 0.8 };
  } else if (type === 'pine') {   // a tall evergreen: stacked cones
    CY(0.14, 0.26, 1.4, 8, mat.treeTrunk, 0, 0.7, 0);
    const pineM = new THREE.MeshStandardMaterial({ color: 0x2e6b3f, roughness: 0.9 });
    [[1.15, 1.7, 1.55], [0.92, 1.4, 2.55], [0.66, 1.2, 3.45]].forEach(([r, hh, py]) => { const c2 = new THREE.Mesh(new THREE.ConeGeometry(r, hh, 10), pineM); c2.position.set(0, py, 0); c2.castShadow = true; g.add(c2); });
    coll = { circle: true, r: 0.7 };
  } else if (type === 'blossom') {   // a pink cherry-blossom tree
    CY(0.15, 0.28, 1.8, 8, mat.treeTrunk, 0, 0.9, 0);
    const blossomM = new THREE.MeshStandardMaterial({ color: 0xe89ab8, roughness: 0.85 });
    const blossomD = new THREE.MeshStandardMaterial({ color: 0xd678a0, roughness: 0.85 });
    [[0, 2.3, 0, 1.15, 0], [0.8, 2.1, 0.2, 0.85, 1], [-0.75, 2.15, -0.2, 0.8, 1], [0.1, 2.85, -0.1, 0.75, 0]]
      .forEach(([px, py, pz, r, d]) => SP(r, d ? blossomD : blossomM, px, py, pz));
    coll = { circle: true, r: 0.8 };
  } else if (type === 'flowers') {   // a little flower bed (no collider — walk through it)
    CY(0.85, 0.95, 0.12, 12, new THREE.MeshStandardMaterial({ color: 0x4a6b34, roughness: 0.95 }), 0, 0.06, 0);
    const cols = [0xe8c840, 0xd86a8a, 0xf0f0e0, 0xb06ad0, 0xe07a3a];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, r = 0.28 + (i % 3) * 0.18;
      CY(0.02, 0.02, 0.28, 5, new THREE.MeshStandardMaterial({ color: 0x3f6b2e, roughness: 0.9 }), Math.cos(a) * r, 0.24, Math.sin(a) * r);
      SP(0.09, new THREE.MeshStandardMaterial({ color: cols[i % 5], roughness: 0.6 }), Math.cos(a) * r, 0.4, Math.sin(a) * r);
    }
  } else if (type === 'bin') {   // a public trash bin — cats can rummage it for food
    CY(0.34, 0.29, 0.82, 16, new THREE.MeshStandardMaterial({ color: 0x46564a, roughness: 0.85 }), 0, 0.41, 0);
    const lid2 = CY(0.37, 0.37, 0.08, 16, new THREE.MeshStandardMaterial({ color: 0x35453a, roughness: 0.7 }), 0.06, 0.86, 0); lid2.rotation.z = 0.14;
    coll = { circle: true, r: 0.42 };
  } else if (type === 'bench') {
    B(2.0, 0.12, 0.6, matBench, 0, 0.5, 0); B(2.0, 0.5, 0.12, matBench, 0, 0.78, -0.24);
    [-0.85, 0.85].forEach(lx => B(0.12, 0.5, 0.5, matBench, lx, 0.25, 0));
  } else if (type === 'lamp') {
    CY(0.08, 0.1, 2.6, 8, matLampPole, 0, 1.3, 0);
    SP(0.22, matLampGlow, 0, 2.7, 0);
  } else if (type === 'fence') {
    for (let fx = -1.4; fx <= 1.4; fx += 0.5) B(0.1, 0.8, 0.1, mat.fence, fx, 0.45, 0);
    B(3.0, 0.1, 0.08, mat.fence, 0, 0.68, 0); B(3.0, 0.1, 0.08, mat.fence, 0, 0.32, 0);
    coll = { hw: 1.5, hd: 0.14 };
  } else if (type === 'road') {
    B(6, 0.06, 4, mat.road, 0, 0.03, 0);
    const dash = new THREE.MeshStandardMaterial({ color: 0xf0e0a0, roughness: 0.8 });
    for (let dx = -2; dx <= 2; dx += 1.3) B(0.8, 0.07, 0.25, dash, dx, 0.05, 0);
  } else if (type === 'fountain') {
    CY(2.0, 2.2, 0.6, 20, matStone, 0, 0.3, 0);    // basin wall
    CY(1.75, 1.75, 0.22, 20, matWater, 0, 0.52, 0); // water
    CY(0.25, 0.35, 1.4, 12, matStone, 0, 1.0, 0);   // centre column
    SP(0.45, matWater, 0, 1.9, 0);                   // water orb on top
    coll = { circle: true, r: 2.1 };
  } else if (type === 'pond') {
    CY(2.7, 2.7, 0.18, 28, matStone, 0, 0.09, 0);   // stone shore
    CY(2.35, 2.35, 0.2, 28, matWater, 0, 0.2, 0);   // water (inset so the rim shows)
    coll = { circle: true, r: 2.5 };
  } else if (type === 'lake') {
    CY(5.4, 5.4, 0.16, 36, matStone, 0, 0.08, 0);   // sandy shore
    CY(4.9, 4.9, 0.2, 36, matWater, 0, 0.19, 0);    // main water
    CY(2.4, 2.4, 0.2, 24, matWater, 2.2, 0.2, 1.6); // a couple of lobes for an irregular edge
    CY(2.0, 2.0, 0.2, 24, matWater, -2.4, 0.2, -1.4);
    coll = { circle: true, r: 4.9 };
  }
  return { group: g, coll };
}
function worldColliderFor(coll, x, z, rot) {
  if (!coll) return null;
  if (coll.circle) return { type: 'circle', x, z, r: coll.r };
  const rotated = Math.abs(Math.sin(rot || 0)) > 0.5;   // rotated ~90° → swap footprint
  const hw = rotated ? coll.hd : coll.hw, hd = rotated ? coll.hw : coll.hd;
  return { type: 'box', x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd };
}
function buildPlacedMesh(type, x, z, rot, rec) {
  const { group, coll } = placedVisual(type);
  group.position.set(x, 0, z); group.rotation.y = rot || 0;
  scene.add(group);
  const collRef = worldColliderFor(coll, x, z, rot);
  if (collRef) worldColliders.push(collRef);
  const entry = { group, collRef, prop: null, water: null };
  // fountains, ponds & lakes you build are drinkable
  if (typeof addWater === 'function' && (type === 'fountain' || type === 'pond' || type === 'lake')) entry.water = addWater(x, z, coll ? coll.r : 2.0);
  // bins you place are real rummage-able trash cans
  let binRec = null;
  if (type === 'bin' && state.trashCans) { binRec = { x, z, group, lid: null, refillAt: 0 }; state.trashCans.push(binRec); }
  if (typeof addProp === 'function') {
    const useAs = (type === 'bench') ? 'bench' : (type === 'tree' || type === 'pine' || type === 'blossom') ? 'tree' : null;   // NPCs sit/rest at these
    entry.prop = addProp({
      kind: type, group, x, z, rotY: rot || 0, coll: collRef, movable: type !== 'road',   // EVERYTHING you place can be re-moved (roads stay snapped)
      hw: coll && !coll.circle ? coll.hw : undefined, hd: coll && !coll.circle ? coll.hd : undefined,
      use: useAs, destroyable: type === 'house', placed: true, rec, meshEntry: entry,
      onMove: (nx, nz) => {
        if (entry.water) { entry.water.x = nx; entry.water.z = nz; }   // drinkable water follows the basin
        if (binRec) { binRec.x = nx; binRec.z = nz; }                   // the bin stays searchable where you drop it
      },
    });
  }
  return entry;
}
function rebuildPlaced() {   // on load
  (state.placed || []).forEach(r => plannerMeshes.push(buildPlacedMesh(r.type, r.x, r.z, r.rot || 0, r)));
}

// ── The translucent preview that follows the crosshair ──
let _ghost = null;
function makeGhost() {
  if (_ghost) { scene.remove(_ghost); _ghost = null; }
  const { group } = placedVisual(state.plannerSel || 'house');
  group.traverse(o => {
    if (!o.isMesh) return;
    const m = o.material.clone();
    m.transparent = true; m.opacity = 0.55; m.depthWrite = false;
    if (m.emissive !== undefined) { m.emissive = new THREE.Color(0x35a0ff); m.emissiveIntensity = 0.5; }
    o.material = m; o.castShadow = false; o.receiveShadow = false;
  });
  _ghost = group; scene.add(_ghost);
}

// ── Payment: President builds from the treasury (public works), else your own coins ──
function plannerIsGov() { return state.politics && state.politics.phase === 'president' && !(state.gov && state.gov.jailed); }
function planPaySrc() { return plannerIsGov() ? (state.planPaySrc || 'tax') : 'coins'; }   // President chooses tax vs own coins
function plannerBalance() { return planPaySrc() === 'tax' ? (state.gov.treasury || 0) : state.coins; }
// Public works are legitimate spending — paying with TAX here never raises corruption.
function plannerPay(cost) {
  if (planPaySrc() === 'tax') {
    if (state.gov && state.gov.treasury >= cost) { state.gov.treasury -= cost; if (typeof updateHappyHUD === 'function') updateHappyHUD(); return true; }
    return false;
  }
  if (state.coins >= cost) { state.coins -= cost; document.getElementById('coin-count').textContent = state.coins; return true; }
  return false;
}
function planTogglePaySrc() {
  if (!plannerIsGov()) return;
  state.planPaySrc = (state.planPaySrc === 'coins') ? 'tax' : 'coins';
  showNotif(state.planPaySrc === 'tax' ? '🏛️ Paying from the tax treasury (public works — no corruption)' : '🪙 Paying from your own coins');
  updatePlannerBal(); updatePayBtn();
}
function updatePayBtn() {
  const b = document.getElementById('plan-pay'); if (!b) return;
  const gov = plannerIsGov();
  b.style.display = gov ? '' : 'none';
  b.textContent = planPaySrc() === 'tax' ? '🏛️ Tax' : '🪙 Coins';
  b.classList.toggle('tax', planPaySrc() === 'tax');
}
// Opened from the President panel's "Build a public home" button — jump straight into build mode
function openPlannerForHome() {
  if (typeof closePolitics === 'function') closePolitics();
  state.plannerSel = 'house'; state.planPaySrc = 'tax';
  openPlanner();
  showNotif('🏗️ Build public homes (and anything else) anywhere — funded by tax money, no corruption');
}

// ── Enter / leave build mode ──
function openPlanner() {
  if (!state.gameStarted) return;
  // town planning is an OFFICE: only the Mayor or the President may use it (mayor pays own coins; tax is President-only)
  const ph = state.politics && state.politics.phase;
  if (!(ph === 'mayor' || ph === 'president')) { showNotif('🏗️ Only the Mayor or President can use the town planner — get elected first!'); return; }
  if (state.inHouse || state.inShop || state.inShelter || state.inBoughtHome || state.inBiz || (state.gov && state.gov.jailed)) { showNotif('Come outside first to plan the town'); return; }
  state.planning = true;
  state.uiOpen = true;
  if (!state.plannerSel) state.plannerSel = 'house';
  if (state.plannerRot == null) state.plannerRot = 0;
  state.planCenter = { x: catGroup.position.x, z: catGroup.position.z };
  state.planHeight = state.planHeight || 74;
  state.planMove = false; state.planDemolish = false; _grabbed = null;
  _lastRoad = null;
  makeGhost();
  renderPalette(); updatePlannerBal(); updatePlanButtons(); updateRoadPad(); updatePayBtn();
  document.body.classList.add('planning');
  document.getElementById('plan-ui').classList.add('show');
}
function closePlanner() {
  if (_grabbed) planDrop();
  state.planning = false; state.uiOpen = false; state.planMove = false; state.planDemolish = false; _panning = false;
  if (_ghost) { scene.remove(_ghost); _ghost = null; }
  document.body.classList.remove('planning');
  document.getElementById('plan-ui').classList.remove('show');
  if (typeof saveGame === 'function') saveGame();
}

// ── Per-frame: drive the top-down camera + glue the ghost under the crosshair ──
function updatePlannerFrame() {
  const c = state.planCenter, h = state.planHeight;
  camera.position.x += (c.x - camera.position.x) * 0.2;
  camera.position.z += (c.z + h * 0.5 - camera.position.z) * 0.2;
  camera.position.y += (h - camera.position.y) * 0.2;
  camera.lookAt(c.x, 0, c.z);
  camera.updateMatrixWorld(true);
  const bob = 0.15 + 0.05 * Math.sin(performance.now() * 0.004);
  const fp = (typeof floorPoint === 'function') ? floorPoint(window.innerWidth / 2, window.innerHeight / 2) : null;
  if (state.planMove && _grabbed) {                 // a grabbed structure follows the crosshair
    if (fp) moveProp(_grabbed, fp.x, fp.z, _grabbed.rotY);
    _grabbed.group.position.y = _grabBaseY + 0.6 + bob;
  } else if (_ghost && _ghost.visible) {            // the new-piece preview follows the crosshair
    if (fp) _ghost.position.set(fp.x, bob, fp.z);
    _ghost.rotation.y = state.plannerRot || 0;
  }
  renderer.render(scene, camera);
}

// ── Move existing structures: grab the one under the crosshair, pan it, drop it ──
let _grabbed = null, _grabBaseY = 0;
const PROP_LABEL = { house: 'building', tree: 'tree', pine: 'pine tree', blossom: 'blossom tree', flowers: 'flower bed', bin: 'trash bin', bench: 'bench', lamp: 'lamp', fence: 'fence', fountain: 'fountain', pond: 'pond', lake: 'lake', school: 'school', picnic: 'picnic blanket',
  biz_cafe: 'café', biz_bakery: 'bakery', biz_market: 'market', biz_factory: 'factory', work_cafe: 'café', work_bakery: 'bakery', work_market: 'market', work_store: 'general store' };
function planToggleMove() {
  state.planMove = !state.planMove;
  if (state.planMove) state.planDemolish = false;
  if (!state.planMove && _grabbed) planDrop();
  if (_ghost) _ghost.visible = !(state.planMove || state.planDemolish);
  updatePlanButtons(); updateRoadPad();
}
function planToggleDemolish() {
  state.planDemolish = !state.planDemolish;
  if (state.planDemolish) { if (_grabbed) planDrop(); state.planMove = false; }
  if (_ghost) _ghost.visible = !(state.planMove || state.planDemolish);
  updatePlanButtons(); updateRoadPad();
}
function planDemolishCenter() {
  const fp = (typeof floorPoint === 'function') ? floorPoint(window.innerWidth / 2, window.innerHeight / 2) : null;
  const cx = fp ? fp.x : state.planCenter.x, cz = fp ? fp.z : state.planCenter.z;
  let best = null, bd = 90;
  townProps.forEach(p => { if (p.kind !== 'house' || !p.destroyable) return; const d = (p.x - cx) ** 2 + (p.z - cz) ** 2; if (d < bd) { bd = d; best = p; } });
  if (!best) { showNotif('No house to demolish near the crosshair (your home & the shops can\'t be knocked down)'); return; }
  demolishHouse(best);
}
function demolishHouse(prop) {
  scene.remove(prop.group);
  if (prop.sign) scene.remove(prop.sign);
  if (prop.coll) { const i = worldColliders.indexOf(prop.coll); if (i >= 0) worldColliders.splice(i, 1); }
  const t = townProps.indexOf(prop); if (t >= 0) townProps.splice(t, 1);
  if (prop.placed) {   // a planner-built house — also drop its saved record + mesh entry
    if (prop.rec && state.placed) { const j = state.placed.indexOf(prop.rec); if (j >= 0) state.placed.splice(j, 1); }
    if (prop.meshEntry) { const k = plannerMeshes.indexOf(prop.meshEntry); if (k >= 0) plannerMeshes.splice(k, 1); }
  }
  if (typeof buildRubble === 'function') buildRubble(prop.x, prop.z);   // leave ruins behind
  if (typeof makeHomeless === 'function') makeHomeless();               // its residents are now homeless
  if (typeof sfx === 'function') sfx('catch');
  showNotif('💥 Demolished! Rubble left behind — send a crew to clear it. ' + (state.homelessCount || 0) + ' now homeless');
  if (typeof saveGame === 'function') saveGame();
}
function planGrabNearest() {
  const fp = (typeof floorPoint === 'function') ? floorPoint(window.innerWidth / 2, window.innerHeight / 2) : null;
  const cx = fp ? fp.x : state.planCenter.x, cz = fp ? fp.z : state.planCenter.z;
  let best = null, bd = 90;   // within ~9.5 units of the crosshair
  townProps.forEach(p => { if (!p.movable) return; const d = (p.x - cx) ** 2 + (p.z - cz) ** 2; if (d < bd) { bd = d; best = p; } });
  if (!best) { showNotif('No structure near the crosshair — pan over one, then Grab'); return; }
  _grabbed = best; _grabBaseY = best.group.position.y;
  showNotif('✊ Grabbed a ' + (PROP_LABEL[best.kind] || 'structure') + ' — pan to move it · ↻ rotate · ✓ Drop');
  updatePlanButtons();
}
function planDrop() {
  if (!_grabbed) return;
  _grabbed.group.position.y = _grabBaseY;
  if (_grabbed.rec) {   // a planner-built piece: persist the move straight into its saved record
    _grabbed.rec.x = +_grabbed.x.toFixed(2); _grabbed.rec.z = +_grabbed.z.toFixed(2); _grabbed.rec.rot = _grabbed.rotY || 0;
  } else {
    state.structXf = state.structXf || {};
    state.structXf[_grabbed.id] = { x: +_grabbed.x.toFixed(2), z: +_grabbed.z.toFixed(2), rotY: _grabbed.rotY || 0 };
  }
  showNotif('✓ Placed the ' + (PROP_LABEL[_grabbed.kind] || 'structure'));
  if (typeof sfx === 'function') sfx('coin');
  _grabbed = null; updatePlanButtons();
  if (typeof saveGame === 'function') saveGame();
}
function updatePlanButtons() {
  const mv = document.getElementById('plan-move'), dm = document.getElementById('plan-demolish'), pl = document.getElementById('plan-place'), hint = document.getElementById('plan-hint');
  if (!mv || !pl) return;
  mv.classList.toggle('on', state.planMove);
  if (dm) dm.classList.toggle('on', state.planDemolish);
  if (state.planDemolish) {
    mv.textContent = '✋ Move'; pl.textContent = '💥 Demolish';
    if (hint) hint.textContent = '💥 Demolish — aim a house under the crosshair, then tap Demolish';
  } else if (state.planMove) {
    mv.textContent = '🏠 New'; pl.textContent = _grabbed ? '✓ Drop' : '✊ Grab';
    if (hint) hint.textContent = _grabbed ? '✊ Holding — pan to move · ↻ rotate · ✓ Drop it' : '✋ Move — pan a structure under the crosshair, then Grab';
  } else {
    mv.textContent = '✋ Move'; pl.textContent = '✓ Place';
    if (hint) hint.textContent = '🏗️ Build · drag to look around · aim the crosshair';
  }
}

// ── Placing / rotating / undo / zoom / pan ──
function planPlaceCenter() {
  if (state.planDemolish) { planDemolishCenter(); return; }
  if (state.planMove) { _grabbed ? planDrop() : planGrabNearest(); return; }
  if (!_ghost) return;
  if (state.plannerSel === 'road') { const s = snapRoadToGrid(_ghost.position.x, _ghost.position.z); doPlace('road', s.x, s.z, s.rot); return; }   // roads snap flush to neighbours
  plannerPlace(_ghost.position.x, _ghost.position.z);
}
function plannerPlace(x, z) { doPlace(state.plannerSel, x, z, state.plannerRot || 0); }
let _lastRoad = null;
function doPlace(type, x, z, rot) {
  const item = PLANNER_ITEMS.find(i => i.type === type); if (!item) return false;
  if (Math.abs(x) > 110 || Math.abs(z) > 80) { showNotif('That\'s outside the town'); return false; }
  if (!plannerPay(item.cost)) { showNotif('Not enough ' + (planPaySrc() === 'tax' ? 'tax money' : 'coins') + ' for a ' + item.name + (planPaySrc() === 'tax' ? ' — switch to 🪙 Coins?' : '')); return false; }
  const rec = { type, x: +x.toFixed(1), z: +z.toFixed(1), rot: rot || 0 };
  (state.placed = state.placed || []).push(rec);
  plannerMeshes.push(buildPlacedMesh(rec.type, rec.x, rec.z, rec.rot, rec));
  if (type === 'road') _lastRoad = { x: rec.x, z: rec.z, rot: rec.rot };   // remember it, to extend from
  if (type === 'house') addPlacedResidents();                              // a new home brings newcomers to town
  if (typeof sfx === 'function') sfx('coin');
  showNotif(item.icon + ' ' + item.name + ' placed');
  updatePlannerBal();
  if (typeof saveGame === 'function') saveGame();
  return true;
}
// A house you build first takes in the homeless; only once nobody's homeless does it
// bring brand-new residents (and the population actually grows).
function addPlacedResidents() {
  const r = (typeof rehouseOrGrow === 'function') ? rehouseOrGrow() : { rehoused: 0, grow: 2 };
  if (r.grow > 0) {
    if (typeof addCommuter === 'function') { for (let i = 0; i < r.grow; i++) addCommuter(); }
    if (typeof addStreetCat === 'function') addStreetCat();
  }
  if (typeof updatePopulationHUD === 'function') updatePopulationHUD();
  if (r.rehoused > 0) showNotif('🏠 Housed ' + r.rehoused + ' homeless — ' + (state.homelessCount || 0) + ' still need a home');
}
// The road tile nearest a point (so extending/snapping works on ANY road, any session)
function nearestPlacedRoad(x, z) {
  let best = null, bd = Infinity;
  (state.placed || []).forEach(r => { if (r.type !== 'road') return; const d = (r.x - x) ** 2 + (r.z - z) ** 2; if (d < bd) { bd = d; best = r; } });
  return best;
}
// When you drop a road near an existing one, snap it flush onto the 6-unit road grid
function snapRoadToGrid(x, z) {
  const near = nearestPlacedRoad(x, z);
  if (!near || (near.x - x) ** 2 + (near.z - z) ** 2 > 100) return { x: +x.toFixed(1), z: +z.toFixed(1), rot: state.plannerRot || 0 };  // no road within 10 → free placement
  const dx = x - near.x, dz = z - near.z;
  if (Math.abs(dx) >= Math.abs(dz)) return { x: +(near.x + (dx >= 0 ? 6 : -6)).toFixed(1), z: near.z, rot: 0 };            // extend E/W, flush
  return { x: near.x, z: +(near.z + (dz >= 0 ? 6 : -6)).toFixed(1), rot: Math.PI / 2 };                                    // extend N/S, flush
}
// Lay the next road tile flush against the nearest road, in the tapped direction
function planExtendRoad(dir) {
  if (state.plannerSel !== 'road') plannerSelect('road');
  const cx = _ghost ? _ghost.position.x : state.planCenter.x, cz = _ghost ? _ghost.position.z : state.planCenter.z;
  const base = _lastRoad || nearestPlacedRoad(cx, cz) || { x: cx, z: cz, rot: 0 };
  const horiz = (dir === 'e' || dir === 'w');
  const rot = horiz ? 0 : Math.PI / 2;              // tiles are 6 long × 4 wide; 6-spacing keeps them flush
  const x = base.x + (dir === 'e' ? 6 : dir === 'w' ? -6 : 0);
  const z = base.z + (dir === 's' ? 6 : dir === 'n' ? -6 : 0);
  if (doPlace('road', x, z, rot)) {
    _lastRoad = { x: +x.toFixed(1), z: +z.toFixed(1), rot };
    state.planCenter.x = x; state.planCenter.z = z;    // follow the road as it grows
  }
}
function plannerRotate() {
  if (state.planMove && _grabbed) { _grabbed.rotY = ((_grabbed.rotY || 0) + Math.PI / 4) % (Math.PI * 2); moveProp(_grabbed, _grabbed.x, _grabbed.z, _grabbed.rotY); return; }
  state.plannerRot = ((state.plannerRot || 0) + Math.PI / 4) % (Math.PI * 2);
}
function plannerUndo() {
  if (!state.placed || !state.placed.length) { showNotif('Nothing to undo'); return; }
  const rec = state.placed.pop();
  const m = plannerMeshes.pop();
  if (m) {
    scene.remove(m.group);
    if (m.collRef) { const i = worldColliders.indexOf(m.collRef); if (i >= 0) worldColliders.splice(i, 1); }
    if (m.prop && typeof townProps !== 'undefined') { const j = townProps.indexOf(m.prop); if (j >= 0) townProps.splice(j, 1); }
    if (m.water && typeof removeWater === 'function') removeWater(m.water);
  }
  if (rec && rec.type === 'road') _lastRoad = null;
  updatePlannerBal();
  if (typeof saveGame === 'function') saveGame();
}
function planZoom(dir) { state.planHeight = Math.max(34, Math.min(128, (state.planHeight || 74) + dir * 12)); }

// drag on the 3D view to look around (pan the top-down camera)
let _panning = false, _panLX = 0, _panLY = 0;
function plannerPointerDown(x, y) { if (!state.planning) return false; _panning = true; _panLX = x; _panLY = y; return true; }
function plannerPointerMove(x, y) {
  if (!state.planning || !_panning) return false;
  const k = state.planHeight / window.innerHeight * 1.4;
  state.planCenter.x = Math.max(-110, Math.min(110, state.planCenter.x - (x - _panLX) * k));
  state.planCenter.z = Math.max(-80, Math.min(80, state.planCenter.z - (y - _panLY) * k));
  _panLX = x; _panLY = y;
  return true;
}
function plannerPointerUp() { if (!state.planning) return false; _panning = false; return true; }

// ── Palette + balance UI ──
function renderPalette() {
  const el = document.getElementById('plan-palette'); if (!el) return;
  el.innerHTML = PLANNER_ITEMS.map(i =>
    `<button class="plan-item${state.plannerSel === i.type ? ' sel' : ''}" onclick="plannerSelect('${i.type}')">${i.icon}<small>${i.name}<br>${i.cost.toLocaleString('en-US')}</small></button>`).join('');
}
function plannerSelect(type) { state.plannerSel = type; renderPalette(); if (state.planning) makeGhost(); updateRoadPad(); }
function updateRoadPad() {
  const pad = document.getElementById('plan-roadpad');
  if (pad) pad.classList.toggle('show', state.plannerSel === 'road' && !state.planMove && !state.planDemolish);
}
function updatePlannerBal() {
  const el = document.getElementById('plan-bal');
  if (el) el.textContent = (planPaySrc() === 'tax' ? '🏛️ ' : '🪙 ') + Math.round(plannerBalance()).toLocaleString('en-US');
}

// ── Rename the streets (the 3D signs re-texture live) ──
function applyStreetNames() {
  if (typeof streetSigns === 'undefined') return;
  const names = state.streetNames || {};
  ['main', 'north', 'south'].forEach(k => { if (names[k]) setStreetText(k, names[k]); });
}
function setStreetText(key, name) {
  (streetSigns[key] || []).forEach(blade => {
    blade.material.map = makeTextSign(name, '#2a6a3a', '#ffffff', 256, 52);
    blade.material.needsUpdate = true;
  });
}
function renameStreet(key, name) {
  name = (name || '').toUpperCase().trim().slice(0, 18) || 'STREET';
  (state.streetNames = state.streetNames || {})[key] = name;
  setStreetText(key, name);
  if (typeof saveGame === 'function') saveGame();
}
function openStreetRename() {
  const k = (prompt('Rename which street?  (type: main / north / south)') || '').toLowerCase().trim();
  if (!['main', 'north', 'south'].includes(k)) { if (k) showNotif('Type main, north, or south'); return; }
  const name = prompt('New name for the ' + k + ' street:');
  if (!name) return;
  renameStreet(k, name);
  showNotif('🚏 Renamed to "' + name.toUpperCase().trim() + '"');
}
