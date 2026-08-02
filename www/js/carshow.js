// ═══════════════════════════════════════════════════════════════════════════
//  🚗 WHISKER MOTORS — the car showroom by the Gray House
//  Buy a cute little cat car, drive it anywhere, keep your shopping in the
//  trunk. Steering wheel on the left, gas & brake on the right.
// ═══════════════════════════════════════════════════════════════════════════

const CARSHOW = { x: -84, z: 29, w: 15, d: 9 };       // faces the Gray House across the road
const CAR_STYLES = {
  bug:    { id: 'bug',    name: 'Kitten Bug',   e: '🐞', price: 120, body: 0xe888a8, accent: 0xf8d0dc, trunk: 2, maxV: 0.34, blurb: 'Small, round, unstoppable.' },
  truck:  { id: 'truck',  name: 'Tabby Truck',  e: '🛻', price: 200, body: 0xe08a30, accent: 0x8a5a20, trunk: 4, maxV: 0.32, blurb: 'Stripes AND a flatbed.' },
  van:    { id: 'van',    name: 'Milk Van',     e: '🥛', price: 260, body: 0xf0eee8, accent: 0x9ab8d0, trunk: 6, maxV: 0.30, blurb: 'The biggest trunk in town.' },
  tux:    { id: 'tux',    name: 'Tuxedo Zoom',  e: '🏎️', price: 350, body: 0x24242c, accent: 0xf0f0f0, trunk: 2, maxV: 0.46, blurb: 'Fastest whiskers on wheels.' },
  royale: { id: 'royale', name: 'Lion Royale',  e: '👑', price: 500, body: 0xe0b040, accent: 0xa06a20, trunk: 3, maxV: 0.40, blurb: 'Arrive like a king.' },
  presidential: { id: 'presidential', name: 'Presidential One', e: '🎩', price: 0, body: 0x1c1e2a, accent: 0xc8a860, trunk: 5, maxV: 0.44, blurb: 'The office on wheels.' },
};

// ── the cat car itself: ears, tail, whiskers and headlight eyes ──
function buildCatCar(styleId) {
  const st = CAR_STYLES[styleId] || CAR_STYLES.bug;
  const g = new THREE.Group();
  const bodyM = pbr(st.body, 0.45, 0.15), accM = pbr(st.accent, 0.5), darkM = pbr(0x22222a, 0.6);
  const mk = (mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; g.add(mesh); return mesh; };

  // body shapes per style
  if (styleId === 'truck') {
    mk(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.1), bodyM), 0, 0.55, 0.45);            // cab
    mk(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, 1.0), bodyM), 0, 0.44, -0.62);          // bed
    mk(new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.34, 0.9), pbr(0x6a4a20, 0.8)), 0, 0.62, -0.62);
    mk(new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.3, 0.55), bodyM), 0, 0.92, 0.42);          // cab roof
    for (let i = 0; i < 3; i++) mk(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 1.1), accM), -0.4 + i * 0.4, 0.56, 0.451);  // tabby stripes
  } else if (styleId === 'van') {
    mk(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 2.0), bodyM), 0, 0.72, 0);
    mk(new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.4, 0.7), accM), 0, 0.5, 0.7);              // blue nose band
    const carton = mk(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.4), pbr(0xf8f8f4, 0.6)), 0, 1.45, -0.2);
    mk(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.42), pbr(0x6aa8d0, 0.6)), 0, 1.72, -0.2);   // milk carton on top
  } else if (styleId === 'tux') {
    const b = mk(new THREE.Mesh(G.sph(0.62, 14, 10), bodyM), 0, 0.42, 0); b.scale.set(1.05, 0.55, 1.75);
    const shirt = mk(new THREE.Mesh(G.sph(0.5, 12, 9), accM), 0, 0.4, 0.62); shirt.scale.set(0.7, 0.42, 0.7);   // white bib nose
    mk(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.34), darkM), 0, 0.86, -0.72);         // spoiler
    [-0.28, 0.28].forEach(dx => mk(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), darkM), dx, 0.72, -0.7));
  } else if (styleId === 'royale') {
    const b = mk(new THREE.Mesh(G.sph(0.68, 14, 10), bodyM), 0, 0.5, 0); b.scale.set(1.0, 0.62, 1.6);
    const mane = mk(new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.16, 10, 18), pbr(0xa06a20, 0.7)), 0, 0.52, 0.86); // the mane grille
    for (let i = 0; i < 5; i++) { const spike = mk(new THREE.Mesh(G.cone(0.07, 0.22, 6), pbr(0xffd040, 0.4)), Math.sin((i - 2) * 0.45) * 0.42, 1.0 + Math.cos((i - 2) * 0.45) * 0.12, 0.1); spike.rotation.x = -0.3; }  // crown
  } else if (styleId === 'presidential') {   // 🎩 the long black state car
    mk(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.6, 2.6), bodyM), 0, 0.55, 0);
    mk(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.5, 1.2), bodyM), 0, 1.0, -0.1);
    mk(new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.18, 1.22), pbr(0x3a3f52, 0.3, 0.4)), 0, 0.86, -0.1);   // tinted glass band
    mk(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 2.7), accM), 0, 0.28, 0);                            // gold running trim
    [-1, 1].forEach(d => { const fp = mk(new THREE.Mesh(G.cyl(0.02, 0.02, 0.34, 5), accM), d * 0.5, 1.0, 1.15);  // fender flags
      const fl = mk(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.2), pbr(0xc23a3a, 0.6)), d * 0.5 + 0.02, 1.1, 1.08); });
    mk(new THREE.Mesh(G.sph(0.09, 8, 6), accM), 0, 0.72, 1.32);                                             // hood emblem
  } else {   // the Kitten Bug
    const b = mk(new THREE.Mesh(G.sph(0.66, 14, 10), bodyM), 0, 0.5, 0); b.scale.set(1.0, 0.72, 1.35);
    const rf = mk(new THREE.Mesh(G.sph(0.5, 12, 9), accM), 0, 0.82, -0.05); rf.scale.set(0.85, 0.55, 0.9);
  }
  // shared cat face: eye headlights, nose, whiskers, ears, tail
  const noseZ = styleId === 'truck' ? 1.0 : styleId === 'van' ? 1.02 : 1.0;
  g.userData.eyeMats = [];
  [-1, 1].forEach(d => {
    const eye = mk(new THREE.Mesh(G.sph(0.14, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xffe9a0, emissiveIntensity: 0.7 })), d * 0.32, 0.58, noseZ - 0.08);
    g.userData.eyeMats.push(eye.material);
    mk(new THREE.Mesh(G.sph(0.055, 8, 6), pbr(0x22222a, 0.4)), d * 0.32, 0.6, noseZ + 0.04);   // pupils looking ahead
    for (let w = 0; w < 3; w++) { const wh = mk(new THREE.Mesh(G.cyl(0.012, 0.012, 0.42, 4), pbr(0xf0f0f0, 0.6)), d * 0.5, 0.36 + w * 0.07, noseZ - 0.1); wh.rotation.z = Math.PI / 2 + d * (0.18 - w * 0.18); }
    const ear = mk(new THREE.Mesh(G.cone(0.16, 0.3, 4), bodyM), d * 0.34, styleId === 'van' ? 1.28 : styleId === 'truck' ? 1.2 : 1.02, 0.28);
    mk(new THREE.Mesh(G.cone(0.09, 0.17, 4), pbr(0xe89a9a, 0.8)), d * 0.34, (styleId === 'van' ? 1.28 : styleId === 'truck' ? 1.2 : 1.02), 0.31);
  });
  mk(new THREE.Mesh(G.sph(0.07, 8, 6), pbr(0xe0788a, 0.6)), 0, 0.5, noseZ + 0.02);             // the nose
  const tail = mk(new THREE.Mesh(G.cyl(0.05, 0.07, 0.7, 8), bodyM), 0, 0.62, -1.05); tail.rotation.x = 0.9;   // happy tail aloft
  const tailTip = mk(new THREE.Mesh(G.sph(0.09, 8, 6), accM), 0, 0.88, -1.28);
  g.userData.tail = tail; g.userData.tailTip = tailTip;
  // wheels with paw hubs (front pair steers)
  g.userData.wheels = []; g.userData.frontWheels = [];
  [[-0.62, 0.62], [0.62, 0.62], [-0.62, -0.62], [0.62, -0.62]].forEach(([wx, wz], i) => {
    const wg = new THREE.Group(); wg.position.set(wx, 0.26, wz);
    const tyre = new THREE.Mesh(G.cyl(0.26, 0.26, 0.18, 14), darkM); tyre.rotation.z = Math.PI / 2; tyre.castShadow = true; wg.add(tyre);
    const hub = new THREE.Mesh(G.cyl(0.13, 0.13, 0.2, 10), pbr(0xf0d0dc, 0.5)); hub.rotation.z = Math.PI / 2; wg.add(hub);
    g.add(wg); g.userData.wheels.push(wg);
    if (i < 2) g.userData.frontWheels.push(wg);
  });
  return g;
}

