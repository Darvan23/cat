// business.js — the money economy (note 36): businesses, hiring workers & salaries,
// a daily income/wages tick, government seizure if you can't pay, and a reputation dashboard.

const WORKER_SALARY = 1300;   // paid to each worker, every day
const BUSINESSES = [
  { id: 'shop',    name: "Dad's General Store", icon: '🏪', price: 0,      income: 10000 },  // yours once you buy the shop in town
  { id: 'cafe',    name: 'Cosy Café',           icon: '☕', price: 40000,  income: 13000 },
  { id: 'bakery',  name: 'Bakery',              icon: '🥐', price: 75000,  income: 18000 },
  { id: 'market',  name: 'Grocery Market',      icon: '🏬', price: 120000, income: 26000 },
  { id: 'factory', name: 'Factory',             icon: '🏭', price: 200000, income: 40000 },
];
function bizDef(id) { return BUSINESSES.find(b => b.id === id); }
function ownsBusiness(id) { return id === 'shop' ? !!state.owned.shop : (state.biz.extra || []).includes(id); }
function ownedBusinessIds() { return BUSINESSES.filter(b => ownsBusiness(b.id)).map(b => b.id); }
function hasAnyBusiness() { return ownedBusinessIds().length > 0; }
// A business only earns passive daily income once it has staff to run it.
// With no workers you have to run it yourself (open it & be there — see the till in game.js).
function bizIsStaffed(id) { return workersFor(id).length > 0; }
const FACTORY_MIN_WORKERS = 10;   // a production line needs a full crew — below this the factory makes NOTHING
function bizProducing(id) { return bizIsStaffed(id) && (id !== 'factory' || workersFor('factory').length >= FACTORY_MIN_WORKERS); }
function dailyIncome() { return ownedBusinessIds().filter(bizProducing).reduce((s, id) => s + bizDef(id).income, 0); }
function workerList() { return state.biz.workers || (state.biz.workers = []); }
function workerCount() { return workerList().length; }
function workersFor(id) { return workerList().filter(w => w.biz === id); }
function dailySalaries() { return workerCount() * WORKER_SALARY; }
function dailyNet() { return dailyIncome() - dailySalaries(); }
function fmtCoins(n) { return Math.round(n).toLocaleString('en-US'); }

// ── Town employment: you can only employ townsfolk who exist (and aren't already hired) ──
function jobStats() {
  const pop = (typeof townPopulation === 'function') ? townPopulation() : { humans: 0, cats: 1 };
  const civicJ = (typeof civicJobs === 'function') ? civicJobs() : 0;   // people employed by public works
  const bizH = workerList().filter(w => w.type === 'human').length;
  const bizC = workerList().filter(w => w.type === 'cat').length;
  const humansAvail = Math.max(0, pop.humans);        // total human workforce
  const catsAvail = Math.max(0, pop.cats - 1);        // cats in town (minus you)
  const emplH = Math.min(humansAvail, bizH + civicJ); // employed = your staff + public-works jobs
  const emplC = Math.min(catsAvail, bizC);
  return { humansAvail, catsAvail, hiredH: emplH, hiredC: emplC, openH: Math.max(0, humansAvail - emplH), openC: Math.max(0, catsAvail - emplC) };
}

