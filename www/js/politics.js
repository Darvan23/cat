// ── The Presidency Arc ──────────────────────────────────────────────────────────
// Once your cat has earned enough and helped the town, people take notice. Campaign
// posters go up, you register to run, face two rivals in policy debates, and — if the
// people back you — become President and fund homes for struggling families.

const FAME_GOAL = 500;     // cumulative coins EARNED before the town will back a run
const MAYOR_FEE = 100;     // registration fee for the MAYOR's race — the first rung of the ladder
const ENTRY_FEE = 250;     // registration fee for the presidential race
const WIN_APPROVAL = 8;    // approval (out of 10) needed to win the election — deliberately hard
const HOME_COST = 80000;   // a public home is a real build — funded from your fortune (later: tax money)

// ── The Mayor's to-do list: prove yourself before the presidency is even possible ──
const MAYOR_GOALS = [
  { id: 'jobs',  label: '💼 Bring jobs to town (15+ created)',       need: 15, count: () => (state.biz && state.biz.jobsCreated) || 0 },
  { id: 'homes', label: '🏠 Build homes (2+ built or bought)',        need: 2,  count: () => (typeof housesBuiltCount === 'function') ? housesBuiltCount() : 0 },
  { id: 'cats',  label: '🐾 Help the cats (5+ freed or created)',     need: 5,  count: () => ((state.freed || []).length + (state.createdCats || []).length) },
  { id: 'clean', label: '🏚️ Nobody homeless in town',                need: 0,  count: () => (state.homelessCount || 0), invert: true },
];
function mayorGoalState() { return MAYOR_GOALS.map(g => ({ ...g, cur: g.count(), ok: g.invert ? g.count() <= g.need : g.count() >= g.need })); }
function mayorGoalsMet() { return mayorGoalState().every(g => g.ok); }

// The rivals you debate against (shown answering each question before your turn)
const RIVALS = [
  { name: 'Mayor Grubb', emoji: '🤵', approval: 6 },
  { name: 'Ada Fairweather', emoji: '👩‍🌾', approval: 7 },
];

// Debate questions — the rivals answer first, then it's your turn.
// Each option carries an approval value: +2 great, +1 decent, 0/-1 poor.
const DEBATE_QS = [
  {
    q: 'The town has spare money this year. What comes first?',
    grubb: 'A grand statue of me in the square, naturally.',
    ada: 'Fix the potholes on Main Street — everyone uses them.',
    options: [
      { t: 'Warm meals & shelter for families who are struggling', v: 2 },
      { t: 'Repair the roads and the old fountain', v: 1 },
      { t: 'A lavish gala for the town’s wealthiest', v: -1 },
    ],
  },
  {
    q: 'Rent is rising and some families can barely keep their homes. Your plan?',
    grubb: 'If they can’t pay, they can leave. Simple.',
    ada: 'A small fund to help during the hard months.',
    options: [
      { t: 'Build affordable homes the town owns', v: 2 },
      { t: 'Cap how fast landlords can raise the rent', v: 1 },
      { t: 'Nothing — the market sorts itself out', v: -1 },
    ],
  },
  {
    q: 'The old cat shelter is overflowing. What will you do?',
    grubb: 'Shut it down. Cats don’t vote.',
    ada: 'Ask for donations at the summer fair.',
    options: [
      { t: 'Fund the shelter and a free adoption drive', v: 2 },
      { t: 'Rally volunteers to foster the cats', v: 1 },
      { t: 'Ignore it — not my problem', v: -1 },
    ],
  },
  {
    q: 'A big company wants to pave the park for a car lot. Do you allow it?',
    grubb: 'Pave it! Think of the money in my— the town’s pocket.',
    ada: 'Maybe just half of it…?',
    options: [
      { t: 'No — keep the park green for everyone', v: 2 },
      { t: 'Only if they plant twice as many trees elsewhere', v: 1 },
      { t: 'Yes, take the money', v: -1 },
    ],
  },
  {
    q: 'Final question: why should the town trust a cat as President?',
    grubb: 'They shouldn’t! I’ve been Mayor for thirty years!',
    ada: 'Well… the little one does work awfully hard.',
    options: [
      { t: 'Because I’ve spent every day helping this town, paw by paw', v: 2 },
      { t: 'Because I’ll listen to everyone, big and small', v: 1 },
      { t: 'Because I’m the most famous cat around', v: 0 },
    ],
  },
];