// ── the showroom building in the world ──
function buildCarShow() {
  const { x: cx, z: cz, w, d } = CARSHOW;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), pbr(0xd8d4dc, 0.8)); slab.position.set(cx, 0.15, cz); slab.receiveShadow = true; scene.add(slab);
  const glassM = new THREE.MeshStandardMaterial({ color: 0xaad4e8, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.42 });
  const frameM = pbr(0x3a3a48, 0.6);
  // glass walls + roof
  [[cx, cz - d / 2, w, 0.2], [cx - w / 2, cz, 0.2, d], [cx + w / 2, cz, 0.2, d]].forEach(([bx, bz, bw, bd]) => {
    const gl = new THREE.Mesh(new THREE.BoxGeometry(bw, 3.0, bd), glassM); gl.position.set(bx, 1.8, bz); scene.add(gl);
    worldColliders.push({ type: 'box', x0: bx - bw / 2 - 0.1, x1: bx + bw / 2 + 0.1, z0: bz - bd / 2 - 0.1, z1: bz + bd / 2 + 0.1 });
  });
  // front wall (north, facing the Gray House) with the door gap
  [[cx - w / 4 - 1.1, w / 2 - 2.2], [cx + w / 4 + 1.1, w / 2 - 2.2]].forEach(([bx, bw]) => {
    const gl = new THREE.Mesh(new THREE.BoxGeometry(bw, 3.0, 0.2), glassM); gl.position.set(bx, 1.8, cz + d / 2); scene.add(gl);
    worldColliders.push({ type: 'box', x0: bx - bw / 2 - 0.1, x1: bx + bw / 2 + 0.1, z0: cz + d / 2 - 0.2, z1: cz + d / 2 + 0.2 });
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.6, 0.16), pbr(0xc84a6a, 0.5)); door.position.set(cx, 1.3, cz + d / 2); scene.add(door);
  worldColliders.push({ type: 'box', x0: cx - 1.1, x1: cx + 1.1, z0: cz + d / 2 - 0.2, z1: cz + d / 2 + 0.2 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.4, d + 0.8), pbr(0xc84a6a, 0.7)); roof.position.set(cx, 3.4, cz); roof.castShadow = true; scene.add(roof);
  [[-w / 2 + 0.4, -d / 2 + 0.4], [w / 2 - 0.4, -d / 2 + 0.4], [-w / 2 + 0.4, d / 2 - 0.4], [w / 2 - 0.4, d / 2 - 0.4]].forEach(([dx2, dz2]) => { const p = new THREE.Mesh(G.cyl(0.12, 0.14, 3.2, 8), frameM); p.position.set(cx + dx2, 1.6, cz + dz2); p.castShadow = true; scene.add(p); });
  if (typeof makeTextSign === 'function') {
    const sg = new THREE.Mesh(new THREE.BoxGeometry(7.6, 1.0, 0.14), new THREE.MeshStandardMaterial({ map: makeTextSign('🚗 WHISKER MOTORS', '#7a1a34', '#ffe9c0', 480, 70), roughness: 0.5, emissive: 0x200808, emissiveIntensity: 0.4 }));
    sg.position.set(cx, 4.1, cz + d / 2 - 0.2); scene.add(sg);
  }
  // a display car slowly spinning on the forecourt
  const disp = buildCatCar('tux');
  disp.position.set(cx + 5.4, 0.25, cz + d / 2 + 2.6); disp.scale.setScalar(0.85);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.3, 16), pbr(0xc8c4cc, 0.7)); plinth.position.set(cx + 5.4, 0.15, cz + d / 2 + 2.6); plinth.receiveShadow = true; scene.add(plinth);
  scene.add(disp);
  state._showSpinner = disp;
  worldColliders.push({ type: 'circle', x: cx + 5.4, z: cz + d / 2 + 2.6, r: 1.8 });
  if (typeof makeTextSign === 'function') {   // 💼 WE'RE HIRING — mechanics wanted
    const hs = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 0.1), new THREE.MeshStandardMaterial({ map: makeTextSign('💼 WE\'RE HIRING!', '#2a5a2a', '#d8ffd8', 260, 64), roughness: 0.5, emissive: 0x0a1c0a, emissiveIntensity: 0.4 }));
    hs.position.set(cx - 5.6, 1.5, cz + d / 2 + 0.4); scene.add(hs);
    const post = new THREE.Mesh(G.cyl(0.06, 0.08, 1.2, 6), pbr(0x5a4a3a, 0.85)); post.position.set(cx - 5.6, 0.6, cz + d / 2 + 0.35); scene.add(post);
  }
  buildGarages();
  // little flag bunting
  for (let i = 0; i < 6; i++) { const fl = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 4), pbr([0xd0483a, 0xe8c040, 0x5a9ad0][i % 3], 0.7)); fl.position.set(cx - w / 2 + 1 + i * 2.5, 3.9, cz + d / 2 + 0.3); fl.rotation.x = Math.PI; scene.add(fl); }
  initDriveUI();
}