function buyBusiness(id) {
  const b = bizDef(id); if (!b || ownsBusiness(id)) return;
  if (id === 'shop') { showNotif('Buy Dad\'s shop from its "For Sale" sign in town first'); return; }
  // running a company takes know-how: study Business at the 🏫 Town School first (Dad's shop is the exception — it's family)
  if (typeof schoolHas === 'function' && !schoolHas('business')) { showNotif('📊 You need a Business Degree from the 🏫 Town School before buying a business.'); return; }
  payChoice(b.price, 'Buy the ' + b.name, () => completeBuyBusiness(id));   // tax-or-own-money if President
}
function completeBuyBusiness(id) {
  const b = bizDef(id);
  (state.biz.extra = state.biz.extra || []).push(id);
  buildBusinessBuilding(id);   // a real building appears in town
  if (typeof attractNewcomers === 'function') attractNewcomers(3, 1);   // a new business draws newcomers looking for work
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif('💼 Bought the ' + b.name + '! Newcomers are arriving looking for work — go visit & hire staff');
  if (typeof addGoodwill === 'function') addGoodwill(30, 'You built up the family with a ' + b.name);   // providing for the Millers wins them back
  renderBusiness(); if (typeof saveGame === 'function') saveGame();
}
// Hire a worker (human or cat) to work at a specific business
function hireWorkerFor(bizId, type) {
  if (!ownsBusiness(bizId)) { showNotif('You don\'t own that business yet'); return; }
  const js = jobStats();   // can't employ more townsfolk than exist & are out of work
  if (type === 'cat' && js.openC <= 0) { showNotif('🐱 No cats in town are free to work — rescue more cats first'); return; }
  if (type !== 'cat' && js.openH <= 0) { showNotif('🧑 Nobody left looking for work — build homes to grow the population'); return; }
  const nw = { type: type === 'cat' ? 'cat' : 'human', biz: bizId, hiredDay: state.dayCount || 0 };
  if (typeof dressWorkerCV === 'function') dressWorkerCV(nw);   // give them a name & a little résumé
  workerList().push(nw);
  state.biz.jobsCreated = (state.biz.jobsCreated || 0) + 1;
  if (typeof sfx === 'function') sfx('coin');
  showNotif((type === 'cat' ? '🐱 ' : '🧑 ') + (nw.name || 'Someone') + ' hired at the ' + bizDef(bizId).name + '! (wage ' + WORKER_SALARY + '/day)');
  refreshWorkersInView(bizId);   // show them right away if you're inside
  renderBusiness(); if (typeof saveGame === 'function') saveGame();
}
function fireWorkerFrom(bizId) {
  const list = workerList();
  const i = list.map(w => w.biz).lastIndexOf(bizId);
  if (i < 0) return;
  list.splice(i, 1);
  refreshWorkersInView(bizId);
  renderBusiness(); if (typeof saveGame === 'function') saveGame();
}
function refreshWorkersInView(bizId) {
  if (state.inBiz && state.currentBiz === bizId) { spawnBizWorkers(bizId); spawnBizCustomers(); }   // hiring/firing changes staff & whether customers come
  else if (state.inShop && bizId === 'shop') spawnShopWorkers();
  if (typeof updateBizSigns === 'function') updateBizSigns();   // OPEN/CLOSED plaque follows staffing
}
// Can't make payroll → the government seizes a business (extras first, the shop last resort)
function seizeBusiness() {
  const extra = state.biz.extra || [];
  let lostId = null;
  if (extra.length) {
    lostId = extra.pop();
    if (bizBuildings[lostId]) { scene.remove(bizBuildings[lostId]); delete bizBuildings[lostId]; }
    showNotif('🏛️ You couldn\'t pay wages — the government seized your ' + bizDef(lostId).name + '!');
  } else if (state.owned.shop) {
    lostId = 'shop';
    state.owned.shop = false;
    if (typeof PROP_SIGNS !== 'undefined' && PROP_SIGNS.shop) PROP_SIGNS.shop.visible = true;   // back up for sale
    if (typeof applyFamilyPresence === 'function') applyFamilyPresence();
    showNotif('🏛️ You couldn\'t pay wages — the government seized Dad\'s shop!');
  }
  if (lostId) state.biz.workers = workerList().filter(w => w.biz !== lostId);   // its workers lose their jobs
}
// Runs once each new day (from updateDayNight)
function processBusinessDay() {
  if (!hasAnyBusiness()) return;
  const net = dailyNet();
  state.coins = Math.round(state.coins + net);
  let seized = false;
  if (state.coins < 0) { state.coins = 0; seizeBusiness(); seized = true; }
  document.getElementById('coin-count').textContent = state.coins;
  if (!seized) showNotif(net >= 0 ? ('💼 A day\'s takings: +' + fmtCoins(net) + ' 🪙') : ('💼 Wages cost you ' + fmtCoins(-net) + ' 🪙'));
  if (typeof saveGame === 'function') saveGame();
}

// ── Reputation, from your good deeds ──
function housesBuiltCount() { return ((state.politics && state.politics.homes) ? state.politics.homes.length : 0) + ((state.owned.homes || []).length) + ((state.placed || []).filter(p => p.type === 'house').length); }
function catsFreedCount() { return (state.freed || []).length; }
function reputation() {
  if (state.disgraced) return { label: 'Disgraced 😾 (jailed for corruption)', cls: 'bad' };
  const corr = (state.gov && state.gov.corruption) || 0;   // pocketing tax money shows up here before it ever reaches jail
  if (corr >= 55) return { label: 'Corrupt 🦹 (the town is onto you)', cls: 'bad' };
  if (corr >= 25) return { label: 'Shady 😼 (whispers of corruption)', cls: 'neutral' };
  const score = (state.biz.jobsCreated || 0) + catsFreedCount() * 3 + housesBuiltCount() * 4 + (state.workRep || 0)
              + (state.goodDeeds || 0) * 2;   // 👔 boss chats count — and so does every kindness for the family
  if (score >= 45) return { label: 'Beloved 😻', cls: 'good' };
  if (score >= 15) return { label: 'Respected 🙂', cls: 'good' };
  if (score >= 1)  return { label: 'Known 😐', cls: 'neutral' };
  return { label: 'Just a little cat 🐾', cls: 'neutral' };
}