// Empty lots (south of the residential streets) for the public-housing programme
const PROGRAM_LOTS = [
  [-28, -52], [-12, -52], [4, -52], [20, -52], [36, -52],
  [-20, -64], [-4, -64], [12, -64], [28, -64],
];

// Transient debate progress (not saved — a debate is a single sitting)
let debate = null;
let campaignSign = null;

function makeCampaignTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 168;
  const g = c.getContext('2d');
  g.fillStyle = '#2a4a8a'; g.fillRect(0, 0, 256, 168);
  g.strokeStyle = '#f0d060'; g.lineWidth = 8; g.strokeRect(10, 10, 236, 148);
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = 'bold 32px Georgia'; g.fillText('VOTE', 128, 44);
  g.font = 'bold 40px Georgia'; g.fillText('🐾 ' + (state.catName || 'Whiskers'), 128, 92);
  const office = (state.politics && (state.politics.phase === 'mayor' || state.politics.phase === 'running')) ? 'for President' : 'for Mayor';
  g.font = 'italic 24px Georgia'; g.fillText(office, 128, 138);
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4; return tex;
}
// Build the campaign poster in the town square the first time it's needed
function ensureCampaignPoster() {
  if (campaignSign) { campaignSign.visible = true; return; }
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.4, 0.14), new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.8 }));
  post.position.y = 1.2; post.castShadow = true; g.add(post);
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, 0.1), new THREE.MeshStandardMaterial({ map: makeCampaignTexture(), roughness: 0.6 }));
  board.position.y = 2.8; board.castShadow = true; g.add(board);
  g.position.set(-11, 0, 13.5); g.rotation.y = 0.35;
  scene.add(g);
  campaignSign = g;
}

// Fame check — called from updateFamilyStatus after every earn/give
function checkPolitics() {
  const p = state.politics;
  if (p.phase === 'none' && state.earned >= FAME_GOAL) {
    p.phase = 'eligible';
    ensureCampaignPoster();
    updatePoliticsBtn();
    if (typeof sfx === 'function') sfx('upgrade');
    showNotif('🗳️ The town wants you to run for MAYOR — the first step on the road to the presidency!');
    setTimeout(() => showDialogue('📣 Townsfolk', `Everyone’s talking about you, ${state.catName}! You should run for Mayor — and who knows how far you could go. Tap the 🗳️ button.`, 5600), 900);
    if (typeof inboxAdd === 'function') inboxAdd('🏛️ Town Council', 'An invitation: run for Mayor!',
      `Dear ${state.catName} Miller,<br><br>Your hard work has not gone unnoticed. The council formally invites you to <b>stand for Mayor</b>.<br><br>Open the 🗳️ panel and register (${MAYOR_FEE} 🪙). Serve the town well, earn a Civics degree at the 🏫 school, and one day the <b>presidency</b> could be yours.<br><br>— The Town Council`);
    if (typeof saveGame === 'function') saveGame();
  }
}

// Show/hide the 🗳️ HUD button depending on the campaign phase
function updatePoliticsBtn() {
  const btn = document.getElementById('politics-btn');
  if (!btn) return;
  btn.style.display = (state.politics.phase !== 'none') ? 'flex' : 'none';
}

function openPolitics() {
  if (typeof sfx === 'function') sfx('ui');
  state.uiOpen = true;
  renderPolitics();
  document.getElementById('politics').classList.add('show');
}
function closePolitics() {
  state.uiOpen = false;
  debate = null;
  document.getElementById('politics').classList.remove('show');
}