// ── the showroom interior (its own scene, like the manor) ──
let showScene = null, _showBuilt = false;
const showColliders = [];
const SHOW_W = 7.2, SHOW_D = 4.6;

function buildShowInterior() {
  if (_showBuilt) return;
  _showBuilt = true;
  showScene = new THREE.Scene();
  showScene.background = new THREE.Color(0xe8ecf2);
  const S = showScene;
  S.add(new THREE.AmbientLight(0xffffff, 0.8));
  const spot = new THREE.DirectionalLight(0xfff4e0, 0.8); spot.position.set(3, 9, 4); S.add(spot);
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const B = (w, h, d, mat, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)); me.position.set(x, y, z); return me; };
  const fl = add(new THREE.Mesh(new THREE.PlaneGeometry(SHOW_W * 2 + 1, SHOW_D * 2 + 1), pbr(0xdfe2e8, 0.25, 0.1))); fl.rotation.x = -Math.PI / 2;
  const wallM = pbr(0xf0f0f4, 0.9);
  B(SHOW_W * 2 + 1, 3.6, 0.25, wallM, 0, 1.8, -SHOW_D - 0.35);
  // south side stays OPEN — the showroom greets you, not a wall
  B(0.25, 3.6, SHOW_D * 2 + 1, wallM, -SHOW_W - 0.35, 1.8, 0);
  B(0.25, 3.6, SHOW_D * 2 + 1, wallM, SHOW_W + 0.35, 1.8, 0);
  const ceil = add(new THREE.Mesh(new THREE.PlaneGeometry(SHOW_W * 2 + 1, SHOW_D + 0.6), pbr(0xe8e8ee, 0.95))); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.6, -(SHOW_D + 0.6) / 2 + 0.35);
  showColliders.push(
    { type: 'box', x0: -SHOW_W - 0.7, x1: -SHOW_W - 0.1, z0: -SHOW_D - 1, z1: SHOW_D + 1 },
    { type: 'box', x0: SHOW_W + 0.1, x1: SHOW_W + 0.7, z0: -SHOW_D - 1, z1: SHOW_D + 1 },
    { type: 'box', x0: -SHOW_W - 1, x1: SHOW_W + 1, z0: -SHOW_D - 0.7, z1: -SHOW_D - 0.1 },
    { type: 'box', x0: -SHOW_W - 1, x1: SHOW_W + 1, z0: SHOW_D + 0.1, z1: SHOW_D + 0.7 });
  B(1.8, 0.05, 0.9, pbr(0xc84a6a, 0.7), 0, 0.03, SHOW_D - 0.1);   // a showroom mat marks the way out
  // the five stars of the show
  state._showCars = [];
  const spots = [[-5.4, -2.2], [-2.7, -2.6], [0, -2.8], [2.7, -2.6], [5.4, -2.2]];
  Object.keys(CAR_STYLES).filter(id => id !== 'presidential').forEach((id, i) => {   // the presidential car is EARNED, not sold
    const [px, pz] = spots[i];
    const plinth = add(new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.5, 0.28, 16), pbr(0xc8ccd4, 0.6))); plinth.position.set(px, 0.14, pz);
    const car = buildCatCar(id); car.position.set(px, 0.28, pz); car.scale.setScalar(0.78); car.rotation.y = 0.5; S.add(car);
    state._showCars.push({ id, car, x: px, z: pz });
    const st = CAR_STYLES[id];
    if (typeof makeTextSign === 'function') {
      const sg = add(new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 0.08), new THREE.MeshStandardMaterial({ map: makeTextSign(st.e + ' ' + st.name + ' · ' + st.price + '🪙', '#2a2a3a', '#ffe9c0', 280, 60), roughness: 0.6 })));
      sg.position.set(px, 1.9, pz + 1.25);
    }
    showColliders.push({ type: 'circle', x: px, z: pz, r: 1.5 });
  });
  // Sal the salesperson at her desk
  B(2.4, 0.85, 0.9, pbr(0x8a5a3a, 0.7), 5.0, 0.42, 3.0);
  const sal = buildHuman({ skin: 0xd9a884, hair: 0x3a2418, hairStyle: 'bun', glasses: true, shirt: 0xc84a6a, pants: 0x2a2a3a, height: 1.0, build: 'avg', eye: 0x3a2a1a });
  sal.group.position.set(5.0, 0, 2.1); sal.group.rotation.y = Math.PI; S.add(sal.group);
  state._showSal = { group: sal.group, parts: sal.parts, phase: 1 };
  showColliders.push({ type: 'box', x0: 3.7, x1: 6.3, z0: 2.5, z1: 3.5 });
  if (typeof makeTextSign === 'function') { const banner = add(new THREE.Mesh(new THREE.BoxGeometry(6, 0.7, 0.08), new THREE.MeshStandardMaterial({ map: makeTextSign('🐾 DRIVE HOME A FRIEND 🐾', '#7a1a34', '#ffe9c0', 460, 60), roughness: 0.6 }))); banner.position.set(0, 3.0, -SHOW_D - 0.2); }
}

