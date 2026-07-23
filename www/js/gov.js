// gov.js — Presidency governance (notes 48–52): a tax treasury (millions/day), a town
// happiness meter, spending choices (help the country vs. corrupt luxuries), city mail
// decisions, and the jail arc when the people turn on you.

const TAX_PER_DAY = 2000000;        // base tax into the treasury each day while president
const PRESIDENT_SALARY = 8000;     // your honest personal pay each day in office
const HAPPY_DECAY = 3;             // happiness drifts down daily — you must keep investing
// Public-good spending → the town gets happier. (Each is repeatable.)
const GOV_ACTIONS = [
  { id: 'clean',  name: '🧹 Clean the streets',  cost: 250000, happy: 8 },
  { id: 'police', name: '👮 Fund the police',     cost: 400000, happy: 7 },
  { id: 'park',   name: '🌳 Parks & trees',       cost: 350000, happy: 9 },
  { id: 'school', name: '📚 School programs',     cost: 700000, happy: 12 },
  { id: 'health', name: '💊 Health programs',     cost: 600000, happy: 11 },
];
// The corrupt path: pocket public money → your coins go up, corruption rises (and can't be undone cheaply).
const GOV_LUXURY = { name: '💎 Treat yourself (corrupt)', cost: 600000, toCoins: 450000, corrupt: 15 };
// ── Three genuinely separate meters ──
//  🌟 Prosperity (g.happiness): how well-run the town is — good deeds raise it, neglect lowers it.
//  🚨 Corruption (g.corruption): YOUR rap sheet — only theft raises it, only paying it back lowers it. Never fades on its own.
//  😡 Anger      (g.anger): the town's fury at YOU — corruption feeds it every day; hits 100 → jail. Parks can't buy it off.
const CORRUPT_PER = 40000;         // tax pocketed per +1 corruption (600k→+15, 2M→+50, ≥4M→maxed out)
const ANGER_RATE = 0.006;          // anger gained per SECOND per point of corruption (corr 100 → boils over in ~3 min of play)
const ANGER_RELIEF = 0.15;         // max anger/sec a thriving, honest town sheds — never enough to out-run real corruption
const SCANDAL_MIN_CORRUPT = 45;    // the press only starts digging once you're this dirty
const SCANDAL_BRIBE = 600000;      // hush money to bury a story (buys time, digs you deeper)
const MAIL_ITEMS = [
  { text: 'The streets need cleaning this week.',   cost: 220000, penalty: 6 },
  { text: 'The police request extra funding.',      cost: 320000, penalty: 7 },
  { text: 'The hospital is low on supplies.',       cost: 300000, penalty: 8 },
  { text: 'Schools are asking for new books.',      cost: 180000, penalty: 5 },
  { text: 'Flood damage on Main Street needs repair.', cost: 400000, penalty: 9 },
];

function isPresident() { return state.politics && state.politics.phase === 'president' && !state.gov.jailed; }
function fmtBig(n) {
  n = Math.round(n);
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
  return n.toLocaleString('en-US');
}
function happyFace(h) { return h >= 75 ? '😀' : h >= 50 ? '🙂' : h >= 30 ? '😐' : h >= 12 ? '☹️' : '😡'; }
function happyWord(h) { return h >= 75 ? 'thriving' : h >= 50 ? 'content' : h >= 30 ? 'uneasy' : h >= 12 ? 'unhappy' : 'furious'; }