function renderPolitics() {
  const p = state.politics;
  const body = document.getElementById('politics-body');
  const title = document.getElementById('politics-title');
  let h = '';
  if (debate) {                       // ── mid-debate: a real STAGE — podiums, rivals, a reacting crowd ──
    title.textContent = `🗣️ The Debate  ·  Q${debate.i + 1}/${DEBATE_QS.length}`;
    const q = DEBATE_QS[debate.i];
    h += `<canvas id="debate-stage" width="560" height="210"></canvas>`;
    h += `<div class="pol-q">${q.q}</div>`;
    if (debate.react == null) {
      h += `<div class="pol-rival">${RIVALS[0].emoji} <b>${RIVALS[0].name}:</b> “${q.grubb}”</div>`;
      h += `<div class="pol-rival">${RIVALS[1].emoji} <b>${RIVALS[1].name}:</b> “${q.ada}”</div>`;
      h += `<div class="pol-you">Your answer:</div>`;
      q.options.forEach((o, i) => { h += `<button class="pol-opt" onclick="debateAnswer(${i})">${o.t}</button>`; });
    } else {
      const line = debate.react >= 2 ? '👏 The crowd ROARS — that landed!' : debate.react >= 1 ? '🙂 A warm round of applause.' : '😬 Murmurs… that didn\'t go over well.';
      h += `<div class="pol-you">${line}</div>`;
    }
    body.innerHTML = h;
    drawDebateStage();
    return;
  }
  if (p.phase === 'president') {       // ── you won: govern the town ──
    title.textContent = '👑 President ' + state.catName;
    const g = state.gov;
    const hp = Math.round(g.happiness);
    const cor = Math.round(g.corruption || 0);
    const ang = Math.round(g.anger || 0);
    const outstanding = Math.max(0, (g.spentSelf || 0) - (g.repaid || 0));
    h += `<div class="gov-top">
      <div class="gov-treasury">🏛️ Treasury<br><b>${fmtBig(g.treasury)} 🪙</b></div>
      <div class="gov-happy">🌟 Prosperity<br><b>${happyWord(hp)}</b><div class="gov-bar"><div class="gov-fill" style="width:${hp}%;background:${hp >= 50 ? '#5fbf6a' : hp >= 25 ? '#d8a12a' : '#c8443a'}"></div></div></div>
    </div>`;
    h += `<div class="gov-corrupt">🚨 Corruption <b>${cor}%</b> <span class="gov-hint">(never fades on its own)</span><div class="gov-bar"><div class="gov-fill" style="width:${cor}%;background:#c8443a"></div></div></div>`;
    h += `<div class="gov-anger">😡 Public anger <b id="anger-pct">${ang}%</b> <span class="gov-hint">— reaches 100 = jail</span><div class="gov-bar"><div class="gov-fill" id="anger-fill" style="width:${ang}%;background:${ang >= 70 ? '#c8443a' : ang >= 40 ? '#d8752a' : '#7a8a5a'}"></div></div></div>`;
    if (outstanding > 0) {
      h += `<button class="gov-repay" ${state.coins > 0 ? '' : 'disabled'} onclick="repayFunds()">🙏 Return stolen funds — you owe <b>${fmtBig(outstanding)}</b> · pay back from your own coins</button>`;
    }
    h += `<div class="pol-stat">🏠 Housed: <b>${p.homesBuilt}</b> · 🪙 Coins: <b>${fmtBig(state.coins)}</b> · 💼 Salary <b>+${fmtBig(typeof PRESIDENT_SALARY !== 'undefined' ? PRESIDENT_SALARY : 8000)}/day</b></div>`;
    h += `<div class="pol-note">Three separate things: <b>🌟 Prosperity</b> (run the town well), <b>🚨 Corruption</b> (money you pocket — it never fades by itself), and <b>😡 Anger</b> (climbs every day you stay corrupt, no matter how many parks you build). Anger at 100 → the police jail you. The <b>only</b> way to cut corruption &amp; cool the anger is to give the money back.</div>`;
    // city mail
    if (g.mail && !g.mail.paid) {
      h += `<div class="gov-mail">📬 <b>City mail:</b> ${g.mail.text}<div class="gov-mailbtns"><button onclick="payMail()">Pay ${fmtBig(g.mail.cost)} 🪙</button><button class="ghost" onclick="ignoreMail()">Ignore</button></div></div>`;
    }
    // build public homes from the treasury
    const canBuild = g.treasury >= HOME_COST;
    h += `<button class="pol-primary" ${canBuild ? '' : 'disabled'} onclick="openPlannerForHome()">🏗️ Open the Town Planner — build homes & more (tax or own coins)</button>`;
    // public works — enterable buildings that employ townsfolk & pay into the treasury
    if (typeof CIVICS !== 'undefined') {
      h += `<div class="gov-section">🏛️ Public works — create jobs & bring in daily income (walk up & enter them):</div><div class="gov-actions">`;
      CIVICS.forEach(c => {
        const owned = ownsCivic(c.id);
        h += `<button ${owned ? 'class="gov-owned" disabled' : (g.treasury >= c.cost ? '' : 'disabled')} onclick="buildCivic('${c.id}')">${c.icon} ${owned ? c.name + ' ✓' : 'Build ' + c.name}<small>${owned ? '+' + c.jobs + ' jobs · +' + fmtBig(c.gov) + '/day' : fmtBig(c.cost) + ' tax · +' + c.jobs + ' jobs · +' + c.happy + '😀'}</small></button>`;
      });
      h += `</div>`;
    }
    // help the country (raises happiness)
    h += `<div class="gov-section">Help the country — the people love it:</div><div class="gov-actions">`;
    GOV_ACTIONS.forEach(a => { h += `<button ${g.treasury >= a.cost ? '' : 'disabled'} onclick="govAction('${a.id}')">${a.name}<small>${fmtBig(a.cost)} · +${a.happy}😀</small></button>`; });
    h += `</div>`;
    // the corrupt option
    h += `<div class="gov-section">…or line your own pockets (risky):</div>`;
    h += `<button class="gov-lux" ${g.treasury >= GOV_LUXURY.cost ? '' : 'disabled'} onclick="govLuxury()">${GOV_LUXURY.name} — ${fmtBig(GOV_LUXURY.cost)} tax → +${fmtBig(GOV_LUXURY.toCoins)} coins (🚨 +${GOV_LUXURY.corrupt} corruption)</button>`;
    h += `<div class="pol-note">Stay clean and you stay President forever. Let anger reach 100 — through corruption you never repay, or a neglected, furious town — and the police jail you and you lose everything.</div>`;
    body.innerHTML = h;
    return;
  }
  if (p.phase === 'running') {         // ── registered: ready to debate ──
    title.textContent = '🗳️ Your Campaign';
    h += `<div class="pol-lead">You’re in the race! Win the policy debate against the field to be elected. You’ll need <b>${WIN_APPROVAL}/10</b> approval — every answer counts.</div>`;
    h += `<div class="pol-stat">Your rivals: ${RIVALS.map(r => r.emoji + ' ' + r.name).join('  ·  ')}</div>`;
    h += `<button class="pol-primary" onclick="startDebate()">🗣️ Enter the Debate</button>`;
    body.innerHTML = h;
    return;
  }
  if (p.phase === 'mayor') {           // ── you're the Mayor: prove yourself, study, THEN run for President ──
    title.textContent = '🎩 Mayor ' + state.catName;
    h += `<div class="pol-lead">You run this town now — with your own paws and your own coins (the 🏗️ planner is open to you; tax money is for Presidents). Deliver for the people and the big race opens up.</div>`;
    h += `<div class="gov-section">Your promises to the town:</div>`;
    mayorGoalState().forEach(g => {
      h += `<div class="mayor-goal ${g.ok ? 'ok' : ''}">${g.ok ? '✅' : '⬜'} ${g.label} <span class="mayor-count">${g.invert ? (g.cur + ' homeless') : (g.cur + '/' + g.need)}</span></div>`;
    });
    if (!mayorGoalsMet()) {
      h += `<div class="pol-note">Create jobs (buy businesses, hire staff), build & buy homes, free shelter cats, and make sure nobody sleeps rough. Then the 🏫 Town School will teach you Civics & Law.</div>`;
    } else if (!(typeof schoolHas === 'function' && schoolHas('civics'))) {
      h += `<div class="pol-note">🎓 The town believes in you! Now <b>study Civics &amp; Law at the 🏫 Town School</b> (east of the square) to qualify for the presidential race.</div>`;
      if (typeof schoolStudying === 'function' && schoolStudying() === 'civics') h += `<div class="pol-note">📖 You're enrolled — graduation is coming up. Keep at it!</div>`;
    } else {
      const can = state.coins >= ENTRY_FEE;
      h += `<div class="pol-note">🎓 Goals met, degree earned — the presidency awaits.</div>`;
      h += `<button class="pol-primary" ${can ? '' : 'disabled'} onclick="registerRun()">📝 Register for the Presidential Race — ${ENTRY_FEE} 🪙</button>`;
      if (!can) h += `<div class="pol-note">You need ${ENTRY_FEE} coins to enter the race.</div>`;
    }
    body.innerHTML = h;
    return;
  }
  // ── eligible: register for the MAYOR's race (the presidency comes much later) ──
  title.textContent = '🗳️ Run for Mayor?';
  h += `<div class="pol-lead">${state.catName}, the town is behind you — but nobody becomes President overnight. Start as <b>Mayor</b>: deliver jobs, homes and kindness, earn a Civics degree, and THEN take on the big race.</div>`;
  const can = state.coins >= MAYOR_FEE;
  h += `<div class="pol-stat">🪙 Your coins: <b>${state.coins}</b></div>`;
  h += `<button class="pol-primary" ${can ? '' : 'disabled'} onclick="registerMayor()">📝 Run for Mayor — ${MAYOR_FEE} 🪙</button>`;
  if (!can) h += `<div class="pol-note">You need ${MAYOR_FEE} coins to enter the mayor's race.</div>`;
  body.innerHTML = h;
}

