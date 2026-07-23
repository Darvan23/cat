// Paws & Pennies — actors: humans, neighbours, family, Mr. Crick + the rent deadline
// Classic script: shares globals with the others; load order matters (see index.html).

// ─── Humans (family & neighbours) ───────────────────────────────────────────────
function pbr(color, rough = 0.85, metal = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}

function addHair(head, cfg, hairMat) {
  const sph = r => new THREE.SphereGeometry(r, 16, 12);
  const style = cfg.hairStyle || 'short';
  if (style === 'bald') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 20), hairMat);
    ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.04, -0.02); head.add(ring);
    return;
  }
  const cap = new THREE.Mesh(sph(0.215), hairMat);
  cap.scale.set(1.05, style === 'child' ? 0.92 : 0.82, 1.06);
  cap.position.set(0, style === 'child' ? 0.07 : 0.09, -0.02);
  head.add(cap);
  if (style === 'long') {
    const back = new THREE.Mesh(sph(0.2), hairMat);
    back.position.set(0, -0.06, -0.1); back.scale.set(1.06, 1.25, 0.8); head.add(back);
    [-1, 1].forEach(s => {
      const side = new THREE.Mesh(sph(0.1), hairMat);
      side.position.set(s * 0.17, -0.06, 0.0); side.scale.set(0.6, 1.4, 0.95); head.add(side);
    });
  } else if (style === 'bun') {
    const bun = new THREE.Mesh(sph(0.09), hairMat);
    bun.position.set(0, 0.13, -0.17); head.add(bun);
  }
}

function buildHuman(cfg) {
  const g = new THREE.Group();
  const parts = { arms: [] };
  const skin  = pbr(cfg.skin, 0.7);
  const shirt = pbr(cfg.shirt, 0.82);
  const pants = pbr(cfg.pants, 0.85);
  const shoeMat = pbr(cfg.shoe || 0x2a2018, 0.6);
  const hairMat = pbr(cfg.hair, 0.92);
  const dark = pbr(0x141414, 0.5);
  const sph = r => new THREE.SphereGeometry(r, 16, 12);
  const cyl = (rt, rb, h, s = 14) => new THREE.CylinderGeometry(rt, rb, h, s);
  const add = m => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const S = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); return add(mesh);
  };
  const round = cfg.build === 'round';
  const waistR = round ? 0.25 : 0.18;
  const bellyZ = round ? 0.06 : 0;

  // legs (jointed at the hip, so they can walk)
  parts.legs = [];
  [-0.11, 0.11].forEach(lx => {
    const leg = new THREE.Group(); leg.position.set(lx, 0.84, 0);
    const thigh = new THREE.Mesh(cyl(0.1, 0.085, 0.44), pants); thigh.position.y = -0.22; thigh.castShadow = true; leg.add(thigh);
    const shin = new THREE.Mesh(cyl(0.085, 0.07, 0.4), pants); shin.position.y = -0.62; shin.castShadow = true; leg.add(shin);
    const shoe = new THREE.Mesh(sph(0.11), shoeMat); shoe.scale.set(1, 0.6, 1.6); shoe.position.set(0, -0.82, 0.06); shoe.castShadow = true; leg.add(shoe);
    g.add(leg); parts.legs.push(leg);
  });
  // pelvis + torso
  S(sph(0.2), pants, 0, 0.86, 0, 1.1, 0.7, 0.9);
  const torso = S(cyl(0.24, waistR, 0.62), shirt, 0, 1.18, bellyZ, 1, 1, round ? 1.25 : 1);
  parts.torso = torso;
  if (round) S(sph(0.24), shirt, 0, 1.04, 0.13, 1.12, 0.85, 1.0);
  S(sph(0.25), shirt, 0, 1.46, 0, 1.06, 0.6, 0.85);   // shoulders
  S(cyl(0.1, 0.12, 0.08), shirt, 0, 1.52, 0.02);       // collar

  // arms (groups, for idle sway)
  [-1, 1].forEach(s => {
    const arm = new THREE.Group(); arm.position.set(s * 0.28, 1.46, 0); arm.rotation.z = s * 0.07;
    const upper = new THREE.Mesh(cyl(0.075, 0.065, 0.34), shirt); upper.position.y = -0.17; upper.castShadow = true; arm.add(upper);
    const fore = new THREE.Mesh(cyl(0.06, 0.052, 0.32), skin); fore.position.y = -0.5; fore.castShadow = true; arm.add(fore);
    const hand = new THREE.Mesh(sph(0.07), skin); hand.position.set(0, -0.68, 0.02); hand.scale.set(1, 0.85, 0.6); hand.castShadow = true; arm.add(hand);
    g.add(arm); parts.arms.push(arm);
  });

  // neck + head
  S(cyl(0.07, 0.08, 0.13), skin, 0, 1.58, 0);
  const head = new THREE.Group(); head.position.set(0, 1.79, 0); g.add(head);
  parts.head = head;
  const skull = new THREE.Mesh(sph(0.2), skin); skull.scale.set(0.96, 1.06, 0.98); skull.castShadow = true; head.add(skull);
  [-1, 1].forEach(s => { const ear = new THREE.Mesh(sph(0.045), skin); ear.position.set(s * 0.19, 0, 0); ear.scale.set(0.6, 1, 0.7); head.add(ear); });
  const nose = new THREE.Mesh(sph(0.035), skin); nose.position.set(0, -0.02, 0.205); nose.scale.set(0.9, 1.2, 1.3); head.add(nose);
  [-0.075, 0.075].forEach(ex => {
    const w = new THREE.Mesh(sph(0.038), pbr(0xf6f4ee, 0.4)); w.position.set(ex, 0.04, 0.175); w.scale.set(1, 0.7, 0.6); head.add(w);
    const iris = new THREE.Mesh(sph(0.018), pbr(cfg.eye || 0x5a3a22, 0.3)); iris.position.set(ex, 0.04, 0.2); head.add(iris);
    const pup = new THREE.Mesh(sph(0.009), dark); pup.position.set(ex, 0.04, 0.213); head.add(pup);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.014, 0.03), hairMat); brow.position.set(ex, 0.105, 0.19); head.add(brow);
  });
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.02), pbr(0x9a4a44, 0.6)); mouth.position.set(0, -0.1, 0.2); head.add(mouth);
  addHair(head, cfg, hairMat);

  if (cfg.beard) {
    const beard = new THREE.Mesh(sph(0.185), pbr(cfg.beardColor || cfg.hair, 0.95));
    beard.position.set(0, -0.09, 0.05); beard.scale.set(0.98, 0.85, 0.95); head.add(beard);
  }
  if (cfg.glasses) {
    const fr = pbr(0x1c1c1c, 0.4, 0.3);
    [-0.075, 0.075].forEach(ex => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 16), fr); r.position.set(ex, 0.04, 0.2); head.add(r); });
    const br = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.008), fr); br.position.set(0, 0.04, 0.21); head.add(br);
  }
  if (cfg.hat === 'straw') {
    const straw = pbr(0xd9b35a, 0.95);
    const brim = new THREE.Mesh(cyl(0.34, 0.34, 0.03, 20), straw); brim.position.set(0, 0.15, 0); brim.castShadow = true; head.add(brim);
    const top = new THREE.Mesh(cyl(0.2, 0.22, 0.16, 20), straw); top.position.set(0, 0.24, 0); top.castShadow = true; head.add(top);
  } else if (cfg.hat === 'cap') {
    const cap = pbr(cfg.hatColor || 0x33415a, 0.8);
    const dome = new THREE.Mesh(sph(0.21), cap); dome.position.set(0, 0.07, 0); dome.scale.set(1, 0.7, 1); head.add(dome);
    const peak = new THREE.Mesh(cyl(0.17, 0.17, 0.03, 16), cap); peak.position.set(0, 0.03, 0.18); peak.scale.set(1, 1, 0.6); head.add(peak);
  }
  if (cfg.apron) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.6, 0.05), pbr(cfg.apronColor || 0xcdc3b0, 0.9));
    a.position.set(0, 1.02, bellyZ + (round ? 0.21 : 0.15)); a.castShadow = true; g.add(a);
  }

  const h = cfg.height || 1.0;
  g.scale.set(h, h, h);
  return { group: g, parts };
}

