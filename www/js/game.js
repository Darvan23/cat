// Paws & Pennies — game: input, voice, dialogue, actions, minimap, the animation loop
// Classic script: shares globals with the others; load order matters (see index.html).

// ─── Input ────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => { state.keys[e.key] = true; });
document.addEventListener('keyup', e => { state.keys[e.key] = false; });

// ─── 360° virtual joystick: drag the knob to walk, push PAST the ring to sprint ───
const joy = { active: false, id: null, x: 0, y: 0, sprint: false };
const joyBase = document.getElementById('joystick');
const joyKnob = document.getElementById('joy-knob');
function joySet(clientX, clientY) {
  const R = joyBase.getBoundingClientRect().width / 2;   // square → same size under rotation
  const rel = gameRelPoint(joyBase, clientX, clientY);   // game-space, works rotated or not
  let dx = rel.x - R, dy = rel.y - R;
  const dist = Math.hypot(dx, dy);
  joy.sprint = dist > R;                      // knob dragged outside the ring → sprint
  const reach = Math.min(dist, R * 1.35);     // knob may poke a little past the rim
  if (dist > 0.001) { dx = dx / dist * reach; dy = dy / dist * reach; }
  joy.x = dx / R; joy.y = dy / R;
  joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  joyBase.classList.toggle('sprint', joy.sprint);
}
function joyEnd() {
  joy.active = false; joy.id = null; joy.x = 0; joy.y = 0; joy.sprint = false;
  joyKnob.style.transform = '';
  joyBase.classList.remove('sprint');
}
if (joyBase) {
  joyBase.addEventListener('touchstart', e => {
    e.preventDefault();
    if (joy.active) return;
    const t = e.changedTouches[0];
    joy.active = true; joy.id = t.identifier;
    joySet(t.clientX, t.clientY);
  }, { passive: false });
  joyBase.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === joy.id) joySet(t.clientX, t.clientY);
  }, { passive: false });
  const joyTouchDone = e => { for (const t of e.changedTouches) if (t.identifier === joy.id) joyEnd(); };
  joyBase.addEventListener('touchend', joyTouchDone);
  joyBase.addEventListener('touchcancel', joyTouchDone);
  // mouse fallback (playing in a desktop browser)
  joyBase.addEventListener('mousedown', e => { joy.active = true; joy.id = 'mouse'; joySet(e.clientX, e.clientY); });
  window.addEventListener('mousemove', e => { if (joy.id === 'mouse') joySet(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => { if (joy.id === 'mouse') joyEnd(); });
}

// Sprint stamina meter: drains while running, refills while resting
function updateStaminaUI(sprinting) {
  const R = state.run;
  const fill = document.getElementById('stamina-fill');
  if (fill) {
    fill.style.width = (R.stamina / R.max * 100) + '%';
    fill.classList.toggle('cooldown', R.cooldown);
  }
  if (joyBase) joyBase.classList.toggle('cooldown', R.cooldown);
}

// Drag on the 3D view to look around (orbit the camera)
let camDrag = false, camLastX = 0, camLastY = 0;
function camDragStart(x, y) {
  if (!state.gameStarted || mg.active) return;
  if (typeof plannerPointerDown === 'function' && plannerPointerDown(x, y)) return;  // build mode pans the map
  if (typeof editorPointerDown === 'function' && editorPointerDown(x, y)) return;   // furniture editor takes the gesture
  if (typeof presidentBuildDown === 'function' && presidentBuildDown(x, y)) return; // president placing a home takes the gesture
  camDrag = true; camLastX = x; camLastY = y;
}
function camDragMove(x, y) {
  if (typeof plannerPointerMove === 'function' && plannerPointerMove(x, y)) return;
  if (typeof editorPointerMove === 'function' && editorPointerMove(x, y)) return;
  if (!camDrag) return;
  state.camYaw -= (x - camLastX) * 0.006;
  state.camHeight = Math.max(3, Math.min(16, state.camHeight - (y - camLastY) * 0.03));
  camLastX = x; camLastY = y;
}
function camDragEnd() {
  if (typeof plannerPointerUp === 'function' && plannerPointerUp()) return;
  if (typeof editorPointerUp === 'function') editorPointerUp();
  camDrag = false;
}
canvas.addEventListener('mousedown', e => { if (joy.id !== 'mouse') { const p = gamePoint(e.clientX, e.clientY); camDragStart(p.x, p.y); } });
window.addEventListener('mousemove', e => { const p = gamePoint(e.clientX, e.clientY); camDragMove(p.x, p.y); });
window.addEventListener('mouseup', camDragEnd);
// Whole-screen 360° look: track ONE finger by id, so the joystick thumb never fights the camera thumb
let camTouchId = null;
canvas.addEventListener('touchstart', e => {
  if (camTouchId !== null) return;
  const t = e.changedTouches[0];
  camTouchId = t.identifier;
  const p = gamePoint(t.clientX, t.clientY);
  camDragStart(p.x, p.y);
}, { passive: true });
canvas.addEventListener('touchmove', e => {
  for (const t of e.changedTouches) if (t.identifier === camTouchId) { const p = gamePoint(t.clientX, t.clientY); camDragMove(p.x, p.y); }
}, { passive: true });
const camTouchDone = e => {
  for (const t of e.changedTouches) if (t.identifier === camTouchId) { camTouchId = null; camDragEnd(); }
};
canvas.addEventListener('touchend', camTouchDone);
canvas.addEventListener('touchcancel', camTouchDone);

document.getElementById('btn-jump').addEventListener('click', doJump);
document.addEventListener('keydown', e => {
  if (e.code === 'Space') doJump();
  if (e.code === 'KeyE') doAction();   // keyboard shortcut still works; the on-screen "Act" button is gone
});

// ─── ☰ utility tray: the toolbar hides behind one button; tap the world to tuck it away ───
function toggleToolbar(force) {
  const tb = document.getElementById('toolbar'), mt = document.getElementById('menu-toggle');
  if (!tb) return;
  const open = force != null ? force : !tb.classList.contains('open');
  tb.classList.toggle('open', open);
  if (mt) {
    mt.classList.toggle('open', open);
    const ic = document.getElementById('menu-icon'); if (ic) ic.textContent = open ? '✕' : '☰';
    mt.classList.remove('tut-glow');   // opening the tray answers the tutorial arrow
  }
  if (typeof updateInboxBadge === 'function') updateInboxBadge();   // badge shows on ☰ only while closed
  if (open && typeof sfx === 'function') sfx('ui');
}
canvas.addEventListener('mousedown', () => toggleToolbar(false));
canvas.addEventListener('touchstart', () => toggleToolbar(false), { passive: true });

// ─── Voice (browser text-to-speech) ─────────────────────────────────────────────
const synth = window.speechSynthesis;
let ttsVoices = [], pickedVoice = null;
function loadVoices() {
  if (!synth) return;
  ttsVoices = synth.getVoices();
  pickedVoice =
       ttsVoices.find(v => /^en[-_]?(GB|US)/i.test(v.lang) && /natural|google|samantha|daniel|aaron|serena/i.test(v.name))
    || ttsVoices.find(v => /^en/i.test(v.lang))
    || ttsVoices[0] || null;
}
if (synth) {
  loadVoices();
  if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices);
}
// Per-character delivery (pitch/rate), matched by a keyword in the speaker label
const voiceProfiles = [
  { key: 'Old Tom',    rate: 0.85, pitch: 0.55 },
  { key: 'Mrs. Chen',  rate: 0.90, pitch: 1.30 },
  { key: 'Farmer Bob', rate: 0.96, pitch: 0.75 },
  { key: 'Lily',       rate: 1.12, pitch: 1.70 },
  { key: 'Noah',       rate: 1.05, pitch: 1.35 },
  { key: 'Elena',      rate: 0.98, pitch: 1.25 },
  { key: 'Daniel',     rate: 0.95, pitch: 0.70 },
  { key: 'Hint',       rate: 1.00, pitch: 1.00 },
];
function profileFor(speaker) {
  for (const p of voiceProfiles) if (speaker.includes(p.key)) return p;
  return { rate: 1.0, pitch: 1.15 }; // the player's cat → soft mid voice
}
function stripForSpeech(s) {
  return s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, ' ')
          .replace(/\s+/g, ' ').trim();
}
function speak(speaker, text) {
  if (!synth || !state.voiceOn) return;
  const clean = stripForSpeech(text);
  if (!clean) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  const p = profileFor(speaker || '');
  u.rate = p.rate; u.pitch = p.pitch; u.volume = 1;
  if (pickedVoice) { u.voice = pickedVoice; u.lang = pickedVoice.lang; }
  synth.speak(u);
}
let voiceUnlocked = false;
function unlockVoice() {            // iOS needs a first speak() inside a user tap
  if (!synth || voiceUnlocked) return;
  voiceUnlocked = true;
  try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) {}
  loadVoices();
}
function toggleVoice() {
  state.voiceOn = !state.voiceOn;
  if (!state.voiceOn && synth) synth.cancel();
  if (masterGain && audioCtx) masterGain.gain.setTargetAtTime(state.voiceOn ? 0.5 : 0, audioCtx.currentTime, 0.05);
  const b = document.getElementById('voice-toggle');
  if (b) b.textContent = state.voiceOn ? '🔊' : '🔇';
  saveGame();
}

// ─── Sound: a tiny procedural engine (no asset files — works offline) ─────────────
// Every voice runs through a lowpass filter with soft attack/decay, so nothing has
// the harsh raw-oscillator edge. Bells are built from real partials; percussive
// sounds use short filtered noise bursts.
let audioCtx = null, masterGain = null, musicTimer = null, _noiseBuf = null;
function initAudio() {
  if (audioCtx) { if (audioCtx.state === 'suspended') audioCtx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  audioCtx = new AC();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = state.voiceOn ? 0.5 : 0;
  masterGain.connect(audioCtx.destination);
  startMusic();
}
function tone(freq, start, dur, type = 'sine', vol = 0.3, opts = {}) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  const t0 = audioCtx.currentTime + start;
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) o.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);   // pitch bends (chirps, meows)
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + (opts.attack != null ? opts.attack : 0.015));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const f = audioCtx.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = opts.cutoff || 5200; f.Q.value = 0.6;
  o.connect(f); f.connect(g); g.connect(masterGain);
  if (opts.vibrato) {   // amplitude/pitch flutter — the heart of a believable purr
    const lfo = audioCtx.createOscillator(), lg = audioCtx.createGain();
    lfo.frequency.value = opts.vibrato; lg.gain.value = opts.vibratoDepth || freq * 0.05;
    lfo.connect(lg); lg.connect(o.frequency);
    lfo.start(t0); lfo.stop(t0 + dur + 0.05);
  }
  o.start(t0); o.stop(t0 + dur + 0.05);
}
function noiseBurst(start, dur, vol, cutoff = 3000, ftype = 'lowpass') {
  if (!audioCtx) return;
  if (!_noiseBuf) {
    _noiseBuf = audioCtx.createBuffer(1, Math.floor(audioCtx.sampleRate * 0.5), audioCtx.sampleRate);
    const d = _noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = audioCtx.createBufferSource(); src.buffer = _noiseBuf; src.loop = true;
  const f = audioCtx.createBiquadFilter(); f.type = ftype; f.frequency.value = cutoff;
  const g = audioCtx.createGain();
  const t0 = audioCtx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(masterGain);
  src.start(t0); src.stop(t0 + dur + 0.03);
}
// A little bell: fundamental + two soft partials — far sweeter than a raw square wave
function bell(freq, start, dur, vol) {
  tone(freq, start, dur, 'sine', vol);
  tone(freq * 2, start, dur * 0.6, 'sine', vol * 0.4);
  tone(freq * 3, start, dur * 0.35, 'sine', vol * 0.18);
}
function sfx(name) {
  if (!audioCtx || !state.voiceOn) return;
  switch (name) {
    // money in: a sweet double coin-ding
    case 'coin':    bell(1180, 0, 0.16, 0.16); bell(1568, 0.07, 0.22, 0.14); break;
    // pounce / success: a soft thump + rising chirp
    case 'catch':   noiseBurst(0, 0.06, 0.16, 1200); tone(420, 0.02, 0.12, 'triangle', 0.16, { slideTo: 900 }); break;
    // a real cat purr: low rumble with a ~26Hz flutter
    case 'purr':    tone(85, 0, 0.7, 'sine', 0.22, { vibrato: 26, vibratoDepth: 22, cutoff: 320 });
                    tone(130, 0, 0.7, 'sine', 0.10, { vibrato: 26, vibratoDepth: 30, cutoff: 420 }); break;
    // soft nom-nom
    case 'eat':     tone(300, 0, 0.07, 'sine', 0.2, { slideTo: 180 }); tone(300, 0.12, 0.09, 'sine', 0.18, { slideTo: 160 }); break;
    // level-up: warm rising arpeggio with a sparkle on top
    case 'upgrade': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.3, 'triangle', 0.14, { cutoff: 3200 }));
                    bell(2093, 0.3, 0.35, 0.08); break;
    // cash register "ka-ching": mechanical click + bright bell
    case 'sell':    noiseBurst(0, 0.04, 0.2, 5000, 'highpass'); bell(1318, 0.045, 0.3, 0.16); break;
    // jump: a quick upward chirp
    case 'jump':    tone(330, 0, 0.14, 'triangle', 0.16, { slideTo: 660 }); break;
    // a friendly little meow (two pitch-bent syllables)
    case 'meow':    tone(620, 0, 0.16, 'triangle', 0.14, { slideTo: 880, cutoff: 2400 });
                    tone(880, 0.14, 0.28, 'triangle', 0.13, { slideTo: 480, cutoff: 2200 }); break;
    // a door: soft thunk with a hint of creak
    case 'door':    noiseBurst(0, 0.09, 0.18, 700); tone(140, 0.01, 0.14, 'sine', 0.16, { slideTo: 90 }); break;
    // UI tap: a tiny woodblock click
    case 'ui':      noiseBurst(0, 0.025, 0.1, 2600, 'bandpass'); tone(660, 0, 0.05, 'sine', 0.08); break;
    // mail arrives: a gentle two-note doorbell
    case 'mail':    bell(988, 0, 0.3, 0.13); bell(784, 0.16, 0.4, 0.13); break;
    // something bad: a soft descending "aww"
    case 'sad':     tone(392, 0, 0.3, 'triangle', 0.13, { slideTo: 294, cutoff: 1800 });
                    tone(294, 0.26, 0.45, 'triangle', 0.12, { slideTo: 220, cutoff: 1500 }); break;
  }
}
function startMusic() {
  if (musicTimer || !audioCtx) return;
  const chords = [[261, 329, 392], [293, 349, 440], [220, 277, 329], [246, 311, 370]];  // gentle C–D–A–B pad
  let i = 0;
  musicTimer = setInterval(() => {
    if (!state.voiceOn || !state.gameStarted) return;
    const night = isNight();
    chords[i % chords.length].forEach((f, k) => tone(f * (night ? 0.5 : 1), k * 0.14, night ? 2.2 : 1.7, 'sine', 0.05, { cutoff: 1400 }));
    // living-town ambience: birdsong by day, crickets by night (quiet & occasional)
    if (night) {
      if (Math.random() < 0.55) for (let c = 0; c < 4; c++) tone(4400, 0.3 + c * 0.09, 0.05, 'sine', 0.022);
    } else if (Math.random() < 0.4) {
      const b = 2200 + Math.random() * 900;
      tone(b, 0.2, 0.09, 'sine', 0.03, { slideTo: b * 1.35 });
      tone(b * 1.1, 0.34, 0.07, 'sine', 0.028, { slideTo: b * 0.9 });
    }
    i++;
  }, 2600);
}

// ─── Save / load (localStorage — survives reloads & app relaunches) ───────────────
const SAVE_KEY = 'paws-and-pennies-save';
function saveGame() {
  if (!state.gameStarted) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: 1,
      coins: state.coins, earned: state.earned, goodDeeds: state.goodDeeds, houseFund: state.houseFund,
      needs: state.needs, dayTime: state.dayTime,
      catId: state.chosenCat ? state.chosenCat.id : null, catName: state.catName, chosenCat: state.chosenCat,
      catCustom: state.catCustom,
      freed: state.freed, createdCats: state.createdCats, job: state.job, dayCount: state.dayCount, school: state.school, darkMode: state.darkMode,
      inbox: state.inbox, tutorialsSeen: state.tutorialsSeen, cvJobs: state.cvJobs, workRep: state.workRep,
      carryBag: state.carryBag ? { item: state.carryBag.item, from: state.carryBag.from } : null, momRequest: state.momRequest,
      storyAct: state.storyAct, crickMet: state.crickMet, rentActive: state.rentActive, daysLeft: state.daysLeft,
      voiceOn: state.voiceOn, parkMice: state.parkMice, parkBirds: state.parkBirds,
      owned: state.owned,
      politics: state.politics,
      biz: state.biz,
      gov: state.gov, disgraced: state.disgraced, disowned: state.disowned, seenDisown: state.seenDisown, millerGoodwill: state.millerGoodwill, gwBand: state.gwBand, homeless: state.homeless,
      decorXf: state.decorXf, decorXfUpper: state.decorXfUpper, decorXfShop: state.decorXfShop, decorXfBought: state.decorXfBought,
      decorBiz: state.owned.decorBiz, decorXfBiz: state.decorXfBiz,
      fixtureXf: state.fixtureXf, shopTill: state.shopTill,
      placed: state.placed, streetNames: state.streetNames, structXf: state.structXf,
      rubble: state.rubble, homelessCount: state.homelessCount,
      bizTill: state.bizTill, bizOpen: state.bizOpen, millerHome: state.millerHome,
      civics: state.civics, townGrowth: state.townGrowth,
    }));
  } catch (e) {}
}
function loadSave() {
  try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
function applySave(s) {
  state.coins = s.coins || 0; state.earned = s.earned || 0; state.goodDeeds = s.goodDeeds || 0; state.houseFund = s.houseFund || 0;
  // Older saves: till/tip income never counted toward `earned`, locking the Mayor race
  // forever. Lifetime earnings can't be BELOW the coins in your pocket — repair the ledger.
  if (state.earned < state.coins) state.earned = state.coins;
  if (s.needs) state.needs = s.needs;
  if (typeof s.dayTime === 'number') state.dayTime = s.dayTime;
  state.storyAct = s.storyAct || 1; state.crickMet = !!s.crickMet; state.rentActive = !!s.rentActive;
  state.daysLeft = (s.daysLeft != null) ? s.daysLeft : RENT.days;
  state.voiceOn = s.voiceOn !== false;
  state.parkMice = s.parkMice || 0; state.parkBirds = s.parkBirds || 0;
  const cat = s.chosenCat || cats.find(c => c.id === s.catId) || cats[0];   // custom cats save their full look
  state.chosenCat = cat; state.catName = s.catName || cat.name;
  applyCatAppearance(cat);
  if (s.catCustom) { state.catCustom = s.catCustom; applyCatCustom(); }
  else if (typeof ensureCatCustom === 'function') ensureCatCustom();   // old save: rebuild a default look
  state.houseLevel = levelForCoins(state.houseFund);
  applyHouseLevel(state.houseLevel);
  document.getElementById('coin-count').textContent = state.coins;
  updateFamilyStatus(); updateNeedsHUD();
  if (state.rentActive) { document.getElementById('rent-line').style.display = 'block'; updateRentHUD(); }
  (s.freed || []).forEach(id => { const c = cats.find(cc => cc.id === id); if (c && !state.freed.includes(id)) { state.freed.push(id); spawnFreedCat(c); } });
  state.createdCats = s.createdCats || [];
  state.createdCats.forEach(c => { if (typeof spawnFreedCat === 'function') spawnFreedCat(c); });   // your designed-&-freed cats roam again
  state.dayCount = s.dayCount || 0;
  state.school = s.school || { done: [], cur: null, curDone: 0 };
  state.darkMode = !!s.darkMode;
  if (typeof applyComfortAll === 'function') applyComfortAll();
  state.inbox = Array.isArray(s.inbox) ? s.inbox : [];
  state.tutorialsSeen = Array.isArray(s.tutorialsSeen) ? s.tutorialsSeen : [];
  state.cvJobs = Array.isArray(s.cvJobs) ? s.cvJobs : [];
  if (typeof updateInboxBadge === 'function') updateInboxBadge();
  state.momRequest = s.momRequest || null;
  state.workRep = s.workRep || 0;
  if (s.carryBag && s.carryBag.item) setCarryBag(s.carryBag.item, s.carryBag.from);   // the bag survives a reload
  state.job = s.job || null;
  if (state.job && typeof JOB_SITES !== 'undefined') {   // re-sync the workplace position (shops may have moved between versions)
    const js = JOB_SITES.find(x => x.id === state.job.site);
    if (js) { state.job.x = js.x; state.job.z = js.z; state.job.wage = state.job.wage || js.wage; }
  }
  if (typeof refreshEmployerBubbles === 'function') refreshEmployerBubbles();   // hide the vacancy you filled
  if (typeof updateJobHUD === 'function') updateJobHUD();
  // restore purchased property & decor (notes 7–9)
  if (s.owned) state.owned = {
    decor: s.owned.decor || [], decorUpper: s.owned.decorUpper || [], decorShop: s.owned.decorShop || [], decorBought: s.owned.decorBought || [],
    decorBiz: s.decorBiz || {},   // per-business furniture you bought
    homes: s.owned.homes || [], shop: !!s.owned.shop, accessories: s.owned.accessories || [],
  };
  state.decorXfBiz = s.decorXfBiz || {};
  state.decorXf = s.decorXf || {};
  state.decorXfUpper = s.decorXfUpper || {};
  state.decorXfShop = s.decorXfShop || {};
  state.decorXfBought = s.decorXfBought || {};
  state.fixtureXf = s.fixtureXf || {};
  state.shopTill = s.shopTill || 0;
  rebuildDecor();
  if (typeof applyFixtureXf === 'function') applyFixtureXf();   // re-place any built-in furniture you moved
  PROPERTIES.forEach(p => { if (isOwned(p) && PROP_SIGNS[p.id]) PROP_SIGNS[p.id].visible = false; });
  if (state.owned.shop) spawnDadAtShop();
  if (s.politics) state.politics = { phase: s.politics.phase || 'none', homesBuilt: s.politics.homesBuilt || 0, homes: s.politics.homes || [] };
  if (s.biz) state.biz = { extra: s.biz.extra || [], workers: Array.isArray(s.biz.workers) ? s.biz.workers : [], jobsCreated: s.biz.jobsCreated || 0 };
  if (s.gov) state.gov = Object.assign({ treasury: 0, happiness: 60, corruption: 0, mail: null, spentPublic: 0, spentSelf: 0, jailed: false, jailDays: 0 }, s.gov);
  state.disgraced = !!s.disgraced;
  state.disowned = !!s.disowned;
  state.seenDisown = !!s.seenDisown;
  state.millerGoodwill = s.millerGoodwill || 0;
  state.gwBand = s.gwBand || 0;
  state.homeless = !!s.homeless;
  if (typeof buildOwnedBusinessBuildings === 'function') buildOwnedBusinessBuildings();   // re-raise businesses you bought
  state.placed = Array.isArray(s.placed) ? s.placed : [];
  state.streetNames = s.streetNames || {};
  state.structXf = s.structXf || {};
  state.rubble = Array.isArray(s.rubble) ? s.rubble : [];
  state.homelessCount = s.homelessCount || 0;
  state.bizTill = s.bizTill || {};
  state.bizOpen = s.bizOpen || {};
  state.millerHome = s.millerHome || null;
  state.civics = Array.isArray(s.civics) ? s.civics : [];
  if (typeof buildOwnedCivicBuildings === 'function') buildOwnedCivicBuildings();   // re-raise public works
  state.townGrowth = s.townGrowth || { humans: 0, cats: 0 };
  if (typeof attractNewcomers === 'function') attractNewcomers(state.townGrowth.humans, state.townGrowth.cats, true);   // re-add newcomers your workplaces drew in
  if (typeof rebuildPlaced === 'function') rebuildPlaced();       // re-raise town-planner pieces
  if (typeof applyStreetNames === 'function') applyStreetNames();  // re-apply renamed streets
  if (typeof applyStructXf === 'function') applyStructXf();        // re-apply structures you moved
  if (typeof rebuildRubble === 'function') rebuildRubble();        // re-raise demolition rubble to clean up
  if (typeof applyPoliticsLoad === 'function') applyPoliticsLoad();
  if (typeof checkPolitics === 'function') checkPolitics();   // repaired ledgers may cross the fame goal right now
  applyFamilyPresence();
  catGroup.position.set(0, 0, 0); catGroup.rotation.y = 0;
  if (state.gov && state.gov.jailed && typeof enterJail === 'function') enterJail();   // resume a sentence in progress
  const vb = document.getElementById('voice-toggle'); if (vb) vb.textContent = state.voiceOn ? '🔊' : '🔇';
}
function resumeGame() {
  unlockVoice(); initAudio();
  document.getElementById('intro').style.display = 'none';
  state.gameStarted = true;
}
// Boot: resume a saved game, or show the shelter for a fresh start
function bootGame() {
  renderShelter();
  const s = loadSave();
  if (!s || !s.catId) return;
  applySave(s);
  document.getElementById('shelter').style.display = 'none';
  const intro = document.getElementById('intro'); intro.style.display = 'flex';
  document.getElementById('intro-portrait').innerHTML = catSVG(state.chosenCat);
  const h1 = intro.querySelector('h1'); if (h1) h1.textContent = 'Welcome Back';
  document.getElementById('intro-sub').textContent = `${state.catName} and the Millers are waiting for you. 🐾`;
  const btn = document.getElementById('start-btn'); btn.textContent = '▶ Continue'; btn.onclick = resumeGame;
  if (!document.getElementById('start-over')) {
    const so = document.createElement('button');
    so.id = 'start-over'; so.textContent = 'Start a new game';
    so.style.cssText = 'margin-top:10px;background:none;border:none;color:#b8906a;font-family:Georgia,serif;font-size:0.82rem;text-decoration:underline;cursor:pointer';
    so.onclick = () => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload(); };
    intro.appendChild(so);
  }
}
window.addEventListener('beforeunload', saveGame);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });

