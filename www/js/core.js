// Paws & Pennies — core: state, scene/camera/renderer, collision, lighting, materials, helpers
// Classic script: shares globals with the others; load order matters (see index.html).

// ─── Game State ───────────────────────────────────────────────────────────────
const state = {
  coins: 0,
  familyHappiness: 0,
  keys: {},
  touching: {},
  catPos: { x: 0, z: 0 },
  catAngle: 0,
  catSpeed: 0,
  run: { stamina: 5, max: 5, rest: 3, cooldown: false },   // sprint: 5s run, 3s rest
  isJumping: false,
  jumpT: 0,
  jumpBaseY: 0,        // the tier height a hop starts from (cat castle)
  catBaseY: 0,         // the surface the cat is currently resting on (0 = ground)
  nearNPC: null,
  giverTarget: null,   // the minigame giver you're standing next to
  shelterGiver: null,  // the play-with-yarn volunteer inside the shelter
  shelterToy: null,
  rats: [],
  npcs: [],
  peds: [],
  commuters: [],      // townsfolk walking the streets between shops
  football: null,     // the kids' street football game
  coins3d: [],
  earned: 0,          // cumulative coins earned (drives story beats)
  goodDeeds: 0,       // kindnesses done for the family & town — builds your reputation, not your wallet
  uiOpen: false,      // a give/rescue overlay is open
  freed: [],          // ids of cats rescued from the shelter
  freedCats: [],      // their little wandering 3D selves
  streetCats: [],     // ambient stray cats roaming the town
  homeFamily: [],     // the Millers gathered inside the home at night
  dayTime: 0.30,      // 0..1 across a day (0=midnight, 0.5=noon)
  isNightMode: false, // tracks the day↔night transition (NPCs go in/out)
  cars: [],           // highway traffic
  needs: { hunger: 100, thirst: 100, energy: 100 },
  context: null,      // current nearby action ('eat'/'drink'/'sleep'/'pet'/'play')
  petTarget: null,
  playTarget: null,
  lastPet: -9999,
  parkMice: 0,        // park catches awaiting reward
  parkBirds: 0,
  parkCritters: [],   // the 3D mice & birds in the park
  bargainOffer: 0,
  bargainHaggles: 0,
  strayMouse: null,    // a loose mouse to catch & bring home
  trashCans: [],       // bins around town you can rummage for food
  job: null,           // your 9-to-5 cashier job (see work.js)
  employers: [],       // shop owners around town hiring a cashier
  dayCount: 0,         // absolute day counter (for job scheduling)
  inWork: null,        // inside your workplace shop (site id) or null
  workOccupants: [],   // ambient shoppers inside the workplace
  workCustomers: [],   // live customers during your shift (help & ring up)
  school: { done: [], cur: null, curDone: 0 },   // 🏫 Town School: courses passed / in progress
  darkMode: false,     // 🌙 comfort lighting (dims the whole game — easier on the eyes)
  civicGiver: null,    // the hospital/school lobby minigame host
  shelterBall: null,   // 🧶 the shelter play ball the cats chase
  homePlayBall: null,  // the ball the Miller kids roll on the floor
  inbox: [],           // 📬 your letters (mayor invites, tasks, job letters…)
  tutorialsSeen: [],   // guided tutorials already shown
  cvJobs: [],          // 📄 your work history (auto-written CV)
  carryBag: null,      // 🛍️ the shopping bag in your mouth {item, from}
  droppedBag: null,    // a bag you set down somewhere in town
  momRequest: null,    // 💭 what Elena needs from the shops
  workOwner: null,     // the shop owner behind the counter of the shop you're in
  workRep: 0,          // 👔 your standing with employers — built up in the boss's check-in chats
  strayTimer: 18,
  carryingMouse: false,
  owned: { decor: [], decorUpper: [], decorShop: [], decorBought: [], homes: [], shop: false, accessories: [] },   // things you've bought (notes 7–9)
  politics: { phase: 'none', homesBuilt: 0, homes: [] },   // the presidency arc: none → eligible → running → president
  biz: { extra: [], workers: [], jobsCreated: 0 },   // businesses owned, workers [{type,biz}], jobs created (note 36)
  gov: { treasury: 0, happiness: 60, corruption: 0, mail: null, spentPublic: 0, spentSelf: 0, jailed: false, jailDays: 0 },   // presidency governance (notes 48–52)
  disgraced: false,   // jailed for corruption — reputation ruined
  disowned: false,    // after jail the Millers shut you out of their home
  seenDisown: false,  // the one-time rejection cutscene has played
  millerGoodwill: 0,  // win them back with good deeds (0 → 100 = forgiven)
  gwBand: 0,          // last goodwill milestone announced (0/1/2/3)
  homeless: false,    // after jail: back at the shelter, must earn a home of your own
  placed: [],         // town-planner pieces you've dropped [{type,x,z,rot}]
  plannerSel: 'house', plannerRot: 0,   // current palette selection + rotation
  streetNames: {},    // renamed streets { main, north, south }
  planning: false,    // SimCity-style top-down build mode is open
  planMove: false,    // build mode is in "move existing structures" sub-mode
  planPaySrc: 'tax',  // President's build-mode payment purse: 'tax' (treasury) or 'coins' — public works never raise corruption
  planDemolish: false,// build mode is in "demolish" sub-mode
  homelessCount: 0,   // townsfolk with no home (rises when you demolish houses)
  rubble: [],         // demolished-building rubble still to be cleaned up [{x,z}]
  planCenter: { x: 0, z: 0 }, planHeight: 74,   // top-down camera focus + zoom height
  structXf: {},       // where you've moved existing town structures { propId: {x,z,rotY} }
  catSitting: null,   // when resting on a bench: { x, z, rotY, y }
  sitTarget: null,    // the bench prop the "Sit" prompt refers to
  bizTill: {},        // takings waiting at each self-run (worker-less) business { id: coins }
  bizOpen: {},        // which worker-less businesses you've opened for trade { id: bool }
  millerHome: null,   // which house the Millers live in (a property id, or null = the poor Miller house)
  currentBoughtHome: null,   // the bought-home property id you're currently inside (transient)
  civics: [],         // public works you've built as President (hospital/school/shelter ids)
  inCivic: null,      // the civic building id you're currently inside (bigger multi-room interior)
  cinematic: false, cineCam: null,   // a camera-cinematic cutscene is driving the camera { px,py,pz, lx,ly,lz }
  townGrowth: { humans: 0, cats: 0 },   // newcomers your businesses & public works have drawn to town (persisted)
  escort: null,       // a kid you're walking to the park & back { kid, phase, ... } (transient)
  bizWorkers: [],   // the 3D worker figures currently shown in the business you're inside
  bizCustomers: [], // shoppers who come in and pay the cashier (in a staffed business)
  editMode: false,      // Sims-style furniture-move mode (inside a decorable room)
  decorXf: {},          // per-decor-item saved transform { id: {x, z, ry} } — Miller home
  decorXfUpper: {},     // …upstairs
  decorXfShop: {},      // …Dad's shop
  decorXfBought: {},    // …the bought home
  fixtureXf: {},        // moved built-in furniture (couch, table, bed, stairs, shop shelves)
  shopTill: 0,          // earnings piling up in Dad's shop till, waiting to be collected
  nearProperty: null,  // a for-sale building the cat is standing by
  dadAtShop: null,     // Dad's working figure once you buy him a shop
  inShop: false, inShelter: false, inBoughtHome: false, inBiz: false, currentBiz: null, nearBizId: null, inJail: false, nearBuilding: null, nearHomeDoor: null,
  shopDad: null, shopPeople: [], shelterCats: [], shelterPeople: [], boughtHomePeople: [], boughtHomeExit: null,
  catName: 'Penny',
  chosenCat: null,
  catCustom: null,    // player's customised look (fur/markings/eyes/nose/collar)
  draftCat: null,     // work-in-progress look in the cat maker
  catMakerMode: null, // 'hero' (intro create-your-own) or 'shelter' (create & free)
  createdCats: [],    // custom cats you designed & freed at the shelter (persisted)
  voiceOn: true,
  family: [],
  camYaw: 0,
  camHeight: 7,
  camDist: 9,
  inHouse: false,
  floor: 'ground',
  nearHouse: false,
  houseFamily: [],
  houseLevel: 0,
  houseFund: 0,
  nearFamily: null,
  giveOpen: false,
  gameStarted: false,
  // ── the rent deadline (Act 3 stakes) ──
  storyAct: 1,
  crickMet: false,
  rentActive: false,
  daysLeft: 16,
  crick: null,
};

