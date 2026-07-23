// Paws & Pennies — jobs: the minigame engine, the three jobs, and startGame()
// Classic script: shares globals with the others; load order matters (see index.html).

// ─── Mouse-catching minigame ────────────────────────────────────────────────────
const mg = {
  active: false, job: null, entities: [], pops: [], caught: 0, earned: 0,
  timeLeft: 0, duration: 22, spawnTimer: 0, popTimer: 0,
  npc: null, canvas: null, ctx: null, w: 0, h: 0, last: 0, raf: null,
  pointer: { x: -999, y: -999 }, bound: false,
};

function mgResize() {
  const c = mg.canvas, r = c.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio, 2);
  c.width = Math.max(1, r.width * dpr);
  c.height = Math.max(1, r.height * dpr);
  mg.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mg.w = r.width; mg.h = r.height;
}

// ── Job definitions ──────────────────────────────────────────────────────────
// Each job is a self-contained minigame: start / update / draw / tap, plus the
// flavour text shown in the HUD, the result card, and the neighbour's thank-you.

// Grocery catalogue — shared by Mrs. Chen's "shop from the list" job
const GROCERY = {
  apple:  { name: 'Apple' },  orange: { name: 'Orange' },
  bread:  { name: 'Bread' },  can:    { name: 'Beans' },
  milk:   { name: 'Milk' },   cheese: { name: 'Cheese' },
  carrot: { name: 'Carrot' }, fish:   { name: 'Fish' },
};
const GROCERY_TYPES = Object.keys(GROCERY);
function randomGroceryType(exclude) {
  let t; do { t = GROCERY_TYPES[Math.floor(Math.random() * GROCERY_TYPES.length)]; } while (t === exclude && GROCERY_TYPES.length > 1);
  return t;
}

// 🐭 Farmer Bob's barn — chase & tap the fleeing mice (the original game)
const jobMice = {
  id: 'mice', title: '🐭 Farmer Bob’s Barn', hint: 'Tap the mice to pounce! 🐾',
  icon: '🐭', verb: 'caught', noun: ['mouse', 'mice'], duration: 22, target: 7,
  failText: 'The mice were too quick this time…',
  doneLine: c => `Bless you! That’s the mice sorted. Here’s ${c} ${c === 1 ? 'coin' : 'coins'} for your trouble! 🪙`,
  failLine: 'Ah, they were too quick! Come back and try again, little one.',
  start(mg) { mg.entities = []; mg.spawnTimer = 0; for (let i = 0; i < this.target; i++) this.spawn(mg, false); },
  spawn(mg, fromEdge) {
    let x, y;
    if (fromEdge) {
      const side = Math.floor(Math.random() * 4);
      if (side === 0)      { x = -20;       y = Math.random() * mg.h; }
      else if (side === 1) { x = mg.w + 20; y = Math.random() * mg.h; }
      else if (side === 2) { x = Math.random() * mg.w; y = -20; }
      else                 { x = Math.random() * mg.w; y = mg.h + 20; }
    } else { x = 40 + Math.random() * (mg.w - 80); y = 70 + Math.random() * (mg.h - 130); }
    mg.entities.push({ x, y, dir: Math.random() * Math.PI * 2, speed: 40 + Math.random() * 32,
                       turnT: 0, caught: false, caughtT: 0, scale: 0, wob: Math.random() * 6 });
  },
  update(mg, dt) {
    mg.spawnTimer -= dt;
    const live = mg.entities.filter(m => !m.caught).length;
    const ramp = 1 + (1 - mg.timeLeft / mg.duration) * 0.85;   // mice get quicker & bolder as time runs down
    if (mg.spawnTimer <= 0 && live < this.target && mg.timeLeft > 1.5) { this.spawn(mg, true); mg.spawnTimer = (0.4 + Math.random() * 0.5) / ramp; }
    const { w, h } = mg;
    mg.entities.forEach(m => {
      if (m.caught) { m.caughtT += dt; m.scale = Math.max(0, 1 - m.caughtT * 3.5); return; }
      m.scale = Math.min(1, m.scale + dt * 4);
      m.turnT -= dt;
      if (m.turnT <= 0) { m.dir += (Math.random() - 0.5) * 1.6; m.turnT = 0.25 + Math.random() * 0.7; }
      const pdx = m.x - mg.pointer.x, pdy = m.y - mg.pointer.y, pd = Math.hypot(pdx, pdy);
      let sp = m.speed * ramp;
      if (pd < 130) { m.dir = Math.atan2(pdy, pdx); sp = m.speed * ramp * 1.65; } // scatter from the paw, harder as time runs down
      m.x += Math.cos(m.dir) * sp * dt; m.y += Math.sin(m.dir) * sp * dt;
      if (m.x < 16) { m.x = 16; m.dir = Math.PI - m.dir; }
      if (m.x > w - 16) { m.x = w - 16; m.dir = Math.PI - m.dir; }
      if (m.y < 46) { m.y = 46; m.dir = -m.dir; }
      if (m.y > h - 22) { m.y = h - 22; m.dir = -m.dir; }
      m.wob += dt * 14;
    });
    mg.entities = mg.entities.filter(m => !(m.caught && m.scale <= 0));
  },
  draw(mg) {
    plankFloor(mg, '#6b4f33');
    const ctx = mg.ctx;
    mg.entities.forEach(m => {
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.dir + Math.PI / 2); ctx.scale(m.scale, m.scale);
      drawMouse(ctx, Math.sin(m.wob)); ctx.restore();
    });
  },
  tap(mg, cx, cy) {
    let best = -1, bestD = 1e9;
    mg.entities.forEach((m, i) => { if (m.caught) return; const d = Math.hypot(m.x - cx, m.y - cy); if (d < bestD) { bestD = d; best = i; } });
    if (best >= 0 && bestD < 60) { mg.entities[best].caught = true; mg.caught++; mg.spawnTimer = Math.min(mg.spawnTimer, 0.4); return true; }
    return false;
  },
};