// ─── Dialogue ─────────────────────────────────────────────────────────────────
let dialogueTimer = null;
function showDialogue(speaker, text, dur = 3000) {
  document.getElementById('dlg-speaker').textContent = speaker;
  document.getElementById('dlg-text').textContent = text;
  const el = document.getElementById('dialogue');
  el.classList.add('show');
  speak(speaker, text);
  if (dialogueTimer) clearTimeout(dialogueTimer);
  dialogueTimer = setTimeout(() => el.classList.remove('show'), dur);
}

let notifTimer = null;
function showNotif(text) {
  const el = document.getElementById('notif');
  el.textContent = text;
  el.classList.add('show');
  if (notifTimer) clearTimeout(notifTimer);
  notifTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

// Play a sequence of [speaker, text, duration] dialogue lines back-to-back
// A simple sequence of speech-bubble lines (NOT the cinematic director in cutscene.js).
// Renamed from playCutscene to avoid colliding with the director (which loads later).
function playDialogueScene(lines, onDone) {
  let i = 0;
  (function next() {
    if (i >= lines.length) { if (onDone) setTimeout(onDone, 250); return; }
    const [speaker, text, dur] = lines[i++];
    showDialogue(speaker, text, dur);
    setTimeout(next, dur + 450);
  })();
}

// ─── Family status update ─────────────────────────────────────────────────────
function updateFamilyStatus() {
  const lv = levelForCoins(state.houseFund);   // the home improves from money GIVEN, not coins earned
  document.getElementById('family-status').textContent = HOUSE_TIERS[lv].status + '  ·  🏠 ' + lv + '/5';
  updateRentHUD();
  if (!state.crickMet && state.earned >= RENT.triggerCoins) triggerDeadline();
  // The ONE win check for the rent: however the fund reached the goal (gifts, minigames,
  // a reloaded save that was already full), Crick comes to settle up. winDeadline() itself
  // guards against firing twice.
  if (state.rentActive && state.houseFund >= RENT.goal) winDeadline();
  if (typeof checkPolitics === 'function') checkPolitics();
  if (lv !== state.houseLevel) {
    const wentUp = lv > state.houseLevel;
    state.houseLevel = lv;
    applyHouseLevel(lv);
    if (wentUp) {
      sfx('upgrade');
      showNotif('🏠 The home got better!  (Lv ' + lv + '/5)');
      const lines = [
        'Look — the house is getting better!',
        'You did this, little one. Thank you.',
        'We can breathe a little easier now.',
        'It\'s starting to feel warm in here.',
        'It finally feels like home. ❤️',
      ];
      setTimeout(() => showDialogue('🏠 The Millers', lines[Math.min(lv - 1, lines.length - 1)], 4200), 700);
    }
  }
}

// ── Giving coins to the Millers — THIS is what fixes up the home (and pays the rent) ──
function updateGivePrompt() {
  const btn = document.getElementById('give-btn');
  if (!btn) return;
  const near = state.inHouse || Math.hypot(catGroup.position.x - (-3), catGroup.position.z - (-7.7)) < 5;
  btn.classList.toggle('show', near && !state.uiOpen && !mg.active);
}
function openGive() {
  state.uiOpen = true;
  document.getElementById('give-wallet').textContent = state.coins;
  document.getElementById('give').classList.add('show');
}
function closeGive() {
  state.uiOpen = false;
  document.getElementById('give').classList.remove('show');
}
function giveCoins(amount) {
  const amt = Math.min(amount, state.coins);
  if (amt <= 0) { showNotif('No coins to give yet…'); return; }
  state.coins -= amt;
  state.houseFund += amt;
  document.getElementById('coin-count').textContent = state.coins;
  document.getElementById('give-wallet').textContent = state.coins;
  updateFamilyStatus();
  if (state.rentActive && state.houseFund >= RENT.goal) winDeadline();
  sfx('coin');
  showNotif(`💝 Gave ${amt} 🪙 to the Millers`);
  if (typeof schoolEvent === 'function') schoolEvent('give', amt);
  if (!state.disowned) showDialogue('🏠 The Millers', amt >= 25 ? 'Bless you, little one… this means everything. ❤️' : 'Thank you — every coin helps.', 3400);
  addGoodwill(Math.min(30, Math.ceil(amt / 8)), 'Your gift of ' + amt + ' 🪙');   // giving counts toward winning them back
  if (state.coins <= 0) closeGive();
}
function giveCoinsAll() { giveCoins(state.coins); }

// ─── Winning the Millers back after jail (good deeds → forgiveness) ──────────────
const MILLER_FORGIVE_GOAL = 100;
// Every good deed adds goodwill while you're disowned. Fill the meter → they forgive you.
function addGoodwill(amount, note) {
  if (!state.disowned || amount <= 0) return;
  state.millerGoodwill = Math.min(MILLER_FORGIVE_GOAL, (state.millerGoodwill || 0) + amount);
  updateWinbackHUD();
  const g = state.millerGoodwill;
  if (g >= MILLER_FORGIVE_GOAL) { reconcileMillers(); return; }
  showNotif('❤️‍🩹 ' + (note || 'A kind deed') + ' — the Millers are hearing about it… (' + Math.round(g) + '%)');
  const band = g >= 75 ? 3 : g >= 50 ? 2 : g >= 25 ? 1 : 0;   // soft milestone lines
  if (band > (state.gwBand || 0)) {
    state.gwBand = band;
    const lines = ['', 'The Millers still won\'t open the door… but Lily waved at you today.',
      'Elena was seen watching you from the window. She almost smiled.',
      'Daniel muttered, "…maybe we were too hard on the little one."'];
    setTimeout(() => showDialogue('🏠 The Millers', lines[band], 4200), 500);
  }
  if (typeof saveGame === 'function') saveGame();
}
function reconcileMillers() {
  state.disowned = false; state.seenDisown = false; state.gwBand = 0;
  updateWinbackHUD();
  if (typeof updatePropertyPrompt === 'function') updatePropertyPrompt();
  if (typeof saveGame === 'function') saveGame();
  const welcome = () => showDialogue('🏠 The Millers', 'The door is open again, ' + state.catName + '. You earned your way back — honestly, kindly. You\'ll always have a home with us. ❤️', 6500);
  if (typeof playReconcileCutscene === 'function') playReconcileCutscene(welcome); else welcome();
}
function updateWinbackHUD() {
  const el = document.getElementById('winback');
  if (!el) return;
  const show = state.disowned && !(state.inHouse || state.inShop || state.inShelter || state.inBoughtHome || state.inBiz || state.inJail);
  el.style.display = show ? 'flex' : 'none';
  if (!show) return;
  const g = Math.round(state.millerGoodwill || 0);
  const fill = el.querySelector('.winback-fill');
  if (fill) fill.style.width = g + '%';
  const pct = el.querySelector('.winback-pct');
  if (pct) pct.textContent = g + '%';
}

// ── 🌙 Comfort lighting: one tap dims every light in the game — easier on the eyes ──
const COMFORT_DIM = 0.55;
function comfortFactor() { return state.darkMode ? COMFORT_DIM : 1; }
function applyComfortLighting(S) {
  if (!S) return;
  S.traverse(o => {
    if (o.isLight) {
      if (o.userData._baseI == null) o.userData._baseI = o.intensity;
      o.intensity = o.userData._baseI * comfortFactor();
    }
  });
}
function applyComfortAll() {   // interiors are static scenes; the overworld sun is scaled per-frame in updateDayNight
  [houseScene, shopScene, shelterScene, boughtHomeScene, bizScene, (typeof jailScene !== 'undefined' ? jailScene : null)].forEach(S => applyComfortLighting(S));
  const btn = document.getElementById('dark-toggle');
  if (btn) { btn.textContent = state.darkMode ? '☀️' : '🌙'; btn.classList.toggle('on', !!state.darkMode); }
}
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  applyComfortAll();
  showNotif(state.darkMode ? '🌙 Comfort lighting ON — softer colours, easier on the eyes' : '☀️ Standard lighting');
  if (typeof saveGame === 'function') saveGame();
}

// ─── Needs (hunger / thirst / energy) & the day–night cycle ──────────────────────
const DAY_LENGTH = 540;                                   // seconds for a full day (longer days)
const DECAY = { hunger: 0.5, thirst: 0.65, energy: 0.32 }; // per second
const _warned = { hunger: false, thirst: false, energy: false };

function isNight() { return state.dayTime < 0.21 || state.dayTime > 0.80; }
// Dad's shop keeps real hours: open 8:00am, closed 8:00pm
const SHOP_OPEN_HOUR = 8, SHOP_CLOSE_HOUR = 20;
function shopIsOpen() { const h = state.dayTime * 24; return h >= SHOP_OPEN_HOUR && h < SHOP_CLOSE_HOUR; }

function warnNeed(key, value, msg) {
  if (value < 22 && !_warned[key]) { _warned[key] = true; showDialogue(state.catName + ' 🐱', msg, 3000); }
  else if (value > 55) _warned[key] = false;
}
function updateNeeds(dt) {
  const n = state.needs;
  n.hunger = Math.max(0, n.hunger - DECAY.hunger * dt);
  n.thirst = Math.max(0, n.thirst - DECAY.thirst * dt);
  n.energy = Math.max(0, n.energy - DECAY.energy * (isNight() ? 1.7 : 1) * dt);
  updateNeedsHUD();
  if (!state.uiOpen) {
    warnNeed('hunger', n.hunger, "I'm getting hungry… the Millers keep food at home, or a neighbour might share a treat.");
    warnNeed('thirst', n.thirst, "So thirsty… there's water at home, or the fountain in the square.");
    warnNeed('energy', n.energy, "I'm so sleepy… I should head home for a nap.");
  }
}
function updateNeedsHUD() {
  const set = (id, v) => {
    const el = document.getElementById(id); if (!el) return;
    el.style.width = v + '%';
    el.classList.toggle('low', v <= 35 && v > 15);
    el.classList.toggle('critical', v <= 15);
  };
  set('hunger-fill', state.needs.hunger);
  set('thirst-fill', state.needs.thirst);
  set('energy-fill', state.needs.energy);
}

const _cDay = new THREE.Color(0x9fd0f0), _cNight = new THREE.Color(0x0a1430), _cDusk = new THREE.Color(0xf0a060);
const _fDay = new THREE.Color(0xa9d4ee), _fNight = new THREE.Color(0x10182e);
const _sunDay = new THREE.Color(0xfff4e0), _sunNight = new THREE.Color(0x6a80c0);
let _dayPrev = 0;
function updateDayNight(dt) {
  state.dayTime = (state.dayTime + dt / DAY_LENGTH) % 1;
  if (state.dayTime < _dayPrev - 0.4) {   // crossed into a new day
    state.dayCount = (state.dayCount || 0) + 1;
    if (state.inJail) { if (typeof jailPassDay === 'function') jailPassDay(); }   // another day served
    else {
      if (typeof processBusinessDay === 'function') processBusinessDay();   // wages & income
      if (typeof processGovDay === 'function') processGovDay();             // tax + town happiness
      if (typeof processJobDay === 'function') processJobDay();             // grade your cashier shift
      if (typeof processSchoolDay === 'function') processSchoolDay();       // evening classes → graduation
      if (typeof processMayorMail === 'function') processMayorMail();       // 📬 letters as you tick off mayor promises
      if (typeof newMomRequest === 'function') newMomRequest();             // 💭 Elena sometimes needs something from the shops
    }
  }
  _dayPrev = state.dayTime;
  const ang = state.dayTime * Math.PI * 2;
  const elev = Math.sin(ang - Math.PI / 2);           // -1 midnight … +1 noon
  const day = Math.max(0, elev);                      // 0 at night, 1 at noon
  const dusk = Math.max(0, 1 - Math.abs(elev) * 3);   // peaks at sunrise/sunset
  const cf = comfortFactor();   // 🌙 comfort mode dims the whole overworld
  sun.intensity = (0.12 + day * 2.5) * cf;
  sun.position.set(Math.cos(ang) * 30, 8 + day * 26, Math.sin(ang) * 18 + 4);
  sun.color.copy(_sunNight).lerp(_sunDay, day);
  scene.background.copy(_cNight).lerp(_cDay, day).lerp(_cDusk, dusk * 0.4);
  if (state.darkMode) scene.background.multiplyScalar(0.62);   // soften the sky too
  scene.fog.color.copy(_fNight).lerp(_fDay, day).lerp(_cDusk, dusk * 0.3);
  if (state.darkMode) scene.fog.color.multiplyScalar(0.62);
  ambient.intensity = (0.12 + day * 0.2) * cf;
  hemi.intensity = (0.18 + day * 0.4) * cf;
  matLampGlow.emissiveIntensity = 0.2 + (1 - day) * 1.6;
  const clk = document.getElementById('clock');
  if (clk) {
    const totalMin = Math.floor(state.dayTime * 24 * 60);
    let hh = Math.floor(totalMin / 60), mm = totalMin % 60;
    const ampm = hh < 12 ? 'AM' : 'PM';
    let h12 = hh % 12; if (h12 === 0) h12 = 12;
    const icon = day > 0.15 ? '🌞' : (dusk > 0.3 ? '🌅' : '🌙');
    clk.textContent = icon + ' ' + h12 + ':' + String(mm).padStart(2, '0') + ' ' + ampm;
  }
}