// ── Daily tick (called each new day from updateDayNight) ──
function processGovDay() {
  const g = state.gov;
  if (g.jailed) return;
  if (!isPresident()) return;
  g.treasury += Math.round(TAX_PER_DAY * (0.6 + g.happiness / 100 * 0.7));   // a happier town pays more tax
  if (typeof civicDailyGov === 'function') g.treasury += civicDailyGov();    // public works pay into the treasury (minus their wages)
  state.coins += PRESIDENT_SALARY;                                           // your honest presidential salary
  document.getElementById('coin-count').textContent = state.coins;
  // 🌟 PROSPERITY — purely about services now (no longer tangled up with your corruption)
  g.happiness -= HAPPY_DECAY;
  if (g.mail && !g.mail.paid) g.happiness -= g.mail.penalty;                 // ignored mail hurts the town
  if (!g.mail || g.mail.paid) { if (Math.random() < 0.7) newMail(); }
  g.happiness = Math.max(0, Math.min(100, g.happiness));
  // 🚨 CORRUPTION never fades on its own — only paying the money back (repayFunds) clears it
  g.corruption = Math.max(0, g.corruption || 0);
  // 😡 ANGER climbs continuously in updateAnger() (real time) — here we just let the press dig
  g._scandalCd = Math.max(0, (g._scandalCd || 0) - 1);
  maybeScandal();                                                           // 📰 the press may expose you
  announceMood();
  updateHappyHUD();
  if (typeof renderPolitics === 'function' && document.getElementById('politics').classList.contains('show')) renderPolitics();
  if (g.anger >= 100) goToJail();                                           // the people finally storm the office
  if (typeof saveGame === 'function') saveGame();
}
function newMail() {
  const m = MAIL_ITEMS[Math.floor(Math.random() * MAIL_ITEMS.length)];
  state.gov.mail = { text: m.text, cost: m.cost, penalty: m.penalty, paid: false };
  showNotif('📬 New mail from the city — open the 🗳️ panel to decide');
}
function announceMood() {
  const g = state.gov, a = g.anger || 0;
  const band = a >= 70 ? 'boiling' : a >= 40 ? 'angry' : 'calm';
  if (band === g._band) return;
  g._band = band;
  if (band === 'calm') showNotif('😌 The town is at peace with your leadership.');
  else if (band === 'angry') showNotif('😠 Unrest is rising — your corruption is fuelling the anger. Give the money back or step down.');
  else showNotif('😡 People are storming the streets! Anger is near boiling — clear it or you\'ll be jailed.');
}
// 😡 Called every frame while President: corruption drives anger UP in real time; a clean, thriving town lets it fade.
function updateAnger(dt) {
  const g = state.gov;
  if (!g || !isPresident() || g.jailed) return;
  const grow = (g.corruption || 0) * ANGER_RATE;
  const relief = Math.max(0, (g.happiness - 40) / 60) * ANGER_RELIEF;
  const before = g.anger || 0;
  const next = Math.max(0, Math.min(100, before + (grow - relief) * dt));
  if (Math.abs(next - before) < 1e-4) return;
  g.anger = next;
  updateHappyHUD();                                             // live HUD bar
  const a = Math.round(next);                                   // live panel bar (no full re-render → no scroll jump)
  const pf = document.getElementById('anger-fill'), pp = document.getElementById('anger-pct');
  if (pf) { pf.style.width = a + '%'; pf.style.background = a >= 70 ? '#c8443a' : a >= 40 ? '#d8752a' : '#7a8a5a'; }
  if (pp) pp.textContent = a + '%';
  announceMood();
  if (next >= 100) goToJail();
}