function registerMayor() {
  if (state.coins < MAYOR_FEE) { showNotif('You need ' + MAYOR_FEE + ' coins to register'); return; }
  state.coins -= MAYOR_FEE;
  document.getElementById('coin-count').textContent = state.coins;
  state.politics.phase = 'mayor';
  if (typeof sfx === 'function') sfx('upgrade');
  showNotif('🎩 The town elects you MAYOR! The 🏗️ town planner is now yours to use (own coins only).');
  setTimeout(() => showDialogue('🎩 The Town', `Mayor ${state.catName}! Bring us jobs, homes and kindness — show us what a cat can do, and maybe one day… the presidency.`, 6200), 600);
  if (typeof inboxAdd === 'function') inboxAdd('🏛️ Town Council', 'Your duties as Mayor 🎩',
    `Congratulations, Mayor ${state.catName} Miller!<br><br>Your promises to the town:<br>` +
    MAYOR_GOALS.map(g => '• ' + g.label).join('<br>') +
    `<br><br>The 🏗️ <b>town planner</b> is unlocked for you (your own coins — tax money is for Presidents). Deliver on every promise and the 🏫 school will teach you <b>Civics &amp; Law</b> — your ticket to the presidential race.<br><br>Track your progress anytime in the 🗳️ panel.<br>— The Town Council`);
  if (typeof saveGame === 'function') saveGame();
  renderPolitics();
}
// New-day check while Mayor: letters arrive as you tick off each promise (and when all are done)
function processMayorMail() {
  if (!state.politics || state.politics.phase !== 'mayor' || typeof inboxAdd !== 'function') return;
  const done = state._mayorMailed || (state._mayorMailed = {});
  mayorGoalState().forEach(g => {
    if (g.ok && !done[g.id]) {
      done[g.id] = true;
      inboxAdd('🏛️ Town Council', '✅ Promise kept: ' + g.label.replace(/ \(.*\)/, ''),
        `Well done, Mayor! You delivered on:<br><b>${g.label}</b><br><br>The town is taking notice. Keep going — check the 🗳️ panel for what's left.`);
    }
  });
  if (mayorGoalsMet() && !done.all) {
    done.all = true;
    inboxAdd('🏫 Town School', '🎓 You qualify for Civics & Law!',
      `Mayor ${state.catName} Miller,<br><br>You've met every promise to the town — remarkable. The school now offers you <b>🏛️ Civics &amp; Law</b>. Graduate, and you may register for the <b>presidential race</b>.<br><br>Class is waiting. — The Professor`);
  }
}