// ── Dashboard ──
function openBusiness() {
  if (typeof sfx === 'function') sfx('ui');
  if (!state.gameStarted) return;
  state.uiOpen = true; renderBusiness();
  document.getElementById('business').classList.add('show');
  if (typeof showTutorial === 'function' && hasAnyBusiness()) showTutorial('hiring', [   // 🎓 first look at your empire
    { text: '📊 <b>Your business dashboard.</b> Up top: your 📄 CV (it writes itself). Below: the town\'s employment and every business you can own.', glow: null },
    { text: '👥 On a business you OWN, tap <b>＋🧑 Hire</b> or <b>＋🐱 Hire</b>. The FIRST hire becomes the cashier — then it earns daily income without you.', glow: null },
    { text: '⚠️ Every worker costs <b>1300 🪙/day</b>. If you can\'t pay wages, the government seizes a business! Hire what your income can carry.', glow: null },
    { text: '📄 Scroll down to meet your staff — every hire has a <b>name and a CV</b>. Tap a name to read it. 🐾', glow: null },
  ]);
}
function closeBusiness() { state.uiOpen = false; document.getElementById('business').classList.remove('show'); }
function renderBusiness() {
  const body = document.getElementById('business-body');
  if (!body) return;
  const rep = reputation();
  let h = '';
  if (typeof renderMyCV === 'function') h += renderMyCV();   // 📄 your auto-written CV, right up top
  h += `<div class="biz-rep ${rep.cls}">Reputation: <b>${rep.label}</b></div>`;
  h += `<div class="biz-stats">`;
  h += `<div>🧑‍💼 Jobs created<br><b>${state.biz.jobsCreated || 0}</b></div>`;
  h += `<div>🐱 Cats freed<br><b>${catsFreedCount()}</b></div>`;
  h += `<div>🏠 Homes built<br><b>${housesBuiltCount()}</b></div>`;
  h += `<div>❤️ Good deeds<br><b>${state.goodDeeds || 0}</b></div>`;
  h += `<div>🏚️ Homeless<br><b>${state.homelessCount || 0}</b></div>`;
  h += `</div>`;
  if ((state.homelessCount || 0) > 0) h += `<div class="biz-note">🏚️ ${state.homelessCount} townsfolk are homeless after demolitions. Build homes (🏗️ planner) to take them in — the town won't grow again until everyone's housed.</div>`;
  // ── Town employment meters (employed vs looking for work) ──
  const js = jobStats();
  const jobRow = (icon, verb, hired, total) => {
    const open = Math.max(0, total - hired), pct = total > 0 ? Math.round(hired / total * 100) : 0;
    return `<div class="job-row"><div class="job-head">${icon} <b>${hired}</b> ${verb} · <b>${open}</b> looking for work <span class="job-pct">(${pct}% employed)</span></div>` +
      `<div class="job-bar"><div class="job-fill" style="width:${pct}%"></div></div></div>`;
  };
  h += `<div class="biz-jobs"><div class="jobs-title">🧑‍🏭 Town employment</div>` +
    jobRow('🧑', 'working', js.hiredH, js.humansAvail) + jobRow('🐱', 'working', js.hiredC, js.catsAvail) +
    `<div class="jobs-note">You can only hire townsfolk who exist and are out of work — build homes to grow the workforce, rescue cats for more paws.</div></div>`;
  h += `<div class="biz-wallet">🪙 Coins: <b>${fmtCoins(state.coins)}</b></div>`;
  if (hasAnyBusiness()) {
    h += `<div class="biz-econ">Every day: <span class="pos">+${fmtCoins(dailyIncome())}</span> income &nbsp;·&nbsp; <span class="neg">−${fmtCoins(dailySalaries())}</span> wages &nbsp;·&nbsp; net <b class="${dailyNet() >= 0 ? 'pos' : 'neg'}">${dailyNet() >= 0 ? '+' : ''}${fmtCoins(dailyNet())}</b></div>`;
    h += `<div class="biz-note">👥 ${workerCount()} staff · ${WORKER_SALARY}/day each. A business with <b>no staff earns nothing on its own</b> — go inside, tap 🔓 Open and run the till yourself. Hire someone and the <b>first hire becomes the cashier</b>, so it runs (and pays daily income) without you.</div>`;
  if (typeof ownsBusiness === 'function' && ownsBusiness('factory') && workersFor('factory').length < FACTORY_MIN_WORKERS)
    h += `<div class="biz-note">🏭 <b>The factory needs at least ${FACTORY_MIN_WORKERS} workers</b> to run its production line — you have ${workersFor('factory').length}. Until it's fully crewed it produces (and earns) <b>nothing</b>, and it can't be run by paw.</div>`;
  } else {
    h += `<div class="biz-econ">Buy Dad's shop from its "For Sale" sign in town to start your first business, then grow your empire here.</div>`;
  }
  h += `<div class="biz-list">`;
  BUSINESSES.forEach(b => {
    const owned = ownsBusiness(b.id);
    h += `<div class="biz-card ${owned ? 'owned' : ''}"><div class="biz-ic">${b.icon}</div><div class="biz-nm">${b.name}<br><small>+${fmtCoins(b.income)}/day</small></div>`;
    if (owned) {
      const w = workersFor(b.id);
      if (w.length === 0) h += `<div class="biz-staff" title="No staff — go run it yourself">👤 Self-run</div>`;
      else { const cats = w.filter(x => x.type === 'cat').length, humans = w.length - cats; h += `<div class="biz-staff">🧑 ${humans} 🐱 ${cats}</div>`; }
    } else if (b.id === 'shop') h += `<div class="biz-own">Buy in town</div>`;
    else h += `<button class="biz-buy" onclick="buyBusiness('${b.id}')">${fmtCoins(b.price)} 🪙</button>`;
    h += `</div>`;
    if (owned) h += `<div class="biz-hire"><button onclick="hireWorkerFor('${b.id}','human')">＋🧑 Hire</button><button onclick="hireWorkerFor('${b.id}','cat')">＋🐱 Hire</button><button onclick="fireWorkerFrom('${b.id}')">－ Lay off</button></div>`;
  });
  h += `</div>`;
  if (typeof renderStaffCVs === 'function') h += renderStaffCVs();   // 👥 every hire has a name & a CV
  body.innerHTML = h;
}