// ─── Context action button: eat / drink / sleep / pet, depending on where you are ─
function nearestPerson(cp, range) {
  let best = null, bestD = range;
  for (const p of state.npcs.concat(state.peds)) {
    if (p.group && !p.group.visible) continue;   // gone indoors for the night
    const d = Math.hypot(p.x - cp.x, p.z - cp.z);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}
// ── Tap a Miller (out & about) to hear what they're up to ──
function nearestMiller(cp, range) {
  let best = null, bestD = range;
  for (const f of state.family) {
    if (!f.group || !f.group.visible) continue;
    const d = Math.hypot(f.group.position.x - cp.x, f.group.position.z - cp.z);
    if (d < bestD) { bestD = d; best = f; }
  }
  return best;
}
function millerTalkLine(f) {
  const owns = state.owned.shop;
  const lines = {
    Daniel: owns ? ['Morning! Off to open up the shop. 🔧', 'Busy day at the store ahead — come by later!', 'Honest work again, thanks to you. 🐾'] : ['Off to look for work again…', 'Something will turn up. It has to.'],
    Elena:  ['Just nipping to the shops, dear. 🛍️', 'Must get the dinner sorted soon.', "You've been such a blessing to us. ❤️"],
    Lily:   ["We're off to play football! ⚽", 'Wanna come to the park with us? 🌳', 'I scored a goal yesterday, did you see?'],
    Noah:   ['Race you to the pitch! ⚽', "I'm gonna be the best striker in town!", 'Can we play later, kitty?'],
  };
  const set = lines[f.name] || ['Hello there, little one.'];
  return set[Math.floor(Math.random() * set.length)];
}
function millerTalk(f) {
  if (!f) return;
  const isKid = (f.name === 'Lily' || f.name === 'Noah');
  if (isKid && f.wantsPark && !state.escort && !(typeof isNight === 'function' && isNight())) { startEscort(f); return; }
  if (state.escort && state.escort.kid === f) { showDialogue(f.name + ' 🏠', state.escort.phase === 'toHome' ? 'Almost home! 🏠' : 'Come on — to the park! 🌳', 3000); return; }
  if (f.group) f.group.rotation.y = Math.atan2(catGroup.position.x - f.group.position.x, catGroup.position.z - f.group.position.z);   // turn to face you
  f.talkPause = 120;                                                                                                                  // pause their walk a moment
  showDialogue(f.name + ' 🏠', millerTalkLine(f), 3800);
}

// ── Kids' escort quest: a kid asks you to walk them to the park & back — a kindness that builds your reputation ──
function playerIndoors() { return !!(state.inHouse || state.inShop || state.inShelter || state.inBoughtHome || state.inBiz || state.inWork || state.inJail); }
function anyKidWantsPark() { return state.family.some(f => f.wantsPark); }
function startEscort(kid) {
  kid.wantsPark = false;
  state.escort = { kid, phase: 'toPark', timer: 0, playT: 0 };
  showDialogue(kid.name + ' 🏠', 'Yay! Walk ahead and I\'ll follow you all the way to the park! 🌳', 4200);
  showNotif('🧒 Lead ' + kid.name + ' to the park 🌳 (walk ahead — they\'ll follow)');
}
function endEscort(done) {
  const e = state.escort; if (!e) return;
  const kid = e.kid;
  if (kid.parts) { if (kid.parts.legs) kid.parts.legs.forEach(l => l.rotation.x = 0); if (kid.parts.arms) kid.parts.arms.forEach(a => a.rotation.x = 0); }
  if (kid.group) { const H = millerHomeSpot(); kid.group.position.set(H.x, 0, H.z); }   // back at their front door
  kid.phase = 'home';
  state.escort = null;
  if (done) {
    // family kindnesses pay in REPUTATION, not coins — the town notices a cat like that
    state.goodDeeds = (state.goodDeeds || 0) + 1;
    if (typeof schoolEvent === 'function') schoolEvent('goodDeed');
    if (typeof addGoodwill === 'function') addGoodwill(2, 'Walked a kid to the park');
    if (typeof sfx === 'function') sfx('purr');
    spawnHeart(); setTimeout(spawnHeart, 300);
    showDialogue(kid.name + ' 🏠', 'That was the best day ever! Mum says you\'re the kindest cat in town. ❤️', 4600);
    showNotif('❤️ A good deed — your reputation grows (see 📊)');
    if (typeof saveGame === 'function') saveGame();
  }
}
function updateEscort() {
  const e = state.escort; if (!e) return;
  const kid = e.kid;
  if (!kid.group) { state.escort = null; return; }
  kid.group.visible = true;
  const cp = catGroup.position;
  if ((typeof isNight === 'function' && isNight()) || ++e.timer > 6000) { endEscort(false); return; }   // bail at night / if it drags on

  if (e.phase === 'play') {   // a happy jump at the park
    kid.group.position.y = Math.abs(Math.sin(performance.now() * 0.009)) * 0.28;
    if (kid.parts.arms) kid.parts.arms.forEach(a => a.rotation.x = -1.7);
    if (--e.playT <= 0) {
      kid.group.position.y = 0; if (kid.parts.arms) kid.parts.arms.forEach(a => a.rotation.x = 0);
      e.phase = 'toHome'; showNotif('🏠 Now walk ' + kid.name + ' back home');
    }
    return;
  }
  // follow the cat, trailing a step behind
  const dx = cp.x - kid.group.position.x, dz = cp.z - kid.group.position.z, d = Math.hypot(dx, dz);
  if (d > 1.4) {
    const step = Math.min(0.085, d - 1.2);   // keeps pace with a walk; trails a little if you sprint
    kid.group.position.x += dx / d * step; kid.group.position.z += dz / d * step;
    const heading = Math.atan2(dx, dz);
    kid.group.rotation.y += (((heading - kid.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.2;
    kid.walkT = (kid.walkT || 0) + 0.35; const sw = Math.sin(kid.walkT);
    if (kid.parts.legs) { kid.parts.legs[0].rotation.x = sw * 0.5; kid.parts.legs[1].rotation.x = -sw * 0.5; }
    if (kid.parts.arms) { kid.parts.arms[0].rotation.x = -sw * 0.4; kid.parts.arms[1].rotation.x = sw * 0.4; }
    kid.group.position.y = Math.abs(sw) * 0.02;
  } else {
    if (kid.parts.legs) kid.parts.legs.forEach(l => l.rotation.x *= 0.8);
    kid.group.position.y *= 0.7;
  }
  kid.x = kid.group.position.x; kid.z = kid.group.position.z;

  if (e.phase === 'toPark') {
    if (cp.x > PARK.x0 + 1 && cp.z > PARK.z0 && cp.z < PARK.z1 && d < 3.2) { e.phase = 'play'; e.playT = 150; showDialogue(kid.name + ' 🏠', 'The park! Thank you, thank you! 🌳🎉', 3600); }
  } else if (e.phase === 'toHome') {
    const H = millerHomeSpot();   // walk them back to wherever the family lives NOW
    if (Math.hypot(cp.x - H.x, cp.z - H.z) < 5.5 && d < 3.2) endEscort(true);
  }
}
function updateContextButton() {
  const btn = document.getElementById('context-btn');
  if (!btn) return;
  const bb = document.getElementById('buy-btn');
  if (state.uiOpen || mg.active) {
    btn.classList.remove('show'); if (bb) bb.classList.remove('show');
    state.context = null; return;
  }
  const cp = catGroup.position;
  // 🛍️ its own button: at a shop counter you can ALWAYS buy — job or no job
  if (bb) bb.classList.toggle('show', !!(state.inWork && typeof canShopBuy === 'function' && canShopBuy(cp)));
  if (state.catSitting) { state.context = 'getup'; btn.textContent = '🐾 Get up'; btn.classList.add('show'); return; }
  if (state.inBoughtHome) {   // tell the Millers to move into (or out of) this house
    const here = state.currentBoughtHome;
    if (here && state.millerHome === here) { state.context = 'millermoveout'; btn.textContent = '🏠 Send Millers back'; btn.classList.add('show'); }
    else if (here) { state.context = 'millermovein'; btn.textContent = '🏡 Move the Millers in'; btn.classList.add('show'); }
    else { state.context = null; btn.classList.remove('show'); }
    return;
  }
  if (state.inWork) {   // inside your workplace — help customers, ring them up, stash cash, run the shift
    const jc = (typeof workShiftContext === 'function') ? workShiftContext(cp) : null;
    state.context = jc ? jc.action : null;
    if (jc) { btn.textContent = jc.label; btn.classList.add('show'); } else btn.classList.remove('show');
    return;
  }
  if (state.inBiz) {   // running a self-staffed business from behind the register
    let a = null, l = '';
    const id = state.currentBiz;
    const cg = state.civicGiver;   // the hospital/school lobby minigame host
    if (cg && state.inCivic === cg.site && cg.hasJob && Math.hypot(cp.x - cg.x, cp.z - cg.z) < 2.0) {
      state.giverTarget = cg; state.context = 'playgame';
      btn.textContent = (JOBS[cg.job] && JOBS[cg.job].playLabel) || '🎮 Play a game'; btn.classList.add('show');
      return;
    }
    if (bizSelfRun(id) && Math.hypot(cp.x - 1.2, cp.z - (-3.8)) < 2.4) {   // at the register (best worked from BEHIND the counter)
      const till = Math.floor((state.bizTill && state.bizTill[id]) || 0);
      if (till >= 1) { a = 'bizcollect'; l = '💰 Collect ' + till + ' 🪙'; }
      else if (state.bizOpen && state.bizOpen[id]) { a = 'bizclose'; l = '🔒 Close shop'; }
      else { a = 'bizopen'; l = '🔓 Open shop'; }
    }
    state.context = a;
    if (a) { btn.textContent = l; btn.classList.add('show'); } else btn.classList.remove('show');
    return;
  }
  let action = null, label = '';
  if (state.inShop) {
    const chen = state.shopChen;
    if (chen && chen.hasJob && Math.hypot(cp.x - chen.group.position.x, cp.z - chen.group.position.z) < 1.9) {
      action = 'grocery'; label = '🛒 Help Mrs. Chen';
    } else if (Math.hypot(cp.x - 0, cp.z - (-3.3)) < 2.2) {
      const till = Math.floor(state.shopTill || 0);
      if (till >= 1) { action = 'collectshop'; label = '💰 Collect ' + till + ' 🪙'; }
      else { action = 'talkdad'; label = '💬 Talk to Dad'; }
    }
  } else if (state.inShelter) {
    const giver = state.shelterGiver;
    if (giver && giver.hasJob && Math.hypot(cp.x - giver.x, cp.z - giver.z) < 2.0) { action = 'playgame'; label = (JOBS[giver.job] && JOBS[giver.job].playLabel) || '🎮 Play'; state.giverTarget = giver; }
    else if (Math.hypot(cp.x - (-6.2), cp.z - (-6.6)) < 1.9) { action = 'donate'; label = '💝 Donate 5 🪙'; }
    else if (Math.hypot(cp.x - (-8), cp.z - 5.4) < 2.0) { action = 'sleepshelter'; label = '😴 Nap here'; }
    else { const sc = nearestShelterCat(cp, 1.8); if (sc) { action = 'shelterplay'; label = '🧶 Play with ' + (sc.name || 'the cat'); state.playTarget = sc; } }
  } else if (state.inHouse) {
    const elena = (state.homeFamily || []).find(f => f.name === 'Elena' && f.group.visible);
    const nearElena = elena && Math.hypot(cp.x - elena.group.position.x, cp.z - elena.group.position.z) < 1.9;
    if (nearElena && state.carryBag) { action = 'givebag'; label = '🛍️ Give Elena the shopping'; }
    else if (nearElena && state.momRequest && !state.momRequest.told) { action = 'elenaneed'; label = '💬 See what Elena needs'; }
    else if (Math.hypot(cp.x - 2.55, cp.z - 1.0) < 1.7) { action = 'sleep'; label = '😴 Sleep'; }
    else if (Math.hypot(cp.x - 1.6, cp.z - 1.9) < 1.5) { action = 'eat'; label = '🍽️ Eat & Drink'; }
    else if (state.floor === 'ground' && Math.hypot(cp.x - 0.6, cp.z - 2.2) < 1.6) { action = 'decorate'; label = '🛋️ Decorate'; }
  } else if (state.carryingMouse && Math.hypot(cp.x - (-3), cp.z - (-7.7)) < 5) {
    action = 'showmouse'; label = '🐭 Show the Millers';
  } else if (typeof nearWater === 'function' && nearWater(cp.x, cp.z)) {
    action = 'drink'; label = '💧 Drink';
  } else {
    const rub = (typeof nearestRubble === 'function') ? nearestRubble(cp, 3.2) : null;
    const giver = (!isNight() && state.nearNPC && state.nearNPC.hasJob) ? state.nearNPC : null;
    const miller = nearestMiller(cp, 2.2);
    const bench = nearestUsableProp(cp, 'bench', 1.7);
    const fc = nearestFreedCat(cp, 2.0);
    if (rub) { action = 'cleanup'; label = '🧹 Clear rubble (' + CLEAN_COST + '🪙)'; state.cleanTarget = rub; }
    else if (giver) {   // a neighbour, park-folk or street minigame person — the prompt just appears when you walk up
      state.giverTarget = giver;
      if (giver.job === 'mayor') { action = 'turnin'; label = '🐭 Turn in mice'; }
      else if (giver.job === 'butcher') { action = 'sellbirds'; label = '🔪 Sell birds'; }
      else { action = 'playgame'; label = (JOBS[giver.job] && JOBS[giver.job].playLabel) || '🎮 Play a game'; }
    }
    else if (miller) {   // Elena takes the shopping wherever you find her — not just indoors
      if (miller.name === 'Elena' && state.carryBag) { action = 'givebag'; label = '🛍️ Give Elena the shopping'; state.talkTarget = miller; }
      else if (miller.name === 'Elena' && state.momRequest && !state.momRequest.told) { action = 'elenaneed'; label = '💬 See what Elena needs'; state.talkTarget = miller; }
      else { action = 'millertalk'; label = '💬 Talk'; state.talkTarget = miller; }
    }
    else if (bench) { action = 'sitbench'; label = '🪑 Sit'; state.sitTarget = bench; }
    else if (fc) { action = 'play'; label = '🧶 Play with ' + ((fc.cat && fc.cat.name) || fc.name || 'the cat'); state.playTarget = fc; }
    else {
      const jc = (typeof jobContext === 'function') ? jobContext(cp) : null;
      const sc2 = (typeof schoolContext === 'function') ? schoolContext(cp) : null;
      const bin = (typeof nearestTrashCan === 'function') ? nearestTrashCan(cp, 1.6) : null;
      const dbag = state.droppedBag && Math.hypot(cp.x - state.droppedBag.x, cp.z - state.droppedBag.z) < 1.5;
      if (jc) { action = jc.action; label = jc.label; }
      else if (sc2) { action = sc2.action; label = sc2.label; }
      else if (dbag) { action = 'pickbag'; label = '🛍️ Pick up the bag'; }
      else if (bin) { action = 'searchbin'; label = '🗑️ Search bin'; state.trashTarget = bin; }
      else if (state.carryBag) { action = 'dropbag'; label = '⬇️ Put the bag down'; }
      else { const p = nearestPerson(cp, 2.4); if (p) { action = 'pet'; label = '🤚 Get Petted'; state.petTarget = p; } }
    }
  }
  state.context = action;
  if (action) { btn.textContent = label; btn.classList.add('show'); }
  else btn.classList.remove('show');
}
function doContextAction() {
  if (state.context === 'eat') eatAtHome();
  else if (state.context === 'drink') drinkWater();
  else if (state.context === 'sleep') sleepAtHome();
  else if (state.context === 'pet') petByNPC(state.petTarget);
  else if (state.context === 'play') playWithCat(state.playTarget);
  else if (state.context === 'shelterplay') playWithCat(state.playTarget);
  else if (state.context === 'sleepshelter') sleepAtHome();
  else if (state.context === 'donate') donateAtShelter();
  else if (state.context === 'talkdad') talkToDad();
  else if (state.context === 'collectshop') collectShopEarnings();
  else if (state.context === 'grocery') startMinigame(state.shopChen);
  else if (state.context === 'showmouse') showMouseToMillers();
  else if (state.context === 'decorate') openHomeStore();
  else if (state.context === 'sitbench') catSitOnBench(state.sitTarget);
  else if (state.context === 'getup') catStandUp();
  else if (state.context === 'cleanup') hireCleanup(state.cleanTarget);
  else if (state.context === 'bizopen' || state.context === 'bizclose') toggleBizOpen();
  else if (state.context === 'bizcollect') collectBizTill();
  else if (state.context === 'millermovein') millerMoveIn(state.currentBoughtHome);
  else if (state.context === 'millermoveout') millerMoveIn(null);
  else if (state.context === 'millertalk') millerTalk(state.talkTarget);
  else if (state.context === 'playgame') startMinigame(state.giverTarget);
  else if (state.context === 'turnin') rewardMice(state.giverTarget);
  else if (state.context === 'sellbirds') openBargain(state.giverTarget);
  else if (state.context === 'searchbin') searchTrashCan(state.trashTarget);
  else if (state.context === 'applyjob') applyForJob(state.jobTarget);
  else if (state.context === 'shift') doShiftAction();
  else if (state.context === 'jobinfo') openJobPanel();
  else if (state.context === 'enterwork') { if (state.job) enterWorkplace(state.job.site); }
  else if (state.context === 'helpfind') openHelpFind(state._helpCust);
  else if (state.context === 'ringup') openCheckout(state._payCust);
  else if (state.context === 'stashcash') stashCash();
  else if (state.context === 'school') openSchool();
  else if (state.context === 'shopbuy') openShopBuy();
  else if (state.context === 'givebag') { pauseOutdoorElena(); giveBagToElena(); }
  else if (state.context === 'elenaneed') { pauseOutdoorElena(); tellElenaNeed(); }
  else if (state.context === 'dropbag') dropCarryBag();
  else if (state.context === 'pickbag') pickUpBag();
}
// If you hand Elena the shopping OUT IN TOWN, she stops walking and turns to you for the moment
function pauseOutdoorElena() {
  const m = state.talkTarget;
  if (!state.inHouse && m && m.name === 'Elena') m.talkPause = 220;
}
// Tell the Millers which home to live in (or send them back to the old house). Change your mind anytime.
function millerMoveIn(id) {
  state.millerHome = id || null;
  if (id) showDialogue('🏠 The Millers', "Our very own home — we're moving in! Bless you, little one. ❤️", 4600);
  else showNotif('🏠 The Millers packed up and moved back to the old house.');
  if (typeof sfx === 'function') sfx('upgrade');
  saveGame();
}
// ── The cat resting on a bench ──
function nearestUsableProp(cp, use, r) {
  if (typeof townProps === 'undefined') return null;
  let best = null, bd = r * r;
  for (const p of townProps) { if (p.use !== use) continue; const d = (p.x - cp.x) ** 2 + (p.z - cp.z) ** 2; if (d < bd) { bd = d; best = p; } }
  return best;
}
function catSitOnBench(prop) {
  if (!prop || state.inHouse || state.inShop || state.inShelter) return;
  state.catSitting = { x: prop.x, z: prop.z, rotY: prop.rotY || 0, y: 0.52 };
  catGroup.position.set(prop.x, 0.52, prop.z); catGroup.rotation.set(0, prop.rotY || 0, 0);
  if (typeof sfx === 'function') sfx('purr');
  if (typeof schoolEvent === 'function') schoolEvent('sitBench');
  showNotif('🪑 Having a little rest…');
}
function catStandUp() {
  const s = state.catSitting; if (!s) return;
  state.catSitting = null;
  catGroup.position.set(s.x, 0, s.z); catGroup.rotation.set(0, s.rotY, 0);
  legs.forEach(l => l.rotation.x = 0); tail.rotation.set(0, 0, 0);
}
function applyCatSitPose(t) {
  const s = state.catSitting;
  catGroup.position.set(s.x, s.y, s.z); catGroup.rotation.set(-0.22, s.rotY, 0);   // chest lifted
  legs[0].rotation.x = -0.1; legs[1].rotation.x = -0.1;   // front legs propping up
  legs[2].rotation.x = -1.15; legs[3].rotation.x = -1.15; // back legs folded FORWARD under the body
  catBody.scale.y = 0.96 + Math.sin(t * 2) * 0.02;
  tail.rotation.z = 0.5 + Math.sin(t * 2) * 0.12; tail.rotation.x = 0.2;
  state.needs.energy = Math.min(100, state.needs.energy + 0.05);   // a rest recovers a little energy
}

// ── Homelessness: demolishing a home displaces its people; new homes take them back in ──
const RESIDENTS_PER_HOUSE = 2;
function makeHomeless(n) {
  n = n || RESIDENTS_PER_HOUSE;
  for (let i = 0; i < n; i++) { if (typeof removeCommuter === 'function') removeCommuter(); }
  state.homelessCount = (state.homelessCount || 0) + n;
  if (state.gov) state.gov.happiness = Math.max(0, state.gov.happiness - n * 1.5);   // the town hates seeing people put out
  if (typeof updateHappyHUD === 'function') updateHappyHUD();
  updatePopulationHUD(); refreshBusinessIfOpen();
}
function rehouseOrGrow(n) {
  n = n || RESIDENTS_PER_HOUSE;
  const h = state.homelessCount || 0;
  const rehoused = Math.min(h, n);
  state.homelessCount = h - rehoused;
  for (let i = 0; i < rehoused; i++) { if (typeof addCommuter === 'function') addCommuter(); }   // they move back in
  if (rehoused && state.gov) state.gov.happiness = Math.min(100, state.gov.happiness + rehoused * 1.5);
  if (typeof updateHappyHUD === 'function' && rehoused) updateHappyHUD();
  refreshBusinessIfOpen();
  return { rehoused, grow: n - rehoused };
}
function refreshBusinessIfOpen() {
  const m = document.getElementById('business');
  if (m && m.classList.contains('show') && typeof renderBusiness === 'function') renderBusiness();
}
// New workplaces (businesses & public works) draw people to town to fill the jobs — the town grows
function attractNewcomers(humans, cats, _restoring) {
  for (let i = 0; i < (humans || 0); i++) if (typeof addCommuter === 'function') addCommuter();
  for (let i = 0; i < (cats || 0); i++) if (typeof addStreetCat === 'function') addStreetCat();
  if (!_restoring) {   // remember the growth so it survives a reload
    state.townGrowth = state.townGrowth || { humans: 0, cats: 0 };
    state.townGrowth.humans += (humans || 0); state.townGrowth.cats += (cats || 0);
  }
  updatePopulationHUD(); refreshBusinessIfOpen();
}

// ── Rubble left by a demolished building, and hiring a crew to clear it ──
const RUBBLE = [];
const CLEAN_COST = 500;
function spawnRubbleMesh(x, z, rec) {
  const g = new THREE.Group();
  const rubMat = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 1 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2e, roughness: 0.95 });
  for (let i = 0; i < 11; i++) {
    const s = 0.4 + Math.random() * 0.7;
    const m = new THREE.Mesh(new THREE.BoxGeometry(s, s * 0.6, s), Math.random() < 0.7 ? rubMat : woodMat);
    const a = Math.random() * Math.PI * 2, r = Math.random() * 2.0;
    m.position.set(Math.cos(a) * r, 0.2 + Math.random() * 0.45, Math.sin(a) * r);
    m.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
    m.castShadow = true; m.receiveShadow = true; g.add(m);
  }
  for (let i = 0; i < 3; i++) {   // a few leaning broken beams
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 0.16), woodMat);
    const a = Math.random() * Math.PI * 2;
    beam.position.set(Math.cos(a) * 1.1, 0.7, Math.sin(a) * 1.1);
    beam.rotation.set(0.5 + Math.random() * 0.6, Math.random() * Math.PI, 0.3);
    beam.castShadow = true; g.add(beam);
  }
  g.position.set(x, 0, z); scene.add(g);
  const coll = { type: 'circle', x, z, r: 2.0 };
  worldColliders.push(coll);
  const ent = { group: g, coll, x, z, rec, cleaning: false };
  RUBBLE.push(ent);
  return ent;
}
function buildRubble(x, z) {
  const rec = { x: +x.toFixed(1), z: +z.toFixed(1) };
  (state.rubble = state.rubble || []).push(rec);
  return spawnRubbleMesh(rec.x, rec.z, rec);
}
function rebuildRubble() { (state.rubble || []).forEach(r => spawnRubbleMesh(r.x, r.z, r)); }
function nearestRubble(cp, r) {
  let best = null, bd = r * r;
  for (const e of RUBBLE) { if (e.cleaning) continue; const d = (e.x - cp.x) ** 2 + (e.z - cp.z) ** 2; if (d < bd) { bd = d; best = e; } }
  return best;
}
function payCleanup(cost) {
  if (state.politics && state.politics.phase === 'president' && state.gov && !state.gov.jailed && state.gov.treasury >= cost) { state.gov.treasury -= cost; if (typeof updateHappyHUD === 'function') updateHappyHUD(); return true; }
  if (state.coins >= cost) { state.coins -= cost; document.getElementById('coin-count').textContent = state.coins; return true; }
  return false;
}
function hireCleanup(ent) {
  if (!ent || ent.cleaning) return;
  if (!payCleanup(CLEAN_COST)) { showNotif('You need ' + CLEAN_COST + ' 🪙 (or tax money) to hire a cleanup crew'); return; }
  ent.cleaning = true; ent.cleanT = 320;
  const i = worldColliders.indexOf(ent.coll); if (i >= 0) worldColliders.splice(i, 1);   // crew & cat can move in now
  if (typeof schoolEvent === 'function') schoolEvent('rubble');
  ent.workers = [];
  for (let k = 0; k < 2; k++) {
    const { group, parts } = buildHuman(randomPersonCfg());
    const a = k * Math.PI + 0.6;
    group.position.set(ent.x + Math.cos(a) * 1.5, 0, ent.z + Math.sin(a) * 1.5);
    group.rotation.y = a + Math.PI; scene.add(group);
    ent.workers.push({ group, parts });
  }
  if (typeof sfx === 'function') sfx('coin');
  showNotif('🧹 Cleanup crew hired — clearing the rubble…');
}
function updateCleanups() {
  const tt = performance.now() * 0.006;
  for (let i = RUBBLE.length - 1; i >= 0; i--) {
    const e = RUBBLE[i]; if (!e.cleaning) continue;
    e.cleanT--;
    (e.workers || []).forEach((w, k) => { if (w.parts && w.parts.arms) { w.parts.arms[0].rotation.x = Math.sin(tt + k) * 0.7 - 0.4; w.parts.arms[1].rotation.x = Math.sin(tt + k + 1) * 0.5 - 0.3; } });
    if (e.cleanT < 120) e.group.scale.setScalar(Math.max(0.01, e.cleanT / 120));   // rubble shrinks away
    if (e.cleanT <= 0) {
      scene.remove(e.group);
      (e.workers || []).forEach(w => scene.remove(w.group));
      if (state.rubble) { const j = state.rubble.indexOf(e.rec); if (j >= 0) state.rubble.splice(j, 1); }
      RUBBLE.splice(i, 1);
      showNotif('✨ All cleaned up — good as new!');
      if (typeof saveGame === 'function') saveGame();
    }
  }
}
function eatAtHome() {
  state.needs.hunger = 100; state.needs.thirst = 100;
  updateNeedsHUD();
  sfx('eat');
  showNotif('🍽️ The Millers had food & water ready for you');
  showDialogue(state.catName + ' 🐱', 'Mmm… full and happy. They always look after me. 😺', 3000);
}
function drinkWater() {
  state.needs.thirst = 100;
  updateNeedsHUD();
  sfx('eat');
  showNotif('💧 Ahh — fresh water');
}
// Rummage a bin: some are full (a fish!), some just scraps, some empty. Each needs time to refill.
function searchTrashCan(can) {
  if (!can) return;
  if (t < (can.refillAt || 0)) { showNotif('🗑️ Already picked this one clean — try another bin.'); return; }
  can.refillAt = t + 90 + Math.random() * 90;
  if (typeof schoolEvent === 'function') schoolEvent('searchBin');
  if (can.lid) { can.lid.rotation.z = 0.5; setTimeout(() => { if (can.lid) can.lid.rotation.z = 0.14; }, 900); }   // lid flips open then settles
  const roll = Math.random();
  if (roll < 0.3) {
    showNotif('🗑️ Nothing but rubbish in this one…');
    showDialogue(state.catName + ' 🐱', 'Bleh — nothing good in here.', 2400);
  } else if (roll < 0.72) {
    const food = 14 + Math.floor(Math.random() * 15);
    state.needs.hunger = Math.min(100, state.needs.hunger + food);
    updateNeedsHUD(); if (typeof sfx === 'function') sfx('eat');
    showNotif('🗑️ A few scraps to nibble (+' + food + ' hunger)');
  } else {
    const food = 36 + Math.floor(Math.random() * 24);
    state.needs.hunger = Math.min(100, state.needs.hunger + food);
    updateNeedsHUD(); if (typeof sfx === 'function') sfx('eat');
    _catHappyT = 1.0; spawnHeart();
    let extra = '';
    if (Math.random() < 0.25) { state.coins += 1; document.getElementById('coin-count').textContent = state.coins; extra = ' …and a stray 🪙!'; }
    showNotif('🐟 Jackpot — a whole fish in this bin! (+' + food + ' hunger)' + extra);
  }
}
const PET_STYLES = ['pat', 'kiss', 'scratch', 'cuddle', 'nuzzle'];
const PET_DUR = 1.5;
const _hearts = [];
let _catHappyT = 0;

