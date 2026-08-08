// Paws & Pennies — shelter: the 10 adoptable cats + selection screen
// Classic script: shares globals with the others; load order matters (see index.html).

// ─── Shelter: the 10 adoptable cats ─────────────────────────────────────────────
const cats = [
  { id:'penny',    name:'Penny',    body:'#e8c878', accent:'#b88838', eye:'#7cc46a', markings:'tabby',  hello:"Hello. I've been waiting for you." },
  { id:'biscuit',  name:'Biscuit',  body:'#efdcb8', accent:'#d6b483', eye:'#e0a83c', markings:'solid',  hello:"Mrrp! Got room for a snack-sized friend?" },
  { id:'Stanley',   name:'Stanley',   body:'#2b2b30', accent:'#15151a', eye:'#f0c040', markings:'solid',  hello:"Quiet. Clever. Yours, if you'll have me." },
  { id:'Milo',  name:'Milo',  body:'#2b2b30', accent:'#f2f2f2', eye:'#7cc46a', markings:'tuxedo', hello:"Look — I came pre-wearing socks!" },
  { id:'smokey',   name:'Smokey',   body:'#8a8f99', accent:'#6a6f78', eye:'#c87a3a', markings:'solid',  hello:"Calm as a quiet morning." },
  { id:'marigold', name:'Marigold', body:'#f0e3c8', accent:'#d98a3a', patch1:'#d98a3a', patch2:'#3a3530', eye:'#e0a83c', markings:'calico', hello:"One of a kind. Just like your family." },
  { id:'pearl',    name:'Pearl',    body:'#f5f5f0', accent:'#e3e0d6', eye:'#6aa6e0', markings:'solid',  hello:"Small, soft, and very, very loyal." },
  { id:'tiger',    name:'Tiger',    body:'#c89048', accent:'#5a3e24', eye:'#a6c84a', markings:'tabby',  hello:"Tiny tiger, big heart. Rawr." },
  { id:'coco',     name:'Coco',     body:'#6b4a32', accent:'#4a3320', eye:'#f0c040', markings:'solid',  hello:"Sweet, warm, and always by your side." },
  { id:'luna',     name:'Luna',     body:'#b8bcc4', accent:'#7a7e88', eye:'#7cc46a', markings:'tabby',  hello:"I'll watch over your family like the moon." },
];

