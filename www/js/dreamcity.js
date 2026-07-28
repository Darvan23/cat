// ═══════════════════════════════════════════════════════════════════════════
//  🎢 DREAM CITY — the amusement park on the western frontier
//  Twice the size of the zoo: rides, games alley, food street, fireworks.
//  Day pass at the gate, ride tickets (🎟️) at the kiosk, wristband for all.
// ═══════════════════════════════════════════════════════════════════════════

const DC = { x0: -238, x1: -108, z0: -134, z1: 60, gateX: -108, gateZ: 0 };
const DC_PASS = 15;                          // gate day pass
const DC_STRIP_N = 5, DC_STRIP_COST = 12;    // 5 ride tickets a strip
const DC_BAND = 40;                          // wristband: unlimited rides today

let _dcGateOpen = false, _dcDoors = [], _dcGateColl = null;
let _dcManorColl = null, _dcFunColl = null;
const DC_R = {};                             // refs to every animated ride
const DC_FW = [];                            // live firework bursts
let dcBulbMat = null, dcWaterMat = null;

function dcPassValid() { return state.dcPassDay === (state.dayCount || 0); }
function dcBandOn() { return state.dcBandDay === (state.dayCount || 0); }
function catInDc() { const p = catGroup.position; return p.x > DC.x0 && p.x < DC.x1 && p.z > DC.z0 && p.z < DC.z1; }
function dcNight() { const d = state.dayTime || 0; return d < 0.24 || d > 0.76; }

// ── the rides catalogue (positions, prices, ride durations) ──
const DC_RIDES = {
  ferris:   { x: -158, z: 36,  e: '🎡', name: 'Grand Ferris Wheel', cost: 2, dur: 16, r: 4.0 },
  coaster:  { x: -192, z: -30, e: '🐉', name: 'The Dragon Coaster', cost: 2, dur: 15, r: 3.0 },
  carousel: { x: -136, z: 26,  e: '🎠', name: 'Carousel',           cost: 1, dur: 9,  r: 4.6 },
  drop:     { x: -200, z: 42,  e: '🗼', name: 'Star Drop Tower',    cost: 1, dur: 9,  r: 3.0 },
  swings:   { x: -180, z: 28,  e: '⛓️', name: 'Sky Swings',         cost: 1, dur: 10, r: 6.4 },
  teacups:  { x: -122, z: 32,  e: '🍵', name: 'Twirling Teacups',   cost: 1, dur: 9,  r: 5.2 },
  flume:    { x: -168, z: -48, e: '🪵', name: 'Log Flume',          cost: 1, dur: 12, r: 3.0 },
  train:    { x: -125, z: -85, e: '🚂', name: 'Dream Express',      cost: 1, dur: 26, r: 2.6 },
  slide:    { x: -214, z: 30,  e: '🌈', name: 'Rainbow Slide',      cost: 1, dur: 7,  r: 3.4 },
  dodgem:   { x: -190, z: -100, e: '🚗', name: 'Bumper Cars',       cost: 1, dur: 20, r: 3.0 },
};
// games alley stalls (each is a REAL minigame — 1 🎟️ a play, prizes for aces)
const DC_STALLS = [
  { x: -126, z: -22, game: 'darts',   e: '🎈', name: 'Balloon Darts',  col: 0xd0483a },
  { x: -136, z: -22, game: 'moles',   e: '🔨', name: 'Whack-a-Mole',   col: 0x8a6ac0 },
  { x: -146, z: -22, game: 'ducks',   e: '🦆', name: 'Lucky Ducks',    col: 0x4a9ad0 },
  { x: -156, z: -22, game: 'striker', e: '💪', name: 'High Striker',   col: 0xe08a30 },
  { x: -166, z: -22, game: 'cans',    e: '🥫', name: 'Can Knockdown',  col: 0x5aa050 },
  { x: -176, z: -22, game: 'claw',    e: '🧸', name: 'Claw Machine',   col: 0xd06a9a },
];
// food street: six stands, each fills the belly
const DC_FOOD = [
  { x: -136, z: 9,  e: '🍭', name: 'Cotton Candy', cost: 6, roof: 0xf090b8, line: 'A pink cloud on a stick — it melts on your whiskers!' },
  { x: -146, z: 9,  e: '🍿', name: 'Popcorn Cart', cost: 4, roof: 0xe8c040, line: 'Warm, buttery, impossible to stop eating.' },
  { x: -156, z: 9,  e: '🍦', name: 'Ice Cream',    cost: 5, roof: 0x9ad0e8, line: 'Two scoops, sprinkles, tiny spoon. Purrfection.' },
  { x: -136, z: -9, e: '🍎', name: 'Candy Apples', cost: 5, roof: 0xd0483a, line: 'Shiny, sticky, and worth every penny.' },
  { x: -146, z: -9, e: '🍕', name: 'Pizza Corner', cost: 7, roof: 0x5aa050, line: 'A slice bigger than your head!' },
  { x: -156, z: -9, e: '🥤', name: 'Fizzy Pop',    cost: 3, roof: 0x8a6ac0, line: 'Bubbles up your nose — the good kind.' },
];
const DC_WELL = { x: -114, z: -9 };
const DC_KIOSK = { x: -112, z: -6 };
const DC_GIFT = { x: -164, z: 14 };
const DC_STAGE = { x: -134, z: -68 };
const DC_MANOR = { x: -136, z: -44 };
const DC_FUN = { x: -118, z: -38 };

// ── shared little builders ──
function _dcBox(w, h, d, mat, x, y, z, ry) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; }
function _dcCyl(r0, r1, h, mat, x, y, z, seg) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg || 12), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; }
function _dcSign(text, bg, fg, w, h, x, y, z, ry) {
  if (typeof makeTextSign !== 'function') return null;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), new THREE.MeshStandardMaterial({ map: makeTextSign(text, bg, fg, Math.round(w * 90), Math.round(h * 90)), roughness: 0.6, emissive: 0x181008, emissiveIntensity: 0.35 }));
  m.position.set(x, y, z); if (ry) m.rotation.y = ry; scene.add(m); return m;
}
function _dcBulb(x, y, z) { const b = new THREE.Mesh(G.sph(0.09, 8, 6), dcBulbMat); b.position.set(x, y, z); scene.add(b); return b; }

// ── THE PARK ──────────────────────────────────────────────────────────────
function buildDreamCity() {
  dcBulbMat = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffc860, emissiveIntensity: 0.25, roughness: 0.5 });
  dcWaterMat = pbr(0x5ab6d8, 0.25);

  // pastel grounds + main paths
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(DC.x1 - DC.x0, DC.z1 - DC.z0), new THREE.MeshStandardMaterial({ color: 0x9ed08a, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set((DC.x0 + DC.x1) / 2, 0.02, (DC.z0 + DC.z1) / 2); ground.receiveShadow = true; scene.add(ground);
  const path = (x, z, w, d) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color: 0xe8d8c0, roughness: 0.95 })); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.04, z); p.receiveShadow = true; scene.add(p); };
  path(-146, 0, 76, 7);                       // the main avenue west from the gate
  path(-134, -10, 6, 128);                    // the cross avenue north–south
  path(-146, -22, 70, 6);                     // games alley walk
  path(-170, 30, 88, 6);                      // rides row north
  path(-120, 0, 26, 26);                      // entrance plaza

  // perimeter wall + battlement posts (castle style)
  const wallM = pbr(0xd8b8e0, 0.85), postM = pbr(0xb890c8, 0.8);
  const wall = (x, z, w, d) => { _dcBox(w, 2.4, d, wallM, x, 1.2, z); worldColliders.push({ type: 'box', x0: x - w / 2 - 0.1, x1: x + w / 2 + 0.1, z0: z - d / 2 - 0.1, z1: z + d / 2 + 0.1 }); };
  wall((DC.x0 + DC.x1) / 2, DC.z0, DC.x1 - DC.x0, 0.5);
  wall((DC.x0 + DC.x1) / 2, DC.z1, DC.x1 - DC.x0, 0.5);
  wall(DC.x0, (DC.z0 + DC.z1) / 2, 0.5, DC.z1 - DC.z0);
  wall(DC.x1, (DC.z0 - 3.5) / 2, 0.5, -3.5 - DC.z0);       // east wall south of the gate
  wall(DC.x1, (DC.z1 + 3.5) / 2, 0.5, DC.z1 - 3.5);        // east wall north of the gate
  for (let x = DC.x0; x <= DC.x1; x += 16) [DC.z0, DC.z1].forEach(z => _dcCyl(0.5, 0.6, 3.2, postM, x, 1.6, z, 8));
  for (let z = DC.z0; z <= DC.z1; z += 16) if (Math.abs(z) > 5) [DC.x0, DC.x1].forEach(x => _dcCyl(0.5, 0.6, 3.2, postM, x, 1.6, z, 8));

  // ── the gate: two candy towers, glowing arch, double doors ──
  [-5, 5].forEach(dz => {
    const t = _dcCyl(1.6, 1.9, 9, pbr(0xe8a0c8, 0.7), DC.gateX, 4.5, dz, 12);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.1, 2.6, 12), pbr(0x8a4ab0, 0.6)); cone.position.set(DC.gateX, 10.3, dz); cone.castShadow = true; scene.add(cone);
    const flag = _dcBox(0.06, 0.5, 0.9, pbr(0xffd040, 0.5), DC.gateX, 12, dz + 0.45);
    (DC_R.gateFlags = DC_R.gateFlags || []).push(flag);
    worldColliders.push({ type: 'circle', x: DC.gateX, z: dz, r: 1.9 });
  });
  _dcBox(0.9, 1.6, 10.4, pbr(0xc878b0, 0.7), DC.gateX, 8.2, 0);
  _dcSign('🎢 DREAM CITY 🎡', '#4a2a6a', '#ffe9a0', 8.4, 1.2, DC.gateX - 0.5, 8.2, 0, Math.PI / 2);
  for (let i = 0; i < 9; i++) _dcBulb(DC.gateX - 0.52, 7.35, -4 + i);
  const doorM = pbr(0x8a4ab0, 0.6);
  [-1.75, 1.75].forEach(dz => {
    const d = _dcBox(0.3, 3.2, 3.5, doorM, DC.gateX, 1.6, dz);
    _dcDoors.push({ mesh: d, closedZ: dz, openZ: dz * 2.6 });
  });
  _dcGateColl = { type: 'box', x0: DC.gateX - 0.4, x1: DC.gateX + 0.4, z0: -3.6, z1: 3.6 };
  worldColliders.push(_dcGateColl);

  // ── entrance plaza: fountain, ticket kiosk, wishing well ──
  const f = DC_R.fountain = { x: -122, z: 0, jets: [] };
  _dcCyl(3.4, 3.7, 0.5, pbr(0xd8c8e8, 0.8), f.x, 0.25, f.z, 20);
  const fw = _dcCyl(3.0, 3.0, 0.3, dcWaterMat, f.x, 0.5, f.z, 20);
  _dcCyl(0.5, 0.7, 1.8, pbr(0xc8b0d8, 0.8), f.x, 1.2, f.z, 10);
  for (let i = 0; i < 6; i++) { const j = _dcCyl(0.09, 0.05, 1.2, dcWaterMat, f.x + Math.cos(i * 1.047) * 1.6, 1.4, f.z + Math.sin(i * 1.047) * 1.6, 6); j.userData.ph = i; f.jets.push(j); }
  worldColliders.push({ type: 'circle', x: f.x, z: f.z, r: 3.8 });

  const kb = _dcBox(2.0, 2.4, 2.0, pbr(0x7a5ab0, 0.8), DC_KIOSK.x, 1.2, DC_KIOSK.z);
  const kr = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.9, 4), pbr(0xffd040, 0.7)); kr.position.set(DC_KIOSK.x, 2.85, DC_KIOSK.z); kr.rotation.y = Math.PI / 4; kr.castShadow = true; scene.add(kr);
  _dcSign('🎟️ RIDE TICKETS', '#3a2a14', '#ffe9c0', 2.4, 0.5, DC_KIOSK.x, 2.2, DC_KIOSK.z + 1.02);
  worldColliders.push({ type: 'box', x0: DC_KIOSK.x - 1.1, x1: DC_KIOSK.x + 1.1, z0: DC_KIOSK.z - 1.1, z1: DC_KIOSK.z + 1.1 });

  _dcCyl(0.8, 0.95, 0.9, pbr(0x9a8a7a, 0.9), DC_WELL.x, 0.45, DC_WELL.z, 10);
  _dcCyl(0.68, 0.68, 0.2, pbr(0x3a5a8a, 0.3), DC_WELL.x, 0.9, DC_WELL.z, 10);
  [-0.7, 0.7].forEach(d => _dcBox(0.12, 1.4, 0.12, pbr(0x6a4a30, 0.9), DC_WELL.x + d, 1.2, DC_WELL.z));
  _dcBox(1.7, 0.12, 0.7, pbr(0xb05548, 0.8), DC_WELL.x, 1.95, DC_WELL.z);
  worldColliders.push({ type: 'circle', x: DC_WELL.x, z: DC_WELL.z, r: 1.0 });

  // ── food street stands ──
  DC_FOOD.forEach(s => {
    _dcBox(2.2, 1.1, 1.6, pbr(0xf0e8d8, 0.85), s.x, 0.55, s.z);
    [-1, 1].forEach(d => _dcBox(0.1, 2.2, 0.1, pbr(0x8a7a6a, 0.85), s.x + d, 1.1, s.z));
    const awn = _dcBox(2.6, 0.12, 2.0, pbr(s.roof, 0.7), s.x, 2.25, s.z); awn.rotation.x = 0.1;
    _dcSign(s.e + ' ' + s.name, '#3a2a14', '#ffe9c0', 2.2, 0.45, s.x, 1.75, s.z + (s.z > 0 ? -0.9 : 0.9));
    worldColliders.push({ type: 'box', x0: s.x - 1.2, x1: s.x + 1.2, z0: s.z - 0.9, z1: s.z + 0.9 });
  });

  // ── gift shop pavilion ──
  const g0 = DC_GIFT;
  _dcBox(6, 0.3, 5, pbr(0xd8c8b8, 0.9), g0.x, 0.15, g0.z);
  [[-2.7, -2.2], [2.7, -2.2], [-2.7, 2.2], [2.7, 2.2]].forEach(([dx, dz]) => _dcCyl(0.14, 0.17, 2.6, pbr(0x8a6a4a, 0.85), g0.x + dx, 1.4, g0.z + dz, 8));
  const gr = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.8, 4), pbr(0xd06a9a, 0.7)); gr.position.set(g0.x, 3.4, g0.z); gr.rotation.y = Math.PI / 4; gr.castShadow = true; scene.add(gr);
  _dcSign('🎁 DREAM GIFTS', '#5a2a4a', '#ffe0f0', 3.2, 0.6, g0.x, 2.5, g0.z + 2.3);
  _dcBox(3.6, 0.9, 0.8, pbr(0xb890c8, 0.8), g0.x, 0.75, g0.z - 1.2);
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(G.sph(0.22, 10, 8), pbr([0xc06ad0, 0x5a9ad0, 0xe8c040][i % 3], 0.8)); p.position.set(g0.x - 1.4 + (i % 3) * 1.4, 1.42, g0.z - 1.2 - 0.1 + Math.floor(i / 3) * 0.3); p.castShadow = true; scene.add(p); }
  worldColliders.push({ type: 'box', x0: g0.x - 2, x1: g0.x + 2, z0: g0.z - 1.7, z1: g0.z - 0.7 });

  // ── games alley stalls ──
  DC_STALLS.forEach(s => {
    _dcBox(2.6, 1.0, 1.8, pbr(0xf0e8d8, 0.85), s.x, 0.5, s.z);
    [-1.2, 1.2].forEach(d => _dcBox(0.1, 2.4, 0.1, pbr(0x8a7a6a, 0.85), s.x + d, 1.2, s.z));
    for (let k = 0; k < 5; k++) _dcBox(0.56, 0.14, 2.1, pbr(k % 2 ? 0xffffff : s.col, 0.7), s.x - 1.12 + k * 0.56, 2.45, s.z);
    _dcSign(s.e + ' ' + s.name, '#3a2a14', '#ffe9c0', 2.4, 0.5, s.x, 1.9, s.z + 1.0);
    worldColliders.push({ type: 'box', x0: s.x - 1.4, x1: s.x + 1.4, z0: s.z - 1.0, z1: s.z + 1.0 });
  });

  // ── the Haunted Manor (walk-in, 1 🎟️) ──
  const m0 = DC_MANOR, mm = pbr(0x4a3a5a, 0.9), mroof = pbr(0x2a2038, 0.9);
  _dcBox(12, 0.25, 9, pbr(0x3a3048, 0.95), m0.x, 0.12, m0.z);
  _dcBox(12, 4.2, 0.4, mm, m0.x, 2.1, m0.z - 4.5);
  [-6, 6].forEach(d => _dcBox(0.4, 4.2, 9, mm, m0.x + d, 2.1, m0.z));
  _dcBox(4.4, 4.2, 0.4, mm, m0.x - 3.8, 2.1, m0.z + 4.5);
  _dcBox(4.4, 4.2, 0.4, mm, m0.x + 3.8, 2.1, m0.z + 4.5);
  _dcBox(3.2, 1.2, 0.4, mm, m0.x, 3.6, m0.z + 4.5);
  const mr = new THREE.Mesh(new THREE.ConeGeometry(8.6, 3.4, 4), mroof); mr.position.set(m0.x, 5.9, m0.z); mr.rotation.y = Math.PI / 4; mr.castShadow = true; scene.add(mr);
  [-4, 4].forEach(d => { const tw = _dcCyl(0.9, 1.05, 5.4, mm, m0.x + d, 2.7, m0.z + 4.2, 8); const tc = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.6, 8), mroof); tc.position.set(m0.x + d, 6.2, m0.z + 4.2); tc.castShadow = true; scene.add(tc); });
  _dcSign('👻 HAUNTED MANOR', '#1a1028', '#b0ffb8', 4.4, 0.7, m0.x, 3.2, m0.z + 4.75);
  [[m0.x - 6, m0.z, 0.6, 9.4], [m0.x + 6, m0.z, 0.6, 9.4], [m0.x, m0.z - 4.5, 12.4, 0.6], [m0.x - 3.8, m0.z + 4.5, 4.6, 0.6], [m0.x + 3.8, m0.z + 4.5, 4.6, 0.6]].forEach(([bx2, bz2, bw, bd]) => worldColliders.push({ type: 'box', x0: bx2 - bw / 2, x1: bx2 + bw / 2, z0: bz2 - bd / 2, z1: bz2 + bd / 2 }));
  _dcManorColl = { type: 'box', x0: m0.x - 1.6, x1: m0.x + 1.6, z0: m0.z + 4.2, z1: m0.z + 4.8 };
  worldColliders.push(_dcManorColl);
  DC_R.ghosts = [];
  for (let i = 0; i < 3; i++) {
    const gh = new THREE.Group();
    const bm = new THREE.MeshStandardMaterial({ color: 0xf0f0ff, roughness: 0.6, transparent: true, opacity: 0.85, emissive: 0x8090c0, emissiveIntensity: 0.35 });
    const body = new THREE.Mesh(G.sph(0.42, 12, 10), bm); body.scale.y = 1.25; gh.add(body);
    const tail = new THREE.Mesh(G.cone(0.3, 0.6, 8), bm); tail.rotation.x = Math.PI; tail.position.y = -0.6; gh.add(tail);
    [-1, 1].forEach(d => { const e = new THREE.Mesh(G.sph(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0x202038 })); e.position.set(d * 0.15, 0.12, 0.36); gh.add(e); });
    gh.position.set(m0.x - 3 + i * 3, 1.3, m0.z - 1 + (i % 2) * 2);
    scene.add(gh);
    DC_R.ghosts.push({ g: gh, ph: i * 2.1, hx: gh.position.x, hz: gh.position.z, flipT: 0 });
  }
  [[-3, 3.2], [3, 3.2]].forEach(([dx, dz]) => { const pk = new THREE.Mesh(G.sph(0.3, 10, 8), pbr(0xe08a30, 0.8)); pk.scale.y = 0.8; pk.position.set(m0.x + dx, 0.35, m0.z + dz); pk.castShadow = true; scene.add(pk); });

  // ── the Mirror Fun House (walk-in, 1 🎟️) ──
  const fh = DC_FUN;
  _dcBox(7, 0.25, 6, pbr(0xe8d0f0, 0.9), fh.x, 0.12, fh.z);
  const fwall = pbr(0xd06a9a, 0.8);
  _dcBox(7, 3.4, 0.35, fwall, fh.x, 1.7, fh.z - 3);
  [-3.5, 3.5].forEach(d => _dcBox(0.35, 3.4, 6, d < 0 ? pbr(0x5a9ad0, 0.8) : pbr(0xe8c040, 0.8), fh.x + d, 1.7, fh.z));
  _dcBox(2.2, 3.4, 0.35, fwall, fh.x - 2.4, 1.7, fh.z + 3);
  _dcBox(2.2, 3.4, 0.35, fwall, fh.x + 2.4, 1.7, fh.z + 3);
  _dcBox(7.6, 0.4, 6.6, pbr(0x8a4ab0, 0.7), fh.x, 3.6, fh.z);
  _dcSign('🪞 FUN HOUSE', '#6a2a5a', '#ffe9a0', 3.0, 0.6, fh.x, 2.6, fh.z + 3.25);
  const mirM = new THREE.MeshStandardMaterial({ color: 0xcfe0ec, metalness: 0.92, roughness: 0.08 });
  for (let i = 0; i < 4; i++) { const mp = _dcBox(1.1, 2.4, 0.08, mirM, fh.x - 2.2 + i * 1.5, 1.3, fh.z - 2.6); mp.rotation.y = (i % 2 ? 0.18 : -0.18); }
  [[fh.x - 3.5, fh.z, 0.55, 6.4], [fh.x + 3.5, fh.z, 0.55, 6.4], [fh.x, fh.z - 3, 7.4, 0.55], [fh.x - 2.4, fh.z + 3, 2.4, 0.55], [fh.x + 2.4, fh.z + 3, 2.4, 0.55]].forEach(([bx2, bz2, bw, bd]) => worldColliders.push({ type: 'box', x0: bx2 - bw / 2, x1: bx2 + bw / 2, z0: bz2 - bd / 2, z1: bz2 + bd / 2 }));
  _dcFunColl = { type: 'box', x0: fh.x - 1.3, x1: fh.x + 1.3, z0: fh.z + 2.7, z1: fh.z + 3.3 };
  worldColliders.push(_dcFunColl);

  // ── show stage ──
  _dcBox(8, 0.8, 5, pbr(0x8a4ab0, 0.8), DC_STAGE.x, 0.4, DC_STAGE.z);
  _dcBox(8.6, 0.5, 0.4, pbr(0xffd040, 0.6), DC_STAGE.x, 4.2, DC_STAGE.z - 2.4);
  [-4.1, 4.1].forEach(d => _dcBox(0.25, 4.4, 0.25, pbr(0x6a3a8a, 0.8), DC_STAGE.x + d, 2.2, DC_STAGE.z - 2.4));
  _dcSign('🎶 DREAM STAGE', '#4a2a6a', '#ffe9a0', 3.6, 0.55, DC_STAGE.x, 4.2, DC_STAGE.z - 2.15);
  for (let i = 0; i < 7; i++) _dcBulb(DC_STAGE.x - 3.6 + i * 1.2, 3.85, DC_STAGE.z - 2.35);
  worldColliders.push({ type: 'box', x0: DC_STAGE.x - 4.2, x1: DC_STAGE.x + 4.2, z0: DC_STAGE.z - 2.7, z1: DC_STAGE.z + 2.6 });
  const bseat = pbr(0x9a7a5a, 0.9);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { _dcBox(2.2, 0.14, 0.5, bseat, DC_STAGE.x - 2.4 + c * 2.4, 0.5, DC_STAGE.z + 4.4 + r * 1.6); [-0.9, 0.9].forEach(d => _dcBox(0.14, 0.5, 0.4, bseat, DC_STAGE.x - 2.4 + c * 2.4 + d, 0.25, DC_STAGE.z + 4.4 + r * 1.6)); }

  // ── string-light lamp posts along the avenues ──
  DC_R.bulbs = [];
  const lampAt = (x, z) => { _dcCyl(0.07, 0.09, 3.0, pbr(0x5a4a6a, 0.8), x, 1.5, z, 6); const arm = _dcBox(1.4, 0.06, 0.06, pbr(0x5a4a6a, 0.8), x, 3.0, z); for (let k = -1; k <= 1; k++) DC_R.bulbs.push(_dcBulb(x + k * 0.5, 2.86 - Math.abs(k) * 0.12, z)); };
  for (let x = -114; x >= -178; x -= 16) { lampAt(x, 4.4); lampAt(x - 8, -4.4); }
  for (let z = -16; z >= -60; z -= 15) { lampAt(-131, z); lampAt(-137, z - 7); }
  for (let x = -130; x >= -210; x -= 16) lampAt(x, 24.5);

  // planting: trees + flowers make it a garden too
  [[-118, 18], [-128, 44, 'blossom'], [-150, 46, 'willow'], [-176, 44, 'blossom'], [-206, 50, 'oak'],
   [-116, -18, 'blossom'], [-152, -32, 'autumn'], [-124, -56, 'oak'], [-148, -88, 'blossom'], [-168, -66, 'willow'],
   [-120, -90], [-144, -100, 'autumn'], [-170, -92, 'oak'], [-206, -95, 'blossom'], [-216, -80, 'pine'], [-224, -50, 'pine'], [-226, -112, 'pine'], [-190, -114], [-150, -116, 'blossom'], [-120, -118, 'oak']]
    .forEach(([tx, tz, k]) => plantWildTree(k || 'tree', tx, tz));
  [[-116, 4], [-127, 8], [-141, 3.6], [-151, -3.6], [-163, 3.6], [-130, -16], [-172, -16], [-138, -58], [-128, -74], [-160, -70], [-140, -88], [-180, -88]]
    .forEach(([fx, fz]) => plantWildTree('flowers', fx, fz));

  buildDcRides();
  buildDcPeople();
  if (typeof state.dcTickets !== 'number') state.dcTickets = 0;
}