function idleHuman(o, time) {
  if (!o.parts) return;
  // o.phase can be a STRING for some actors (the Millers' routine phase) — a string here made
  // sin() return NaN, which wiped their head/arm rotations (the "lost head & arms" glitch).
  let ph = o.phase;
  if (typeof ph !== 'number' || !isFinite(ph)) ph = (o._idlePh != null ? o._idlePh : (o._idlePh = Math.random() * 6));
  if (o.parts.torso) o.parts.torso.scale.y = 1 + Math.sin(time * 1.8 + ph) * 0.02;                 // breathing
  if (o.parts.head) {
    o.parts.head.rotation.y = Math.sin(time * 0.5 + ph) * 0.22;
    o.parts.head.rotation.x = Math.sin(time * 0.75 + ph) * 0.05;
  }
  if (o.parts.arms) o.parts.arms.forEach((a, i) => { a.rotation.x = Math.sin(time * 1.1 + ph + i * 1.7) * 0.05; });
  if (o.group) o.group.rotation.z = Math.sin(time * 0.7 + ph) * 0.012;                              // gentle weight shift
}

// Can a walker go in a straight line from (x0,z0) to (x1,z1) without shoving a wall?
// Samples the line against the world colliders. Buildings can sit anywhere (the player
// moves them with the planner), so a random target must be CHECKED, never assumed clear —
// an unreachable target left folk marching into a wall forever.
function walkLineClear(x0, z0, x1, z1) {
  const d = Math.hypot(x1 - x0, z1 - z0);
  const steps = Math.min(120, Math.max(1, Math.ceil(d / 1.5)));
  for (let i = 1; i <= steps; i++) {
    const x = x0 + (x1 - x0) * i / steps, z = z0 + (z1 - z0) * i / steps;
    const c = collide(x, z, worldColliders, 0.28);
    if (Math.hypot(c.x - x, c.z - z) > 0.03) return false;
  }
  return true;
}