function enterCarShow() {
  buildShowInterior();
  state.inShow = true;
  showScene.add(catGroup);
  catGroup.position.set(0, 0, SHOW_D - 0.9); catGroup.rotation.y = Math.PI;
  state.camYaw = 0; state.camHeight = 3.6; state.camDist = 4.8;
  camera.position.set(0, state.camHeight, SHOW_D - 0.9 + state.camDist);
  if (typeof sfx === 'function') sfx('door');
  if (!state._seenShow) { state._seenShow = true; showDialogue('🚗 Whisker Motors', 'Welcome in! Every car has ears, a tail, and a heart of gold. Walk up to one you like — Sal will sort the paperwork. 🐾', 6200); }
}
function exitCarShow() {
  state.inShow = false;
  scene.add(catGroup);
  catGroup.position.set(CARSHOW.x, 0, CARSHOW.z + CARSHOW.d / 2 + 1.6); catGroup.rotation.y = 0;
  if (typeof sfx === 'function') sfx('door');
}

// showroom context: buy or choose your ride
function carShowContext(cp) {
  for (const sc of state._showCars || []) {
    if (Math.hypot(cp.x - sc.x, cp.z - sc.z) < 2.5) {
      const st = CAR_STYLES[sc.id];
      const owned = (state.myCars || []).includes(sc.id);
      if (!owned) return { id: 'car:buy', style: sc.id, label: st.e + ' Buy the ' + st.name + ' · ' + st.price + ' 🪙' };
      if (state.activeCar !== sc.id) return { id: 'car:pick', style: sc.id, label: st.e + ' Make the ' + st.name + ' your ride' };
      return { id: 'car:mine', style: sc.id, label: st.e + ' Your trusty ' + st.name + ' 💛' };
    }
  }
  return null;
}

// ── owning & parking ──
let _carMesh = null, _carColl = null;
function parkCarAt(x, z, heading) {
  if (_carMesh) { scene.remove(_carMesh); }
  if (_carColl) { const i = worldColliders.indexOf(_carColl); if (i >= 0) worldColliders.splice(i, 1); _carColl = null; }
  if (!state.activeCar) return;
  _carMesh = buildCatCar(state.activeCar);
  _carMesh.position.set(x, 0, z); _carMesh.rotation.y = heading || 0;
  scene.add(_carMesh);
  _carColl = { type: 'circle', x, z, r: 1.0 };
  worldColliders.push(_carColl);
  state.carPos = { x, z, h: heading || 0 };
}
function carBuy(styleId) {
  const st = CAR_STYLES[styleId];
  if (state.coins < st.price) { showNotif(st.e + ' The ' + st.name + ' is ' + st.price + ' 🪙 — keep saving, it\'ll wait for you!'); if (typeof sfx === 'function') sfx('sad'); return; }
  state.coins -= st.price;
  document.getElementById('coin-count').textContent = state.coins;
  state.myCars = state.myCars || [];
  state.myCars.push(styleId);
  state.activeCar = styleId;
  parkCarAt(CARSHOW.x - 7, CARSHOW.z + CARSHOW.d / 2 + 5.5, Math.PI / 2);   // delivered onto the road, nose toward town
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif(st.e + ' The ' + st.name + ' is YOURS! It\'s parked out front — hop in!');
  if (typeof saveGame === 'function') saveGame();
}
function carPick(styleId) {
  const trunk = state.carTrunk || [];
  state.activeCar = styleId;
  const p = state.carPos || { x: CARSHOW.x - 7, z: CARSHOW.z + CARSHOW.d / 2 + 5.5, h: Math.PI / 2 };
  parkCarAt(p.x, p.z, p.h);
  showNotif(CAR_STYLES[styleId].e + ' The ' + CAR_STYLES[styleId].name + ' pulls up front. ' + (trunk.length ? 'Your things moved over with you.' : ''));
  if (typeof sfx === 'function') sfx('ui');
}

// ── DRIVING ──────────────────────────────────────────────────────────────
const drive = { steer: 0, steerTarget: 0, gas: false, brake: false, v: 0, heading: 0, lastV: 0, puffT: 0 };
const _puffs = [];
function spawnPuff(x, y, z, col, s) {
  if (_puffs.length > 14) return;
  const m = new THREE.Mesh(G.sph(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.5, roughness: 1 }));
  m.position.set(x, y, z); m.scale.setScalar(s || 1);
  scene.add(m);
  _puffs.push({ m, age: 0 });
}
function updatePuffs() {
  for (let i = _puffs.length - 1; i >= 0; i--) {
    const p = _puffs[i];
    p.age += 0.016;
    p.m.position.y += 0.012;
    p.m.scale.multiplyScalar(1.045);
    p.m.material.opacity = 0.5 * (1 - p.age / 0.7);
    if (p.age > 0.7) { scene.remove(p.m); p.m.material.dispose(); _puffs.splice(i, 1); }
  }
}
function carTrunkCap() { return state.activeCar ? CAR_STYLES[state.activeCar].trunk : 0; }