function petByNPC(p) {
  if (!p) return;
  if (t - state.lastPet < 8) { showNotif('They just gave you a treat — back in a moment'); return; }
  state.lastPet = t;
  if (typeof schoolEvent === 'function') schoolEvent('petted');
  state.needs.hunger = Math.min(100, state.needs.hunger + 35);
  sfx('purr');
  updateNeedsHUD();
  if (!p.petStyle) p.petStyle = PET_STYLES[Math.floor(Math.random() * PET_STYLES.length)];  // each person has their own way
  p.petT = PET_DUR;
  _catHappyT = 1.3;
  spawnHeart(); setTimeout(spawnHeart, 240); setTimeout(spawnHeart, 480);
  const who = p.name || 'A neighbour';
  const flavour = { pat: 'gives you a gentle pat', kiss: 'plants a little kiss on your head', scratch: 'scratches behind your ears', cuddle: 'scoops you up for a warm cuddle', nuzzle: 'nuzzles you softly' }[p.petStyle];
  showNotif('🤚 ' + who + ' ' + flavour + ' 💗');
  showDialogue(who, "Aren't you a sweetheart? Here — a little treat too. 🐟", 3000);
}

// A floating heart over the cat when it's petted
function spawnHeart() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xe85a8a, emissive: 0x602030, emissiveIntensity: 0.6, transparent: true, opacity: 1 }));
  m.scale.set(1, 0.9, 0.5);
  m.position.set(catGroup.position.x + (Math.random() - 0.5) * 0.4, 0.7, catGroup.position.z + (Math.random() - 0.5) * 0.4);
  scene.add(m);
  _hearts.push({ mesh: m, t: 0 });
}
function updateHearts(dt) {
  for (let i = _hearts.length - 1; i >= 0; i--) {
    const h = _hearts[i];
    h.t += dt; h.mesh.position.y += dt * 0.8;
    h.mesh.material.opacity = Math.max(0, 1 - h.t / 1.4);
    h.mesh.scale.multiplyScalar(1 + dt * 0.3);
    if (h.t > 1.4) { scene.remove(h.mesh); _hearts.splice(i, 1); }
  }
}
// The person leans toward the cat and pets it in their own style
function faceCat(p) {
  const dx = catGroup.position.x - p.group.position.x, dz = catGroup.position.z - p.group.position.z;
  const heading = Math.atan2(dx, dz);
  p.group.rotation.y += (((heading - p.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.2;
}
function petAnimate(p) {
  const prog = 1 - p.petT / PET_DUR, s = Math.sin(prog * Math.PI);
  const arm = p.parts.arms && p.parts.arms[0], arm2 = p.parts.arms && p.parts.arms[1];
  const head = p.parts.head, torso = p.parts.torso;
  if (head) { head.rotation.x = 0; head.rotation.z = 0; }
  if (torso) torso.rotation.x = 0;
  if (p.petStyle === 'pat') { if (arm) arm.rotation.x = -1.3 + Math.sin(prog * Math.PI * 6) * 0.35; }
  else if (p.petStyle === 'kiss') { if (head) head.rotation.x = s * 0.8; if (torso) torso.rotation.x = s * 0.25; }
  else if (p.petStyle === 'scratch') { if (arm) arm.rotation.x = -1.4 + Math.sin(prog * Math.PI * 12) * 0.25; }
  else if (p.petStyle === 'cuddle') { if (torso) torso.rotation.x = s * 0.45; if (arm) arm.rotation.x = -1.2 * s; if (arm2) arm2.rotation.x = -1.2 * s; }
  else { if (head) { head.rotation.x = s * 0.5; head.rotation.z = Math.sin(prog * Math.PI * 5) * 0.2; } }   // nuzzle
}
function endPet(p) {
  if (p.parts.head) { p.parts.head.rotation.x = 0; p.parts.head.rotation.z = 0; }
  if (p.parts.torso) p.parts.torso.rotation.x = 0;
  if (p.parts.arms) p.parts.arms.forEach(a => { a.rotation.x = 0; });
}

// Night: lamps already glow; now the townsfolk head indoors and jobs pause till morning
function updateNightMode() {
  const night = isNight();
  if (night === state.isNightMode) return;
  state.isNightMode = night;
  const setVis = (arr, v) => arr.forEach(o => { if (o.group) o.group.visible = v; o.exiting = false; });
  // 🌙 every window in town glows warm at night — everyone's home
  if (typeof mat !== 'undefined' && mat.window) {
    mat.window.emissive.set(0xffd98a);
    mat.window.emissiveIntensity = night ? 0.95 : 0;
    mat.window.opacity = night ? 0.9 : 0.45;
  }
  if (night) {
    // instead of vanishing, the townsfolk WALK to the nearest front door and slip inside
    const sendHome = o => {
      if (!o.group || !o.group.visible || o.exiting) return;
      let best = null, bd = 1e9;
      (typeof HOUSES !== 'undefined' ? HOUSES : []).forEach(hh => { const d = (hh.x - (o.x || 0)) ** 2 + (hh.z - (o.z || 0)) ** 2; if (d < bd) { bd = d; best = hh; } });
      if (!best) { o.group.visible = false; return; }
      o.target = o.target || {};
      o.target.x = best.x + (Math.random() - 0.5) * 1.4;
      o.target.z = best.z + (best.rotY ? -3.4 : 3.4);   // their front doorstep
      // eject the doorstep out of any wall it landed in (rotated/moved houses) —
      // an unreachable doorstep left folk marching into the wall instead of slipping inside
      const safe = collide(o.target.x, o.target.z, worldColliders, 0.34);
      o.target.x = safe.x; o.target.z = safe.z;
      o.wstate = 'walk'; o.exiting = true; o.blockT = 0;
      if (o.act && typeof endAct === 'function') endAct(o);   // drop whatever they were doing
    };
    state.npcs.forEach(sendHome); state.peds.forEach(sendHome); state.commuters.forEach(sendHome);
  } else {
    setVis(state.npcs, true); setVis(state.peds, true); setVis(state.commuters, true);
  }
  if (state.football) { state.football.kids.forEach(o => { if (o.group) o.group.visible = !night; }); state.football.ball.visible = !night; }   // kids go home at night
  state.shelterCats.forEach(c => { if (c.nightOnly) c.group.visible = night; });   // the shelter fills up at night
  applyFamilyPresence();
  if (night) showDialogue(state.catName + ' 🐱', "The lamps are lit and warm windows are glowing — everyone's heading in. A peaceful night.", 4600);
  else showNotif('🌅 Morning — the town is waking up');
}
// ── The Millers walk a real daily routine outside the house ──
// A clip-safe waypoint path from the front door to each member's daytime spot.
const MILLER_HOME_SPOT = { x: -3, z: -7.0 };
// Where the family LIVES right now — the old poor house, or the bought home you moved them
// into. Every walk (leaving, coming home, escort drop-off) starts and ends here.
function millerHomeSpot() {
  if (typeof millersMovedOut === 'function' && millersMovedOut() && typeof PROPERTIES !== 'undefined') {
    const p = PROPERTIES.find(pp => pp.id === state.millerHome);
    if (p) return { x: p.x, z: p.z + 2.6 };   // their new front doorstep
  }
  return MILLER_HOME_SPOT;
}
const MILLER_DEST = {
  Daniel: { route: [{ x: -3, z: -6.3 }, { x: -18, z: -6.3 }], hideAtDest: () => state.owned.shop },  // to the shop (vanishes inside if he owns it)
  Elena:  { route: [{ x: -3, z: -6.3 }, { x: 10, z: -6.3 }] },                                         // off to the shops
  // Up to the town-square football — they stop at the SIDELINE and "join the game" (which the
  // football players already represent), so their walking copy hides there instead of standing
  // on top of its identical football twin (that overlap z-fought → flickering/lost body parts).
  Lily:   { route: [{ x: -3, z: -3 }, { x: -16, z: -3 }, { x: -16, z: 12 }, { x: -17, z: 13.4 }], hideAtDest: footballIsOn },
  Noah:   { route: [{ x: -3, z: -3 }, { x: -16, z: -3 }, { x: -16, z: 12 }, { x: -12, z: 13.4 }], hideAtDest: footballIsOn },
};
function footballIsOn() { return !!(state.football && state.football.ball && state.football.ball.visible); }
// Each Miller walks their OWN line: a personal side-offset, their own pace, and a staggered
// departure — so the family never walks stacked inside one another.
const MILLER_WALK = {
  Daniel: { ox: 0,    oz: 0,    sp: 0.030, delay: 0 },
  Elena:  { ox: 0.45, oz: 0.5,  sp: 0.027, delay: 70 },
  Lily:   { ox: -0.6, oz: -0.3, sp: 0.025, delay: 150 },
  Noah:   { ox: 0.6,  oz: 0.55, sp: 0.029, delay: 230 },
};
function millerPath(f, route) {   // the shared route, shifted onto this member's personal line
  const W = MILLER_WALK[f.name] || { ox: 0, oz: 0 };
  return route.map(w => ({ x: w.x + W.ox, z: w.z + W.oz }));
}
// This Miller's day-out route, computed fresh each trip. Elena's "the shops" endpoint
// follows the REAL shops (the player can move them across town with the planner) instead
// of a spot fixed in the old town layout.
function millerDayRoute(name) {
  const D = MILLER_DEST[name]; if (!D) return null;
  const route = D.route.map(w => ({ x: w.x, z: w.z }));
  if (name === 'Elena' && typeof JOB_SITES !== 'undefined' && JOB_SITES.length) {
    const H = millerHomeSpot();
    let best = null, bd = 1e9;
    for (const s of JOB_SITES) { const d2 = (s.x - H.x) ** 2 + (s.z - H.z) ** 2; if (d2 < bd) { bd = d2; best = s; } }
    if (best) route[route.length - 1] = { x: best.x + 2.6, z: best.z + 1.2 };   // on the pavement by the shopfront
  }
  return route;
}
function stepFamilyTo(f, tx, tz) {
  const p = f.group.position;
  // a waypoint the player built on top of gets pulled out to the nearest clear spot
  const safe = collide(tx, tz, worldColliders, 0.25);
  tx = safe.x; tz = safe.z;
  // walk via a detour waypoint when something blocks the direct line
  let gx = tx, gz = tz;
  if (f.det) {
    if (Math.hypot(f.det.x - p.x, f.det.z - p.z) < 0.18) f.det = null;
    else { gx = f.det.x; gz = f.det.z; }
  }
  const dx = gx - p.x, dz = gz - p.z, d = Math.hypot(dx, dz);
  if (d < 0.15) {
    if (f.det) { f.det = null; return false; }   // reached the sidestep — carry on to the waypoint
    f.blockT = 0; f.detN = 0;
    if (f.parts.legs) f.parts.legs.forEach(l => l.rotation.x *= 0.8);
    if (f.parts.arms) f.parts.arms.forEach(a => a.rotation.x *= 0.8);
    f.group.rotation.z *= 0.8; p.y *= 0.7;
    return true;
  }
  const W = MILLER_WALK[f.name];
  const step = Math.min((W && W.sp) || 0.028, d);
  // Respect walls & trees like everyone else (the player can move buildings onto the
  // family's route). Blocked → steer around it; blocked too long → treat the waypoint
  // as reached and move on, so a Miller can neither ghost through a building nor shove it forever.
  const nx = p.x + dx / d * step, nz = p.z + dz / d * step;
  const wc = collide(nx, nz, worldColliders, 0.2);
  if (Math.hypot(wc.x - nx, wc.z - nz) > 0.02) {
    f.blockT = (f.blockT || 0) + 1;
    if (f.blockT >= 8 && (f.detN || 0) < 5 && typeof findDetour === 'function') {
      const dt = findDetour(p.x, p.z, tx, tz);
      if (dt) { f.det = dt; f.detN = (f.detN || 0) + 1; f.blockT = 0; }
    }
    if (f.blockT > 55) { f.blockT = 0; f.det = null; f.detN = 0; return true; }
  } else f.blockT = 0;
  p.x = wc.x; p.z = wc.z;
  const heading = Math.atan2(dx, dz);
  f.group.rotation.y += (((heading - f.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.2;
  f.walkT = (f.walkT || 0) + 0.3; const sw = Math.sin(f.walkT);
  if (f.parts.legs) { f.parts.legs[0].rotation.x = sw * 0.5; f.parts.legs[1].rotation.x = -sw * 0.5; }
  if (f.parts.arms) { f.parts.arms[0].rotation.x = -sw * 0.4; f.parts.arms[1].rotation.x = sw * 0.4; }
  f.group.rotation.z = sw * 0.03;                          // the same subtle hip sway as the townsfolk
  p.y = Math.abs(sw) * 0.02;
  return false;
}
// Gentle shoulder-room: walking family members push apart if they drift into each other
function separateFamily() {
  const walkers = state.family.filter(f => f.group.visible && (f.phase === 'toWork' || f.phase === 'toHome'));
  for (let i = 0; i < walkers.length; i++) for (let k = i + 1; k < walkers.length; k++) {
    const a = walkers[i].group.position, b = walkers[k].group.position;
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
    if (d > 0.001 && d < 0.55) {
      const push = (0.55 - d) * 0.5;
      a.x -= dx / d * push; a.z -= dz / d * push;
      b.x += dx / d * push; b.z += dz / d * push;
    }
  }
}
function walkFamilyPath(f) {   // follow f.path waypoint by waypoint; true when finished
  if (!f.path || f.wp >= f.path.length) return true;
  const wp = f.path[f.wp];
  if (stepFamilyTo(f, wp.x, wp.z)) f.wp++;
  return f.wp >= f.path.length;
}
// A floating 🌳 bubble over a kid who's hoping you'll walk them to the park (so you can FIND them)
function updateParkMarker(f, t) {
  const want = f.wantsPark && f.group && f.group.visible;
  if (want) {
    if (!f.parkMark) {
      const tex = (typeof bubbleTexture === 'function') ? bubbleTexture('🌳') : null;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.66), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      f.group.add(m); f.parkMark = m;
    }
    f.parkMark.visible = true;
    f.parkMark.position.y = 2.85 + Math.sin(t * 3) * 0.12;
    f.parkMark.lookAt(camera.position);
  } else if (f.parkMark) f.parkMark.visible = false;
}
// Per-frame: the outside Millers leave home in the morning, spend the day out, and walk back in the evening
function updateFamilyRoutine(t) {
  const hour = state.dayTime * 24;
  state.family.forEach(f => {
    updateParkMarker(f, t);   // 🌳 shows over a kid who wants the park
    if (state.escort && state.escort.kid === f) {                 // the escort quest controls this kid
      if (playerIndoors()) {                                      // …but if you pop inside somewhere, they wait patiently
        if (!state.escort.waitNotified) { state.escort.waitNotified = true; showNotif('🧒 ' + f.name + ' is waiting for you outside!'); }
        idleHuman(f, t);
      } else state.escort.waitNotified = false;
      return;
    }
    if (typeof petUpdate === 'function' && petUpdate(f)) return;   // being petted → don't walk
    if (f.talkPause && f.talkPause-- > 0) {   // just talked to you — pause & face you a moment
      f.group.rotation.y = Math.atan2(catGroup.position.x - f.group.position.x, catGroup.position.z - f.group.position.z);
      idleHuman(f, t); return;
    }
    const out = millerPlan(f.name, hour).loc === 'out';
    if (!out) f.wantsPark = false;   // gone home — the request expires
    // out & about, a kid sometimes wishes you'd walk them to the park (tap them to accept)
    else if ((f.name === 'Lily' || f.name === 'Noah') && !f.wantsPark && !state.escort && !anyKidWantsPark() && Math.random() < 0.0005) {
      f.wantsPark = true; showNotif('🧒 ' + f.name + ' wants you to take them to the park! Find them & tap 💬');
    }
    const D = MILLER_DEST[f.name]; if (!D) { f.group.visible = false; return; }
    if (!f.phase) f.phase = 'home';
    // transitions — everyone gets their own offset line + a staggered start, so nobody overlaps
    const W = MILLER_WALK[f.name] || { ox: 0, oz: 0, delay: 0 };
    const HOME = millerHomeSpot();
    if (out && f.phase === 'home') { f.phase = 'toWork'; f.delay = W.delay || 0; f.group.position.set(HOME.x + W.ox * 0.4, 0, HOME.z + W.oz * 0.4); f.path = millerPath(f, millerDayRoute(f.name)); f.wp = 0; }
    if (!out && (f.phase === 'toWork' || f.phase === 'atWork')) { f.phase = 'toHome'; f.delay = W.delay || 0; f.path = millerPath(f, millerDayRoute(f.name).slice().reverse().concat([HOME])); f.wp = 0; }
    // behaviour
    if (f.phase === 'home') { f.group.visible = false; return; }
    if (f.phase === 'toWork') {
      if (f.delay > 0) { f.delay--; f.group.visible = false; return; }   // still lacing shoes indoors
      f.group.visible = true; if (walkFamilyPath(f)) f.phase = 'atWork';
    }
    else if (f.phase === 'atWork') {
      const hide = D.hideAtDest && D.hideAtDest();
      f.group.visible = !hide;
      if (!hide) idleHuman(f, t);   // idling at the shops / playing at the pitch
    } else if (f.phase === 'toHome') {
      if (f.delay > 0) { f.delay--; if (f.group.visible) idleHuman(f, t); return; }   // finishing up before heading back
      f.group.visible = true; if (walkFamilyPath(f)) f.phase = 'home';
    }
  });
  separateFamily();   // shoulder-room: nobody walks inside anybody
  if (state.dadAtShop && state.dadAtShop.group) state.dadAtShop.group.visible = false;
}
// Snap everyone to the right place instantly (on load / when the world jumps) — no walking
function applyFamilyPresence() {
  const hour = state.dayTime * 24;
  state.family.forEach(f => {
    const out = millerPlan(f.name, hour).loc === 'out';
    const D = MILLER_DEST[f.name]; if (!D) return;
    if (out) {
      const route = millerDayRoute(f.name);
      const dest = route[route.length - 1];
      f.group.position.set(dest.x, 0, dest.z);
      f.phase = 'atWork';
      f.group.visible = !(D.hideAtDest && D.hideAtDest());
    } else {
      f.phase = 'home'; f.group.visible = false;
    }
  });
  if (state.dadAtShop && state.dadAtShop.group) state.dadAtShop.group.visible = false;
}

function updateCars(dt) {
  state.cars.forEach(c => {
    c.group.position.x += c.dir * c.speed * dt;
    if (c.dir > 0 && c.group.position.x > 112) c.group.position.x = -112;
    else if (c.dir < 0 && c.group.position.x < -112) c.group.position.x = 112;
  });
}

// ─── The park: catchable mice & birds, the Mayor & the Butcher ───────────────────
function updateCritters() {
  const dt = 0.016, cp = catGroup.position;
  state.parkCritters.forEach(c => {
    const dc = Math.hypot(c.x - cp.x, c.z - cp.z);
    if (c.type === 'bird' && dc < 4) { c.dir = Math.atan2(c.z - cp.z, c.x - cp.x); c.speed = c.baseSpeed * 2.2; }  // birds flee
    else { c.turnT -= dt; if (c.turnT <= 0) { c.dir += (Math.random() - 0.5) * 1.5; c.turnT = 0.5 + Math.random() * 1.5; c.speed = c.baseSpeed; } }
    c.hop += dt * (c.type === 'bird' ? 10 : 6);
    const wx = Math.cos(c.dir), wz = Math.sin(c.dir);
    c.x += wx * c.speed * dt; c.z += wz * c.speed * dt;
    if (c.x < PARK.x0 + 1) { c.x = PARK.x0 + 1; c.dir = Math.PI - c.dir; }
    if (c.x > PARK.x1 - 1) { c.x = PARK.x1 - 1; c.dir = Math.PI - c.dir; }
    if (c.z < PARK.z0 + 1) { c.z = PARK.z0 + 1; c.dir = -c.dir; }
    if (c.z > PARK.z1 - 1) { c.z = PARK.z1 - 1; c.dir = -c.dir; }
    c.group.position.set(c.x, Math.abs(Math.sin(c.hop)) * (c.type === 'bird' ? 0.22 : 0.03), c.z);
    c.group.rotation.y = Math.atan2(wx, wz);
  });
}
function nearestCritter(pos, range) {
  let best = null, bestD = range;
  for (const c of state.parkCritters) { const d = Math.hypot(c.x - pos.x, c.z - pos.z); if (d < bestD) { bestD = d; best = c; } }
  return best;
}
function catchCritter(c) {
  scene.remove(c.group);
  const i = state.parkCritters.indexOf(c); if (i >= 0) state.parkCritters.splice(i, 1);
  if (c.type === 'mouse') { state.parkMice++; showNotif('🐭 Caught a mouse!  (' + state.parkMice + ')'); if (typeof schoolEvent === 'function') schoolEvent('mice'); }
  else { state.parkBirds++; showNotif('🐦 Caught a bird!  (' + state.parkBirds + ')'); if (typeof schoolEvent === 'function') schoolEvent('bird'); }
  sfx('catch');
  _catHappyT = 1.0; spawnHeart();
  updateParkTally();
  setTimeout(() => addParkCritter(c.type), 2500 + Math.random() * 2500);   // another wanders in
}
function rewardMice(npc) {
  if (state.parkMice <= 0) { showDialogue(npc.name, "The park's spotless? Catch the mice scurrying about and I'll reward you, friend.", 4000); return; }
  const pay = Math.round(state.parkMice * 2 * ((typeof schoolHas === 'function' && schoolHas('park')) ? 1.25 : 1));   // 🌳 ranger course pays better
  state.coins += pay; state.earned += pay;
  document.getElementById('coin-count').textContent = state.coins;
  sfx('coin');
  showNotif('🏅 Mayor paid +' + pay + ' 🪙');
  showDialogue(npc.name, `Splendid work keeping our park clean! ${pay} coins for ${state.parkMice} mice — the town thanks you.`, 4400);
  state.parkMice = 0; updateParkTally();
}
function openBargain(npc) {
  if (state.parkBirds <= 0) { showDialogue(npc.name, 'Bring me some plump birds and we’ll talk price, eh?', 3600); return; }
  state.uiOpen = true;
  state.bargainHaggles = 2;
  state.bargainOffer = state.parkBirds * 5;
  renderBargain();
  document.getElementById('bargain').classList.add('show');
}
function renderBargain() {
  document.getElementById('bargain-text').textContent = `You have ${state.parkBirds} bird${state.parkBirds === 1 ? '' : 's'}. Bert offers ${state.bargainOffer} 🪙.`;
  const hg = document.getElementById('bargain-haggle');
  hg.textContent = 'Haggle (' + state.bargainHaggles + ')';
  hg.disabled = state.bargainHaggles <= 0;
}
function bargainHaggle() {
  if (state.bargainHaggles <= 0) return;
  state.bargainHaggles--;
  const delta = Math.round((Math.random() * 2 - 0.6) * state.parkBirds);   // usually up, sometimes down
  state.bargainOffer = Math.max(state.parkBirds * 3, state.bargainOffer + delta);
  renderBargain();
}
function bargainAccept() {
  if (typeof schoolHas === 'function' && schoolHas('park')) state.bargainOffer = Math.round(state.bargainOffer * 1.25);   // 🌳 ranger course pays better
  state.coins += state.bargainOffer; state.earned += state.bargainOffer;
  document.getElementById('coin-count').textContent = state.coins;
  sfx('sell');
  showNotif('🪙 Sold ' + state.parkBirds + ' birds for ' + state.bargainOffer);
  state.parkBirds = 0; state.bargainOffer = 0;
  updateParkTally(); closeBargain();
}
function closeBargain() { state.uiOpen = false; document.getElementById('bargain').classList.remove('show'); }
// Town population — humans vs cats. Grows as you build homes & free shelter cats.
function townPopulation() {
  const humans = state.npcs.length + state.peds.length + state.commuters.length + state.family.length;
  const cats = state.streetCats.length + state.freedCats.length + 1;   // +1 = you
  return { humans, cats };
}
let _lastPopStr = '';
function updatePopulationHUD() {
  const el = document.getElementById('population');
  if (!el) return;
  const inside = state.inHouse || state.inShop || state.inShelter || state.inBoughtHome || state.inBiz;
  el.style.display = inside ? 'none' : 'flex';
  if (inside) return;
  const p = townPopulation();
  const str = '👤 ' + p.humans + ' 🐱 ' + p.cats;
  if (str !== _lastPopStr) { _lastPopStr = str; el.textContent = str; }
}
function updateParkTally() {
  const el = document.getElementById('park-tally');
  if (!el) return;
  const cp = catGroup.position;
  const inPark = !state.inHouse && cp.x > PARK.x0 - 4 && cp.x < PARK.x1 + 4 && cp.z > PARK.z0 - 4 && cp.z < PARK.z1 + 4;
  if (inPark || state.parkMice > 0 || state.parkBirds > 0) { el.textContent = '🐭 ' + state.parkMice + '   🐦 ' + state.parkBirds; el.classList.add('show'); }
  else el.classList.remove('show');
}

// ── Playing with your rescued cats ──
function nearestFreedCat(pos, range) {
  let best = null, bestD = range;
  for (const c of state.freedCats.concat(state.streetCats)) { const d = Math.hypot(c.group.position.x - pos.x, c.group.position.z - pos.z); if (d < bestD) { bestD = d; best = c; } }
  return best;
}
function playWithCat(fc) {
  if (!fc) return;
  if (typeof sfx === 'function') sfx('meow');                  // a happy hello from your friend
  if (typeof schoolEvent === 'function') schoolEvent('playCat');
  _catHappyT = 2.2;                                            // you bounce along with them the whole time
  fc.playT = 2.6;                                              // play-bow → pounces → happy spin
  spawnHeart(); setTimeout(spawnHeart, 350); setTimeout(spawnHeart, 800); setTimeout(spawnHeart, 1350); setTimeout(spawnHeart, 1900);
  state.needs.energy = Math.min(100, state.needs.energy + 12);
  updateNeedsHUD();
  sfx('purr'); setTimeout(() => sfx('purr'), 900);
  const nm = (fc.cat && fc.cat.name) || fc.name;
  showNotif(nm ? '🧶 You played with ' + nm + '! 💗' : '🧶 You played with your rescued friend!');
}
// A rescued cat strolling its patch of town — proper legs, tail and idle life
function updateFreedCat(c) {
  const dt = 0.016;
  if (c.playT > 0) {                                          // play time! a cute little routine, phase by phase
    c.playT -= dt;
    const P = c.playT, cp2 = catGroup.position;
    // always face your playmate
    const face = Math.atan2(cp2.x - c.group.position.x, cp2.z - c.group.position.z);
    c.group.rotation.y += (((face - c.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.2;
    if (P > 1.9) {                                            // 1) the play-bow: chest down, bottom up, tail high
      c.group.position.y = 0;
      c.group.rotation.x = 0.35;
      if (c.body) c.body.scale.y = 0.92;
      if (c.tail) { c.tail.rotation.x = -1.1; c.tail.rotation.z = Math.sin(t * 14) * 0.5; }
      c.legs.forEach((l, i) => l.rotation.x = i < 2 ? -0.7 : 0.15);
    } else if (P > 0.7) {                                     // 2) bouncy pounces at you & back, paws batting
      c.group.rotation.x *= 0.7;
      const h = Math.abs(Math.sin(P * 16));
      c.group.position.y = h * 0.3;
      const toYou = Math.sin(P * 8) * 0.014;                  // scoot toward you and back
      c.group.position.x += Math.sin(face) * toYou; c.group.position.z += Math.cos(face) * toYou;
      c.group.rotation.z = Math.sin(P * 12) * 0.24;
      if (c.tail) { c.tail.rotation.x = -0.95; c.tail.rotation.z = Math.sin(P * 26) * 0.45; }
      c.legs.forEach((l, i) => l.rotation.x = Math.sin(P * 24 + i * 1.6) * 0.7);
      if (c.body) c.body.scale.y = 1 + h * 0.07;
    } else {                                                  // 3) the happy finish: a joyful spin + tail flourish
      c.group.rotation.x *= 0.7;
      c.group.rotation.y += 0.24;
      c.group.position.y = Math.abs(Math.sin(P * 20)) * 0.18;
      if (c.tail) { c.tail.rotation.x = -1.2; c.tail.rotation.z = Math.sin(P * 30) * 0.5; }
      c.legs.forEach((l, i) => l.rotation.x = Math.sin(P * 26 + i) * 0.5);
    }
    if (c.playT <= 0) { c.group.rotation.x = 0; c.group.position.x = c.wx; c.group.position.z = c.wz; }   // settle back neatly
    return;
  }
  if (c.wstate !== 'walk') {                                  // resting / looking about
    c.wtimer -= dt;
    c.group.position.y *= 0.7; c.group.rotation.z *= 0.82;
    c.legs.forEach(l => { l.rotation.x *= 0.85; });
    c.tail.rotation.z = Math.sin(t * 2 + c.phase) * 0.18;
    c.tail.rotation.x += (-0.05 - c.tail.rotation.x) * 0.1;
    c.body.scale.y = 0.96 + Math.sin(t * 2 + c.phase) * 0.02;
    c.group.rotation.y += Math.sin(t * 0.6 + c.phase) * 0.0025;
    if (c.wtimer <= 0) {
      // like the townsfolk: only prowl to a spot with a CLEAR line — never straight into a tree
      for (let k = 0; k < 6; k++) {
        const a = Math.random() * Math.PI * 2, r = c.radius * (0.3 + Math.random() * 0.7);
        const tx = c.home.x + Math.cos(a) * r, tz = c.home.z + Math.sin(a) * r;
        if (typeof walkLineClear === 'function' && !walkLineClear(c.wx, c.wz, tx, tz)) continue;
        c.target = { x: tx, z: tz };
        c.wstate = 'walk';
        break;
      }
      if (c.wstate !== 'walk') c.wtimer = 2 + Math.random() * 4;   // boxed in — lounge a while & retry
    }
    return;
  }
  const goal = c.detour || c.target;
  const dx = goal.x - c.wx, dz = goal.z - c.wz, dist = Math.hypot(dx, dz);
  if (dist < 0.12 && c.detour) { c.detour = null; return; }   // rounded the obstacle — back on course
  if (dist < 0.12 || (c.blockT || 0) > 40) { c.blockT = 0; c.detour = null; c.detourN = 0; c.wstate = 'idle'; c.wtimer = 1.5 + Math.random() * 4; c.group.position.y = 0; return; }
  const step = Math.min(0.045, dist);
  const px2 = c.wx + dx / dist * step, pz2 = c.wz + dz / dist * step;
  const cc2 = collide(px2, pz2, worldColliders, 0.2);      // cats don't ghost through trees & walls either
  if (Math.hypot(cc2.x - px2, cc2.z - pz2) > 0.02) {
    c.blockT = (c.blockT || 0) + 1;
    if (c.blockT >= 8 && (c.detourN || 0) < 5 && typeof findDetour === 'function') {
      const dt = findDetour(c.wx, c.wz, c.target.x, c.target.z);
      if (dt) { c.detour = dt; c.detourN = (c.detourN || 0) + 1; c.blockT = 0; }
    }
  } else c.blockT = 0;
  c.wx = cc2.x; c.wz = cc2.z;
  c.group.position.x = c.wx; c.group.position.z = c.wz;
  const heading = Math.atan2(dx, dz);
  c.group.rotation.y += (((heading - c.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * 0.2;
  c.walkT += 0.3;
  c.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(c.walkT + ((i === 0 || i === 3) ? 0 : Math.PI)) * 0.5; });
  const b = Math.abs(Math.sin(c.walkT));
  c.group.position.y = b * 0.03; c.group.rotation.z = Math.sin(c.walkT) * 0.035;
  if (c.tail) { c.tail.rotation.x = -0.3 - b * 0.15; c.tail.rotation.z = Math.sin(c.walkT * 0.5) * 0.2; }
  if (c.body) c.body.scale.y = 1 + b * 0.025;
}

// Resting shelter cats: gentle breathing + tail flick, and a hop when you play
function idleShelterCat(c) {
  if (c.playT > 0) { c.playT -= 0.016; c.group.position.y = Math.abs(Math.sin(c.playT * 20)) * 0.25; return; }
  // cute random moments: chasing their tail, a wash, a big stretch
  if (!c.actT && Math.random() < 0.0012) { c.actT = 1.6 + Math.random() * 1.2; c.act = ['spin', 'groom', 'stretch'][Math.floor(Math.random() * 3)]; }
  if (c.actT > 0) {
    c.actT -= 0.016;
    if (c.act === 'spin') {                    // 🌀 chasing its tail in a tight circle
      c.group.rotation.y += 0.22;
      c.group.position.y = Math.abs(Math.sin(c.actT * 14)) * 0.08;
      c.tail.rotation.z = Math.sin(c.actT * 20) * 0.6; c.tail.rotation.x = -0.7;
      c.legs.forEach((l, i) => l.rotation.x = Math.sin(c.actT * 20 + i * 1.5) * 0.5);
      return;
    }
    if (c.act === 'groom') {                   // 🧼 washing: head dips to a raised front paw
      c.group.position.y = 0;
      c.legs[0].rotation.x = -1.1 + Math.sin(t * 8) * 0.15;
      c.body.scale.y = 0.94;
      c.tail.rotation.z = Math.sin(t * 2) * 0.15;
      return;
    }
    // 🙆 the big cat stretch: front low, back high
    c.group.rotation.x = 0.28; c.body.scale.y = 0.9;
    c.legs.forEach((l, i) => l.rotation.x = i < 2 ? -0.6 : 0.2);
    c.tail.rotation.x = -1.0;
    if (c.actT <= 0) { c.group.rotation.x = 0; c.body.scale.y = 1; }
    return;
  }
  c.group.rotation.x *= 0.8;
  c.group.position.y = 0;
  c.tail.rotation.z = Math.sin(t * 1.6 + c.phase) * 0.2;
  c.body.scale.y = 0.96 + Math.sin(t * 2 + c.phase) * 0.02;
}
// ── The shelter play ball: it rolls, and the nearest cats scamper over to bat it ──
function updateShelterBall(t) {
  const b = state.shelterBall; if (!b) return;
  // roll + slow down + bounce off the walls & the cat castle
  b.x += b.vx; b.z += b.vz; b.vx *= 0.985; b.vz *= 0.985;
  if (b.x < -10.6 || b.x > 10.6) b.vx = -b.vx;
  if (b.z < -6.8 || b.z > 6.8) b.vz = -b.vz;
  if (Math.abs(b.x) < 2.2 && b.z > -4.2 && b.z < 0.2) { b.vx = (b.x < 0 ? -1 : 1) * Math.max(0.02, Math.abs(b.vx)); }   // castle base
  b.x = Math.max(-10.6, Math.min(10.6, b.x)); b.z = Math.max(-6.8, Math.min(6.8, b.z));
  b.mesh.position.set(b.x, 0.14, b.z);
  b.mesh.rotation.x += Math.hypot(b.vx, b.vz) * 4; b.mesh.rotation.z += b.vx * 2;
  // one or two cats chase it while it's moving (or wander over to poke it back to life)
  const speed = Math.hypot(b.vx, b.vz);
  state.shelterCats.forEach((c, i) => {
    if (!c.group.visible || c.playT > 0 || c.actT > 0) return;
    if (i % 5 !== Math.floor(t / 9) % 5) return;               // take turns being interested
    const dx = b.x - c.group.position.x, dz = b.z - c.group.position.z, d = Math.hypot(dx, dz);
    if (d > 5.5) return;
    if (d > 0.4) {                                             // scamper toward the ball
      const st = Math.min(0.035, d);
      c.group.position.x += dx / d * st; c.group.position.z += dz / d * st;
      c.group.rotation.y = Math.atan2(dx, dz);
      c.walkT = (c.walkT || 0) + 0.32; const sw = Math.sin(c.walkT);
      c.legs.forEach((l, k) => l.rotation.x = Math.sin(c.walkT + (k % 2) * Math.PI) * 0.5);
      c.group.position.y = Math.abs(sw) * 0.04;
    } else if (speed < 0.02) {                                 // 🐾 BAT! send it rolling again
      const a = Math.random() * Math.PI * 2;
      b.vx = Math.cos(a) * 0.08; b.vz = Math.sin(a) * 0.08;
      c.playT = 0.5;                                           // a happy little hop
    }
  });
}
function nearestShelterCat(pos, range) {
  let best = null, bestD = range;
  for (const c of state.shelterCats) { if (!c.group.visible) continue; const d = Math.hypot(c.group.position.x - pos.x, c.group.position.z - pos.z); if (d < bestD) { bestD = d; best = c; } }
  return best;
}
function talkToDad() {
  const lines = [
    "Business is booming, thanks to you! I can hold my head high again.",
    "Elena and the kids have everything they need now. I owe it all to a little cat.",
    "Come by anytime, friend. There's always a warm corner here for you.",
    "Who'd have thought — the Millers, back on their feet. You did that.",
  ];
  showDialogue('Daniel 🔧', lines[Math.floor(Math.random() * lines.length)], 4200);
  sfx('purr');
}

// ── Dad's shop makes money all day; the till fills up until you come collect it ──
const SHOP_EARN_RATE = 0.02;   // coins per frame of daytime trading
function updateShopTill() {
  if (!state.owned.shop || !shopIsOpen()) return;             // only earns during open hours (8am–8pm)
  state.shopTill = Math.min(SHOP_TILL_CAP, (state.shopTill || 0) + SHOP_EARN_RATE);
}
function collectShopEarnings() {
  const amt = Math.floor(state.shopTill || 0);
  if (amt < 1) { showNotif('The till is empty — let the shop trade a while'); return; }
  state.coins += amt; state.shopTill -= amt;
  state.earned = (state.earned || 0) + amt;                    // honest income — counts toward your fame (the road to Mayor)
  document.getElementById('coin-count').textContent = state.coins;
  sfx('coin');
  showDialogue('Daniel 🔧', `Here's your share, ${state.catName} — ${amt} coins! The more the shop runs, the more it makes. 😺`, 4200);
  if (typeof checkPolitics === 'function') checkPolitics();
  saveGame();
}

// ── Self-run businesses: with no staff, YOU run it — open it & stand inside during
//    trading hours to fill the till, then collect it at the register. ──
const BIZ_EARN_RATE = 0.07, BIZ_TILL_CAP = 800;
function bizSelfRun(id) { return id && id !== 'factory' && typeof ownsBusiness === 'function' && ownsBusiness(id) && typeof bizIsStaffed === 'function' && !bizIsStaffed(id); }   // a factory can't be run by one cat — it needs a full crew
function updateBizTill() {
  const id = state.currentBiz;
  if (!state.inBiz || !bizSelfRun(id)) return;
  if (!(state.bizOpen && state.bizOpen[id]) || !shopIsOpen()) return;   // only when you've opened it, during trading hours
  state.bizTill = state.bizTill || {};
  const rate = BIZ_EARN_RATE * ((typeof schoolHas === 'function' && schoolHas('business')) ? 1.25 : 1);   // your 📊 degree pays off
  state.bizTill[id] = Math.min(BIZ_TILL_CAP, (state.bizTill[id] || 0) + rate);
}
function toggleBizOpen() {
  const id = state.currentBiz; if (!bizSelfRun(id)) return;
  state.bizOpen = state.bizOpen || {};
  state.bizOpen[id] = !state.bizOpen[id];
  if (state.bizOpen[id]) showNotif(shopIsOpen() ? '🔓 Open for business — takings are coming in!' : '🔓 Opened — but it only earns during trading hours (8am–8pm)');
  else showNotif('🔒 Closed up.');
  if (typeof sfx === 'function') sfx('coin');
}
function collectBizTill() {
  const id = state.currentBiz;
  const amt = Math.floor((state.bizTill && state.bizTill[id]) || 0);
  if (amt < 1) { showNotif('The till is empty — open up and let it trade a while'); return; }
  state.coins += amt; state.bizTill[id] -= amt;
  state.earned = (state.earned || 0) + amt;                    // honest income — counts toward your fame (the road to Mayor)
  document.getElementById('coin-count').textContent = state.coins;
  sfx('coin');
  showNotif('💰 Collected ' + amt + ' 🪙 from the ' + bizDef(id).name + '! Hire staff so it runs without you.');
  if (typeof checkPolitics === 'function') checkPolitics();
  saveGame();
}
// ─── 🛍️ The shopping bag: bought at a shop, carried home in your mouth ───────────
let _bagMesh = null;
function buildBagMesh() {
  const g = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 0.9 });
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.18), paper); bag.position.y = 0; bag.castShadow = true; g.add(bag);
  const fold = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.05, 0.19), new THREE.MeshStandardMaterial({ color: 0xb08e52, roughness: 0.9 })); fold.position.y = 0.14; g.add(fold);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.014, 6, 12), new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.7 }));
  handle.position.y = 0.2; g.add(handle);
  return g;
}
function setCarryBag(item, fromName) {
  state.carryBag = { item, from: fromName };
  if (!_bagMesh) _bagMesh = buildBagMesh();
  catGroup.add(_bagMesh);
  _bagMesh.position.set(0, 0.42, 0.98);   // hanging from the mouth
  _bagMesh.rotation.x = 0.15;
  _bagMesh.visible = true;
  if (typeof saveGame === 'function') saveGame();
}
function clearCarryBag() {
  state.carryBag = null;
  if (_bagMesh) { catGroup.remove(_bagMesh); _bagMesh.visible = false; }
  if (typeof saveGame === 'function') saveGame();
}
function dropCarryBag() {   // set it down where you stand (pick it up again later)
  const b = state.carryBag; if (!b) return;
  const mesh = buildBagMesh();
  mesh.position.set(catGroup.position.x, 0.16, catGroup.position.z);
  scene.add(mesh);
  state.droppedBag = { item: b.item, from: b.from, x: catGroup.position.x, z: catGroup.position.z, mesh };
  clearCarryBag();
  showNotif('⬇️ You set the bag down. (It\'ll wait right there.)');
}
function pickUpBag() {
  const d = state.droppedBag; if (!d) return;
  scene.remove(d.mesh);
  setCarryBag(d.item, d.from);
  state.droppedBag = null;
  showNotif('🛍️ Picked the bag back up — steady does it.');
}
// ─── 💭 Elena's shopping requests: see what she needs, fetch it, bring it home ────
function newMomRequest() {
  if (state.momRequest || state.carryBag || typeof JOB_SITES === 'undefined') return;
  if (Math.random() > 0.45) return;
  const s = JOB_SITES[Math.floor(Math.random() * JOB_SITES.length)];
  const prods = (typeof workProducts === 'function') ? workProducts(s.id) : [];
  if (!prods.length) return;
  const p = prods[Math.floor(Math.random() * prods.length)];
  state.momRequest = { itemId: p.id, itemName: p.name, e: p.e, siteId: s.id, siteName: s.name, told: false };
}
function tellElenaNeed() {
  const r = state.momRequest; if (!r) return;
  r.told = true;
  showDialogue('Elena 🏠', 'Oh, you clever thing — could you fetch us some ' + r.e + ' ' + r.itemName.toLowerCase() + '? ' + r.siteName.replace(/^the /, 'The ') + ' sells it. Take care on the road! ❤️', 6200);
  if (typeof saveGame === 'function') saveGame();
}
function giveBagToElena() {
  const b = state.carryBag; if (!b) return;
  const r = state.momRequest;
  const match = r && r.itemId === b.item.id;
  clearCarryBag();
  _catHappyT = 1.6; spawnHeart(); setTimeout(spawnHeart, 300);
  if (typeof sfx === 'function') sfx('purr');
  if (match) {
    state.momRequest = null;
    // running Mum's errand is a kindness, not a paid job — it builds your reputation
    state.goodDeeds = (state.goodDeeds || 0) + 1;
    if (typeof schoolEvent === 'function') schoolEvent('goodDeed');
    showDialogue('Elena 🏠', 'The ' + b.item.name.toLowerCase() + '! Exactly what we needed — you carried it all that way! You really are one of the family. ❤️', 5600);
    showNotif('❤️ A good deed — your reputation grows (see 📊)');
    if (typeof addGoodwill === 'function') addGoodwill(5, 'You fetched the shopping');
  } else {
    showDialogue('Elena 🏠', b.item.e + ' ' + b.item.name + '… for us? You sweet little thing. Every bit helps. ❤️', 4800);
    if (typeof addGoodwill === 'function') addGoodwill(2, 'A gift from the shops');
  }
  if (typeof saveGame === 'function') saveGame();
}