// ── Spending ──
function govAction(id) {
  const g = state.gov;
  const a = GOV_ACTIONS.find(x => x.id === id);
  if (!a) return;
  if (g.treasury < a.cost) { showNotif('Not enough tax money in the treasury'); return; }
  g.treasury -= a.cost; g.happiness = Math.min(100, g.happiness + a.happy);
  g.spentPublic = (g.spentPublic || 0) + a.cost;
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif('✅ ' + a.name + ' — the town is happier (+' + a.happy + ')');
  afterGovChange();
}
function govLuxury() {
  const g = state.gov;
  if (g.treasury < GOV_LUXURY.cost) { showNotif('Not enough tax money'); return; }
  g.treasury -= GOV_LUXURY.cost; state.coins += GOV_LUXURY.toCoins;
  g.spentSelf = (g.spentSelf || 0) + GOV_LUXURY.cost;
  const _c0 = g.corruption || 0;
  g.corruption = Math.min(100, _c0 + GOV_LUXURY.cost / CORRUPT_PER);   // +15 corruption, and it won't fade
  g.anger = Math.min(100, (g.anger || 0) + (g.corruption - _c0) * 0.5 + 4);   // instant public reaction
  document.getElementById('coin-count').textContent = state.coins;
  if (typeof sfx === 'function') sfx('coin');
  showNotif('💎 You pocketed public money — corruption up and the town is angry NOW. It won\'t fade until you pay it back.');
  afterGovChange();
}
function payMail() {
  const g = state.gov, m = g.mail;
  if (!m || m.paid) return;
  if (g.treasury < m.cost) { showNotif('Not enough tax money to pay this'); return; }
  g.treasury -= m.cost; m.paid = true; g.happiness = Math.min(100, g.happiness + 4);
  showNotif('✅ Paid — the city is grateful');
  afterGovChange();
}
function ignoreMail() {
  const g = state.gov;
  if (!g.mail) return;
  g.mail = null; g.happiness = Math.max(0, g.happiness - 3);
  showNotif('You tossed the letter aside… the town noticed.');
  afterGovChange();
}
function afterGovChange() {
  announceMood(); updateHappyHUD();
  if (typeof renderPolitics === 'function') renderPolitics();
  if (state.gov.anger >= 100) goToJail();
  if (typeof saveGame === 'function') saveGame();
}

// ── The happiness HUD bar (shown while President) ──
function updateHappyHUD() {
  const el = document.getElementById('happy');
  const ael = document.getElementById('anger');
  const show = isPresident() && !(state.inHouse || state.inShop || state.inShelter || state.inBoughtHome || state.inBiz);
  if (el) el.style.display = show ? 'flex' : 'none';
  if (ael) ael.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const g = state.gov;
  const h = Math.round(g.happiness);
  if (el) {
    el.querySelector('.happy-face').textContent = happyFace(h);
    const fill = el.querySelector('.happy-fill');
    fill.style.width = h + '%';
    fill.style.background = h >= 50 ? '#5fbf6a' : h >= 25 ? '#d8a12a' : '#c8443a';
  }
  const a = Math.round(g.anger || 0);
  if (ael) {
    ael.querySelector('.anger-face').textContent = a >= 70 ? '😡' : a >= 40 ? '😠' : '😌';
    const af = ael.querySelector('.anger-fill');
    af.style.width = a + '%';
    af.style.background = a >= 70 ? '#c8443a' : a >= 40 ? '#d8752a' : '#7a8a5a';
    ael.classList.toggle('danger', a >= 75);
  }
}