// Gentle wander: stroll to a random spot near home, pause, repeat
function initWander(o, radius, speed) {
  o.home = { x: o.group.position.x, z: o.group.position.z };
  o.wx = o.group.position.x; o.wz = o.group.position.z;
  o.x = o.wx; o.z = o.wz;
  o.radius = radius; o.wspeed = speed;
  o.wstate = 'idle'; o.wtimer = 30 + Math.random() * 150;
  o.walkT = 0;
  o.target = { x: o.wx, z: o.wz };
}
function updateWander(o) {
  if (o.wstate === 'idle') {
    o.wtimer--;
    // unpredictable little moments: a yawn, a big stretch, a look around, a wave at a passer-by
    if (!o.microT && Math.random() < 0.0022) { o.microT = 70 + Math.random() * 70; o.micro = ['yawn', 'stretch', 'look', 'wave'][Math.floor(Math.random() * 4)]; }
    if (o.microT > 0) {
      o.microT--;
      const q = Math.sin((o.microT / 140) * Math.PI);
      if (o.micro === 'yawn') { if (o.parts.arms) o.parts.arms[0].rotation.x = -2.2 * q; if (o.parts.head) o.parts.head.rotation.x = -0.22 * q; }
      else if (o.micro === 'stretch') { if (o.parts.arms) o.parts.arms.forEach(a => a.rotation.x = -2.8 * q); if (o.parts.torso) o.parts.torso.scale.y = 1 + 0.05 * q; }
      else if (o.micro === 'look') { if (o.parts.head) o.parts.head.rotation.y = Math.sin(o.microT * 0.09) * 0.85; }
      else { if (o.parts.arms) { o.parts.arms[1].rotation.x = -2.3 * q; o.parts.arms[1].rotation.z = Math.sin(o.microT * 0.5) * 0.3 * q; } }   // a friendly wave
      if (o.microT <= 0 && o.parts.arms) o.parts.arms[1].rotation.z = 0;
      return;
    }
    if (o.parts.legs) o.parts.legs.forEach(l => { l.rotation.x *= 0.8; });
    if (o.parts.arms) o.parts.arms.forEach(a => { a.rotation.x *= 0.8; });
    o.group.position.y *= 0.8; o.group.rotation.z *= 0.8;
    if (o.wtimer <= 0) {
      // pick a spot they can actually WALK TO — a target inside or behind a building
      // (easy once the player moves structures around) had them shoving the wall forever
      for (let k = 0; k < 8; k++) {
        const ang = Math.random() * Math.PI * 2, r = o.radius * (0.35 + Math.random() * 0.65);
        const tx = o.home.x + Math.cos(ang) * r, tz = o.home.z + Math.sin(ang) * r;
        if (!walkLineClear(o.wx, o.wz, tx, tz)) continue;
        o.target.x = tx; o.target.z = tz;
        if (o.baseSpeed == null) o.baseSpeed = o.wspeed;
        o.wspeed = o.baseSpeed * (0.65 + Math.random() * 0.8);   // sometimes ambling, sometimes hurrying
        o.wstate = 'walk';
        break;
      }
      if (o.wstate !== 'walk') o.wtimer = 60 + Math.random() * 120;   // boxed in right now — idle & retry later
    }
    return;
  }
  // walking toward the target
  const dx = o.target.x - o.wx, dz = o.target.z - o.wz, dist = Math.hypot(dx, dz);
  if (dist < 0.08 || (o.blockT || 0) > 45) {               // arrived — or stuck on an obstacle, so stop shoving it
    o.blockT = 0;
    if (o.exiting) { o.group.visible = false; o.exiting = false; }   // 🌙 slipped indoors for the night
    o.wstate = 'idle'; o.wtimer = 70 + Math.random() * 160; return;
  }
  const step = Math.min(o.wspeed, dist);
  const px = o.wx + dx / dist * step, pz = o.wz + dz / dist * step;
  const wc = collide(px, pz, worldColliders, 0.28);        // no more phasing through walls & trees
  o.blockT = (Math.hypot(wc.x - px, wc.z - pz) > 0.02) ? (o.blockT || 0) + 1 : 0;
  o.wx = wc.x; o.wz = wc.z;
  o.group.position.x = o.wx; o.group.position.z = o.wz;
  o.x = o.wx; o.z = o.wz;                                  // keep proximity/minimap in sync
  const heading = Math.atan2(dx, dz);
  o.group.rotation.y += (((heading - o.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.2;
  o.walkT += 0.3;
  const sw = Math.sin(o.walkT);
  if (o.parts.legs) { o.parts.legs[0].rotation.x = sw * 0.5; o.parts.legs[1].rotation.x = -sw * 0.5; }
  if (o.parts.arms) { o.parts.arms[0].rotation.x = -sw * 0.4; o.parts.arms[1].rotation.x = sw * 0.4; }
  o.group.position.y = Math.abs(Math.sin(o.walkT)) * 0.02;
  o.group.rotation.z = sw * 0.03;                            // subtle hip sway while walking
}

// Distinct looks for each character
const NEIGHBOURS = {
  'Mrs. Chen':  { skin: 0xe8b890, hair: 0xbdbdbd, hairStyle: 'bun',   glasses: true, apron: true, apronColor: 0xcdc3b0, shirt: 0x9a6fb0, pants: 0x4a4a52, height: 0.92, build: 'round', eye: 0x4a3a2a },
  'Old Tom':    { skin: 0xd9a884, hair: 0x8f8f8f, hairStyle: 'short', beard: true, beardColor: 0x9a9a9a, hat: 'cap', hatColor: 0x3a4a5a, shirt: 0x4a6a7a, pants: 0x39394a, height: 1.0,  build: 'avg',   eye: 0x3a5a6a },
  'Farmer Bob': { skin: 0xe0a878, hair: 0x6b4a2a, hairStyle: 'short', hat: 'straw', shirt: 0xb05548, pants: 0x6a5236, height: 1.06, build: 'round', eye: 0x4a3a22 },
  'Rosa':       { skin: 0xe6b894, hair: 0x3a2a1a, hairStyle: 'bun',   apron: true, apronColor: 0xf0e0d0, shirt: 0xc24a4a, pants: 0x4a3a2a, height: 0.98, build: 'round', eye: 0x4a3a2a },
  'Dr. Amara':  { skin: 0x8a5a3a, hair: 0x141414, hairStyle: 'short', glasses: true, apron: true, apronColor: 0xf2f2f2, shirt: 0x5a8a9a, pants: 0x3a3a44, height: 1.0,  build: 'avg',   eye: 0x2a1a12 },
  'Mr. Bloom':  { skin: 0xd8a878, hair: 0x8a7a5a, hairStyle: 'short', hat: 'straw', shirt: 0x5a8a4a, pants: 0x5a4a2e, height: 1.04, build: 'avg',   eye: 0x3a3a22 },
  'Mayor Pickle':     { skin: 0xe2b48c, hair: 0x9a9a9a, hairStyle: 'short', glasses: true, hat: 'cap', hatColor: 0x202830, apron: true, apronColor: 0x9a2a3a, shirt: 0x2a2a3a, pants: 0x222230, height: 1.08, build: 'round', eye: 0x3a2a1a },
  'Bert the Butcher': { skin: 0xd8a070, hair: 0x6a4a2a, hairStyle: 'short', beard: true, beardColor: 0x6a4a2a, apron: true, apronColor: 0xe8e0d8, shirt: 0xb05548, pants: 0x4a4030, height: 1.07, build: 'round', eye: 0x3a2a1a },
  // little map-wide minigame folk
  'Poppy':      { skin: 0xf0c8a0, hair: 0xd06a8a, hairStyle: 'long', shirt: 0x6ac0a0, pants: 0x4a6a8a, height: 0.98, build: 'avg', eye: 0x3a5a3a },
  'Sunny':      { skin: 0x8a5a3a, hair: 0x201810, hairStyle: 'short', hat: 'cap', hatColor: 0xe0a030, shirt: 0xe0a030, pants: 0x3a3a44, height: 1.02, build: 'avg', eye: 0x2a1a12 },
  'Pip':        { skin: 0xe2b48c, hair: 0x5a3a1c, hairStyle: 'short', shirt: 0xc85a6a, pants: 0x3a3a52, height: 0.9, build: 'slim', eye: 0x3a2a1a },
  'Willow':     { skin: 0xd8a878, hair: 0x8a6a3a, hairStyle: 'long', shirt: 0x8a7ac0, pants: 0x5a4a2e, height: 1.0, build: 'avg', eye: 0x3a3a22 },
};
const DEFAULT_PERSON = { skin: 0xe2b48c, hair: 0x3a2a1c, hairStyle: 'short', shirt: 0x5878c8, pants: 0x3a3a52, height: 1.0, build: 'avg' };
// Each neighbour hires the cat for a different kind of job
const NPC_JOB = {
  'Farmer Bob': 'mice', 'Mrs. Chen': 'grocery', 'Old Tom': 'rats',
  'Rosa': 'bakery', 'Dr. Amara': 'vet', 'Mr. Bloom': 'garden',
  'Mayor Pickle': 'mayor', 'Bert the Butcher': 'butcher',   // park folk — handled in doAction, not minigames
};

// ─── Neighbours (job-givers) ────────────────────────────────────────────────────
function spawnNPC(x, z, name, idx, jobOverride) {
  const cfg = NEIGHBOURS[name] || DEFAULT_PERSON;
  const { group, parts } = buildHuman(cfg);
  group.position.set(x, 0, z);
  scene.add(group);
  const bubble = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xf0d080, emissive: 0x806000, emissiveIntensity: 0.8, roughness: 0.4, metalness: 0 })
  );
  bubble.position.y = 2.5; group.add(bubble);
  const npc = { group, parts, x, z, name, bubble, bobT: Math.random() * Math.PI * 2, phase: Math.random() * 6, hasJob: true, job: jobOverride || NPC_JOB[name] || 'mice' };
  state.npcs.push(npc);
  initWander(npc, 1.3, 0.024);
  return npc;
}

