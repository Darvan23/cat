// Paws & Pennies — cat: the procedural cat model + coat appearance
// Classic script: shares globals with the others; load order matters (see index.html).

// ─── Cat (procedural, anatomy-shaped) ───────────────────────────────────────────
const catGroup = new THREE.Group();
scene.add(catGroup);

// Helper: a smooth ellipsoid (scaled sphere) added to the cat
function ellip(r, sx, sy, sz, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), material);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  catGroup.add(m);
  return m;
}

// Body — blended torso, chest, rump and neck
const catBody = ellip(0.3, 1.08, 0.96, 1.7, mat.catBody, 0, 0.44, -0.05); // torso (breathing target)
ellip(0.3, 1.00, 1.00, 0.95, mat.catBody, 0, 0.42, 0.34);   // chest
ellip(0.3, 1.12, 1.08, 1.05, mat.catBody, 0, 0.45, -0.42);  // rump
ellip(0.12, 1.0, 1.2, 1.0, mat.catBody, 0, 0.55, 0.45);     // neck

// Head — skull, muzzle and cheeks
ellip(0.26, 1.0, 0.95, 0.92, mat.catBody, 0, 0.66, 0.6);    // skull
const muzzle = ellip(0.15, 1.1, 0.85, 0.9, mat.catBody, 0, 0.57, 0.8); // muzzle
ellip(0.1, 1.0, 0.9, 0.8, mat.catBody, -0.12, 0.6, 0.72);   // cheek L
ellip(0.1, 1.0, 0.9, 0.8, mat.catBody,  0.12, 0.6, 0.72);   // cheek R

// Ears — outer shell + pink inner
[-0.14, 0.14].forEach(ex => {
  const ear = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 12), mat.catDark);
  ear.position.set(ex, 0.9, 0.52);
  ear.rotation.z = -ex * 1.2; ear.rotation.x = -0.25;
  ear.castShadow = true;
  catGroup.add(ear);
  const inner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 10), mat.catInner);
  inner.position.set(ex, 0.88, 0.55);
  inner.rotation.copy(ear.rotation);
  catGroup.add(inner);
});

// Eyes — coloured iris + pupil
function eye(x) {
  const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), mat.catEye);
  e.position.set(x, 0.69, 0.78);
  catGroup.add(e);
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), mat.catPupil);
  p.position.set(x, 0.69, 0.83); p.scale.set(0.6, 1.1, 1);
  catGroup.add(p);
}
eye(-0.11); eye(0.11);

// Nose
const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), mat.catNose);
nose.position.set(0, 0.6, 0.95); nose.scale.set(1.2, 0.8, 0.8);
catGroup.add(nose);

// Whiskers
const whiskerMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
[[-1, 0.62], [-1, 0.57], [1, 0.62], [1, 0.57]].forEach(([side, wy]) => {
  const g = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(side * 0.08, wy, 0.86),
    new THREE.Vector3(side * 0.34, wy + 0.02 * side, 0.7),
  ]);
  catGroup.add(new THREE.Line(g, whiskerMat));
});

// Tail — curved tube on a pivot so it can sway
const tail = new THREE.Group();
tail.position.set(0, 0.5, -0.62);
catGroup.add(tail);
const tailCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0.18, -0.18),
  new THREE.Vector3(0, 0.42, -0.28),
  new THREE.Vector3(0, 0.62, -0.16),
]);
const tailMesh = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 20, 0.06, 8, false), mat.catDark);
tailMesh.castShadow = true;
tail.add(tailMesh);
const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat.catDark);
tailTip.position.set(0, 0.62, -0.16);
tail.add(tailTip);

// Legs — 4 groups pivoting at the hip for a walk cycle
const legHips = [
  [-0.17, 0.42, 0.30], [0.17, 0.42, 0.30],    // front
  [-0.19, 0.43, -0.34], [0.19, 0.43, -0.34],  // back
];
const legSocks = [];
const legs = legHips.map(([lx, ly, lz]) => {
  const leg = new THREE.Group();
  leg.position.set(lx, ly, lz);
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.26, 10), mat.catBody);
  upper.position.y = -0.13; upper.castShadow = true; leg.add(upper);
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.22, 10), mat.catBody);
  lower.position.y = -0.34; lower.castShadow = true; leg.add(lower);
  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), mat.catBody);
  paw.position.set(0, -0.44, 0.03); paw.scale.set(1, 0.7, 1.3); paw.castShadow = true; leg.add(paw);
  // a tuxedo "sock" that lives ON the leg (so it swings with it, not a stationary white blob)
  const sock = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), mat.catWhite);
  sock.scale.set(1, 1.25, 1.45); sock.position.set(0, -0.36, 0.03); sock.visible = false; sock.castShadow = true; leg.add(sock);
  legSocks.push(sock);
  catGroup.add(leg);
  return leg;
});