// 🛒 Mrs. Chen's shop — catch the groceries tumbling out of the bag before they fall
// 🛒 Mrs. Chen's shop — she hands you a list; pick the right items off the shelves
const jobGrocery = {
  id: 'grocery', title: '🛒 Mrs. Chen’s Shop', hint: 'Read the list, then tap the matching groceries! 🐾',
  icon: '🛒', verb: 'fetched', noun: ['item', 'items'], duration: 26, listSize: 3, swipe: false,
  failText: 'Couldn’t find anything on the list this time…',
  doneLine: c => `Oh, thank you, little hero! You found everything on my list. Here’s ${c} ${c === 1 ? 'coin' : 'coins'} — and a treat. Don’t tell the others! 🪙`,
  failLine: 'Oh dear — never mind. Come back soon, little one.',
  start(mg) {
    const cols = 3, rows = 3, yTop = 86, yBot = mg.h - 38;
    mg.rowY = []; mg.entities = [];
    for (let r = 0; r < rows; r++) {
      const sy = yTop + (r + 0.5) * ((yBot - yTop) / rows);
      mg.rowY.push(sy);
      for (let c = 0; c < cols; c++) {
        mg.entities.push({ x: mg.w * ((c + 0.5) / cols), y: sy, type: randomGroceryType(), pulse: 0, pulseHit: false });
      }
    }
    this.genList(mg);
  },
  // pick a fresh shopping list of items that are currently on the shelves
  genList(mg) {
    const present = [...new Set(mg.entities.map(s => s.type))];
    for (let i = present.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [present[i], present[j]] = [present[j], present[i]]; }
    mg.list = present.slice(0, Math.min(this.listSize, present.length)).map(type => ({ type, done: false }));
  },
  update(mg, dt) {
    mg.entities.forEach(s => { if (s.pulse > 0) s.pulse = Math.max(0, s.pulse - dt * 1.8); });
  },
  draw(mg) {
    shopFloor(mg);
    const ctx = mg.ctx;
    ctx.fillStyle = '#7a5230';
    mg.rowY.forEach(ry => ctx.fillRect(0, ry + 20, mg.w, 7));        // shelf planks
    mg.entities.forEach(s => {
      ctx.save(); ctx.translate(s.x, s.y);
      const pop = 1 + (s.pulse > 0 ? Math.sin((1 - s.pulse) * Math.PI) * 0.18 : 0);
      ctx.scale(pop, pop); drawGrocery(ctx, s.type); ctx.restore();
      if (s.pulse > 0) {
        const a = s.pulse;
        ctx.strokeStyle = s.pulseHit ? `rgba(120,240,120,${a})` : `rgba(240,90,90,${a})`;
        ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y, 22 + (1 - a) * 14, 0, Math.PI * 2); ctx.stroke();
      }
    });
    drawList(mg);
  },
  tap(mg, cx, cy) {
    if (cy < 62) return false;                          // the list banner isn't tappable
    let best = -1, bestD = 1e9;
    mg.entities.forEach((s, i) => { const d = Math.hypot(s.x - cx, s.y - cy); if (d < bestD) { bestD = d; best = i; } });
    if (best < 0 || bestD > 48) return false;
    const slot = mg.entities[best];
    const need = mg.list.find(it => !it.done && it.type === slot.type);
    if (need) {
      need.done = true; mg.caught++;
      slot.pulse = 1; slot.pulseHit = true;
      slot.type = randomGroceryType(slot.type);         // restock the shelf
      if (mg.list.every(it => it.done)) this.genList(mg);  // list cleared → next list
      return true;
    }
    slot.pulse = 1; slot.pulseHit = false;
    mg.timeLeft = Math.max(0.1, mg.timeLeft - 1.2);      // a wrong pick costs a little time
    return false;
  },
};

// ⚓ Old Tom's shed — whack the rats as they pop out of the barrels
const jobRats = {
  id: 'rats', title: '⚓ Old Tom’s Shed', hint: 'Tap the rats as they pop out of the barrels! 🐾',
  icon: '🐀', verb: 'chased off', noun: ['rat', 'rats'], duration: 22,
  failText: 'Those rats stayed hidden this time…',
  doneLine: c => `Hah! Showed those vermin, didn’t ye? Here — ${c} ${c === 1 ? 'coin' : 'coins'}. And… thanks for the company, cat.`,
  failLine: 'Quick little devils, eh? Come back when yer ready.',
  start(mg) {
    mg.entities = [];
    const cols = [0.22, 0.5, 0.78], rows = [0.46, 0.74];
    rows.forEach(ry => cols.forEach(cx => mg.entities.push({ x: mg.w * cx, y: mg.h * ry, state: 'down', t: 0, up: 0, scale: 0, wob: Math.random() * 6 })));
    mg.popTimer = 0.6;
  },
  update(mg, dt) {
    mg.popTimer -= dt;
    if (mg.popTimer <= 0 && mg.timeLeft > 1.2) {
      const down = mg.entities.filter(e => e.state === 'down');
      if (down.length) { const r = down[Math.floor(Math.random() * down.length)]; r.state = 'up'; r.t = 0; r.up = 0.95 + Math.random() * 0.9; }
      const urgency = mg.timeLeft / mg.duration;        // pops come faster as time runs out
      mg.popTimer = (0.35 + Math.random() * 0.55) * (0.6 + urgency * 0.8);
    }
    mg.entities.forEach(e => {
      if (e.state === 'up') {
        e.scale = Math.min(1, e.scale + dt * 6); e.t += dt; e.wob += dt * 12;
        if (e.t >= e.up) e.state = 'ducking';
      } else if (e.state === 'ducking' || e.state === 'caught') {
        e.scale = Math.max(0, e.scale - dt * (e.state === 'caught' ? 8 : 5));
        if (e.scale <= 0) e.state = 'down';
      }
    });
  },
  draw(mg) {
    plankFloor(mg, '#5a4730');
    const ctx = mg.ctx;
    mg.entities.forEach(e => drawBarrel(ctx, e.x, e.y));     // barrels first
    mg.entities.forEach(e => {
      if (e.scale <= 0.01) return;
      const ratY = e.y - 6 - e.scale * 16;
      ctx.save();
      ctx.beginPath(); ctx.rect(e.x - 24, 0, 48, e.y - 2); ctx.clip();   // only show above the barrel mouth
      ctx.translate(e.x, ratY); ctx.scale(e.scale, e.scale);
      drawRat(ctx, Math.sin(e.wob)); ctx.restore();
      drawBarrelRim(ctx, e.x, e.y);
    });
  },
  tap(mg, cx, cy) {
    let best = -1, bestD = 1e9;
    mg.entities.forEach((e, i) => { if (e.state !== 'up') return; const d = Math.hypot(e.x - cx, (e.y - 18) - cy); if (d < bestD) { bestD = d; best = i; } });
    if (best >= 0 && bestD < 58) { mg.entities[best].state = 'caught'; mg.caught++; return true; }
    return false;
  },
};

// 🍞 Rosa's bakery — catch the fresh bakes tumbling off the rack before they land
const jobBakery = {
  id: 'bakery', title: '🍞 Rosa’s Bakery', hint: 'Catch the fresh bakes before they hit the floor! 🐾',
  icon: '🥐', verb: 'saved', noun: ['bake', 'bakes'], duration: 24, target: 5,
  failText: 'They all tumbled off the rack this time…',
  doneLine: c => `Grazie, little one! You saved my bakes — ${c} ${c === 1 ? 'coin' : 'coins'}, and a warm bun for the family. 🍞`,
  failLine: 'Ah, the floor got them! Come back soon, sì?',
  TYPES: ['croissant', 'loaf', 'cupcake', 'pretzel', 'pie'],
  start(mg) { mg.entities = []; mg.spawnTimer = 0; for (let i = 0; i < 3; i++) this.spawn(mg, -Math.random() * 220); },
  spawn(mg, y0) {
    mg.entities.push({
      x: 30 + Math.random() * (mg.w - 60), y: (y0 != null ? y0 : -20),
      vy: 32 + Math.random() * 26, vx: (Math.random() - 0.5) * 26,
      type: this.TYPES[Math.floor(Math.random() * this.TYPES.length)],
      rot: Math.random() * 6, rotV: (Math.random() - 0.5) * 3, caught: false, caughtT: 0, scale: 0,
    });
  },
  update(mg, dt) {
    mg.spawnTimer -= dt;
    const ramp = 1 + (1 - mg.timeLeft / mg.duration) * 0.7;   // the rack empties faster near the end
    const live = mg.entities.filter(e => !e.caught).length;
    if (mg.spawnTimer <= 0 && live < this.target + Math.floor((ramp - 1) * 3) && mg.timeLeft > 1.5) { this.spawn(mg, -20); mg.spawnTimer = (0.45 + Math.random() * 0.5) / ramp; }
    mg.entities.forEach(e => {
      if (e.caught) { e.caughtT += dt; e.scale = Math.max(0, 1 - e.caughtT * 4); e.y -= 30 * dt; return; }
      e.scale = Math.min(1, e.scale + dt * 5);
      e.vy += 28 * dt; e.y += e.vy * ramp * dt; e.x += e.vx * dt; e.rot += e.rotV * dt;
      if (e.x < 16) { e.x = 16; e.vx = Math.abs(e.vx); }
      if (e.x > mg.w - 16) { e.x = mg.w - 16; e.vx = -Math.abs(e.vx); }
    });
    mg.entities = mg.entities.filter(e => !(e.caught && e.scale <= 0) && e.y < mg.h + 40);
  },
  draw(mg) {
    bakeryFloor(mg);
    const ctx = mg.ctx;
    mg.entities.forEach(e => { ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rot); ctx.scale(e.scale, e.scale); drawBake(ctx, e.type); ctx.restore(); });
  },
  tap(mg, cx, cy) {
    let best = -1, bestD = 1e9;
    mg.entities.forEach((e, i) => { if (e.caught) return; const d = Math.hypot(e.x - cx, e.y - cy); if (d < bestD) { bestD = d; best = i; } });
    if (best >= 0 && bestD < 58) { mg.entities[best].caught = true; mg.caught++; return true; }
    return false;
  },
};

