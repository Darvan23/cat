// school.js — the 🏫 Town School (mynotes 307 + the big rework at mynotes 315):
// NO day-waiting. A course is a CHAIN OF LESSONS — each lesson is a short teaching
// card plus a real task in the world. Finish the task → the bell rings → the next
// lesson unlocks. Finish every lesson → sit the FINAL EXAM at the school (written
// multiple-choice, pass 80%) → 🎓 degree: diploma mail, CV entry, and a real perk.
// Fail the exam → no penalty, but retake tomorrow ("sleep on it, little one").

const SCHOOL_SPOT = { x: 25, z: 34.5 };   // a schoolhouse on the North Avenue row (clear of the square's corner lamp), facing the square

// ── The seven courses: lessons (ev = the game event that advances the task) + exam ──
const SCHOOL_COURSES = [
  { id: 'humanity', icon: '❤️', name: 'Humanity & Kindness', cost: 200,
    blurb: 'Kindness, taught by doing. Perk: good deeds count DOUBLE toward your reputation.',
    lessons: [
      { teach: 'Kindness starts small. The Millers took you in — give a little back.', task: 'Give the Millers 5 🪙 (💝 Give Coins at home)', ev: 'give', goal: 5 },
      { teach: 'Every cat in the shelter is waiting for a life. You can buy one its freedom.', task: 'Free a cat from the 🐾 shelter', ev: 'freeCat', goal: 1 },
      { teach: 'Better still: imagine a cat that never existed, and give it a life.', task: 'Create a cat of your own design, name it, and free it', ev: 'createCat', goal: 1 },
      { teach: 'The family always needs something — an errand run, a kid walked to the park.', task: 'Do 1 good deed (Elena\'s errand or walk a kid to the park)', ev: 'goodDeed', goal: 1 },
      { teach: 'And sometimes kindness is just letting people love you.', task: 'Get petted by 3 townsfolk', ev: 'petted', goal: 3 },
    ],
    exam: [
      { q: 'A shelter cat and a new toy cost the same. Which gives more?', a: ['Freeing the cat', 'The toy', 'Neither'], c: 0 },
      { q: 'Elena needs bread but paying you is hard for her. You…', a: ['Fetch it as a gift', 'Demand double', 'Ignore her'], c: 0 },
      { q: 'Good deeds pay you in…', a: ['Reputation, not coins', 'Coins', 'Nothing at all'], c: 0 },
      { q: 'A kid wants the park but it\'s out of your way. You…', a: ['Walk them anyway', 'Point vaguely', 'Charge a fee'], c: 0 },
      { q: 'The kindest cats are remembered because…', a: ['They helped when it cost them', 'They were rich', 'They were loud'], c: 0 },
    ] },
  { id: 'art', icon: '🎨', name: 'Art & Design', cost: 300,
    blurb: 'Style for you and your home. Perk: Home Store furniture costs 20% less.',
    lessons: [
      { teach: 'An artist\'s first canvas is themselves. Open the 🎨 customiser and make your cat YOURS.', task: 'Change your cat\'s look (any colour, pattern or hat)', ev: 'customise', goal: 1, glow: 'customise-btn' },
      { teach: 'A home tells a story. The 🛋️ Home Store sells the furniture to tell it.', task: 'Buy 2 furnishings for the home', ev: 'buyDecor', goal: 2 },
      { teach: 'Placement is everything — a room only works when things are WHERE they belong. Use the 🛠️ editor.', task: 'Move or rotate 3 pieces of furniture', ev: 'moveDecor', goal: 3 },
    ],
    exam: [
      { q: 'A warm, cosy room wants…', a: ['Lamps & soft colours', 'Bare walls', 'As much clutter as possible'], c: 0 },
      { q: 'Where does a TV go?', a: ['Facing the couch', 'Behind the fridge', 'On the roof'], c: 0 },
      { q: 'Your look should be…', a: ['Whatever feels like YOU', 'Whatever is priciest', 'The same as everyone'], c: 0 },
      { q: 'A room feels crowded. You…', a: ['Move & remove pieces', 'Buy more', 'Never enter it again'], c: 0 },
      { q: 'Design is finished when…', a: ['It feels right to live in', 'Money runs out', 'Every corner is full'], c: 0 },
    ] },
  { id: 'logistics', icon: '💼', name: 'Logistics Diploma', cost: 400,
    blurb: 'The cashier trade, end to end. Perk: cashier jobs pay +25% wages.',
    lessons: [
      { teach: 'Shops with a green "WE\'RE HIRING!" board need a cashier. Walk up to the owner inside and ask.', task: 'Get hired at any shop', ev: 'hired', goal: 1 },
      { teach: 'Browsers with a 💭 bubble need help. On shift, tap 🔎 See what they need — then find it.', task: 'Help 3 customers find their item', ev: 'helped', goal: 3 },
      { teach: 'Buyers pay at the counter. Ring them up from BEHIND it — and count the change carefully.', task: 'Give perfect change 3 times', ev: 'change', goal: 3 },
      { teach: 'A full till is a robbery waiting to happen. Bank it in the safe (back-right corner).', task: 'Stash 200 🪙 in the safe (across any shifts)', ev: 'stashed', goal: 200 },
    ],
    exam: [
      { q: 'The bill is 7🪙, they hand you 10🪙. Change?', a: ['3🪙', '7🪙', 'None'], c: 0 },
      { q: 'Their bubble shows 🍞. You bring…', a: ['The bread', 'Anything nearby', 'The most expensive thing'], c: 0 },
      { q: 'The shop opens at…', a: ['9am sharp — late costs pay', 'Noon', 'Whenever'], c: 0 },
      { q: 'The day\'s takings belong…', a: ['In the safe', 'In your pocket', 'On the counter'], c: 0 },
      { q: 'Three strikes means…', a: ['You\'re fired', 'A holiday', 'A raise'], c: 0 },
    ] },
  { id: 'park', icon: '🌳', name: 'Park Ranger Course', cost: 350,
    blurb: 'Care for the town\'s wild side. Perk: park jobs (mice & birds) pay +25%.',
    lessons: [
      { teach: 'The park overruns with mice — a ranger keeps the balance. Pounce with the 🦘 Jump button.', task: 'Catch 3 mice in the park', ev: 'mice', goal: 3 },
      { teach: 'Birds too — catch them and decide their fate with Bert yourself.', task: 'Catch 2 birds', ev: 'bird', goal: 2 },
      { teach: 'A ranger knows every corner of town — even the bins. Some hold a snack.', task: 'Rummage through 3 trash bins', ev: 'searchBin', goal: 3 },
      { teach: 'The strays are the park\'s soul. Befriend them.', task: 'Play with 2 street cats', ev: 'playCat', goal: 2 },
      { teach: 'Last lesson: rangers rest too. Take a seat and watch the town go by.', task: 'Sit on a bench', ev: 'sitBench', goal: 1 },
    ],
    exam: [
      { q: 'The park is overrun with mice. A ranger…', a: ['Hunts to keep balance', 'Ignores it', 'Paves the park'], c: 0 },
      { q: 'Litter belongs…', a: ['In the bins', 'In the pond', 'Under a bench'], c: 0 },
      { q: 'A stray cat approaches you. You…', a: ['Play with it', 'Chase it off', 'Report it'], c: 0 },
      { q: 'Who is the park FOR?', a: ['Everyone in town', 'Only cats', 'Only the mayor'], c: 0 },
      { q: 'A tired ranger should…', a: ['Rest on a bench', 'Keep running forever', 'Go home and quit'], c: 0 },
    ] },
  { id: 'business', icon: '📊', name: 'Business Degree', cost: 800,
    blurb: 'How to build an empire — REQUIRED to buy businesses; self-run tills fill 25% faster.',
    lessons: [
      { teach: 'Know the market first: the 📊 dashboard lists every business in town and what it earns.', task: 'Open the 📊 Business dashboard', ev: 'openDash', goal: 1, glow: 'business-btn' },
      { teach: 'Capital comes from WORK. Odd jobs around town are your seed money.', task: 'Earn from 2 minigame jobs', ev: 'minigame', goal: 2 },
      { teach: 'An investor needs savings — the café alone costs 40,000. Start the habit now.', task: 'Hold 1,000 🪙 in your pocket', ev: 'check', check: () => state.coins >= 1000 },
    ],
    exam: [
      { q: 'A business with NO staff earns…', a: ['Nothing by itself', 'Full income', 'Double'], c: 0 },
      { q: 'Every worker costs 1300/day. Hire when…', a: ['Income can carry the wages', 'Whenever', 'Never'], c: 0 },
      { q: 'The factory produces only with…', a: ['10+ workers', '1 worker', 'No workers'], c: 0 },
      { q: 'You can\'t pay wages. The government…', a: ['Seizes a business', 'Sends a card', 'Pays them for you'], c: 0 },
      { q: 'Good reputation comes from…', a: ['Jobs created & good deeds', 'Shouting', 'Hoarding coins'], c: 0 },
    ] },
  { id: 'planning', icon: '🏗️', name: 'Town Planning', cost: 1000, gate: 'mayor',
    blurb: 'For Mayors: build a town people love. Perk: planner pieces cost 10% less.',
    lessons: [
      { teach: 'The 🏗️ planner is your drawing board. Greenery first — a town breathes through its trees.', task: 'Place 2 pieces with the planner (trees, benches…)', ev: 'place', goal: 2 },
      { teach: 'Roads decide where life flows. Extend yours — tiles snap to the grid.', task: 'Extend the road by 2 tiles', ev: 'road', goal: 2 },
      { teach: 'Now the real thing: housing. A new home takes in the homeless first, then draws newcomers.', task: 'Place (and pay for) 1 house', ev: 'placeHouse', goal: 1 },
      { teach: 'Demolition is part of planning too — but rubble left behind makes the town ugly and angry.', task: 'Demolish a structure, then pay to clear the rubble', ev: 'rubble', goal: 1 },
    ],
    exam: [
      { q: 'You demolish a home. The people inside…', a: ['Become homeless — house them', 'Vanish', 'Pay you'], c: 0 },
      { q: 'A new house takes in first…', a: ['The homeless', 'Tourists', 'Nobody'], c: 0 },
      { q: 'Roads should…', a: ['Connect homes to shops', 'Loop nowhere', 'Cross the park'], c: 0 },
      { q: 'Rubble left on a street…', a: ['Angers the town — clear it', 'Is decoration', 'Attracts birds'], c: 0 },
      { q: 'A Mayor builds with…', a: ['Their own coins', 'Tax money', 'IOUs'], c: 0 },
    ] },
  { id: 'civics', icon: '🏛️', name: 'Civics & Law', cost: 1500, gate: 'civics',
    blurb: 'Government, law & leadership — REQUIRED to run for President. For proven Mayors only.',
    lessons: [
      { teach: 'A leader knows their duties. Your 🗳️ panel lists the promises you made this town.', task: 'Open your 🗳️ panel and read your duties', ev: 'openPolitics', goal: 1, glow: 'politics-btn' },
      { teach: 'A Mayor leads by example — building for the people with their OWN coins, not the town\'s.', task: 'Build something for the town (any planner piece)', ev: 'place', goal: 1 },
      { teach: 'Now study the law: two case files are in your 📬 mail. Read what corruption costs.', task: 'Read 2 letters in your 📬 inbox', ev: 'readMail', goal: 2, glow: 'inbox-btn',
        mail: [
          { from: '🏫 Town School', subj: '📎 Case file 1: the Mayor who took', body: 'Mayor Grubb "borrowed" from the treasury for a golden statue of himself. The town\'s anger grew every single day — anger never cools while stolen money is unreturned. He repaid nothing. The police came at dawn.<br><br><i>The lesson: corruption NEVER fades on its own. Only paying it back cools the town.</i>' },
          { from: '🏫 Town School', subj: '📎 Case file 2: the President who gave', body: 'President Willow spent every tax coin on streets, police, parks and homes. Prosperity rose, tax revenue rose with it, and she governed for life, beloved.<br><br><i>The lesson: public money spent on the PUBLIC returns multiplied — in prosperity and in trust.</i>' },
        ] },
    ],
    exam: [
      { q: 'The treasury belongs to…', a: ['The people', 'The President', 'The bank'], c: 0 },
      { q: 'Pocketing tax money is…', a: ['Corruption — it never fades alone', 'A perk', 'Fine if small'], c: 0 },
      { q: 'Public anger at 100 means…', a: ['Jail, and you lose everything', 'A stern letter', 'Nothing'], c: 0 },
      { q: 'The ONLY cure for corruption is…', a: ['Repaying from your own pocket', 'Waiting', 'A parade'], c: 0 },
      { q: 'City mail asks for hospital funds. You…', a: ['Pay it from tax', 'Ignore it', 'Frame it'], c: 0 },
      { q: 'A President stays in office by…', a: ['Serving the people well', 'Hiding', 'Buying votes'], c: 0 },
    ] },
];
function schoolCourse(id) { return SCHOOL_COURSES.find(c => c.id === id); }
function schoolHas(id) { return !!(state.school && (state.school.done || []).includes(id)); }
function schoolStudying() { return state.school && state.school.cur; }
function schoolState() {
  const sc = state.school || (state.school = { done: [], cur: null, lesson: 0, prog: 0, examLock: 0 });
  if (sc.curDone) { delete sc.curDone; sc.lesson = sc.lesson || 0; sc.prog = sc.prog || 0; }   // migrate old day-based saves
  if (sc.lesson == null) sc.lesson = 0;
  if (sc.prog == null) sc.prog = 0;
  return sc;
}

