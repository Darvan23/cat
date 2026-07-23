// school.js — the 🏫 Town School (mynotes 267): study courses to unlock skills.
//  💼 Logistics diploma → +25% cashier wages.  📊 Business degree → you may BUY businesses
//  (beyond Dad's shop) & self-run tills fill faster.  🏛️ Civics & Law → required to run for
//  President (only offered to a Mayor who has proven themselves — see politics.js).

const SCHOOL_SPOT = { x: 25, z: 34.5 };   // a schoolhouse on the North Avenue row (clear of the square's corner lamp), facing the square
const SCHOOL_COURSES = [
  { id: 'logistics', name: 'Logistics Diploma', icon: '💼', cost: 400, days: 3,
    blurb: 'Learn stock-keeping & tills — cashier jobs pay +25% wages.' },
  { id: 'business', name: 'Business Degree', icon: '📊', cost: 800, days: 4,
    blurb: 'How to run (and start) a business — REQUIRED to buy businesses, and self-run tills fill 25% faster.' },
  { id: 'civics', name: 'Civics & Law', icon: '🏛️', cost: 1500, days: 5,
    blurb: 'Government, law & leadership — REQUIRED to run for President. Offered to accomplished Mayors only.' },
];
function schoolHas(id) { return !!(state.school && (state.school.done || []).includes(id)); }
function schoolStudying() { return state.school && state.school.cur; }

// ── What each course actually TEACHES (shown as a guided lesson on graduation, re-readable) ──
const SCHOOL_LESSONS = {
  logistics: [
    { text: '💼 <b>Logistics — lesson 1:</b> shops in town with a green <b>"WE\'RE HIRING!"</b> board are looking for a cashier. Walk up to the owner and apply.', glow: null },
    { text: '📋 Your job runs <b>9 to 5</b>: open the shop at the counter in the morning, close at five to get <b>paid</b>. Late = docked pay + a strike. 3 strikes = fired!', glow: null },
    { text: '🛎️ On shift: help browsers find what their 💭 bubble shows, ring up buyers with the <b>right change</b>, and 🏦 stash the takings — you earn 10% commission.', glow: null },
    { text: '🎓 Your diploma now earns you <b>+25% wages</b> at every cashier job. Work 5 clean shifts and ask for a raise! 💰', glow: null },
  ],
  business: [
    { text: '📊 <b>Business — lesson 1:</b> open the 📊 dashboard to see the town\'s businesses. With your degree you can now <b>BUY</b> the ☕ café, 🥐 bakery, 🏬 market & 🏭 factory.', glow: 'business-btn' },
    { text: '🔑 A business with <b>no staff earns nothing</b> by itself — walk inside, tap 🔓 Open at the register and run the till yourself during trading hours.', glow: null },
    { text: '👥 Better: <b>hire staff</b> from the 📊 dashboard (the first hire becomes your cashier) — then it earns daily income WITHOUT you. Wages are 1300/day each, so don\'t overhire!', glow: 'business-btn' },
    { text: '🏭 The factory is special: it needs <b>10+ workers</b> to produce anything. And your degree makes self-run tills fill <b>25% faster</b>. Go build an empire! 💪', glow: null },
  ],
  civics: [
    { text: '🏛️ <b>Civics & Law — lesson 1:</b> public money belongs to the PUBLIC. As President your treasury fills with tax — spend it on the people and prosperity rises.', glow: null },
    { text: '⚖️ The law is clear: pocketing tax money is <b>corruption</b>. It never fades on its own, and it feeds the town\'s 😡 anger every single day.', glow: null },
    { text: '🚔 Anger at 100 = <b>jail</b>, and you lose everything — office, businesses, coins. The only remedy: 🙏 pay stolen money back from your own pocket.', glow: null },
    { text: '🎓 You\'re now qualified for the <b>presidential race</b> — register in the 🗳️ panel and win the debate. Lead with kindness. The town is watching. 🐾', glow: 'politics-btn' },
  ],
};