function registerRun() {
  // the presidency has prerequisites now: be a proven Mayor with a Civics & Law degree
  if (!(state.politics.phase === 'mayor' && mayorGoalsMet() && typeof schoolHas === 'function' && schoolHas('civics'))) {
    showNotif('🎓 Meet your Mayor goals and earn the Civics & Law degree first.'); return;
  }
  if (state.coins < ENTRY_FEE) { showNotif('You need ' + ENTRY_FEE + ' coins to register'); return; }
  state.coins -= ENTRY_FEE;
  document.getElementById('coin-count').textContent = state.coins;
  state.politics.phase = 'running';
  if (typeof sfx === 'function') sfx('coin');
  if (typeof saveGame === 'function') saveGame();
  renderPolitics();
}

function startDebate() { debate = { i: 0, approval: 0, react: null, lock: false }; renderPolitics(); }

function debateAnswer(idx) {
  if (!debate || debate.lock || debate.react != null) return;
  const q = DEBATE_QS[debate.i];
  const v = q.options[idx].v;
  debate.approval += v;
  debate.react = v; debate.lock = true;
  if (typeof sfx === 'function') sfx(v >= 2 ? 'upgrade' : v >= 1 ? 'coin' : 'catch');
  renderPolitics();                                           // redraw the stage with the crowd reacting
  setTimeout(() => {
    if (!debate) return;
    debate.react = null; debate.lock = false; debate.i++;
    if (debate.i < DEBATE_QS.length) renderPolitics(); else finishDebate();
  }, 1600);
}

