// inbox.js — 📬 the mail inbox (with an unread badge), the arrow-tutorial cards,
// and the CV system (your auto-written CV + a CV for every worker you hire).

// ── 📬 Inbox ──────────────────────────────────────────────────────────────────
function inboxList() { return state.inbox || (state.inbox = []); }
function inboxUnread() { return inboxList().filter(m => !m.read).length; }
function inboxAdd(from, subject, body) {
  if (inboxList().some(m => m.subject === subject)) return;   // no duplicate letters
  inboxList().unshift({ id: 'm' + Date.now() + Math.floor(Math.random() * 1e4), from, subject, body, read: false, day: state.dayCount || 0 });
  updateInboxBadge();
  showNotif('📬 New mail: ' + subject);
  if (typeof sfx === 'function') sfx('mail');
  if (typeof saveGame === 'function') saveGame();
}
function updateInboxBadge() {
  const u = inboxUnread(), label = u > 9 ? '9+' : u;
  const n = document.getElementById('inbox-count');
  if (n) { n.textContent = label; n.style.display = u > 0 ? 'flex' : 'none'; }
  // mirror on the ☰ button while the tray is tucked away, so new mail is never missed
  const m = document.getElementById('menu-badge');
  const trayOpen = (document.getElementById('toolbar') || {}).classList ? document.getElementById('toolbar').classList.contains('open') : false;
  if (m) { m.textContent = label; m.style.display = (u > 0 && !trayOpen) ? 'flex' : 'none'; }
}
function openInbox() {
  if (typeof sfx === 'function') sfx('ui');
  state.uiOpen = true; renderInbox(); document.getElementById('inbox').classList.add('show'); }
function closeInbox() { state.uiOpen = false; document.getElementById('inbox').classList.remove('show'); }
function inboxOpenMail(id) {
  const m = inboxList().find(x => x.id === id);
  if (m) { m.read = true; state._inboxOpen = (state._inboxOpen === id) ? null : id; }
  renderInbox(); updateInboxBadge();
  if (typeof saveGame === 'function') saveGame();
}
function renderInbox() {
  const body = document.getElementById('inbox-body');
  if (!body) return;
  const list = inboxList();
  if (!list.length) { body.innerHTML = '<div class="modal-sub">No mail yet — letters about jobs, the mayor\'s office and more will arrive here. 📭</div>'; return; }
  body.innerHTML = list.map(m =>
    `<div class="mail-item ${m.read ? '' : 'unread'}" onclick="inboxOpenMail('${m.id}')">` +
      `<div class="mail-head"><span class="mail-from">${m.from}</span><span class="mail-day">day ${m.day}</span></div>` +
      `<div class="mail-subject">${m.read ? '' : '● '}${m.subject}</div>` +
      (state._inboxOpen === m.id ? `<div class="mail-body">${m.body}</div>` : '') +
    `</div>`).join('');
}

// ── 🎓 Tutorial cards: short guided steps with a glowing arrow to the right button ──
function tutorialSeen(id) { return (state.tutorialsSeen || []).includes(id); }
function showTutorial(id, steps, force) {
  if (!force && tutorialSeen(id)) return;
  if (!tutorialSeen(id)) (state.tutorialsSeen = state.tutorialsSeen || []).push(id);
  state._tut = { steps, i: 0 };
  renderTutorial();
  if (typeof saveGame === 'function') saveGame();
}
function tutClearGlow() { document.querySelectorAll('.tut-glow').forEach(el => el.classList.remove('tut-glow')); }
function renderTutorial() {
  const el = document.getElementById('tutorial');
  const tut = state._tut;
  tutClearGlow();
  if (!el) return;
  if (!tut || tut.i >= tut.steps.length) { el.style.display = 'none'; state._tut = null; return; }
  const s = tut.steps[tut.i];
  el.style.display = 'block';
  document.getElementById('tut-text').innerHTML = s.text;
  document.getElementById('tut-next').textContent = tut.i < tut.steps.length - 1 ? ('Next ▶ (' + (tut.i + 1) + '/' + tut.steps.length + ')') : '✓ Got it!';
  if (s.glow) {
    const target = document.getElementById(s.glow);
    if (target) {
      target.classList.add('tut-glow');
      // target tucked inside the closed ☰ tray? glow the ☰ button so the player can find it
      const tb = document.getElementById('toolbar'), mt = document.getElementById('menu-toggle');
      if (tb && mt && tb.contains(target) && !tb.classList.contains('open')) mt.classList.add('tut-glow');
    }
  }
}
function tutNext() { if (state._tut) { state._tut.i++; renderTutorial(); } }
function tutSkip() { state._tut = null; renderTutorial(); }