// Draw a little cat face portrait, tinted with that cat's colours
function catSVG(cat) {
  const cid = 'clip-' + cat.id;
  let pattern = '';
  if (cat.markings === 'tabby') {
    pattern = `<g clip-path="url(#${cid})" stroke="${cat.accent}" stroke-width="3" stroke-linecap="round" opacity="0.6" fill="none">
      <path d="M50 28 L50 46"/><path d="M43 31 L40 47"/><path d="M57 31 L60 47"/>
      <path d="M18 60 L31 62"/><path d="M18 68 L31 68"/>
      <path d="M82 60 L69 62"/><path d="M82 68 L69 68"/></g>`;
  } else if (cat.markings === 'tuxedo') {
    pattern = `<g clip-path="url(#${cid})"><ellipse cx="50" cy="76" rx="23" ry="18" fill="${cat.accent}"/>
      <path d="M50 46 L42 66 L58 66 Z" fill="${cat.accent}"/></g>`;
  } else if (cat.markings === 'calico') {
    pattern = `<g clip-path="url(#${cid})">
      <path d="M10 40 Q18 8 46 22 Q40 46 14 56 Z" fill="${cat.patch1}"/>
      <ellipse cx="74" cy="42" rx="21" ry="23" fill="${cat.patch2}"/></g>`;
  }
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="${cid}"><ellipse cx="50" cy="60" rx="36" ry="32"/></clipPath></defs>
    <polygon points="16,42 30,6 48,34" fill="${cat.body}"/>
    <polygon points="84,42 70,6 52,34" fill="${cat.body}"/>
    <polygon points="25,34 31,15 41,32" fill="#e89a9a" opacity="0.8"/>
    <polygon points="75,34 69,15 59,32" fill="#e89a9a" opacity="0.8"/>
    <ellipse cx="50" cy="60" rx="36" ry="32" fill="${cat.body}"/>
    ${pattern}
    <ellipse cx="50" cy="72" rx="16" ry="11" fill="#ffffff" opacity="0.12"/>
    <ellipse cx="37" cy="56" rx="8" ry="10" fill="${cat.eye}"/>
    <ellipse cx="63" cy="56" rx="8" ry="10" fill="${cat.eye}"/>
    <ellipse cx="37" cy="57" rx="3.4" ry="8" fill="#1a1a1a"/>
    <ellipse cx="63" cy="57" rx="3.4" ry="8" fill="#1a1a1a"/>
    <circle cx="39" cy="52" r="1.7" fill="#fff" opacity="0.9"/>
    <circle cx="65" cy="52" r="1.7" fill="#fff" opacity="0.9"/>
    <path d="M46 70 L54 70 L50 75 Z" fill="#e0788a"/>
    <path d="M50 75 Q46 80 42 77 M50 75 Q54 80 58 77" stroke="#5a3a2a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <g stroke="#ffffff" stroke-width="1" opacity="0.5" stroke-linecap="round">
      <path d="M30 68 L6 64"/><path d="M30 72 L6 74"/>
      <path d="M70 68 L94 64"/><path d="M70 72 L94 74"/></g>
  </svg>`;
}

let selectedCatIndex = null;
function renderShelter() {
  const grid = document.getElementById('cat-grid');
  grid.innerHTML = '';
  // "Create your own" card first — design a one-of-a-kind cat
  const create = document.createElement('div');
  create.className = 'cat-card create-card';
  create.innerHTML = `<div class="create-icon">🎨</div><div class="cat-name">Create your own</div><div class="cat-hello">Design a one-of-a-kind cat</div>`;
  create.addEventListener('click', () => openCatMaker('hero'));
  grid.appendChild(create);
  cats.forEach((cat, i) => {
    const card = document.createElement('div');
    card.className = 'cat-card';
    card.innerHTML = catSVG(cat) +
      `<div class="cat-name">${cat.name}</div><div class="cat-hello">"${cat.hello}"</div>`;
    card.addEventListener('click', () => selectCat(i, card));
    grid.appendChild(card);
  });
}
function selectCat(i, card) {
  selectedCatIndex = i;
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  const ni = document.getElementById('cat-name-input');
  if (ni && !ni.value.trim()) ni.value = cats[i].name;   // prefill the name (you can rename it)
  const btn = document.getElementById('adopt-btn');
  btn.textContent = 'Adopt 🐾';
  btn.disabled = false;
}
function confirmAdopt() {
  if (selectedCatIndex === null) return;
  unlockVoice();
  const cat = cats[selectedCatIndex];
  const typed = (document.getElementById('cat-name-input').value || '').trim().slice(0, 16);
  state.catName = typed || cat.name;                          // any name you like (falls back to the preset)
  state.chosenCat = Object.assign({}, cat, { name: state.catName });
  state.catCustom = { body: cat.body, accent: cat.accent, eye: cat.eye, nose: '#e0788a', markings: cat.markings, patch1: cat.patch1, patch2: cat.patch2, collarOn: false, collarColor: '#c03a3a', hat: 'none', glasses: false };
  applyCatCustom();
  goToIntro(state.chosenCat, state.catName);
}
// Shared: hide the adopt screen and show the "Start Adventure" intro for the chosen cat
function goToIntro(catData, name) {
  document.getElementById('shelter').style.display = 'none';
  document.getElementById('intro').style.display = 'flex';
  document.getElementById('intro-portrait').innerHTML = catSVG(catData);
  document.getElementById('intro-sub').textContent =
    `${name} has been adopted by the Millers — a kind family who are struggling to get by. Help them by working odd jobs around the neighbourhood.`;
}

// ─── Cat maker: design a cat (used for "create your own" at the intro AND "create & free" at the shelter) ──
const CREATED_CAT_PRICE = 20;
function openCatMaker(mode) {
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  state.catMakerMode = mode;
  state.draftCat = { body: rnd(FUR_COLORS), accent: rnd(ACCENT_COLORS), eye: rnd(EYE_COLORS), nose: NOSE_COLORS[0], markings: 'solid', patch1: rnd(ACCENT_COLORS), patch2: '#3a3530', collar: null };
  state.uiOpen = true;
  document.getElementById('catmaker-title').textContent = mode === 'hero' ? '🎨 Create Your Cat' : '🎨 Create a Shelter Cat';
  document.getElementById('catmaker-confirm').textContent = mode === 'hero' ? '🐾 Adopt this cat' : `🐾 Create & free · ${CREATED_CAT_PRICE} 🪙`;
  document.getElementById('catmaker-name').value = '';
  renderCatMaker();
  document.getElementById('catmaker').classList.add('show');
}
function draftToCatData() {
  const c = state.draftCat || {}, name = (document.getElementById('catmaker-name').value || '').trim() || 'Your cat';
  return { id: 'draft', name, body: c.body, accent: c.accent, eye: c.eye, nose: c.nose, markings: c.markings, patch1: c.patch1 || c.accent, patch2: c.patch2 || '#3a3530', collar: c.collar, hello: '' };
}
function renderCatMaker() {
  const c = state.draftCat; if (!c) return;
  document.getElementById('catmaker-portrait').innerHTML = catSVG(draftToCatData());
  const swatches = (label, colors, field, current) => {
    let h = `<div class="cust-row"><div class="cust-label">${label}</div><div class="cust-sw-wrap">`;
    colors.forEach(col => { h += `<button class="cust-sw${col === current ? ' sel' : ''}" style="background:${col}" onclick="setDraft('${field}','${col}')"></button>`; });
    return h + '</div></div>';
  };
  let h = swatches('Fur', FUR_COLORS, 'body', c.body);
  h += swatches('Markings', ACCENT_COLORS, 'accent', c.accent);
  h += swatches('Eyes', EYE_COLORS, 'eye', c.eye);
  h += swatches('Nose', NOSE_COLORS, 'nose', c.nose);
  h += `<div class="cust-row"><div class="cust-label">Pattern</div><div class="cust-sw-wrap">`;
  MARKINGS_OPTS.forEach(mk => { h += `<button class="cust-pat${mk === c.markings ? ' sel' : ''}" onclick="setDraft('markings','${mk}')">${mk}</button>`; });
  h += `</div></div>`;
  h += `<div class="cust-row"><div class="cust-label">Collar</div><div class="cust-sw-wrap"><button class="cust-pat${c.collar ? '' : ' sel'}" onclick="setDraft('collar','')">none</button>`;
  COLLAR_COLORS.forEach(col => { h += `<button class="cust-sw${c.collar === col ? ' sel' : ''}" style="background:${col}" onclick="setDraft('collar','${col}')"></button>`; });
  h += `</div></div>`;
  document.getElementById('catmaker-rows').innerHTML = h;
}
function setDraft(field, val) { if (state.draftCat) { state.draftCat[field] = (field === 'collar' && !val) ? null : val; renderCatMaker(); } }
function cancelCatMaker() {
  document.getElementById('catmaker').classList.remove('show');
  state.catMakerMode = null;
  state.uiOpen = state.gameStarted && document.getElementById('rescue').classList.contains('show');   // rescue board may still be open behind
}
function catMakerConfirm() {
  const c = state.draftCat; if (!c) return;
  const name = (document.getElementById('catmaker-name').value || '').trim().slice(0, 16);
  if (state.catMakerMode === 'hero') {
    if (!name) { showNotif('Give your cat a name first 🐾'); return; }
    unlockVoice();
    state.catName = name;
    state.chosenCat = { id: 'custom', name, body: c.body, accent: c.accent, eye: c.eye, nose: c.nose, markings: c.markings, patch1: c.patch1, patch2: c.patch2, hello: '' };
    state.catCustom = { body: c.body, accent: c.accent, eye: c.eye, nose: c.nose, markings: c.markings, patch1: c.patch1, patch2: c.patch2, collarOn: !!c.collar, collarColor: c.collar || '#c03a3a', hat: 'none', glasses: false };
    applyCatCustom();
    document.getElementById('catmaker').classList.remove('show');
    state.catMakerMode = null;
    goToIntro(state.chosenCat, name);
  } else {   // shelter: design a cat and set it free right here
    if (state.coins < CREATED_CAT_PRICE) { showNotif('You need ' + CREATED_CAT_PRICE + ' 🪙 to give a cat its freedom…'); return; }
    const nm = name || 'Whiskers';
    state.coins -= CREATED_CAT_PRICE;
    document.getElementById('coin-count').textContent = state.coins;
    const catData = { id: 'made-' + Date.now() + '-' + Math.floor(Math.random() * 10000), name: nm, body: c.body, accent: c.accent, eye: c.eye, nose: c.nose, markings: c.markings, patch1: c.patch1, patch2: c.patch2, collar: c.collar, hello: 'A life of my own — thank you, friend!' };
    (state.createdCats = state.createdCats || []).push(catData);
    spawnFreedCat(catData);
    if (typeof sfx === 'function') sfx('purr');
    showNotif('🐾 You created and freed ' + nm + '!');
    if (typeof schoolEvent === 'function') schoolEvent('createCat');
    if (typeof addGoodwill === 'function') addGoodwill(5, 'You gave a cat a new life');
    if (typeof saveGame === 'function') saveGame();
    document.getElementById('catmaker').classList.remove('show');
    state.catMakerMode = null; state.uiOpen = true;   // back to the rescue board
    renderRescue();
  }
}

// ─── Cat customisation (fur / markings / eyes / nose / collar) ────────────────────
const FUR_COLORS    = ['#e8c878', '#efdcb8', '#c89048', '#6b4a32', '#8a8f99', '#b8bcc4', '#2b2b30', '#f5f5f0', '#d98a3a', '#a86a4a'];
const ACCENT_COLORS = ['#b88838', '#d6b483', '#5a3e24', '#4a3320', '#6a6f78', '#7a7e88', '#15151a', '#e3e0d6', '#f2f2f2', '#c04a4a'];
const EYE_COLORS    = ['#7cc46a', '#e0a83c', '#f0c040', '#6aa6e0', '#c87a3a', '#a6c84a', '#9a6ad0'];
const NOSE_COLORS   = ['#e0788a', '#d0566a', '#9a5a4a', '#3a2a2a', '#f0a0b0'];
const COLLAR_COLORS = ['#c03a3a', '#3a6ac0', '#3aa06a', '#f0c040', '#c060a0', '#2a2a2a'];
const MARKINGS_OPTS = ['solid', 'tabby', 'tuxedo', 'calico'];
// Buyable accessories — unlocked once with coins, then free to swap on/off
const HAT_ITEMS = [
  { id: 'none',  label: 'None',      price: 0  },
  { id: 'bow',   label: '🎀 Bow',    price: 15 },
  { id: 'cap',   label: '🧢 Cap',    price: 25 },
  { id: 'party', label: '🎉 Party',  price: 20 },
  { id: 'top',   label: '🎩 Top Hat', price: 45 },
];
const GLASSES_PRICE = 30;

function accOwned(key) { return !!(state.owned.accessories && state.owned.accessories.includes(key)); }
// Buy the accessory the first time (deduct coins), then equip it. Returns false if too poor.
function equipAcc(slot, id, price) {
  const c = state.catCustom;
  const key = slot + ':' + id;
  const free = !price || id === 'none' || id === 'off';
  if (!free && !accOwned(key)) {
    if (state.coins < price) { showNotif('Not enough coins'); return; }
    state.coins -= price;
    (state.owned.accessories = state.owned.accessories || []).push(key);
    document.getElementById('coin-count').textContent = state.coins;
    if (typeof sfx === 'function') sfx('coin');
  }
  if (slot === 'hat') c.hat = id;
  else if (slot === 'glasses') c.glasses = (id === 'on');
  applyCatCustom(); renderCustomise();
  if (typeof saveGame === 'function') saveGame();
}

function customToCatData() {
  const c = state.catCustom || {};
  return { id: 'custom', name: state.catName, body: c.body, accent: c.accent, eye: c.eye, nose: c.nose,
           markings: c.markings, patch1: c.patch1 || c.accent, patch2: c.patch2 || '#3a3530', hello: '' };
}
// Push the current custom look onto the 3D cat (and refresh any open portrait)
function applyCatCustom() {
  if (!state.catCustom) return;
  applyCatAppearance(state.catCustom);
  setCatCollar(state.catCustom.collarOn, state.catCustom.collarColor);
  setCatHat(state.catCustom.hat || 'none');
  setCatGlasses(!!state.catCustom.glasses);
  const port = document.getElementById('customise-portrait');
  if (port) port.innerHTML = catSVG(customToCatData());
}
// Rebuild a default custom look from the chosen cat (for old saves that predate customisation)
function ensureCatCustom() {
  if (state.catCustom) return true;
  const c = state.chosenCat;
  if (!c) return false;
  state.catCustom = { body: c.body, accent: c.accent, eye: c.eye, nose: '#e0788a', markings: c.markings, patch1: c.patch1, patch2: c.patch2, collarOn: false, collarColor: '#c03a3a', hat: 'none', glasses: false };
  applyCatCustom();
  return true;
}
function openCustomise() {
  if (typeof sfx === 'function') sfx('ui');
  if (!ensureCatCustom()) { showNotif('Adopt a cat first 🐾'); return; }
  state.uiOpen = true;
  renderCustomise();
  document.getElementById('customise').classList.add('show');
}
function closeCustomise() { state.uiOpen = false; document.getElementById('customise').classList.remove('show'); }
function renderCustomise() {
  const c = state.catCustom;
  const swatches = (label, colors, field, current) => {
    let h = `<div class="cust-row"><div class="cust-label">${label}</div><div class="cust-sw-wrap">`;
    colors.forEach(col => { h += `<button class="cust-sw${col === current ? ' sel' : ''}" style="background:${col}" onclick="setCustom('${field}','${col}')"></button>`; });
    return h + '</div></div>';
  };
  let h = swatches('Fur', FUR_COLORS, 'body', c.body);
  h += swatches('Markings', ACCENT_COLORS, 'accent', c.accent);
  h += swatches('Eyes', EYE_COLORS, 'eye', c.eye);
  h += swatches('Nose', NOSE_COLORS, 'nose', c.nose);
  h += `<div class="cust-row"><div class="cust-label">Pattern</div><div class="cust-sw-wrap">`;
  MARKINGS_OPTS.forEach(mk => { h += `<button class="cust-pat${mk === c.markings ? ' sel' : ''}" onclick="setCustom('markings','${mk}')">${mk}</button>`; });
  h += `</div></div><div class="cust-row"><div class="cust-label">Collar</div><div class="cust-sw-wrap"><button class="cust-pat${c.collarOn ? '' : ' sel'}" onclick="setCustom('collarOff','')">none</button>`;
  COLLAR_COLORS.forEach(col => { h += `<button class="cust-sw${c.collarOn && col === c.collarColor ? ' sel' : ''}" style="background:${col}" onclick="setCustom('collar','${col}')"></button>`; });
  h += '</div></div>';
  // Buyable accessories — hats
  const curHat = c.hat || 'none';
  h += `<div class="cust-row"><div class="cust-label">Hat</div><div class="cust-sw-wrap">`;
  HAT_ITEMS.forEach(it => {
    const owned = it.price === 0 || accOwned('hat:' + it.id);
    h += `<button class="cust-pat${it.id === curHat ? ' sel' : ''}${owned ? '' : ' locked'}" onclick="equipAcc('hat','${it.id}',${it.price})">${it.label}${owned ? '' : ` · ${it.price}🪙`}</button>`;
  });
  h += '</div></div>';
  // Buyable accessories — glasses
  const gOwned = accOwned('glasses:on');
  h += `<div class="cust-row"><div class="cust-label">Glasses</div><div class="cust-sw-wrap">`;
  h += `<button class="cust-pat${c.glasses ? '' : ' sel'}" onclick="equipAcc('glasses','off',0)">off</button>`;
  h += `<button class="cust-pat${c.glasses ? ' sel' : ''}${gOwned ? '' : ' locked'}" onclick="equipAcc('glasses','on',${GLASSES_PRICE})">👓 on${gOwned ? '' : ` · ${GLASSES_PRICE}🪙`}</button>`;
  h += '</div></div>';
  document.getElementById('customise-rows').innerHTML = h;
  document.getElementById('customise-portrait').innerHTML = catSVG(customToCatData());
}
function setCustom(field, value) {
  if (typeof schoolEvent === 'function') schoolEvent('customise');
  const c = state.catCustom;
  if (field === 'collarOff') c.collarOn = false;
  else if (field === 'collar') { c.collarOn = true; c.collarColor = value; }
  else c[field] = value;
  applyCatCustom(); renderCustomise();
  if (typeof saveGame === 'function') saveGame();
}

// ─── The in-town cat-rescue shelter (buy cats their freedom with your coins) ─────
function catPrice(i) { return 15 + i * 3; }

function updateShelterPrompt() {
  const btn = document.getElementById('shelter-btn');
  if (!btn) return;
  // now that the shelter is enterable, the "Free a Cat" board lives inside it
  btn.classList.toggle('show', state.inShelter && !state.uiOpen && !mg.active);
}
function openRescue() {
  state.uiOpen = true;
  renderRescue();
  document.getElementById('rescue').classList.add('show');
}
function closeRescue() {
  state.uiOpen = false;
  document.getElementById('rescue').classList.remove('show');
}
function renderRescue() {
  document.getElementById('rescue-wallet').textContent = state.coins;
  const grid = document.getElementById('rescue-grid');
  grid.innerHTML = '';
  // "Create a cat" card — design & free your own
  const make = document.createElement('div');
  make.className = 'cat-card create-card';
  make.innerHTML = `<div class="create-icon">➕</div><div class="cat-name">Create a cat</div><button class="rescue-buy" onclick="openCatMaker('shelter')">Design & free · ${CREATED_CAT_PRICE} 🪙</button>`;
  grid.appendChild(make);
  cats.forEach((cat, i) => {
    const isMine = state.chosenCat && cat.id === state.chosenCat.id;
    const isFree = state.freed.includes(cat.id);
    const price = catPrice(i);
    let foot;
    if (isMine)      foot = `<div class="rescue-tag">🏠 Yours</div>`;
    else if (isFree) foot = `<div class="rescue-tag freed">🐾 Free!</div>`;
    else             foot = `<button class="rescue-buy" onclick="freeCat(${i})">Set Free · ${price} 🪙</button>`;
    const card = document.createElement('div');
    card.className = 'cat-card';
    card.innerHTML = catSVG(cat) + `<div class="cat-name">${cat.name}</div>` + foot;
    grid.appendChild(card);
  });
  // the custom cats you've designed & freed
  (state.createdCats || []).forEach(cat => {
    const card = document.createElement('div');
    card.className = 'cat-card';
    card.innerHTML = catSVG(cat) + `<div class="cat-name">${cat.name}</div><div class="rescue-tag freed">🐾 Free!</div>`;
    grid.appendChild(card);
  });
}
function freeCat(i) {
  const cat = cats[i], price = catPrice(i);
  if (state.freed.includes(cat.id)) return;
  if (state.coins < price) { showNotif('Not enough coins yet…'); return; }
  state.coins -= price;
  state.freed.push(cat.id);
  document.getElementById('coin-count').textContent = state.coins;
  spawnFreedCat(cat);
  renderRescue();
  sfx('purr');
  showNotif(`🐾 You set ${cat.name} free!`);
  if (typeof schoolEvent === 'function') schoolEvent('freeCat');
  showDialogue(cat.name + ' 🐱', cat.hello, 3200);
  if (typeof addGoodwill === 'function') addGoodwill(5, 'You rescued a cat');   // kindness the whole town notices
}

// Pick a random place for a cat to roam (35% chance: the park), across the whole town
function randomRoamHome() {
  if (Math.random() < 0.35) return { x: 54 + Math.random() * 30, z: 16 + Math.random() * 34 };  // the park
  return { x: -86 + Math.random() * 172, z: -36 + Math.random() * 88 };                          // anywhere in town
}

// Ambient street cats roaming the whole town (not rescued — just local life)
const STREET_CAT_LOOKS = [
  { body: '#c89048', accent: '#5a3e24', eye: '#a6c84a', markings: 'tabby' },
  { body: '#8a8f99', accent: '#6a6f78', eye: '#c87a3a', markings: 'solid' },
  { body: '#2b2b30', accent: '#15151a', eye: '#f0c040', markings: 'solid' },
  { body: '#e8c878', accent: '#b88838', eye: '#7cc46a', markings: 'tabby' },
  { body: '#f5f5f0', accent: '#e3e0d6', eye: '#6aa6e0', markings: 'solid' },
  { body: '#2b2b30', accent: '#f2f2f2', eye: '#7cc46a', markings: 'tuxedo' },
];
const STREET_CAT_NAMES = ['Boots', 'Shadow', 'Ginger', 'Mochi', 'Salem', 'Oreo', 'Pumpkin', 'Mittens', 'Clover', 'Pepper'];
function addStreetCat(i) {
  const idx = (i != null ? i : Math.floor(Math.random() * STREET_CAT_LOOKS.length));
  const look = STREET_CAT_LOOKS[idx % STREET_CAT_LOOKS.length];
  const m = buildCatModel(look);
  m.group.scale.setScalar(CAT_SCALE_OUT * 0.92);
  const start = randomRoamHome();
  m.group.position.set(start.x, 0, start.z);
  scene.add(m.group);
  const c = { group: m.group, legs: m.legs, tail: m.tail, body: m.body, look, name: STREET_CAT_NAMES[idx % STREET_CAT_NAMES.length], phase: Math.random() * 6, playT: 0 };
  initCatWander(c, randomRoamHome(), 10);
  state.streetCats.push(c);
  return c;
}
function spawnStreetCats() { state.streetCats = []; for (let i = 0; i < 7; i++) addStreetCat(i); }
function initCatWander(c, home, radius) {
  c.home = home; c.radius = radius;
  c.wx = c.group.position.x; c.wz = c.group.position.z;
  c.target = { x: home.x, z: home.z };   // first stroll: off to its new patch of town
  c.wstate = 'walk'; c.wtimer = 0; c.walkT = 0;
}
function spawnFreedCat(catData) {
  const m = buildCatModel(catData);            // looks exactly like the hero cat, in this coat
  m.group.scale.setScalar(CAT_SCALE_OUT);
  m.group.position.set(SHELTER.x + (Math.random() - 0.5) * 8, 0, (SHELTER.z - 7) + (Math.random() - 0.5) * 5);  // appears at the shelter
  scene.add(m.group);
  const c = { group: m.group, legs: m.legs, tail: m.tail, body: m.body, cat: catData, phase: Math.random() * 6, playT: 0 };
  initCatWander(c, randomRoamHome(), 6);       // then wanders off to its own random home (some in the park)
  state.freedCats.push(c);
}

// ═══ 💞 THE LOVER — give the stray mouse to any cat and win their heart ═══
function partnerMesh() {
  const p = state.partner; if (!p || p.group) return;
  const m = buildCatModel(p.look || STREET_CAT_LOOKS[0]);
  m.group.scale.setScalar(CAT_SCALE_OUT * 0.95);
  p.group = m.group; p.parts = m;
  const heart = new THREE.Mesh(G.sph(0.09, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf06a9a, emissive: 0xd04878, emissiveIntensity: 0.8 }));
  heart.scale.set(1, 1.15, 0.6); heart.position.y = 1.15; p.group.add(heart); p.heart = heart;
  p.group.position.set(catGroup.position.x + 1.4, 0, catGroup.position.z);
  scene.add(p.group);
  p.floorY = 0; p.phase = Math.random() * 6;
}
function courtCat(c, id) {
  if (typeof isEmployed === 'function' && isEmployed(id)) { showNotif('💼 ' + (c.name || 'That cat') + ' is at work right now — love waits for the off-shift.'); return; }
  state.carryingMouse = false;
  state.strayTimer = 30 + Math.random() * 40;
  const name = (c.cat && c.cat.name) || c.name || 'Somebody';
  const look = c.look || c.cat || (c.group ? null : null) || STREET_CAT_LOOKS[0];
  state.partner = { name, look, id, mode: 'follow', homeId: null };
  if (typeof hideRoamingCat === 'function') hideRoamingCat(name, true);
  if (typeof employ === 'function') employ(id, 'your beloved 💞');
  partnerMesh();
  _catHappyT = 2.4; if (typeof spawnHeart === 'function') { spawnHeart(); setTimeout(spawnHeart, 250); setTimeout(spawnHeart, 500); }
  if (typeof sfx === 'function') { sfx('purr'); setTimeout(() => sfx('coin'), 400); }
  showNotif('💞 ' + name + ' accepts the mouse… and your heart! You have a partner now.');
  if (typeof saveGame === 'function') saveGame();
}
function nearestLovableCat(cp) {
  let best = null, bd = 2.3, bid = null;
  (state.streetCats || []).forEach((c, i) => { if (!c.group || !c.group.visible) return; const d = Math.hypot(c.group.position.x - cp.x, c.group.position.z - cp.z); if (d < bd) { bd = d; best = c; bid = 'cat:street:' + c.name + ':' + i; } });
  (state.freedCats || []).forEach(c => { if (!c.group || !c.group.visible) return; const d = Math.hypot(c.group.position.x - cp.x, c.group.position.z - cp.z); if (d < bd) { bd = d; best = c; bid = 'cat:' + ((c.cat && c.cat.id) || c.name); } });
  return best ? { c: best, id: bid } : null;
}

// the activity wheel
function openPartnerWheel() {
  const p = state.partner; if (!p) return;
  state.uiOpen = true;
  let h = '<div class="zoo-want">💞</div><div class="modal-sub"><b>' + p.name + '</b> looks at you adoringly.</div><div class="co-grid" style="grid-template-columns:1fr">';
  h += `<button onclick="partnerDo('follow')">🚶<small>Come with me${p.mode === 'follow' ? ' · already at your side' : ''}</small></button>`;
  h += `<button onclick="partnerDo('wait')">🧍<small>Wait here for me</small></button>`;
  h += `<button onclick="partnerDo('park')">🌳<small>Park date — hunt mice & birds TOGETHER</small></button>`;
  h += `<button onclick="partnerDo('dream')">🎢<small>Dream City date</small></button>`;
  h += `<button onclick="partnerDo('home')">🏠<small>${p.homeId ? 'Visit our home' : 'Move in together (needs a bought home)'}</small></button>`;
  h += `<button onclick="partnerDo('farewell')">💔<small>Farewell…</small></button>`;
  h += '</div><button class="modal-close" onclick="closeCheckout()">Just a nuzzle</button>';
  document.getElementById('checkout-title').textContent = '💞 ' + p.name;
  document.getElementById('checkout-body').innerHTML = h;
  document.getElementById('checkout').classList.add('show');
}
function partnerDo(act) {
  closeCheckout();
  const p = state.partner; if (!p) return;
  if (act === 'follow') { p.mode = 'follow'; showNotif('💞 ' + p.name + ' falls in beside you, tail high.'); }
  else if (act === 'wait') { p.mode = 'wait'; showNotif('🧍 ' + p.name + ' curls up to wait. Hurry back!'); }
  else if (act === 'park') {
    p.mode = 'follow'; p.hunting = true;
    showNotif('🌳 Date at the park! ' + p.name + ' will hunt WITH you — race you to the mice!');
    if (typeof sfx === 'function') sfx('meow');
  } else if (act === 'dream') {
    p.mode = 'follow';
    showNotif('🎢 A Dream City date! Head west together — the ferris wheel at sunset… 🥰');
    if (typeof sfx === 'function') sfx('purr');
  } else if (act === 'home') {
    const owned = (state.owned && state.owned.homes) || [];
    if (p.homeId) { p.mode = 'home'; showNotif('🏠 ' + p.name + ' heads home to keep the bed warm.'); }
    else if (!owned.length) { showNotif('🏠 Buy a home first (look for FOR SALE signs) — then you two can move in together!'); }
    else {
      p.homeId = owned[0]; p.mode = 'home';
      _catHappyT = 2.4; if (typeof spawnHeart === 'function') spawnHeart();
      if (typeof sfx === 'function') sfx('upgrade');
      showNotif('🏠💞 You and ' + p.name + ' move in together! They\'ll keep the home fires warm.');
    }
  } else if (act === 'farewell') {
    showNotif('💔 ' + p.name + ' touches noses with you one last time… and pads away. Still friends.');
    if (typeof sfx === 'function') sfx('sad');
    if (p.group) scene.remove(p.group);
    if (typeof unemploy === 'function') unemploy(p.id);
    if (typeof hideRoamingCat === 'function') hideRoamingCat(p.name, false);
    state.partner = null;
  }
  if (typeof saveGame === 'function') saveGame();
}

// per-frame love: follow with real trot & leaps, hunt together, keep the home
function updatePartner(t) {
  const p = state.partner; if (!p) return;
  if (!p.group) { partnerMesh(); return; }
  if (state.driving) { p.group.visible = false; return; }
  if (typeof playerIndoors === 'function' && playerIndoors()) { p.group.visible = false; return; }
  p.group.visible = true;
  if (p.heart) { p.heart.position.y = 1.15 + Math.sin(t * 2.4) * 0.08; p.heart.material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.3; }
  const gp = p.group.position, cp = catGroup.position;
  if (p.mode === 'home' && p.homeId && typeof PROPERTIES !== 'undefined') {
    const hm = PROPERTIES.find(pr => pr.id === p.homeId);
    if (hm) {
      const dx = (hm.x + 1.4) - gp.x, dz = (hm.z + 2.8) - gp.z, d = Math.hypot(dx, dz);
      if (d > 0.4) { gp.x += dx / d * 0.05; gp.z += dz / d * 0.05; p.group.rotation.y = Math.atan2(dx, dz); walkCatParts(p, t); }
      else idleCatParts(p, t);
      if (Math.hypot(cp.x - gp.x, cp.z - gp.z) < 3 && Math.random() < 0.004) { if (typeof spawnHeart === 'function') spawnHeart(); if (typeof sfx === 'function') sfx('purr'); }
    }
    return;
  }
  if (p.mode !== 'follow') { idleCatParts(p, t); return; }
  // 🐭 hunting together: on a park date they chase critters themselves
  if (p.hunting && typeof PARK !== 'undefined' && typeof nearestCritter === 'function') {
    const inPark = gp.x > PARK.x0 - 4 && gp.x < PARK.x1 + 4 && gp.z > PARK.z0 - 4 && gp.z < PARK.z1 + 4;
    p.huntCd = Math.max(0, (p.huntCd || 0) - 0.016);
    if (inPark && p.huntCd === 0) {
      const c = nearestCritter(gp, 7);
      if (c) {
        const dx = c.x - gp.x, dz = c.z - gp.z, d = Math.hypot(dx, dz);
        if (d < 0.8) {
          if (typeof catchCritter === 'function') catchCritter(c);
          showNotif('💞 ' + p.name + ' pounces — caught one for the two of you!');
          p.huntCd = 7;
          if (typeof spawnHeart === 'function') spawnHeart();
        } else {
          gp.x += dx / d * 0.09; gp.z += dz / d * 0.09;
          p.group.rotation.y = Math.atan2(dx, dz);
          walkCatParts(p, t, 1.6);
          return;
        }
      }
    }
  }
  const dx = cp.x - gp.x, dz = cp.z - gp.z, d = Math.hypot(dx, dz);
  if (d > 30) gp.set(cp.x - 1.3, 0, cp.z);
  else if (d > 1.7) {
    const sp = Math.min(0.12, (d - 1.5) * 0.07);
    gp.x += dx / d * sp; gp.z += dz / d * sp;
    p.group.rotation.y = Math.atan2(dx, dz);
    walkCatParts(p, t);
  } else {
    idleCatParts(p, t);
    p.group.rotation.y += (Math.atan2(dx, dz) - p.group.rotation.y) * 0.08;
  }
  // leaps between tiers, just like you
  const targetY = state.catBaseY || 0;
  if (p.jumpT == null && Math.abs(targetY - (p.floorY || 0)) > 0.35) { p.jumpT = 0; p.jumpFrom = p.floorY || 0; p.jumpTo = targetY; }
  if (p.jumpT != null) {
    p.jumpT += 0.05;
    const pr = Math.min(1, p.jumpT), arc = Math.sin(pr * Math.PI);
    p.floorY = p.jumpFrom + (p.jumpTo - p.jumpFrom) * pr + arc * (0.7 + Math.abs(p.jumpTo - p.jumpFrom) * 0.25);
    (p.parts.legs || []).forEach((l, i) => { l.rotation.x = arc * (i < 2 ? -0.8 : 0.8); });
    if (pr >= 1) { p.floorY = p.jumpTo; p.jumpT = null; }
  }
  gp.y = Math.max(gp.y, 0);
}
function walkCatParts(p, t, mult) {
  p.walkT = (p.walkT || 0) + 0.42 * (mult || 1);
  const sw = Math.sin(p.walkT);
  (p.parts.legs || []).forEach((leg, i) => { leg.rotation.x = (i % 2 ? sw : -sw) * 0.85; });
  const segs = p.parts.tail && p.parts.tail.userData && p.parts.tail.userData.segs;
  if (segs) segs.forEach((s2, i) => { s2.rotation.x = ((s2.userData && s2.userData.rx) || 0) + Math.sin(p.walkT * 0.5 + i) * 0.12; });
  p.group.position.y = (p.floorY || 0) + Math.abs(sw) * 0.06;
}
function idleCatParts(p, t) {
  (p.parts.legs || []).forEach(l => l.rotation.x *= 0.75);
  if (p.parts.body) p.parts.body.scale.y = 1 + Math.sin(t * 2.2 + p.phase) * 0.03;
  const segs = p.parts.tail && p.parts.tail.userData && p.parts.tail.userData.segs;
  if (segs) segs.forEach((s2, i) => { s2.rotation.x = ((s2.userData && s2.userData.rx) || 0) + Math.sin(t * 1.5 + i * 0.5 + p.phase) * 0.06; });
  p.group.position.y = p.floorY || 0;
}
function partnerContext(cp) {
  const p = state.partner;
  if (!p || !p.group || !p.group.visible || state.driving) return null;
  if (Math.hypot(cp.x - p.group.position.x, cp.z - p.group.position.z) > 1.45) return null;   // walk right up to them — a deliberate nuzzle
  return { id: 'love:wheel', label: '💞 ' + p.name };
}