// ── The debate STAGE: podiums, your rivals, you — and a crowd that reacts to every answer ──
function drawDebateStage() {
  const cv = document.getElementById('debate-stage'); if (!cv) return;
  const g = cv.getContext('2d'), W = cv.width, H = cv.height;
  const react = debate ? debate.react : null;
  // backdrop & curtains
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#20304e'); bg.addColorStop(1, '#101a2e');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#6e2430'; g.fillRect(0, 0, 26, H); g.fillRect(W - 26, 0, 26, H);   // curtains
  g.fillStyle = '#57121e'; for (let i = 0; i < 3; i++) { g.fillRect(4 + i * 8, 0, 3, H); g.fillRect(W - 23 + i * 8, 0, 3, H); }
  g.fillStyle = '#f0d080'; g.font = 'bold 15px Georgia'; g.textAlign = 'center';
  g.fillText('★ THE TOWN DEBATE ★', W / 2, 20);
  g.fillStyle = '#3a2c1e'; g.fillRect(26, H - 52, W - 52, 14);                       // stage floor edge
  // three podiums
  const podium = (x, col) => { g.fillStyle = col; g.fillRect(x - 26, H - 92, 52, 42); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(x - 26, H - 92, 52, 7); };
  const gx = W * 0.24, yx = W * 0.5, ax = W * 0.76;
  podium(gx, '#4a3a5a'); podium(yx, '#7a5a2a'); podium(ax, '#3a5a4a');
  // the candidates: rivals as big characters, YOU as your painted cat
  g.font = '34px serif';
  g.fillText(react != null && react >= 1 ? '😠' : '🤵', gx, H - 100);                // Grubb fumes when you score
  g.fillText(react != null ? (react >= 1 ? '🙂' : '😧') : '👩‍🌾', ax, H - 100);       // Ada nods along (or winces)
  if (typeof csCat === 'function') csCat(g, yx, H - 96, 46, react != null && react >= 2);
  else { g.fillText('🐱', yx, H - 100); }
  g.fillStyle = '#cdb79a'; g.font = '10px Georgia';
  g.fillText('Grubb', gx, H - 42); g.fillText(state.catName || 'You', yx, H - 42); g.fillText('Ada', ax, H - 42);
  // the crowd — heads along the bottom, reacting to your last answer
  for (let i = 0; i < 14; i++) {
    const cx = 40 + i * ((W - 80) / 13), cy = H - 14 - (i % 2) * 6;
    g.fillStyle = ['#3a3a4a', '#4a3a32', '#32424a'][i % 3];
    g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.fill();
  }
  if (react != null) {
    g.font = '18px serif';
    const mark = react >= 2 ? '👏' : react >= 1 ? '🙂' : '👎';
    for (let i = 0; i < 7; i++) g.fillText(mark, 60 + i * ((W - 120) / 6), H - 34 - (i % 2) * 8);
    // approval so far
    g.fillStyle = '#f0d080'; g.font = 'bold 13px Georgia';
    g.fillText('Approval: ' + Math.max(0, debate.approval) + '/10', W / 2, 38);
  }
}

function finishDebate() {
  const approval = Math.max(0, Math.min(10, debate.approval));
  const won = approval >= WIN_APPROVAL;
  const body = document.getElementById('politics-body');
  const title = document.getElementById('politics-title');
  debate = null;
  if (won) {
    becomePresident();
    return;
  }
  // Lost — the people weren't convinced. Let the player try again.
  title.textContent = 'The Results Are In…';
  body.innerHTML =
    `<div class="pol-lead">You reached <b>${approval}/10</b> approval — not quite enough to beat the field this time.</div>` +
    `<div class="pol-note">Choose the answers that help the most people, and try again.</div>` +
    `<button class="pol-primary" onclick="startDebate()">🗣️ Debate Again</button>`;
}