function enterCar() {
  if (!_carMesh) return;
  state.driving = true;
  drive.v = 0; drive.heading = _carMesh.rotation.y; drive.steer = 0; drive.steerTarget = 0; drive.gas = false; drive.brake = false;
  catGroup.visible = false;
  if (_carColl) { const i = worldColliders.indexOf(_carColl); if (i >= 0) worldColliders.splice(i, 1); _carColl = null; }
  document.body.classList.add('driving');
  if (typeof sfx === 'function') sfx('ui');
  showNotif(CAR_STYLES[state.activeCar].e + ' Vrrrm! Wheel on the left, gas & brake on the right. 🐾');
}
function exitCar() {
  if (!state.driving) return;
  if (drive._baseDist !== undefined) { state.camDist = drive._baseDist; drive._baseDist = undefined; }
  _carMesh.rotation.x = 0; _carMesh.position.y = 0;
  state.driving = false;
  document.body.classList.remove('driving');
  parkCarAt(_carMesh.position.x, _carMesh.position.z, drive.heading);
  catGroup.visible = true;
  const side = drive.heading + Math.PI / 2;
  catGroup.position.set(_carMesh.position.x + Math.sin(side) * 1.5, 0, _carMesh.position.z + Math.cos(side) * 1.5);
  if (typeof sfx === 'function') sfx('door');
  if (typeof saveGame === 'function') saveGame();
}

function updateDriving(t) {
  // lazy spawn the saved car once the world is up
  if (state.activeCar && !_carMesh && state.carPos) parkCarAt(state.carPos.x, state.carPos.z, state.carPos.h);
  if (state._showSpinner) state._showSpinner.rotation.y = t * 0.4;
  if (_carMesh && !state.driving && _carMesh.userData.tail) _carMesh.userData.tail.rotation.x = 0.9 + Math.sin(t * 1.4) * 0.1;   // the parked car wags, softly
  updatePuffs();
  if (!state.driving || !_carMesh) return;

  const st = CAR_STYLES[state.activeCar];
  // pedals & keys
  const kGas = drive.gas || state.keys['w'] || state.keys['ArrowUp'];
  const kBrake = drive.brake || state.keys['s'] || state.keys['ArrowDown'];
  const kSteer = (state.keys['a'] || state.keys['ArrowLeft'] ? -1 : 0) + (state.keys['d'] || state.keys['ArrowRight'] ? 1 : 0);
  const steerIn = kSteer !== 0 ? kSteer : drive.steerTarget;
  drive.steer += (steerIn - drive.steer) * 0.16;
  if (kGas) drive.v = Math.min(st.maxV, drive.v + 0.010);
  else if (kBrake) drive.v = Math.max(-st.maxV * 0.4, drive.v - 0.014);
  else drive.v *= 0.965;
  if (Math.abs(drive.v) < 0.002) drive.v = 0;
  // steer turns harder at speed, flips in reverse
  drive.heading -= drive.steer * 0.05 * (drive.v / st.maxV) * (drive.v >= 0 ? 1 : -1) * 1.6;
  let nx = _carMesh.position.x + Math.sin(drive.heading) * drive.v;
  let nz = _carMesh.position.z + Math.cos(drive.heading) * drive.v;
  const hit = collide(nx, nz, worldColliders, 0.6);
  if (Math.hypot(hit.x - nx, hit.z - nz) > 0.01) { drive.v *= 0.4; if (Math.abs(drive.v) > 0.1 && typeof sfx === 'function') sfx('door'); }   // bonk
  nx = hit.x; nz = hit.z;
  nx = Math.max(-258, Math.min(234, nx)); nz = Math.max(-156, Math.min(84, nz));   // the ring highway is yours too
  _carMesh.position.set(nx, 0, nz);
  _carMesh.rotation.y = drive.heading;
  _carMesh.rotation.z = -drive.steer * Math.abs(drive.v) * 0.5;                      // lean into the corner
  // wheels spin, fronts steer, tail streams
  (_carMesh.userData.wheels || []).forEach(w => { w.rotation.x += drive.v * 2.4; });
  (_carMesh.userData.frontWheels || []).forEach(w => { w.rotation.y = -drive.steer * 0.45; });
  if (_carMesh.userData.tail) _carMesh.userData.tail.rotation.x = 0.9 - Math.min(0.6, Math.abs(drive.v) * 1.4);
  // the cat rides along invisibly so every game system follows the car
  catGroup.position.set(nx, 0, nz);
  // chase camera settles behind the car
  let want = drive.heading + Math.PI;
  let dY = want - state.camYaw;
  while (dY > Math.PI) dY -= Math.PI * 2; while (dY < -Math.PI) dY += Math.PI * 2;
  state.camYaw += dY * 0.06;
  // wheel UI visual
  const wheelEl = document.getElementById('wheel');
  if (wheelEl) wheelEl.style.transform = 'rotate(' + (drive.steer * 100) + 'deg)';
  // ── the FEEL: suspension, pitch, exhaust, dust, night lights, speed camera ──
  const dv = drive.v - drive.lastV; drive.lastV = drive.v;
  const spd = Math.abs(drive.v) / st.maxV;
  _carMesh.rotation.x += ((-dv * 5) - _carMesh.rotation.x) * 0.2;                     // nose lifts on throttle, dips on the brakes
  _carMesh.position.y = Math.abs(Math.sin(t * 14)) * 0.012 * spd;                     // suspension patter at speed
  if (_carMesh.userData.tailTip) _carMesh.userData.tailTip.position.z = -1.28 - spd * 0.1;
  drive.puffT -= 0.016;
  if (kGas && spd < 0.92 && drive.puffT <= 0) {                                       // exhaust chuffs while accelerating
    drive.puffT = 0.16;
    const bx2 = nx - Math.sin(drive.heading) * 1.15, bz2 = nz - Math.cos(drive.heading) * 1.15;
    spawnPuff(bx2, 0.28, bz2, 0x9a9aa2, 0.8);
  }
  if (Math.abs(drive.steer) > 0.6 && spd > 0.55 && drive.puffT <= 0) {                // cornering hard kicks up dust
    drive.puffT = 0.12;
    spawnPuff(nx - Math.sin(drive.heading) * 0.8, 0.12, nz - Math.cos(drive.heading) * 0.8, 0xcbb894, 1.1);
  }
  const night = (state.dayTime || 0.5) < 0.24 || (state.dayTime || 0.5) > 0.76;       // headlight eyes glow after dark
  (_carMesh.userData.eyeMats || []).forEach(m2 => { m2.emissiveIntensity += ((night ? 1.9 : 0.7) - m2.emissiveIntensity) * 0.1; });
  if (drive._baseDist === undefined) drive._baseDist = state.camDist;
  state.camDist = drive._baseDist + spd * 2.6;                                        // the camera breathes back at speed
}