// ─── Real business buildings in town (visible & enterable) ───────────────────────
const BUSINESS_LOTS = {
  cafe:    { x: -40, z: -46 },
  bakery:  { x: -18, z: -46 },
  market:  { x: 6,   z: -46 },
  factory: { x: 32,  z: -46 },
};
const BIZ_WALL_COL = { cafe: 0x8a5a3a, bakery: 0xd8a860, market: 0x5a8a6a, factory: 0x8a8f99 };
const bizBuildings = {};
function buildBusinessBuilding(id) {
  if (bizBuildings[id]) return;
  const lot = BUSINESS_LOTS[id], def = bizDef(id);
  if (!lot || !def) return;
  const g = new THREE.Group();
  const add = m => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  add(new THREE.Mesh(new THREE.BoxGeometry(7, 4, 6), new THREE.MeshStandardMaterial({ color: BIZ_WALL_COL[id] || 0x9a7a5a, roughness: 0.9 }))).position.y = 2;
  const roof = add(new THREE.Mesh(new THREE.ConeGeometry(5.2, 2, 4), new THREE.MeshStandardMaterial({ color: 0x4a3226, roughness: 0.8 }))); roof.position.y = 5; roof.rotation.y = Math.PI / 4;
  add(new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.2), mat.door)).position.set(0, 1.2, 3.02);            // door faces +z (toward town)
  [-2.2, 2.2].forEach(wx => add(new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 0.15), mat.window)).position.set(wx, 1.9, 3.02));
  const tex = makeTextSign(def.icon + ' ' + def.name.toUpperCase(), '#2a2a2a', '#f0e0b0', 340, 60);
  add(new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.7, 0.15), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }))).position.set(0, 3.3, 3.06);
  // OPEN / CLOSED plaque by the door — OPEN when staffed, CLOSED when it's self-run (needs you)
  const statusMat = new THREE.MeshStandardMaterial({ map: makeTextSign('CLOSED', '#b83030', '#ffffff', 220, 100), roughness: 0.5 });
  add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.44, 0.06), statusMat)).position.set(1.9, 1.9, 3.06);
  g.position.set(lot.x, 0, lot.z); scene.add(g);
  bizBuildings[id] = g;
  bizSigns[id] = { mat: statusMat, open: makeTextSign('OPEN', '#2a8a3a', '#ffffff', 200, 100), closed: makeTextSign('CLOSED', '#b83030', '#ffffff', 220, 100), was: null };
  const coll = { type: 'box', x0: lot.x - 3.5, x1: lot.x + 3.5, z0: lot.z - 3, z1: lot.z + 2.2 };
  worldColliders.push(coll);
  if (typeof addProp === 'function') addProp({ kind: 'biz_' + id, group: g, x: lot.x, z: lot.z, rotY: 0, coll, hw: 3.5, hd: 2.6, movable: true,
    onMove: (nx, nz) => { lot.x = nx; lot.z = nz; } });   // enter prompt, exit spot & map markers all read the lot
}
const bizSigns = {};
function updateBizSigns() {
  for (const id in bizSigns) {
    const s = bizSigns[id], open = bizProducing(id);   // the factory only reads OPEN with a full crew
    if (open === s.was) continue;
    s.was = open; s.mat.map = open ? s.open : s.closed; s.mat.needsUpdate = true;
  }
}
function buildOwnedBusinessBuildings() { Object.keys(BUSINESS_LOTS).forEach(id => { if (ownsBusiness(id)) buildBusinessBuilding(id); }); updateBizSigns(); }