// ─── Three.js Setup ───────────────────────────────────────────────────────────
// Phones get a lighter renderer: lower pixel ratio, cheaper shadows — a steady
// frame rate feels far better in the paw than extra resolution ever looks.
const IS_MOBILE = (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) || 'ontouchstart' in window;
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_MOBILE, powerPreference: 'high-performance' });   // MSAA is pricey on phone GPUs
renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1.5 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = IS_MOBILE ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd0f0);
scene.fog = new THREE.Fog(0xa9d4ee, 24, 70);

// Soft image-based lighting from a simple sky gradient (makes PBR materials glow naturally)
function makeSkyEnv() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0.0, '#bfe3ff');   // sky
  grd.addColorStop(0.48, '#e6f2ff');  // horizon haze
  grd.addColorStop(0.52, '#cfe0c8');  // ground glow
  grd.addColorStop(1.0, '#6a7250');
  g.fillStyle = grd; g.fillRect(0, 0, 16, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}
const skyEnv = makeSkyEnv();
scene.environment = skyEnv;

// Separate scene for the Miller house interior (entered through the door)
const houseScene = new THREE.Scene();
houseScene.background = new THREE.Color(0x241f1a);
houseScene.environment = skyEnv;
// Enterable buildings (note: shop & shelter interiors)
const shopScene = new THREE.Scene();
shopScene.background = new THREE.Color(0x2a2622); shopScene.environment = skyEnv;
const shelterScene = new THREE.Scene();
shelterScene.background = new THREE.Color(0x24262c); shelterScene.environment = skyEnv;
const boughtHomeScene = new THREE.Scene();
boughtHomeScene.background = new THREE.Color(0x282420); boughtHomeScene.environment = skyEnv;
const bizScene = new THREE.Scene();   // shared interior for your businesses (café, bakery, market, factory)
bizScene.background = new THREE.Color(0x2a2622); bizScene.environment = skyEnv;
const jailScene = new THREE.Scene();  // the prison cell you serve time in if you turn corrupt
jailScene.background = new THREE.Color(0x14171c); jailScene.environment = skyEnv;
let interiorDrip = null;
let interior = null;
let exterior = null;
let groundGroup = null, upstairsGroup = null, upstairs = null, poorHouse = null;

