// civic.js — President public works: hospitals, schools & shelters. Each is a real
// ENTERABLE building that employs townsfolk (jobs) and pays the government a daily income.
// Reuses the shared business interior scene (bizScene) + the inBiz render path.

const CIVICS = [
  { id: 'hospital', name: 'Hospital', icon: '🏥', cost: 500000, jobs: 6, gov: 700000, happy: 10, wall: 0xeef0f4 },
  { id: 'school',   name: 'School',   icon: '🏫', cost: 400000, jobs: 5, gov: 520000, happy: 9,  wall: 0xe4b45a },
  { id: 'shelter',  name: 'Shelter',  icon: '🏘️', cost: 320000, jobs: 4, gov: 340000, happy: 8,  wall: 0xc6cdd2, houses: 4 },
];
const CIVIC_LOTS = { hospital: { x: -26, z: 53 }, school: { x: 0, z: 53 }, shelter: { x: 26, z: 53 } };  // north strip; doors face south (town side)
function civicDef(id) { return CIVICS.find(c => c.id === id); }
function ownsCivic(id) { return (state.civics || []).includes(id); }
function ownedCivicIds() { return CIVICS.filter(c => ownsCivic(c.id)).map(c => c.id); }
function civicJobs() { return ownedCivicIds().reduce((s, id) => s + civicDef(id).jobs, 0); }             // people employed by public works
function civicDailyGov() { return ownedCivicIds().reduce((s, id) => s + civicDef(id).gov, 0) - civicJobs() * WORKER_SALARY; }  // net treasury change/day

// ── The building in town ──
const civicBuildings = {};
function buildCivicBuilding(id) {
  if (civicBuildings[id]) return;
  const lot = CIVIC_LOTS[id], def = civicDef(id); if (!lot || !def) return;
  const g = new THREE.Group();
  const add = m => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const B = (w, h, d, c, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }))); me.position.set(x, y, z); return me; };
  B(9, 5, 7, def.wall, 0, 2.5, 0);                                           // hall
  const roof = add(new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.5, 7.4), new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.85 }))); roof.position.y = 5.25;
  B(2.2, 3, 0.2, 0x5a3a1f, 0, 1.5, -3.52);                                   // door on the south (town) side
  [-3, 3].forEach(wx => B(1.8, 1.4, 0.15, 0xbfe0ff, wx, 2.6, -3.52));        // windows
  const tex = makeTextSign(def.icon + ' ' + def.name.toUpperCase(), '#2a2a2a', '#f0e0b0', 340, 60);
  add(new THREE.Mesh(new THREE.BoxGeometry(5, 0.8, 0.15), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }))).position.set(0, 4.1, -3.56);
  if (id === 'hospital') {   // a red cross
    const cm = new THREE.MeshStandardMaterial({ color: 0xd03a3a, roughness: 0.6 });
    add(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 0.1), cm)).position.set(3.1, 3.6, -3.55);
    add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.3, 0.1), cm)).position.set(3.1, 3.6, -3.55);
  }
  g.position.set(lot.x, 0, lot.z); scene.add(g);
  civicBuildings[id] = g;
  worldColliders.push({ type: 'box', x0: lot.x - 4, x1: lot.x + 4, z0: lot.z - 3, z1: lot.z + 3.5 });
}
function buildOwnedCivicBuildings() { ownedCivicIds().forEach(buildCivicBuilding); }

// ── Commission one (President, from the treasury) ──
function buildCivic(id) {
  if (typeof isPresident === 'function' && !isPresident()) { showNotif('Only the President can commission public works'); return; }
  if (ownsCivic(id)) { showNotif('That\'s already built'); return; }
  const def = civicDef(id); if (!def) return;
  const g = state.gov;
  if (!g || g.treasury < def.cost) { showNotif('Not enough tax money in the treasury for a ' + def.name); return; }
  g.treasury -= def.cost; g.spentPublic = (g.spentPublic || 0) + def.cost;
  (state.civics = state.civics || []).push(id);
  buildCivicBuilding(id);
  g.happiness = Math.min(100, g.happiness + def.happy);
  state.biz.jobsCreated = (state.biz.jobsCreated || 0) + def.jobs;
  let extra = '';
  if (id === 'shelter' && (state.homelessCount || 0) > 0) { const took = Math.min(state.homelessCount, def.houses || 4); state.homelessCount -= took; extra = ' · took in ' + took + ' homeless'; }
  if (typeof attractNewcomers === 'function') attractNewcomers(def.jobs + 2, 1);   // workers + their families move to town to fill the jobs
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif(def.icon + ' ' + def.name + ' opened! +' + def.jobs + ' jobs · newcomers moving to town · +' + def.happy + '😀' + extra);
  if (typeof updateHappyHUD === 'function') updateHappyHUD();
  if (typeof updatePopulationHUD === 'function') updatePopulationHUD();
  if (typeof renderPolitics === 'function') renderPolitics();
  if (typeof refreshBusinessIfOpen === 'function') refreshBusinessIfOpen();
  if (typeof saveGame === 'function') saveGame();
  if (typeof playRibbonCutscene === 'function' && !state.inBiz) {   // 🎬 grand-opening ribbon-cutting (only if you're out in town to see it)
    const pol = document.getElementById('politics'); if (pol) pol.classList.remove('show');
    state.uiOpen = false;
    playRibbonCutscene(id);
  }
}