// ── The jail arc ──
function goToJail() {
  const g = state.gov;
  if (g.jailed) return;
  g.jailed = true; g.jailDays = 20;
  state.coins = 0; g.treasury = 0;                    // lose all your money
  state.politics.phase = 'eligible';                 // presidency revoked
  state.disgraced = true;                            // reputation ruined
  state.disowned = true;                             // the Millers shut their door on you for good
  state.biz.extra = []; state.biz.workers = [];       // your business empire collapses
  Object.keys(bizBuildings).forEach(bid => { if (bid !== 'shop') { scene.remove(bizBuildings[bid]); delete bizBuildings[bid]; } });
  // you lose the properties you owned — the for-sale signs go back up
  state.owned.homes = []; state.owned.shop = false;
  if (typeof PROPERTIES !== 'undefined') PROPERTIES.forEach(p => { if (PROP_SIGNS[p.id]) PROP_SIGNS[p.id].visible = true; });
  if (typeof applyFamilyPresence === 'function') applyFamilyPresence();
  document.getElementById('coin-count').textContent = 0;
  if (typeof updatePoliticsBtn === 'function') updatePoliticsBtn();
  updateHappyHUD();
  if (typeof saveGame === 'function') saveGame();
  if (typeof playFallCutscene === 'function') { playFallCutscene(enterJail); }   // 🎬 the dramatic jail march, then the cell
  else { showDialogue('🚔 The Police', 'You\'re under arrest for corruption, ' + state.catName + '. Twenty days behind bars.', 4000); setTimeout(enterJail, 700); }
}
// A real barred cell you're locked in
let _jailBuilt = false;
function buildJail() {
  if (_jailBuilt) return; _jailBuilt = true;
  const S = jailScene;
  const add = m => { m.castShadow = true; m.receiveShadow = true; S.add(m); return m; };
  const stone = pbr(0x565963, 0.97), floorMat = pbr(0x3e4148, 0.95), bar = pbr(0x8a8f99, 0.4, 0.6);
  add(new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 6), floorMat)).position.y = -0.05;
  const WH = 3, WY = 1.5;
  add(new THREE.Mesh(new THREE.BoxGeometry(7, WH, 0.3), stone)).position.set(0, WY, -3);       // back wall
  add(new THREE.Mesh(new THREE.BoxGeometry(0.3, WH, 6), stone)).position.set(-3.5, WY, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.3, WH, 6), stone)).position.set(3.5, WY, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.1), pbr(0x1a2432, 0.2))).position.set(0, 2.0, -2.9);  // barred window (dark)
  for (let bx = -0.8; bx <= 0.8; bx += 0.4) add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), bar)).position.set(bx, 2.0, -2.85);
  // the cell front: iron bars + a barred door
  for (let bx = -3.3; bx <= 3.3; bx += 0.42) add(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, WH, 8), bar)).position.set(bx, WY, 3);
  add(new THREE.Mesh(new THREE.BoxGeometry(7, 0.12, 0.12), bar)).position.set(0, 2.9, 3);
  add(new THREE.Mesh(new THREE.BoxGeometry(7, 0.12, 0.12), bar)).position.set(0, 0.4, 3);
  // a bench + a thin bunk
  add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.9), pbr(0x5a4a3a, 0.9))).position.set(-2.0, 0.4, -1.8);
  add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.8), pbr(0x8a8578, 0.95))).position.set(-2.0, 0.67, -1.8);
  // dim lights
  S.add(new THREE.AmbientLight(0x8a90a0, 0.45));
  S.add(new THREE.HemisphereLight(0x9aa6c0, 0x20242c, 0.35));
  const pl = new THREE.PointLight(0xbfc8e0, 0.6, 18, 2); pl.position.set(0, 3.2, 0); S.add(pl);
  jailColliders.push(
    { type: 'box', x0: -3.4, x1: 3.4, z0: -3.2, z1: -2.7 },   // back wall
    { type: 'box', x0: -3.4, x1: 3.4, z0: 2.8, z1: 3.3 },     // the bars (can't get out)
    { type: 'box', x0: -3.1, x1: -0.9, z0: -2.4, z1: -1.2 }   // bench
  );
}
function enterJail() {
  buildJail();
  state.inJail = true; state.uiOpen = false;
  jailScene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_IN);
  catGroup.position.set(0.5, 0, 1); catGroup.rotation.y = Math.PI;
  state.camYaw = 0; state.camHeight = 8; state.camDist = 6.5;
  camera.position.set(0.5, state.camHeight, 1 + state.camDist);
  document.getElementById('minimap').style.display = 'none';
  // clear the town HUD — you're locked up
  ['enter-btn', 'give-btn', 'context-btn', 'shelter-btn', 'property-btn', 'decorate-move-btn'].forEach(id => { const b = document.getElementById(id); if (b) b.classList.remove('show'); });
  ['population', 'happy', 'anger'].forEach(id => { const b = document.getElementById(id); if (b) b.style.display = 'none'; });
  updateJailHud();
}
// the on-screen "serving time" panel (shown while in the cell)
function updateJailHud() {
  const el = document.getElementById('jail-hud');
  if (!el) return;
  el.style.display = state.inJail ? 'flex' : 'none';
  if (!state.inJail) return;
  el.querySelector('.jail-count').textContent = 'Day ' + (20 - state.gov.jailDays + 1) + ' of 20';
}
// serve a day: called both by the "sleep it off" button and by the real day-cycle tick
function jailPassDay() {
  if (!state.inJail) return;
  state.gov.jailDays--;
  if (state.gov.jailDays <= 0) { releaseFromJail(); return; }
  updateJailHud();
  if (typeof saveGame === 'function') saveGame();
}
function jailSleep() {
  const fade = document.getElementById('fade');
  if (fade) { fade.classList.add('show'); setTimeout(() => fade.classList.remove('show'), 500); }
  jailPassDay();
}
function releaseFromJail() {
  state.gov.jailed = false; state.inJail = false;
  state.homeless = true;                       // out, but with nothing — back to the shelter
  document.getElementById('jail-hud').style.display = 'none';
  scene.add(catGroup); catGroup.scale.setScalar(CAT_SCALE_OUT);
  catGroup.position.set(SHELTER.x, 0, SHELTER.z - 6); catGroup.rotation.y = 0;
  state.camHeight = 7; state.camDist = 9;
  camera.position.set(SHELTER.x, state.camHeight, SHELTER.z - 6 + 9);
  document.getElementById('minimap').style.display = '';
  updateHappyHUD();
  showDialogue(state.catName + ' 🐱', "Free at last — but I've lost everything. Back at the shelter, on my own. Nobody will adopt a disgraced cat… I'll have to work and buy a home of my own to make things right.", 7000);
  if (typeof saveGame === 'function') saveGame();
}