// ─── Enter / leave a business (shared bizScene, rebuilt per business) ─────────────
function enterBusiness(id) {
  if (!ownsBusiness(id)) return;
  state.inBiz = true; state.currentBiz = id; state.inCivic = null;
  if (bizScene.background) bizScene.background.set(0x2a2622);   // businesses use the original warm-dark backdrop
  buildBizInterior(id);
  spawnBizCustomers();   // shoppers who'll come pay the cashier (if it's staffed)
  spawnBizOccupants(id); // ambient life: café sitters, bakery/market shoppers, factory hands
  bizScene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_IN);
  catGroup.position.set(0, 0, 4); catGroup.rotation.y = Math.PI;
  state.camYaw = 0; state.camHeight = 8; state.camDist = 6.5;
  camera.position.set(0, state.camHeight, 4 + state.camDist);
  document.getElementById('minimap').style.display = 'none';
  const w = workersFor(id).length;
  showDialogue(bizDef(id).icon + ' ' + bizDef(id).name, w ? ('Your ' + w + ' staff are hard at work — business is booming!') : ('No staff yet — go to the register, tap 🔓 Open and run it yourself to fill the till. Hire someone (📊) and they\'ll run it for you.'), 5200);
}
function exitBusiness() {
  const civic = (typeof CIVIC_LOTS !== 'undefined' && CIVIC_LOTS[state.currentBiz]);
  const lot = BUSINESS_LOTS[state.currentBiz] || civic || { x: 0, z: -43 };
  const outZ = civic ? lot.z - 3.5 : lot.z + 3.5;   // civic doors face south (town side); business doors face north
  state.inBiz = false; state.currentBiz = null; state.inCivic = null; state.bizWorkers = [];
  clearBizCustomers();
  scene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_OUT);
  catGroup.position.set(lot.x, 0, outZ); catGroup.rotation.y = civic ? Math.PI : 0;
  state.camYaw = 0; state.camHeight = 7; state.camDist = 9;
  camera.position.set(lot.x, state.camHeight, outZ + 9);
  document.getElementById('minimap').style.display = '';
}
function _clearScene(s) { for (let i = s.children.length - 1; i >= 0; i--) s.remove(s.children[i]); }
function buildBizInterior(id) {
  _clearScene(bizScene); bizColliders.length = 0;
  state.civicGiver = null;   // no lobby minigame host in a private business
  const S = bizScene;
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const B = (w, h, d, m, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); me.position.set(x, y, z); return me; };
  const floorMat = pbr(0x8a7a5c, 0.9), wallMat = pbr(0xc4b494, 0.96), wood = pbr(0x6a4a2c, 0.8);   // warmer, less glaring walls
  add(new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 10), floorMat)).position.y = -0.05;
  const WH = 3, WY = 1.5;
  B(14, WH, 0.2, wallMat, 0, WY, -5); B(0.2, WH, 10, wallMat, -7, WY, 0); B(0.2, WH, 10, wallMat, 7, WY, 0);
  B(4.5, WH, 0.2, wallMat, -4.75, WY, 5); B(4.5, WH, 0.2, wallMat, 4.75, WY, 5); B(2.4, 0.5, 0.2, wallMat, 0, 2.75, 5);
  S.add(new THREE.AmbientLight(0xfff0e0, 0.48)); S.add(new THREE.HemisphereLight(0xfff2e0, 0x3a2a20, 0.34));
  [[-3.5, -2], [3.5, -2], [0, 2]].forEach(([lx, lz]) => { const pl = new THREE.PointLight(0xffe8c0, 0.6, 22, 2); pl.position.set(lx, 3.6, lz); S.add(pl); });
  // service counter — REDESIGNED: open at both ends so you (and staff) can walk behind it
  B(4.8, 1.0, 0.6, wood, 0.6, 0.5, -3.8);                                          // counter slab (x -1.8 → 3.0)
  B(0.6, 0.4, 0.5, pbr(0x2a2a2a, 0.5), 1.8, 1.15, -3.8);                           // register
  B(2.8, 1.6, 0.4, pbr(0x49331f, 0.8), -4.2, 0.8, -4.75);                          // staff-side stock shelf
  bizColliders.push({ type: 'box', x0: -1.8, x1: 3.0, z0: -4.1, z1: -3.5 });
  const C = (rt, rb, hh, s, m, x, y, z) => { const me = add(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, hh, s), m)); me.position.set(x, y, z); return me; };
  const Sp = (r, m, x, y, z) => { const me = add(new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), m)); me.position.set(x, y, z); return me; };
  // Each business TYPE gets its own fittings, so a café looks nothing like a factory
  const themed = {
    cafe: () => {   // round tables, chairs, a coffee machine + menu
      [[-3.6, -1.4], [3.6, -1.4], [-3.6, 2.2], [3.6, 2.2]].forEach(([x, z]) => {
        C(0.08, 0.08, 0.7, 8, wood, x, 0.35, z); C(0.6, 0.6, 0.08, 16, pbr(0x8a5a3a, 0.7), x, 0.72, z);
        C(0.08, 0.06, 0.12, 10, pbr(0xf0ece0, 0.5), x + 0.2, 0.82, z);
        [-0.72, 0.72].forEach(cx => B(0.42, 0.5, 0.42, pbr(0x6a4a3a, 0.8), x + cx, 0.25, z));
        bizColliders.push({ type: 'box', x0: x - 0.7, x1: x + 0.7, z0: z - 0.7, z1: z + 0.7 });
      });
      B(0.8, 0.5, 0.4, pbr(0x3a3a42, 0.4, 0.4), -0.9, 1.25, -3.75);
      add(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.95, 0.05), new THREE.MeshStandardMaterial({ map: makeTextSign('☕ MENU', '#2a2018', '#f0e0b0', 200, 110), roughness: 0.7 }))).position.set(-4.5, 2.1, -4.88);
    },
    bakery: () => {   // glass display cases of bread + a big oven
      [[-4, -2.4], [4, -2.4], [-4.5, 1.3], [4.5, 1.3]].forEach(([x, z]) => {
        B(2.6, 0.9, 0.7, pbr(0x8a6a4a, 0.8), x, 0.45, z);
        B(2.6, 0.5, 0.7, new THREE.MeshStandardMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.22, roughness: 0.1 }), x, 1.15, z);
        for (let i = 0; i < 4; i++) Sp(0.16, pbr(0xd8a860, 0.6), x - 0.9 + i * 0.6, 0.98, z);
        bizColliders.push({ type: 'box', x0: x - 1.4, x1: x + 1.4, z0: z - 0.4, z1: z + 0.4 });
      });
      B(2.2, 2.0, 0.9, pbr(0x6a6a72, 0.5, 0.3), 5.2, 1.0, -4); B(1.4, 0.8, 0.1, pbr(0x2a1a12, 0.3), 5.2, 0.9, -3.5);
    },
    market: () => {   // produce stands piled with fruit & veg
      [[-4, -2.3], [0, -2.3], [4, -2.3], [-4.5, 1.3], [4.5, 1.3]].forEach(([x, z]) => {
        B(1.8, 0.5, 1.0, pbr(0x9a6a3a, 0.85), x, 0.25, z);
        const cols = [0xc0392b, 0xe0a83c, 0x6a9a4a, 0xd06a5a, 0x8ac040, 0xe07a2a];
        for (let i = 0; i < 6; i++) Sp(0.14, pbr(cols[i % cols.length], 0.6), x - 0.55 + (i % 3) * 0.55, 0.6 + (i > 2 ? 0.16 : 0), z - 0.2 + (i > 2 ? 0.35 : 0));
        bizColliders.push({ type: 'box', x0: x - 1.0, x1: x + 1.0, z0: z - 0.6, z1: z + 0.6 });
      });
    },
    factory: () => {   // machines with pipes + a conveyor and crates
      [[-4, -2.3], [4, -2.3]].forEach(([x, z]) => {
        B(2.4, 1.8, 1.2, pbr(0x8a8f99, 0.5, 0.4), x, 0.9, z);
        C(0.16, 0.16, 1.4, 10, pbr(0x6a6a72, 0.4, 0.5), x - 0.8, 1.9, z); C(0.16, 0.16, 1.4, 10, pbr(0x6a6a72, 0.4, 0.5), x + 0.8, 1.9, z);
        bizColliders.push({ type: 'box', x0: x - 1.3, x1: x + 1.3, z0: z - 0.7, z1: z + 0.7 });
      });
      B(6, 0.4, 0.8, pbr(0x4a4a52, 0.6, 0.3), 0, 0.5, 1.6);
      [[-4.5, 1.6], [4.5, 1.6], [-4.5, 3], [4.5, 3]].forEach(([x, z]) => B(0.7, 0.7, 0.7, pbr(0x9a6a3a, 0.85), x, 0.35, z));
    },
  };
  (themed[id] || themed.market)();
  // re-raise any furniture you bought & arranged for THIS business
  if (typeof decorList === 'function' && typeof buildDecorItem === 'function') {
    decorReg.biz = {};
    if (typeof selRings !== 'undefined') selRings.biz = null;   // old selection ring was cleared with the scene
    decorList('biz').forEach(did => buildDecorItem(did, 'biz'));
  }
  spawnBizWorkers(id);
  if (typeof applyComfortLighting === 'function') applyComfortLighting(bizScene);   // respect 🌙 comfort mode on rebuild
}