// ── the driving controls: wheel left, pedals right ──
let _driveUiBuilt = false;
function initDriveUI() {
  if (_driveUiBuilt) return;
  _driveUiBuilt = true;
  const ui = document.createElement('div');
  ui.id = 'drive-ui';
  ui.innerHTML =
    '<div id="wheel-zone"><div id="wheel"><div class="wheel-spoke s1"></div><div class="wheel-spoke s2"></div><div class="wheel-spoke s3"></div><div class="wheel-spoke s4"></div><div class="wheel-ring"></div><div class="wheel-hub">🐾</div></div></div>' +
    '<div id="pedals">' +
      '<button id="park-btn">🅿️ Park</button>' +
      '<button id="horn-btn">📣</button>' +
      '<button id="pedal-brake">🛑<small>BRAKE</small></button>' +
      '<button id="pedal-gas">⚡<small>GAS</small></button>' +
    '</div>';
  document.body.appendChild(ui);
  const wz = ui.querySelector('#wheel-zone');
  let wheelId = null, wheelX0 = 0;
  const wPos = e => (typeof gamePoint === 'function') ? gamePoint(e.clientX, e.clientY).x : e.clientX;   // rotation-aware: game-x even on a sideways phone
  wz.addEventListener('touchstart', e => { e.preventDefault(); const tch = e.changedTouches[0]; wheelId = tch.identifier; wheelX0 = wPos(tch) - drive.steerTarget * 70; }, { passive: false });
  wz.addEventListener('touchmove', e => { e.preventDefault(); for (const tch of e.changedTouches) if (tch.identifier === wheelId) drive.steerTarget = Math.max(-1, Math.min(1, (wPos(tch) - wheelX0) / 70)); }, { passive: false });
  const wEnd = e => { for (const tch of e.changedTouches) if (tch.identifier === wheelId) { wheelId = null; drive.steerTarget = 0; } };
  wz.addEventListener('touchend', wEnd); wz.addEventListener('touchcancel', wEnd);
  wz.addEventListener('mousedown', e => { wheelId = 'm'; wheelX0 = wPos(e) - drive.steerTarget * 70; });
  window.addEventListener('mousemove', e => { if (wheelId === 'm') drive.steerTarget = Math.max(-1, Math.min(1, (wPos(e) - wheelX0) / 70)); });
  window.addEventListener('mouseup', () => { if (wheelId === 'm') { wheelId = null; drive.steerTarget = 0; } });
  const hold = (id, on, off) => {
    const el = ui.querySelector(id);
    el.addEventListener('touchstart', e => { e.preventDefault(); on(); }, { passive: false });
    el.addEventListener('touchend', e => { e.preventDefault(); off(); });
    el.addEventListener('touchcancel', off);
    el.addEventListener('mousedown', on);
    el.addEventListener('mouseup', off);
    el.addEventListener('mouseleave', off);
  };
  hold('#pedal-gas', () => { drive.gas = true; }, () => { drive.gas = false; });
  hold('#pedal-brake', () => { drive.brake = true; }, () => { drive.brake = false; });
  ui.querySelector('#park-btn').addEventListener('click', () => exitCar());
  ui.querySelector('#horn-btn').addEventListener('click', () => { if (typeof sfx === 'function') sfx('meow'); showNotif('📣 MEEP-MEOW!'); });   // the horn meows, obviously
}

// ── the trunk: your shopping rides in the back ──
function trunkPut() {
  if (!state.carryBag) return;
  state.carTrunk = state.carTrunk || [];
  if (state.carTrunk.length >= carTrunkCap()) { showNotif('🧺 The trunk is full! (' + carTrunkCap() + ' things max in this car)'); if (typeof sfx === 'function') sfx('sad'); return; }
  state.carTrunk.push(state.carryBag);
  const name = (state.carryBag.item && state.carryBag.item.name) || 'bag';
  if (typeof clearCarryBag === 'function') clearCarryBag(); else { state.carryBag = null; if (typeof _bagMesh !== 'undefined' && _bagMesh) _bagMesh.visible = false; }
  if (typeof sfx === 'function') sfx('sell');
  showNotif('🧺 ' + name + ' stowed in the trunk. (' + state.carTrunk.length + '/' + carTrunkCap() + ')');
  if (typeof saveGame === 'function') saveGame();
}
function openTrunk() {
  const tk = state.carTrunk || [];
  if (!tk.length) { showNotif('🧺 The trunk is empty — just a faint smell of catnip.'); return; }
  state.uiOpen = true;
  let h = '<div class="zoo-want">🧺</div><div class="modal-sub" style="font-size:.95rem">' + tk.length + '/' + carTrunkCap() + ' things in the trunk</div>';
  h += '<div class="co-grid" style="grid-template-columns:repeat(' + Math.min(3, tk.length) + ',1fr)">';
  tk.forEach((bag, i) => { const it = bag.item || {}; h += '<button onclick="trunkTake(' + i + ')">' + (it.e || '🛍️') + '<small>' + (it.name || 'bag') + '</small></button>'; });
  h += '</div><button class="modal-close" onclick="closeCheckout()">Close the trunk</button>';
  document.getElementById('checkout-title').textContent = '🧺 The trunk';
  document.getElementById('checkout-body').innerHTML = h;
  document.getElementById('checkout').classList.add('show');
}
function trunkTake(i) {
  const tk = state.carTrunk || [];
  const bag = tk[i]; if (!bag) return;
  if (state.carryBag) { showNotif('🛍️ Your mouth is full — put that down first!'); return; }
  tk.splice(i, 1);
  if (typeof setCarryBag === 'function') setCarryBag(bag.item, bag.from);
  closeCheckout();
  if (typeof sfx === 'function') sfx('ui');
  showNotif('🛍️ ' + ((bag.item && bag.item.name) || 'bag') + ' out of the trunk — in your teeth it goes.');
  if (typeof saveGame === 'function') saveGame();
}