// ─── Ambient pedestrians (just strolling — no jobs) ─────────────────────────────
function buildPedestrians() {
  state.peds = [];
  const people = [
    { cfg: { skin: 0xe8c0a0, hair: 0x2a1a10, hairStyle: 'long',  shirt: 0x6a8ac0, pants: 0x3a3a4a, height: 0.98, build: 'avg',   eye: 0x3a2a1a }, x: -30, z: 5.2 },
    { cfg: { skin: 0xc89a6a, hair: 0x141414, hairStyle: 'short', hat: 'cap', hatColor: 0x7a3a3a, shirt: 0x4a9a6a, pants: 0x4a4030, height: 1.03, build: 'avg', eye: 0x2a1a10 }, x: 4, z: 5.2 },
    { cfg: { skin: 0xf0c8a0, hair: 0x8a6a3a, hairStyle: 'bun',   shirt: 0xc06a9a, pants: 0x5a5070, height: 0.9,  build: 'round', eye: 0x4a3a22 }, x: 28, z: 5.2 },
    { cfg: { skin: 0xd8a878, hair: 0x3a2a18, hairStyle: 'short', shirt: 0xc0a040, pants: 0x4a4a5a, height: 1.0,  build: 'avg',   eye: 0x3a2a1a }, x: -12, z: 11 },
    { cfg: { skin: 0xb88858, hair: 0x141414, hairStyle: 'long',  shirt: 0x6a5aa0, pants: 0x3a3a3a, height: 0.95, build: 'avg',   eye: 0x2a1a10 }, x: 14, z: 24 },
    { cfg: { skin: 0xf0d0b0, hair: 0x6a4a2a, hairStyle: 'short', hat: 'cap', hatColor: 0x3a5a8a, shirt: 0x4aa0a0, pants: 0x4a4030, height: 1.05, build: 'avg', eye: 0x3a2a1a }, x: 44, z: 5.2 },
    { cfg: { skin: 0xc8986a, hair: 0x1a1a1a, hairStyle: 'bun',   shirt: 0xd06a5a, pants: 0x3a3a4a, height: 0.92, build: 'round', eye: 0x2a1a10 }, x: -42, z: 5.2 },
    { cfg: { skin: 0xe0b890, hair: 0x8a6a3a, hairStyle: 'long',  shirt: 0x7a6ac0, pants: 0x4a4a5a, height: 0.97, build: 'avg',   eye: 0x4a3a22 }, x: -14, z: -19 },
    { cfg: { skin: 0xb07a4a, hair: 0x141414, hairStyle: 'short', shirt: 0x5a8a4a, pants: 0x3a3a3a, height: 1.02, build: 'avg',   eye: 0x2a1a10 }, x: 24, z: -19 },
    { cfg: { skin: 0xf0c8a0, hair: 0x9a7a4a, hairStyle: 'bun',   shirt: 0xc0a040, pants: 0x5a5070, height: 0.9,  build: 'round', eye: 0x4a3a22 }, x: -40, z: 18 },
  ];
  people.forEach(p => {
    const { group, parts } = buildHuman(p.cfg);
    group.position.set(p.x, 0, p.z); scene.add(group);
    const ped = { group, parts, x: p.x, z: p.z, phase: Math.random() * 6 };
    state.peds.push(ped);
    initWander(ped, 4.5, 0.018);   // stroll a wider beat along the street
  });
  // …plus a livelier crowd of extra strollers dotted around town
  [[-60, 5.2], [60, -5.2], [-24, 6], [38, 5.2], [-50, 33], [30, 40], [8, -22], [-30, -28], [72, 32], [56, 24], [-8, 21], [22, 15]].forEach(([x, z]) => {
    const { group, parts } = buildHuman(randomPersonCfg());
    group.position.set(x, 0, z); scene.add(group);
    const ped = { group, parts, x, z, phase: Math.random() * 6 };
    state.peds.push(ped);
    initWander(ped, 5, 0.016 + Math.random() * 0.007);
  });
}