// ── THE RIDES ─────────────────────────────────────────────────────────────
function buildDcRides() {
  const R = DC_RIDES;

  // 🎡 Grand Ferris Wheel — the skyline of the west
  { const r = R.ferris, W = DC_R.ferris = { hub: null, wheel: new THREE.Group(), gondolas: [] };
    [-2.2, 2.2].forEach(d => { const leg = _dcCyl(0.22, 0.3, 14.5, pbr(0x8a4ab0, 0.7), r.x, 6.5, r.z + d, 8); leg.rotation.x = d > 0 ? -0.16 : 0.16; });
    W.wheel.position.set(r.x, 12.5, r.z);
    const rimM = pbr(0xe8c040, 0.5), spokeM = pbr(0xc878b0, 0.6);
    for (let i = 0; i < 16; i++) { const am = i * Math.PI / 8 + Math.PI / 16; const seg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 4.4), rimM); seg.position.set(0, Math.sin(am) * 11, Math.cos(am) * 11); seg.rotation.x = -(Math.PI / 2 + am); W.wheel.add(seg); }
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 22, 6), spokeM); sp.rotation.x = Math.PI / 2 - a; W.wheel.add(sp); }
    const cols = [0xd0483a, 0xe8c040, 0x5a9ad0, 0x6ac06a, 0xc06ad0, 0xf090a8, 0xe08a30, 0x50b8a8];
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const cab = new THREE.Group();
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 10, 0, Math.PI * 2, Math.PI * 0.28, Math.PI * 0.72), pbr(cols[i], 0.6)); cab.add(sh);
      const roofc = new THREE.Mesh(G.cone(0.9, 0.7, 10), pbr(0xf0e8d8, 0.7)); roofc.position.y = 0.72; cab.add(roofc);
      cab.position.set(0, Math.sin(a) * 11, Math.cos(a) * 11);
      cab.userData.a = a;
      W.wheel.add(cab); W.gondolas.push(cab);
    }
    scene.add(W.wheel);
    W.hub = _dcCyl(0.7, 0.7, 1.6, pbr(0xffd040, 0.4), r.x, 12.5, r.z, 12); W.hub.rotation.x = Math.PI / 2;
    _dcSign('🎡 GRAND WHEEL · 2🎟️', '#4a2a6a', '#ffe9a0', 3.4, 0.6, r.x, 1.6, r.z + 5.4);
    worldColliders.push({ type: 'circle', x: r.x, z: r.z, r: 3.4 });
  }

  // 🐉 The Dragon Coaster — a looping track with three cars
  { const r = R.coaster, C = DC_R.coaster = { cars: [], cx: -212, cz: -30, rx: 20, rz: 40 };
    const py = s => 2.2 + Math.sin(s * 2) * 1.6 + Math.sin(s * 3 + 1) * 0.9;           // the hill profile
    const P = s => new THREE.Vector3(C.cx + Math.cos(s) * C.rx, py(s), C.cz + Math.sin(s) * C.rz);
    const railM = pbr(0xd0483a, 0.6), tieM = pbr(0x6a4a30, 0.9);
    for (let i = 0; i < 64; i++) {
      const s0 = i / 64 * Math.PI * 2, s1 = (i + 1) / 64 * Math.PI * 2;
      const a = P(s0), b = P(s1), mid = a.clone().add(b).multiplyScalar(0.5);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, a.distanceTo(b) + 0.05), railM);
      seg.position.copy(mid); seg.lookAt(b); scene.add(seg);
      if (i % 4 === 0) { const post = _dcCyl(0.1, 0.13, mid.y, tieM, mid.x, mid.y / 2, mid.z, 6); }
    }
    for (let i = 0; i < 3; i++) {
      const car = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 1.3), pbr(i === 0 ? 0x6ac06a : 0xd0483a, 0.55)); body.castShadow = true; car.add(body);
      if (i === 0) { const head = new THREE.Mesh(G.sph(0.42, 10, 8), pbr(0x4aa04a, 0.6)); head.position.set(0, 0.35, 0.8); car.add(head);
        [-1, 1].forEach(d => { const horn = new THREE.Mesh(G.cone(0.09, 0.35, 6), pbr(0xffd040, 0.5)); horn.position.set(d * 0.2, 0.75, 0.7); car.add(horn); });
        [-1, 1].forEach(d => { const eye = new THREE.Mesh(G.sph(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); eye.position.set(d * 0.18, 0.45, 1.14); car.add(eye); }); }
      const s0 = i * 0.22;
      car.position.set(C.cx + Math.cos(s0) * C.rx, py(s0) + 0.3, C.cz + Math.sin(s0) * C.rz);   // born ON the track, not at world origin
      scene.add(car); C.cars.push(car);
    }
    C.py = py;
    _dcSign('🐉 DRAGON COASTER · 2🎟️', '#2a3a1a', '#d0ffb0', 4.0, 0.65, r.x, 1.7, r.z + 1.8);
    _dcBox(2.6, 0.3, 2.0, pbr(0x8a7a5a, 0.9), r.x, 0.15, r.z);           // boarding platform
  }

  // 🎠 Carousel
  { const r = R.carousel, C = DC_R.carousel = { plat: new THREE.Group(), horses: [] };
    _dcCyl(4.4, 4.7, 0.4, pbr(0xe8c040, 0.7), r.x, 0.2, r.z, 18);
    C.plat.position.set(r.x, 0.45, r.z);
    const canope = new THREE.Mesh(new THREE.ConeGeometry(4.6, 1.7, 18), pbr(0xd06a9a, 0.65)); canope.position.y = 4.4; canope.castShadow = true; C.plat.add(canope);
    const pole0 = new THREE.Mesh(G.cyl(0.16, 0.2, 4.4, 10), pbr(0xffd040, 0.5)); pole0.position.y = 2.2; C.plat.add(pole0);
    const hcols = [0xf0f0f0, 0xd0483a, 0x5a9ad0, 0xe8c040, 0xc06ad0, 0x6ac06a];
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, hx = Math.cos(a) * 3.1, hz = Math.sin(a) * 3.1;
      const pole = new THREE.Mesh(G.cyl(0.05, 0.05, 3.6, 6), pbr(0xd8d8d8, 0.4)); pole.position.set(hx, 1.8, hz); C.plat.add(pole);
      const h = new THREE.Group();
      const body = new THREE.Mesh(G.sph(0.4, 10, 8), pbr(hcols[i], 0.7)); body.scale.set(1, 0.8, 1.6); h.add(body);
      const head = new THREE.Mesh(G.sph(0.24, 10, 8), pbr(hcols[i], 0.7)); head.scale.set(0.8, 1, 1.2); head.position.set(0, 0.5, 0.62); h.add(head);
      const mane = new THREE.Mesh(G.sph(0.16, 8, 6), pbr(0x6a4a30, 0.8)); mane.scale.set(0.5, 1.4, 1); mane.position.set(0, 0.55, 0.4); h.add(mane);
      [[-0.2, 0.5], [0.2, 0.5], [-0.2, -0.5], [0.2, -0.5]].forEach(([lx, lz]) => { const leg = new THREE.Mesh(G.cyl(0.06, 0.05, 0.7, 6), pbr(hcols[i], 0.7)); leg.position.set(lx, -0.55, lz); h.add(leg); });
      h.position.set(hx, 1.35, hz); h.rotation.y = -a + Math.PI;
      h.userData.ph = i;
      C.plat.add(h); C.horses.push(h);
    }
    scene.add(C.plat);
    for (let i = 0; i < 12; i++) _dcBulb(r.x + Math.cos(i * 0.524) * 4.5, 3.6, r.z + Math.sin(i * 0.524) * 4.5);
    _dcSign('🎠 CAROUSEL · 1🎟️', '#6a2a4a', '#ffe0f0', 3.0, 0.55, r.x, 1.5, r.z + 5.0);
    worldColliders.push({ type: 'circle', x: r.x, z: r.z, r: 4.9 });
  }

  // 🗼 Star Drop Tower
  { const r = R.drop, D2 = DC_R.drop = {};
    _dcCyl(0.55, 0.75, 20, pbr(0x9a8ab8, 0.7), r.x, 10, r.z, 10);
    const star = new THREE.Mesh(G.sph(0.9, 10, 8), pbr(0xffd040, 0.4)); star.position.set(r.x, 20.6, r.z); star.scale.set(1, 1, 0.4); scene.add(star);
    D2.car = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.7, 10), pbr(0xd0483a, 0.6)); D2.car.add(ring);
    for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.4), pbr(0x4a3a5a, 0.7)); const a = i * Math.PI / 3; st.position.set(Math.cos(a) * 1.55, 0.1, Math.sin(a) * 1.55); D2.car.add(st); }
    D2.car.position.set(r.x, 1.6, r.z); scene.add(D2.car);
    D2.cycle = 0;
    _dcSign('🗼 STAR DROP · 1🎟️', '#3a2a5a', '#ffe9a0', 3.0, 0.55, r.x, 1.5, r.z + 2.6);
    worldColliders.push({ type: 'circle', x: r.x, z: r.z, r: 2.4 });
  }

  // ⛓️ Sky Swings
  { const r = R.swings, S2 = DC_R.swings = { top: new THREE.Group(), chairs: [] };
    _dcCyl(0.35, 0.5, 9, pbr(0xe08a30, 0.7), r.x, 4.5, r.z, 10);
    S2.top.position.set(r.x, 9.2, r.z);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(4.4, 1.5, 14), pbr(0xe8c040, 0.6)); cap.position.y = 0.6; cap.castShadow = true; S2.top.add(cap);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      const arm = new THREE.Group(); arm.rotation.y = a;
      const chain = new THREE.Mesh(G.cyl(0.03, 0.03, 3.4, 5), pbr(0xb0b0b8, 0.5)); chain.position.set(4.0, -1.7, 0); arm.add(chain);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.6), pbr([0xd0483a, 0x5a9ad0, 0x6ac06a, 0xc06ad0][i % 4], 0.7)); seat.position.set(4.0, -3.4, 0); arm.add(seat);
      S2.top.add(arm); S2.chairs.push(arm);
    }
    scene.add(S2.top);
    _dcSign('⛓️ SKY SWINGS · 1🎟️', '#5a3a1a', '#ffe9c0', 3.2, 0.55, r.x, 1.5, r.z + 7.0);
    worldColliders.push({ type: 'circle', x: r.x, z: r.z, r: 1.2 });
  }

  // 🍵 Twirling Teacups
  { const r = R.teacups, T = DC_R.teacups = { disc: new THREE.Group(), cups: [] };
    _dcCyl(5.0, 5.3, 0.35, pbr(0x9ad0e8, 0.8), r.x, 0.18, r.z, 18);
    T.disc.position.set(r.x, 0.4, r.z);
    const ccols = [0xf090a8, 0x9ad0e8, 0xe8c040, 0xb890c8];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      const cup = new THREE.Group();
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.9, 14), pbr(ccols[i], 0.6)); bowl.position.y = 0.45; cup.add(bowl);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 8, 12), pbr(ccols[i], 0.6)); handle.position.set(0.95, 0.5, 0); handle.rotation.y = Math.PI / 2; cup.add(handle);
      cup.position.set(Math.cos(a) * 2.9, 0, Math.sin(a) * 2.9);
      T.disc.add(cup); T.cups.push(cup);
    }
    scene.add(T.disc);
    _dcSign('🍵 TEACUPS · 1🎟️', '#2a4a5a', '#d8f0ff', 2.8, 0.55, r.x, 1.5, r.z + 5.6);
    worldColliders.push({ type: 'circle', x: r.x, z: r.z, r: 5.5 });
  }

  // 🪵 Log Flume — logs loop a splashy channel
  { const r = R.flume, F = DC_R.flume = { logs: [], cx: r.x, cz: r.z, rx: 13, rz: 9 };
    const chanM = pbr(0x8a9aa8, 0.85);
    for (let i = 0; i < 40; i++) {
      const s0 = i / 40 * Math.PI * 2, s1 = (i + 1) / 40 * Math.PI * 2;
      const hy = s => 0.5 + Math.max(0, Math.sin(s - 1.2)) * 3.2;                     // one big climb & plunge
      const a = new THREE.Vector3(F.cx + Math.cos(s0) * F.rx, hy(s0), F.cz + Math.sin(s0) * F.rz);
      const b = new THREE.Vector3(F.cx + Math.cos(s1) * F.rx, hy(s1), F.cz + Math.sin(s1) * F.rz);
      const seg = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.35, a.distanceTo(b) + 0.08), chanM);
      seg.position.copy(a.clone().add(b).multiplyScalar(0.5)); seg.lookAt(b); scene.add(seg);
      if (i % 5 === 0 && a.y > 0.8) _dcCyl(0.09, 0.12, a.y, pbr(0x6a4a30, 0.9), a.x, a.y / 2, a.z, 6);
    }
    F.hy = s => 0.5 + Math.max(0, Math.sin(s - 1.2)) * 3.2;
    const splash = _dcCyl(2.2, 2.4, 0.16, dcWaterMat, F.cx + Math.cos(2.6) * F.rx, 0.3, F.cz + Math.sin(2.6) * F.rz, 14);
    for (let i = 0; i < 3; i++) {
      const log = new THREE.Group();
      const body = new THREE.Mesh(G.cyl(0.42, 0.46, 1.6, 10), pbr(0x8a6242, 0.9)); body.rotation.x = Math.PI / 2; body.castShadow = true; log.add(body);
      const s0 = i * 2.1;
      log.position.set(F.cx + Math.cos(s0) * F.rx, F.hy ? 0.85 : 0.85, F.cz + Math.sin(s0) * F.rz);   // born in the channel
      scene.add(log); F.logs.push(log);
    }
    _dcSign('🪵 LOG FLUME · 1🎟️', '#2a4a3a', '#d8ffe8', 3.0, 0.55, r.x, 1.5, r.z + F.rz + 1.6);
  }

  // 🚂 Dream Express — the little train that loops the whole park
  { const T = DC_R.train = { g: new THREE.Group(), cx: -166, cz: -100, rx: 55, rz: 26, s: 0 };   // the Meadow Line: a dedicated loop with nothing in its way
    const tieM = pbr(0x8a7a5a, 0.95);
    for (let i = 0; i < 96; i++) {
      const s = i / 96 * Math.PI * 2;
      const tx = T.cx + Math.cos(s) * T.rx, tz = T.cz + Math.sin(s) * T.rz;
      if (i % 2 === 0) { const tie = _dcBox(0.8, 0.07, 0.3, tieM, tx, 0.06, tz); tie.rotation.y = -Math.atan2(Math.cos(s) * T.rz, -Math.sin(s) * T.rx) + Math.PI / 2; }
    }
    const eng = new THREE.Group();
    const boiler = new THREE.Mesh(G.cyl(0.5, 0.5, 1.6, 12), pbr(0xd0483a, 0.6)); boiler.rotation.x = Math.PI / 2; boiler.position.y = 0.85; eng.add(boiler);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.9), pbr(0x8a4ab0, 0.7)); cab.position.set(0, 0.95, -1.0); eng.add(cab);
    const chim = new THREE.Mesh(G.cyl(0.14, 0.2, 0.6, 8), pbr(0x3a3a44, 0.7)); chim.position.set(0, 1.6, 0.55); eng.add(chim);
    [-0.45, 0.45].forEach(dx => [0.5, -0.5, -1.2].forEach(dz => { const wh = new THREE.Mesh(G.cyl(0.26, 0.26, 0.1, 10), pbr(0x2a2a30, 0.6)); wh.rotation.z = Math.PI / 2; wh.position.set(dx, 0.26, dz); eng.add(wh); }));
    eng.position.z = 1.6; T.g.add(eng);
    T.coaches = [];
    for (let i = 0; i < 2; i++) {
      const co = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.7, 1.7), pbr(i ? 0x5a9ad0 : 0xe8c040, 0.7)); body.position.y = 0.65; co.add(body);
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 1.8), pbr(0xf0e8d8, 0.7)); canopy.position.y = 1.35; co.add(canopy);
      [[-0.5, 0.6], [0.5, 0.6], [-0.5, -0.6], [0.5, -0.6]].forEach(([dx, dz]) => { const wh = new THREE.Mesh(G.cyl(0.2, 0.2, 0.09, 10), pbr(0x2a2a30, 0.6)); wh.rotation.z = Math.PI / 2; wh.position.set(dx, 0.2, dz); co.add(wh); });
      co.position.z = -0.8 - i * 2.1; T.g.add(co); T.coaches.push(co);
    }
    T.g.position.set(T.cx + T.rx, 0.1, T.cz);   // parked on the loop from frame one
    scene.add(T.g);
    // the station by the plaza
    _dcBox(2.4, 0.25, 4.4, pbr(0xc8b090, 0.9), -125.5, 0.12, -85);
    [-1.8, 1.8].forEach(d => _dcCyl(0.1, 0.13, 2.4, pbr(0x8a6a4a, 0.85), -125.5, 1.2, -85 + d, 8));
    _dcBox(2.8, 0.18, 4.8, pbr(0xd0483a, 0.75), -125.5, 2.5, -85);
    _dcSign('🚂 DREAM EXPRESS · 1🎟️', '#4a2a1a', '#ffe9c0', 3.8, 0.6, -125.5, 1.8, -82.4);
  }

  // 🌈 Rainbow Slide
  { const r = R.slide, S3 = DC_R.slide = {};
    _dcCyl(1.2, 1.5, 11, pbr(0xb890c8, 0.75), r.x, 5.5, r.z, 10);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.4, 10), pbr(0xd06a9a, 0.6)); top.position.set(r.x, 11.6, r.z); top.castShadow = true; scene.add(top);
    const cols = [0xd0483a, 0xe08a30, 0xe8c040, 0x6ac06a, 0x5a9ad0, 0x8a6ac0];
    for (let i = 0; i < 30; i++) {
      const f = i / 30, a = f * Math.PI * 2.4, y = 10.4 - f * 9.6;
      const seg = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 1.35), pbr(cols[i % 6], 0.55));
      seg.position.set(r.x + Math.cos(a) * 2.6, y, r.z + Math.sin(a) * 2.6);
      seg.rotation.y = -a + Math.PI / 2; seg.rotation.x = 0.18;
      seg.castShadow = true; scene.add(seg);
    }
    S3.outA = Math.PI * 2.4;
    worldColliders.push({ type: 'circle', x: r.x, z: r.z, r: 3.2 });
    _dcSign('🌈 RAINBOW SLIDE · 1🎟️', '#3a4a2a', '#ffffd0', 3.6, 0.55, r.x, 1.5, r.z + 4.0);
  }

  // 🚗 Bumper Cars — the dodgem arena
  { const r = R.dodgem, B = DC_R.dodgem = { cars: [] };
    _dcBox(14, 0.2, 10, pbr(0x4a4a58, 0.6), r.x, 0.1, r.z);
    const rail = pbr(0xe8c040, 0.6);
    [[r.x, r.z - 5, 14.4, 0.4], [r.x, r.z + 5, 14.4, 0.4], [r.x - 7, r.z, 0.4, 10.4], [r.x + 7, r.z, 0.4, 10.4]].forEach(([bx2, bz2, bw, bd]) => { _dcBox(bw, 0.7, bd, rail, bx2, 0.55, bz2); worldColliders.push({ type: 'box', x0: bx2 - bw / 2, x1: bx2 + bw / 2, z0: bz2 - bd / 2, z1: bz2 + bd / 2 }); });
    _dcBox(14.6, 0.2, 10.6, pbr(0x3a3a48, 0.8), r.x, 3.4, r.z);
    [[-7, -5], [7, -5], [-7, 5], [7, 5]].forEach(([dx, dz]) => _dcCyl(0.12, 0.15, 3.4, pbr(0x5a5a68, 0.7), r.x + dx, 1.7, r.z + dz, 8));
    const ccols = [0xd0483a, 0x5a9ad0, 0x6ac06a, 0xe8c040, 0xc06ad0];
    for (let i = 0; i < 5; i++) {
      const car = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.35, 12), pbr(ccols[i], 0.55)); base.position.y = 0.3; car.add(base);
      const seatb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), pbr(0x3a3a44, 0.7)); seatb.position.set(0, 0.7, -0.35); car.add(seatb);
      const pole = new THREE.Mesh(G.cyl(0.03, 0.03, 2.6, 5), pbr(0xb0b0b8, 0.5)); pole.position.set(0, 1.6, -0.5); pole.rotation.x = 0.22; car.add(pole);
      car.position.set(r.x - 4 + i * 2, 0.12, r.z - 2 + (i % 2) * 4);
      car.userData = { vx: Math.cos(i * 2.4) * 1.4, vz: Math.sin(i * 2.4) * 1.4 };
      scene.add(car); B.cars.push(car);
    }
    B.arena = { x: r.x, z: r.z, hw: 6.2, hd: 4.2 };
    _dcSign('🚗 BUMPER CARS · 1🎟️', '#4a3a1a', '#ffe9c0', 3.4, 0.55, r.x, 1.6, r.z + 5.8);
  }
}