// ─── A stray town mouse to catch and proudly bring to the Millers ────────────────
function spawnStrayMouse() {
  const g = buildParkMouse();
  const x = -40 + Math.random() * 70, z = (Math.random() < 0.5 ? -12 : 6) + (Math.random() - 0.5) * 8;
  g.position.set(x, 0, z); scene.add(g);
  state.strayMouse = { group: g, x, z, dir: Math.random() * 6, speed: 0.035, turnT: 0, runT: 0 };
  showNotif('🐭 A stray mouse scurried into town! Pounce on it!');
}
function updateStrayMouse() {
  if (state.inHouse) return;
  if (!state.strayMouse) {
    if (state.carryingMouse) return;
    state.strayTimer -= 0.016;
    if (state.strayTimer <= 0) spawnStrayMouse();
    return;
  }
  const m = state.strayMouse, cp = catGroup.position;
  const dx = m.x - cp.x, dz = m.z - cp.z, d = Math.hypot(dx, dz);
  if (d < 5) { m.dir = Math.atan2(dz, dx); m.speed = 0.06; }
  else { m.turnT -= 0.016; if (m.turnT <= 0) { m.dir += (Math.random() - 0.5) * 1.5; m.turnT = 0.6 + Math.random() * 1.4; m.speed = 0.035; } }
  m.x += Math.cos(m.dir) * m.speed; m.z += Math.sin(m.dir) * m.speed;
  m.x = Math.max(-66, Math.min(48, m.x)); m.z = Math.max(-34, Math.min(50, m.z));   // stays out of the park
  m.runT += 0.2;
  m.group.position.set(m.x, Math.abs(Math.sin(m.runT)) * 0.03, m.z);
  m.group.rotation.y = Math.atan2(Math.cos(m.dir), Math.sin(m.dir));
}
function showMouseToMillers() {
  state.carryingMouse = false;
  state.strayTimer = 25 + Math.random() * 35;
  _catHappyT = 1.3; spawnHeart();
  if (state.disowned) { showDialogue('🏠 The Millers', "A little mouse, left on our doorstep… only you would do that. 😊", 4400); addGoodwill(6, 'You left a gift at their door'); }
  else showDialogue('🏠 The Millers', "Ewww! Get that thing away from the kitchen!  …Oh, it's from you. We can't stay cross with you. 😅", 4400);
  showNotif('🐭 You proudly presented your catch!');
}