// ─── Collision ──────────────────────────────────────────────────────────────────
// Each obstacle is a circle {type:'circle',x,z,r} or an axis-aligned box
// {type:'box',x0,x1,z0,z1}; an optional `min` gates it to a house level.
const worldColliders = [], groundColliders = [], upstairsColliders = [], shopColliders = [], shelterColliders = [], boughtHomeColliders = [], bizColliders = [], jailColliders = [];
function activeColliders() {
  if (state.inHouse) return state.floor === 'upper' ? upstairsColliders : groundColliders;
  if (state.inShop) return shopColliders;
  if (state.inShelter) return shelterColliders;
  if (state.inBoughtHome) return boughtHomeColliders;
  if (state.inBiz) return bizColliders;
  if (state.inWork) return bizColliders;   // workplace shop reuses the business interior + its colliders
  if (state.inJail) return jailColliders;
  return worldColliders;
}
// Push a circle (the cat) out of every obstacle it overlaps
function collide(px, pz, cols, r) {
  for (const c of cols) {
    if (c.min != null && state.houseLevel < c.min) continue;
    if (c.type === 'circle') {
      const dx = px - c.x, dz = pz - c.z, d = Math.hypot(dx, dz), rr = c.r + r;
      if (d < rr) { if (d > 1e-4) { px = c.x + dx / d * rr; pz = c.z + dz / d * rr; } else px = c.x + rr; }
    } else {
      if (px > c.x0 && px < c.x1 && pz > c.z0 && pz < c.z1) {        // inside → eject the nearest face
        const dl = px - c.x0, dr = c.x1 - px, dn = pz - c.z0, df = c.z1 - pz, mn = Math.min(dl, dr, dn, df);
        if (mn === dl) px = c.x0 - r; else if (mn === dr) px = c.x1 + r; else if (mn === dn) pz = c.z0 - r; else pz = c.z1 + r;
      } else {                                                       // outside → push off the nearest edge
        const nx = Math.max(c.x0, Math.min(px, c.x1)), nz = Math.max(c.z0, Math.min(pz, c.z1));
        const dx = px - nx, dz = pz - nz, d = Math.hypot(dx, dz);
        if (d < r && d > 1e-4) { px = nx + dx / d * r; pz = nz + dz / d * r; }
      }
    }
  }
  return { x: px, z: pz };
}

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 100);
camera.position.set(0, 6, 10);
camera.lookAt(0, 0, 0);