// ── THE PEOPLE OF DREAM CITY ──────────────────────────────────────────────
function buildDcPeople() {
  // Bibi the balloon seller — Bobo's cousin, brighter still
  const bb = buildHuman({ skin: 0xc89468, hair: 0x241a10, hairStyle: 'bun', hat: 'cap', hatColor: 0x5a9ad0, shirt: 0xf090a8, pants: 0x4a4a6a, height: 0.98, build: 'avg', eye: 0x3a2a1a });
  bb.group.position.set(-116, 0, 9); bb.group.rotation.y = Math.PI; scene.add(bb.group);
  const bunch = new THREE.Group();
  const cols = [0xd0483a, 0xe8c040, 0x5a9ad0, 0x6ac06a, 0xc06ad0, 0xf090a8];
  for (let i = 0; i < 6; i++) {
    const b = new THREE.Mesh(G.sph(0.22, 14, 10), pbr(cols[i], 0.4)); b.scale.y = 1.15;
    const a = i * 1.05; b.position.set(Math.cos(a) * 0.4, 2.6 + (i % 3) * 0.35, Math.sin(a) * 0.4); b.castShadow = true; bunch.add(b);
    const str = new THREE.Mesh(G.cyl(0.008, 0.008, 1.4, 4), pbr(0xd8d8d8, 0.8));
    str.position.set(b.position.x * 0.6, 1.7, b.position.z * 0.6); str.rotation.z = -b.position.x * 0.3; str.rotation.x = b.position.z * 0.3; bunch.add(str);
  }
  bunch.position.set(0.5, 0, 0.2); bb.group.add(bunch);
  state.dcBalloonSeller = { group: bb.group, parts: bb.parts, phase: Math.random() * 6, bunch };

  // Dreamy the mascot — a big soft dragon who wanders the plaza
  const dg = new THREE.Group();
  const dpurple = pbr(0x9a6ad0, 0.7), dbelly = pbr(0xe8d0f0, 0.75);
  const body = new THREE.Mesh(G.sph(0.55, 14, 12), dpurple); body.scale.set(1, 1.25, 0.9); body.position.y = 0.85; body.castShadow = true; dg.add(body);
  const belly = new THREE.Mesh(G.sph(0.42, 12, 10), dbelly); belly.scale.set(0.85, 1.05, 0.6); belly.position.set(0, 0.8, 0.22); dg.add(belly);
  const head = new THREE.Mesh(G.sph(0.5, 14, 12), dpurple); head.position.y = 1.85; head.castShadow = true; dg.add(head);
  const snout = new THREE.Mesh(G.sph(0.24, 10, 8), dbelly); snout.scale.set(1.1, 0.75, 1); snout.position.set(0, 1.72, 0.42); dg.add(snout);
  [-1, 1].forEach(d => {
    const eye = new THREE.Mesh(G.sph(0.1, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); eye.position.set(d * 0.2, 1.95, 0.4); dg.add(eye);
    const pup = new THREE.Mesh(G.sph(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0x2a2038 })); pup.position.set(d * 0.2, 1.95, 0.49); dg.add(pup);
    const horn = new THREE.Mesh(G.cone(0.09, 0.32, 8), pbr(0xffd040, 0.5)); horn.position.set(d * 0.24, 2.35, 0); dg.add(horn);
    const wing = new THREE.Mesh(G.sph(0.3, 10, 8), pbr(0xc09ae0, 0.7)); wing.scale.set(0.25, 0.9, 0.6); wing.position.set(d * 0.62, 1.1, -0.25); wing.rotation.z = d * 0.5; wing.userData.d = d; dg.add(wing);
    (dg.userData.wings = dg.userData.wings || []).push(wing);
    const arm = new THREE.Mesh(G.cyl(0.09, 0.11, 0.55, 8), dpurple); arm.position.set(d * 0.55, 0.95, 0.15); arm.rotation.z = d * 0.5; dg.add(arm);
    const leg = new THREE.Mesh(G.cyl(0.13, 0.16, 0.5, 8), dpurple); leg.position.set(d * 0.24, 0.25, 0); dg.add(leg);
  });
  const tail = new THREE.Mesh(G.cone(0.18, 0.8, 8), dpurple); tail.position.set(0, 0.5, -0.6); tail.rotation.x = 1.9; dg.add(tail);
  dg.position.set(-119, 0, 4); scene.add(dg);
  state.dcDreamy = { group: dg, mode: 'idle', timer: 3, wx: -119, wz: 4, phase: 0 };

  // the guests — families roaming the park
  state.dcGuests = [];
  DC_R.kidBalloons = [];
  const spots = [[-120, 0], [-146, 2], [-146, -22], [-136, 24], [-158, 31], [-146, 9], [-122, 30], [-134, -64], [-168, -40], [-121, -28]];
  for (let i = 0; i < 10; i++) {
    const kid = i < 4;
    const cfg = (typeof randomPersonCfg === 'function') ? randomPersonCfg() : { skin: 0xe2b48c, hair: 0x3a2a1c, shirt: 0x6a8ac0, pants: 0x3a3a4a };
    if (kid) { cfg.height = 0.62 + Math.random() * 0.14; cfg.hairStyle = 'child'; }
    const { group, parts } = buildHuman(cfg);
    const [sx, sz] = spots[i];
    group.position.set(sx + Math.random() * 3 - 1.5, 0, sz + Math.random() * 3 - 1.5);
    scene.add(group);
    if (kid && i % 2 === 0) {                                     // some kids already carry balloons
      const bal = new THREE.Group();
      const b = new THREE.Mesh(G.sph(0.18, 12, 10), pbr([0xd0483a, 0x5a9ad0, 0xe8c040][i % 3], 0.4)); b.scale.y = 1.15; bal.add(b);
      const str = new THREE.Mesh(G.cyl(0.006, 0.006, 1.0, 4), pbr(0xe8e8e8, 0.8)); str.position.y = -0.72; bal.add(str);
      bal.position.set(0.3, 2.3, 0); group.add(bal); DC_R.kidBalloons.push(bal);
    }
    state.dcGuests.push({ group, parts, phase: Math.random() * 6, mode: 'idle', timer: 1 + Math.random() * 4, wx: group.position.x, wz: group.position.z });
  }
  // little queues at the big rides
  DC_R.queue = [];
  [[DC_RIDES.ferris.x + 1.2, DC_RIDES.ferris.z + 5.8], [DC_RIDES.ferris.x + 2.2, DC_RIDES.ferris.z + 6.8], [DC_RIDES.coaster.x + 1, DC_RIDES.coaster.z + 2.6], [DC_RIDES.carousel.x - 1.4, DC_RIDES.carousel.z + 5.6]].forEach(([qx, qz], i) => {
    const cfg = (typeof randomPersonCfg === 'function') ? randomPersonCfg() : { skin: 0xd9a884, hair: 0x4a3a2a, shirt: 0xb05548, pants: 0x39394a };
    const { group, parts } = buildHuman(cfg);
    group.position.set(qx, 0, qz); group.rotation.y = Math.PI + i * 0.2; scene.add(group);
    DC_R.queue.push({ group, parts, phase: i * 1.7 });
  });
  // the stage dancers
  DC_R.dancers = [];
  [-1.6, 1.6].forEach((dx, i) => {
    const cfg = { skin: 0xe0b080, hair: i ? 0x8a4a2a : 0x241a10, hairStyle: i ? 'long' : 'short', shirt: i ? 0xe8c040 : 0xd0483a, pants: 0x4a2a6a, height: 1.0, build: 'slim', eye: 0x3a2a1a };
    const { group, parts } = buildHuman(cfg);
    group.position.set(DC_STAGE.x + dx, 0.8, DC_STAGE.z); group.rotation.y = Math.PI; scene.add(group);
    DC_R.dancers.push({ group, parts, phase: i * 2.2, baseX: DC_STAGE.x + dx });
  });
}

// ── gate machinery (mirrors the zoo gate) ──
function setDcGate(open) {
  _dcGateOpen = open;
  _dcDoors.forEach(d => { d.mesh.position.z = open ? d.openZ : d.closedZ; });
  const i = worldColliders.indexOf(_dcGateColl);
  if (open && i >= 0) worldColliders.splice(i, 1);
  if (!open && i < 0 && _dcGateColl) worldColliders.push(_dcGateColl);
}
function dcGateAction() {
  if (_dcGateOpen) { setDcGate(false); showNotif('🚪 The Dream City gate swings shut.'); if (typeof sfx === 'function') sfx('door'); return; }
  if (dcPassValid()) {
    setDcGate(true); if (typeof sfx === 'function') sfx('door');
    showNotif('🎢 Day pass — welcome back to Dream City!');
    return;
  }
  if (state.coins < DC_PASS) { showNotif('🎢 A Dream City pass is ' + DC_PASS + ' 🪙 — earn a little more first!'); if (typeof sfx === 'function') sfx('sad'); return; }
  state.coins -= DC_PASS;
  document.getElementById('coin-count').textContent = state.coins;
  state.dcPassDay = state.dayCount || 0;
  setDcGate(true);
  if (typeof sfx === 'function') sfx('sell');
  showNotif('🎢 DAY PASS! Welcome to DREAM CITY — grab ride tickets at the kiosk by the fountain!');
  if (!state._seenDc) { state._seenDc = true; showDialogue('🎢 Dream City', 'WELCOME, dreamer! Rides need 🎟️ tickets — the kiosk by the fountain sells strips and all-day wristbands. Games alley pays PRIZES, the fireworks start after dark, and Dreamy gives the best hugs. 💜', 7000); }
}

// ── ticket money ──
function spendDcTicket(n, what) {
  if (dcBandOn()) return true;
  if ((state.dcTickets || 0) >= n) {
    state.dcTickets -= n;
    showNotif('🎟️ ' + what + ' — ' + state.dcTickets + ' ticket' + (state.dcTickets === 1 ? '' : 's') + ' left.');
    return true;
  }
  showNotif('🎟️ You need ' + n + ' ride ticket' + (n === 1 ? '' : 's') + '! The kiosk is by the fountain.');
  if (typeof sfx === 'function') sfx('sad');
  return false;
}