// 🩺 Dr. Amara's clinic — tap each animal to calm it before its nerves get the better of it
const jobVet = {
  id: 'vet', title: '🩺 Dr. Amara’s Clinic', hint: 'Tap each animal to calm it before it bolts! 🐾',
  icon: '🐾', verb: 'calmed', noun: ['patient', 'patients'], duration: 24,
  failText: 'The animals were too jumpy this time…',
  doneLine: c => `You’ve got the magic touch! ${c} ${c === 1 ? 'coin' : 'coins'}, and do come again. 🩺`,
  failLine: 'A real handful today! Thank you for trying, little one.',
  start(mg) {
    mg.entities = [];
    const cols = [0.22, 0.5, 0.78], rows = [0.46, 0.74];
    rows.forEach(ry => cols.forEach(cx => mg.entities.push({
      x: mg.w * cx, y: mg.h * ry, baseY: mg.h * ry, kind: Math.floor(Math.random() * 3),
      distress: Math.random() * 0.3, rate: 0.16 + Math.random() * 0.12, state: 'here', scale: 1, pulse: 0, wob: Math.random() * 6,
    })));
  },
  update(mg, dt) {
    const ramp = 1 + (1 - mg.timeLeft / mg.duration) * 0.8;   // gets harder over time
    mg.entities.forEach(e => {
      if (e.pulse > 0) e.pulse = Math.max(0, e.pulse - dt * 2);
      e.wob += dt * 4;
      if (e.state === 'here') {
        e.scale = Math.min(1, e.scale + dt * 4);
        e.distress += dt * e.rate * ramp;
        if (e.distress >= 1) e.state = 'bolting';
      } else {                                                 // bolting → leaves, then a fresh patient arrives
        e.scale = Math.max(0, e.scale - dt * 4); e.y -= dt * 45;
        if (e.scale <= 0) { e.state = 'here'; e.distress = 0; e.scale = 0; e.y = e.baseY; e.kind = Math.floor(Math.random() * 3); e.rate = 0.16 + Math.random() * 0.14; }
      }
    });
  },
  draw(mg) {
    vetFloor(mg);
    const ctx = mg.ctx;
    mg.entities.forEach(e => { if (e.scale > 0.01) drawPatient(ctx, e); });
  },
  tap(mg, cx, cy) {
    let best = -1, bestD = 1e9;
    mg.entities.forEach((e, i) => { if (e.state !== 'here' || e.scale < 0.3) return; const d = Math.hypot(e.x - cx, e.y - cy); if (d < bestD) { bestD = d; best = i; } });
    if (best >= 0 && bestD < 56) { const e = mg.entities[best]; e.distress = 0; e.pulse = 1; mg.caught++; return true; }
    return false;
  },
};

// 🌱 Mr. Bloom's garden — tap the snails crawling toward the veg patch
const jobGarden = {
  id: 'garden', title: '🌱 Mr. Bloom’s Garden', hint: 'Tap the snails before they reach the veggies! 🐾',
  icon: '🐌', verb: 'cleared', noun: ['snail', 'snails'], duration: 24, target: 6,
  failText: 'The snails won the day this time…',
  doneLine: c => `Marvellous! My lettuces thank you — ${c} ${c === 1 ? 'coin' : 'coins'} and some veg for the pot. 🥬`,
  failLine: 'Cheeky little molluscs! Give it another go soon.',
  start(mg) { mg.entities = []; mg.spawnTimer = 0; mg.vegX = mg.w / 2; mg.vegY = mg.h * 0.52; for (let i = 0; i < 3; i++) this.spawn(mg); },
  spawn(mg) {
    const side = Math.floor(Math.random() * 4); let x, y;
    if (side === 0) { x = -16; y = 30 + Math.random() * (mg.h - 30); }
    else if (side === 1) { x = mg.w + 16; y = 30 + Math.random() * (mg.h - 30); }
    else if (side === 2) { x = Math.random() * mg.w; y = 24; }
    else { x = Math.random() * mg.w; y = mg.h + 16; }
    mg.entities.push({ x, y, speed: 13 + Math.random() * 9, dir: 0, caught: false, caughtT: 0, scale: 0, wob: Math.random() * 6 });
  },
  update(mg, dt) {
    mg.spawnTimer -= dt;
    const ramp = 1 + (1 - mg.timeLeft / mg.duration) * 0.8;   // more snails, crawling faster, near the end
    const live = mg.entities.filter(e => !e.caught).length;
    if (mg.spawnTimer <= 0 && live < this.target + Math.floor((ramp - 1) * 2) && mg.timeLeft > 1.5) { this.spawn(mg); mg.spawnTimer = (0.6 + Math.random() * 0.6) / ramp; }
    mg.entities.forEach(e => {
      if (e.caught) { e.caughtT += dt; e.scale = Math.max(0, 1 - e.caughtT * 4); return; }
      e.scale = Math.min(1, e.scale + dt * 3); e.wob += dt * 6;
      const dx = mg.vegX - e.x, dy = mg.vegY - e.y, d = Math.hypot(dx, dy) || 1;
      e.dir = Math.atan2(dy, dx);
      if (d < 26) { e.reached = true; }              // nibbled the veg — slinks off, no coin
      else { e.x += dx / d * e.speed * ramp * dt; e.y += dy / d * e.speed * ramp * dt; }
    });
    mg.entities = mg.entities.filter(e => !(e.caught && e.scale <= 0) && !e.reached);
  },
  draw(mg) {
    gardenFloor(mg);
    const ctx = mg.ctx;
    drawVeg(ctx, mg.vegX, mg.vegY);
    mg.entities.forEach(e => { ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.scale, e.scale); drawSnail(ctx, e.dir, Math.sin(e.wob)); ctx.restore(); });
  },
  tap(mg, cx, cy) {
    let best = -1, bestD = 1e9;
    mg.entities.forEach((e, i) => { if (e.caught) return; const d = Math.hypot(e.x - cx, e.y - cy); if (d < bestD) { bestD = d; best = i; } });
    if (best >= 0 && bestD < 54) { mg.entities[best].caught = true; mg.caught++; return true; }
    return false;
  },
};