// ── world context: the showroom door, your parked car, the trunk ──
function carContext(cp) {
  if (state.driving) {
    if (state.carryBag && Math.abs(drive.v) < 0.03) return { id: 'car:stow', label: '🧺 Stow the bag in the trunk' };
    if ((state.carTrunk || []).length && Math.abs(drive.v) < 0.03) return { id: 'car:trunk', label: '🧺 Open the trunk' };
    return null;
  }
  if (Math.hypot(cp.x - (CARSHOW.x - 5.6), cp.z - (CARSHOW.z + CARSHOW.d / 2 + 0.6)) < 2.4) return { id: 'car:mech', label: '🔧 Work a mechanic shift' };
  if (Math.hypot(cp.x - CARSHOW.x, cp.z - (CARSHOW.z + CARSHOW.d / 2 + 0.6)) < 2.6) return { id: 'car:enter', label: '🚗 Enter Whisker Motors' };
  const gr = state.activeCar ? nearestGarage(cp, 2.8) : null;
  if (gr && (!_carMesh || Math.hypot(_carMesh.position.x - gr.x, _carMesh.position.z - gr.z) > 7)) return { id: 'car:call', gr, label: '📞 Call your car to this garage' };
  if (_carMesh && Math.hypot(cp.x - _carMesh.position.x, cp.z - _carMesh.position.z) < 2.4) {
    if (state.carryBag) return { id: 'car:stow', label: '🧺 Put the bag in the trunk' };
    return { id: 'car:hopin', label: '🚗 Hop in the ' + CAR_STYLES[state.activeCar].name };
  }
  return null;
}
function carAction(ctx) {
  if (ctx.id === 'car:enter') enterCarShow();
  else if (ctx.id === 'car:buy') carBuy(ctx.style);
  else if (ctx.id === 'car:pick') carPick(ctx.style);
  else if (ctx.id === 'car:mine') { showNotif(CAR_STYLES[ctx.style].e + ' It purrs when you pat the bonnet. Your ride awaits out front!'); if (typeof sfx === 'function') sfx('purr'); }
  else if (ctx.id === 'car:hopin') enterCar();
  else if (ctx.id === 'car:stow') trunkPut();
  else if (ctx.id === 'car:mech') startMinigame({ job: 'mech', hasJob: true, name: 'Sal', bubble: { material: { color: { setHex() {} }, emissive: { setHex() {} } } } });
  else if (ctx.id === 'car:call') {
    parkCarAt(ctx.gr.x, ctx.gr.z + 0.2, ctx.gr.ry);
    if (typeof sfx === 'function') sfx('meow');
    showNotif('📞 MEEP-MEOW! Your ' + CAR_STYLES[state.activeCar].name + ' pulls into the garage by ' + ctx.gr.label + '.');
  }
  else if (ctx.id === 'car:trunk') openTrunk();
}

// ── 🏠 GARAGES: little carports attached to the town's key buildings ──
//    Walk up to any of them and CALL your car over — it's always where you need it.
const GARAGES = [];
function buildGarage(x, z, ry, label) {
  const gg = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 3.2), pbr(0x9a97a0, 0.9)); pad.position.y = 0.06; pad.receiveShadow = true; gg.add(pad);
  [-1.6, 1.6].forEach(dx => { const post = new THREE.Mesh(G.cyl(0.09, 0.11, 2.2, 8), pbr(0x5a5a68, 0.8)); post.position.set(dx, 1.1, -1.3); post.castShadow = true; gg.add(post); });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.14, 2.0), pbr(0xc84a6a, 0.75)); roof.position.set(0, 2.25, -0.7); roof.rotation.x = 0.1; roof.castShadow = true; gg.add(roof);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.08), new THREE.MeshStandardMaterial({ color: 0x3a5a9a, roughness: 0.5, emissive: 0x101c30, emissiveIntensity: 0.5 }));
  sign.position.set(1.6, 2.0, -1.32); gg.add(sign);
  if (typeof makeTextSign === 'function') { const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.02), new THREE.MeshStandardMaterial({ map: makeTextSign('P', '#2a4a8a', '#ffffff', 64, 64), roughness: 0.5 })); p.position.set(1.6, 2.0, -1.27); gg.add(p); }
  gg.position.set(x, 0, z); gg.rotation.y = ry || 0;
  scene.add(gg);
  GARAGES.push({ x, z, ry: ry || 0, label: label || 'garage', group: gg });
  return gg;
}
function buildGarages() {
  buildGarage(-10.5, -5.5, 0, "the Millers' house");                                     // home
  if (typeof GRAY_SPOT !== 'undefined') buildGarage(GRAY_SPOT.x + 16, GRAY_SPOT.z - 8, 0, 'the Gray House');
  if (typeof DC !== 'undefined') buildGarage(DC.gateX + 8, DC.gateZ + 13, 0, 'Dream City');
  if (typeof ZOO !== 'undefined') buildGarage(ZOO.gateX - 6, 9, 0, 'the Town Zoo');
  if (typeof BUSINESS_LOTS !== 'undefined') for (const id in BUSINESS_LOTS) {            // one per business, part of the lot
    const lot = BUSINESS_LOTS[id];
    buildGarage(lot.x + 7.5, lot.z + 2.5, 0, 'your ' + id);
  }
}
function nearestGarage(cp, range) {
  let best = null, bd = range || 2.8;
  GARAGES.forEach(gr => { const d = Math.hypot(cp.x - gr.x, cp.z - gr.z); if (d < bd) { bd = d; best = gr; } });
  return best;
}