// ── PER-FRAME LIFE ────────────────────────────────────────────────────────
let _dcFwTimer = 2, _dcLastT = null;
function updateDreamCity(t) {
  if (!DC_R.ferris) return;
  const dt2 = _dcLastT === null ? 0.016 : Math.min(0.12, Math.max(0.001, t - _dcLastT));
  _dcLastT = t;
  const near = catGroup.position.x < -60;                     // only spend effort when the park can be seen

  // the gate closes itself behind you
  if (_dcGateOpen && Math.abs(catGroup.position.x - DC.gateX) > 10) setDcGate(false);

  // night: every bulb comes alive
  if (dcBulbMat) dcBulbMat.emissiveIntensity = dcNight() ? 1.7 : 0.25;

  if (near) {
    // ferris turns, gondolas stay level
    const W = DC_R.ferris;
    W.wheel.rotation.x = t * 0.14;
    W.gondolas.forEach(gd => { gd.rotation.x = -W.wheel.rotation.x; });
    // coaster cars chase each other round the hills
    const C = DC_R.coaster;
    C.cars.forEach((car, i) => {
      const s = t * 0.42 + i * 0.22;
      const px = C.cx + Math.cos(s) * C.rx, pz = C.cz + Math.sin(s) * C.rz, py = C.py(s);
      car.position.set(px, py + 0.3, pz);
      const s2 = s + 0.08;
      car.lookAt(C.cx + Math.cos(s2) * C.rx, C.py(s2) + 0.3, C.cz + Math.sin(s2) * C.rz);
    });
    // carousel spins, horses rise & fall
    const K = DC_R.carousel;
    K.plat.rotation.y = t * 0.5;
    K.horses.forEach(h => { h.position.y = 1.35 + Math.sin(t * 2 + h.userData.ph * 1.3) * 0.25; });
    // drop tower cycle: climb… hold… PLUNGE
    const D2 = DC_R.drop, cyc = (t % 11) / 11;
    let dy;
    if (cyc < 0.55) dy = 1.6 + (cyc / 0.55) * 17;
    else if (cyc < 0.7) dy = 18.6 + Math.sin(t * 30) * 0.05;
    else if (cyc < 0.78) dy = 18.6 - ((cyc - 0.7) / 0.08) * 17;
    else dy = 1.6 + Math.max(0, Math.sin((cyc - 0.78) / 0.22 * Math.PI * 3)) * 0.3 * (1 - (cyc - 0.78) / 0.22);
    D2.car.position.y = dy;
    D2.car.rotation.y = t * 0.6;
    // sky swings whirl, chairs flare out
    const S2 = DC_R.swings;
    S2.top.rotation.y = t * 0.85;
    S2.chairs.forEach((arm, i) => { arm.rotation.z = -0.42 + Math.sin(t * 2 + i) * 0.04; });
    // teacups: the disc turns one way, every cup spins the other
    const T = DC_R.teacups;
    T.disc.rotation.y = t * 0.5;
    T.cups.forEach((cup, i) => { cup.rotation.y = -t * (1.6 + i * 0.35); });
    // flume logs ride the loop
    const F = DC_R.flume;
    F.logs.forEach((log, i) => {
      const s = t * 0.5 + i * 2.1;
      const px = F.cx + Math.cos(s) * F.rx, pz = F.cz + Math.sin(s) * F.rz, py = F.hy(s % (Math.PI * 2));
      log.position.set(px, py + 0.35, pz);
      const s2 = s + 0.1;
      log.lookAt(F.cx + Math.cos(s2) * F.rx, F.hy(s2 % (Math.PI * 2)) + 0.35, F.cz + Math.sin(s2) * F.rz);
    });
    // the Dream Express circles the whole park
    const TR = DC_R.train;
    TR.s = t * 0.1;
    const hx = TR.cx + Math.cos(TR.s) * TR.rx, hz = TR.cz + Math.sin(TR.s) * TR.rz;
    TR.g.position.set(hx, 0.1, hz);
    const s2t = TR.s + 0.06;
    TR.g.lookAt(TR.cx + Math.cos(s2t) * TR.rx, 0.1, TR.cz + Math.sin(s2t) * TR.rz);
    // dodgem cars bounce off the rails and each other
    const B = DC_R.dodgem;
    B.cars.forEach((car, i) => {
      const u = car.userData;
      car.position.x += u.vx * 0.016; car.position.z += u.vz * 0.016;
      if (car.position.x < B.arena.x - B.arena.hw || car.position.x > B.arena.x + B.arena.hw) { u.vx *= -1; car.position.x += u.vx * 0.03; }
      if (car.position.z < B.arena.z - B.arena.hd || car.position.z > B.arena.z + B.arena.hd) { u.vz *= -1; car.position.z += u.vz * 0.03; }
      B.cars.forEach((o, j) => { if (j <= i) return; const dx = o.position.x - car.position.x, dz = o.position.z - car.position.z, d = Math.hypot(dx, dz); if (d < 1.3 && d > 0.01) { u.vx -= dx / d * 0.4; u.vz -= dz / d * 0.4; o.userData.vx += dx / d * 0.4; o.userData.vz += dz / d * 0.4; } });
      const sp = Math.hypot(u.vx, u.vz); if (sp > 2.2) { u.vx *= 2.2 / sp; u.vz *= 2.2 / sp; } if (sp < 0.8) { u.vx *= 1.4; u.vz *= 1.4; }
      car.rotation.y = Math.atan2(u.vx, u.vz);
    });
    // ghosts drift & moan — and when YOU step inside, they come to play
    const m0 = DC_MANOR, inManor = false;   // once the interior exists, the ghosts live THERE
    if (!_manorBuilt) DC_R.ghosts.forEach((gh, gi) => {
      gh.flipT = Math.max(0, gh.flipT - dt2);
      if (inManor) {                                                       // swirl around the cat, begging for high-fives
        const tx = catGroup.position.x + Math.cos(t * 0.9 + gi * 2.1) * 1.5;
        const tz = catGroup.position.z + Math.sin(t * 0.9 + gi * 2.1) * 1.2;
        gh.g.position.x += (Math.max(m0.x - 5.2, Math.min(m0.x + 5.2, tx)) - gh.g.position.x) * 0.03;
        gh.g.position.z += (Math.max(m0.z - 3.8, Math.min(m0.z + 3.8, tz)) - gh.g.position.z) * 0.03;
        gh.g.position.y = 1.1 + Math.sin(t * 2.6 + gh.ph) * 0.35;
        gh.g.lookAt(catGroup.position.x, 1.2, catGroup.position.z);
        if (Math.random() < 0.002 && typeof sfx === 'function') sfx('meow');   // a tiny spectral giggle
      } else {
        gh.g.position.x += (gh.hx - gh.g.position.x) * 0.02;
        gh.g.position.z += (gh.hz - gh.g.position.z) * 0.02;
        gh.g.position.y = 1.3 + Math.sin(t * 1.4 + gh.ph) * 0.25;
        gh.g.rotation.y = Math.sin(t * 0.7 + gh.ph) * 0.6;
      }
      if (gh.flipT > 0) { gh.g.rotation.z = Math.sin((0.9 - gh.flipT) / 0.9 * Math.PI * 2) * 1.2; const s2 = 1 + Math.sin((0.9 - gh.flipT) / 0.9 * Math.PI) * 0.3; gh.g.scale.setScalar(s2); }
      else { gh.g.rotation.z = 0; gh.g.scale.setScalar(1); }
    });
    // fountain jets pulse, gate flags wave
    DC_R.fountain.jets.forEach(j => { j.scale.y = 0.8 + Math.sin(t * 3 + j.userData.ph) * 0.25; });
    (DC_R.gateFlags || []).forEach((fl, i) => { fl.rotation.y = Math.sin(t * 3 + i * 2) * 0.3; });
    // kid balloons bob
    DC_R.kidBalloons.forEach((b, i) => { b.rotation.z = Math.sin(t * 1.2 + i * 1.7) * 0.12; });
    // queue & dancers & Bibi
    DC_R.queue.forEach(q => idleHuman(q, t));
    DC_R.dancers.forEach((d, i) => {
      d.group.position.y = 0.8 + Math.abs(Math.sin(t * 3 + d.phase)) * 0.18;
      d.group.position.x = d.baseX + Math.sin(t * 1.5 + d.phase) * 0.5;
      d.group.rotation.y = Math.PI + Math.sin(t * 3 + d.phase) * 0.5;
    });
    if (state.dcBalloonSeller) {
      idleHuman(state.dcBalloonSeller, t);
      state.dcBalloonSeller.bunch.children.forEach((b, i) => { b.rotation.z = Math.sin(t * 1.1 + i * 0.9) * 0.08; });
      state.dcBalloonSeller.bunch.position.y = Math.sin(t * 0.9) * 0.04;
    }
    // Dreamy waddles about the plaza, wings aflutter
    const DY = state.dcDreamy;
    if (DY) {
      (DY.group.userData.wings || []).forEach(w => { w.rotation.z = w.userData.d * (0.5 + Math.abs(Math.sin(t * 4)) * 0.35); });
      DY.timer -= 0.016;
      if (DY.mode === 'idle') {
        DY.group.position.y = Math.abs(Math.sin(t * 2.2)) * 0.06;
        if (DY.timer <= 0) { DY.mode = 'walk'; DY.wx = -125 + Math.random() * 12; DY.wz = -6 + Math.random() * 14; }
      } else {
        const dx = DY.wx - DY.group.position.x, dz = DY.wz - DY.group.position.z, d = Math.hypot(dx, dz);
        if (d < 0.4) { DY.mode = 'idle'; DY.timer = 2 + Math.random() * 4; }
        else { DY.group.position.x += dx / d * 0.018; DY.group.position.z += dz / d * 0.018; DY.group.rotation.y = Math.atan2(dx, dz); DY.group.position.y = Math.abs(Math.sin(t * 6)) * 0.08; }
      }
    }
    // guests wander the boulevards
    (state.dcGuests || []).forEach(v => {
      v.timer -= 0.016;
      if (v.mode === 'idle') {
        idleHuman(v, t); if (typeof blinkHuman === 'function') blinkHuman(v, t);
        if (v.timer <= 0) {
          const spots = [[-120, 0], [-146, 2], [-146, -22], [-136, 22], [-158, 30], [-146, 9], [-122, 30], [-134, -63], [-121, -28], [-119, 5]];
          const [sx, sz] = spots[Math.floor(Math.random() * spots.length)];
          v.tx = sx + Math.random() * 4 - 2; v.tz = sz + Math.random() * 4 - 2; v.mode = 'walk';
        }
      } else if (v.mode === 'walk') {
        if (walkToward(v, v.tx, v.tz, 0.03)) { v.mode = 'idle'; v.timer = 3 + Math.random() * 6; }
      }
    });
  }

  // 🎆 FIREWORKS after dark — the best show in the county
  if (dcNight() && catGroup.position.x < -40) {
    _dcFwTimer -= dt2;
    if (_dcFwTimer <= 0) { _dcFwTimer = 1.1 + Math.random() * 1.3; dcLaunchFirework(); if (Math.random() < 0.35) dcLaunchFirework(); }   // sometimes a double burst
  }
  for (let i = DC_FW.length - 1; i >= 0; i--) {
    const fw = DC_FW[i];
    fw.age += dt2;
    const pos = fw.pts.geometry.attributes.position;
    for (let k = 0; k < fw.n; k++) {
      pos.array[k * 3] += fw.vel[k * 3] * 0.016;
      pos.array[k * 3 + 1] += fw.vel[k * 3 + 1] * 0.016;
      pos.array[k * 3 + 2] += fw.vel[k * 3 + 2] * 0.016;
      fw.vel[k * 3 + 1] -= 0.06;
    }
    pos.needsUpdate = true;
    fw.mat.opacity = Math.max(0, 1 - fw.age / 1.5);
    if (fw.age > 1.5) { scene.remove(fw.pts); fw.pts.geometry.dispose(); fw.mat.dispose(); DC_FW.splice(i, 1); }
  }

  // a ride in progress drives the camera
  if (state.dcRide) updateDcRide(t, dt2);
}

function dcLaunchFirework() {
  const n = 30;
  const geo = new THREE.BufferGeometry();
  const px = -212 + Math.random() * 46, py2 = 22 + Math.random() * 8, pz = -118 + Math.random() * 46;   // the launch meadow, deep in the park's south-west
  const posArr = new Float32Array(n * 3), vel = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    posArr[k * 3] = px; posArr[k * 3 + 1] = py2; posArr[k * 3 + 2] = pz;
    const th = Math.random() * Math.PI * 2, ph2 = Math.acos(2 * Math.random() - 1), sp = 3.5 + Math.random() * 2.5;
    vel[k * 3] = Math.sin(ph2) * Math.cos(th) * sp; vel[k * 3 + 1] = Math.cos(ph2) * sp; vel[k * 3 + 2] = Math.sin(ph2) * Math.sin(th) * sp;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  const mat = new THREE.PointsMaterial({ color: [0xff6a5a, 0xffd040, 0x6ab8ff, 0x8aff8a, 0xd08aff, 0xff9ad0][Math.floor(Math.random() * 6)], size: 1.2, transparent: true, opacity: 1, fog: false });   // fog:false — sparks must outshine the night haze
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  DC_FW.push({ pts, mat, vel, n, age: 0 });
  if (catInDc() && typeof sfx === 'function' && Math.random() < 0.5) sfx('catch');
}

// ── RIDING THE RIDES: the camera takes the seat ──
function startDcRide(kind) {
  const r = DC_RIDES[kind];
  if (!r || state.dcRide) return;
  if (!spendDcTicket(r.cost, r.e + ' ' + r.name)) return;
  state.dcRide = { kind, t0: null, dur: r.dur };
  if (kind === 'dodgem') {                                   // fresh grid: you in car 1, rivals spread out
    const B = DC_R.dodgem;
    B.cars.forEach((car, i) => {
      car.position.set(r.x - 4 + (i % 3) * 4, 0.12, r.z - 2.5 + Math.floor(i / 3) * 5);
      car.userData.vx = 0; car.userData.vz = 0;
    });
    showNotif('🚗 YOU drive the red car — joystick to steer, BUMP everyone!');
  }
  state.cinematic = true;
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif(r.e + ' Hold on tight — enjoy the ' + r.name + '!');
}
function updateDcRide(t, dt2) {
  if (dt2 === undefined) dt2 = 0.016;
  const R = state.dcRide;
  if (R.t0 === null) R.t0 = t;
  const e = t - R.t0, f = Math.min(1, e / R.dur);
  const D = DC_RIDES[R.kind];
  let cam = null;
  if (R.kind === 'ferris') {
    const a = -Math.PI / 2 + f * Math.PI * 2;
    const gy = 12.5 + Math.sin(a) * 11, gz = D.z + Math.cos(a) * 11;
    cam = { px: D.x + 1.7, py: gy + 0.4, pz: gz, lx: -170, ly: 3, lz: -30 };
  } else if (R.kind === 'coaster') {
    const C = DC_R.coaster, s = f * Math.PI * 4;
    const px = C.cx + Math.cos(s) * C.rx, pz = C.cz + Math.sin(s) * C.rz, py = C.py(s) + 1.0;
    const s2 = s + 0.25;
    cam = { px, py, pz, lx: C.cx + Math.cos(s2) * C.rx, ly: C.py(s2) + 0.8, lz: C.cz + Math.sin(s2) * C.rz };
  } else if (R.kind === 'carousel') {
    const a = DC_R.carousel.plat.rotation.y;
    const px = D.x + Math.cos(a) * 3.1, pz = D.z + Math.sin(a) * 3.1;
    cam = { px, py: 2.3 + Math.sin(t * 2) * 0.25, pz, lx: D.x + Math.cos(a + 0.6) * 7, ly: 1.8, lz: D.z + Math.sin(a + 0.6) * 7 };
  } else if (R.kind === 'drop') {
    let y;
    if (f < 0.62) y = 2 + (f / 0.62) * 16.6;
    else if (f < 0.76) y = 18.6 + Math.sin(t * 26) * 0.06;
    else if (f < 0.83) y = 18.6 - ((f - 0.76) / 0.07) * 16.6;
    else y = 2 + Math.abs(Math.sin((f - 0.83) / 0.17 * Math.PI * 2.5)) * 0.5 * (1 - f);
    cam = { px: D.x + 2.1, py: y, pz: D.z, lx: -150, ly: y * 0.55, lz: 0 };
  } else if (R.kind === 'swings') {
    const a = t * 0.85;
    cam = { px: D.x + Math.cos(a) * 4.2, py: 5.9, pz: D.z + Math.sin(a) * 4.2, lx: D.x + Math.cos(a + 1.2) * 9, ly: 3.4, lz: D.z + Math.sin(a + 1.2) * 9 };
  } else if (R.kind === 'teacups') {
    const a = t * 0.5, b = -t * 1.9;
    const cx2 = D.x + Math.cos(a) * 2.9, cz2 = D.z + Math.sin(a) * 2.9;
    cam = { px: cx2, py: 1.7, pz: cz2, lx: cx2 + Math.cos(b) * 5, ly: 1.4, lz: cz2 + Math.sin(b) * 5 };
  } else if (R.kind === 'flume') {
    const F = DC_R.flume, s = 1.2 + f * Math.PI * 2;
    const px = F.cx + Math.cos(s) * F.rx, pz = F.cz + Math.sin(s) * F.rz, py = F.hy(s % (Math.PI * 2)) + 1.0;
    const s2 = s + 0.22;
    cam = { px, py, pz, lx: F.cx + Math.cos(s2) * F.rx, ly: F.hy(s2 % (Math.PI * 2)) + 0.7, lz: F.cz + Math.sin(s2) * F.rz };
    if (!R.splashed && (s % (Math.PI * 2)) > 2.55 && (s % (Math.PI * 2)) < 2.9) { R.splashed = true; if (typeof sfx === 'function') sfx('catch'); showNotif('💦 SPLASH!'); }
  } else if (R.kind === 'train') {
    const TR = DC_R.train, s = TR.s - 0.12;
    const px = TR.cx + Math.cos(s) * TR.rx, pz = TR.cz + Math.sin(s) * TR.rz;
    const s2 = s + 0.3;
    cam = { px, py: 1.7, pz, lx: TR.cx + Math.cos(s2) * TR.rx, ly: 1.4, lz: TR.cz + Math.sin(s2) * TR.rz };
  } else if (R.kind === 'slide') {
    if (f < 0.3) cam = { px: D.x + 2.6, py: 2 + (f / 0.3) * 8.6, pz: D.z, lx: D.x, ly: 2 + (f / 0.3) * 8.6 + 0.5, lz: D.z };
    else { const ff = (f - 0.3) / 0.7, a = ff * Math.PI * 2.4, y = 10.4 - ff * 9.4;
      cam = { px: D.x + Math.cos(a) * 2.6, py: y + 0.7, pz: D.z + Math.sin(a) * 2.6, lx: D.x + Math.cos(a + 0.5) * 3.2, ly: y - 0.4, lz: D.z + Math.sin(a + 0.5) * 3.2 }; }
  } else if (R.kind === 'dodgem') {
    const B = DC_R.dodgem, car = B.cars[0], u = car.userData;
    // read the wheel: joystick or arrow keys, steering is camera-relative like the cat
    let inF = (state.keys['ArrowUp'] || state.keys['w'] ? 1 : 0) - (state.keys['ArrowDown'] || state.keys['s'] ? 1 : 0);
    let inS = (state.keys['ArrowRight'] || state.keys['d'] ? 1 : 0) - (state.keys['ArrowLeft'] || state.keys['a'] ? 1 : 0);
    if (joy.active && Math.hypot(joy.x, joy.y) > 0.18) { inF = -joy.y; inS = joy.x; }
    const fX = -Math.sin(state.camYaw), fZ = -Math.cos(state.camYaw);
    const rX = Math.cos(state.camYaw), rZ = -Math.sin(state.camYaw);
    u.vx += (fX * inF + rX * inS) * 0.14;
    u.vz += (fZ * inF + rZ * inS) * 0.14;
    const sp = Math.hypot(u.vx, u.vz); if (sp > 3.2) { u.vx *= 3.2 / sp; u.vz *= 3.2 / sp; }
    // rival cars hunt you down (gently)
    B.cars.forEach((o, i2) => { if (i2 === 0) return; const ou = o.userData; ou.vx += (car.position.x - o.position.x) * 0.0011; ou.vz += (car.position.z - o.position.z) * 0.0011; });
    // count your bumps!
    R.bumpCd = Math.max(0, (R.bumpCd || 0) - dt2);
    if (R.bumpCd === 0) {
      const hit = B.cars.some((o, i2) => i2 !== 0 && Math.hypot(o.position.x - car.position.x, o.position.z - car.position.z) < 1.35);
      if (hit) { R.bumps = (R.bumps || 0) + 1; R.bumpCd = 0.7; if (typeof sfx === 'function') sfx('catch'); showNotif('💥 BUMP! ×' + R.bumps); }
    }
    // chase cam orbits with the drag finger — steer AND look, 360°
    cam = { px: car.position.x + Math.sin(state.camYaw) * 3.8, py: 2.4, pz: car.position.z + Math.cos(state.camYaw) * 3.8, lx: car.position.x, ly: 0.9, lz: car.position.z };
  }
  if (cam && R.kind !== 'dodgem') {                                      // 🔄 drag the screen to look all around while you ride
    if (R.yaw0 === undefined) { R.yaw0 = state.camYaw; R.h0 = state.camHeight; }
    const yo = state.camYaw - R.yaw0;
    if (Math.abs(yo) > 0.0001) {
      const dx = cam.lx - cam.px, dz = cam.lz - cam.pz;
      const cs = Math.cos(yo), sn = Math.sin(yo);
      cam.lx = cam.px + dx * cs - dz * sn;
      cam.lz = cam.pz + dx * sn + dz * cs;
    }
    cam.ly += (R.h0 - state.camHeight) * 0.45;                             // drag up/down to tilt your gaze
  }
  if (cam) state.cineCam = cam;
  if (f >= 1) {
    const bumpLine = (R.kind === 'dodgem' && R.bumps) ? ' ' + R.bumps + ' bumps — what a driver! 🏁' : '';
    state.dcRide = null; state.cinematic = false; state.cineCam = null;
    if (typeof sfx === 'function') sfx('coin');
    showNotif(D.e + ' What a ride!' + bumpLine + ' Again? 😺');
    _catHappyT = 2.0; if (typeof spawnHeart === 'function') spawnHeart();
  }
}