// ── Emoji minigame factory with several MODES so the map games aren't all the same ──
//   mode 'chase'  → targets skitter around & flee your paw (tap/swipe)
//   mode 'rise'   → targets float UP; pop them before they reach the top
//   mode 'fall'   → targets drift DOWN; catch them before they hit the floor
//   badChance     → some targets are "bad" (💣 / 💊): tapping one costs a point + time (avoid!)
function makeCatchJob(cfg) {
  return {
    id: cfg.id, title: cfg.title, hint: cfg.hint, icon: cfg.icon, emoji: cfg.emoji, badEmoji: cfg.badEmoji || '💣',
    verb: cfg.verb || 'caught', noun: cfg.noun, duration: cfg.duration || 22, target: cfg.target || 8,
    playLabel: cfg.playLabel || '🎮 Play a game', bg: cfg.bg || ['#2a3a4a', '#141d28'],
    mode: cfg.mode || 'chase', badChance: cfg.badChance || 0, swipe: cfg.swipe,
    speed: cfg.speed || 40, speedVar: cfg.speedVar || 32, rise: cfg.rise || 44, fall: cfg.fall || 34,
    failText: cfg.failText || 'They all got away this time…',
    doneLine: cfg.doneLine || (c => `Wonderful — thank you! Here’s ${c} ${c === 1 ? 'coin' : 'coins'}. 🪙`),
    failLine: cfg.failLine || 'Ah, tricky little things! Come try again soon.',
    start(mg) {
      mg.entities = []; mg.spawnTimer = 0;
      const n = this.mode === 'chase' ? this.target : Math.min(4, this.target);
      for (let i = 0; i < n; i++) this.spawn(mg, true);
    },
    spawn(mg, initial) {
      const bad = this.badChance > 0 && Math.random() < this.badChance;
      const gold = !bad && Math.random() < 0.08;          // rare golden target — worth bonus coins
      if (this.mode === 'rise') {
        mg.entities.push({ x: 34 + Math.random() * (mg.w - 68), y: mg.h + 24, vy: -(this.rise * (gold ? 1.4 : 1) + Math.random() * 26), sway: Math.random() * 6, caught: false, caughtT: 0, scale: 0, wob: Math.random() * 6, bad, gold });
      } else if (this.mode === 'fall') {
        mg.entities.push({ x: 34 + Math.random() * (mg.w - 68), y: -24, vy: this.fall * (gold ? 1.4 : 1) + Math.random() * 22, vx: (Math.random() - 0.5) * 26, caught: false, caughtT: 0, scale: 0, wob: Math.random() * 6, bad, gold });
      } else {
        const x = initial ? 40 + Math.random() * (mg.w - 80) : (Math.random() < 0.5 ? -20 : mg.w + 20);
        const y = 70 + Math.random() * (mg.h - 130);
        mg.entities.push({ x, y, dir: Math.random() * 6.283, speed: (this.speed + Math.random() * this.speedVar) * (gold ? 1.45 : 1), turnT: 0, caught: false, caughtT: 0, scale: 0, wob: Math.random() * 6, bad, gold });
      }
    },
    update(mg, dt) {
      mg.spawnTimer -= dt;
      const ramp = 1 + (1 - mg.timeLeft / this.duration) * 0.9;                       // faster & busier as the clock runs down
      const maxLive = (this.mode === 'chase' ? this.target : 5) + Math.floor((ramp - 1) * 3);
      const live = mg.entities.filter(e => !e.caught).length;
      if (mg.spawnTimer <= 0 && live < maxLive && mg.timeLeft > 1.5) { this.spawn(mg, false); mg.spawnTimer = (0.4 + Math.random() * 0.45) / ramp; }
      mg.entities.forEach(e => {
        if (e.caught) { e.caughtT += dt; e.scale = Math.max(0, 1 - e.caughtT * 4); return; }
        e.scale = Math.min(1, e.scale + dt * 4); e.wob += dt * 8;
        if (this.mode === 'rise') { e.y += e.vy * ramp * dt; e.sway += dt * 2.4; e.x += Math.sin(e.sway) * 0.8; }
        else if (this.mode === 'fall') { e.vy += 16 * dt; e.y += e.vy * ramp * dt; e.x += e.vx * dt + Math.sin(e.wob) * 0.4; }
        else {
          e.turnT -= dt; if (e.turnT <= 0) { e.dir += (Math.random() - 0.5) * 1.7; e.turnT = 0.25 + Math.random() * 0.7; }
          const pdx = e.x - mg.pointer.x, pdy = e.y - mg.pointer.y, pd = Math.hypot(pdx, pdy); let sp = e.speed * ramp;
          if (pd < 130) { e.dir = Math.atan2(pdy, pdx); sp = e.speed * ramp * 1.7; }   // darts away harder when cornered
          e.x += Math.cos(e.dir) * sp * dt; e.y += Math.sin(e.dir) * sp * dt;
          if (e.x < 16) { e.x = 16; e.dir = Math.PI - e.dir; } if (e.x > mg.w - 16) { e.x = mg.w - 16; e.dir = Math.PI - e.dir; }
          if (e.y < 46) { e.y = 46; e.dir = -e.dir; } if (e.y > mg.h - 22) { e.y = mg.h - 22; e.dir = -e.dir; }
        }
      });
      mg.entities = mg.entities.filter(e => {
        if (e.caught && e.scale <= 0) return false;
        if (this.mode === 'rise' && e.y < -34) return false;   // floated off the top
        if (this.mode === 'fall' && e.y > mg.h + 44) return false;   // hit the floor
        return true;
      });
    },
    draw(mg) {
      const ctx = mg.ctx, g = ctx.createLinearGradient(0, 0, 0, mg.h);
      g.addColorStop(0, this.bg[0]); g.addColorStop(1, this.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, mg.w, mg.h);
      if (this.mode === 'fall') { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, mg.h - 10, mg.w, 10); }   // the floor
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      mg.entities.forEach(e => {
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.sin(e.wob) * 0.28); ctx.scale(e.scale, e.scale);
        if (e.gold) { ctx.strokeStyle = '#ffe06a'; ctx.lineWidth = 4; ctx.shadowColor = '#ffd24a'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(0, 0, 27, 0, 7); ctx.stroke(); ctx.shadowBlur = 0; ctx.font = '18px Georgia'; ctx.fillText('✨', 15, -17); }
        ctx.font = '42px Georgia'; ctx.fillText(e.bad ? this.badEmoji : this.emoji, 0, 0); ctx.restore();   // big finger targets
      });
    },
    tap(mg, cx, cy) {
      let best = -1, bestD = 1e9;
      mg.entities.forEach((e, i) => { if (e.caught) return; const d = Math.hypot(e.x - cx, e.y - cy); if (d < bestD) { bestD = d; best = i; } });
      if (best < 0 || bestD >= 58) return false;   // slightly tighter aim than before
      const e = mg.entities[best];
      if (e.bad) { e.caught = true; e.caughtT = 0; mg.caught = Math.max(0, mg.caught - 1); mg.timeLeft = Math.max(0.1, mg.timeLeft - 1.5); return false; }   // oops, a bomb
      e.caught = true; e.caughtT = 0; mg.caught++;
      if (e.gold) mg.bonus = (mg.bonus || 0) + 2;   // golden target → +2 bonus coins
      return true;
    },
  };
}
// Each map game plays DIFFERENTLY now:
const jobButterfly = makeCatchJob({ id: 'butterfly', title: '🦋 Butterfly Meadow', hint: 'Chase & catch the fluttering butterflies!', icon: '🦋', emoji: '🦋', noun: ['butterfly', 'butterflies'], target: 8, mode: 'chase', speed: 44, speedVar: 30, playLabel: '🦋 Chase butterflies', bg: ['#3a6a4a', '#1a3a24'], failText: 'The butterflies all drifted away…' });
const jobBubbles = makeCatchJob({ id: 'bubbles', title: '🫧 Bubble Pop', hint: 'Pop the bubbles before they float off the top!', icon: '🫧', emoji: '🫧', verb: 'popped', noun: ['bubble', 'bubbles'], target: 11, mode: 'rise', rise: 46, playLabel: '🫧 Pop bubbles', bg: ['#3a5a7a', '#16303f'], failText: 'They all floated away…' });
const jobBalloons = makeCatchJob({ id: 'balloons', title: '🎈 Balloon Pop', hint: 'Pop the balloons — but DON’T tap the bombs! 💣', icon: '🎈', emoji: '🎈', badEmoji: '💣', verb: 'popped', noun: ['balloon', 'balloons'], target: 10, mode: 'rise', rise: 40, badChance: 0.22, swipe: false, playLabel: '🎈 Pop balloons (mind the bombs!)', bg: ['#4a3a6a', '#221a3a'], failText: 'They floated too high to reach…' });
const jobLeaves = makeCatchJob({ id: 'leaves', title: '🍂 Falling Leaves', hint: 'Catch the leaves before they hit the ground!', icon: '🍂', emoji: '🍂', noun: ['leaf', 'leaves'], target: 10, mode: 'fall', fall: 32, playLabel: '🍂 Catch the leaves', bg: ['#6a5a3a', '#2a2214'], failText: 'The leaves all settled on the ground…' });
const jobYarn = makeCatchJob({ id: 'yarn', title: '🧶 Yarn Tangle', hint: 'Chase the fast rolling yarn balls!', icon: '🧶', emoji: '🧶', noun: ['yarn ball', 'yarn balls'], target: 8, mode: 'chase', speed: 52, speedVar: 34, playLabel: '🧶 Chase the yarn', bg: ['#7a4a5a', '#331a24'], failText: 'The yarn all rolled under the beds…' });
const jobPlanes = makeCatchJob({ id: 'planes', title: '✈️ Paper Planes', hint: 'Snatch the paper planes as they glide down!', icon: '✈️', emoji: '✈️', verb: 'snatched', noun: ['paper plane', 'paper planes'], target: 10, mode: 'fall', fall: 40, playLabel: '✈️ Catch paper planes', bg: ['#5a6a7a', '#242c34'], failText: 'They all glided out of reach…' });
const jobGerms = makeCatchJob({ id: 'germs', title: '🦠 Germ Patrol', hint: 'Zap the germs — but leave the 💊 medicine alone!', icon: '🦠', emoji: '🦠', badEmoji: '💊', verb: 'zapped', noun: ['germ', 'germs'], target: 12, mode: 'chase', speed: 56, speedVar: 40, badChance: 0.16, swipe: false, playLabel: '🦠 Zap the germs', bg: ['#3a6a6a', '#153030'], failText: 'The germs scattered away…' });