// ─── Buying property: houses for the Millers & a shop for Dad (notes 8 & 9) ───────
function isOwned(p) { return p.type === 'shop' ? state.owned.shop : state.owned.homes.includes(p.id); }
function updatePropertyPrompt() {
  const btn = document.getElementById('property-btn');
  if (!btn) return;
  if (state.inHouse || state.uiOpen || mg.active) { btn.classList.remove('show'); state.nearProperty = null; return; }
  const cp = catGroup.position;
  let near = null;
  for (const p of PROPERTIES) { if (!isOwned(p) && Math.hypot(cp.x - p.x, cp.z - (p.z + 2.6)) < 3.2) { near = p; break; } }
  state.nearProperty = near;
  if (near) { btn.textContent = (near.type === 'shop' ? '🏪 Buy Dad a shop — ' : '🏡 Buy for the Millers — ') + near.price.toLocaleString('en-US') + ' 🪙'; btn.classList.add('show'); }
  else btn.classList.remove('show');
}
function buyProperty() {
  const p = state.nearProperty; if (!p) return;
  const label = (p.type === 'shop') ? 'Buy Dad a shop' : (state.homeless ? 'Buy this home for YOURSELF' : 'Buy a home for the Millers');
  payChoice(p.price, label, () => completeBuyProperty(p));   // president gets a tax-or-own-money choice
}
function completeBuyProperty(p) {
  sfx('coin');
  if (PROP_SIGNS[p.id]) PROP_SIGNS[p.id].visible = false;   // sign comes down once it's sold
  if (p.type === 'shop') {
    state.owned.shop = true; spawnDadAtShop(); applyFamilyPresence();
    const done = () => showDialogue('🏠 The Millers', "Daniel has a workshop again! He hasn't smiled like this in months — off to work in the mornings, home by night. Thank you. ❤️", 5000);
    if (typeof playShopCutscene === 'function') playShopCutscene(done); else done();
    addGoodwill(35, 'You gave Daniel his shop back');   // a huge kindness toward the family
  } else if (state.homeless) {
    // redemption: a disgraced ex-president buys their own home and starts fresh
    state.owned.homes.push(p.id); state.homeless = false; state.disgraced = false;
    const done = () => showDialogue(state.catName + ' 🐱', "A home of my own again. I clawed my way back — honestly, this time. The town might just forgive me. 🐾", 6000);
    if (typeof playRedemptionCutscene === 'function') playRedemptionCutscene(done); else done();
  } else {
    state.owned.homes.push(p.id);
    if (!state.disowned) showDialogue('🏠 The Millers', "A home of our own on this street… we never dared dream it. Do it up however you like — then pop inside and tell us to move in! 🏡", 5600);
    addGoodwill(35, 'You bought the family a home');
  }
  saveGame(); updatePropertyPrompt();
}
function spawnDadAtShop() { /* Dad now works inside the enterable shop (see buildShopInterior) */ }

// ─── Home Store (note 7): decorate the Miller home ──
function openHomeStore() { state.uiOpen = true; renderHomeStore(); document.getElementById('homestore').classList.add('show'); }
function closeHomeStore() { state.uiOpen = false; document.getElementById('homestore').classList.remove('show'); }
function renderHomeStore() {
  const ck = (typeof currentDecorCtx === 'function' && currentDecorCtx()) || 'home';
  document.getElementById('homestore-wallet').textContent = state.coins;
  const shop = (ck === 'shop');
  const titleEl = document.querySelector('#homestore .modal-title');
  if (titleEl) titleEl.textContent = (shop ? '🛒 Shop Supplies · ' : '🛋️ Home Store · ') + DECOR_CTX[ck].label;
  const list = decorList(ck);
  const grid = document.getElementById('homestore-grid'); grid.innerHTML = '';
  storeCatalog(ck).forEach(it => {
    const owned = list.includes(it.id);
    const card = document.createElement('div'); card.className = 'store-card';
    card.innerHTML = `<div class="store-icon">${it.icon}</div><div class="store-name">${it.name}</div>` +
      (owned ? '<div class="store-owned">✓ In this room</div>' : `<button class="store-buy" onclick="buyDecor('${it.id}')">${decorPrice(it)} 🪙</button>`);
    grid.appendChild(card);
  });
}
function decorPrice(it) {   // 🎨 the Art & Design degree buys furniture at 20% off
  return Math.round(it.price * ((typeof schoolHas === 'function' && schoolHas('art')) ? 0.8 : 1));
}
function buyDecor(id) {
  const ck = (typeof currentDecorCtx === 'function' && currentDecorCtx()) || 'home';
  const list = decorList(ck);
  const it = storeCatalog(ck).find(i => i.id === id); if (!it) return;
  if (!it.multi && list.includes(id)) return;                         // most items: one per room
  const instId = it.multi ? (id + '_' + Date.now().toString(36) + Math.floor(Math.random() * 900)) : id;   // walls: unlimited instances
  payChoice(decorPrice(it), 'Buy ' + it.name, () => {                  // President chooses tax or own money
    list.push(instId); buildDecorItem(instId, ck);
    sfx('upgrade'); renderHomeStore(); saveGame();
    if (typeof schoolEvent === 'function') schoolEvent('buyDecor');
    showNotif('🛋️ Added the ' + it.name + ' to ' + DECOR_CTX[ck].label + '!');
  });
}
// 💝 the shelter donation box — 5 🪙 for the cats; pays in reputation, not coins
function donateAtShelter() {
  if (state.coins < 5) { showNotif('You need 5 🪙 to donate…'); return; }
  state.coins -= 5; document.getElementById('coin-count').textContent = state.coins;
  state.goodDeeds = (state.goodDeeds || 0) + 1;
  if (typeof sfx === 'function') sfx('coin');
  _catHappyT = 1.2; spawnHeart();
  showNotif('💝 Donated 5 🪙 to the shelter — ❤️ your reputation grows (see 📊)');
  showDialogue('Dr. Amara 🩺', 'Every coin feeds a cat, little one. Thank you. ❤️', 3600);
  if (typeof addGoodwill === 'function') addGoodwill(2, 'A shelter donation');
  if (typeof schoolEvent === 'function') { schoolEvent('give', 5); schoolEvent('goodDeed'); }
  if (typeof saveGame === 'function') saveGame();
}
function sleepAtHome() {
  state.uiOpen = true;
  const fade = document.getElementById('fade');
  if (fade) fade.classList.add('show');
  setTimeout(() => {
    state.needs.energy = 100;
    state.needs.hunger = Math.max(8, state.needs.hunger - 12);
    state.needs.thirst = Math.max(8, state.needs.thirst - 12);
    state.dayTime = 0.28;                  // wake at morning
    updateNeedsHUD();
    showNotif('😴 You slept until morning');
    if (fade) fade.classList.remove('show');
    setTimeout(() => { state.uiOpen = false; }, 600);
  }, 1100);
}

// ─── Actions ──────────────────────────────────────────────────────────────────
function doJump() {
  if (mg.active || state.isJumping || state.uiOpen) return;
  state.isJumping = true;
  state.jumpT = 0;
  state.jumpBaseY = state.catBaseY || 0;   // hop starts from whatever tier you're standing on
  // a real cat leaps FORWARD in an arc — glide along the facing (outdoors; interiors stay vertical hops)
  const inside = state.inHouse || state.inShop || state.inShelter || state.inBoughtHome || state.inBiz || state.inWork || state.inJail;
  const fx = Math.sin(catGroup.rotation.y), fz = Math.cos(catGroup.rotation.y);
  state.jumpVx = inside ? 0 : fx * 0.05; state.jumpVz = inside ? 0 : fz * 0.05;
  if (typeof sfx === 'function') sfx('jump');
  if (!state.inHouse) {
    const c = nearestCritter(catGroup.position, 1.7); if (c) catchCritter(c);   // pounce on park critters
    const m = state.strayMouse;                                                  // …or the stray town mouse
    if (m && !state.carryingMouse && Math.hypot(m.x - catGroup.position.x, m.z - catGroup.position.z) < 1.7) {
      scene.remove(m.group); state.strayMouse = null; state.carryingMouse = true;
      _catHappyT = 1.0; sfx('catch'); showNotif('🐭 Got it! Now bring it home to the Millers…');
    }
  }
}

function doAction() {
  if (mg.active || state.uiOpen) return;
  if (isNight()) { showDialogue(state.catName + ' 🐱', "Everyone's asleep — no work until morning.", 2600); return; }
  if (!state.nearNPC) return;
  const npc = state.nearNPC;
  if (npc.job === 'mayor') { rewardMice(npc); return; }      // park: turn in caught mice
  if (npc.job === 'butcher') { openBargain(npc); return; }   // park: sell caught birds
  if (!npc.hasJob) {
    showDialogue(npc.name, 'Thank you so much, little one! Come back soon! 💛');
    return;
  }
  // The neighbour hires the cat to clear out their mice → start the minigame
  startMinigame(npc);
}

// ─── Pick up coins ─────────────────────────────────────────────────────────────
function checkCoinPickup() {
  const cx = catGroup.position.x, cz = catGroup.position.z;
  for (let i = state.coins3d.length - 1; i >= 0; i--) {
    const c = state.coins3d[i];
    const dx = c.x - cx, dz = c.z - cz;
    if (Math.sqrt(dx*dx + dz*dz) < 0.9) {
      scene.remove(c.mesh);
      state.coins3d.splice(i, 1);
      state.coins++; state.earned++;
      document.getElementById('coin-count').textContent = state.coins;
      updateFamilyStatus();
      sfx('coin');
      showNotif(`+1 🪙  (${state.coins} total)`);
    }
  }
}