// ─── Force-landscape ────────────────────────────────────────────────────────────
// On a portrait phone the WHOLE game is rotated 90° with CSS, so it's instantly
// playable held sideways — no "please rotate your phone" nag screen. All input
// code converts physical touch points into game space through gamePoint().
function gameRotated() { return window.innerHeight > window.innerWidth && window.innerWidth <= 820; }
function viewW() { return gameRotated() ? window.innerHeight : window.innerWidth; }
function viewH() { return gameRotated() ? window.innerWidth : window.innerHeight; }
// physical (clientX, clientY) → game-space point (identity when not rotated)
function gamePoint(cx, cy) {
  return gameRotated() ? { x: cy, y: window.innerWidth - cx } : { x: cx, y: cy };
}
// element-relative point in game space (getBoundingClientRect is physical — remap it)
function gameRelPoint(el, cx, cy) {
  const r = el.getBoundingClientRect();
  const p = gamePoint(cx, cy);
  const left = gameRotated() ? r.top : r.left;
  const top  = gameRotated() ? window.innerWidth - r.right : r.top;
  return { x: p.x - left, y: p.y - top };
}

function resize() {
  const rot = gameRotated();
  const w = viewW(), h = viewH();
  const b = document.body;
  if (rot) {
    b.style.transform = 'rotate(90deg)';
    b.style.transformOrigin = 'left top';
    b.style.position = 'fixed';
    b.style.top = '0';
    b.style.left = window.innerWidth + 'px';
  } else {
    b.style.transform = ''; b.style.position = ''; b.style.top = ''; b.style.left = '';
  }
  // body always carries explicit game dims — fixed UI anchors to it in both modes
  b.style.width = w + 'px';
  b.style.height = h + 'px';
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resize();
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 60));

// ── No page zoom, ever. iOS Safari IGNORES user-scalable=no, so block it at the
//    event level: Safari's pinch gestures, two-finger touch zoom, and double-tap. ──
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev =>
  document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });

// ─── Lighting ─────────────────────────────────────────────────────────────────
const sun = new THREE.DirectionalLight(0xfff4e0, 2.6);
sun.position.set(12, 22, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(IS_MOBILE ? 1024 : 2048, IS_MOBILE ? 1024 : 2048);   // phones: half-size shadow map, double the headroom
sun.shadow.camera.near = 0.1;
sun.shadow.camera.far = 140;
sun.shadow.camera.left = -58;
sun.shadow.camera.right = 58;
sun.shadow.camera.top = 58;
sun.shadow.camera.bottom = -58;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun);
const ambient = new THREE.AmbientLight(0x6f86b0, 0.25);
scene.add(ambient);
const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x4a5a30, 0.45);
scene.add(hemi);