// The hired staff, at work inside a business (the current bizScene, or Dad's shopScene).
// Each gets a task + a facing so they look genuinely busy rather than standing around.
const BIZ_WORK_SPOTS = [[0.9, -3.1], [-4, -1.5], [4, -1.5], [-4.5, 2.0], [4.5, 2.0], [-0.9, -3.1], [-2, -1.6], [2, -1.6]];
const HUMAN_TASKS = ['counter', 'stock', 'stock', 'sweep', 'stock', 'counter', 'stock', 'sweep'];
const CAT_TASKS = ['bat', 'patrol', 'groom', 'bat', 'patrol', 'groom', 'bat', 'patrol'];
function clearBizWorkers() {
  (state.bizWorkers || []).forEach(w => { if (w.group && w.group.parent) w.group.parent.remove(w.group); });
  state.bizWorkers = [];
}
const CASHIER_SPOT = [0.6, -4.55];   // BEHIND the counter (z-3.8), on the staff side — customers approach from +z
function spawnWorkersInto(scn, bizId) {
  clearBizWorkers();
  workersFor(bizId).slice(0, BIZ_WORK_SPOTS.length).forEach((w, i) => {
    const cashier = (i === 0);                                   // the first hire always mans the till
    const spot = cashier ? CASHIER_SPOT : BIZ_WORK_SPOTS[i];
    if (w.type === 'cat') {
      const task = cashier ? 'counter' : CAT_TASKS[i % CAT_TASKS.length];
      const m = buildCatModel(STREET_CAT_LOOKS[i % STREET_CAT_LOOKS.length]);
      m.group.scale.setScalar(CAT_SCALE_IN * 1.15);
      m.group.position.set(spot[0], 0, spot[1]); m.group.rotation.y = cashier ? 0 : task === 'bat' ? Math.PI : Math.random() * 6; scn.add(m.group);   // cashier faces the customers (+z)
      state.bizWorkers.push({ type: 'cat', task, cashier, group: m.group, legs: m.legs, tail: m.tail, body: m.body, phase: Math.random() * 6, hx: spot[0], hz: spot[1], t2: 0 });
    } else {
      const task = cashier ? 'counter' : HUMAN_TASKS[i % HUMAN_TASKS.length];
      const { group, parts } = buildHuman(randomPersonCfg());
      group.position.set(spot[0], 0, spot[1]);
      group.rotation.y = task === 'counter' ? 0 : task === 'stock' ? Math.PI : Math.random() * 6;   // counter faces room, stock faces shelf
      scn.add(group);
      state.bizWorkers.push({ type: 'human', task, cashier, group, parts, phase: Math.random() * 6, hx: spot[0], hz: spot[1], baseRy: group.rotation.y });
    }
  });
}
function spawnBizWorkers(id) { if (state.inBiz && state.currentBiz === id) spawnWorkersInto(bizScene, id); }
function spawnShopWorkers() { if (state.inShop) spawnWorkersInto(shopScene, 'shop'); }