// ── Pay for a purchase — as President you choose Tax money or your own coins ──
let _payAmt = 0, _payCb = null;
function payChoice(amount, label, onPaid) {
  if (!isPresident()) {                        // not President → just your coins, as before
    if (state.coins < amount) { showNotif('Not enough coins yet…'); return; }
    state.coins -= amount; document.getElementById('coin-count').textContent = state.coins;
    onPaid(); return;
  }
  _payAmt = amount; _payCb = onPaid;
  const g = state.gov;
  document.getElementById('pay-body').innerHTML =
    `<div class="pay-label">${label}</div><div class="pay-amt">${fmtBig(amount)} 🪙</div>` +
    `<div class="pay-note">Public money is for the country — spend it on yourself and the town loses a little faith.</div>` +
    `<button class="pol-primary" ${g.treasury >= amount ? '' : 'disabled'} onclick="payWith('tax')">🏛️ Tax money · have ${fmtBig(g.treasury)}</button>` +
    `<button class="pol-primary" ${state.coins >= amount ? '' : 'disabled'} onclick="payWith('coins')">🪙 My own coins · have ${fmtBig(state.coins)}</button>` +
    `<button class="modal-close" onclick="payCancel()">Cancel</button>`;
  state.uiOpen = true;
  document.getElementById('pay').classList.add('show');
}
function payWith(src) {
  const amt = _payAmt, g = state.gov;
  if (src === 'tax') {
    if (g.treasury < amt) return;
    g.treasury -= amt;
    g.spentSelf = (g.spentSelf || 0) + amt;
    // pocketing PUBLIC money is corruption — scaled to HOW MUCH, and it will NOT fade on its own
    const _c0 = g.corruption || 0;
    g.corruption = Math.min(100, _c0 + amt / CORRUPT_PER);
    g.anger = Math.min(100, (g.anger || 0) + (g.corruption - _c0) * 0.5 + 4);   // the town reacts the MOMENT you steal
    showNotif('🚨 You used public money for yourself — corruption up, and the town is angry NOW.');
  } else {
    if (state.coins < amt) return;
    state.coins -= amt; document.getElementById('coin-count').textContent = state.coins;
  }
  const cb = _payCb; _payCb = null;
  payCancel();
  updateHappyHUD();
  if (cb) cb();
  if (g.anger >= 100) goToJail();
}
function payCancel() { state.uiOpen = false; document.getElementById('pay').classList.remove('show'); }

// ── 🙏 Reparations — the ONLY way corruption comes down: give the stolen money back ──
function repayFunds() {
  const g = state.gov;
  const outstanding = Math.max(0, (g.spentSelf || 0) - (g.repaid || 0));
  if (outstanding <= 0) { showNotif('You have nothing left to pay back.'); return; }
  const amt = Math.min(state.coins, outstanding);
  if (amt <= 0) { showNotif('You need your own coins to make amends — go earn some.'); return; }
  state.coins -= amt; g.treasury += amt; g.repaid = (g.repaid || 0) + amt;
  g.corruption = Math.max(0, g.corruption - amt / CORRUPT_PER);   // corruption falls at the same rate it rose
  g.anger = Math.max(0, (g.anger || 0) - amt / CORRUPT_PER * 0.6); // the gesture cools the town a little
  document.getElementById('coin-count').textContent = state.coins;
  if (typeof sfx === 'function') sfx('coin');
  showNotif('🙏 You returned ' + fmtBig(amt) + ' to the treasury — corruption down, the people take notice.');
  afterGovChange();
}