function becomePresident() {
  state.politics.phase = 'president';
  if (state.job) { state.job = null; if (typeof refreshEmployerBubbles === 'function') refreshEmployerBubbles(); if (typeof updateJobHUD === 'function') updateJobHUD(); showNotif('You left your cashier job to lead the country.'); }
  // a fresh term: a starting treasury, a hopeful town, and a clean slate
  state.gov = { treasury: 1500000, happiness: 65, corruption: 0, anger: 0, mail: null, spentPublic: 0, spentSelf: 0, repaid: 0, jailed: false, jailDays: 0 };
  state.disgraced = false;
  if (typeof updateHappyHUD === 'function') updateHappyHUD();
  updatePoliticsBtn();
  const celebrate = () => {
    showNotif('🎉 You won! ' + state.catName + ' is President!');
    setTimeout(() => showDialogue('🎉 The Town', `${state.catName} the cat is our new President! A brighter day begins for everyone.`, 5400), 700);
    if (typeof showTutorial === 'function') setTimeout(() => showTutorial('president', [
      { text: '👑 <b>You\'re President!</b> The 🗳️ panel is your office — your <b>treasury</b> fills with tax money every day. It belongs to the PEOPLE.', glow: 'politics-btn' },
      { text: '✅ <b>DO:</b> spend tax on the country — 🧹 clean streets, 👮 police, 🌳 parks, 🏛️ public works, 🏗️ homes. Prosperity up = a happy town (and more tax).', glow: 'politics-btn' },
      { text: '❌ <b>DON\'T:</b> pocket tax money for yourself. Corruption <b>never fades on its own</b> — it feeds the 😡 anger meter every single day.', glow: null },
      { text: '😡 If anger reaches 100, the police <b>jail you</b> and you lose EVERYTHING. The only cure for corruption: 🙏 give the stolen money back.', glow: null },
      { text: '📬 Answer the city\'s mail, keep the town thriving, and you can be President forever. Good luck! 🐾', glow: 'inbox-btn' },
    ]), 6500);
    if (typeof saveGame === 'function') saveGame();
    renderPolitics();
  };
  if (typeof playElectedCutscene === 'function' && state.gameStarted) {
    if (typeof closePolitics === 'function') closePolitics();   // clear the panel so the celebration is visible
    playElectedCutscene(celebrate);
  } else {
    const flash = document.getElementById('flash');
    if (flash) { flash.style.background = '#fff7d6'; flash.classList.add('show'); setTimeout(() => { flash.classList.remove('show'); flash.style.background = ''; }, 550); }
    if (typeof sfx === 'function') { sfx('upgrade'); setTimeout(() => sfx('coin'), 260); }
    celebrate();
  }
}

// A cheerful little house for a housed family
function buildProgramHome(x, z) {
  const useOne = ((x + z) % 2 === 0);
  const wall = useOne ? mat.house1 : mat.house2;
  const roofM = useOne ? mat.roofRed : mat.roofBlue;
  box(6, 4, 6, wall, x, 2, z);
  cone(4.6, 2.2, 4, roofM, x, 5.1, z, Math.PI / 4);
  box(1.4, 2.4, 0.2, mat.door, x, 1.2, z + 3.02);
  box(1.3, 1.3, 0.2, mat.window, x - 1.8, 2.4, z + 3.02);
  box(1.3, 1.3, 0.2, mat.window, x + 1.8, 2.4, z + 3.02);
  worldColliders.push({ type: 'box', x0: x - 3.2, x1: x + 3.2, z0: z - 3.2, z1: z + 3.2 });
}