const JOBS = { mice: jobMice, grocery: jobGrocery, rats: jobRats, bakery: jobBakery, vet: jobVet, garden: jobGarden,
  butterfly: jobButterfly, bubbles: jobBubbles, balloons: jobBalloons, leaves: jobLeaves, yarn: jobYarn, planes: jobPlanes, germs: jobGerms };

// ── Shared canvas art ────────────────────────────────────────────────────────
function plankFloor(mg, base) {
  const { ctx, w, h } = mg;
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.10)';       for (let y = 0; y < h; y += 46) ctx.fillRect(0, y, w, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.03)'; for (let y = 23; y < h; y += 46) ctx.fillRect(0, y, w, 1);
}
function shopFloor(mg) {
  const { ctx, w, h } = mg;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#caa66a'); g.addColorStop(1, '#8a6a44');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(60,40,20,0.45)';
  [0.32, 0.6, 0.85].forEach(fy => ctx.fillRect(0, h * fy, w, 6));
}
function bakeryFloor(mg) {
  const { ctx, w, h } = mg;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#caa36a'); g.addColorStop(1, '#7a5436');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(60,30,12,0.5)'; ctx.fillRect(0, 0, w, 28);     // oven mouth
  ctx.fillStyle = 'rgba(255,150,60,0.22)'; ctx.fillRect(0, 22, w, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; for (let y = 42; y < h; y += 44) ctx.fillRect(0, y, w, 2);
}
function vetFloor(mg) {
  const { ctx, w, h } = mg;
  ctx.fillStyle = '#dfe6e6'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(120,140,140,0.22)'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 30; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(90,140,150,0.15)'; ctx.fillRect(0, 0, w, 20);
}
function gardenFloor(mg) {
  const { ctx, w, h } = mg;
  ctx.fillStyle = '#6a4a2c'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';       for (let y = 30; y < h; y += 26) ctx.fillRect(0, y, w, 3);
  ctx.fillStyle = 'rgba(120,90,50,0.45)';   for (let y = 42; y < h; y += 26) ctx.fillRect(0, y, w, 2);
}

function drawBake(ctx, type) {
  if (type === 'croissant') {
    ctx.fillStyle = '#d99a3a';
    ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI * 0.15, Math.PI * 0.85); ctx.arc(0, 7, 13, Math.PI * 0.85, Math.PI * 0.15, true); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,70,20,0.4)'; ctx.lineWidth = 1; ctx.stroke();
  } else if (type === 'loaf') {
    ctx.fillStyle = '#b9793c'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9a5f2c'; ctx.beginPath(); ctx.ellipse(0, -1, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(70,40,15,0.5)'; ctx.lineWidth = 1.3; [-5, 0, 5].forEach(sx => { ctx.beginPath(); ctx.moveTo(sx - 2, -4); ctx.lineTo(sx + 2, 3); ctx.stroke(); });
  } else if (type === 'cupcake') {
    ctx.fillStyle = '#c98a4a'; ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(8, 2); ctx.lineTo(6, 11); ctx.lineTo(-6, 11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f0a8c0'; ctx.beginPath(); ctx.arc(0, 1, 9, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(0, -7, 2.2, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'pretzel') {
    ctx.strokeStyle = '#9a5f2c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(-4, 0, 6, Math.PI * 0.2, Math.PI * 1.7); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, 0, 6, -Math.PI * 0.7, Math.PI * 0.8); ctx.stroke();
    ctx.fillStyle = 'rgba(240,235,215,0.6)'; ctx.beginPath(); ctx.arc(-4, -3, 0.9, 0, Math.PI * 2); ctx.arc(4, -3, 0.9, 0, Math.PI * 2); ctx.fill();
  } else { // pie
    ctx.fillStyle = '#d9b06a'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.clip();
    ctx.strokeStyle = 'rgba(150,90,40,0.6)'; ctx.lineWidth = 1.6;
    [-6, 0, 6].forEach(o => { ctx.beginPath(); ctx.moveTo(o, -12); ctx.lineTo(o, 12); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-12, o); ctx.lineTo(12, o); ctx.stroke(); });
    ctx.restore();
    ctx.strokeStyle = '#b97a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawPatient(ctx, e) {
  const d = Math.min(1, e.distress);
  ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.scale, e.scale);
  ctx.fillStyle = '#a9762f'; ctx.beginPath(); ctx.ellipse(0, 14, 20, 9, 0, 0, Math.PI * 2); ctx.fill();       // basket
  ctx.fillStyle = '#8a5f24'; ctx.beginPath(); ctx.ellipse(0, 14, 20, 9, 0, Math.PI, 0, true); ctx.fill();
  const r = Math.round(150 + d * 90), g = Math.round(150 - d * 70), b = Math.round(140 - d * 70);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath();
  if (e.kind === 0) { ctx.moveTo(-12, -6); ctx.lineTo(-15, -19); ctx.lineTo(-5, -9); ctx.moveTo(12, -6); ctx.lineTo(15, -19); ctx.lineTo(5, -9); ctx.fill(); }   // cat ears
  else if (e.kind === 1) { ctx.ellipse(-12, -1, 4, 9, 0.4, 0, Math.PI * 2); ctx.ellipse(12, -1, 4, 9, -0.4, 0, Math.PI * 2); ctx.fill(); }                        // dog ears
  ctx.beginPath(); ctx.ellipse(0, 4, 14, 12, 0, 0, Math.PI * 2); ctx.fill();                                  // body
  if (e.kind === 2) { ctx.beginPath(); ctx.moveTo(-3, 4); ctx.lineTo(-12, 6); ctx.lineTo(-3, 9); ctx.fill(); }  // bird beak hint
  ctx.fillStyle = '#15151a';
  ctx.beginPath(); ctx.arc(-4.5, 2, 1.7 + d, 0, Math.PI * 2); ctx.arc(4.5, 2, 1.7 + d, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = d > 0.66 ? '#e0503a' : d > 0.33 ? '#e0a83a' : '#5ac06a';                                  // distress ring
  ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 2, 19, -Math.PI / 2, -Math.PI / 2 + d * Math.PI * 2); ctx.stroke();
  if (e.pulse > 0) { ctx.globalAlpha = e.pulse; ctx.font = '16px Georgia'; ctx.textAlign = 'center'; ctx.fillText('💚', 0, -20); ctx.globalAlpha = 1; }
  ctx.restore();
}