// ── 📰 Scandals — corruption occasionally breaks into the open and forces a choice ──
function maybeScandal() {
  const g = state.gov;
  if (g.scandal) return;                                   // one at a time
  if ((g._scandalCd || 0) > 0) return;
  if ((g.corruption || 0) < SCANDAL_MIN_CORRUPT) return;
  if (Math.random() > (g.corruption / 100) * 0.45) return; // the dirtier you are, the likelier the exposé
  openScandal();
}
const SCANDAL_HEADLINES = [
  'A reporter has receipts showing you spent the town\'s money on yourself.',
  'Leaked records reveal missing millions from the treasury.',
  'The opposition is demanding an inquiry into where the tax money went.',
  'A whistle-blower just handed the press a file with your name on it.',
];
function openScandal() {
  const g = state.gov;
  const bribeOk = g.treasury >= SCANDAL_BRIBE;
  g.scandal = { headline: SCANDAL_HEADLINES[Math.floor(Math.random() * SCANDAL_HEADLINES.length)] };
  const el = document.getElementById('scandal');
  if (!el) { g._scandalCd = 5; g.scandal = null; return; }
  document.getElementById('scandal-body').innerHTML =
    `<div class="modal-sub">📰 <b>SCANDAL!</b> ${g.scandal.headline}<br>The people are watching how you respond.</div>` +
    `<div class="scandal-choices">` +
    `<button class="scandal-bribe" ${bribeOk ? '' : 'disabled'} onclick="scandalBribe()">🤫 Bury the story<small>${fmtBig(SCANDAL_BRIBE)} tax · buys time · 🚨 +15 corruption</small></button>` +
    `<button class="scandal-deny" onclick="scandalDeny()">📢 Deny everything<small>free · 😡 +22 anger right now</small></button>` +
    `<button class="scandal-confess" onclick="scandalConfess()">🙏 Confess &amp; resign<small>step down · avoid jail · keep your coins &amp; home</small></button>` +
    `</div>`;
  state.uiOpen = true;
  el.classList.add('show');
  if (typeof sfx === 'function') sfx('catch');
  showNotif('📰 A scandal just broke — open decision required!');
}
function closeScandal() {
  const g = state.gov;
  g.scandal = null; g._scandalCd = 5;
  const el = document.getElementById('scandal'); if (el) el.classList.remove('show');
  state.uiOpen = false;
}
function scandalBribe() {
  const g = state.gov;
  if (g.treasury < SCANDAL_BRIBE) return;
  g.treasury -= SCANDAL_BRIBE; g.spentSelf = (g.spentSelf || 0) + SCANDAL_BRIBE;
  g.corruption = Math.min(100, (g.corruption || 0) + 15);      // covering it up is MORE corruption
  g.anger = Math.min(100, (g.anger || 0) + 4);
  closeScandal();
  showNotif('🤫 You paid to bury the story… but that\'s deeper corruption. It\'ll come back around.');
  afterGovChange();
}
function scandalDeny() {
  const g = state.gov;
  g.anger = Math.min(100, (g.anger || 0) + 22);               // stonewalling enrages the town
  closeScandal();
  showNotif('📢 You denied everything — the town is furious.');
  afterGovChange();
}
function scandalConfess() {
  closeScandal();
  resignPresidency();
}
// Step down before the anger jails you — you lose the office & treasury but keep your coins, home and freedom.
function resignPresidency() {
  const g = state.gov;
  g.treasury = 0;
  g.scandal = null;
  state.politics.phase = 'eligible';
  updateHappyHUD();
  if (typeof updatePoliticsBtn === 'function') updatePoliticsBtn();
  if (typeof renderPolitics === 'function') renderPolitics();
  if (typeof updateTownMood === 'function') { const gl = document.getElementById('gloom'); if (gl) gl.style.opacity = 0; }
  if (typeof saveGame === 'function') saveGame();
  showDialogue('📉 Resignation', 'You stepped down before the scandal could bury you, ' + state.catName + '. The presidency and the treasury are gone — but you keep your coins, your home and your freedom. You can run again one day.', 6500);
}