// ── The schoolhouse building (stands in town from day one) ──
function buildSchoolhouse() {
  const g = new THREE.Group();
  const add = m => { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const bx = (w, h, d, color, rough, x, y, z) => { const me = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: rough }))); me.position.set(x, y, z); return me; };
  bx(7.5, 4.2, 6, 0xb0553f, 0.9, 0, 2.1, 0);                                                 // brick body
  const roof = add(new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.2, 4), new THREE.MeshStandardMaterial({ color: 0x3d5a4a, roughness: 0.85 }))); roof.position.y = 5.3; roof.rotation.y = Math.PI / 4;
  // little bell tower
  bx(1.1, 1.2, 1.1, 0xa04a36, 0.9, 0, 6.6, 0);
  const bell = add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: 0xd8b04a, metalness: 0.6, roughness: 0.3 }))); bell.position.set(0, 6.5, 0);
  if (typeof mat !== 'undefined') {
    add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.4, 0.2), mat.door)).position.set(0, 1.2, 3.02);
    [-2.4, 2.4].forEach(wx => add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.15), mat.window)).position.set(wx, 2.2, 3.02));
  }
  if (typeof makeTextSign === 'function') {
    add(new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.7, 0.14), new THREE.MeshStandardMaterial({ map: makeTextSign('🏫 TOWN SCHOOL', '#2a3a2a', '#f0e6b8', 340, 62), roughness: 0.55, emissive: 0x141f14, emissiveIntensity: 0.4 }))).position.set(0, 3.7, 3.06);
  }
  g.position.set(SCHOOL_SPOT.x, 0, SCHOOL_SPOT.z - 3); g.rotation.y = Math.PI;   // door faces the town square (south)
  scene.add(g);
  const coll = { type: 'box', x0: SCHOOL_SPOT.x - 3.8, x1: SCHOOL_SPOT.x + 3.8, z0: SCHOOL_SPOT.z - 6, z1: SCHOOL_SPOT.z - 0.4 };
  if (typeof worldColliders !== 'undefined') worldColliders.push(coll);
  if (typeof addProp === 'function') addProp({ kind: 'school', group: g, x: SCHOOL_SPOT.x, z: SCHOOL_SPOT.z - 3, rotY: Math.PI, coll, hw: 3.8, hd: 2.8, movable: true,
    onMove: (nx, nz) => { SCHOOL_SPOT.x = nx; SCHOOL_SPOT.z = nz + 3; } });   // the 🎓 door prompt & map markers follow
}

// ── Enter prompt spot (by the door) — handled from updateContextButton ──
function schoolContext(cp) {
  if (Math.hypot(cp.x - SCHOOL_SPOT.x, cp.z - (SCHOOL_SPOT.z - 6.6)) < 2.6) return { action: 'school', label: '🎓 Town School' };
  return null;
}