// ── INTERACTIONS: one context hook drives everything in the park ──────────
function dcContext(cp) {
  if (cp.x > -95) return null;
  const near = (x, z, d) => Math.hypot(cp.x - x, cp.z - z) < d;
  if (near(DC_KIOSK.x, DC_KIOSK.z, 2.6)) return { id: 'dc:kiosk', label: '🎟️ Buy ride tickets (' + (state.dcTickets || 0) + ' left)' };
  for (const k in DC_RIDES) { const r = DC_RIDES[k]; if (near(r.x, r.z, r.r + 2.4)) return { id: 'dc:ride', kind: k, label: r.e + ' Ride the ' + r.name + ' · ' + r.cost + ' 🎟️' }; }
  for (const s of DC_STALLS) { if (near(s.x, s.z + 1.4, 2.2)) return { id: 'dc:stall', stall: s, label: s.e + ' Play ' + s.name + ' · 1 🎟️' }; }
  for (const s of DC_FOOD) { if (near(s.x, s.z, 2.2)) return { id: 'dc:food', food: s, label: s.e + ' ' + s.name + ' · ' + s.cost + ' 🪙' }; }
  if (near(DC_GIFT.x, DC_GIFT.z - 1.6, 2.6)) return { id: 'dc:gift', label: '🧸 Dreamy plush · 15 🪙' };
  if (near(DC_WELL.x, DC_WELL.z, 2.0)) return { id: 'dc:well', label: '🪙 Make a wish · 1 🪙' };
  if (state.dcBalloonSeller && near(state.dcBalloonSeller.group.position.x, state.dcBalloonSeller.group.position.z, 2.6) && !state.catBalloon) return { id: 'dc:balloon', label: '🎈 Balloon · 5 🪙' };
  if (state.dcDreamy && near(state.dcDreamy.group.position.x, state.dcDreamy.group.position.z, 2.4)) return { id: 'dc:hug', label: '🤗 Hug Dreamy' };
  if (near(DC_MANOR.x, DC_MANOR.z + 4.5, 2.8)) return { id: 'dc:manor', label: state.dcManorDay === (state.dayCount || 0) ? '👻 Enter the Haunted Manor' : '👻 Enter the Haunted Manor · 1 🎟️' };
  if (near(DC_FUN.x, DC_FUN.z + 3, 2.6)) return { id: 'dc:funhouse', label: state.dcFunDay === (state.dayCount || 0) ? '🪞 Enter the Fun House' : '🪞 Enter the Fun House · 1 🎟️' };
  if (near(DC_STAGE.x + 4.8, DC_STAGE.z, 2.6)) return { id: 'dc:mascot', label: state.dcMascot ? '🎭 Hang up the Dreamy suit' : '🎭 Wear the Dreamy suit (job)' };
  if (state.dcMascot) { const gst = (state.dcGuests || []).find(v => v._waved !== (state.dayCount || 0) && Math.hypot(cp.x - v.group.position.x, cp.z - v.group.position.z) < 2.2); if (gst) { return { id: 'dc:wave', guest: gst, label: '👋 Wave to the visitors! (+2 🪙)' }; } }
  return null;
}

function dcAction(ctx) {
  const coinEl = () => { document.getElementById('coin-count').textContent = state.coins; };
  if (ctx.id === 'dc:kiosk') {
    state.uiOpen = true;
    let h = `<div class="zoo-want">🎟️</div>`;
    h += `<div class="modal-sub" style="font-size:.95rem">You have <b>${state.dcTickets || 0}</b> ride ticket${(state.dcTickets || 0) === 1 ? '' : 's'}${dcBandOn() ? ' + a WRISTBAND ✨' : ''}</div>`;
    h += `<div class="co-grid" style="grid-template-columns:1fr 1fr">`;
    h += `<button onclick="dcBuyStrip()">🎟️<small>${DC_STRIP_N} tickets · ${DC_STRIP_COST} 🪙</small></button>`;
    h += `<button onclick="dcBuyBand()">⌚<small>Wristband · ${DC_BAND} 🪙<br>ALL rides today!</small></button>`;
    h += `</div><button class="modal-close" onclick="closeCheckout()">Not now</button>`;
    document.getElementById('checkout-title').textContent = '🎟️ Ride tickets';
    document.getElementById('checkout-body').innerHTML = h;
    document.getElementById('checkout').classList.add('show');
  }
  else if (ctx.id === 'dc:ride') startDcRide(ctx.kind);
  else if (ctx.id === 'dc:stall') {
    if (!spendDcTicket(1, ctx.stall.e + ' ' + ctx.stall.name)) return;
    startMinigame({ job: ctx.stall.game, hasJob: true, name: ctx.stall.name, bubble: { material: { color: { setHex() {} }, emissive: { setHex() {} } } } });
  }
  else if (ctx.id === 'dc:food') {
    const s = ctx.food;
    if (state.coins < s.cost) { showNotif(s.e + ' That costs ' + s.cost + ' 🪙…'); if (typeof sfx === 'function') sfx('sad'); return; }
    state.coins -= s.cost; coinEl();
    state.needs.hunger = Math.min(100, (state.needs.hunger || 0) + 55);
    state.needs.thirst = Math.min(100, (state.needs.thirst || 0) + (s.name === 'Fizzy Pop' ? 60 : 25));
    _catHappyT = 1.6; if (typeof spawnHeart === 'function') spawnHeart();
    if (typeof sfx === 'function') sfx('eat');
    showNotif(s.e + ' ' + s.line);
  }
  else if (ctx.id === 'dc:gift') {
    if (state.carryBag) { showNotif('🛍️ Your mouth is full — deliver what you\'re carrying first!'); return; }
    if (state.coins < 15) { showNotif('🧸 The Dreamy plush is 15 🪙…'); if (typeof sfx === 'function') sfx('sad'); return; }
    state.coins -= 15; coinEl();
    if (typeof setCarryBag === 'function') setCarryBag({ id: 'dcplush', name: 'Dreamy Plush', e: '🧸', price: 15 }, 'Dream Gifts');
    if (typeof sfx === 'function') sfx('sell');
    showNotif('🧸 One Dreamy plush, bagged! The Miller kids would ADORE this.');
  }
  else if (ctx.id === 'dc:well') {
    if (state.coins < 1) { showNotif('🪙 You need a coin to wish on!'); return; }
    state.coins -= 1; coinEl();
    if (typeof sfx === 'function') sfx('ui');
    const roll = Math.random();
    if (roll < 0.12) { state.coins += 4; coinEl(); showNotif('✨ The well GLOWS — four coins bubble up! Lucky whiskers!'); if (typeof sfx === 'function') sfx('coin'); }
    else showNotif(['🌟 You wish for warm sunbeams… somewhere, a cloud moves aside.', '💭 You wish the Millers every happiness. The water shimmers.', '🐟 You wish for fish. You can almost smell it…', '🌈 Your coin spins twice before it sinks — a good sign!', '💜 You hear a tiny echo: "dream big, little cat."'][Math.floor(Math.random() * 5)]);
  }
  else if (ctx.id === 'dc:ghost') {
    const gh = DC_R.ghosts[ctx.gi];
    gh.flipT = 0.9;                                          // the delighted somersault
    if (typeof sfx === 'function') sfx('jump');
    _catHappyT = 1.6; if (typeof spawnHeart === 'function') spawnHeart();
    const day = state.dayCount || 0;
    if (!state._dcSpook || state._dcSpook.day !== day) state._dcSpook = { day, got: {}, paid: false };
    state._dcSpook.got[ctx.gi] = true;
    const n = Object.keys(state._dcSpook.got).length;
    if (n >= 3 && !state._dcSpook.paid) {
      state._dcSpook.paid = true;
      state.coins += 4; document.getElementById('coin-count').textContent = state.coins;
      if (typeof sfx === 'function') sfx('coin');
      showNotif('👻👻👻 The GHOST TRIO high-fived! They rain 4 spectral coins on you!');
    } else {
      showNotif(['👻 The ghost LOOPS with joy — your paw tingles!', '👻 Cold and giggly, like high-fiving a cloud!', '👻 The ghost does a little somersault. Best friends now.'][Math.min(n - 1, 2)] + ' (' + Math.min(n, 3) + '/3)');
    }
  }
  else if (ctx.id === 'dc:balloon') { if (typeof buyZooBalloon === 'function') buyZooBalloon(); }
  else if (ctx.id === 'dc:hug') {
    if (typeof doFlash === 'function') doFlash(catGroup.position);
    _catHappyT = 2.0; if (typeof spawnHeart === 'function') spawnHeart();
    if (typeof sfx === 'function') sfx('purr');
    if (state._dreamyHugDay !== (state.dayCount || 0)) {
      state._dreamyHugDay = state.dayCount || 0;
      state.goodDeeds = (state.goodDeeds || 0) + 1;
      showNotif('🤗 Dreamy wraps you in the SOFTEST dragon hug. (+1 good deed — kindness is catching!)');
    } else showNotif('🤗 Another Dreamy hug! They never get old.');
  }
  else if (ctx.id === 'dc:manor') {
    if (state.dcManorDay !== (state.dayCount || 0)) {
      if (!spendDcTicket(1, '👻 Haunted Manor')) return;
      state.dcManorDay = state.dayCount || 0;
    }
    enterManor();
  }
  else if (ctx.id === 'dc:cauldron') {
    const M = DC_R.manor;
    const brews = [[0x50d080, 0x28a050, '🥄 The brew turns GREEN and burps politely.'], [0xd05080, 0xa02850, '🥄 Pink! It smells of strawberries and old socks.'], [0x5080d0, 0x2850a0, '🥄 Deep blue — a tiny lightning bolt crackles out!'], [0xd0a850, 0xa07828, '🥄 GOLD! Wait — two real coins float up! +2 🪙'], [0x9050d0, 0x6828a0, '🥄 Purple. Somewhere, Dreamy sneezes.']];
    const pick = brews[Math.floor(Math.random() * brews.length)];
    M.brew.material.color.setHex(pick[0]); M.brew.material.emissive.setHex(pick[1]);
    M.bubbles.forEach(bu => { bu.material.color.setHex(pick[0]); bu.material.emissive.setHex(pick[1]); });
    if (pick[0] === 0xd0a850) { state.coins += 2; document.getElementById('coin-count').textContent = state.coins; if (typeof sfx === 'function') sfx('coin'); }
    else if (typeof sfx === 'function') sfx('eat');
    showNotif(pick[2]);
  }
  else if (ctx.id === 'dc:organ') {
    if (typeof sfx === 'function') { sfx('sad'); setTimeout(() => sfx('door'), 350); setTimeout(() => sfx('mail'), 750); }
    DC_R.ghosts.forEach(gh => gh.flipT = 0.9);                 // the ghosts DANCE
    _catHappyT = 1.8;
    showNotif('🎹 DUN dun DUNNN… the ghosts spin with delight!');
  }
  else if (ctx.id === 'dc:chest') {
    const day = state.dayCount || 0;
    if (state._dcChestDay === day) { showNotif('🪙 Just moths and one very cross spider. Try tomorrow.'); return; }
    state._dcChestDay = day;
    state.coins += 3; document.getElementById('coin-count').textContent = state.coins;
    if (typeof sfx === 'function') sfx('coin');
    showNotif('🪙 CREEEAK… three dusty coins glitter inside! The chest sighs.');
  }
  else if (ctx.id === 'dc:funhouse') {
    if (state.dcFunDay !== (state.dayCount || 0)) {
      if (!spendDcTicket(1, '🪞 Fun House')) return;
      state.dcFunDay = state.dayCount || 0;
    }
    enterFunhouse();
  }
  else if (ctx.id === 'dc:ballpit') {
    const F = DC_R.fun;
    F.balls.forEach(ball => { ball.userData.vy = 1.6 + Math.random() * 2.4; const a = Math.random() * Math.PI * 2; ball.userData.vx = Math.cos(a) * 1.4; ball.userData.vz = Math.sin(a) * 1.4; });
    _funBounceT = 1.2;
    _catHappyT = 2.0; if (typeof spawnHeart === 'function') spawnHeart();
    if (typeof sfx === 'function') sfx('catch');
    const day = state.dayCount || 0;
    if (state._dcPitDay !== day) {
      state._dcPitDay = day;
      state.dcTickets = (state.dcTickets || 0) + 1;
      showNotif('🌈 SPLOOSH! Balls everywhere — and look, a lost RIDE TICKET at the bottom! +1 🎟️');
    } else showNotif('🌈 SPLOOSH! You vanish into the balls. Ten out of ten.');
  }
  else if (ctx.id === 'dc:tramp') {
    _funBounceT = 2.4;
    _catHappyT = 2.0; if (typeof spawnHeart === 'function') spawnHeart();
    if (typeof sfx === 'function') { sfx('jump'); setTimeout(() => sfx('jump'), 460); setTimeout(() => sfx('jump'), 920); }
    showNotif('🤸 BOING! BOING! BOING! Your whiskers reach the disco ball!');
  }
  else if (ctx.id === 'dc:confetti') {
    const cols = [0xe05a4a, 0xe8d040, 0x5a9ad0, 0x9a6ad0];
    for (let b2 = 0; b2 < 3; b2++) {
      const n = 26, geo = new THREE.BufferGeometry();
      const posArr = new Float32Array(n * 3), vel = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) {
        posArr[k * 3] = 0; posArr[k * 3 + 1] = 1.4; posArr[k * 3 + 2] = -1.4;
        const th = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 2.2;
        vel[k * 3] = Math.cos(th) * sp; vel[k * 3 + 1] = 2.2 + Math.random() * 1.8; vel[k * 3 + 2] = Math.sin(th) * sp * 0.7 + 0.8;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      const mat = new THREE.PointsMaterial({ color: cols[(Math.random() * 4) | 0], size: 0.09, transparent: true, opacity: 1 });
      const pts = new THREE.Points(geo, mat);
      funScene.add(pts);
      FUN_CONF.push({ pts, mat, vel, n, age: 0 });
    }
    if (typeof sfx === 'function') sfx('upgrade');
    _catHappyT = 1.6;
    showNotif('🎉 POOMPH! Confetti rains over the whole fun house!');
  }
  else if (ctx.id === 'dc:mascot') {
    state.dcMascot = !state.dcMascot;
    if (state.dcMascot) {
      if (!state._dcMascotHead) {
        const mh = new THREE.Group();
        const hd = new THREE.Mesh(G.sph(0.42, 12, 10), pbr(0x9a6ad0, 0.7)); mh.add(hd);
        [-1, 1].forEach(d => { const horn = new THREE.Mesh(G.cone(0.08, 0.26, 8), pbr(0xffd040, 0.5)); horn.position.set(d * 0.2, 0.4, 0); mh.add(horn);
          const eye = new THREE.Mesh(G.sph(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); eye.position.set(d * 0.17, 0.08, 0.34); mh.add(eye); });
        mh.position.set(0, 1.05, 0.1);
        state._dcMascotHead = mh;
      }
      catGroup.add(state._dcMascotHead);
      showNotif('🎭 You ARE Dreamy now! Find visitors and 👋 wave — 2 🪙 a smile.');
    } else {
      if (state._dcMascotHead) catGroup.remove(state._dcMascotHead);
      showNotif('🎭 Suit\'s back on the peg. Good shift, little dragon.');
    }
    if (typeof sfx === 'function') sfx('ui');
  }
  else if (ctx.id === 'dc:wave') {
    ctx.guest._waved = state.dayCount || 0;
    state.coins += 2; state.earned = (state.earned || 0) + 2; coinEl();
    _catHappyT = 1.4; if (typeof spawnHeart === 'function') spawnHeart();
    if (typeof sfx === 'function') sfx('coin');
    showNotif('👋 They GIGGLE and snap a photo with Dreamy! +2 🪙');
    if (typeof doFlash === 'function') doFlash(catGroup.position);
  }
}
function dcBuyStrip() {
  if (state.coins < DC_STRIP_COST) { showNotif('🎟️ A strip is ' + DC_STRIP_COST + ' 🪙…'); if (typeof sfx === 'function') sfx('sad'); return; }
  state.coins -= DC_STRIP_COST; state.dcTickets = (state.dcTickets || 0) + DC_STRIP_N;
  document.getElementById('coin-count').textContent = state.coins;
  if (typeof sfx === 'function') sfx('sell');
  closeCheckout();
  showNotif('🎟️ ' + DC_STRIP_N + ' shiny ride tickets! (' + state.dcTickets + ' total)');
}
function dcBuyBand() {
  if (dcBandOn()) { showNotif('⌚ You\'re already wearing today\'s wristband!'); return; }
  if (state.coins < DC_BAND) { showNotif('⌚ The wristband is ' + DC_BAND + ' 🪙…'); if (typeof sfx === 'function') sfx('sad'); return; }
  state.coins -= DC_BAND; state.dcBandDay = state.dayCount || 0;
  document.getElementById('coin-count').textContent = state.coins;
  if (typeof sfx === 'function') sfx('upgrade');
  closeCheckout();
  showNotif('⌚ WRISTBAND ON — every ride is yours today. Go go go!');
}
function dcAwardPrize(job) {
  if (typeof setCarryBag === 'function' && !state.carryBag) {
    setCarryBag({ id: 'dcplush', name: 'Dreamy Plush', e: '🧸', price: 0 }, 'the games alley');
    showNotif('🏆 TOP PRIZE! A Dreamy plush — carry it home to the kids!');
  } else { state.coins += 3; document.getElementById('coin-count').textContent = state.coins; showNotif('🏆 Top score! +3 bonus 🪙'); }
  if (typeof sfx === 'function') sfx('upgrade');
}

// ── THE GAMES ALLEY: six real carnival minigames ──────────────────────────
function _dcSky(mg, top, bot) { const g2 = mg.ctx.createLinearGradient(0, 0, 0, mg.h); g2.addColorStop(0, top); g2.addColorStop(1, bot); mg.ctx.fillStyle = g2; mg.ctx.fillRect(0, 0, mg.w, mg.h); }
function _dcEmoji(mg, e, x, y, size, rot) { const c = mg.ctx; c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.font = size + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, 0, 0); c.restore(); }