// ── Customers coming in to pay the cashier (only in a STAFFED business) ──
const BIZ_DOOR_IN = { x: 0, z: 3.6 }, BIZ_DOOR_OUT = { x: 0, z: 6.0 }, BIZ_COUNTER = { x: 0, z: -2.9 };
function clearBizCustomers() { (state.bizCustomers || []).forEach(c => { if (c.group && c.group.parent) c.group.parent.remove(c.group); }); state.bizCustomers = []; _bizCoins.length = 0; }
function spawnBizCustomers() {
  clearBizCustomers();
  if (!state.inBiz || !bizIsStaffed(state.currentBiz)) return;   // only a staffed till has customers
  for (let i = 0; i < 3; i++) {
    const { group, parts } = buildHuman(randomPersonCfg());
    group.position.set(BIZ_DOOR_OUT.x, 0, BIZ_DOOR_OUT.z); group.visible = false; bizScene.add(group);
    state.bizCustomers.push({ group, parts, x: BIZ_DOOR_OUT.x, z: BIZ_DOOR_OUT.z, phase: Math.random() * 6, cstate: 'gone', ctimer: 40 + i * 90 + Math.random() * 260, spd: 0.03 + Math.random() * 0.012 });
  }
}
// Ambient patrons that give each business type its own life (café sitters, shoppers, machine hands)
function spawnBizOccupants(id) {
  const push = fn => { const { group, parts } = buildHuman(randomPersonCfg()); bizScene.add(group); const o = { type: 'human', group, parts, phase: Math.random() * 6 }; fn(o); state.bizWorkers.push(o); };
  const sit = (o, x, z, faceY) => { const h = o.group.scale.y || 1; o.group.position.set(x, 0.5 - 0.82 * h, z); o.group.rotation.set(0, faceY, 0); if (o.parts.legs) o.parts.legs.forEach(l => l.rotation.x = -1.4); if (o.parts.arms) o.parts.arms.forEach(a => a.rotation.x = -0.2); o.pose = 'sit'; };
  const browse = (o, x, z, faceY) => { o.group.position.set(x, 0, z); o.group.rotation.set(0, faceY, 0); o.pose = 'browse'; };
  if (id === 'cafe') {   // patrons sitting at the tables sipping coffee
    [[-3.6, -1.4], [3.6, -1.4], [-3.6, 2.2], [3.6, 2.2]].forEach(([tx, tz]) => [-0.72, 0.72].forEach(dx => { if (Math.random() < 0.6) push(o => { sit(o, tx + dx, tz, Math.atan2(-dx, 0)); o.cafe = true; }); }));
  } else if (id === 'bakery') {   // customers at the display cases
    [[-4, -2.4], [4, -2.4], [-4.5, 1.3], [4.5, 1.3]].forEach(([x, z]) => { if (Math.random() < 0.7) push(o => browse(o, x, z + 1.0, Math.PI)); });
  } else if (id === 'market') {   // shoppers at the produce stands
    [[-4, -2.3], [0, -2.3], [4, -2.3], [-4.5, 1.3], [4.5, 1.3]].forEach(([x, z]) => { if (Math.random() < 0.6) push(o => browse(o, x, z + 1.1, Math.PI)); });
  } else if (id === 'factory') {   // hands working the machines & the line
    [[-4, -2.3], [4, -2.3]].forEach(([x, z]) => push(o => { o.group.position.set(x, 0, z + 1.3); o.group.rotation.y = Math.PI; o.task = 'stock'; o.hx = x; o.hz = z + 1.3; o.baseRy = Math.PI; }));
    push(o => { o.group.position.set(0, 0, 2.7); o.group.rotation.y = 0; o.task = 'sweep'; o.hx = 0; o.hz = 2.7; o.baseRy = 0; });
  }
}
const _bizCoins = [];
function popBizCoin(x, z) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0xf0c020, metalness: 0.8, roughness: 0.3, emissive: 0x4a3300, emissiveIntensity: 0.6, transparent: true }));
  c.rotation.x = Math.PI / 2; c.position.set(x, 1.15, z); bizScene.add(c);
  _bizCoins.push({ mesh: c, life: 1 });
  if (typeof sfx === 'function') sfx('coin');
}
function updateBizCoins() {
  for (let i = _bizCoins.length - 1; i >= 0; i--) {
    const fc = _bizCoins[i]; fc.life -= 0.022; fc.mesh.position.y += 0.02; fc.mesh.rotation.z += 0.25;
    fc.mesh.material.opacity = Math.max(0, fc.life);
    if (fc.life <= 0) { bizScene.remove(fc.mesh); _bizCoins.splice(i, 1); }
  }
}
function updateBizCustomers(t) {
  if (!state.bizCustomers || !state.bizCustomers.length) return;
  updateBizCoins();
  state.bizCustomers.forEach(c => {
    const spd = c.spd;
    switch (c.cstate) {
      case 'gone': if (--c.ctimer <= 0) { c.group.position.set(BIZ_DOOR_OUT.x, 0, BIZ_DOOR_OUT.z); c.x = BIZ_DOOR_OUT.x; c.z = BIZ_DOOR_OUT.z; c.group.visible = true; c.cstate = 'enter'; } return;
      case 'enter': if (stepPersonTo(c, BIZ_DOOR_IN.x, BIZ_DOOR_IN.z, spd)) c.cstate = 'toCounter'; return;
      case 'toCounter': if (stepPersonTo(c, BIZ_COUNTER.x + (Math.random() - 0.5) * 1.4, BIZ_COUNTER.z, spd)) { c.cstate = 'pay'; c.ctimer = 40 + Math.random() * 70; c.paid = false; } return;
      case 'pay':
        c.group.rotation.y = Math.PI; idleHuman(c, t);   // face the counter and pay
        if (!c.paid && c.ctimer < 24) { c.paid = true; popBizCoin(c.group.position.x, c.group.position.z - 0.5); const w = (state.bizWorkers || []).find(x => x.cashier); if (w && w.parts && w.parts.arms) { w.parts.arms[0].rotation.x = -1.0; } }
        if (--c.ctimer <= 0) c.cstate = 'leave';
        return;
      case 'leave': if (stepPersonTo(c, BIZ_DOOR_IN.x, BIZ_DOOR_IN.z, spd + 0.004)) c.cstate = 'exit'; return;
      case 'exit': if (stepPersonTo(c, BIZ_DOOR_OUT.x, BIZ_DOOR_OUT.z, spd + 0.006)) { c.cstate = 'gone'; c.ctimer = 180 + Math.random() * 520; c.group.visible = false; } return;
    }
  });
}
function updateBizWorkers(t) {
  (state.bizWorkers || []).forEach(w => {
    if (w.pose) { if (typeof updateCivicPose === 'function') updateCivicPose(w, t); return; }   // civic occupants (patients/students/sleepers/visitors)
    const ph = w.phase;
    if (w.type === 'human') {
      idleHuman(w, t);                                   // breathing + subtle head look…
      const a = w.parts.arms; if (!a) return;
      if (w.task === 'stock') {                          // reaching up & down, restocking shelves
        a[0].rotation.x = -1.4 + Math.sin(t * 2.4 + ph) * 0.7;
        a[1].rotation.x = -1.4 + Math.sin(t * 2.4 + ph + 1.6) * 0.7;
        w.group.position.y = Math.abs(Math.sin(t * 1.2 + ph)) * 0.04;
      } else if (w.task === 'counter') {                 // handling items / serving
        a[0].rotation.x = -0.6 + Math.sin(t * 3 + ph) * 0.35;
        a[1].rotation.x = -0.6 - Math.sin(t * 3 + ph) * 0.35;
      } else {                                           // sweeping: arms low, gentle side-to-side
        a[0].rotation.x = -1.0; a[1].rotation.x = -0.85;
        w.group.rotation.y = w.baseRy + Math.sin(t * 1.6 + ph) * 0.35;
      }
    } else {
      if (w.tail) w.tail.rotation.z = Math.sin(t * 2 + ph) * 0.3;
      if (w.task === 'bat') { if (w.legs && w.legs[0]) w.legs[0].rotation.x = -0.4 + Math.abs(Math.sin(t * 4 + ph)) * 0.9; }   // pawing at a shelf
      else if (w.task === 'groom') { if (w.body) w.body.scale.y = 1 + Math.sin(t * 2.5 + ph) * 0.04; w.group.rotation.x = Math.sin(t * 1.5 + ph) * 0.08; }
      else { w.t2 = (w.t2 || 0) + 0.02; w.group.position.x = w.hx + Math.sin(w.t2 + ph) * 0.5; if (w.legs) { const sw = Math.sin(t * 6 + ph); w.legs[0].rotation.x = sw * 0.4; w.legs[2] && (w.legs[2].rotation.x = -sw * 0.4); } }   // patrolling
    }
  });
}