// ─── Minimap ──────────────────────────────────────────────────────────────────
// ─── Full detailed town map (opened from the minimap / 🗺️ button) ────────────────
function mapMarks() {
  const marks = [
    { x: -3, z: -10, e: '🏠', label: 'Your Home', c: '#e88ab0' },
    { x: -46, z: 17, e: '🐾', label: 'Cat Shelter', c: '#f0c060' },
    { x: 0,  z: 20, e: '⛲', label: 'Town Square', c: '#a8c8e8' },
    { x: -16, z: 20, e: '⚽', label: 'Football', c: '#e8e8e8' },
    { x: 71, z: 33, e: '🌳', label: 'The Park', c: '#8ad884' },
    { x: -18, z: -9, e: '🏪', label: state.owned.shop ? "Dad's Shop" : 'Shop · for sale', c: '#8ac0f0' },
  ];
  const BIZ = { cafe: ['☕', 'Café'], bakery: ['🥐', 'Bakery'], market: ['🏬', 'Market'], factory: ['🏭', 'Factory'] };
  Object.keys(BIZ).forEach(id => {
    if (typeof ownsBusiness === 'function' && ownsBusiness(id) && typeof BUSINESS_LOTS !== 'undefined' && BUSINESS_LOTS[id]) {
      const b = BIZ[id], lot = BUSINESS_LOTS[id];
      marks.push({ x: lot.x, z: lot.z, e: b[0], label: b[1], c: '#d8b070' });   // follows the lot if you move the building
    }
  });
  if (typeof CIVIC_LOTS !== 'undefined') Object.keys(CIVIC_LOTS).forEach(id => { if (ownsCivic(id)) { const lot = CIVIC_LOTS[id], d = civicDef(id); marks.push({ x: lot.x, z: lot.z, e: d.icon, label: d.name, c: '#9ad0e0' }); } });
  if (typeof PROPERTIES !== 'undefined') PROPERTIES.forEach(p => {
    if (p.type !== 'home') return;
    if (state.owned.homes.includes(p.id)) marks.push({ x: p.x, z: p.z, e: '🏠', label: 'New Home', c: '#e0a0c0' });
    else marks.push({ x: p.x, z: p.z, e: '🏷️', label: 'For Sale', c: '#d05a5a' });
  });
  if (state.politics && state.politics.homes) state.politics.homes.forEach(h => marks.push({ x: h.x, z: h.z, e: '🏠', label: '', c: '#b0e0b0' }));
  // the shops you can work at (your current job is highlighted)
  if (typeof JOB_SITES !== 'undefined') JOB_SITES.forEach(s => {
    const mine = state.job && state.job.site === s.id;
    marks.push({ x: s.x, z: s.z, e: mine ? '💼' : s.emoji, label: mine ? 'Your Job' : s.name.replace(/^the /, ''), c: mine ? '#f0d060' : '#bcd0a0' });
  });
  if (typeof SCHOOL_SPOT !== 'undefined') marks.push({ x: SCHOOL_SPOT.x, z: SCHOOL_SPOT.z - 3, e: '🏫', label: 'Town School', c: '#e0b0a0' });
  state.family.forEach(f => {   // a kid who wants the park shows up on the big map too
    if (f.wantsPark && f.group && f.group.visible) marks.push({ x: f.group.position.x, z: f.group.position.z, e: '🧒', label: f.name + ' → park 🌳', c: '#a0e0a0' });
  });
  return marks;
}
function drawFullMap() {
  const cv = document.getElementById('map-canvas'); if (!cv) return;
  const D = 1040; cv.width = D; cv.height = D;
  const g = cv.getContext('2d');
  const SPAN = 224, S = D / SPAN, C = D / 2;
  const WX = x => C + x * S, WZ = z => C + z * S;
  const rr = (x, y, w, h, r) => { r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

  // ── grass + soft grid ──
  const bg = g.createLinearGradient(0, 0, 0, D); bg.addColorStop(0, '#c6e3a6'); bg.addColorStop(1, '#a9d787'); g.fillStyle = bg; g.fillRect(0, 0, D, D);
  g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1;
  for (let i = 0; i <= D; i += D / 14) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, D); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(D, i); g.stroke(); }

  // ── roads (cased, with a dashed centre line) ──
  const roadH = (z, halfW) => { const y = WZ(z), h = halfW * 2 * S; g.fillStyle = '#d9ccb4'; g.fillRect(0, y - h / 2 - 3, D, h + 6); g.fillStyle = '#f5f0e6'; g.fillRect(0, y - h / 2, D, h); g.save(); g.setLineDash([16, 13]); g.strokeStyle = '#dccca6'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y); g.lineTo(D, y); g.stroke(); g.restore(); };
  roadH(-26, 3); roadH(0, 3.5); roadH(38, 3.5);
  (state.placed || []).forEach(r => { if (r.type !== 'road') return; const horiz = Math.abs(Math.sin(r.rot || 0)) < 0.5, w = (horiz ? 6 : 4) * S, h = (horiz ? 4 : 6) * S; g.fillStyle = '#f5f0e6'; rr(WX(r.x) - w / 2, WZ(r.z) - h / 2, w, h, 3); g.fill(); });
  { const y = WZ(66); g.fillStyle = '#9aa0aa'; g.fillRect(0, y - 8, D, 16); g.save(); g.setLineDash([20, 15]); g.strokeStyle = '#f0e0a0'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, y); g.lineTo(D, y); g.stroke(); g.restore(); }

  // ── street names along the roads (reflect any you renamed) ──
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(120,100,68,0.6)'; g.font = '700 17px Georgia, serif';
  const sn = (k, def) => (state.streetNames && state.streetNames[k]) || def;
  [[-26, sn('south', 'SOUTH LANE')], [0, sn('main', 'MAIN STREET')], [38, sn('north', 'NORTH AVENUE')]].forEach(([z, name]) => [-160, 200].forEach(dx => g.fillText(name, C + dx, WZ(z))));
  g.restore();

  // ── town square plaza ──
  g.fillStyle = '#eae1cd'; rr(WX(-33), WZ(12), 66 * S, 16 * S, 12); g.fill(); g.strokeStyle = '#d3c6ac'; g.lineWidth = 2; g.stroke();

  // ── the park (rounded lawn with a dashed fence) ──
  g.fillStyle = '#93d16f'; rr(WX(PARK.x0), WZ(PARK.z0), (PARK.x1 - PARK.x0) * S, (PARK.z1 - PARK.z0) * S, 20); g.fill();
  g.save(); g.setLineDash([5, 5]); g.strokeStyle = '#6cab4b'; g.lineWidth = 2.5; g.stroke(); g.restore();

  // ── water (fountains, pond, lakes — all drinkable water) ──
  const water = (x, z, r) => { const px = WX(x), py = WZ(z), pr = Math.max(4, r * S); g.fillStyle = '#6fc6e2'; g.beginPath(); g.arc(px, py, pr, 0, 7); g.fill(); g.strokeStyle = '#49a8d2'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.arc(px - pr * 0.3, py - pr * 0.3, pr * 0.32, 0, 7); g.fill(); };
  (typeof waterSpots !== 'undefined' ? waterSpots : []).forEach(w => water(w.x, w.z, w.r));

  // ── building footprints ──
  const shadow = (x, y, w, h, r) => { g.fillStyle = 'rgba(40,30,15,0.14)'; rr(x + 2, y + 3, w, h, r); g.fill(); };
  const bldg = (x, z, w, d, fill, stroke) => { const bw = w * S, bh = d * S, bx = WX(x) - bw / 2, by = WZ(z) - bh / 2; shadow(bx, by, bw, bh, 4); g.fillStyle = fill; rr(bx, by, bw, bh, 4); g.fill(); g.strokeStyle = stroke; g.lineWidth = 1.5; g.stroke(); };
  (typeof townProps !== 'undefined' ? townProps : []).forEach(p => {
    if (p.kind === 'house') bldg(p.x, p.z, 5, 4, p.npc ? '#bcd6ea' : '#eccaa0', p.npc ? '#8bb3d6' : '#cba46e');   // shops (with a keeper) vs homes
  });
  bldg(-3, -10, 4.5, 3.5, '#f0c0d0', '#d888aa');                                        // the Miller home (highlighted)
  if (state.owned.shop) bldg(-18, -9, 5, 4, '#a9cfe8', '#7ba9cf');
  bldg(SHELTER.x, SHELTER.z, 13, 8, '#d4e6dd', '#8fbfae');                              // cat shelter
  if (typeof BUSINESS_LOTS !== 'undefined') for (const id in BUSINESS_LOTS) if (typeof ownsBusiness === 'function' && ownsBusiness(id)) bldg(BUSINESS_LOTS[id].x, -46, 7, 6, '#c9b6e0', '#a488c8');
  if (typeof CIVIC_LOTS !== 'undefined') for (const id in CIVIC_LOTS) if (typeof ownsCivic === 'function' && ownsCivic(id)) bldg(CIVIC_LOTS[id].x, CIVIC_LOTS[id].z, 9, 7, '#a9e0d0', '#6ec2ac');

  // ── trees & benches ──
  (typeof townProps !== 'undefined' ? townProps : []).forEach(p => {
    if (p.kind === 'tree') { g.fillStyle = '#4f9d38'; g.beginPath(); g.arc(WX(p.x), WZ(p.z), 4, 0, 7); g.fill(); g.strokeStyle = '#3c7e2a'; g.lineWidth = 1; g.stroke(); }
    else if (p.kind === 'bench') { g.fillStyle = '#9a7248'; g.fillRect(WX(p.x) - 3, WZ(p.z) - 2, 6, 4); }
  });

  // ── labelled pins for the landmarks ──
  g.textAlign = 'left'; g.textBaseline = 'middle';
  const minor = l => l === '' || l === 'New Home' || l === 'For Sale' || l === 'Football';
  const placed = [];
  mapMarks().forEach(m => {
    const px = WX(m.x), py = WZ(m.z);
    if (minor(m.label)) { g.font = '20px serif'; g.textAlign = 'center'; g.fillText(m.e, px, py); g.textAlign = 'left'; return; }
    g.font = '600 18px Georgia, serif'; const tw = g.measureText(m.label).width, w = tw + 44, h = 32, x = px - w / 2; let y = py - 46, guard = 0;
    while (placed.some(r => x + w > r.x && x < r.x + r.w && y + h > r.y && y < r.y + r.h) && guard++ < 10) y -= h + 6;   // stack up to avoid overlaps
    placed.push({ x, y, w, h });
    g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, y + h); g.lineTo(px, py); g.stroke();
    g.fillStyle = m.c; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(px, py, 7, 0, 7); g.fill(); g.stroke();
    shadow(x, y, w, h, 16); g.fillStyle = 'rgba(255,253,247,0.97)'; rr(x, y, w, h, 16); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.10)'; g.lineWidth = 1; g.stroke();
    g.font = '21px serif'; g.fillText(m.e, x + 10, y + h / 2 + 1);
    g.fillStyle = '#3a2e20'; g.font = '600 18px Georgia, serif'; g.fillText(m.label, x + 37, y + h / 2 + 1);
  });

  // ── YOU ──
  const p = state.mapPos || { x: -3, z: -5 }, px = WX(p.x), py = WZ(p.z);
  g.fillStyle = 'rgba(240,190,60,0.28)'; g.beginPath(); g.arc(px, py, 20, 0, 7); g.fill();
  g.fillStyle = '#f0b828'; g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.beginPath(); g.arc(px, py, 9, 0, 7); g.fill(); g.stroke();
  g.font = '18px serif'; g.textAlign = 'center'; g.fillText('🐱', px, py + 1);
  g.font = '700 17px Georgia, serif'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.strokeText('YOU', px, py - 20); g.fillStyle = '#fff8dc'; g.fillText('YOU', px, py - 20);

  // ── legend ──
  const lg = [['🏠', 'Homes', '#eccaa0'], ['🏪', 'Shops', '#bcd6ea'], ['💼', 'Business', '#c9b6e0'], ['🏥', 'Civic', '#a9e0d0'], ['💧', 'Water', '#6fc6e2'], ['🐱', 'You', '#f0b828']];
  const lw = 168, lh = 26 * lg.length + 18, lx = 18, ly = D - lh - 18;
  shadow(lx, ly, lw, lh, 14); g.fillStyle = 'rgba(255,253,247,0.95)'; rr(lx, ly, lw, lh, 14); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.1)'; g.lineWidth = 1; g.stroke();
  g.textAlign = 'left'; g.textBaseline = 'middle';
  lg.forEach((it, i) => { const ry = ly + 20 + i * 26; g.fillStyle = it[2]; rr(lx + 14, ry - 8, 16, 16, 4); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1; g.stroke(); g.fillStyle = '#3a2e20'; g.font = '600 16px Georgia, serif'; g.fillText(it[0] + '  ' + it[1], lx + 40, ry + 1); });

  // ── compass + frame ──
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(255,253,247,0.92)'; g.beginPath(); g.arc(D - 52, 52, 26, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1.5; g.stroke();
  g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(D - 52, 34); g.lineTo(D - 46, 52); g.lineTo(D - 58, 52); g.closePath(); g.fill();
  g.fillStyle = '#3a2e20'; g.font = '700 14px Georgia, serif'; g.fillText('N', D - 52, 62);
  g.strokeStyle = 'rgba(90,74,58,0.45)'; g.lineWidth = 7; rr(5, 5, D - 10, D - 10, 16); g.stroke();
}
function openMap() {
  if (typeof sfx === 'function') sfx('ui');
  if (!state.gameStarted) return;
  state.uiOpen = true; drawFullMap();
  document.getElementById('map').classList.add('show');
}
function closeMap() { state.uiOpen = false; document.getElementById('map').classList.remove('show'); }

const mmCanvas = document.getElementById('minimap-canvas');
const mmCtx = mmCanvas.getContext('2d');
function drawMinimap() {
  const g = mmCtx, D = 240, S = D / 236, C = D / 2, X = x => C + x * S, Z = z => C + z * S;
  g.fillStyle = '#b3dc93'; g.fillRect(0, 0, D, D);                                    // grass
  const road = (z, hw) => { const y = Z(z), h = hw * 2 * S; g.fillStyle = '#d9ccb4'; g.fillRect(0, y - h / 2 - 2, D, h + 4); g.fillStyle = '#f5f0e6'; g.fillRect(0, y - h / 2, D, h); };
  road(-26, 3); road(0, 3.5); road(38, 3.5);
  g.fillStyle = '#9aa0aa'; g.fillRect(0, Z(66) - 5, D, 10);                           // highway
  g.fillStyle = '#93d16f'; g.fillRect(X(PARK.x0), Z(PARK.z0), (PARK.x1 - PARK.x0) * S, (PARK.z1 - PARK.z0) * S);   // park
  g.fillStyle = '#eae1cd'; g.fillRect(X(-33), Z(12), 66 * S, 16 * S);                // square
  (typeof waterSpots !== 'undefined' ? waterSpots : []).forEach(w => { g.fillStyle = '#6fc6e2'; g.beginPath(); g.arc(X(w.x), Z(w.z), Math.max(2.5, w.r * S), 0, 7); g.fill(); });
  const blk = (x, z, w, d, col) => { g.fillStyle = col; g.fillRect(X(x) - w * S / 2, Z(z) - d * S / 2, w * S, d * S); };
  (typeof townProps !== 'undefined' ? townProps : []).forEach(p => { if (p.kind === 'house') { g.fillStyle = p.npc ? '#a7c8e2' : '#e0bd8e'; g.fillRect(X(p.x) - 2.5, Z(p.z) - 2, 5, 4); } });
  blk(-3, -10, 4.5, 3.5, '#f0a8c4');                                                  // Miller home
  if (state.owned.shop) blk(-18, -9, 5, 4, '#8ac0f0');
  blk(SHELTER.x, SHELTER.z, 13, 8, '#bfe0d4');
  if (typeof BUSINESS_LOTS !== 'undefined') for (const id in BUSINESS_LOTS) if (typeof ownsBusiness === 'function' && ownsBusiness(id)) blk(BUSINESS_LOTS[id].x, BUSINESS_LOTS[id].z, 7, 6, '#c0a8dc');
  if (typeof CIVIC_LOTS !== 'undefined') for (const id in CIVIC_LOTS) if (typeof ownsCivic === 'function' && ownsCivic(id)) blk(CIVIC_LOTS[id].x, CIVIC_LOTS[id].z, 9, 7, '#9ad8c6');
  if (typeof JOB_SITES !== 'undefined') JOB_SITES.forEach(s => blk(s.x, s.z - 3, 6, 5, (state.job && state.job.site === s.id) ? '#f0d878' : '#d6c6a2'));   // the shops you can work at
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '15px serif';           // key landmark icons
  [['🏠', -3, -10], ['🏪', -18, -9], ['🐾', SHELTER.x, SHELTER.z], ['⛲', 0, 20], ['🌳', 71, 33]].forEach(([e, x, z]) => g.fillText(e, X(x), Z(z)));
  if (state.job) g.fillText('💼', X(state.job.x), Z(state.job.z - 3));                  // where you work
  if (typeof SCHOOL_SPOT !== 'undefined') g.fillText('🏫', X(SCHOOL_SPOT.x), Z(SCHOOL_SPOT.z - 3));   // the Town School
  state.family.forEach(f => {   // a kid hoping for a park trip pings on the minimap
    if (f.wantsPark && f.group && f.group.visible) g.fillText('🌳', X(f.group.position.x), Z(f.group.position.z));
  });
  const cp = catGroup.position, ca = state.catAngle || 0, cx = X(cp.x), cz = Z(cp.z);  // you (with facing)
  g.fillStyle = 'rgba(240,190,60,0.4)'; g.beginPath(); g.arc(cx, cz, 13, 0, 7); g.fill();
  const fx = Math.sin(ca), fz = Math.cos(ca), px = -fz, pz = fx;
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx + fx * 13, cz + fz * 13); g.lineTo(cx + px * 5, cz + pz * 5); g.lineTo(cx - px * 5, cz - pz * 5); g.closePath(); g.fill();
  g.fillStyle = '#f0b828'; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cz, 6.5, 0, 7); g.fill(); g.stroke();
}