function drawVeg(ctx, x, y) {
  ctx.save(); ctx.translate(x, y);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2, vx = Math.cos(a) * 12, vy = Math.sin(a) * 8;
    ctx.fillStyle = '#3a8a3a'; ctx.beginPath(); ctx.arc(vx, vy, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5aa84a'; ctx.beginPath(); ctx.arc(vx, vy, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#3a8a3a'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7ac85a'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawSnail(ctx, dir, wob) {
  ctx.rotate(dir);
  ctx.fillStyle = '#c8a878';
  ctx.beginPath(); ctx.ellipse(2, 4, 12, 5, 0, 0, Math.PI * 2); ctx.fill();                  // foot
  ctx.beginPath(); ctx.ellipse(12, 1, 5, 4, 0, 0, Math.PI * 2); ctx.fill();                  // head
  ctx.strokeStyle = '#c8a878'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(14, -1); ctx.lineTo(17, -6 + wob); ctx.moveTo(15, 0); ctx.lineTo(18, -4 - wob); ctx.stroke();
  ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(17, -6 + wob, 1, 0, Math.PI * 2); ctx.arc(18, -4 - wob, 1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b06a3a'; ctx.beginPath(); ctx.arc(-2, -2, 9, 0, Math.PI * 2); ctx.fill();  // shell
  ctx.strokeStyle = '#7a4a26'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-2, -2, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(-2, -2, 3, 0, Math.PI * 2); ctx.stroke();
}

function drawMouse(ctx, wob) {
  ctx.strokeStyle = '#c8a89a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.quadraticCurveTo(wob * 5, 20, wob * 3, 27); ctx.stroke();
  ctx.fillStyle = '#7a756c';
  ctx.beginPath(); ctx.ellipse(0, 2, 9, 13, 0, 0, Math.PI * 2); ctx.fill();   // body
  ctx.beginPath(); ctx.ellipse(0, -11, 7, 7, 0, 0, Math.PI * 2); ctx.fill();  // head
  ctx.fillStyle = '#9a948a';
  ctx.beginPath(); ctx.arc(-5, -15, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(5, -15, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(-2.5, -12, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(2.5, -12, 1.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e0788a'; ctx.beginPath(); ctx.arc(0, -17, 1.6, 0, Math.PI * 2); ctx.fill();
}

function drawGrocery(ctx, type) {
  if (type === 'apple') {
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(0, 1, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-1, -10, 2, 5);
    ctx.fillStyle = '#3a8a34'; ctx.beginPath(); ctx.ellipse(4, -8, 4, 2.4, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(-3, -2, 2.4, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'orange') {
    ctx.fillStyle = '#e0852c'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    [[-3, -2], [3, -1], [0, 3], [-4, 3]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx, dy, 0.9, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#3a8a34'; ctx.beginPath(); ctx.ellipse(2, -8, 3, 2, 0.5, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'can') {
    ctx.fillStyle = '#c0c4cc'; ctx.fillRect(-7, -11, 14, 22);
    ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(0, -11, 7, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c85858'; ctx.fillRect(-7, -4, 14, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(-5, -11, 2, 22);
  } else if (type === 'bread') {
    ctx.fillStyle = '#d8a85a'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b07a3a'; ctx.beginPath(); ctx.ellipse(0, -2, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,20,0.5)'; ctx.lineWidth = 1.4;
    [-5, 0, 5].forEach(sx => { ctx.beginPath(); ctx.moveTo(sx - 2, -4); ctx.lineTo(sx + 2, 3); ctx.stroke(); });
  } else if (type === 'milk') {
    ctx.fillStyle = '#eef1f4'; ctx.fillRect(-7, -7, 14, 18);
    ctx.fillStyle = '#dfe4ea'; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(0, -14); ctx.lineTo(7, -7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a86c8'; ctx.fillRect(-7, -1, 14, 5);
    ctx.fillStyle = '#c8d8ee'; ctx.fillRect(-3, -13, 6, 4);
  } else if (type === 'cheese') {
    ctx.fillStyle = '#f0c850'; ctx.beginPath(); ctx.moveTo(-10, 6); ctx.lineTo(10, 6); ctx.lineTo(8, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e3b32c'; ctx.fillRect(-10, 6, 20, 2.4);
    ctx.fillStyle = '#d9a82c'; [[-3, 2], [3, 1], [0, 4]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(dx, dy, 1.3, 0, Math.PI * 2); ctx.fill(); });
  } else if (type === 'carrot') {
    ctx.fillStyle = '#3a8a34'; [-3, 0, 3].forEach(lx => { ctx.beginPath(); ctx.moveTo(lx, -10); ctx.lineTo(lx - 2, -4); ctx.lineTo(lx + 2, -4); ctx.closePath(); ctx.fill(); });
    ctx.fillStyle = '#e07a2c'; ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(5, -4); ctx.lineTo(0, 11); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,60,20,0.4)'; ctx.lineWidth = 1; [1, 4].forEach(ly => { ctx.beginPath(); ctx.moveTo(-4 + ly * 0.3, ly); ctx.lineTo(4 - ly * 0.3, ly); ctx.stroke(); });
  } else { // fish
    ctx.fillStyle = '#9ab0c0'; ctx.beginPath(); ctx.ellipse(-1, 0, 10, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(13, -5); ctx.lineTo(13, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(-3, -1, 5, 2.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#15151a'; ctx.beginPath(); ctx.arc(-6, -1, 1.2, 0, Math.PI * 2); ctx.fill();
  }
}

function roundRectFill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath(); ctx.fill();
}

// The shopping-list banner across the top of Mrs. Chen's game
function drawList(mg) {
  const { ctx, w } = mg;
  ctx.fillStyle = 'rgba(20,12,5,0.84)'; ctx.fillRect(0, 0, w, 60);
  ctx.fillStyle = '#f0d080'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'left';
  ctx.fillText('🛒 Chen’s list', 10, 20);
  const list = mg.list || [], n = list.length;
  const chipW = 74, gap = 8, total = n * chipW + (n - 1) * gap;
  let sx = Math.max(6, (w - total) / 2);
  list.forEach(item => {
    ctx.fillStyle = item.done ? 'rgba(90,150,80,0.55)' : 'rgba(0,0,0,0.34)';
    roundRectFill(ctx, sx, 28, chipW, 28, 6);
    ctx.save(); ctx.translate(sx + 15, 42); ctx.scale(0.6, 0.6); drawGrocery(ctx, item.type); ctx.restore();
    ctx.fillStyle = item.done ? '#bfeac0' : '#f0e8d0'; ctx.font = '10px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(GROCERY[item.type].name, sx + 28, 46);
    if (item.done) { ctx.fillStyle = '#9cff7a'; ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'right'; ctx.fillText('✓', sx + chipW - 7, 47); }
    sx += chipW + gap;
  });
}

function drawRat(ctx, wob) {
  ctx.fillStyle = '#6a655c'; ctx.beginPath(); ctx.ellipse(0, 6, 10, 12, 0, 0, Math.PI * 2); ctx.fill();   // body
  ctx.fillStyle = '#736d63'; ctx.beginPath(); ctx.arc(0, -6, 8, 0, Math.PI * 2); ctx.fill();               // head
  ctx.fillStyle = '#8a8276'; ctx.beginPath(); ctx.arc(-6, -12, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(6, -12, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b89a9a'; ctx.beginPath(); ctx.arc(-6, -12, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(6, -12, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#15151a'; ctx.beginPath(); ctx.arc(-3, -7, 1.6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(3, -7, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e0788a'; ctx.beginPath(); ctx.arc(0, -2, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -2); ctx.lineTo(-12, -4 + wob); ctx.moveTo(-2, -1); ctx.lineTo(-12, 1 + wob);
  ctx.moveTo(2, -2); ctx.lineTo(12, -4 - wob); ctx.moveTo(2, -1); ctx.lineTo(12, 1 - wob); ctx.stroke();
}

function drawBarrel(ctx, x, y) {
  ctx.fillStyle = '#6a4a2c'; ctx.fillRect(x - 17, y - 4, 34, 30);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
  [-9, 0, 9].forEach(sx => { ctx.beginPath(); ctx.moveTo(x + sx, y - 2); ctx.lineTo(x + sx, y + 24); ctx.stroke(); });
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3;
  [6, 18].forEach(by => { ctx.beginPath(); ctx.moveTo(x - 17, y + by); ctx.lineTo(x + 17, y + by); ctx.stroke(); });
  ctx.fillStyle = '#1c130b'; ctx.beginPath(); ctx.ellipse(x, y - 4, 17, 7, 0, 0, Math.PI * 2); ctx.fill();   // mouth
}
function drawBarrelRim(ctx, x, y) {
  ctx.strokeStyle = '#7a5630'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - 4, 17, 7, 0, 0, Math.PI * 2); ctx.stroke();
}

// ── The minigame engine: timer, input, and frame loop shared by every job ─────
function startMinigame(npc) {
  if (mg.active) return;
  mg.npc = npc;
  mg.job = JOBS[npc.job] || JOBS.mice;
  // lock the job while you work it
  npc.hasJob = false;
  npc.bubble.material.color.setHex(0x888888);
  npc.bubble.material.emissive.setHex(0x000000);

  mg.active = true; mg.caught = 0; mg.earned = 0; mg.pressing = false;
  mg.combo = 0; mg.bonus = 0; mg.lastCatch = 0;   // streak scoring
  mg.duration = mg.job.duration || 22;
  mg.timeLeft = mg.duration; mg.entities = []; mg.pops = []; mg.spawnTimer = 0;
  document.getElementById('mg-title').textContent = mg.job.title;
  document.getElementById('mg-hint').textContent = mg.job.hint + (mg.job.swipe === false ? '' : '   ·   tap or swipe! 👆');
  document.getElementById('mg-score').textContent = '0';
  document.getElementById('mg-time').textContent = Math.ceil(mg.duration);
  document.getElementById('mg-bar').style.width = '100%';
  document.getElementById('mg-result').classList.remove('show');
  document.getElementById('minigame').classList.add('show');

  if (!mg.bound) {
    mg.canvas = document.getElementById('mg-canvas');
    mg.ctx = mg.canvas.getContext('2d');
    const rel = (clientX, clientY) => { const r = mg.canvas.getBoundingClientRect(); return { x: clientX - r.left, y: clientY - r.top }; };
    // Mouse (desktop): press to tap, drag to swipe your paw through targets
    mg.canvas.addEventListener('mousedown', e => { const p = rel(e.clientX, e.clientY); mg.pressing = true; mg.pointer.x = p.x; mg.pointer.y = p.y; mgPoint(p.x, p.y, true); });
    mg.canvas.addEventListener('mousemove', e => { const p = rel(e.clientX, e.clientY); mg.pointer.x = p.x; mg.pointer.y = p.y; if (mg.pressing) mgPoint(p.x, p.y, false); });
    window.addEventListener('mouseup', () => { mg.pressing = false; });
    // Touch (mobile): TAP or SWIPE — drag a finger across the targets to bat at them
    mg.canvas.addEventListener('touchstart', e => {
      e.preventDefault(); mg.pressing = true;
      for (const tch of e.changedTouches) { const p = rel(tch.clientX, tch.clientY); mg.pointer.x = p.x; mg.pointer.y = p.y; mgPoint(p.x, p.y, true); }
    }, { passive: false });
    mg.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const tch of e.changedTouches) { const p = rel(tch.clientX, tch.clientY); mg.pointer.x = p.x; mg.pointer.y = p.y; mgPoint(p.x, p.y, false); }
    }, { passive: false });
    const endTouch = e => { if (e.cancelable) e.preventDefault(); mg.pressing = false; mg.pointer.x = mg.pointer.y = -9999; };   // finger up → targets relax
    mg.canvas.addEventListener('touchend', endTouch, { passive: false });
    mg.canvas.addEventListener('touchcancel', endTouch, { passive: false });
    window.addEventListener('resize', () => { if (mg.active) mgResize(); });
    mg.bound = true;
  }
  mgResize();
  mg.job.start(mg);
  mg.pointer.x = mg.pointer.y = -999;
  mg.last = performance.now();
  mg.raf = requestAnimationFrame(mgLoop);
}

// A tap OR a swipe point. isTap = a fresh press (shows a miss ring); swipe moves only catch.
function mgPoint(cx, cy, isTap) {
  if (!mg.active) return;
  if (!isTap && mg.job.swipe === false) return;   // tap-only games (e.g. the grocery grid) ignore swipes
  const hit = mg.job.tap(mg, cx, cy, isTap);
  if (hit) {
    const now = performance.now();
    mg.combo = (now - (mg.lastCatch || 0) < 1200) ? (mg.combo || 0) + 1 : 1;   // quick catches build a streak (tighter window)
    mg.lastCatch = now;
    if (mg.combo >= 3) mg.bonus = (mg.bonus || 0) + (mg.combo >= 10 ? 3 : mg.combo >= 6 ? 2 : 1);   // longer streak → more bonus coins
    mg.pops.push({ x: cx, y: cy, t: 0, hit: true, combo: mg.combo });
    document.getElementById('mg-score').textContent = mg.caught;
    if (typeof sfx === 'function') sfx(mg.combo >= 3 ? 'coin' : 'catch');
  } else if (isTap) {
    mg.combo = 0;                                                               // a miss (or a bomb) breaks the streak
    mg.pops.push({ x: cx, y: cy, t: 0, hit: false });
    document.getElementById('mg-score').textContent = mg.caught;               // reflect any bomb penalty
  }
}

function mgLoop(now) {
  if (!mg.active) return;
  mg.raf = requestAnimationFrame(mgLoop);
  let dt = (now - mg.last) / 1000; if (dt > 0.05) dt = 0.05; mg.last = now;

  mg.timeLeft -= dt;
  if (mg.timeLeft <= 0) { mg.timeLeft = 0; endMinigame(); }
  document.getElementById('mg-time').textContent = Math.ceil(mg.timeLeft);
  document.getElementById('mg-bar').style.width = (mg.timeLeft / mg.duration * 100) + '%';

  mg.job.update(mg, dt);

  mg.pops.forEach(p => p.t += dt);
  mg.pops = mg.pops.filter(p => p.t < 0.4);

  mg.job.draw(mg);
  mgDrawPops();
  // live combo streak counter (top-centre) — grows & reddens as the streak climbs
  if (mg.combo >= 2 && performance.now() - (mg.lastCatch || 0) < 1200) {
    const ctx = mg.ctx, s = Math.min(1, (performance.now() - mg.lastCatch) / 1200);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = 'bold ' + (24 + Math.min(mg.combo, 12)) + 'px Georgia';
    ctx.fillStyle = `rgba(255,${Math.max(90, 200 - mg.combo * 12)},70,${0.95 - s * 0.5})`;
    ctx.fillText('🔥 Combo x' + mg.combo, mg.w / 2, 8);
    ctx.restore();
  }
}

function mgDrawPops() {
  const { ctx } = mg;
  mg.pops.forEach(p => {
    const r = 10 + p.t * 70, a = 1 - p.t / 0.4;
    ctx.strokeStyle = p.hit ? `rgba(240,208,128,${a})` : `rgba(255,255,255,${a * 0.6})`;
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
    if (p.hit) {
      ctx.textAlign = 'center';
      ctx.font = '20px Georgia'; ctx.fillStyle = `rgba(240,208,128,${a})`; ctx.fillText('🪙', p.x, p.y - r - 4);
      if (p.combo >= 2) { ctx.font = 'bold 22px Georgia'; ctx.fillStyle = `rgba(255,150,90,${a})`; ctx.fillText('x' + p.combo + '!', p.x, p.y - r - 26); }
    }
  });
}

function endMinigame() {
  if (!mg.active) return;
  mg.active = false;
  if (mg.raf) cancelAnimationFrame(mg.raf);
  mg.earned = mg.caught + (mg.bonus || 0); // 1 coin per catch + streak & golden bonuses
  const j = mg.job, c = mg.caught, score = mg.earned;
  document.getElementById('mg-res-emoji').textContent = score >= 15 ? '🏆' : c > 0 ? j.icon : '😿';
  document.getElementById('mg-res-title').textContent = score >= 15 ? 'Purrfect!' : score >= 9 ? 'Great job!' : c > 0 ? 'Job done!' : 'So close…';
  let txt = c === 0 ? j.failText : `You ${j.verb} ${c} ${c === 1 ? j.noun[0] : j.noun[1]}!`;
  if (mg.bonus > 0) txt += `  🔥 +${mg.bonus} streak bonus!`;
  document.getElementById('mg-res-text').textContent = txt;
  document.getElementById('mg-res-coins').textContent = `+${mg.earned} 🪙`;
  document.getElementById('mg-result').classList.add('show');
}

function closeMinigame() {
  document.getElementById('minigame').classList.remove('show');
  const coins = mg.earned || 0, npc = mg.npc, job = mg.job;
  if (coins > 0) {
    state.coins += coins;
    state.earned += coins;
    sfx('coin');
    document.getElementById('coin-count').textContent = state.coins;
    updateFamilyStatus();
    showNotif(`+${coins} 🪙  (${state.coins} total)`);
    if (typeof addGoodwill === 'function') addGoodwill(2, 'Honest work');   // earning honestly helps win the Millers back
  }
  if (npc) {
    showDialogue(npc.name, coins > 0 ? job.doneLine(coins) : job.failLine, 4200);
    setTimeout(() => {   // the job returns after a cooldown
      npc.hasJob = true;
      npc.bubble.material.color.setHex(0xf0d080);
      npc.bubble.material.emissive.setHex(0x806000);
    }, 12000);
  }
  // Once the deadline is running, every job worked is another winter day gone
  // (the rent is only *paid* by giving money to the family — see giveCoins)
  if (state.rentActive) {
    state.daysLeft = Math.max(0, state.daysLeft - 1);
    updateRentHUD();
    if (state.houseFund >= RENT.goal) winDeadline();
    else if (state.daysLeft <= 0) failDeadline();
  }
  mg.npc = null; mg.earned = 0;
}


function startGame() {
  unlockVoice();
  initAudio();
  document.getElementById('intro').style.display = 'none';
  state.gameStarted = true;
  saveGame();   // create the initial save for this new game
  setTimeout(() => {
    showDialogue(state.catName + ' 🐱', 'Mrrrow... This family chose me. Now I\'ll help them. Time to get to work!', 4000);
  }, 800);
  setTimeout(() => {
    showDialogue('💡 Hint', 'Find a neighbour with a glowing ✨ orb and press ⚡ Act — each one has a different odd job that pays coins!', 5000);
  }, 5500);
}
