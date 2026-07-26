// neighbors.js — 🏘️ SimCity-style town sharing: publish a snapshot of YOUR town,
// add friends by code or share-link, and view their towns as an aerial postcard.
// Nobody joins anybody's world — it's sightseeing, so nothing needs realtime sync.
//
// The cloud part is a tiny adapter (TOWN_CLOUD): with no config it stores towns in
// localStorage (works for testing on one device); fill in cfg with a free Supabase
// project (url + anon key + a `towns` table: code text primary key, snap jsonb,
// updated timestamptz) and the SAME code publishes for real.

const TOWN_CLOUD = {
  cfg: {
    url: '',    // e.g. 'https://abcdefg.supabase.co'   ← paste from Supabase → Settings → API
    key: '',    // the anon/public key
  },
  local() { return !this.cfg.url; },
  async publish(code, snap) {
    if (this.local()) { try { localStorage.setItem('pp-town-' + code, JSON.stringify(snap)); } catch (e) { return false; } return true; }
    try {
      const r = await fetch(this.cfg.url + '/rest/v1/towns', {
        method: 'POST',
        headers: { apikey: this.cfg.key, Authorization: 'Bearer ' + this.cfg.key, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ code, snap, updated: new Date().toISOString() }),
      });
      return r.ok;
    } catch (e) { return false; }
  },
  async fetch(code) {
    if (this.local()) { try { const s = localStorage.getItem('pp-town-' + code); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
    try {
      const r = await fetch(this.cfg.url + '/rest/v1/towns?code=eq.' + encodeURIComponent(code) + '&select=snap', {
        headers: { apikey: this.cfg.key, Authorization: 'Bearer ' + this.cfg.key },
      });
      if (!r.ok) return null;
      const rows = await r.json();
      return rows.length ? rows[0].snap : null;
    } catch (e) { return null; }
  },
};

// ── Your town code (made once, lives in the save) ──
function myTownCode() {
  if (!state.townCode) {
    const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // no confusable 0/O/1/I/L
    let c = ''; for (let i = 0; i < 5; i++) c += abc[Math.floor(Math.random() * abc.length)];
    state.townCode = 'PAWS-' + c;
    if (typeof saveGame === 'function') saveGame();
  }
  return state.townCode;
}
function townShareLink(code) {
  return location.origin + location.pathname + '?town=' + encodeURIComponent(code || myTownCode());
}

// ── The snapshot: everything needed to DRAW the town, nothing more ──
function townSnapshot() {
  const pop = (typeof townPopulation === 'function') ? townPopulation() : { humans: 0, cats: 0 };
  const cust = state.catCustom || {};
  return {
    v: 1,
    name: state.catName || 'Whiskers',
    day: state.dayCount || 0,
    pop: { h: pop.humans || 0, c: pop.cats || 0 },
    houseLevel: state.houseLevel || 0,
    phase: (state.politics && state.politics.phase) || 'none',
    rep: (typeof reputation === 'function') ? reputation().label : '',
    degrees: (state.school && (state.school.done || []).length) || 0,
    goodDeeds: state.goodDeeds || 0,
    cat: { body: cust.body, accent: cust.accent, eye: cust.eye, nose: cust.nose },
    placed: state.placed || [],
    streetNames: state.streetNames || {},
    biz: (typeof ownedBusinessIds === 'function') ? ownedBusinessIds() : [],
    civics: state.civics || [],
    homes: (state.politics && state.politics.homes) || [],
    shopOwned: !!(state.owned && state.owned.shop),
    up: Date.now(),
  };
}

// ── The neighbors panel ──
function neighborList() { return state.neighbors || (state.neighbors = []); }
function openNeighbors() {
  if (typeof sfx === 'function') sfx('ui');
  state.uiOpen = true;
  renderNeighbors();
  document.getElementById('neighbors').classList.add('show');
}
function closeNeighbors() { state.uiOpen = false; document.getElementById('neighbors').classList.remove('show'); }
function renderNeighbors() {
  const body = document.getElementById('neighbors-body'); if (!body) return;
  const code = myTownCode();
  let h = `<div class="modal-sub">Share your town like a postcard — friends see it from above, you see theirs. ${TOWN_CLOUD.local() ? '<br>⚠️ <b>Demo mode:</b> towns are stored on THIS device until the cloud is connected.' : ''}</div>`;
  h += `<div class="nb-mycode">Your town code<br><b>${code}</b></div>`;
  h += `<div class="modal-row">`;
  h += `<button onclick="publishMyTown()">📤 Publish my town</button>`;
  h += `<button onclick="copyTownLink()">🔗 Copy share link</button>`;
  h += `</div>`;
  if (state._townPublished) h += `<div class="nb-note">✅ Published — friends with your code see today's town.</div>`;
  h += `<div class="nb-addrow"><input id="nb-code-input" placeholder="Friend's code — e.g. PAWS-XX2K7" autocomplete="off" spellcheck="false"><button class="rescue-buy" onclick="addNeighborFromInput()">➕ Add</button></div>`;
  const list = neighborList();
  if (list.length) {
    h += list.map((n, i) =>
      `<div class="nb-row"><span class="nb-name">🏘️ ${n.name || n.code}</span><span class="nb-code">${n.code}</span>` +
      `<button class="cust-pat" onclick="openTownView('${n.code}')">👁 Visit</button>` +
      `<button class="cust-pat" onclick="removeNeighbor(${i})">✕</button></div>`).join('');
  } else h += `<div class="nb-note">No neighbors yet — swap codes with a friend! 🐾</div>`;
  body.innerHTML = h;
}
async function publishMyTown() {
  const ok = await TOWN_CLOUD.publish(myTownCode(), townSnapshot());
  state._townPublished = ok;
  showNotif(ok ? '📤 Town published! Anyone with your code can visit.' : '⚠️ Publishing failed — check your connection.');
  if (typeof sfx === 'function') sfx(ok ? 'mail' : 'sad');
  renderNeighbors();
}
function copyTownLink() {
  const link = townShareLink();
  const done = () => showNotif('🔗 Link copied — send it to a friend!');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, () => prompt('Copy your town link:', link));
  else prompt('Copy your town link:', link);
}
function addNeighborFromInput() {
  const el = document.getElementById('nb-code-input'); if (!el) return;
  let code = (el.value || '').trim().toUpperCase();
  const m = code.match(/PAWS-[A-Z2-9]{5}/);                       // accept a bare code OR a pasted link
  if (m) code = m[0];
  if (!/^PAWS-[A-Z2-9]{5}$/.test(code)) { showNotif('That doesn\'t look like a town code (PAWS-XXXXX)'); return; }
  addNeighbor(code);
  el.value = '';
}
function addNeighbor(code, name) {
  if (code === state.townCode) { showNotif('That\'s your own town, silly 🐾'); return; }
  const list = neighborList();
  if (list.some(n => n.code === code)) { showNotif('Already a neighbor!'); renderNeighbors(); return; }
  list.push({ code, name: name || null });
  if (typeof sfx === 'function') sfx('coin');
  showNotif('🏘️ Neighbor added: ' + code);
  if (typeof saveGame === 'function') saveGame();
  renderNeighbors();
}
function removeNeighbor(i) {
  neighborList().splice(i, 1);
  if (typeof saveGame === 'function') saveGame();
  renderNeighbors();
}