// ── 🔧 THE MECHANIC'S BAY: cats bring in broken cat cars — find the fault, fix it ──
const MECH_FAULTS = [
  { id: 'wheel',  e: '🛞', line: '“It goes clonk-clonk and wobbles!”',   fixed: 'New wheel ON — smooth as cream!' },
  { id: 'light',  e: '💡', line: '“I can\'t see a thing at night!”',     fixed: 'Headlight eyes shining bright!' },
  { id: 'engine', e: '💨', line: '“Smoke! There\'s SMOKE everywhere!”',  fixed: 'Engine purring like a kitten!' },
  { id: 'horn',   e: '📣', line: '“My meep-meow won\'t meep…”',          fixed: 'MEEP-MEOW fully restored!' },
  { id: 'tail',   e: '〰️', line: '“The tail just droops. Tragic.”',     fixed: 'Tail wagging happily again!' },
];
const carJobMech = {
  id: 'mech', title: '🔧 Whisker Motors Garage', hint: 'Listen to the cat — tap the BROKEN part!',
  icon: '🔧', verb: 'fixed', noun: ['car', 'cars'], duration: 26, swipe: false,
  failText: 'Not one car fixed…',
  doneLine: c => `${c} ${c === 1 ? 'car' : 'cars'} fixed and purring! Sal is impressed — here's your pay. 🔧`,
  failLine: 'Ah, tricky ones today. Come back for another shift!',
  start(mg) { this.roll(mg); },
  roll(mg) {
    mg.car = {
      col: ['#e888a8', '#e08a30', '#8ac0e8', '#a8d078', '#c8a8e0'][(Math.random() * 5) | 0],
      catCol: ['#f0e0c8', '#8a8a92', '#e0a050', '#4a4a52'][(Math.random() * 4) | 0],
      fault: MECH_FAULTS[(Math.random() * MECH_FAULTS.length) | 0],
      fixedT: 0, wob: Math.random() * 6,
    };
  },
  update(mg, dt) { if (mg.car.fixedT > 0) { mg.car.fixedT += dt; if (mg.car.fixedT > 0.7) this.roll(mg); } },
  parts(mg) {
    const cx = mg.w / 2, cy = mg.h * 0.58;
    return {
      wheel:  { x: cx - 70, y: cy + 46, r: 30 },
      light:  { x: cx + 96, y: cy - 14, r: 26 },
      engine: { x: cx + 40, y: cy - 40, r: 34 },
      horn:   { x: cx - 10, y: cy - 46, r: 24 },
      tail:   { x: cx - 116, y: cy - 30, r: 28 },
    };
  },
  draw(mg) {
    const c = mg.ctx, cx = mg.w / 2, cy = mg.h * 0.58, car = mg.car;
    _dcSky(mg, '#4a4a58', '#2e2e3a');
    c.fillStyle = '#3a3a46'; c.fillRect(0, cy + 60, mg.w, mg.h);                        // garage floor
    c.fillStyle = '#c8922a'; c.fillRect(0, cy + 58, mg.w, 4);
    const P = this.parts(mg), f = car.fault.id, done = car.fixedT > 0;
    // the little car: body, ears, wheels, light, tail
    c.fillStyle = car.col; c.beginPath(); c.ellipse(cx, cy, 110, 46, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(cx + 30, cy - 34, 52, 26, 0, 0, 7); c.fill();              // cab
    [[-38], [38]].forEach(([ex]) => { c.beginPath(); c.moveTo(cx + ex - 12, cy - 48); c.lineTo(cx + ex, cy - 72); c.lineTo(cx + ex + 12, cy - 48); c.fill(); });   // ears
    c.fillStyle = '#2a2a32';
    c.beginPath(); c.arc(cx + 62, cy + 46, 26, 0, 7); c.fill();                          // good wheel
    c.beginPath(); (f === 'wheel' && !done) ? c.ellipse(P.wheel.x, P.wheel.y + 10, 30, 16, 0, 0, 7) : c.arc(P.wheel.x, P.wheel.y, 26, 0, 7); c.fill();   // maybe FLAT
    c.fillStyle = (f === 'light' && !done) ? '#4a4a52' : '#ffe9a0';
    c.beginPath(); c.arc(P.light.x, P.light.y, 14, 0, 7); c.fill();                      // headlight eye
    if (f === 'engine' && !done) { c.fillStyle = 'rgba(120,120,130,.75)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(P.engine.x + Math.sin(mg.timeLeft * 3 + k) * 10, P.engine.y - 18 - k * 16, 10 + k * 3, 0, 7); c.fill(); } }
    _dcEmoji(mg, '📣', P.horn.x, P.horn.y, 22, (f === 'horn' && !done) ? 0.6 : 0);       // the horn (crooked if broken)
    c.strokeStyle = car.col; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - 104, cy - 10);
    if (f === 'tail' && !done) c.quadraticCurveTo(P.tail.x, P.tail.y + 34, P.tail.x - 8, P.tail.y + 44);   // droopy
    else c.quadraticCurveTo(P.tail.x, P.tail.y - 6, P.tail.x - 4, P.tail.y - 16);                          // proud
    c.stroke();
    // the worried cat customer + their complaint
    _dcEmoji(mg, '🐱', mg.w * 0.14, mg.h * 0.22, 34);
    c.fillStyle = '#f6ecd8'; c.font = 'bold 13px Georgia'; c.textAlign = 'left';
    c.fillText(done ? car.fault.fixed : car.fault.line, mg.w * 0.14 + 26, mg.h * 0.22 + 4);
    if (done) _dcEmoji(mg, '✨', cx, cy - 70, 30);
  },
  tap(mg, cx2, cy2) {
    const car = mg.car; if (car.fixedT > 0) return false;
    const P = this.parts(mg);
    let hit = null;
    for (const id in P) { if (Math.hypot(P[id].x - cx2, P[id].y - cy2) < P[id].r + 8) { hit = id; break; } }
    if (!hit) return false;
    if (hit === car.fault.id) { mg.caught++; car.fixedT = 0.01; if (typeof sfx === 'function') sfx('catch'); return true; }
    mgLoseLife(cx2, cy2);                                    // wrong part — the cat yowls
    return false;
  },
};
if (typeof JOBS !== 'undefined') JOBS.mech = carJobMech;