// ── The 🎓 School panel: enroll, study over days, graduate ──
function openSchool() {
  state.uiOpen = true;
  renderSchool();
  document.getElementById('school').classList.add('show');
}
function closeSchool() { state.uiOpen = false; document.getElementById('school').classList.remove('show'); }
function civicsOffered() {   // Civics is only taught to a Mayor who has met the town's goals (politics.js)
  if (state.politics && state.politics.phase === 'president') return true;
  return (typeof mayorGoalsMet === 'function') && state.politics && state.politics.phase === 'mayor' && mayorGoalsMet();
}
function renderSchool() {
  const sc = state.school || (state.school = { done: [], cur: null, curDone: 0 });
  let h = `<div class="modal-sub">Study to unlock real skills. One course at a time — classes run in the evenings, so you graduate after a few days. 🪙 ${state.coins}</div>`;
  if (sc.cur) {
    const c = SCHOOL_COURSES.find(x => x.id === sc.cur);
    const left = Math.max(0, sc.curDone - (state.dayCount || 0));
    h += `<div class="biz-note">📖 Studying <b>${c ? c.name : sc.cur}</b> — graduation in <b>${left}</b> day${left === 1 ? '' : 's'}. Keep living your life; the learning happens each evening.</div>`;
  }
  h += `<div class="school-grid">`;
  SCHOOL_COURSES.forEach(c => {
    const done = schoolHas(c.id);
    const locked = c.id === 'civics' && !done && !civicsOffered();
    let foot;
    if (done) foot = `<div class="rescue-tag freed">🎓 Graduated</div><button class="cust-pat" onclick="reviewLesson('${c.id}')">📖 Re-read the lesson</button>`;
    else if (locked) foot = `<div class="school-locked">🔒 For proven Mayors only</div>`;
    else if (sc.cur) foot = `<div class="school-locked">One course at a time…</div>`;
    else foot = `<button class="rescue-buy" ${state.coins >= c.cost ? '' : 'disabled'} onclick="enrollCourse('${c.id}')">Enroll · ${c.cost} 🪙 · ${c.days}d</button>`;
    h += `<div class="school-card"><div class="school-icon">${c.icon}</div><div class="cat-name">${c.name}</div><div class="school-blurb">${c.blurb}</div>${foot}</div>`;
  });
  h += `</div>`;
  document.getElementById('school-body').innerHTML = h;
}
function enrollCourse(id) {
  const c = SCHOOL_COURSES.find(x => x.id === id); if (!c) return;
  const sc = state.school || (state.school = { done: [], cur: null, curDone: 0 });
  if (sc.cur || schoolHas(id)) return;
  if (id === 'civics' && !civicsOffered()) { showNotif('🔒 Civics & Law is only offered to Mayors who have proven themselves.'); return; }
  if (state.coins < c.cost) { showNotif('Not enough coins for the tuition…'); return; }
  state.coins -= c.cost; document.getElementById('coin-count').textContent = state.coins;
  sc.cur = id; sc.curDone = (state.dayCount || 0) + c.days;
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif('📖 Enrolled in ' + c.name + '! You graduate in ' + c.days + ' days.');
  renderSchool();
  if (typeof saveGame === 'function') saveGame();
}
// Called each new day (from updateDayNight) — hand out diplomas when the course completes
function processSchoolDay() {
  const sc = state.school; if (!sc || !sc.cur) return;
  if ((state.dayCount || 0) < sc.curDone) return;
  const c = SCHOOL_COURSES.find(x => x.id === sc.cur);
  (sc.done = sc.done || []).push(sc.cur);
  const finished = sc.cur; sc.cur = null; sc.curDone = 0;
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif('🎓 You graduated: ' + (c ? c.name : finished) + '!');
  if (finished === 'logistics' && state.job) {   // your diploma raises your current wage right away
    state.job.wage = Math.round(state.job.wage * 1.25);
    showNotif('💼 Your Logistics Diploma earned you a pay bump — now ' + state.job.wage + ' 🪙/day!');
  }
  if (finished === 'civics') showDialogue('🎓 The Professor', 'Congratulations, ' + state.catName + ' — you understand the law of the land now. The presidency is within your reach. Make us proud.', 6000);
  if (typeof inboxAdd === 'function') inboxAdd('🏫 Town School', '🎓 Diploma awarded: ' + (c ? c.name : finished),
    `Dear ${state.catName} Miller,<br><br>The school is proud to certify your <b>${c ? c.name : finished}</b>. It has been added to your 📄 CV (see the 📊 dashboard).<br><br>Your graduation lesson is attached — re-read it anytime at the school.<br>— The Professor`);
  if (typeof showTutorial === 'function' && SCHOOL_LESSONS[finished]) setTimeout(() => showTutorial('lesson_' + finished, SCHOOL_LESSONS[finished], true), 1200);   // 🎓 the actual TEACHING
  if (typeof saveGame === 'function') saveGame();
}
function reviewLesson(id) {   // re-read a lesson from the school panel anytime
  if (SCHOOL_LESSONS[id] && typeof showTutorial === 'function') { closeSchool(); showTutorial('lesson_' + id, SCHOOL_LESSONS[id], true); }
}