// ── Enter / leave (shares bizScene + the state.inBiz render path) ──
function enterCivic(id) {
  if (!ownsCivic(id)) return;
  const def = civicDef(id);
  state.inBiz = true; state.currentBiz = id; state.inCivic = id;
  if (bizScene.background) {
    bizScene.background.set(id === 'hospital' ? 0xd2dde4 : id === 'school' ? 0xe3d3ad : 0xd8cfc2);   // soft walls beyond the room, not harsh black
    if (state.darkMode) bizScene.background.multiplyScalar(0.6);   // 🌙 comfort mode softens the backdrop too
  }
  buildCivicInterior(id);
  bizScene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_IN);
  catGroup.position.set(0, 0, 7.5); catGroup.rotation.y = Math.PI;   // enter at the south door, facing in
  state.camYaw = 0; state.camHeight = 9.5; state.camDist = 7.5;
  camera.position.set(0, state.camHeight, 7.5 + state.camDist);
  document.getElementById('minimap').style.display = 'none';
  showDialogue(def.icon + ' ' + def.name, 'A public ' + def.name.toLowerCase() + ' for the town — ' + def.jobs + ' people work here, and it pays into the treasury every day.', 5200);
}

// A big, multi-room civic interior (24×18) — lobby up front, two rooms behind a central wall.
const CIVIC_ROOM = { RX: 12, RZ: 9 };
const CIVIC_SPOTS = [[0, 5.2], [-7, -5], [-4, 0.5], [7, -5], [4, 0.5], [0, -7]];   // reception BEHIND the desk (z6.2), then spread through the rooms
function buildCivicInterior(id) {
  _clearScene(bizScene); bizColliders.length = 0;
  const S = bizScene, { RX, RZ } = CIVIC_ROOM, WH = 3.3, WY = 1.65, wt = 0.2;
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const B = (w, h, d, m, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); me.position.set(x, y, z); return me; };
  const theme = { hospital: { wall: 0xeaf1f5, floor: 0xcfdbe2, wain: 0x6fa9c8, trim: 0xdfe8ee, rug: 0x9cc6dc }, school: { wall: 0xf4e6c2, floor: 0xba8f5e, wain: 0x9a6a3a, trim: 0x7a5230, rug: 0xc06a5a }, shelter: { wall: 0xe6ddcf, floor: 0xcbb79a, wain: 0x8a6a4a, trim: 0x6a4a2c, rug: 0xb07a5a } }[id] || {};
  const wallMat = pbr(theme.wall, 0.96), floorMat = pbr(theme.floor, 0.92);
  add(new THREE.Mesh(new THREE.BoxGeometry(RX * 2, 0.1, RZ * 2), floorMat)).position.y = -0.05;
  // a checkerboard tint on the floor + a runner so it isn't a flat white slab
  for (let tx = -RX + 2; tx < RX; tx += 4) for (let tz = -RZ + 2; tz < RZ; tz += 4) if (((tx + tz) / 4) % 2 === 0) { const tile = add(new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.02, 3.6), pbr(theme.trim, 0.9))); tile.position.set(tx, 0.005, tz); }
  add(new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, RZ * 2 - 1), pbr(theme.rug, 0.95))).position.set(0, 0.02, 0);   // central runner
  // warm, softer lighting (the pure-white blow-out is gone)
  S.add(new THREE.AmbientLight(0xfff4e6, 0.5)); S.add(new THREE.HemisphereLight(0xfff6ea, theme.wain, 0.4));
  [[-6, -5], [6, -5], [0, 0], [-6, 5], [6, 5]].forEach(([lx, lz]) => { const pl = new THREE.PointLight(0xffe9c8, 0.5, 26, 2); pl.position.set(lx, 4, lz); S.add(pl); });
  // ── wall builders (with an optional doorway gap) ──
  const segX = (x0, x1, z) => { B(x1 - x0, WH, wt, wallMat, (x0 + x1) / 2, WY, z); bizColliders.push({ type: 'box', x0, x1, z0: z - 0.22, z1: z + 0.22 }); };
  const segZ = (z0, z1, x) => { B(wt, WH, z1 - z0, wallMat, x, WY, (z0 + z1) / 2); bizColliders.push({ type: 'box', x0: x - 0.22, x1: x + 0.22, z0, z1 }); };
  const wallX = (z, x0, x1, gc, gw) => { if (!gw) { segX(x0, x1, z); return; } if (gc - gw / 2 > x0) segX(x0, gc - gw / 2, z); if (gc + gw / 2 < x1) segX(gc + gw / 2, x1, z); B(gw, 0.6, wt, wallMat, gc, WH - 0.3, z); };
  const wallZ = (x, z0, z1, gc, gw) => { if (!gw) { segZ(z0, z1, x); return; } if (gc - gw / 2 > z0) segZ(z0, gc - gw / 2, x); if (gc + gw / 2 < z1) segZ(gc + gw / 2, z1, x); B(wt, 0.6, gw, wallMat, x, WH - 0.3, gc); };
  wallX(-RZ, -RX, RX);                 // back wall
  wallX(RZ, -RX, RX, 0, 2.8);          // front wall + entrance
  wallZ(-RX, -RZ, RZ); wallZ(RX, -RZ, RZ);   // side walls
  wallX(3.6, -RX, RX, 0, 2.8);         // lobby / back divider (doorway centre)
  wallZ(0, -RZ, 3.6, -2.2, 2.6);       // central wall splitting the two back rooms (doorway)
  // reception desk in the lobby
  B(4.2, 1.0, 1.0, pbr(0x8a8478, 0.85), 0, 0.5, 6.2); bizColliders.push({ type: 'box', x0: -2.1, x1: 2.1, z0: 5.7, z1: 6.7 });
  add(new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.7, 0.12), new THREE.MeshStandardMaterial({ map: makeTextSign(civicDef(id).icon + ' RECEPTION', '#2a2a2a', '#f0e0b0', 300, 58), roughness: 0.6 }))).position.set(0, 2.5, 8.85);
  [[-9, 5.5], [9, 5.5]].forEach(([x, z]) => { B(0.9, 0.45, 0.9, pbr(0x6a7a8a, 0.8), x, 0.25, z); B(0.9, 0.5, 0.12, pbr(0x6a7a8a, 0.8), x, 0.55, z - 0.4); });   // waiting chairs
  const beds = [], desks = [], boards = [], bunks = [];
  const themed = {
    hospital: () => {   // two wards of beds (sheet + blanket + pillow + headboard)
      const bed = (x, z) => {
        B(1.5, 0.4, 2.5, pbr(0xf3f5f8, 0.7), x, 0.3, z);            // frame
        B(1.42, 0.14, 2.4, pbr(0xffffff, 0.85), x, 0.5, z);         // sheet
        B(1.42, 0.18, 1.25, pbr(0x8fbfe0, 0.65), x, 0.56, z + 0.5); // blue blanket (foot end +z)
        B(1.15, 0.16, 0.5, pbr(0xffffff, 0.9), x, 0.6, z - 0.95);   // pillow (head end -z)
        B(1.5, 0.78, 0.12, pbr(0xcdd8e0, 0.7), x, 0.55, z - 1.24);  // headboard
        bizColliders.push({ type: 'box', x0: x - 0.85, x1: x + 0.85, z0: z - 1.3, z1: z + 1.3 });
        beds.push([x, z]);
      };
      [-7, -3].forEach(z => { bed(-9.3, z); bed(9.3, z); });
      bed(-4.5, -7.5); bed(4.5, -7.5);
      B(1.2, 1.8, 0.5, pbr(0xeef2f6, 0.5), -0.6, 0.9, -8.5); B(1.2, 1.8, 0.5, pbr(0xeef2f6, 0.5), 0.6, 0.9, -8.5);   // supply cabinets
      B(0.5, 1.5, 0.06, pbr(0x3aa86a, 0.5), 0, 2.2, -8.9); B(1.4, 0.5, 0.06, pbr(0x3aa86a, 0.5), 0, 2.2, -8.9);      // green cross
    },
    school: () => {   // two classrooms: chalkboards + rows of desks with colourful chairs
      [-6, 6].forEach(bx => { B(4, 1.4, 0.12, pbr(0x264a38, 0.85), bx, 1.7, -8.86); B(4.2, 0.1, 0.22, pbr(0xc9a066, 0.7), bx, 0.98, -8.78); boards.push([bx, -8.2]); });
      const cols = [0xd06a5a, 0x5a8ac0, 0x6aa86a, 0xd0a040, 0xb06ac0]; let ci = 0;
      const desk = (x, z) => { B(1.0, 0.5, 0.6, pbr(0xc09a5e, 0.8), x, 0.5, z); B(1.02, 0.06, 0.62, pbr(0x8a6a3a, 0.8), x, 0.78, z); B(0.5, 0.46, 0.5, pbr(cols[ci++ % cols.length], 0.8), x, 0.25, z + 0.55); B(0.5, 0.5, 0.06, pbr(cols[(ci) % cols.length], 0.8), x, 0.75, z + 0.78); bizColliders.push({ type: 'box', x0: x - 0.55, x1: x + 0.55, z0: z - 0.35, z1: z + 0.68 }); desks.push([x, z]); };
      [-8.5, -5.5, -3].forEach(x => [-5.5, -2].forEach(z => desk(x, z)));
      [3, 5.5, 8.5].forEach(x => [-5.5, -2].forEach(z => desk(x, z)));
    },
    shelter: () => {   // dorm bunks with coloured blankets + pillows, and common tables
      const blk = [0x9a5a5a, 0x5a7a9a, 0x6a9a6a, 0xc0904a];
      const bunk = (x, z, ci) => { let k = ci; for (const y of [0.35, 1.2]) { B(1.6, 0.26, 2.2, pbr(0x8a6a4a, 0.8), x, y, z); B(1.5, 0.14, 2.0, pbr(0xe6ddc8, 0.9), x, y + 0.17, z); B(1.5, 0.16, 1.1, pbr(blk[k++ % 4], 0.85), x, y + 0.2, z + 0.5); B(1.0, 0.15, 0.42, pbr(0xf2ede2, 0.9), x, y + 0.23, z - 0.9); bunks.push([x, y + 0.2, z]); } B(0.12, 1.6, 0.12, pbr(0x6a4a2c, 0.8), x - 0.7, 0.9, z - 1.0); B(0.12, 1.6, 0.12, pbr(0x6a4a2c, 0.8), x + 0.7, 0.9, z - 1.0); bizColliders.push({ type: 'box', x0: x - 0.9, x1: x + 0.9, z0: z - 1.15, z1: z + 1.15 }); };
      let bc = 0;[-7, -2.5].forEach(z => { bunk(-9, z, bc++); bunk(9, z, bc++); });
      B(2.2, 0.7, 1.0, pbr(0x8a6a4a, 0.8), -4.5, 0.5, -7.2); B(2.2, 0.7, 1.0, pbr(0x8a6a4a, 0.8), 4.5, 0.5, -7.2);   // common tables
      bizColliders.push({ type: 'box', x0: -5.6, x1: -3.4, z0: -7.7, z1: -6.7 }); bizColliders.push({ type: 'box', x0: 3.4, x1: 5.6, z0: -7.7, z1: -6.7 });
    },
  };
  (themed[id] || themed.hospital)();
  // ── wall trim so the rooms aren't bare white: a wainscot band, a clock & framed pictures ──
  const wc = pbr(theme.wain, 0.85);
  B(RX * 2, 0.9, 0.05, wc, 0, 0.5, -RZ + 0.12); B(0.05, 0.9, RZ * 2, wc, -RX + 0.12, 0.5, 0); B(0.05, 0.9, RZ * 2, wc, RX - 0.12, 0.5, 0);
  B(0.55, 0.55, 0.05, pbr(0xffffff, 0.6), 4.5, 2.5, -RZ + 0.14); B(0.04, 0.2, 0.03, pbr(0x222228, 0.4), 4.5, 2.56, -RZ + 0.17); B(0.15, 0.035, 0.03, pbr(0x222228, 0.4), 4.55, 2.5, -RZ + 0.17);   // clock
  [[-RX + 0.13, -3.5, 0x8ab0d0], [-RX + 0.13, 3.5, 0xd0b08a], [RX - 0.13, -3.5, 0x9ad0a0], [RX - 0.13, 3.5, 0xd09ab0]].forEach(([x, z, c]) => { B(0.05, 0.75, 0.95, wc, x, 2.15, z); B(0.03, 0.58, 0.78, pbr(c, 0.7), x + (x < 0 ? 0.02 : -0.02), 2.15, z); });   // framed pictures
  // any furniture you've bought & arranged for THIS building (biz decor context, keyed per building)
  if (typeof decorList === 'function' && typeof buildDecorItem === 'function') {
    decorReg.biz = {}; if (typeof selRings !== 'undefined') selRings.biz = null;
    decorList('biz').forEach(did => buildDecorItem(did, 'biz'));
  }
  spawnCivicStaff(id);
  spawnCivicOccupants(id, { beds, desks, boards, bunks });   // patients / students / sleepers actually using the place
  // 🎮 a minigame host in the lobby: zap germs at the hospital, catch paper planes at the school
  state.civicGiver = null;
  if ((id === 'hospital' || id === 'school') && typeof buildHuman === 'function') {
    const cfg = (typeof randomPersonCfg === 'function') ? randomPersonCfg() : {};
    const h = buildHuman(cfg);
    h.group.position.set(4.5, 0, 5.4); h.group.rotation.y = Math.PI; bizScene.add(h.group);
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf0d080, emissive: 0x806000, emissiveIntensity: 0.8, roughness: 0.4 }));
    bubble.position.y = 2.5; h.group.add(bubble);
    state.civicGiver = { site: id, name: id === 'hospital' ? 'Nurse Pip' : 'Ms. Plume', job: id === 'hospital' ? 'germs' : 'planes',
      hasJob: true, group: h.group, parts: h.parts, bubble, x: 4.5, z: 5.4, phase: Math.random() * 6 };
  }
  if (typeof applyComfortLighting === 'function') applyComfortLighting(bizScene);   // respect 🌙 comfort mode on rebuild
}