// ─── Game Loop ────────────────────────────────────────────────────────────────
let t = 0;
function animate() {
  requestAnimationFrame(animate);
  if (!state.gameStarted) return;
  if (mg.active) return;   // overworld pauses while the mouse-catching minigame is open
  t += 0.016;
  if (state._stairCd > 0) state._stairCd--;   // brief pause between floor transitions on the stairs
  if (t - (state._lastSave || 0) > 6) { state._lastSave = t; saveGame(); }   // autosave every ~6s
  updateDayNight(0.016);
  updateNeeds(0.016);
  if (typeof schoolTick === 'function') schoolTick();   // 🏫 "hold N coins"-style lesson checks
  updateShopTill();   // Dad's shop keeps earning during open hours
  updateBizTill();    // a self-run (worker-less) business fills its till while you run it
  updateShopSign();   // flip the OPEN/CLOSED sign with the clock
  if (typeof updateBizSigns === 'function') updateBizSigns();   // OPEN (staffed) / CLOSED (self-run) plaques on your businesses

  if (state.planning) { updatePlannerFrame(); return; }   // SimCity-style top-down build mode

  // The Millers' outdoor routine ALWAYS ticks — even while you're inside a building —
  // so nobody freezes mid-street with time still passing. Their indoor copies wait for
  // the outdoor walker to reach the front door (millerStillOutside), so a Miller can
  // never be seen in two places at once.
  updateFamilyRoutine(t);

  // Movement (relative to where the camera is facing) — keyboard OR the 360° joystick
  const up    = state.keys['ArrowUp']   || state.keys['w'];
  const down  = state.keys['ArrowDown'] || state.keys['s'];
  const left  = state.keys['ArrowLeft'] || state.keys['a'];
  const right = state.keys['ArrowRight']|| state.keys['d'];
  let inF = (up ? 1 : 0) - (down ? 1 : 0);
  let inS = (right ? 1 : 0) - (left ? 1 : 0);
  let moveMag = (inF !== 0 || inS !== 0) ? 1 : 0;
  if (joy.active && Math.hypot(joy.x, joy.y) > 0.18) {   // dead zone so a resting thumb doesn't drift
    inF = -joy.y; inS = joy.x;                           // stick up = walk away from the camera
    moveMag = Math.min(1, Math.hypot(joy.x, joy.y));     // gentle tilt = slow prowl, full tilt = full stride
  }
  const moving = !state.uiOpen && !state.cinematic && moveMag > 0;
  if (state.catSitting && (moving || state.isJumping)) catStandUp();   // get up to walk/hop

  // ── Sprint: hold Run to dash for up to 5s, then a 3s rest before running again ──
  const R = state.run, RDT = 0.016;
  const runHeld = state.keys['Shift'] || joy.sprint;   // keyboard Shift, or the knob pushed past the ring
  // too hungry or sleepy to sprint
  const tired = state.needs.energy < 12 || state.needs.hunger < 12;
  const sprinting = runHeld && moving && R.stamina > 0 && !R.cooldown && state.needs.energy > 10 && state.needs.hunger > 10 && !state.carryBag;   // can't run with a bag in your mouth
  if (sprinting) {
    R.stamina = Math.max(0, R.stamina - RDT);
    if (R.stamina === 0) R.cooldown = true;                       // spent → forced rest
  } else {
    R.stamina = Math.min(R.max, R.stamina + RDT * (R.max / R.rest)); // refills in ~3s
    if (R.cooldown && R.stamina >= R.max) R.cooldown = false;
  }
  updateStaminaUI(sprinting);
  const speed = (sprinting ? 0.17 : 0.095) * moveMag * (tired ? 0.6 : 1) * (state.carryBag ? 0.55 : 1);   // sluggish when run-down; a careful plod with the shopping
  if (moving) {
    const fX = -Math.sin(state.camYaw), fZ = -Math.cos(state.camYaw);
    const rX =  Math.cos(state.camYaw), rZ = -Math.sin(state.camYaw);
    let wx = fX * inF + rX * inS, wz = fZ * inF + rZ * inS;
    const len = Math.hypot(wx, wz) || 1; wx /= len; wz /= len;
    catGroup.position.x += wx * speed;
    catGroup.position.z += wz * speed;
    state.catAngle = Math.atan2(wx, wz);
    // Smooth turning: ease toward the new heading (shortest arc) and BANK into the turn
    let dA = state.catAngle - catGroup.rotation.y;
    while (dA > Math.PI) dA -= Math.PI * 2; while (dA < -Math.PI) dA += Math.PI * 2;
    const turnStep = dA * (sprinting ? 0.35 : 0.28);
    catGroup.rotation.y += turnStep;
    state._lean = (state._lean || 0) * 0.82 + turnStep * (sprinting ? 0.9 : 0.6);   // lean builds with sharp turns, relaxes after
    state._lean = Math.max(-0.3, Math.min(0.3, state._lean));
    // Walking/running gait — a springy diagonal trot, faster & bouncier when sprinting
    const gait = sprinting ? 17 : 10, amp = sprinting ? 0.72 : 0.52;   // paws keep pace with the quicker stride
    legs.forEach((leg, i) => { const phase = (i === 0 || i === 3) ? 0 : Math.PI; leg.rotation.x = Math.sin(t * gait + phase) * amp; });
    const bounce = Math.abs(Math.sin(t * gait));
    catGroup.position.y = (state.catBaseY || 0) + bounce * (sprinting ? 0.08 : 0.045);   // springy bob (rides the castle tier in the shelter)
    catGroup.rotation.z = Math.sin(t * gait) * (sprinting ? 0.06 : 0.04) - state._lean; // gentle body roll + banking into turns
    catBody.scale.y = 1 + bounce * 0.03;
    tail.rotation.x = -0.4 - bounce * 0.2;                                // tail carried up while trotting
    tail.rotation.z = Math.sin(t * gait * 0.5) * 0.22;
    // Resolve collisions (walls / furniture / trees), then clamp to the area
    const hit = collide(catGroup.position.x, catGroup.position.z, activeColliders(), state.inHouse ? 0.16 : 0.24);
    catGroup.position.x = hit.x; catGroup.position.z = hit.z;
    let bx = 94, bzMin = -50, bzMax = 56;   // reach south to the business row (z -46)
    if (state.inHouse) { bx = 3.2; bzMin = -2.6; bzMax = 2.6; }
    else if (state.inShop) { bx = 6.4; bzMin = -4.6; bzMax = 4.4; }   // incl. behind Dad's counter
    else if (state.inShelter) { bx = 11.4; bzMin = -7.4; bzMax = 7.4; }
    else if (state.inBoughtHome) { bx = 5.4; bzMin = -3.9; bzMax = 3.9; }
    else if (state.inBiz) { if (state.inCivic) { bx = 11.2; bzMin = -8.2; bzMax = 8.2; } else { bx = 6.4; bzMin = -4.6; bzMax = 4.4; } }   // reach behind the counter
    else if (state.inWork) { bx = 6.6; bzMin = -4.6; bzMax = 4.4; }   // your workplace shop floor (incl. behind the counter)
    else if (state.inJail) { bx = 3.1; bzMin = -2.5; bzMax = 2.6; }   // locked in the cell
    catGroup.position.x = Math.max(-bx, Math.min(bx, catGroup.position.x));
    catGroup.position.z = Math.max(bzMin, Math.min(bzMax, catGroup.position.z));
  }

  // Cat castle (shelter): rest on the tier you're standing over; auto-hop small steps up, fall off edges
  if (state.inShelter && typeof shelterSurfaceY === 'function') {
    const surf = shelterSurfaceY(catGroup.position.x, catGroup.position.z);
    const base = state.catBaseY || 0;
    if (!state.isJumping) {
      if (surf > base + 0.001) { if (surf - base <= 0.5) state.catBaseY = surf; }   // step up a tier
      else state.catBaseY = Math.max(surf, base - 0.14);                            // ease down / fall off
    }
  } else if (state.inHouse && state.floor === 'ground' && typeof houseStairY === 'function') {
    // 🪜 the Millers' REAL staircase: walk onto it and climb, step by step
    const surf = houseStairY(catGroup.position.x, catGroup.position.z);
    const base = state.catBaseY || 0;
    if (!state.isJumping) {
      if (surf > base + 0.001) { if (surf - base <= 0.3) state.catBaseY = surf; }
      else state.catBaseY = Math.max(surf, base - 0.14);
    }
    if (!state.isJumping && (state._stairCd || 0) <= 0 && state.catBaseY >= 2.3) walkUpstairs();   // reached the top → upstairs
  } else if (!state.inHouse) { state.catBaseY = 0; }

  // Jump animation — a real cat leap: an ARC (nose up on the rise, nose down on the fall) with a forward glide
  if (state.isJumping) {
    state.jumpT += 0.07;
    const jp = Math.min(1, state.jumpT), s = Math.sin(jp * Math.PI);
    catGroup.position.y = (state.jumpBaseY || 0) + s * 1.0;
    catGroup.rotation.x = -Math.cos(jp * Math.PI) * 0.34;                 // pitch through the arc: nose up → level → nose down
    if (state.jumpVx || state.jumpVz) {                                    // forward lunge along the arc
      catGroup.position.x += state.jumpVx * (0.35 + s * 0.85);
      catGroup.position.z += state.jumpVz * (0.35 + s * 0.85);
      const jh = collide(catGroup.position.x, catGroup.position.z, activeColliders(), 0.24);
      catGroup.position.x = jh.x; catGroup.position.z = jh.z;
    }
    const stretch = 1 + s * 0.16 - (jp < 0.14 || jp > 0.86 ? 0.14 : 0);   // squash on take-off/land, stretch mid-air
    catBody.scale.y = stretch; catBody.scale.x = catBody.scale.z = 1 - (stretch - 1) * 0.5;
    tail.rotation.x = -0.6 - s * 0.6;                                     // tail streams up & back
    legs.forEach((leg, i) => { leg.rotation.x = s * (i < 2 ? -0.7 : 0.7); });   // tuck front, kick back
    catGroup.rotation.z *= 0.7;
    if (state.jumpT >= 1) {
      state.isJumping = false;
      state.landT = 0.22;                         // landing impact: a quick squash that springs back
      catBody.scale.x = catBody.scale.z = 1;
      catGroup.rotation.x = 0;                    // level out on touchdown
      state.catBaseY = (state.inShelter && typeof shelterSurfaceY === 'function') ? shelterSurfaceY(catGroup.position.x, catGroup.position.z)
                     : (state.inHouse && state.floor === 'ground' && typeof houseStairY === 'function') ? houseStairY(catGroup.position.x, catGroup.position.z)
                     : 0;
      catGroup.position.y = state.catBaseY;
    }
  }

  // Cat idle breathing — settle legs, gentle breathing + tail flick (or resting on a bench)
  if (state.catSitting && (state.inHouse || state.inShop || state.inShelter || state.inBoughtHome || state.inBiz || state.inWork)) state.catSitting = null;  // never sit while indoors
  if (state.catSitting) {
    applyCatSitPose(t);
  } else if (!state.isJumping && !moving) {
    const gy = state.catBaseY || 0;
    catGroup.position.y += (gy - catGroup.position.y) * 0.2;   // settle from the trot bounce (onto the current tier)
    catGroup.rotation.z *= 0.8;
    catGroup.rotation.x *= 0.8;                                // level out any leftover jump pitch
    catBody.scale.y = 0.96 + Math.sin(t * 2) * 0.02;
    tail.rotation.z = Math.sin(t * 2) * 0.12;
    tail.rotation.x += (-0.05 - tail.rotation.x) * 0.12;
    legs.forEach(leg => { leg.rotation.x *= 0.85; });
  }
  // Landing impact — a quick squash-and-spring after every jump (overrides idle breathing briefly)
  if (!state.isJumping && (state.landT || 0) > 0) {
    state.landT -= 0.016;
    const q = Math.max(0, state.landT / 0.22);
    catBody.scale.y = 1 - q * 0.2;                                  // compress…
    catBody.scale.x = catBody.scale.z = 1 + q * 0.1;                // …spread out…
    tail.rotation.x = -0.15 - q * 0.55;                             // tail flicks up on impact
    if (state.landT <= 0) { catBody.scale.x = catBody.scale.z = 1; }   // …and spring back
  }
  if (!moving) state._lean = (state._lean || 0) * 0.8;              // relax the turn-bank when standing
  // Happy bounce & tail-up right after being petted / playing
  if (_catHappyT > 0) {
    _catHappyT -= 0.016;
    tail.rotation.x = -0.85; tail.rotation.z = Math.sin(t * 15) * 0.3;
    catGroup.position.y = (state.catBaseY || 0) + Math.abs(Math.sin(_catHappyT * 15)) * 0.14;   // happy little hops
    catBody.scale.y = 1 + Math.abs(Math.sin(_catHappyT * 15)) * 0.05;
  }

  // ── Inside the Miller home: explore the interior ──
  if (state.inHouse) {
    if (interiorDrip && state.houseLevel === 0) {
      interiorDrip.t += 0.03;
      const frac = interiorDrip.t % 1;
      interiorDrip.mesh.position.y = 1.55 - frac * 1.32;
      interiorDrip.mesh.visible = frac < 0.78;
    }
    updateEnterPrompt();
    updateStairsPrompt();
    updateGivePrompt();
    updateContextButton();
    updateDecorEditPrompt();
    // 🪜 walk INTO the stairwell landing upstairs → stroll back down the real steps
    if (state.floor === 'upper' && typeof walkDownstairs === 'function') {
      const inWell = Math.hypot(catGroup.position.x - (-2.4), catGroup.position.z - 1.6) < 0.8;
      if (!inWell) state._stairArm = true;                       // must step away once before it re-triggers
      else if (state._stairArm && (state._stairCd || 0) <= 0) { state._stairArm = false; walkDownstairs(); }
    }
    if (state.floor === 'upper') updateMillerUpstairs();     // asleep in their bedrooms at night
    if (state.floor === 'ground') updateMillerHomeLife(t);   // sleep / dinner / relax by the time of day
    const iX = catGroup.position.x + Math.sin(state.camYaw) * state.camDist;
    const iZ = catGroup.position.z + Math.cos(state.camYaw) * state.camDist;
    camera.position.x += (iX - camera.position.x) * 0.1;
    camera.position.z += (iZ - camera.position.z) * 0.1;
    camera.position.y += (state.camHeight - camera.position.y) * 0.1;
    camera.lookAt(catGroup.position.x, state.inHouse ? 0.4 : 0.6, catGroup.position.z);
    renderer.render(houseScene, camera);
    return;
  }

  // ── Inside the shop, the cat shelter, or a bought home ──
  // ── Locked in the jail cell, serving your sentence ──
  if (state.inJail) {
    const iX = catGroup.position.x + Math.sin(state.camYaw) * state.camDist;
    const iZ = catGroup.position.z + Math.cos(state.camYaw) * state.camDist;
    camera.position.x += (iX - camera.position.x) * 0.1;
    camera.position.z += (iZ - camera.position.z) * 0.1;
    camera.position.y += (state.camHeight - camera.position.y) * 0.1;
    camera.lookAt(catGroup.position.x, 0.4, catGroup.position.z);
    renderer.render(jailScene, camera);
    return;
  }

  // ── Inside your workplace shop (cashier job) ──
  if (state.inWork) {
    updateEnterPrompt(); updateContextButton();
    if (typeof updateJobHUD === 'function') updateJobHUD();
    if (typeof updateWorkOccupants === 'function') updateWorkOccupants(t);
    const iX = catGroup.position.x + Math.sin(state.camYaw) * state.camDist;
    const iZ = catGroup.position.z + Math.cos(state.camYaw) * state.camDist;
    camera.position.x += (iX - camera.position.x) * 0.1;
    camera.position.z += (iZ - camera.position.z) * 0.1;
    camera.position.y += (state.camHeight - camera.position.y) * 0.1;
    camera.lookAt(catGroup.position.x, 0.5, catGroup.position.z);
    renderer.render(bizScene, camera);
    return;
  }

  // ── Inside one of your businesses (café/bakery/market/factory) ──
  if (state.inBiz) {
    updateEnterPrompt(); updateContextButton(); updateDecorEditPrompt();
    updateBizWorkers(t);
    if (typeof updateBizCustomers === 'function') updateBizCustomers(t);   // shoppers paying the cashier
    const cg = state.civicGiver;
    if (cg && state.inCivic === cg.site) { idleHuman(cg, t); if (cg.bubble) { cg.bubble.visible = cg.hasJob; cg.bubble.position.y = 2.5 + Math.sin(t * 3 + cg.phase) * 0.08; } }
    const iX = catGroup.position.x + Math.sin(state.camYaw) * state.camDist;
    const iZ = catGroup.position.z + Math.cos(state.camYaw) * state.camDist;
    camera.position.x += (iX - camera.position.x) * 0.1;
    camera.position.z += (iZ - camera.position.z) * 0.1;
    camera.position.y += (state.camHeight - camera.position.y) * 0.1;
    camera.lookAt(catGroup.position.x, 0.5, catGroup.position.z);
    renderer.render(bizScene, camera);
    return;
  }

  if (state.inShop || state.inShelter || state.inBoughtHome) {
    updateEnterPrompt(); updateGivePrompt(); updateShelterPrompt(); updateContextButton(); updateDecorEditPrompt();
    if (state.inShop) {
      if (state.shopDad) {
        const d = state.shopDad;
        const staffed = (typeof workersFor === 'function') && workersFor('shop').length > 0;
        if (staffed) {   // staff run the till — Dad only drops by to check on things once in a while
          d.visitT = (d.visitT == null ? 14 : d.visitT) - 0.016;
          if (d.visitT <= 0) {
            d.visiting = !d.visiting;
            d.visitT = d.visiting ? 13 : 55 + Math.random() * 45;   // ~13s visit every minute or so
            if (d.visiting) {
              d.group.position.set(-2.5, 0, 1.2); d.group.rotation.y = Math.PI;
              // every other visit he comes over for a proper chat (same Q&A as the shift bosses)
              d.visitN = (d.visitN || 0) + 1;
              if (d.visitN % 2 === 1 && !state.uiOpen && typeof openDanielCheckin === 'function') openDanielCheckin();
              else showNotif('🔧 Daniel dropped by to check on the shop. "All fine here — good work, everyone!"');
            }
          }
          d.group.visible = !!d.visiting;
          if (d.visiting) idleHuman(d, t);
        } else {         // no staff: Dad runs the whole shop himself, behind the counter
          d.group.visible = true;
          d.group.position.set(0, 0, -4.35); d.group.rotation.y = 0;
          idleHuman(d, t);
        }
      }
      if (state.shopChen) { idleHuman(state.shopChen, t); state.shopChen.bobT += 0.05; state.shopChen.bubble.position.y = 2.2 + Math.sin(state.shopChen.bobT) * 0.08; state.shopChen.bubble.visible = state.shopChen.hasJob; }
      updateShopCustomers(t);
      updateBizWorkers(t);   // your hired staff working the shop
    }
    else if (state.inShelter) {
      state.shelterPeople.forEach(p => idleHuman(p, t));
      state.shelterCats.forEach(c => { if (c.group.visible) idleShelterCat(c); });
      updateShelterBall(t);   // 🧶 the ball rolls & cats scamper after it
      const g = state.shelterGiver;
      if (g && g.bubble) { g.bubble.position.y = 2.5 + Math.sin(t * 3 + 1) * 0.08; g.bubble.visible = g.hasJob; }   // the ✨ over the volunteer bobs while a game's available
      if (state.shelterToy) { state.shelterToy.position.y = 1.4 + Math.sin(t * 2.2) * 0.12; state.shelterToy.rotation.y += 0.03; }   // dangling feather toy
    }
    else {   // bought home: the Millers only appear in the house you told them to move into
      const hour = state.dayTime * 24;
      const theirHome = state.millerHome && state.millerHome === state.currentBoughtHome;
      state.boughtHomePeople.forEach(p => {
        const home = theirHome && (!p.name || (typeof millerPlan !== 'function') || millerPlan(p.name, hour).loc !== 'out')
          && !(typeof millerStillOutside === 'function' && millerStillOutside(p.name));
        p.group.visible = home;
        if (home) idleHuman(p, t);
      });
    }
    const iX = catGroup.position.x + Math.sin(state.camYaw) * state.camDist;
    const iZ = catGroup.position.z + Math.cos(state.camYaw) * state.camDist;
    camera.position.x += (iX - camera.position.x) * 0.1;
    camera.position.z += (iZ - camera.position.z) * 0.1;
    camera.position.y += (state.camHeight - camera.position.y) * 0.1;
    camera.lookAt(catGroup.position.x, 0.5, catGroup.position.z);
    renderer.render(state.inShop ? shopScene : state.inShelter ? shelterScene : boughtHomeScene, camera);
    return;
  }

  // Wander + idle — neighbours (with floating job orb) and the family
  const petUpdate = o => {
    if (o.petT > 0) { o.petT -= 0.016; faceCat(o); petAnimate(o); if (o.petT <= 0) endPet(o); return true; }
    return false;
  };
  state.npcs.forEach(npc => {
    npc.bobT += 0.05;
    npc.bubble.position.y = 2.5 + Math.sin(npc.bobT) * 0.08;
    if (!petUpdate(npc)) { updateWander(npc); if (npc.wstate === 'idle') idleHuman(npc, t); }
  });
  // (the Miller family now walk a scheduled routine — see updateFamilyRoutine above)
  state.peds.forEach(p => { if (!petUpdate(p)) { if (typeof updatePersonLife === 'function') updatePersonLife(p, t); else { updateWander(p); if (p.wstate === 'idle') idleHuman(p, t); } } });
  if (typeof updateFlashes === 'function') updateFlashes();   // fade out camera flashes at the fountain
  if (typeof updateCleanups === 'function') updateCleanups();  // cleanup crews clearing demolition rubble
  state.commuters.forEach(c => { updateCommuter(c); if (c.wstate === 'idle') idleHuman(c, t); });
  updateFootball();    // the kids' street football (you can join in by nudging the ball)
  state.freedCats.forEach(updateFreedCat);   // rescued cats roam their own patches of town
  state.streetCats.forEach(updateFreedCat);  // ambient street cats
  updateCritters();    // park mice & birds
  updateStrayMouse();  // the loose town mouse
  updateHearts(0.016);
  updateNightMode();
  // (the Millers' daily walking routine now ticks every frame near the top of animate)
  updateEscort();           // walking a kid to the park & back (the escort quest)
  if (typeof updateAnger === 'function') updateAnger(0.016);     // 😡 public anger climbs in real time while you're corrupt
  if (typeof updateTownMood === 'function') updateTownMood(t);   // litter & protests when the town is unhappy
  updateCars(0.016);
  updateParkTally();
  updatePopulationHUD();
  if (typeof updateHappyHUD === 'function') updateHappyHUD();
  state.mapPos = { x: catGroup.position.x, z: catGroup.position.z };   // remember where we are, for the map
  updateCrick();   // the landlord walks in / out during deadline cutscenes

  // Chimney smoke once the home is warm (level ≥ 2)
  if (exterior && state.houseLevel >= 2) {
    exterior.smoke.forEach(p => {
      p.position.y += 0.012;
      p.material.opacity -= 0.004;
      p.scale.multiplyScalar(1.004);
      if (p.material.opacity <= 0) { p.position.y = 2.9; p.material.opacity = 0.5; p.scale.setScalar(1); }
    });
  }

  // Coin spin
  state.coins3d.forEach(c => {
    c.age += 0.05;
    c.mesh.rotation.y += 0.05;
    c.mesh.position.y = 0.3 + Math.sin(c.age) * 0.1;
  });

  // NPC proximity
  const cx = catGroup.position.x, cz = catGroup.position.z;
  state.nearNPC = null;
  for (const npc of state.npcs) {
    const dx = npc.x - cx, dz = npc.z - cz;
    if (Math.sqrt(dx*dx + dz*dz) < 2.5 && npc.hasJob && npc.group.visible) {
      state.nearNPC = npc;
      break;
    }
  }

  checkCoinPickup();
  updateEnterPrompt();   // shows the "Enter Home" button near the Miller house door
  updateGivePrompt();    // "Give Coins" button near the Millers
  updateShelterPrompt(); // "Cat Shelter" button near the rescue shelter
  updatePropertyPrompt();// "For Sale — Buy" button near a property
  updateContextButton(); // eat / drink / sleep / pet, depending on where you are
  updateDecorEditPrompt();// hides the furniture-move button once you're back outside
  updateWinbackHUD();    // "winning the Millers back" meter while disowned
  if (typeof updateJobHUD === 'function') updateJobHUD();       // your 9-to-5 shift badge & reminders
  if (typeof updateEmployers === 'function') updateEmployers(t);// shop owners idle + their 💼 bubbles bob
  if (state.dadAtShop && state.dadAtShop.group.visible) idleHuman(state.dadAtShop, t);

  if (state.cinematic && state.cineCam) {   // a cutscene is driving the camera
    const cc = state.cineCam;
    camera.position.set(cc.px, cc.py, cc.pz);
    camera.lookAt(cc.lx, cc.ly, cc.lz);
  } else {
    // Camera orbit + follow (camYaw spins around the cat; camHeight tilts up/down)
    const camX = catGroup.position.x + Math.sin(state.camYaw) * state.camDist;
    const camZ = catGroup.position.z + Math.cos(state.camYaw) * state.camDist;
    camera.position.x += (camX - camera.position.x) * 0.1;
    camera.position.z += (camZ - camera.position.z) * 0.1;
    camera.position.y += (state.camHeight - camera.position.y) * 0.1;
    camera.lookAt(catGroup.position.x, 0.6, catGroup.position.z);
  }

  drawMinimap();
  renderer.render(scene, camera);
}