// ── 📄 YOUR CV — written automatically by how you live (not editable!) ──
function myOccupation() {
  const ph = state.politics && state.politics.phase;
  if (ph === 'president') return '👑 President of the town';
  if (ph === 'mayor') return '🎩 Mayor';
  if (state.job) return '🛒 Cashier at ' + state.job.name;
  if (typeof hasAnyBusiness === 'function' && hasAnyBusiness()) return '💼 Business owner';
  return '🐾 Odd-jobs cat';
}
function renderMyCV() {
  const cv = state.cvJobs || [];
  const totalShifts = cv.reduce((s, r) => s + (r.shifts || 0), 0);
  const degrees = (state.school && state.school.done) || [];
  const degName = { logistics: '💼 Logistics Diploma', business: '📊 Business Degree', civics: '🏛️ Civics & Law' };
  let h = `<div class="cv-card"><div class="cv-title">📄 Curriculum Vitae</div>`;
  h += `<div class="cv-name">${state.catName || 'Whiskers'} Miller</div>`;
  h += `<div class="cv-line">${myOccupation()}</div>`;
  h += `<div class="cv-sec">🎓 Education</div>`;
  h += degrees.length ? degrees.map(d => `<div class="cv-line">${degName[d] || d}</div>`).join('') : `<div class="cv-line cv-dim">No diplomas yet — visit the 🏫 Town School</div>`;
  h += `<div class="cv-sec">💼 Work history · ${totalShifts} shift${totalShifts === 1 ? '' : 's'} worked</div>`;
  h += cv.length ? cv.map(r => `<div class="cv-line">${r.emoji || '🛒'} Cashier, ${r.name} — ${r.shifts || 0} shift${r.shifts === 1 ? '' : 's'}${r.fired ? ' · <span class="cv-bad">let go</span>' : ''}</div>`).join('') : `<div class="cv-line cv-dim">No jobs held yet — look for "WE'RE HIRING!" boards in town</div>`;
  const nBiz = (typeof ownedBusinessIds === 'function') ? ownedBusinessIds().length : 0;
  h += `<div class="cv-sec">⭐ Achievements</div>`;
  h += `<div class="cv-line">🏢 ${nBiz} business${nBiz === 1 ? '' : 'es'} owned · 🐱 ${(state.freed || []).length + (state.createdCats || []).length} cats given a life · 🏠 ${(typeof housesBuiltCount === 'function') ? housesBuiltCount() : 0} homes</div>`;
  h += `<div class="cv-note">Your CV writes itself as you live — it can't be edited. 🐾</div></div>`;
  return h;
}

// ── 👥 Worker CVs: everyone you hire has a name and a little résumé ──
const HIRE_NAMES_H = ['Sam Reed', 'June Park', 'Ivo Brandt', 'Mara Solis', 'Ola Nyberg', 'Ken Ito', 'Rita Vale', 'Theo Marsh', 'Ada Lund', 'Omar Haddad', 'Nina Petrov', 'Gus Whitfield'];
const HIRE_NAMES_C = ['Whiskerton', 'Purrcy', 'Mrs. Paws', 'Sir Fluff', 'Minka', 'Tomcat Joe', 'Velvet', 'Biscotti', 'Grimalkin', 'Pawline'];
const HIRE_TRAITS = ['hard-working', 'always cheerful', 'punctual', 'great with customers', 'fast learner', 'keeps things tidy', 'good under pressure', 'a people person'];
const HIRE_PREV = ['the docks', 'a farm upcountry', 'the old mill', 'a café out east', 'the fishing boats', 'nowhere — first job!', 'the city market', 'a bakery back home'];
function dressWorkerCV(w) {   // give a (possibly old-save) worker their identity
  if (!w.name) {
    const pool = w.type === 'cat' ? HIRE_NAMES_C : HIRE_NAMES_H;
    w.name = pool[Math.floor(Math.random() * pool.length)];
    w.trait = HIRE_TRAITS[Math.floor(Math.random() * HIRE_TRAITS.length)];
    w.prev = HIRE_PREV[Math.floor(Math.random() * HIRE_PREV.length)];
    if (w.hiredDay == null) w.hiredDay = state.dayCount || 0;
  }
  return w;
}
function renderStaffCVs() {
  if (typeof workerList !== 'function') return '';
  const all = workerList();
  if (!all.length) return '';
  let h = `<div class="cv-sec-big">👥 Your staff (tap a name for their CV)</div>`;
  const byBiz = {};
  all.forEach(w => { dressWorkerCV(w); (byBiz[w.biz] = byBiz[w.biz] || []).push(w); });
  Object.keys(byBiz).forEach(bid => {
    const def = (typeof bizDef === 'function') ? bizDef(bid) : null;
    h += `<div class="staff-block"><div class="staff-biz">${def ? def.icon + ' ' + def.name : bid}</div>`;
    byBiz[bid].forEach((w, i) => {
      const days = Math.max(0, (state.dayCount || 0) - (w.hiredDay || 0));
      const open = state._staffOpen === bid + ':' + i;
      h += `<div class="staff-row ${open ? 'open' : ''}" onclick="toggleStaffCV('${bid}', ${i})">` +
        `<span>${w.type === 'cat' ? '🐱' : '🧑'} <b>${w.name}</b>${i === 0 ? ' · 🧾 cashier' : ''}</span><span class="cv-dim">${days}d</span>` +
        (open ? `<div class="staff-cv">📄 <b>${w.name}</b> — ${w.type === 'cat' ? 'working cat' : 'shop worker'}<br>Previously: ${w.prev}<br>Known for being <i>${w.trait}</i><br>With you since day ${w.hiredDay || 0} · wage ${typeof WORKER_SALARY !== 'undefined' ? WORKER_SALARY : 1300} 🪙/day</div>` : '') +
        `</div>`;
    });
    h += `</div>`;
  });
  return h;
}
function toggleStaffCV(bid, i) {
  const key = bid + ':' + i;
  state._staffOpen = (state._staffOpen === key) ? null : key;
  if (typeof renderBusiness === 'function') renderBusiness();
}