// ─── Materials ────────────────────────────────────────────────────────────────
const mat = {
  ground:    new THREE.MeshStandardMaterial({ color: 0x4f7a32, roughness: 1.0, metalness: 0 }),
  road:      new THREE.MeshStandardMaterial({ color: 0x4a4a52, roughness: 0.95, metalness: 0 }),
  sidewalk:  new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.9, metalness: 0 }),
  catBody:   new THREE.MeshStandardMaterial({ color: 0xe8c878, roughness: 0.85, metalness: 0 }),
  catDark:   new THREE.MeshStandardMaterial({ color: 0xb88838, roughness: 0.85, metalness: 0 }),
  catNose:   new THREE.MeshStandardMaterial({ color: 0xe0788a, roughness: 0.6, metalness: 0 }),
  catInner:  new THREE.MeshStandardMaterial({ color: 0xe89a9a, roughness: 0.9, metalness: 0 }),
  catEye:    new THREE.MeshStandardMaterial({ color: 0x7cc46a, roughness: 0.25, metalness: 0.1 }),
  catPupil:  new THREE.MeshStandardMaterial({ color: 0x101014, roughness: 0.2, metalness: 0 }),
  catWhite:  new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.85, metalness: 0 }),
  catMarkA:  new THREE.MeshStandardMaterial({ color: 0xb88838, roughness: 0.85, metalness: 0 }),
  catMarkB:  new THREE.MeshStandardMaterial({ color: 0x3a3530, roughness: 0.85, metalness: 0 }),
  ratBody:   new THREE.MeshStandardMaterial({ color: 0x6f6a60, roughness: 0.9, metalness: 0 }),
  ratTail:   new THREE.MeshStandardMaterial({ color: 0xc8a89a, roughness: 0.8, metalness: 0 }),
  house1:    new THREE.MeshStandardMaterial({ color: 0xcaa06a, roughness: 0.9, metalness: 0 }),
  house2:    new THREE.MeshStandardMaterial({ color: 0x8e9ab0, roughness: 0.9, metalness: 0 }),
  roofRed:   new THREE.MeshStandardMaterial({ color: 0xa83a32, roughness: 0.8, metalness: 0 }),
  roofBlue:  new THREE.MeshStandardMaterial({ color: 0x3a5aa8, roughness: 0.8, metalness: 0 }),
  door:      new THREE.MeshStandardMaterial({ color: 0x6b3a1f, roughness: 0.7, metalness: 0 }),
  window:    new THREE.MeshStandardMaterial({ color: 0xbfe0ff, roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.45 }),
  npcSkin:   new THREE.MeshStandardMaterial({ color: 0xe2b48c, roughness: 0.7, metalness: 0 }),
  npcHair:   new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.9, metalness: 0 }),
  npcShirt:  [
    new THREE.MeshStandardMaterial({ color: 0x5878c8, roughness: 0.85, metalness: 0 }),
    new THREE.MeshStandardMaterial({ color: 0xc85858, roughness: 0.85, metalness: 0 }),
    new THREE.MeshStandardMaterial({ color: 0x589858, roughness: 0.85, metalness: 0 }),
  ],
  npcPants:  new THREE.MeshStandardMaterial({ color: 0x3a3a52, roughness: 0.85, metalness: 0 }),
  npcShoe:   new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.6, metalness: 0 }),
  coin:      new THREE.MeshStandardMaterial({ color: 0xf0c020, roughness: 0.3, metalness: 0.9, emissive: 0x4a3300, emissiveIntensity: 0.4 }),
  tree:      new THREE.MeshStandardMaterial({ color: 0x2f7a26, roughness: 0.95, metalness: 0 }),
  treeDark:  new THREE.MeshStandardMaterial({ color: 0x256a1e, roughness: 0.95, metalness: 0 }),
  treeTrunk: new THREE.MeshStandardMaterial({ color: 0x6b4a26, roughness: 0.95, metalness: 0 }),
  poorHouse: new THREE.MeshStandardMaterial({ color: 0x8a7560, roughness: 0.95, metalness: 0 }),
  fence:     new THREE.MeshStandardMaterial({ color: 0xb89a6a, roughness: 0.9, metalness: 0 }),
  brick:     new THREE.MeshStandardMaterial({ color: 0x9a5a44, roughness: 0.95, metalness: 0 }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function box(w, h, d, mat, x=0, y=0, z=0, rx=0, ry=0, rz=0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
function cone(r, h, seg, mat, x=0, y=0, z=0, ry=0) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = true;
  scene.add(m);
  return m;
}
function cylinder(rt, rb, h, seg, mat, x=0, y=0, z=0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  scene.add(m);
  return m;
}
function sphere(r, mat, x=0, y=0, z=0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  scene.add(m);
  return m;
}