// ── Coat markings (one group shown depending on the chosen cat) ──
function markMesh(group, r, sx, sy, sz, material, x, y, z) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), material);
  m.scale.set(sx, sy, sz); m.position.set(x, y, z);
  m.castShadow = true; group.add(m);
  return m;
}
const tabbyGroup = new THREE.Group(); catGroup.add(tabbyGroup);
markMesh(tabbyGroup, 0.30, 1.12, 0.62, 1.55, mat.catMarkA, 0, 0.55, -0.10); // darker saddle
markMesh(tabbyGroup, 0.26, 1.00, 0.50, 0.70, mat.catMarkA, 0, 0.78, 0.55);  // forehead

const tuxGroup = new THREE.Group(); catGroup.add(tuxGroup);
markMesh(tuxGroup, 0.30, 0.85, 0.95, 0.80, mat.catWhite, 0, 0.34, 0.42); // white chest
markMesh(tuxGroup, 0.15, 1.05, 0.80, 0.90, mat.catWhite, 0, 0.52, 0.86); // white muzzle
// (the white paw "socks" now live on the leg groups so they move with the legs — see legSocks)

const calicoGroup = new THREE.Group(); catGroup.add(calicoGroup);
markMesh(calicoGroup, 0.30, 0.95, 0.80, 1.15, mat.catMarkA, 0.14, 0.50, -0.20);
markMesh(calicoGroup, 0.26, 0.95, 0.95, 0.85, mat.catMarkB, -0.12, 0.66, 0.52);

[tabbyGroup, tuxGroup, calicoGroup].forEach(g => g.visible = false);

// A collar accessory (hidden until the player puts one on)
const collarMesh = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20), new THREE.MeshStandardMaterial({ color: 0xc03a3a, roughness: 0.5, metalness: 0.1 }));
collarMesh.position.set(0, 0.55, 0.44); collarMesh.rotation.x = Math.PI / 2; collarMesh.visible = false; collarMesh.castShadow = true;
catGroup.add(collarMesh);
const collarBell = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf0c040, roughness: 0.25, metalness: 0.6 }));
collarBell.position.set(0, 0.47, 0.56); collarBell.visible = false; catGroup.add(collarBell);
function setCatCollar(on, color) {
  collarMesh.visible = !!on; collarBell.visible = !!on;
  if (color) collarMesh.material.color.set(color);
}

// Buyable accessories: hats sit on the head, glasses on the eyes. Each is its own
// little group, hidden until equipped. setCatHat(id) shows one hat (or none).
const hats = {};
function makeHat(id, build) { const g = new THREE.Group(); build(g); g.visible = false; g.traverse(m => { if (m.isMesh) m.castShadow = true; }); catGroup.add(g); hats[id] = g; }
const HM = (c, rough = 0.7, metal = 0.05) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal });
// Party hat — a bright striped cone with a pom-pom
makeHat('party', g => {
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 16), HM(0xe85a8a));
  cone.position.set(0, 1.18, 0.5); cone.rotation.x = 0.12; g.add(cone);
  const pom = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), HM(0xf5e070));
  pom.position.set(0, 1.42, 0.55); g.add(pom);
});
// Top hat — cylinder crown on a wide brim
makeHat('top', g => {
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 18), HM(0x1a1a20, 0.4, 0.1));
  crown.position.set(0, 1.18, 0.5); g.add(crown);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 20), HM(0x1a1a20, 0.4, 0.1));
  brim.position.set(0, 1.0, 0.5); g.add(brim);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.07, 18), HM(0xc03a3a, 0.5));
  band.position.set(0, 1.04, 0.5); g.add(band);
});
// Baseball cap — a dome with a forward brim
makeHat('cap', g => {
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), HM(0x3a6ac0, 0.8));
  dome.position.set(0, 0.98, 0.52); g.add(dome);
  const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 18, 1, false, 0, Math.PI), HM(0x2a55a0, 0.8));
  peak.position.set(0, 0.98, 0.78); peak.rotation.x = 0.1; g.add(peak);
});
// Cute bow — two triangles either side of a knot, worn on the head
makeHat('bow', g => {
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), HM(0xd8407a, 0.6));
  knot.position.set(0.16, 0.98, 0.52); g.add(knot);
  [-1, 1].forEach(s => {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.16, 4), HM(0xe85a9a, 0.6));
    wing.position.set(0.16, 0.98, 0.52 + s * 0.11); wing.rotation.x = s * Math.PI / 2; g.add(wing);
  });
});
// Glasses — two rings joined by a bridge, at eye level
const glassesGroup = new THREE.Group();
[-0.11, 0.11].forEach(x => {
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 8, 18), HM(0x101014, 0.4, 0.2));
  rim.position.set(x, 0.69, 0.82); glassesGroup.add(rim);
});
const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.016, 0.016), HM(0x101014, 0.4, 0.2));
bridge.position.set(0, 0.69, 0.82); glassesGroup.add(bridge);
glassesGroup.visible = false; glassesGroup.traverse(m => { if (m.isMesh) m.castShadow = true; }); catGroup.add(glassesGroup);
function setCatHat(id) { Object.keys(hats).forEach(k => hats[k].visible = (k === id)); }
function setCatGlasses(on) { glassesGroup.visible = !!on; }