// 🎈 Balloon Darts — pop the balloons, mind the bombs!
const dcJobDarts = {
  id: 'darts', title: '🎈 Balloon Darts', hint: 'Pop the balloons! NEVER the 💣!', carnival: true, prizeAt: 11,
  icon: '🎈', verb: 'popped', noun: ['balloon', 'balloons'], duration: 22, swipe: false,
  failText: 'Not one balloon popped…', doneLine: c => `${c} balloons popped! Take your winnings, sharp-eyes! 🎈`, failLine: 'The balloons win this round — try again!',
  start(mg) { mg.entities = []; mg.spawnTimer = 0; },
  update(mg, dt) {
    mg.spawnTimer -= dt;
    if (mg.spawnTimer <= 0) {
      mg.spawnTimer = 0.5;
      const bomb = Math.random() < 0.18, gold = !bomb && Math.random() < 0.1;
      mg.entities.push({ x: 30 + Math.random() * (mg.w - 60), y: mg.h + 24, vy: 55 + Math.random() * 45, sway: Math.random() * 6, col: ['#e05a4a', '#e8c040', '#5a9ad0', '#6ac06a', '#c06ad0'][Math.floor(Math.random() * 5)], bomb, gold, pop: 0 });
    }
    mg.entities.forEach(b => { if (b.pop > 0) { b.pop += dt; return; } b.y -= b.vy * dt; b.x += Math.sin(mg.timeLeft * 3 + b.sway) * 0.5; });
    mg.entities = mg.entities.filter(b => b.y > -40 && b.pop < 0.25);
  },
  draw(mg) {
    const c = mg.ctx; _dcSky(mg, '#2a3a6a', '#6a4a8a');
    c.fillStyle = '#3a2a4a'; c.fillRect(0, mg.h - 26, mg.w, 26);
    mg.entities.forEach(b => {
      if (b.pop > 0) { c.strokeStyle = b.bomb ? '#333' : b.col; c.lineWidth = 3; for (let k = 0; k < 6; k++) { const a = k * 1.05 + b.pop * 4; c.beginPath(); c.moveTo(b.x + Math.cos(a) * 8, b.y + Math.sin(a) * 8); c.lineTo(b.x + Math.cos(a) * (14 + b.pop * 60), b.y + Math.sin(a) * (14 + b.pop * 60)); c.stroke(); } return; }
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(b.x, b.y + 18); c.lineTo(b.x + Math.sin(b.sway) * 4, b.y + 40); c.stroke();
      if (b.bomb) { _dcEmoji(mg, '💣', b.x, b.y, 30); return; }
      c.fillStyle = b.gold ? '#ffd970' : b.col;
      c.beginPath(); c.ellipse(b.x, b.y, 14, 17, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(b.x - 5, b.y - 6, 4, 6, -0.4, 0, 7); c.fill();
      if (b.gold) _dcEmoji(mg, '✨', b.x, b.y - 22, 14);
    });
  },
  tap(mg, cx, cy) {
    let best = null, bd = 34;
    mg.entities.forEach(b => { if (b.pop > 0) return; const d = Math.hypot(b.x - cx, b.y - cy); if (d < bd) { bd = d; best = b; } });
    if (!best) return false;
    best.pop = 0.01;
    if (best.bomb) { mgLoseLife(cx, cy); return false; }
    mg.caught++; if (best.gold) mg.bonus = (mg.bonus || 0) + 2;
    return true;
  },
};

// 🔨 Whack-a-Mole — bop the moles, never the sleepy kitten
const dcJobMoles = {
  id: 'moles', title: '🔨 Whack-a-Mole', hint: 'Bop the moles — NOT the sleeping kitten! 😴', carnival: true, prizeAt: 11,
  icon: '🔨', verb: 'bopped', noun: ['mole', 'moles'], duration: 24, swipe: false,
  failText: 'The moles dodged every bop…', doneLine: c => `${c} moles bopped back down their holes! 🔨`, failLine: 'Slippery moles! Another go?',
  start(mg) {
    mg.entities = [];
    for (let r = 0; r < 3; r++) for (let col = 0; col < 3; col++)
      mg.entities.push({ x: mg.w * ((col + 0.5) / 3), y: 96 + r * ((mg.h - 150) / 2.4), up: 0, kind: null, t: 0.6 + Math.random() * 2 });
  },
  update(mg, dt) {
    mg.entities.forEach(h => {
      if (h.up > 0) { h.up -= dt; if (h.up <= 0) h.kind = null; return; }
      h.t -= dt;
      if (h.t <= 0) { h.t = 0.7 + Math.random() * 1.6; h.up = 0.8 + Math.random() * 0.7; h.kind = Math.random() < 0.2 ? 'kitten' : 'mole'; h.bopped = false; }
    });
  },
  draw(mg) {
    const c = mg.ctx; _dcSky(mg, '#7ab048', '#4a7a30');
    mg.entities.forEach(h => {
      c.fillStyle = '#3a2a1a'; c.beginPath(); c.ellipse(h.x, h.y + 16, 26, 11, 0, 0, 7); c.fill();
      if (h.up > 0 && h.kind) {
        const rise = Math.min(1, (0.8 - Math.min(h.up, 0.8)) * 8, h.up * 5);
        _dcEmoji(mg, h.bopped ? '💫' : (h.kind === 'kitten' ? '😴' : '🐹'), h.x, h.y + 8 - rise * 22, 32);
      }
      c.fillStyle = '#241a10'; c.beginPath(); c.ellipse(h.x, h.y + 18, 24, 8, 0, 0, 7); c.fill();
    });
  },
  tap(mg, cx, cy) {
    const h = mg.entities.find(h2 => h2.up > 0 && !h2.bopped && Math.hypot(h2.x - cx, (h2.y - 8) - cy) < 32);
    if (!h) return false;
    h.bopped = true; h.up = Math.min(h.up, 0.18);
    if (h.kind === 'kitten') { mgLoseLife(cx, cy); return false; }
    mg.caught++; return true;
  },
};

// 🦆 Lucky Ducks — hook the ducks as they glide by
const dcJobDucks = {
  id: 'ducks', title: '🦆 Lucky Ducks', hint: 'Tap the ducks! The 🐡 pricks — leave it be!', carnival: true, prizeAt: 10,
  icon: '🦆', verb: 'hooked', noun: ['duck', 'ducks'], duration: 22, swipe: false,
  failText: 'Every duck sailed past…', doneLine: c => `${c} lucky ducks hooked! Quack-tastic! 🦆`, failLine: 'The ducks got away — again soon?',
  start(mg) { mg.entities = []; mg.spawnTimer = 0; },
  update(mg, dt) {
    mg.spawnTimer -= dt;
    if (mg.spawnTimer <= 0) {
      mg.spawnTimer = 0.55;
      const lane = Math.floor(Math.random() * 3), dir = lane % 2 ? -1 : 1;
      const puffer = Math.random() < 0.18, gold = !puffer && Math.random() < 0.1;
      mg.entities.push({ x: dir > 0 ? -30 : mg.w + 30, y: 110 + lane * ((mg.h - 170) / 2), vx: dir * (70 + Math.random() * 50) * (gold ? 1.5 : 1), puffer, gold, got: 0 });
    }
    mg.entities.forEach(d => { if (d.got > 0) { d.got += dt; return; } d.x += d.vx * dt; });
    mg.entities = mg.entities.filter(d => d.x > -60 && d.x < mg.w + 60 && d.got < 0.3);
  },
  draw(mg) {
    const c = mg.ctx; _dcSky(mg, '#4a8ab0', '#2a5a80');
    for (let l = 0; l < 3; l++) { const y = 110 + l * ((mg.h - 170) / 2); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(0, y + 12, mg.w, 10); }
    mg.entities.forEach(d => {
      const bob = Math.sin(mg.timeLeft * 4 + d.x * 0.05) * 3;
      if (d.got > 0) { _dcEmoji(mg, '⭐', d.x, d.y - 20 - d.got * 40, 22); return; }
      _dcEmoji(mg, d.puffer ? '🐡' : '🦆', d.x, d.y + bob, d.gold ? 34 : 28, d.vx < 0 ? 0 : 0);
      if (d.gold) _dcEmoji(mg, '✨', d.x, d.y - 22 + bob, 14);
    });
  },
  tap(mg, cx, cy) {
    let best = null, bd = 32;
    mg.entities.forEach(d => { if (d.got > 0) return; const dd = Math.hypot(d.x - cx, d.y - cy); if (dd < bd) { bd = dd; best = d; } });
    if (!best) return false;
    if (best.puffer) { best.got = 0.01; mgLoseLife(cx, cy); return false; }
    best.got = 0.01; mg.caught++; if (best.gold) mg.bonus = (mg.bonus || 0) + 2;
    return true;
  },
};

// 💪 High Striker — tap at the TOP of the swing to ring the bell
const dcJobStriker = {
  id: 'striker', title: '💪 High Striker', hint: 'Tap when the marker is at the TOP — ring that bell! 🔔', carnival: true, prizeAt: 13,
  icon: '💪', verb: 'scored', noun: ['point', 'points'], duration: 20, swipe: false,
  failText: 'The bell stayed silent…', doneLine: c => `${c} points of pure muscle! DING! 💪`, failLine: 'Swing and a miss — build those paws up!',
  start(mg) { mg.mark = 0; mg.flash = 0; mg.ringT = 0; },
  update(mg, dt) { mg.mark = Math.abs(Math.sin(mg.timeLeft * 2.6)); mg.flash = Math.max(0, (mg.flash || 0) - dt); mg.ringT = Math.max(0, (mg.ringT || 0) - dt); },
  draw(mg) {
    const c = mg.ctx; _dcSky(mg, '#8a4a30', '#4a2a1a');
    const tx = mg.w / 2, top = 70, bot = mg.h - 60;
    c.fillStyle = '#6a4a30'; c.fillRect(tx - 12, top, 24, bot - top);
    const zones = [['#e05a4a', 0.55], ['#e8a030', 0.3], ['#e8d040', 0.12], ['#6ac06a', 0]];
    let y0 = bot;
    zones.forEach(([col, from]) => { const y1 = top + (bot - top) * from; c.fillStyle = col; c.fillRect(tx - 9, y1, 18, y0 - y1); y0 = y1; });
    _dcEmoji(mg, mg.ringT > 0 ? '🔔' : '🛎️', tx, top - 18, mg.ringT > 0 ? 40 : 30, mg.ringT > 0 ? Math.sin(mg.timeLeft * 40) * 0.3 : 0);
    const my = bot - (bot - top) * mg.mark;
    c.fillStyle = '#fff'; c.fillRect(tx - 20, my - 4, 40, 8);
    _dcEmoji(mg, '💪', tx - 44, my, 24);
    if (mg.flash > 0) { c.fillStyle = `rgba(255,255,160,${mg.flash})`; c.fillRect(0, 0, mg.w, mg.h); }
    c.fillStyle = '#ffe9c0'; c.font = 'bold 13px sans-serif'; c.textAlign = 'center';
    c.fillText('TOP = +3   ·   HIGH = +2   ·   MID = +1   ·   LOW = ouch', mg.w / 2, mg.h - 24);
  },
  tap(mg) {
    if (mg.mark > 0.88) { mg.caught += 3; mg.flash = 0.5; mg.ringT = 0.7; if (typeof sfx === 'function') sfx('upgrade'); return true; }
    if (mg.mark > 0.7) { mg.caught += 2; return true; }
    if (mg.mark > 0.45) { mg.caught += 1; return true; }
    mgLoseLife(mg.w / 2, mg.h - 80); return false;
  },
};

// 🥫 Can Knockdown — the crosshair sweeps; fire when it's on a can, NOT the vase
const dcJobCans = {
  id: 'cans', title: '🥫 Can Knockdown', hint: 'Tap to throw when the aim is on a can — spare the vase! 🏺', carnival: true, prizeAt: 10,
  icon: '🥫', verb: 'toppled', noun: ['can', 'cans'], duration: 22, swipe: false,
  failText: 'Every can still standing…', doneLine: c => `${c} cans sent flying! What an arm! 🥫`, failLine: 'Those cans are glued down, surely. Once more?',
  start(mg) { this.rack(mg); },
  rack(mg) {
    mg.entities = [];
    const cx2 = mg.w / 2, by = mg.h - 90;
    const spots = [[-66, 0], [-22, 0], [22, 0], [66, 0], [-44, -34], [0, -34], [44, -34], [-22, -68], [22, -68]];
    const vaseAt = Math.floor(Math.random() * spots.length);
    spots.forEach(([dx, dy], i) => mg.entities.push({ x: cx2 + dx, y: by + dy, vase: i === vaseAt, down: 0 }));
  },
  update(mg, dt) {
    mg.aim = mg.w / 2 + Math.sin(mg.timeLeft * 2.2) * (mg.w * 0.36);
    mg.entities.forEach(e2 => { if (e2.down > 0) e2.down += dt; });
    if (mg.entities.every(e2 => e2.vase ? true : e2.down > 0)) this.rack(mg);
  },
  draw(mg) {
    const c = mg.ctx; _dcSky(mg, '#5a3a6a', '#2a1a3a');
    c.fillStyle = '#8a5a3a'; c.fillRect(0, mg.h - 66, mg.w, 66);
    c.fillStyle = '#6a4a2a'; c.fillRect(0, mg.h - 66, mg.w, 8);
    mg.entities.forEach(e2 => {
      if (e2.down > 0) { if (e2.down < 0.5) _dcEmoji(mg, e2.vase ? '💥' : '🥫', e2.x + e2.down * 60, e2.y - e2.down * 80 + e2.down * e2.down * 220, 26, e2.down * 9); return; }
      _dcEmoji(mg, e2.vase ? '🏺' : '🥫', e2.x, e2.y, e2.vase ? 30 : 26);
    });
    const ay = mg.h - 170;
    c.strokeStyle = '#ffe9a0'; c.lineWidth = 2;
    c.beginPath(); c.arc(mg.aim, ay, 14, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(mg.aim - 20, ay); c.lineTo(mg.aim + 20, ay); c.moveTo(mg.aim, ay - 20); c.lineTo(mg.aim, ay + 20); c.stroke();
    c.fillStyle = '#ffe9c0'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.fillText('the aim sweeps — time your throw!', mg.w / 2, 60);
  },
  tap(mg) {
    let best = null, bd = 36;
    mg.entities.forEach(e2 => { if (e2.down > 0) return; const d = Math.abs(e2.x - mg.aim); if (d < bd) { bd = d; best = e2; } });
    if (!best) { return false; }
    best.down = 0.01;
    if (best.vase) { mgLoseLife(best.x, best.y); return false; }
    mg.caught++; return true;
  },
};

// 🧸 Claw Machine — drop the claw over a plush (the 🤖 is NOT a plush)
const dcJobClaw = {
  id: 'claw', title: '🧸 Claw Machine', hint: 'Tap to DROP the claw over a plush — skip the grumpy 🤖!', carnival: true, prizeAt: 6,
  icon: '🧸', verb: 'grabbed', noun: ['plush', 'plushies'], duration: 24, swipe: false,
  failText: 'The claw came up empty…', doneLine: c => `${c} plushies rescued from the glass box! 🧸`, failLine: 'That claw is slipperier than it looks!',
  start(mg) { mg.clawX = mg.w / 2; mg.drop = 0; mg.entities = []; this.restock(mg); },
  restock(mg) {
    mg.entities = [];
    const kinds = ['🧸', '🐰', '🐼', '🦄', '🐙', '🤖'];
    for (let i = 0; i < 6; i++) mg.entities.push({ x: 40 + (i + 0.5) * ((mg.w - 80) / 6) + Math.random() * 10 - 5, e: kinds[i], got: false });
    for (let i = mg.entities.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = mg.entities[i].x; mg.entities[i].x = mg.entities[j].x; mg.entities[j].x = tmp; }
  },
  update(mg, dt) {
    if (mg.drop === 0) mg.clawX = mg.w / 2 + Math.sin(mg.timeLeft * 1.8) * (mg.w * 0.36);
    else {
      mg.drop += dt * 2.2;
      if (mg.drop >= 1 && !mg.grabbed) {
        mg.grabbed = true;
        const hit = mg.entities.find(e2 => !e2.got && Math.abs(e2.x - mg.clawX) < 26);
        if (hit) { hit.got = true; hit.rise = true;
          if (hit.e === '🤖') { mgLoseLife(mg.clawX, mg.h - 70); }
          else { mg.caught++; if (typeof sfx === 'function') sfx('catch'); }
        }
      }
      if (mg.drop >= 2) { mg.drop = 0; mg.grabbed = false; mg.entities = mg.entities.filter(e2 => !e2.got); if (mg.entities.filter(e2 => e2.e !== '🤖').length === 0) this.restock(mg); }
    }
  },
  draw(mg) {
    const c = mg.ctx; _dcSky(mg, '#3a4a6a', '#1a2438');
    c.strokeStyle = 'rgba(160,200,255,.4)'; c.lineWidth = 3; c.strokeRect(24, 50, mg.w - 48, mg.h - 110);
    c.fillStyle = '#2a3448'; c.fillRect(24, mg.h - 76, mg.w - 48, 16);
    const depth = mg.drop === 0 ? 0 : (mg.drop <= 1 ? mg.drop : 2 - mg.drop);
    const cy2 = 66 + depth * (mg.h - 190);
    c.strokeStyle = '#b0b8c8'; c.lineWidth = 3; c.beginPath(); c.moveTo(mg.clawX, 52); c.lineTo(mg.clawX, cy2); c.stroke();
    c.strokeStyle = '#e8e8f0'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(mg.clawX - 12, cy2); c.lineTo(mg.clawX, cy2 + 14); c.lineTo(mg.clawX + 12, cy2); c.stroke();
    mg.entities.forEach(e2 => { _dcEmoji(mg, e2.e, e2.x, e2.rise ? cy2 + 26 : mg.h - 86, 30); });
    c.fillStyle = '#d8e0f0'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.fillText('tap to drop the claw!', mg.w / 2, 40);
  },
  tap(mg) { if (mg.drop === 0) { mg.drop = 0.01; mg.grabbed = false; return false; } return false; },
};

// register the carnival games with the arcade engine
if (typeof JOBS !== 'undefined') {
  JOBS.darts = dcJobDarts; JOBS.moles = dcJobMoles; JOBS.ducks = dcJobDucks;
  JOBS.striker = dcJobStriker; JOBS.cans = dcJobCans; JOBS.claw = dcJobClaw;
}

// ── the Dream City minimap — inside the park, the map IS the park ──
function drawDcMinimap(g, canvas) {
  const D = canvas.width;
  const SX = D / (DC.x1 - DC.x0 + 8), SZ = D / (DC.z1 - DC.z0 + 8);
  const X = x => (x - DC.x0 + 4) * SX, Z = z => (z - DC.z0 + 4) * SZ;
  g.fillStyle = '#e8d4ec'; g.fillRect(0, 0, D, D);
  g.fillStyle = '#c8e0b4';
  g.fillRect(X(DC.x0), Z(DC.z0), (DC.x1 - DC.x0) * SX, (DC.z1 - DC.z0) * SZ);
  g.strokeStyle = '#a878b8'; g.lineWidth = 3;
  g.strokeRect(X(DC.x0), Z(DC.z0), (DC.x1 - DC.x0) * SX, (DC.z1 - DC.z0) * SZ);
  g.fillStyle = '#f0e4d0';
  g.fillRect(X(-184), Z(-3.5), 76 * SX, 7 * SZ);
  g.fillRect(X(-137), Z(-74), 6 * SX, 128 * SZ);
  g.fillRect(X(-181), Z(-25), 70 * SX, 6 * SZ);
  g.fillRect(X(-214), Z(27), 88 * SX, 6 * SZ);
  const put = (x, z, e, s) => { g.font = (s || 13) + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, X(x), Z(z)); };
  for (const k in DC_RIDES) put(DC_RIDES[k].x, DC_RIDES[k].z, DC_RIDES[k].e, k === 'ferris' || k === 'coaster' ? 16 : 13);
  DC_STALLS.forEach(s => put(s.x, s.z, '🎯', 10));
  DC_FOOD.forEach(s => put(s.x, s.z, s.e, 10));
  put(DC_GIFT.x, DC_GIFT.z, '🎁'); put(DC_MANOR.x, DC_MANOR.z, '👻', 15); put(DC_FUN.x, DC_FUN.z, '🪞');
  put(DC_STAGE.x, DC_STAGE.z, '🎶'); put(-122, 0, '⛲'); put(DC_WELL.x, DC_WELL.z, '🪙', 9);
  put(DC.gateX - 2, 0, '🎢', 15);
  if (dcNight()) put(-180, -95, '🎆', 16);
  const p = catGroup.position;
  g.fillStyle = '#fff'; g.beginPath(); g.arc(X(p.x), Z(p.z), 6, 0, 7); g.fill();
  g.fillStyle = '#e05a4a'; g.beginPath(); g.arc(X(p.x), Z(p.z), 4, 0, 7); g.fill();
  g.fillStyle = '#4a2a5a'; g.font = 'bold 11px sans-serif'; g.textAlign = 'left';
  g.fillText('🎢 DREAM CITY', 8, 14);
}

// ═══════════════════════════════════════════════════════════════════════════
//  👻 THE HAUNTED MANOR INTERIOR — step through the door into its OWN world
// ═══════════════════════════════════════════════════════════════════════════
let manorScene = null, _manorBuilt = false;
const manorColliders = [];
const MANOR_W = 6.5, MANOR_D = 4.3;                   // half-sizes of the great hall

function buildManorInterior() {
  if (_manorBuilt) return;
  _manorBuilt = true;
  manorScene = new THREE.Scene();
  manorScene.background = new THREE.Color(0x14101e);
  const S = manorScene;
  S.add(new THREE.AmbientLight(0x8a7ab8, 0.55));
  const moon = new THREE.DirectionalLight(0x9ab0e0, 0.5); moon.position.set(4, 8, 6); S.add(moon);
  const M = DC_R.manor = { flames: [], cups: [], bats: [], eyes: [] };
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const B = (w, h, d, mat, x, y, z, ry) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); me.position.set(x, y, z); if (ry) me.rotation.y = ry; return me; };
  const CY = (r0, r1, h, mat, x, y, z, seg) => { const me = add(new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg || 10), mat)); me.position.set(x, y, z); return me; };
  const SP = (r, mat, x, y, z) => { const me = add(new THREE.Mesh(G.sph(r, 12, 10), mat)); me.position.set(x, y, z); return me; };
  const wallM = pbr(0x3a2f4a, 0.9), woodM = pbr(0x2e2138, 0.8), floorM = pbr(0x241a30, 0.85);
  const trim = pbr(0x6a5a8a, 0.6), gold = pbr(0xc8a850, 0.4, 0.4);

  // the great hall: floor, worn carpet, walls, beams
  const fl = add(new THREE.Mesh(new THREE.PlaneGeometry(MANOR_W * 2 + 1, MANOR_D * 2 + 1), floorM)); fl.rotation.x = -Math.PI / 2;
  const carpet = add(new THREE.Mesh(new THREE.PlaneGeometry(8, 2.6), pbr(0x5a2438, 0.95))); carpet.rotation.x = -Math.PI / 2; carpet.position.y = 0.01;
  B(MANOR_W * 2 + 1, 4.4, 0.3, wallM, 0, 2.2, -MANOR_D - 0.4);
  B(MANOR_W * 2 + 1, 4.4, 0.3, wallM, 0, 2.2, MANOR_D + 0.4);
  B(0.3, 4.4, MANOR_D * 2 + 1, wallM, -MANOR_W - 0.4, 2.2, 0);
  B(0.3, 4.4, MANOR_D * 2 + 1, wallM, MANOR_W + 0.4, 2.2, 0);
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(MANOR_W * 2 + 1, MANOR_D * 2 + 1), pbr(0x1c1428, 0.95))); ceil.rotation.x = Math.PI / 2; ceil.position.y = 4.4;
  [-4, 0, 4].forEach(x => B(0.3, 0.25, MANOR_D * 2 + 1, woodM, x, 4.25, 0));
  manorColliders.push(
    { type: 'box', x0: -MANOR_W - 0.8, x1: -MANOR_W - 0.2, z0: -MANOR_D - 1, z1: MANOR_D + 1 },
    { type: 'box', x0: MANOR_W + 0.2, x1: MANOR_W + 0.8, z0: -MANOR_D - 1, z1: MANOR_D + 1 },
    { type: 'box', x0: -MANOR_W - 1, x1: MANOR_W + 1, z0: -MANOR_D - 0.8, z1: -MANOR_D - 0.2 },
    { type: 'box', x0: -MANOR_W - 1, x1: MANOR_W + 1, z0: MANOR_D + 0.2, z1: MANOR_D + 0.8 });

  // the door you came in by (south wall), moonlit arched windows
  B(1.8, 3.0, 0.12, pbr(0x4a3020, 0.8), 0, 1.5, MANOR_D + 0.32);
  const paneM = new THREE.MeshStandardMaterial({ color: 0x2a3a6a, emissive: 0x4a6ab0, emissiveIntensity: 0.5, roughness: 0.4 });
  [[-4.5, -MANOR_D - 0.22], [4.5, -MANOR_D - 0.22]].forEach(([wx, wz]) => { const win = add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 0.1), paneM)); win.position.set(wx, 2.3, wz); [-0.4, 0.4].forEach(d => B(0.08, 2.2, 0.14, woodM, wx + d, 2.3, wz)); B(1.5, 0.08, 0.14, woodM, wx, 2.3, wz); });

  // 🕯️ the swinging chandelier
  const chand = M.chand = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.07, 8, 20), gold); ring.rotation.x = Math.PI / 2; chand.add(ring);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    const cnd = new THREE.Mesh(G.cyl(0.05, 0.06, 0.35, 6), pbr(0xe8e0d0, 0.8)); cnd.position.set(Math.cos(a) * 0.9, 0.22, Math.sin(a) * 0.9); chand.add(cnd);
    const fm = new THREE.Mesh(G.cone(0.06, 0.18, 6), new THREE.MeshStandardMaterial({ color: 0xffc860, emissive: 0xff9830, emissiveIntensity: 1.6 }));
    fm.position.set(Math.cos(a) * 0.9, 0.5, Math.sin(a) * 0.9); chand.add(fm); M.flames.push(fm);
  }
  const chain = new THREE.Mesh(G.cyl(0.03, 0.03, 1.2, 5), gold); chain.position.y = 0.9; chand.add(chain);
  chand.position.set(0, 3.1, 0); S.add(chand);

  // 🫖 the ghost tea party — a long table where the china floats
  B(4.2, 0.16, 1.4, woodM, 0, 0.85, -2.6); [[-1.9, -3.1], [1.9, -3.1], [-1.9, -2.1], [1.9, -2.1]].forEach(([lx, lz]) => B(0.12, 0.85, 0.12, woodM, lx, 0.42, lz));
  const china = pbr(0xe8e4f0, 0.4);
  const pot = add(new THREE.Mesh(G.sph(0.22, 12, 10), china)); pot.position.set(0, 1.35, -2.6); pot.scale.y = 0.8; M.cups.push(pot);
  const spout = add(new THREE.Mesh(G.cone(0.06, 0.25, 8), china)); spout.rotation.z = -1.2; spout.position.set(0.28, 1.4, -2.6); M.cups.push(spout);
  [[-1.2, -2.4], [0.9, -2.9], [-0.5, -2.9], [1.4, -2.3]].forEach(([cx2, cz2], i) => { const cup = add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.12, 10), china)); cup.position.set(cx2, 1.2 + i * 0.06, cz2); cup.userData.ph = i * 1.7; M.cups.push(cup); });
  manorColliders.push({ type: 'box', x0: -2.2, x1: 2.2, z0: -3.4, z1: -1.8 });

  // 🔥 the spectral fireplace (it burns GREEN)
  B(2.2, 2.2, 0.5, pbr(0x4a4054, 0.9), -5.9, 1.1, 0); B(2.6, 0.25, 0.6, trim, -5.9, 2.3, 0);
  const hearth = add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x0a0a12 }))); hearth.position.set(-5.83, 0.7, 0);
  const fire = M.fire = add(new THREE.Mesh(G.cone(0.4, 0.9, 8), new THREE.MeshStandardMaterial({ color: 0x60ff90, emissive: 0x30e068, emissiveIntensity: 1.8, transparent: true, opacity: 0.9 })));
  fire.position.set(-5.78, 0.75, 0);
  manorColliders.push({ type: 'box', x0: -6.6, x1: -5.5, z0: -1.2, z1: 1.2 });

  // 🖼️ portraits whose eyes follow… something
  [[-3.2, -MANOR_D - 0.2, 0], [3.2, -MANOR_D - 0.2, 0], [MANOR_W + 0.2, -1.6, 1], [MANOR_W + 0.2, 1.6, 1]].forEach(([px2, pz2, side], i) => {
    const fr = B(side ? 0.1 : 1.1, 1.4, side ? 1.1 : 0.1, gold, px2, 2.4, pz2);
    const cv = B(side ? 0.06 : 0.9, 1.2, side ? 0.9 : 0.06, pbr([0x3a4a5a, 0x4a3a52, 0x35424a, 0x483848][i], 0.8), px2 + (side ? -0.04 : 0), 2.4, pz2 + (side ? 0 : 0.04));
    if (i === 1) cv.rotation.z = 0.08;                                    // one hangs crooked, of course
    [-0.12, 0.12].forEach(d => { const eye = add(new THREE.Mesh(G.sph(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffe090, emissive: 0xffc040, emissiveIntensity: 1.2 }))); eye.position.set(px2 + (side ? -0.1 : d), 2.55, pz2 + (side ? d : 0.1)); M.eyes.push(eye); });
  });

  // 🧪 the bubbling cauldron
  const caul = add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), pbr(0x1e1e28, 0.6))); caul.position.set(-4.5, 0.55, 2.6); caul.rotation.x = Math.PI;
  [[-0.4, 0.3], [0.4, 0.3], [0, -0.45]].forEach(([lx, lz]) => B(0.1, 0.5, 0.1, woodM, -4.5 + lx, 0.25, 2.6 + lz));
  const brew = M.brew = add(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.1, 14), new THREE.MeshStandardMaterial({ color: 0x50d080, emissive: 0x28a050, emissiveIntensity: 1.0 })));
  brew.position.set(-4.5, 0.86, 2.6);
  M.bubbles = []; for (let i = 0; i < 4; i++) { const bu = add(new THREE.Mesh(G.sph(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0x80ffb0, emissive: 0x40c070, emissiveIntensity: 0.8 }))); bu.position.set(-4.5 + (i % 2 ? 0.2 : -0.15), 0.9, 2.6 + (i > 1 ? 0.15 : -0.1)); bu.userData.ph = i * 1.6; M.bubbles.push(bu); }
  manorColliders.push({ type: 'circle', x: -4.5, z: 2.6, r: 0.75 });

  // 🎹 the pipe organ
  B(1.8, 1.1, 0.7, woodM, 4.8, 0.55, 3.6); B(1.9, 0.1, 0.8, trim, 4.8, 1.12, 3.6);
  for (let i = 0; i < 7; i++) CY(0.09, 0.11, 1.2 + Math.abs(3 - i) * 0.35, pbr(0x8a8098, 0.4, 0.5), 4.15 + i * 0.22, 1.85 + Math.abs(3 - i) * 0.17, 3.85, 8);
  B(1.4, 0.06, 0.3, pbr(0xe8e4da, 0.5), 4.8, 1.02, 3.2);
  manorColliders.push({ type: 'box', x0: 3.8, x1: 5.8, z0: 3.1, z1: 4.1 });

  // 🪙 the creaky treasure chest
  const chest = B(1.0, 0.55, 0.65, pbr(0x5a3a22, 0.8), 5.4, 0.28, -3.4);
  B(1.0, 0.12, 0.65, gold, 5.4, 0.6, -3.4); B(0.12, 0.4, 0.05, gold, 5.4, 0.42, -3.06);
  manorColliders.push({ type: 'box', x0: 4.8, x1: 6.0, z0: -3.8, z1: -3.0 });

  // 🦇 bats round the rafters, 🕷️ a spider on her thread
  for (let i = 0; i < 4; i++) {
    const bat = new THREE.Group();
    const body = new THREE.Mesh(G.sph(0.09, 8, 6), pbr(0x241a2e, 0.8)); bat.add(body);
    [-1, 1].forEach(d => { const wing = new THREE.Mesh(G.sph(0.09, 8, 6), pbr(0x30243c, 0.8)); wing.scale.set(1.6, 0.25, 0.7); wing.position.set(d * 0.2, 0.03, 0); wing.userData.d = d; bat.add(wing); (bat.userData.wings = bat.userData.wings || []).push(wing); });
    [-1, 1].forEach(d => { const ear = new THREE.Mesh(G.cone(0.025, 0.07, 5), pbr(0x241a2e, 0.8)); ear.position.set(d * 0.05, 0.11, 0); bat.add(ear); });
    bat.position.set(-2 + i * 1.5, 3.6, -1 + (i % 2) * 2); bat.userData.ph = i * 1.9;
    S.add(bat); M.bats.push(bat);
  }
  const thread = add(new THREE.Mesh(G.cyl(0.008, 0.008, 1.6, 4), pbr(0xd8d8e0, 0.6))); thread.position.set(2.6, 3.6, 1.8);
  const spider = M.spider = new THREE.Group();
  const sb = new THREE.Mesh(G.sph(0.12, 10, 8), pbr(0x1c1424, 0.7)); spider.add(sb);
  for (let i = 0; i < 4; i++) [-1, 1].forEach(d => { const leg = new THREE.Mesh(G.cyl(0.012, 0.012, 0.3, 4), pbr(0x1c1424, 0.7)); leg.position.set(d * 0.14, 0, -0.09 + i * 0.06); leg.rotation.z = d * 1.1; spider.add(leg); });
  [-1, 1].forEach(d => { const eye = new THREE.Mesh(G.sph(0.02, 6, 5), new THREE.MeshStandardMaterial({ color: 0xff6060, emissive: 0xd04040, emissiveIntensity: 1 })); eye.position.set(d * 0.04, 0.05, 0.1); spider.add(eye); });
  spider.position.set(2.6, 2.9, 1.8); spider.userData.thread = thread; S.add(spider);

  // pumpkins & cobwebs & candles about the room
  [[-5.6, -3.4], [-2.8, 3.6], [2.2, -3.6]].forEach(([px2, pz2], i) => { const pk = SP(0.3 - i * 0.05, pbr(0xe08a30, 0.8), px2, 0.3 - i * 0.05, pz2); pk.scale.y = 0.8; const st = CY(0.03, 0.04, 0.12, pbr(0x4a6a30, 0.8), px2, 0.55 - i * 0.08, pz2, 6); });
  const webM = new THREE.MeshStandardMaterial({ color: 0xd8d8e0, roughness: 0.9, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  [[-MANOR_W - 0.1, -MANOR_D - 0.1, Math.PI / 4], [MANOR_W + 0.1, -MANOR_D - 0.1, -Math.PI / 4]].forEach(([wx, wz, ry]) => { const web = add(new THREE.Mesh(new THREE.CircleGeometry(0.9, 8), webM)); web.position.set(wx * 0.94, 3.9, wz * 0.94); web.rotation.y = ry; });
  [[-1.5, 3.8], [1.5, 3.8]].forEach(([cx2, cz2]) => { CY(0.06, 0.07, 0.5, pbr(0xe8e0d0, 0.8), cx2, 0.25, cz2, 6); const fm = add(new THREE.Mesh(G.cone(0.07, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0xffc860, emissive: 0xff9830, emissiveIntensity: 1.5 }))); fm.position.set(cx2, 0.6, cz2); M.flames.push(fm); });

  // the ghosts move IN (reparent from the world into their manor)
  DC_R.ghosts.forEach((gh, i) => {
    S.add(gh.g);
    gh.hx = -3 + i * 3; gh.hz = -0.5 + (i % 2) * 1.5;
    gh.g.position.set(gh.hx, 1.3, gh.hz);
  });
}