// ── Recap lessons (re-readable after graduating — the 📖 button) ──
const SCHOOL_LESSONS = {
  logistics: [
    { text: '💼 <b>Logistics recap:</b> apply at a <b>"WE\'RE HIRING!"</b> shop, open at <b>9am</b>, help 💭 browsers, ring up buyers with the <b>right change</b>, 🏦 stash the takings.', glow: null },
    { text: '🎓 Your diploma earns <b>+25% wages</b> at every cashier job. Work 5 clean shifts and ask for a raise! 💰', glow: null },
  ],
  business: [
    { text: '📊 <b>Business recap:</b> you may now <b>BUY</b> the ☕ café, 🥐 bakery, 🏬 market & 🏭 factory from the 📊 dashboard.', glow: 'business-btn' },
    { text: '🔑 No staff = no passive income — run the till yourself, or <b>hire workers</b> (1300/day each). The 🏭 factory needs <b>10+</b>. Your self-run tills fill <b>25% faster</b> now.', glow: null },
  ],
  civics: [
    { text: '🏛️ <b>Civics recap:</b> public money belongs to the PUBLIC. Corruption never fades and feeds the town\'s 😡 anger daily; anger at 100 = <b>jail</b>. Repay what\'s taken.', glow: null },
    { text: '🎓 You\'re qualified for the <b>presidential race</b> — register in the 🗳️ panel and win the debate. Lead with kindness. 🐾', glow: 'politics-btn' },
  ],
  humanity: [
    { text: '❤️ <b>Humanity recap:</b> kindness pays in reputation, not coins — and yours now counts <b>DOUBLE</b>. Keep freeing cats, running errands, walking kids to the park. 🐾', glow: null },
  ],
  art: [
    { text: '🎨 <b>Art & Design recap:</b> your eye is trained — the 🛋️ Home Store now sells to you at <b>20% off</b>. Make every room feel like home.', glow: null },
  ],
  park: [
    { text: '🌳 <b>Park Ranger recap:</b> the park is yours to keep — mice & bird work now pays <b>+25%</b>. Balance, bins, and befriend the strays.', glow: null },
  ],
  planning: [
    { text: '🏗️ <b>Town Planning recap:</b> greenery, roads, homes — and never leave rubble. Planner pieces now cost you <b>10% less</b>.', glow: null },
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

// ── Course gates ──
function civicsOffered() {   // Civics is only taught to a Mayor who has met the town's goals (politics.js)
  if (state.politics && state.politics.phase === 'president') return true;
  return (typeof mayorGoalsMet === 'function') && state.politics && state.politics.phase === 'mayor' && mayorGoalsMet();
}
function courseOffered(c) {
  if (c.gate === 'civics') return civicsOffered();
  if (c.gate === 'mayor') return state.politics && (state.politics.phase === 'mayor' || state.politics.phase === 'president');
  return true;
}

// ── The 🎓 School panel ──
let _exam = null;   // transient exam progress { i, score } — an exam is a single sitting
function openSchool() {
  if (typeof sfx === 'function') sfx('ui');
  state.uiOpen = true;
  renderSchool();
  document.getElementById('school').classList.add('show');
}
function closeSchool() { state.uiOpen = false; _exam = null; document.getElementById('school').classList.remove('show'); }

function renderSchool() {
  const sc = schoolState();
  const cur = sc.cur ? schoolCourse(sc.cur) : null;
  let h = '';

  // ── mid-exam: one question at a time (options shuffled) ──
  if (_exam && cur) {
    const q = cur.exam[_exam.i];
    const opts = q.a.map((t, k) => ({ t, ok: k === q.c })).sort(() => Math.random() - 0.5);
    h += `<div class="biz-note">🎓 <b>FINAL EXAM — ${cur.name}</b> · Question ${_exam.i + 1}/${cur.exam.length} · ${_exam.score} right so far</div>`;
    h += `<div class="pol-q">${q.q}</div>`;
    opts.forEach(o => { h += `<button class="pol-opt" onclick="schoolExamAnswer(${o.ok})">${o.t}</button>`; });
    document.getElementById('school-body').innerHTML = h;
    return;
  }

  h += `<div class="modal-sub">Learn by DOING: each lesson gives you a real task in town — finish it and the next unlocks. Pass every lesson, sit the final exam, earn your degree. 🪙 ${state.coins}</div>`;

  // ── current studies banner ──
  if (cur) {
    const L = cur.lessons[sc.lesson];
    if (L) {
      const prog = L.goal > 1 ? ` <b>(${Math.min(sc.prog, L.goal)}/${L.goal})</b>` : '';
      h += `<div class="biz-note">📖 <b>${cur.name}</b> — lesson ${sc.lesson + 1}/${cur.lessons.length}<br>📝 <b>Your task:</b> ${L.task}${prog}</div>`;
    } else {
      // all lessons done → the exam
      const locked = (state.dayCount || 0) < (sc.examLock || 0);
      if (locked) h += `<div class="biz-note">🎓 <b>${cur.name}</b> — you failed the exam. Ms. Plume: "Sleep on it, little one." Retake <b>tomorrow</b>.</div>`;
      else h += `<div class="biz-note">🎓 <b>${cur.name}</b> — every lesson passed! One thing left…</div><button class="pol-primary" onclick="startSchoolExam()">📝 Sit the FINAL EXAM (${cur.exam.length} questions · pass ${Math.ceil(cur.exam.length * 0.8)})</button>`;
    }
  }

  // ── course grid ──
  h += `<div class="school-grid">`;
  SCHOOL_COURSES.forEach(c => {
    const done = schoolHas(c.id);
    const locked = !done && !courseOffered(c);
    let foot;
    if (done) foot = `<div class="rescue-tag freed">🎓 Graduated</div><button class="cust-pat" onclick="reviewLesson('${c.id}')">📖 Recap</button>`;
    else if (sc.cur === c.id) foot = `<div class="rescue-tag">📖 Studying — lesson ${Math.min(sc.lesson + 1, c.lessons.length)}/${c.lessons.length}</div><button class="cust-pat" onclick="showCurrentLesson()">📝 Show my task</button>`;
    else if (locked) foot = `<div class="school-locked">${c.gate === 'civics' ? '🔒 For proven Mayors only' : '🔒 For Mayors only'}</div>`;
    else if (sc.cur) foot = `<div class="school-locked">One course at a time…</div>`;
    else foot = `<button class="rescue-buy" ${state.coins >= c.cost ? '' : 'disabled'} onclick="enrollCourse('${c.id}')">Enroll · ${c.cost} 🪙 · ${c.lessons.length} lessons</button>`;
    h += `<div class="school-card"><div class="school-icon">${c.icon}</div><div class="cat-name">${c.name}</div><div class="school-blurb">${c.blurb}</div>${foot}</div>`;
  });
  h += `</div>`;
  if ((sc.done || []).length >= SCHOOL_COURSES.length) h += `<div class="biz-note">👑 Every degree earned — the town calls you <b>Professor Paws</b>!</div>`;
  document.getElementById('school-body').innerHTML = h;
}

function enrollCourse(id) {
  const c = schoolCourse(id); if (!c) return;
  const sc = schoolState();
  if (sc.cur || schoolHas(id)) return;
  if (!courseOffered(c)) { showNotif('🔒 That course isn\'t offered to you yet.'); return; }
  if (state.coins < c.cost) { showNotif('Not enough coins for the tuition…'); return; }
  state.coins -= c.cost; document.getElementById('coin-count').textContent = state.coins;
  sc.cur = id; sc.lesson = 0; sc.prog = 0; sc.examLock = 0;
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif('📖 Enrolled: ' + c.name + '! Lesson 1 begins now.');
  presentLesson(c, 0);
  renderSchool();
  if (typeof saveGame === 'function') saveGame();
}

// Show a lesson as a teaching card with the task attached (re-summonable from the panel)
function presentLesson(c, i) {
  const L = c.lessons[i]; if (!L) return;
  if (L.mail && typeof inboxAdd === 'function') L.mail.forEach(m => inboxAdd(m.from, m.subj, m.body));   // case-study letters etc.
  if (typeof showTutorial === 'function') {
    showTutorial('sc_' + c.id + '_' + i, [{
      text: `🏫 <b>${c.name} — lesson ${i + 1}/${c.lessons.length}:</b> ${L.teach}<br><br>📝 <b>Your task:</b> ${L.task}`,
      glow: L.glow || null,
    }], true);
  }
}
function showCurrentLesson() {
  const sc = schoolState(); if (!sc.cur) return;
  const c = schoolCourse(sc.cur);
  closeSchool();
  presentLesson(c, sc.lesson);
}

// ── The task engine: game code reports events; the current lesson listens ──
function schoolEvent(ev, n) {
  const sc = state.school; if (!sc || !sc.cur) return;
  const c = schoolCourse(sc.cur); if (!c) return;
  const L = c.lessons[sc.lesson];
  if (!L || L.ev !== ev) return;
  sc.prog = (sc.prog || 0) + (n || 1);
  if (sc.prog < (L.goal || 1)) {
    showNotif('📗 ' + L.task + ' — ' + Math.min(sc.prog, L.goal) + '/' + L.goal);
    if (typeof saveGame === 'function') saveGame();
    return;
  }
  schoolLessonPassed(c, sc);
}
// 'check'-type lessons (e.g. "hold 1,000 coins") — polled from the game loop
let _scTick = 0;
function schoolTick() {
  if ((_scTick = (_scTick + 1) % 120) !== 0) return;   // ~every 2s
  const sc = state.school; if (!sc || !sc.cur) return;
  const c = schoolCourse(sc.cur); if (!c) return;
  const L = c.lessons[sc.lesson];
  if (L && L.check && L.check()) schoolLessonPassed(c, sc);
}
function schoolLessonPassed(c, sc) {
  sc.lesson++; sc.prog = 0;
  if (typeof sfx === 'function') sfx('upgrade');   // 🔔 the school bell
  if (sc.lesson >= c.lessons.length) {
    showNotif('🔔 All ' + c.lessons.length + ' lessons passed! Return to the 🏫 school for your FINAL EXAM.');
  } else {
    showNotif('🔔 Lesson passed! (' + sc.lesson + '/' + c.lessons.length + ') — the next begins…');
    setTimeout(() => presentLesson(c, sc.lesson), 900);
  }
  if (typeof saveGame === 'function') saveGame();
}

// ── The final exam ──
function startSchoolExam() {
  const sc = schoolState(); if (!sc.cur) return;
  if ((state.dayCount || 0) < (sc.examLock || 0)) return;
  _exam = { i: 0, score: 0 };
  renderSchool();
}
function schoolExamAnswer(ok) {
  const sc = schoolState(); const c = sc.cur && schoolCourse(sc.cur);
  if (!_exam || !c) return;
  if (ok) { _exam.score++; if (typeof sfx === 'function') sfx('coin'); }
  else if (typeof sfx === 'function') sfx('sad');
  _exam.i++;
  if (_exam.i >= c.exam.length) {
    const need = Math.ceil(c.exam.length * 0.8);
    if (_exam.score >= need) graduateCourse(c, _exam.score);
    else {
      sc.examLock = (state.dayCount || 0) + 1;
      showNotif('📕 ' + _exam.score + '/' + c.exam.length + ' — not quite. Retake the exam tomorrow.');
      if (typeof sfx === 'function') sfx('sad');
      if (typeof saveGame === 'function') saveGame();
    }
    _exam = null;
  }
  renderSchool();
}

function graduateCourse(c, score) {
  const sc = schoolState();
  (sc.done = sc.done || []).push(c.id);
  sc.cur = null; sc.lesson = 0; sc.prog = 0; sc.examLock = 0;
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif('🎓 DEGREE EARNED: ' + c.name + '!  (' + score + '/' + c.exam.length + ' on the exam)');
  if (typeof spawnHeart === 'function') { spawnHeart(); setTimeout(spawnHeart, 250); setTimeout(spawnHeart, 500); }
  if (c.id === 'logistics' && state.job) {   // your diploma raises your current wage right away
    state.job.wage = Math.round(state.job.wage * 1.25);
    showNotif('💼 Your Logistics Diploma earned you a pay bump — now ' + state.job.wage + ' 🪙/day!');
  }
  if (c.id === 'civics') showDialogue('🎓 The Professor', 'Congratulations, ' + state.catName + ' — you understand the law of the land now. The presidency is within your reach. Make us proud.', 6000);
  if (typeof inboxAdd === 'function') inboxAdd('🏫 Town School', '🎓 Diploma awarded: ' + c.name,
    `Dear ${state.catName} Miller,<br><br>Having passed every lesson and the final examination (<b>${score}/${c.exam.length}</b>), the school proudly certifies your <b>${c.name}</b>. It has been added to your 📄 CV (see the 📊 dashboard) — and its benefits are yours for life.<br><br>— Ms. Plume, Head Teacher`);
  if ((sc.done || []).length >= SCHOOL_COURSES.length) {
    showDialogue('🏫 Ms. Plume', 'Every single degree… in all my years! The town has a new title for you: PROFESSOR PAWS. 🎓🐾', 7000);
    if (typeof inboxAdd === 'function') inboxAdd('🏫 Town School', '👑 A title: Professor Paws', `Dear ${state.catName},<br><br>Seven courses. Seven degrees. The school has never seen its like. By unanimous vote of the staff room you are henceforth <b>Professor Paws</b>. Wear it with pride.<br><br>— The whole school 🎓`);
  }
  if (typeof showTutorial === 'function' && SCHOOL_LESSONS[c.id]) setTimeout(() => showTutorial('lesson_' + c.id, SCHOOL_LESSONS[c.id], true), 1200);   // the recap
  if (typeof saveGame === 'function') saveGame();
}

// Kept for the daily tick (old saves called this to graduate by days — lessons replaced that)
function processSchoolDay() {}

function reviewLesson(id) {   // re-read a recap from the school panel anytime
  if (SCHOOL_LESSONS[id] && typeof showTutorial === 'function') { closeSchool(); showTutorial('lesson_' + id, SCHOOL_LESSONS[id], true); }
}