// ── The aerial postcard viewer ──
let _tvSnap = null, _tvCode = null;
async function openTownView(code, fromLink) {
  if (typeof sfx === 'function') sfx('ui');
  const modal = document.getElementById('townview'); if (!modal) return;
  if (state.gameStarted) state.uiOpen = true;
  _tvCode = code;
  document.getElementById('townview-head').innerHTML = '<div class="modal-sub">✈️ Flying over…</div>';
  modal.classList.add('show');
  const snap = await TOWN_CLOUD.fetch(code);
  _tvSnap = snap;
  if (!snap) {
    document.getElementById('townview-head').innerHTML =
      `<div class="modal-sub">😿 No town found for <b>${code}</b>.${TOWN_CLOUD.local() ? '<br>(Demo mode only sees towns published on THIS device.)' : ' Ask your friend to 📤 publish first!'}</div>`;
    return;
  }
  const known = neighborList().some(n => n.code === code) || code === state.townCode;
  const badge = snap.phase === 'president' ? '👑 President' : snap.phase === 'mayor' ? '🎩 Mayor' : '';
  document.getElementById('townview-head').innerHTML =
    `<div class="nb-townname">🏘️ ${snap.name}'s Town ${badge ? '· ' + badge : ''}</div>` +
    `<div class="nb-stats">👤 ${snap.pop.h} · 🐱 ${snap.pop.c} · 🏠 home ${snap.houseLevel}/5 · 🎓 ${snap.degrees} · ❤️ ${snap.goodDeeds} · day ${snap.day}${snap.rep ? '<br>' + snap.rep : ''}</div>` +
    (!known && fromLink ? `<button class="rescue-buy" onclick="addNeighbor('${code}', '${(snap.name || '').replace(/'/g, '')}')">➕ Add as neighbor</button>` : '');
  // remember their name on the neighbor row
  const row = neighborList().find(n => n.code === code);
  if (row && snap.name && row.name !== snap.name) { row.name = snap.name; if (typeof saveGame === 'function') saveGame(); }
  drawTownPostcard(document.getElementById('townview-canvas'), snap);
}
function closeTownView() { if (state.gameStarted) state.uiOpen = false; document.getElementById('townview').classList.remove('show'); }