// Apply a chosen cat's colours + coat pattern to the 3D model
function applyCatAppearance(cat) {
  mat.catBody.color.set(cat.body);
  mat.catEye.color.set(cat.eye);
  if (cat.nose) mat.catNose.color.set(cat.nose);
  // ears & tail use the accent, except tuxedos keep dark ears matching the body
  mat.catDark.color.set(cat.markings === 'tuxedo' ? cat.body : cat.accent);
  tabbyGroup.visible  = cat.markings === 'tabby';
  tuxGroup.visible    = cat.markings === 'tuxedo';
  calicoGroup.visible = cat.markings === 'calico';
  legSocks.forEach(s => s.visible = cat.markings === 'tuxedo');   // white socks only on tuxedos
  if (cat.markings === 'tabby')  mat.catMarkA.color.set(cat.accent);
  if (cat.markings === 'tuxedo') mat.catWhite.color.set(cat.accent);
  if (cat.markings === 'calico') { mat.catMarkA.color.set(cat.patch1 || cat.accent); mat.catMarkB.color.set(cat.patch2 || 0x3a3530); }
}
// default look (ginger tabby) until the player adopts a cat
applyCatAppearance({ body: '#e8c878', accent: '#b88838', eye: '#7cc46a', markings: 'tabby' });

// The cat is small in the big world — and smaller still indoors, so a real room feels roomy
const CAT_SCALE_OUT = 0.62, CAT_SCALE_IN = 0.42;
catGroup.scale.setScalar(CAT_SCALE_OUT);