// ─── Commuters: townsfolk who actually WALK the streets, shop to shop ────────────
// Each keeps to an open street corridor (two sidewalk lanes) so they never clip houses.
const COMMUTE_ROUTES = [
  { xmin: -80, xmax: 80, lanes: [4.9, -4.9] },   // Main Street — the busiest
  { xmin: -80, xmax: 80, lanes: [4.9, -4.9] },
  { xmin: -80, xmax: 80, lanes: [4.9, -4.9] },
  { xmin: -80, xmax: 80, lanes: [4.9, -4.9] },
  { xmin: -80, xmax: 80, lanes: [4.9, -4.9] },
  { xmin: -55, xmax: 40, lanes: [36, 41] },      // North Avenue
  { xmin: -55, xmax: 40, lanes: [36, 41] },
  { xmin: -50, xmax: 45, lanes: [-24.5, -29] },  // South Lane
  { xmin: -50, xmax: 45, lanes: [-24.5, -29] },
];
const PED_SKINS = [0xe8c0a0, 0xd8a878, 0xc89a6a, 0xb88858, 0x8a5a3a, 0xf0d0b0, 0xe2b48c, 0xb07a4a];
const PED_HAIR = [0x2a1a10, 0x141414, 0x6a4a2a, 0x8a6a3a, 0x9a9a9a, 0x3a2a1a, 0x5a3a22];
const PED_SHIRT = [0x6a8ac0, 0x4a9a6a, 0xc06a9a, 0xc0a040, 0x6a5aa0, 0x4aa0a0, 0xd06a5a, 0x5a8a4a, 0xb05548, 0x7a6ac0];
const PED_PANTS = [0x3a3a4a, 0x4a4030, 0x5a5070, 0x3a3a3a, 0x46402e, 0x4a4a5a];
const PED_HAIRSTYLES = ['short', 'long', 'bun'];
function randomPersonCfg() {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const cfg = {
    skin: pick(PED_SKINS), hair: pick(PED_HAIR), hairStyle: pick(PED_HAIRSTYLES),
    shirt: pick(PED_SHIRT), pants: pick(PED_PANTS),
    height: 0.88 + Math.random() * 0.24, build: Math.random() < 0.4 ? 'round' : 'avg', eye: 0x2a1a10,
  };
  if (Math.random() < 0.3) { cfg.hat = 'cap'; cfg.hatColor = pick(PED_SHIRT); }
  return cfg;
}
function addCommuter() {
  const route = COMMUTE_ROUTES[Math.floor(Math.random() * COMMUTE_ROUTES.length)];
  const { group, parts } = buildHuman(randomPersonCfg());
  const lane = route.lanes[Math.random() < 0.5 ? 0 : 1];
  const x0 = route.xmin + Math.random() * (route.xmax - route.xmin);
  group.position.set(x0, 0, lane); scene.add(group);
  const c = {
    group, parts, x: x0, z: lane, phase: Math.random() * 6, route,
    wspeed: 0.028 + Math.random() * 0.014, wstate: 'idle',
    wtimer: 20 + Math.random() * 120, walkT: 0, target: { x: x0, z: lane },
  };
  state.commuters.push(c);
  return c;
}
function buildCommuters() { state.commuters = []; COMMUTE_ROUTES.forEach(() => addCommuter()); for (let i = 0; i < 6; i++) addCommuter(); }   // a busier street
// Despawn a resident (used when their home is demolished — they become homeless)
function removeCommuter() {
  const c = state.commuters.pop();
  if (c) scene.remove(c.group);
  return !!c;
}
// Walk to a spot somewhere along the corridor, pause, then head off again
function updateCommuter(o) {
  if (o.wstate === 'idle') {
    o.wtimer--;
    if (o.parts.legs) o.parts.legs.forEach(l => { l.rotation.x *= 0.8; });
    if (o.parts.arms) o.parts.arms.forEach(a => { a.rotation.x *= 0.8; });
    o.group.position.y *= 0.8; o.group.rotation.z *= 0.8;
    if (o.wtimer <= 0) {
      const r = o.route;
      // only stroll to a spot with a clear line — a building dropped onto the street
      // must be walked AROUND (by picking this side of it), not marched into
      for (let k = 0; k < 6; k++) {
        const tx = r.xmin + Math.random() * (r.xmax - r.xmin);
        const tz = r.lanes[Math.random() < 0.5 ? 0 : 1];
        if (!walkLineClear(o.x, o.z, tx, tz)) continue;
        o.target.x = tx; o.target.z = tz;
        o.wstate = 'walk';
        break;
      }
      if (o.wstate !== 'walk') o.wtimer = 60 + Math.random() * 120;   // no clear stroll right now — wait a bit
    }
    return;
  }
  const dx = o.target.x - o.x, dz = o.target.z - o.z, dist = Math.hypot(dx, dz);
  if (dist < 0.1 || (o.blockT || 0) > 45) {
    o.blockT = 0;
    if (o.exiting) { o.group.visible = false; o.exiting = false; }   // 🌙 home for the night
    o.wstate = 'idle'; o.wtimer = 50 + Math.random() * 170; return;
  }
  const step = Math.min(o.wspeed, dist);
  const px = o.x + dx / dist * step, pz = o.z + dz / dist * step;
  const wc = collide(px, pz, worldColliders, 0.28);        // commuters respect walls & trees too
  o.blockT = (Math.hypot(wc.x - px, wc.z - pz) > 0.02) ? (o.blockT || 0) + 1 : 0;
  o.x = wc.x; o.z = wc.z;
  o.group.position.x = o.x; o.group.position.z = o.z;
  const heading = Math.atan2(dx, dz);
  o.group.rotation.y += (((heading - o.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.2;
  o.walkT += 0.3;
  const sw = Math.sin(o.walkT);
  if (o.parts.legs) { o.parts.legs[0].rotation.x = sw * 0.5; o.parts.legs[1].rotation.x = -sw * 0.5; }
  if (o.parts.arms) { o.parts.arms[0].rotation.x = -sw * 0.4; o.parts.arms[1].rotation.x = sw * 0.4; }
  o.group.position.y = Math.abs(Math.sin(o.walkT)) * 0.02;
  o.group.rotation.z = sw * 0.03;                            // subtle hip sway while walking
}

// ─── Street football: kids kicking a ball you can join in with ───────────────────
function makeSoccerTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, 256, 128);
  const penta = (cx, cy, r, rot) => {
    g.beginPath();
    for (let i = 0; i < 5; i++) { const a = rot + i * 2 * Math.PI / 5; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.closePath(); g.fill();
  };
  g.fillStyle = '#1a1a1a';
  [[36, 34], [100, 30], [168, 36], [228, 30], [66, 84], [132, 90], [196, 84], [8, 96], [250, 96]]
    .forEach(([x, y], i) => penta(x, y, 15, i * 0.7));
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
  return tex;
}
function buildFootball() {
  const cx = -16, cz = 20;                                    // west side of the town square
  const pitch = { x0: cx - 9, x1: cx + 9, z0: cz - 5, z1: cz + 5 };
  const goalMat = pbr(0xf2f2f2, 0.5, 0.15);
  const buildGoal = gx => {
    [-1.5, 1.5].forEach(dz => cylinder(0.08, 0.08, 1.5, 8, goalMat, gx, 0.75, cz + dz));
    box(0.1, 0.1, 3.1, goalMat, gx, 1.5, cz);
  };
  buildGoal(pitch.x0); buildGoal(pitch.x1);
  // the ball — a proper black-&-white football (canvas texture of pentagons)
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18),
    new THREE.MeshStandardMaterial({ map: makeSoccerTexture(), roughness: 0.55 }));
  ball.castShadow = true; ball.position.set(cx, 0.3, cz); scene.add(ball);
  // Two teams: A (blue) attack the RIGHT goal, B (red) attack the LEFT goal. Each has a
  // keeper who stays back and a striker who chases. YOU play striker for the blue team.
  const kidDefs = [
    { role: 'keeper',  team: 'A', cfg: { skin: 0xf0c49a, hair: 0x7a4a2a, hairStyle: 'long',  shirt: 0x3a6ad0, pants: 0x2a3a6a, height: 0.68, build: 'slim', eye: 0x5a3a22 } },
    { role: 'striker', team: 'A', cfg: { skin: 0xe0b080, hair: 0x241712, hairStyle: 'child', shirt: 0x4a9ad0, pants: 0x3a3a4a, height: 0.70, build: 'slim', eye: 0x241712 } },
    { role: 'keeper',  team: 'B', cfg: { skin: 0xc89a6a, hair: 0x141414, hairStyle: 'short', shirt: 0xd04a4a, pants: 0x6a2a2a, height: 0.72, build: 'slim', eye: 0x2a1a10 } },
    { role: 'striker', team: 'B', cfg: { skin: 0xe8c0a0, hair: 0x6a4a2a, hairStyle: 'long',  shirt: 0xe05a5a, pants: 0x5a3a3a, height: 0.66, build: 'slim', eye: 0x4a3a22 } },
  ];
  const kids = kidDefs.map(d => {
    const { group, parts } = buildHuman(d.cfg);
    const homeX = d.team === 'A' ? pitch.x0 + 1.2 : pitch.x1 - 1.2;   // keepers guard their own goal
    const formX = d.role === 'keeper' ? homeX : cx + (d.team === 'A' ? -3 : 3);
    const formZ = cz + (d.role === 'keeper' ? 0 : (d.team === 'A' ? -1.4 : 1.4));
    group.position.set(formX, 0, formZ); group.rotation.y = d.team === 'A' ? Math.PI / 2 : -Math.PI / 2; scene.add(group);
    return { group, parts, x: formX, z: formZ, role: d.role, team: d.team, homeX, formX, formZ, walkT: Math.random() * 6, cheer: 0, kickCd: 0, kickAnim: 0 };
  });
  const teamGoal = { A: pitch.x1, B: pitch.x0 };   // the cat is on team A → shoots right
  state.football = { ball, cx, cz, pitch, kids, teamGoal, vx: 0, vz: 0, score: 0, greeted: false, catKickT: 0, goalW: 1.6, kickoff: 90 };
}
// Move a player toward (tx,tz), decelerating near the target, with gentle separation
function stepFootballer(f, k, tx, tz, speed) {
  let dx = tx - k.x, dz = tz - k.z;
  const distToTarget = Math.hypot(dx, dz);
  f.kids.forEach(o => {   // gentle push-apart only when quite close (avoids jitter)
    if (o === k) return;
    const ox = k.x - o.x, oz = k.z - o.z, od = Math.hypot(ox, oz);
    if (od > 0.001 && od < 0.85) { dx += ox / od * (0.85 - od) * 1.1; dz += oz / od * (0.85 - od) * 1.1; }
  });
  const d = Math.hypot(dx, dz);
  if (distToTarget < 0.12) {   // arrived → settle to a stand
    if (k.parts.legs) k.parts.legs.forEach(l => l.rotation.x *= 0.7);
    if (k.parts.arms) k.parts.arms.forEach(a => a.rotation.x *= 0.7);
    k.group.position.y *= 0.7;
    return;
  }
  const step = Math.min(speed * Math.min(1, distToTarget / 0.8), d);   // ease as we close in
  k.x = Math.max(f.pitch.x0 + 0.3, Math.min(f.pitch.x1 - 0.3, k.x + dx / d * step));
  k.z = Math.max(f.pitch.z0 + 0.3, Math.min(f.pitch.z1 - 0.3, k.z + dz / d * step));
  k.group.position.x = k.x; k.group.position.z = k.z;
  const heading = Math.atan2(dx, dz);
  k.group.rotation.y += (((heading - k.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.18;
  k.walkT += 0.3 + step * 3; const sw = Math.sin(k.walkT);   // stride matches speed
  if (k.parts.legs) { k.parts.legs[0].rotation.x = sw * 0.55; k.parts.legs[1].rotation.x = -sw * 0.55; }
  if (k.parts.arms) { k.parts.arms[0].rotation.x = -sw * 0.4; k.parts.arms[1].rotation.x = sw * 0.4; }
  k.group.position.y = Math.abs(sw) * 0.025;
}
// One clean kick: face the ball, boot it toward the goal, then a cooldown before kicking again
function doKick(f, k, targetX, power) {
  const bx = f.ball.position.x, bz = f.ball.position.z;
  const aimZ = f.cz + (Math.random() - 0.5) * 2.0;
  const tx = targetX - bx, tz = aimZ - bz, tl = Math.hypot(tx, tz) || 1;
  f.vx += tx / tl * power; f.vz += tz / tl * power;
  k.group.rotation.y = Math.atan2(bx - k.x, bz - k.z);   // face the ball
  k.kickCd = 45 + Math.random() * 25;
  k.kickAnim = 12;
  if (typeof sfx === 'function' && Math.random() < 0.35) sfx('catch');   // a soft thud
}
function animateKick(k) {
  const p = 1 - k.kickAnim / 12;                 // 0 → 1 over the swing
  const swing = Math.sin(p * Math.PI);           // wind back, snap through
  if (k.parts.legs) { k.parts.legs[0].rotation.x = -1.3 * swing; k.parts.legs[1].rotation.x = 0.25 * swing; }
  if (k.parts.arms) { k.parts.arms[0].rotation.x = 0.5 * swing; k.parts.arms[1].rotation.x = -0.5 * swing; }
}
function updateFootball() {
  const f = state.football;
  if (!f || !f.ball.visible) return;
  const bx = f.ball.position.x, bz = f.ball.position.z;

  // kickoff pause after a goal — everyone jogs back into formation, ball waits at centre
  if (f.kickoff > 0) {
    f.kickoff--;
    f.kids.forEach(k => stepFootballer(f, k, k.formX, k.formZ, 0.03));
    return;
  }

  const cat = catGroup.position;
  if (f.catKickT > 0) f.catKickT--;
  // the cat dribbles: a gentle, steady nudge (not a rocket)
  const dcx = bx - cat.x, dcz = bz - cat.z, dCat = Math.hypot(dcx, dcz);
  if (dCat < 0.7) {
    const inv = 1 / (dCat || 1);
    f.vx += dcx * inv * 0.12; f.vz += dcz * inv * 0.12;
    f.catKickT = 130;
    if (!f.greeted) { f.greeted = true; showNotif('⚽ You\'re striker for the blue team — dribble it into the right goal!'); }
  }
  f.kids.forEach(k => {
    if (k.kickCd > 0) k.kickCd--;
    if (k.cheer > 0) { k.cheer--; k.group.position.y = Math.abs(Math.sin(k.cheer * 0.6)) * 0.18; return; }
    if (k.kickAnim > 0) { k.kickAnim--; animateKick(k); return; }   // mid-kick: hold & swing
    const dk = Math.hypot(bx - k.x, bz - k.z);
    if (k.role === 'keeper') {
      stepFootballer(f, k, k.homeX, Math.max(f.cz - f.goalW * 0.8, Math.min(f.cz + f.goalW * 0.8, bz)), 0.028);
      if (dk < 0.85 && k.kickCd <= 0) doKick(f, k, f.teamGoal[k.team], 0.34);   // clear it
    } else {
      const mates = f.kids.filter(o => o.role === 'striker' && o.team === k.team);
      const nearest = mates.reduce((a, b) => (Math.hypot(bx - a.x, bz - a.z) <= Math.hypot(bx - b.x, bz - b.z) ? a : b));
      if (k === nearest) {
        if (dk < 0.75 && k.kickCd <= 0) doKick(f, k, f.teamGoal[k.team], 0.3);
        else stepFootballer(f, k, bx, bz, 0.032);
      } else {
        stepFootballer(f, k, (bx + f.teamGoal[k.team]) / 2, f.cz + (k.team === 'A' ? 1.9 : -1.9), 0.024);   // hold support
      }
    }
  });
  // roll the ball with friction (rolls longer & smoother), bounce off edges, score in goals
  f.vx *= 0.955; f.vz *= 0.955;
  let nx = bx + f.vx, nz = bz + f.vz;
  const p = f.pitch;
  if ((nx <= p.x0 + 0.25 || nx >= p.x1 - 0.25) && Math.abs(nz - f.cz) < f.goalW) { footballGoal(nx >= p.x1 - 0.25); return; }
  if (nx < p.x0 + 0.2) { nx = p.x0 + 0.2; f.vx = Math.abs(f.vx) * 0.5; }
  if (nx > p.x1 - 0.2) { nx = p.x1 - 0.2; f.vx = -Math.abs(f.vx) * 0.5; }
  if (nz < p.z0 + 0.2) { nz = p.z0 + 0.2; f.vz = Math.abs(f.vz) * 0.5; }
  if (nz > p.z1 - 0.2) { nz = p.z1 - 0.2; f.vz = -Math.abs(f.vz) * 0.5; }
  f.ball.position.set(nx, 0.3, nz);
  f.ball.rotation.x += f.vz * 1.3; f.ball.rotation.z -= f.vx * 1.3;
}
function footballGoal(rightGoal) {
  const f = state.football;
  f.ball.position.set(f.cx, 0.3, f.cz);
  f.vx = 0; f.vz = 0; f.score++; f.kickoff = 90;   // pause for kickoff
  f.kids.forEach(k => { k.cheer = 26; });   // little celebration hop
  if (typeof sfx === 'function') sfx('upgrade');
  const yourTeamScored = rightGoal;          // team A (yours) attacks the right goal
  const youHelped = f.catKickT > 0;          // you touched the ball just before it went in
  if (yourTeamScored && youHelped) {
    state.coins += 3; document.getElementById('coin-count').textContent = state.coins;
    if (typeof sfx === 'function') sfx('coin');
    showNotif('⚽ GOAL for your team! +3 🪙  ·  ' + f.score);
    if (typeof saveGame === 'function') saveGame();
  } else if (yourTeamScored) {
    showNotif('⚽ Blue team scores!  (' + f.score + ')');
  } else {
    showNotif('⚽ Red team scores!  (' + f.score + ')');
  }
  f.catKickT = 0;
}

// ─── The Miller family (standing outside their home) ────────────────────────────
function buildFamily() {
  const fam = [
    { name: 'Daniel', x: -4.4, z: -7.8, cfg: { skin: 0xd9a070, hair: 0x3a2a1a, hairStyle: 'short', shirt: 0x5a7a5a, pants: 0x46402e, height: 1.04, build: 'avg',  eye: 0x3a2a1a } },
    { name: 'Elena',  x: -3.5, z: -7.6, cfg: { skin: 0xe8b48c, hair: 0x5a3a22, hairStyle: 'long', apron: true, apronColor: 0xc88aa0, shirt: 0xc86a7a, pants: 0x5a5070, height: 0.97, build: 'avg',  eye: 0x4a3a22 } },
    { name: 'Lily',   x: -2.5, z: -7.9, cfg: { skin: 0xf0c49a, hair: 0x7a4a2a, hairStyle: 'long', shirt: 0xe0a0c0, pants: 0x8a6aa0, height: 0.62, build: 'slim', eye: 0x5a3a22 } },
    { name: 'Noah',   x: -1.7, z: -7.6, cfg: { skin: 0xe0b080, hair: 0x241712, hairStyle: 'child', shirt: 0x5a80c0, pants: 0x3a3a4a, height: 0.74, build: 'slim', eye: 0x241712 } },
  ];
  fam.forEach(p => {
    const { group, parts } = buildHuman(p.cfg);
    group.position.set(p.x, 0, p.z);
    scene.add(group);
    const m = { group, parts, name: p.name, phase: Math.random() * 6 };
    state.family.push(m);
    initWander(m, 1.0, 0.02);
  });
}

// ─── Mr. Crick, the landlord — and the rent deadline (Act 3 stakes) ──────────────
function spawnCrick() {
  // a cold, businesslike man in a dark suit, with a briefcase
  const cfg = { skin: 0xd8b89a, hair: 0x2a2a2a, hairStyle: 'short', glasses: true,
                shirt: 0x24242c, pants: 0x1c1c24, shoe: 0x141418, height: 1.06, build: 'avg', eye: 0x3a3a3a };
  const { group, parts } = buildHuman(cfg);
  const briefcase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.08), pbr(0x3a2a1a, 0.5, 0.1));
  briefcase.position.set(0.36, 0.95, 0.1); briefcase.castShadow = true; group.add(briefcase);
  group.visible = false;
  scene.add(group);
  state.crick = { group, parts, mode: null, target: { x: 12, z: -2.5 }, walkT: 0, onArrive: null, phase: 1.5 };
}

// Walk Crick in from the road to the Miller house, then run a callback
function crickArrive(onArrive) {
  const c = state.crick;
  c.group.position.set(9, 0, -2.5);
  c.group.rotation.y = Math.PI / 2;
  c.group.visible = true;
  c.target = { x: -3, z: -6.0 };
  c.mode = 'arriving';
  c.onArrive = onArrive;
}
function crickLeave() {
  const c = state.crick;
  c.target = { x: 13, z: -2.5 };
  c.mode = 'leaving';
}

function updateCrick() {
  const c = state.crick;
  if (!c || !c.mode) return;
  const g = c.group;
  const dx = c.target.x - g.position.x, dz = c.target.z - g.position.z, dist = Math.hypot(dx, dz);
  if (dist > 0.06) {                                   // walking
    const step = Math.min(0.05, dist);
    g.position.x += dx / dist * step; g.position.z += dz / dist * step;
    const heading = Math.atan2(dx, dz);
    g.rotation.y += (((heading - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.2;
    c.walkT += 0.3;
    const sw = Math.sin(c.walkT);
    if (c.parts.legs) { c.parts.legs[0].rotation.x = sw * 0.5; c.parts.legs[1].rotation.x = -sw * 0.5; }
    if (c.parts.arms) { c.parts.arms[0].rotation.x = -sw * 0.4; c.parts.arms[1].rotation.x = sw * 0.4; }
    g.position.y = Math.abs(Math.sin(c.walkT)) * 0.02;
  } else {                                             // arrived at the target
    if (c.parts.legs) c.parts.legs.forEach(l => l.rotation.x *= 0.8);
    g.position.y *= 0.8;
    idleHuman(c, t);
    if (c.mode === 'arriving') {
      c.mode = 'present';
      g.rotation.y = Math.atan2(-3.5 - g.position.x, -7.6 - g.position.z); // face the family
      const cb = c.onArrive; c.onArrive = null;
      if (cb) cb();
    } else if (c.mode === 'leaving') {
      c.mode = null; c.group.visible = false;
    }
  }
}

function updateRentHUD() {
  const cur = Math.min(state.houseFund, RENT.goal);   // rent is paid from money given to the family
  const el = id => document.getElementById(id);
  el('rent-cur').textContent = cur;
  el('rent-goal').textContent = RENT.goal;
  el('rent-days').textContent = state.daysLeft;
  el('rent-bar').style.width = (cur / RENT.goal * 100) + '%';
  el('rent-line').classList.toggle('urgent', state.rentActive && state.daysLeft <= 3);
}

// Crick's first visit: announce the deadline and start the winter countdown
function triggerDeadline() {
  state.storyAct = 3; state.crickMet = true;
  showNotif('🧾 Mr. Crick is at the door…');
  crickArrive(() => {
    playDialogueScene([
      ['Mr. Crick', "I'm not a monster, Mrs. Miller. But business is business. The rent — all of it — by the end of winter. After that… I'm sorry.", 5400],
      ['🏠 The Millers', "We'll find a way, Mr. Crick. We always do.", 3400],
      [state.catName + ' 🐱', "End of winter. Then that's my deadline too. Every coin counts now.", 4400],
    ], () => {
      state.daysLeft = RENT.days;
      state.rentActive = true;
      document.getElementById('rent-line').style.display = 'block';
      updateRentHUD();
      crickLeave();
    });
  });
}

// The rent is paid in time — Crick softens, the family celebrates
function winDeadline() {
  if (!state.rentActive) return;
  state.rentActive = false; state.storyAct = 4;
  showNotif('🏠 The rent is paid in full!');
  crickArrive(() => {
    playDialogueScene([
      ['🏠 The Millers', "Mr. Crick… it's all here. Every penny we owe.", 4200],
      ['Mr. Crick', "Well… I'll be. You did it, Mrs. Miller. The house is yours — free and clear.", 5000],
      ['Lily', "You did this. Somehow… you did this for us.", 3600],
      [state.catName + ' 🐱', "No, Lily. We did it. This is what a family does. ❤️", 4600],
    ], () => {
      document.getElementById('rent-line').style.display = 'none';
      crickLeave();
    });
  });
}

// Winter ended before the rent was paid — one more chance, but a real setback
function failDeadline() {
  if (!state.rentActive) return;
  state.rentActive = false;
  showNotif('❄️ Winter has come and gone…');
  crickArrive(() => {
    playDialogueScene([
      ['Mr. Crick', "Time's up, Mrs. Miller. The rent isn't paid in full. Rules are rules.", 4600],
      ['🏠 The Millers', "Please — we're so close. Just a little more time. For the children.", 4400],
      ['Mr. Crick', "…One more chance. But the clock starts over. Don't waste it.", 4400],
      [state.catName + ' 🐱', "I won't let them down. Not now. Back to work.", 3800],
    ], () => {
      state.daysLeft = RENT.days;
      state.houseFund = Math.max(0, state.houseFund - RENT.penalty);   // the family loses a little ground
      updateFamilyStatus();                 // the home visibly slips back a little
      state.rentActive = true;
      updateRentHUD();
      crickLeave();
    });
  });
}

// ─── Coin 3D ──────────────────────────────────────────────────────────────────
function spawnCoin3D(x, z) {
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 10), mat.coin);
  coin.position.set(x, 0.3, z);
  scene.add(coin);
  state.coins3d.push({ mesh: coin, x, z, age: 0 });
}

// ─── Build the world ──────────────────────────────────────────────────────────