function enterManor() {
  buildManorInterior();
  state.inManor = true;
  manorScene.add(catGroup);
  catGroup.position.set(0, 0, MANOR_D - 0.9); catGroup.rotation.y = Math.PI;
  state.camYaw = 0; state.camHeight = 3.6; state.camDist = 4.6;
  camera.position.set(0, state.camHeight, MANOR_D - 0.9 + state.camDist);
  if (typeof sfx === 'function') sfx('door');
  showNotif('👻 The door creaks shut behind you… welcome to the manor.');
  if (typeof sfx === 'function') setTimeout(() => sfx('meow'), 900);
}
function exitManor() {
  state.inManor = false;
  scene.add(catGroup);
  catGroup.position.set(DC_MANOR.x, 0, DC_MANOR.z + 5.6); catGroup.rotation.y = 0;
  if (typeof sfx === 'function') sfx('door');
}

// per-frame interior life (called from the render loop while inside)
function updateManorFrame(t) {
  const M = DC_R.manor; if (!M) return;
  M.chand.rotation.z = Math.sin(t * 0.7) * 0.06; M.chand.rotation.x = Math.cos(t * 0.55) * 0.05;
  M.flames.forEach((fm, i) => { fm.scale.y = 1 + Math.sin(t * 9 + i * 2.3) * 0.25; fm.material.emissiveIntensity = 1.3 + Math.sin(t * 13 + i) * 0.4; });
  M.cups.forEach((cup, i) => { if (cup.userData.ph !== undefined) cup.position.y = 1.15 + Math.sin(t * 1.3 + cup.userData.ph) * 0.12; });
  M.fire.scale.set(1 + Math.sin(t * 8) * 0.15, 1 + Math.sin(t * 11) * 0.25, 1);
  M.eyes.forEach((eye, i) => { eye.material.emissiveIntensity = 0.8 + Math.abs(Math.sin(t * 0.9 + i * 1.3)) * 0.8; });
  M.bubbles.forEach(bu => { const c = (t * 0.6 + bu.userData.ph) % 1; bu.position.y = 0.88 + c * 0.3; bu.scale.setScalar(c < 0.9 ? 1 : (1 - c) * 10); });
  M.bats.forEach(bat => {
    const ph = bat.userData.ph, a = t * 0.8 + ph;
    bat.position.set(Math.cos(a) * (2.5 + Math.sin(ph) * 1.5), 3.4 + Math.sin(t * 2 + ph) * 0.4, Math.sin(a) * 2.2);
    bat.rotation.y = -a + Math.PI / 2;
    (bat.userData.wings || []).forEach(w => { w.rotation.z = w.userData.d * Math.sin(t * 14 + ph) * 0.6; });
  });
  const sp = M.spider, drop = (Math.sin(t * 0.35) + 1) / 2;
  sp.position.y = 1.6 + drop * 1.5;
  sp.userData.thread.position.y = sp.position.y + 0.85; sp.userData.thread.scale.y = (4.2 - sp.position.y) / 1.6;
  // the ghosts swirl to whoever's inside
  DC_R.ghosts.forEach((gh, gi) => {
    gh.flipT = Math.max(0, gh.flipT - 0.02);
    const tx = catGroup.position.x + Math.cos(t * 0.9 + gi * 2.1) * 1.5;
    const tz = catGroup.position.z + Math.sin(t * 0.9 + gi * 2.1) * 1.1;
    gh.g.position.x += (Math.max(-MANOR_W + 0.8, Math.min(MANOR_W - 0.8, tx)) - gh.g.position.x) * 0.03;
    gh.g.position.z += (Math.max(-MANOR_D + 0.8, Math.min(MANOR_D - 0.8, tz)) - gh.g.position.z) * 0.03;
    gh.g.position.y = 1.1 + Math.sin(t * 2.6 + gh.ph) * 0.35;
    gh.g.lookAt(catGroup.position.x, 1.2, catGroup.position.z);
    if (Math.random() < 0.0015 && typeof sfx === 'function') sfx('meow');
    if (gh.flipT > 0) { gh.g.rotation.z = Math.sin((0.9 - gh.flipT) / 0.9 * Math.PI * 2) * 1.2; const s2 = 1 + Math.sin((0.9 - gh.flipT) / 0.9 * Math.PI) * 0.3; gh.g.scale.setScalar(s2); }
    else { gh.g.rotation.z = 0; gh.g.scale.setScalar(1); }
  });
}