// Build a standalone cat that looks EXACTLY like the hero cat, in any coat (for rescued cats).
// Returns { group, legs, tail, body } so it can be walked/animated independently.
function buildCatModel(cat) {
  const g = new THREE.Group();
  const M = (c, rough = 0.85, metal = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal });
  const bodyM = M(cat.body);
  const darkM = M(cat.markings === 'tuxedo' ? cat.body : cat.accent);   // ears & tail
  const innerM = M(0xe89a9a, 0.9), noseM = M(0xe0788a, 0.6), eyeM = M(cat.eye, 0.25, 0.1), pupM = M(0x101014, 0.2);
  const whiteM = M(cat.accent);                                          // tuxedo white = accent
  const markAM = M(cat.markings === 'calico' ? (cat.patch1 || cat.accent) : cat.accent);
  const markBM = M(cat.patch2 || 0x3a3530);
  const el = (r, sx, sy, sz, m, x, y, z) => { const me = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); me.scale.set(sx, sy, sz); me.position.set(x, y, z); me.castShadow = true; g.add(me); return me; };
  // body
  const body = el(0.3, 1.08, 0.96, 1.7, bodyM, 0, 0.44, -0.05);
  el(0.3, 1.0, 1.0, 0.95, bodyM, 0, 0.42, 0.34); el(0.3, 1.12, 1.08, 1.05, bodyM, 0, 0.45, -0.42); el(0.12, 1.0, 1.2, 1.0, bodyM, 0, 0.55, 0.45);
  // head
  el(0.26, 1.0, 0.95, 0.92, bodyM, 0, 0.66, 0.6); el(0.15, 1.1, 0.85, 0.9, bodyM, 0, 0.57, 0.8);
  el(0.1, 1.0, 0.9, 0.8, bodyM, -0.12, 0.6, 0.72); el(0.1, 1.0, 0.9, 0.8, bodyM, 0.12, 0.6, 0.72);
  // ears
  [-0.14, 0.14].forEach(ex => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.26, 12), darkM); ear.position.set(ex, 0.9, 0.52); ear.rotation.z = -ex * 1.2; ear.rotation.x = -0.25; ear.castShadow = true; g.add(ear);
    const inn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 10), innerM); inn.position.set(ex, 0.88, 0.55); inn.rotation.copy(ear.rotation); g.add(inn);
  });
  // eyes + nose
  [-0.11, 0.11].forEach(ex => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), eyeM); e.position.set(ex, 0.69, 0.78); g.add(e);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 10), pupM); p.position.set(ex, 0.69, 0.83); p.scale.set(0.6, 1.1, 1); g.add(p);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), noseM); nose.position.set(0, 0.6, 0.95); nose.scale.set(1.2, 0.8, 0.8); g.add(nose);
  // tail
  const tail = new THREE.Group(); tail.position.set(0, 0.5, -0.62); g.add(tail);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.18, -0.18), new THREE.Vector3(0, 0.42, -0.28), new THREE.Vector3(0, 0.62, -0.16)]);
  const tm = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.06, 8, false), darkM); tm.castShadow = true; tail.add(tm);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), darkM); tip.position.set(0, 0.62, -0.16); tail.add(tip);
  // legs
  const hips = [[-0.17, 0.42, 0.30], [0.17, 0.42, 0.30], [-0.19, 0.43, -0.34], [0.19, 0.43, -0.34]];
  const tux = cat.markings === 'tuxedo';
  const legs = hips.map(([lx, ly, lz]) => {
    const leg = new THREE.Group(); leg.position.set(lx, ly, lz);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.26, 10), bodyM); up.position.y = -0.13; up.castShadow = true; leg.add(up);
    const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.22, 10), bodyM); lo.position.y = -0.34; lo.castShadow = true; leg.add(lo);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), bodyM); paw.position.set(0, -0.44, 0.03); paw.scale.set(1, 0.7, 1.3); leg.add(paw);
    if (tux) { const sock = new THREE.Mesh(new THREE.SphereGeometry(0.088, 12, 10), whiteM); sock.scale.set(1, 1.25, 1.45); sock.position.set(0, -0.36, 0.03); sock.castShadow = true; leg.add(sock); }   // sock rides the leg
    g.add(leg); return leg;
  });
  // coat markings
  const mm = (r, sx, sy, sz, m, x, y, z) => { const me = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); me.scale.set(sx, sy, sz); me.position.set(x, y, z); me.castShadow = true; g.add(me); };
  if (cat.markings === 'tabby') { mm(0.30, 1.12, 0.62, 1.55, markAM, 0, 0.55, -0.10); mm(0.26, 1.00, 0.50, 0.70, markAM, 0, 0.78, 0.55); }
  else if (tux) { mm(0.30, 0.85, 0.95, 0.80, whiteM, 0, 0.34, 0.42); mm(0.15, 1.05, 0.80, 0.90, whiteM, 0, 0.52, 0.86); }
  else if (cat.markings === 'calico') { mm(0.30, 0.95, 0.80, 1.15, markAM, 0.14, 0.50, -0.20); mm(0.26, 0.95, 0.95, 0.85, markBM, -0.12, 0.66, 0.52); }
  // whiskers
  const whiskerMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  [[-1, 0.62], [-1, 0.57], [1, 0.62], [1, 0.57]].forEach(([side, wy]) => {
    const wg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(side * 0.08, wy, 0.86), new THREE.Vector3(side * 0.34, wy + 0.02 * side, 0.7)]);
    g.add(new THREE.Line(wg, whiskerMat));
  });
  // optional collar + bell (used by designed/created cats)
  if (cat.collar) {
    const cm = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 20), M(cat.collar, 0.5, 0.1));
    cm.position.set(0, 0.55, 0.44); cm.rotation.x = Math.PI / 2; cm.castShadow = true; g.add(cm);
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M(0xf0c040, 0.25, 0.6));
    bell.position.set(0, 0.47, 0.56); g.add(bell);
  }
  return { group: g, legs, tail, body };
}

// ─── Mice now live in the dedicated mouse-catching minigame (see startMinigame) ──