// ── Town mood you can SEE: litter & protests when unhappy, clean when happy ──
let moodProps = null;
function buildMoodProps() {
  const litter = [];
  for (let i = 0; i < 46; i++) {
    const z = [-26, 0, 38, 20, -9, 8][i % 6] + (Math.random() - 0.5) * 4;
    const x = -92 + Math.random() * 184;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.24), pbr(Math.random() < 0.5 ? 0x8a8578 : 0x6a6252, 1));
    m.position.set(x, 0.06, z); m.rotation.set(Math.random() * 0.6, Math.random() * 6, Math.random() * 0.6);
    m.receiveShadow = true; m.visible = false; scene.add(m); litter.push(m);
  }
  const protestGroup = new THREE.Group();
  const signs = ['BOO!', 'SHAME', 'RESIGN', '😾', 'FIX IT', 'LIAR'];
  for (let i = 0; i < 8; i++) {
    const { group } = buildHuman(randomPersonCfg());
    const ang = (i / 8) * Math.PI * 2, r = 2.6 + Math.random() * 1.6;
    group.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
    group.rotation.y = Math.atan2(-group.position.x, -group.position.z);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), pbr(0x6a4a2c, 0.8)); stick.position.set(0.22, 1.5, 0.15); group.add(stick);
    const tex = makeTextSign(signs[i % signs.length], '#e8e8e0', '#a02020', 128, 64);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.42, 0.05), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })); board.position.set(0.22, 2.2, 0.15); group.add(board);
    group.userData.ph = Math.random() * 6;
    protestGroup.add(group);
  }
  protestGroup.position.set(-3, 0, -5.5); protestGroup.visible = false; scene.add(protestGroup);
  moodProps = { litter, protestGroup };
}
function updateTownMood(t) {
  const pres = isPresident();
  if (!moodProps) { if (!pres || typeof buildHuman !== 'function') return; buildMoodProps(); }
  const h = pres ? state.gov.happiness : 100;                 // 🌟 prosperity — drives litter/neglect
  const anger = pres ? (state.gov.anger || 0) : 0;            // 😡 anger — drives protests/gloom
  const litterFrac = pres ? Math.max(0, (55 - h) / 55) : 0;   // trash builds up as the town is neglected
  const shown = Math.floor(litterFrac * moodProps.litter.length);
  moodProps.litter.forEach((m, i) => { m.visible = i < shown; });
  const protesting = pres && anger > 55 && !isNight();        // people protest YOU when they're angry
  moodProps.protestGroup.visible = protesting;
  if (protesting) moodProps.protestGroup.children.forEach(gp => { gp.position.y = Math.abs(Math.sin(t * 3 + gp.userData.ph)) * 0.12; });
  // the whole town dims as the anger rises
  const gl = document.getElementById('gloom');
  if (gl) gl.style.opacity = pres ? Math.max(0, Math.min(0.42, (anger - 40) / 60 * 0.5)) : 0;
  // townsfolk greet you when they're calm & the town thrives, snub you when they're angry
  if (pres && !isNight()) {
    state.gov._greetCd = (state.gov._greetCd || 0) - 1;
    if (state.gov._greetCd <= 0 && typeof nearestPerson === 'function') {
      const near = nearestPerson(catGroup.position, 3.0);
      if (near) {
        state.gov._greetCd = 520 + Math.random() * 340;   // ~8–14s between reactions
        if (anger < 30 && h >= 55) showNotif('👋 “Hello, President ' + state.catName + '!” — a neighbour beams at you.');
        else if (anger >= 55) showNotif('😠 A townsfolk turns away and mutters as you pass.');
      }
    }
  }
}