// context menu inside the manor: ghosts, cauldron, organ, chest
function dcManorContext(cp) {
  const got = (state._dcSpook && state._dcSpook.day === (state.dayCount || 0)) ? state._dcSpook.got : {};
  let gi = -1, bd = 1.8, giAny = -1, bdAny = 1.8;
  DC_R.ghosts.forEach((gh, i) => {
    if (gh.flipT > 0) return;
    const d = Math.hypot(cp.x - gh.g.position.x, cp.z - gh.g.position.z);
    if (d < bdAny) { bdAny = d; giAny = i; }
    if (!got[i] && d < bd) { bd = d; gi = i; }
  });
  if (gi < 0) gi = giAny;
  if (gi >= 0) return { id: 'dc:ghost', gi, label: '🖐️ High-five the ghost!' };
  if (Math.hypot(cp.x - (-4.5), cp.z - 2.6) < 1.7) return { id: 'dc:cauldron', label: '🥄 Stir the cauldron' };
  if (Math.hypot(cp.x - 4.8, cp.z - 3.0) < 1.8) return { id: 'dc:organ', label: '🎹 Play the spooky organ' };
  if (Math.hypot(cp.x - 5.4, cp.z - (-3.2)) < 1.8) return { id: 'dc:chest', label: '🪙 Open the creaky chest' };
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  🪞 THE FUN HOUSE INTERIOR — mirrors, ball pit, trampoline & confetti
// ═══════════════════════════════════════════════════════════════════════════
let funScene = null, _funBuilt = false;
const funColliders = [];
const FUN_W = 5.8, FUN_D = 3.8;
const FUN_CONF = [];                                   // live confetti bursts

function buildFunInterior() {
  if (_funBuilt) return;
  _funBuilt = true;
  funScene = new THREE.Scene();
  funScene.background = new THREE.Color(0xf0e0f8);
  const S = funScene;
  S.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun2 = new THREE.DirectionalLight(0xfff0d8, 0.7); sun2.position.set(3, 8, 5); S.add(sun2);
  const F = DC_R.fun = { mirrors: [], balls: [], wobbles: [], pins: [] };
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const B = (w, h, d, mat, x, y, z, ry) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); me.position.set(x, y, z); if (ry) me.rotation.y = ry; return me; };
  const CY = (r0, r1, h, mat, x, y, z, seg) => { const me = add(new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg || 12), mat)); me.position.set(x, y, z); return me; };
  const RAINBOW = [0xe05a4a, 0xe8a030, 0xe8d040, 0x6ac06a, 0x5a9ad0, 0x9a6ad0];

  // checkerboard floor with a few wobbly tiles
  for (let ix = 0; ix < 8; ix++) for (let iz = 0; iz < 6; iz++) {
    const tile = add(new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 1.35), pbr((ix + iz) % 2 ? 0xf0e8f6 : 0xd8b8e8, 0.9)));
    tile.position.set(-FUN_W + 0.85 + ix * 1.58, 0.02, -FUN_D + 0.75 + iz * 1.38);
    if ((ix * 7 + iz * 3) % 11 === 0) { tile.userData.ph = ix + iz; F.wobbles.push(tile); }
  }
  // candy-striped walls + ceiling
  for (let i = 0; i < 8; i++) { B(1.55, 3.6, 0.25, pbr(RAINBOW[i % 6], 0.85), -FUN_W + 0.85 + i * 1.58, 1.8, -FUN_D - 0.35); if (i < 6) B(1.55, 3.6, 0.25, pbr(RAINBOW[(i + 3) % 6], 0.85), -FUN_W + 0.85 + i * 1.58, 1.8, FUN_D + 0.35); }
  B(1.6, 3.6, 0.25, pbr(RAINBOW[3], 0.85), -FUN_W + 0.85 + 6 * 1.58, 1.8, FUN_D + 0.35);
  for (let i = 0; i < 6; i++) [-1, 1].forEach(sd => B(0.25, 3.6, 1.35, pbr(RAINBOW[(i + (sd > 0 ? 2 : 4)) % 6], 0.85), sd * (FUN_W + 0.35), 1.8, -FUN_D + 0.75 + i * 1.38));
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(FUN_W * 2 + 1, FUN_D * 2 + 1), pbr(0xe8d8f4, 0.95))); ceil.rotation.x = Math.PI / 2; ceil.position.y = 3.6;
  funColliders.push(
    { type: 'box', x0: -FUN_W - 0.7, x1: -FUN_W - 0.1, z0: -FUN_D - 1, z1: FUN_D + 1 },
    { type: 'box', x0: FUN_W + 0.1, x1: FUN_W + 0.7, z0: -FUN_D - 1, z1: FUN_D + 1 },
    { type: 'box', x0: -FUN_W - 1, x1: FUN_W + 1, z0: -FUN_D - 0.7, z1: -FUN_D - 0.1 },
    { type: 'box', x0: -FUN_W - 1, x1: FUN_W + 1, z0: FUN_D + 0.1, z1: FUN_D + 0.7 });
  // the door you came in by + a rainbow arch over the room
  B(1.8, 2.8, 0.12, pbr(0x8a4ab0, 0.7), 0, 1.4, FUN_D + 0.22);
  RAINBOW.forEach((col, i) => { const arc = add(new THREE.Mesh(new THREE.TorusGeometry(2.6 - i * 0.16, 0.09, 8, 24, Math.PI), pbr(col, 0.7))); arc.position.set(0, 1.4, 0); });
  // the spinning disco ball
  const disco = F.disco = add(new THREE.Mesh(G.sph(0.45, 16, 14), new THREE.MeshStandardMaterial({ color: 0xd8e0f0, metalness: 0.95, roughness: 0.15 })));
  disco.position.set(0, 3.1, 0);
  CY(0.02, 0.02, 0.5, pbr(0x8a8a98, 0.5), 0, 3.55, 0, 5);
  // spinning wall pinwheels
  [[-FUN_W - 0.2, -1.5, 1], [FUN_W + 0.2, 1.5, 1], [-2.5, FUN_D + 0.2, 0]].forEach(([px2, pz2, side], i) => {
    const pin = new THREE.Group();
    for (let k = 0; k < 6; k++) { const blade = new THREE.Mesh(G.cone(0.14, 0.5, 6), pbr(RAINBOW[k], 0.7)); blade.position.set(Math.cos(k * 1.047) * 0.3, Math.sin(k * 1.047) * 0.3, 0); blade.rotation.z = k * 1.047 + Math.PI / 2; pin.add(blade); }
    pin.position.set(px2, 2.2, pz2); if (side) pin.rotation.y = Math.PI / 2;
    S.add(pin); F.pins.push(pin);
  });

  // 🪞 THREE TRICK MIRRORS — they show a very silly you
  const mirM = new THREE.MeshStandardMaterial({ color: 0xdfe8f2, metalness: 0.9, roughness: 0.12 });
  const gold = pbr(0xc8a850, 0.4, 0.4);
  [[-3.6, 'tall'], [0, 'wide'], [3.6, 'wavy']].forEach(([mx, kind], i) => {
    B(1.9, 3.0, 0.14, gold, mx, 1.6, -FUN_D - 0.05);
    const panel = add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.7, 0.06), mirM)); panel.position.set(mx, 1.6, -FUN_D + 0.02);
    const label = ['📏 LONG CAT', '🥞 PANCAKE CAT', '🌊 WOBBLE CAT'][i];
    if (typeof makeTextSign === 'function') { const sg = add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.34, 0.08), new THREE.MeshStandardMaterial({ map: makeTextSign(label, '#6a2a5a', '#ffe9a0', 200, 42), roughness: 0.6 }))); sg.position.set(mx, 3.3, -FUN_D - 0.02); }
    const mc = buildCatModel(state.chosenCat || { body: 0x8a8a92, accent: 0xd8d8de, eye: 0x4a8a5a, markings: 'solid' });
    mc.group.position.set(mx, 0, -FUN_D + 0.55);
    if (kind === 'tall') mc.group.scale.set(0.5, 1.9, 0.5);
    if (kind === 'wide') mc.group.scale.set(1.65, 0.42, 1.65);
    S.add(mc.group);
    F.mirrors.push({ x: mx, kind, cat: mc.group });
  });
  funColliders.push({ type: 'box', x0: -FUN_W, x1: FUN_W, z0: -FUN_D - 0.4, z1: -FUN_D + 0.75 });

  // 🌈 the ball pit
  const pit = { x: -4.2, z: 2.2, r: 1.6 };
  CY(pit.r + 0.25, pit.r + 0.35, 0.5, pbr(0x8a4ab0, 0.8), pit.x, 0.25, pit.z, 18);
  const pitIn = add(new THREE.Mesh(new THREE.CylinderGeometry(pit.r, pit.r, 0.4, 18), pbr(0x5a2a7a, 0.9))); pitIn.position.set(pit.x, 0.28, pit.z);
  for (let i = 0; i < 24; i++) {
    const a = Math.random() * Math.PI * 2, rr = Math.random() * (pit.r - 0.25);
    const ball = add(new THREE.Mesh(G.sph(0.16, 10, 8), pbr(RAINBOW[i % 6], 0.55)));
    ball.position.set(pit.x + Math.cos(a) * rr, 0.55 + (i % 3) * 0.1, pit.z + Math.sin(a) * rr);
    ball.userData = { hy: ball.position.y, vy: 0 };
    F.balls.push(ball);
  }
  F.pit = pit;
  funColliders.push({ type: 'circle', x: pit.x, z: pit.z, r: pit.r + 0.4 });

  // 🤸 the trampoline
  const tramp = { x: 4.2, z: 2.2 };
  CY(1.3, 1.4, 0.28, pbr(0xd0483a, 0.7), tramp.x, 0.35, tramp.z, 16);
  const mat2 = F.trampMat = add(new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.08, 16), pbr(0x2a2a38, 0.6))); mat2.position.set(tramp.x, 0.44, tramp.z);
  [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]].forEach(([lx, lz]) => CY(0.07, 0.09, 0.36, pbr(0x8a8a98, 0.6), tramp.x + lx * 0.9, 0.18, tramp.z + lz * 0.9, 8));
  F.tramp = tramp;
  funColliders.push({ type: 'circle', x: tramp.x, z: tramp.z, r: 1.15 });

  // 🎉 the confetti cannon
  const can = { x: 0, z: -1.2 };
  CY(0.16, 0.22, 0.8, pbr(0x3a3a48, 0.6), can.x, 0.4, can.z, 10);
  const barrel = add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.11, 0.9, 10), pbr(0xe8c040, 0.5)));
  barrel.position.set(can.x, 1.05, can.z - 0.18); barrel.rotation.x = -0.5;
  for (let i = 0; i < 3; i++) { const stripe = add(new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.025, 6, 14), pbr(0xd0483a, 0.6))); stripe.position.set(can.x, 0.85 + i * 0.25, can.z - 0.07 - i * 0.13); stripe.rotation.x = -0.5 + Math.PI / 2; }
  F.cannon = can;
  funColliders.push({ type: 'circle', x: can.x, z: can.z, r: 0.45 });
}

function enterFunhouse() {
  buildFunInterior();
  state.inFun = true;
  funScene.add(catGroup);
  catGroup.position.set(0, 0, FUN_D - 0.8); catGroup.rotation.y = Math.PI;
  state.camYaw = 0; state.camHeight = 3.4; state.camDist = 4.4;
  camera.position.set(0, state.camHeight, FUN_D - 0.8 + state.camDist);
  if (typeof sfx === 'function') sfx('door');
  showNotif('🪞 Mirrors ahead! Go say hello to Long Cat, Pancake Cat and Wobble Cat.');
}
function exitFunhouse() {
  state.inFun = false;
  scene.add(catGroup);
  catGroup.position.set(DC_FUN.x, 0, DC_FUN.z + 4.2); catGroup.rotation.y = 0;
  if (typeof sfx === 'function') sfx('door');
}

let _funBounceT = 0;
function updateFunFrame(t) {
  const F = DC_R.fun; if (!F) return;
  F.disco.rotation.y = t * 1.2;
  F.pins.forEach((pin, i) => { pin.rotation.z = t * (1.2 + i * 0.4) * (i % 2 ? -1 : 1); });
  F.wobbles.forEach(tile => { tile.rotation.z = Math.sin(t * 2.2 + tile.userData.ph) * 0.05; tile.position.y = 0.02 + Math.abs(Math.sin(t * 2.2 + tile.userData.ph)) * 0.05; });
  // the mirrors mimic you — with opinions
  F.mirrors.forEach(mi => {
    const mc = mi.cat;
    const wantX = Math.max(mi.x - 1.0, Math.min(mi.x + 1.0, catGroup.position.x));
    mc.position.x += (wantX - mc.position.x) * 0.2;
    mc.position.y = catGroup.position.y * (mi.kind === 'tall' ? 1.7 : mi.kind === 'wide' ? 0.4 : 1);
    mc.rotation.y = Math.atan2(catGroup.position.x - mc.position.x, catGroup.position.z - mc.position.z);
    if (mi.kind === 'wavy') mc.scale.set(1 + Math.sin(t * 3.2) * 0.35, 1 + Math.sin(t * 3.2 + 2.1) * 0.45, 1 + Math.sin(t * 3.2 + 4.2) * 0.35);
  });
  // ball pit physics (after a dive)
  F.balls.forEach(ball => {
    const u = ball.userData;
    if (u.vy !== 0 || ball.position.y > u.hy + 0.01) {
      u.vy -= 0.012;
      ball.position.y += u.vy * 0.016 * 3;
      ball.position.x += (u.vx || 0) * 0.016;
      ball.position.z += (u.vz || 0) * 0.016;
      const d = Math.hypot(ball.position.x - F.pit.x, ball.position.z - F.pit.z);
      if (d > F.pit.r - 0.2) { const s2 = (F.pit.r - 0.2) / d; ball.position.x = F.pit.x + (ball.position.x - F.pit.x) * s2; ball.position.z = F.pit.z + (ball.position.z - F.pit.z) * s2; }
      if (ball.position.y <= u.hy) { ball.position.y = u.hy; u.vy = 0; u.vx = 0; u.vz = 0; }
    }
  });
  // trampoline bounces YOU
  if (_funBounceT > 0) {
    _funBounceT = Math.max(0, _funBounceT - 0.016);
    const b = Math.abs(Math.sin((2.4 - _funBounceT) * 5.2)) * 1.5 * Math.min(1, _funBounceT);
    catGroup.position.y = b;
    F.trampMat.position.y = 0.44 - Math.max(0, 0.3 - b) * 0.3;
    if (_funBounceT === 0) { catGroup.position.y = 0; F.trampMat.position.y = 0.44; }
  }
  // confetti falls
  for (let i = FUN_CONF.length - 1; i >= 0; i--) {
    const cf = FUN_CONF[i];
    cf.age += 0.016;
    const pos = cf.pts.geometry.attributes.position;
    for (let k = 0; k < cf.n; k++) {
      pos.array[k * 3] += cf.vel[k * 3] * 0.016;
      pos.array[k * 3 + 1] += cf.vel[k * 3 + 1] * 0.016;
      pos.array[k * 3 + 2] += cf.vel[k * 3 + 2] * 0.016;
      cf.vel[k * 3 + 1] -= 0.055;
      if (pos.array[k * 3 + 1] < 0.05) { pos.array[k * 3 + 1] = 0.05; cf.vel[k * 3 + 1] = 0; }
    }
    pos.needsUpdate = true;
    cf.mat.opacity = Math.max(0, 1 - cf.age / 2.6);
    if (cf.age > 2.6) { funScene.remove(cf.pts); cf.pts.geometry.dispose(); cf.mat.dispose(); FUN_CONF.splice(i, 1); }
  }
}

function dcFunContext(cp) {
  const F = DC_R.fun; if (!F) return null;
  if (Math.hypot(cp.x - F.pit.x, cp.z - F.pit.z) < F.pit.r + 1.1) return { id: 'dc:ballpit', label: '🌈 Dive into the ball pit!' };
  if (Math.hypot(cp.x - F.tramp.x, cp.z - F.tramp.z) < 2.2) return { id: 'dc:tramp', label: '🤸 Bounce on the trampoline!' };
  if (Math.hypot(cp.x - F.cannon.x, cp.z - F.cannon.z) < 1.6) return { id: 'dc:confetti', label: '🎉 Fire the confetti cannon!' };
  return null;
}