function spawnCivicStaff(id) {
  if (typeof clearBizWorkers === 'function') clearBizWorkers();
  const def = civicDef(id), n = Math.min(def.jobs, CIVIC_SPOTS.length);
  for (let i = 0; i < n; i++) {
    const reception = (i === 0);
    const spot = CIVIC_SPOTS[i];
    const task = reception ? 'counter' : ['stock', 'sweep', 'counter'][i % 3];
    const { group, parts } = buildHuman(randomPersonCfg());
    group.position.set(spot[0], 0, spot[1]);
    group.rotation.y = reception ? 0 : task === 'stock' ? Math.PI : Math.random() * 6;   // reception faces the entrance
    bizScene.add(group);
    state.bizWorkers.push({ type: 'human', task, group, parts, phase: Math.random() * 6, hx: spot[0], hz: spot[1], baseRy: group.rotation.y });
  }
}

// ── The people who actually USE the building (patients / students / sleepers) + visitors ──
function spawnCivicOccupants(id, L) {
  const hour = state.dayTime * 24, night = (typeof isNight === 'function' && isNight());
  const push = (cfg, fn) => { const { group, parts } = buildHuman(cfg); bizScene.add(group); const o = { type: 'human', group, parts, phase: Math.random() * 6 }; fn(o); state.bizWorkers.push(o); return o; };
  const kid = () => ({ ...randomPersonCfg(), height: 0.58 + Math.random() * 0.14, build: 'slim' });
  const lie = (o, x, y, zc) => { o.group.position.set(x, y, zc + 0.8); o.group.rotation.set(-Math.PI / 2, 0, 0.06); if (o.parts.legs) o.parts.legs.forEach(l => l.rotation.x = 0.12); if (o.parts.arms) o.parts.arms.forEach(a => a.rotation.x = 0.12); o.pose = 'lie'; };
  const sit = (o, x, z, faceY, seatY) => { const h = o.group.scale.y || 1; o.group.position.set(x, seatY - 0.82 * h, z); o.group.rotation.set(0, faceY, 0); if (o.parts.legs) o.parts.legs.forEach(l => l.rotation.x = -1.4); if (o.parts.arms) o.parts.arms.forEach(a => a.rotation.x = -0.2); o.pose = 'sit'; };
  if (id === 'hospital') {
    L.beds.slice(0, 5).forEach(([x, z]) => push(randomPersonCfg(), o => lie(o, x, 0.55, z)));                                  // patients in beds
    [[-9, 5.2], [9, 5.2]].forEach(([x, z]) => push(randomPersonCfg(), o => { sit(o, x, z, Math.PI, 0.5); if (o.parts.arms) o.parts.arms[1].rotation.x = -1.2; }));   // injured waiting (arm up in a sling)
    spawnCivicVisitor(id, 2);
  } else if (id === 'school') {
    if (hour >= 9 && hour < 17) {   // school hours 9–5: kids at their desks, a teacher at each board
      L.desks.slice(0, 10).forEach(([x, z]) => push(kid(), o => sit(o, x, z + 0.55, Math.PI, 0.5)));
      L.boards.forEach(([x, z]) => push(randomPersonCfg(), o => { o.group.position.set(x, 0, z + 0.7); o.group.rotation.y = 0; o.pose = 'teach'; }));
    } else spawnCivicVisitor(id, 1);
  } else if (id === 'shelter') {
    if (night) L.bunks.forEach(([x, y, z]) => push(randomPersonCfg(), o => lie(o, x, y, z)));                                // people sleeping in the bunks at night
    else { [[-4.5, -6.4], [4.5, -6.4]].forEach(([x, z]) => push(randomPersonCfg(), o => sit(o, x, z, 0, 0.5))); spawnCivicVisitor(id, 2); }
  }
}
// Static occupants breathe; the teacher gestures; visitors walk in, linger, and leave.
function updateCivicPose(w, t) {
  if (w.pose === 'visit') { updateCivicVisitor(w, t); return; }
  const ph = w.phase || 0, P = w.parts;
  if (P && P.torso) P.torso.scale.y = 1 + Math.sin(t * (w.pose === 'lie' ? 1.2 : 1.8) + ph) * (w.pose === 'lie' ? 0.03 : 0.02);
  if (w.pose === 'browse') {   // shopper: peering at the goods, occasionally reaching
    if (P && P.head) P.head.rotation.x = 0.25 + Math.sin(t * 0.8 + ph) * 0.08;
    if (P && P.arms) { const reach = Math.sin(t * 0.6 + ph) > 0.6; P.arms[0].rotation.x = reach ? -1.05 : Math.sin(t + ph) * 0.05; }
  } else if (w.pose === 'teach' && P && P.arms) { P.arms[0].rotation.x = -1.25 + Math.sin(t * 2.3 + ph) * 0.5; if (P.head) P.head.rotation.y = Math.sin(t * 0.8 + ph) * 0.25; }
  else if (w.pose === 'sit') {
    if (P && P.head) P.head.rotation.y = Math.sin(t * 0.5 + ph) * 0.15;
    if (w.cafe && P && P.arms) P.arms[0].rotation.x = (Math.sin(t * 0.7 + ph) > 0.5) ? -1.35 : -0.25;   // raise the cup to sip
  }
}
const CIVIC_ENTRY = { x: 0, z: 7.6 };
function spawnCivicVisitor(id, n) {
  const T = { hospital: [4, -3], school: [0, 1], shelter: [-3, -4] }[id] || [0, 0];
  for (let i = 0; i < (n || 1); i++) {
    const { group, parts } = buildHuman(randomPersonCfg());
    group.position.set(0, 0, 9.6); group.visible = false; bizScene.add(group);
    state.bizWorkers.push({ type: 'human', pose: 'visit', group, parts, phase: Math.random() * 6, spd: 0.028 + Math.random() * 0.01, cstate: 'gone', ctimer: 40 + i * 160 + Math.random() * 220, tx: T[0] + (Math.random() - 0.5) * 5, tz: T[1] + (Math.random() - 0.5) * 3 });
  }
}
function updateCivicVisitor(w, t) {
  const spd = w.spd || 0.03;
  switch (w.cstate) {
    case 'gone': if (--w.ctimer <= 0) { w.group.position.set(0, 0, 9.6); w.group.visible = true; w.cstate = 'in'; } return;
    case 'in': if (stepPersonTo(w, CIVIC_ENTRY.x, CIVIC_ENTRY.z, spd)) w.cstate = 'toT'; return;
    case 'toT': if (stepPersonTo(w, w.tx, w.tz, spd)) { w.cstate = 'stay'; w.ctimer = 180 + Math.random() * 320; } return;
    case 'stay': idleHuman(w, t); if (--w.ctimer <= 0) w.cstate = 'back'; return;
    case 'back': if (stepPersonTo(w, CIVIC_ENTRY.x, CIVIC_ENTRY.z, spd)) w.cstate = 'out'; return;
    case 'out': if (stepPersonTo(w, 0, 9.8, spd)) { w.cstate = 'gone'; w.ctimer = 200 + Math.random() * 400; w.group.visible = false; } return;
  }
}