// ── Sims-style building: as President, place each new home wherever you like ──
let placingHome = false;
function startPlaceHome() {
  const treasury = (state.gov && state.gov.treasury) || 0;
  if (treasury < HOME_COST && state.coins < HOME_COST) {   // pay from tax money (preferred) or your own coins
    showNotif('You need ' + HOME_COST.toLocaleString('en-US') + ' in the treasury (or your own coins) to build a home');
    return;
  }
  placingHome = true;
  closePolitics();
  const b = document.getElementById('build-tools'); if (b) b.classList.add('show');
  showNotif(treasury >= HOME_COST ? '🏗️ Tap an open spot — it\'s funded by tax money' : '🏗️ Tap an open spot to build a home');
}
function endPlaceHome() {
  placingHome = false;
  const b = document.getElementById('build-tools'); if (b) b.classList.remove('show');
}
function cancelPlaceHome() { endPlaceHome(); showNotif('Building cancelled'); }
// Is (x,z) clear of every building/tree/prop (with room for a house)?
function spotClear(x, z) {
  const m = 3.4;
  for (const c of worldColliders) {
    if (c.type === 'circle') { if (Math.hypot(x - c.x, z - c.z) < c.r + m) return false; }
    else if (c.type === 'box') {
      const nx = Math.max(c.x0, Math.min(x, c.x1)), nz = Math.max(c.z0, Math.min(z, c.z1));
      if (Math.hypot(x - nx, z - nz) < m) return false;
    }
  }
  return true;
}
function placeHomeAt(x, z) {
  if (Math.abs(x) > 95 || z > 52 || z < -68) { showNotif('Too far out — build closer to town'); return; }
  if (!spotClear(x, z)) { showNotif('Too close to something — pick open ground'); return; }
  const fromTax = state.gov && state.gov.treasury >= HOME_COST;   // public homes come from the treasury
  if (fromTax) {
    state.gov.treasury -= HOME_COST;
    state.gov.happiness = Math.min(100, state.gov.happiness + 3);   // building homes pleases the town
    if (typeof updateHappyHUD === 'function') updateHappyHUD();
  } else if (state.coins >= HOME_COST) {
    state.coins -= HOME_COST;
    document.getElementById('coin-count').textContent = state.coins;
  } else { showNotif('Not enough tax money or coins to build'); return; }
  buildProgramHome(x, z);
  const p = state.politics;
  p.homes = p.homes || [];
  p.homes.push({ x: +x.toFixed(2), z: +z.toFixed(2) });
  p.homesBuilt = p.homes.length;
  // a new home first takes in the homeless; only once none are homeless do new neighbours arrive
  const rr = (typeof rehouseOrGrow === 'function') ? rehouseOrGrow() : { rehoused: 0, grow: 2 };
  if (rr.grow > 0) {
    if (typeof addCommuter === 'function') { for (let i = 0; i < rr.grow; i++) addCommuter(); }
    if (typeof addStreetCat === 'function') addStreetCat();
  }
  if (typeof updatePopulationHUD === 'function') updatePopulationHUD();
  if (typeof sfx === 'function') sfx('coin');
  showNotif('🏠 A new family home! Newcomers are moving to town 👤🐱  (' + p.homesBuilt + ')');
  if (typeof updateFamilyStatus === 'function') updateFamilyStatus();
  endPlaceHome();
  if (typeof saveGame === 'function') saveGame();
}
// Delegated from the canvas drag handler: while placing, a tap drops a home
function presidentBuildDown(x, y) {
  if (!placingHome) return false;
  if (state.inHouse || state.inShop || state.inShelter || state.inBoughtHome) return false;
  const fp = (typeof floorPoint === 'function') ? floorPoint(x, y) : null;
  if (fp) placeHomeAt(fp.x, fp.z);
  return true;
}

// Restore the campaign world state when a saved game loads
function applyPoliticsLoad() {
  const p = state.politics;
  if (p.phase !== 'none') ensureCampaignPoster();
  let built = 0;
  if (p.homes && p.homes.length) {
    p.homes.forEach(h => buildProgramHome(h.x, h.z));          // homes you placed yourself
    built = p.homes.length;
  } else {
    built = Math.min(p.homesBuilt || 0, PROGRAM_LOTS.length);   // older saves: preset lots
    for (let i = 0; i < built; i++) buildProgramHome(PROGRAM_LOTS[i][0], PROGRAM_LOTS[i][1]);
  }
  // re-add the newcomers those homes brought to town (they aren't saved individually)
  for (let i = 0; i < built; i++) {
    if (typeof addCommuter === 'function') { addCommuter(); addCommuter(); }
    if (typeof addStreetCat === 'function') addStreetCat();
  }
  updatePoliticsBtn();
}