function drawTownPostcard(cv, snap) {
  if (!cv) return;
  const D = 1040; cv.width = D; cv.height = D;
  const g = cv.getContext('2d');
  const SPAN = 224, S = D / SPAN, C = D / 2;
  const WX = x => C + x * S, WZ = z => C + z * S;
  const rr = (x, y, w, h, r) => { r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

  // grass + soft grid
  const bg = g.createLinearGradient(0, 0, 0, D); bg.addColorStop(0, '#c6e3a6'); bg.addColorStop(1, '#a9d787'); g.fillStyle = bg; g.fillRect(0, 0, D, D);
  g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1;
  for (let i = 0; i <= D; i += D / 14) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, D); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(D, i); g.stroke(); }

  // the three base streets + the highway (same bones as every town)
  const roadH = (z, halfW) => { const y = WZ(z), h = halfW * 2 * S; g.fillStyle = '#d9ccb4'; g.fillRect(0, y - h / 2 - 3, D, h + 6); g.fillStyle = '#f5f0e6'; g.fillRect(0, y - h / 2, D, h); g.save(); g.setLineDash([16, 13]); g.strokeStyle = '#dccca6'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y); g.lineTo(D, y); g.stroke(); g.restore(); };
  roadH(-26, 3); roadH(0, 3.5); roadH(38, 3.5);
  (snap.placed || []).forEach(r => { if (r.type !== 'road') return; const horiz = Math.abs(Math.sin(r.rot || 0)) < 0.5, w = (horiz ? 6 : 4) * S, h = (horiz ? 4 : 6) * S; g.fillStyle = '#f5f0e6'; rr(WX(r.x) - w / 2, WZ(r.z) - h / 2, w, h, 3); g.fill(); });
  { const y = WZ(66); g.fillStyle = '#9aa0aa'; g.fillRect(0, y - 8, D, 16); g.save(); g.setLineDash([20, 15]); g.strokeStyle = '#f0e0a0'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, y); g.lineTo(D, y); g.stroke(); g.restore(); }

  // their street names
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(120,100,68,0.6)'; g.font = '700 17px Georgia, serif';
  const sn = (k, def) => (snap.streetNames && snap.streetNames[k]) || def;
  [[-26, sn('south', 'SOUTH LANE')], [0, sn('main', 'MAIN STREET')], [38, sn('north', 'NORTH AVENUE')]].forEach(([z, name]) => [-160, 200].forEach(dx => g.fillText(name, C + dx, WZ(z))));
  g.restore();

  // square + park
  g.fillStyle = '#eae1cd'; rr(WX(-33), WZ(12), 66 * S, 16 * S, 12); g.fill(); g.strokeStyle = '#d3c6ac'; g.lineWidth = 2; g.stroke();
  if (typeof PARK !== 'undefined') {
    g.fillStyle = '#93d16f'; rr(WX(PARK.x0), WZ(PARK.z0), (PARK.x1 - PARK.x0) * S, (PARK.z1 - PARK.z0) * S, 20); g.fill();
    g.save(); g.setLineDash([5, 5]); g.strokeStyle = '#6cab4b'; g.lineWidth = 2.5; g.stroke(); g.restore();
    const px = WX(PARK.x0 + 4), py = WZ(PARK.z1 - 6);   // the park pond
    g.fillStyle = '#6fc6e2'; g.beginPath(); g.arc(px, py, 3.2 * S, 0, 7); g.fill(); g.strokeStyle = '#49a8d2'; g.lineWidth = 2; g.stroke();
  }

  // buildings
  const shadow = (x, y, w, h, r) => { g.fillStyle = 'rgba(40,30,15,0.14)'; rr(x + 2, y + 3, w, h, r); g.fill(); };
  const bldg = (x, z, w, d, fill, stroke) => { const bw = w * S, bh = d * S, bx = WX(x) - bw / 2, by = WZ(z) - bh / 2; shadow(bx, by, bw, bh, 4); g.fillStyle = fill; rr(bx, by, bw, bh, 4); g.fill(); g.strokeStyle = stroke; g.lineWidth = 1.5; g.stroke(); };
  bldg(-3, -10, 4.5, 3.5, '#f0c0d0', '#d888aa');                                       // the Miller home
  if (snap.shopOwned) bldg(-18, -9, 5, 4, '#a9cfe8', '#7ba9cf');                       // Dad's shop
  if (typeof SHELTER !== 'undefined') bldg(SHELTER.x, SHELTER.z, 13, 8, '#d4e6dd', '#8fbfae');
  if (typeof SCHOOL_SPOT !== 'undefined') bldg(25, 31.5, 8, 6, '#e8c0a8', '#c09078');  // schoolhouse (fixed spot)
  if (typeof JOB_SITES !== 'undefined') JOB_SITES.forEach(s => bldg(s.x, s.z, 5, 4, '#bcd6ea', '#8bb3d6'));
  if (typeof BUSINESS_LOTS !== 'undefined') (snap.biz || []).forEach(id => { const lot = BUSINESS_LOTS[id]; if (lot && id !== 'shop') bldg(lot.x, -46, 7, 6, '#c9b6e0', '#a488c8'); });
  if (typeof CIVIC_LOTS !== 'undefined') (snap.civics || []).forEach(id => { const lot = CIVIC_LOTS[id]; if (lot) bldg(lot.x, lot.z, 9, 7, '#a9e0d0', '#6ec2ac'); });
  (snap.homes || []).forEach(hm => bldg(hm.x, hm.z, 5, 4, '#b0e0b0', '#7ab87a'));      // president public homes

  // their planner pieces
  (snap.placed || []).forEach(r => {
    const px = WX(r.x), py = WZ(r.z);
    if (r.type === 'house') bldg(r.x, r.z, 5, 4, '#eccaa0', '#cba46e');
    else if (r.type === 'shelter') bldg(r.x, r.z, 6, 5, '#d4e6dd', '#8fbfae');
    else if (r.type === 'tree' || r.type === 'pine' || r.type === 'blossom') { g.fillStyle = r.type === 'blossom' ? '#e8a8c8' : r.type === 'pine' ? '#2e7a3e' : '#4f9d38'; g.beginPath(); g.arc(px, py, 4.5, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 1; g.stroke(); }
    else if (r.type === 'flowers') { g.fillStyle = '#f0d060'; g.beginPath(); g.arc(px, py, 2.6, 0, 7); g.fill(); }
    else if (r.type === 'bench') { g.fillStyle = '#9a7248'; g.fillRect(px - 3, py - 2, 6, 4); }
    else if (r.type === 'lamp') { g.fillStyle = '#f0d060'; g.beginPath(); g.arc(px, py, 2.4, 0, 7); g.fill(); g.strokeStyle = '#b09030'; g.lineWidth = 1; g.stroke(); }
    else if (r.type === 'fence') { g.strokeStyle = '#8a6a4a'; g.lineWidth = 2.5; g.beginPath(); const horiz = Math.abs(Math.sin(r.rot || 0)) < 0.5; if (horiz) { g.moveTo(px - 3 * S, py); g.lineTo(px + 3 * S, py); } else { g.moveTo(px, py - 3 * S); g.lineTo(px, py + 3 * S); } g.stroke(); }
    else if (r.type === 'bin') { g.fillStyle = '#5a6a5e'; g.fillRect(px - 2, py - 2, 4, 4); }
    else if (r.type === 'fountain' || r.type === 'pond' || r.type === 'lake') { const rad = (r.type === 'lake' ? 5 : r.type === 'pond' ? 3 : 2) * S; g.fillStyle = '#6fc6e2'; g.beginPath(); g.arc(px, py, rad, 0, 7); g.fill(); g.strokeStyle = '#49a8d2'; g.lineWidth = 2; g.stroke(); }
  });

  // their cat, waving from their home — painted in THEIR colours
  const cc = snap.cat || {};
  g.font = '26px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(240,190,60,0.3)'; g.beginPath(); g.arc(WX(-3), WZ(-10), 20, 0, 7); g.fill();
  g.fillStyle = cc.body || '#e8c878'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(WX(-3), WZ(-10), 10, 0, 7); g.fill(); g.stroke();
  g.fillStyle = cc.eye || '#7cc46a'; [-1, 1].forEach(d => { g.beginPath(); g.arc(WX(-3) + d * 3.5, WZ(-10) - 1, 2, 0, 7); g.fill(); });

  // postcard frame + stamp
  g.strokeStyle = 'rgba(90,74,58,0.45)'; g.lineWidth = 7; rr(5, 5, D - 10, D - 10, 16); g.stroke();
  g.save(); g.translate(D - 74, 66); g.rotate(0.06);
  g.fillStyle = 'rgba(255,253,247,0.95)'; g.fillRect(-42, -34, 84, 68); g.strokeStyle = '#c8b088'; g.setLineDash([4, 3]); g.lineWidth = 2; g.strokeRect(-38, -30, 76, 60);
  g.setLineDash([]); g.font = '30px serif'; g.textAlign = 'center'; g.fillText('🐾', 0, 2);
  g.font = '700 11px Georgia'; g.fillStyle = '#8a7458'; g.fillText('PAWS POST', 0, 24);
  g.restore();
}

// ── Share links: game.html?town=PAWS-XXXXX opens straight into the postcard ──
(() => {
  try {
    const code = new URLSearchParams(location.search).get('town');
    if (code && /^PAWS-[A-Z2-9]{5}$/.test(code.toUpperCase())) setTimeout(() => openTownView(code.toUpperCase(), true), 600);
  } catch (e) {}
})();
