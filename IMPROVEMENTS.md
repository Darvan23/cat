# 🔧 Paws & Pennies — Improvement Roadmap

How to make everything we've built so far **deeper, prettier, and more alive**. Grouped by system, and tagged by effort: 🟢 quick win · 🟡 medium · 🔴 big.

> This is a living design doc — pick items off it the same way we work from `mynotes.md`.

---

## 1. Feel & polish (cheap wins that lift the whole game)

- 🟢 **Soft shadows & a warmer sky.** Bump shadow map size, add a subtle sky gradient / fog for depth so the town reads less "flat white."
- 🟢 **Screen-shake & squash-stretch.** Tiny cat squash on landing a jump, a nudge of screen-shake when a dog barks or a goal is scored.
- 🟢 **Better notifications.** Queue notifs (right now a fast one can overwrite another), add small icons and a gentle slide-in.
- 🟢 **Footstep / ambient audio.** Soft paw taps while walking, birdsong by day, crickets at night, a bell when a shop sale rings.
- 🟡 **A proper coin-collect burst.** Coins should arc toward the HUD counter with a sparkle, not just increment.
- 🟡 **Weather + seasons.** Occasional rain (NPCs pull out umbrellas / head indoors), a snow day, autumn leaves. Ties into the day/night system already there.
- 🟡 **Camera framing.** A gentle "look-at" ease when you enter a building or start a minigame, so transitions feel intentional.

## 2. The cat (you)

- 🟢 **More idle charm.** Occasional tail-swish, ear-twitch, blink, sit-and-groom when standing still a while.
- 🟢 **Emote button.** Meow / purr / happy-hop that NPCs react to.
- 🟡 **Cat needs feed back into behaviour.** When energy is very low, the cat visibly droops and walks slower (some of this exists — make it readable).
- 🟡 **Unlockable coats/patterns** earned by milestones (first job, first rescue, presidency) — hooks into the existing 🎨 customiser.

## 3. The Millers & home life

- 🟢 **Tap-a-Miller everywhere.** The talk bubbles work outside — extend them to the Millers at home (downstairs/upstairs) using their current `millerPlan` activity ("Just watching telly", "Doing homework").
- 🟡 **Per-property interiors.** Right now all bought homes share ONE interior + decor; make each bought home fully independent (its own furniture layout & decor, per property id) — mirror the per-business decor pattern already in `house.js`.
- 🟡 **Relationship/mood for the family.** A simple happiness meter for the Millers that rises as you furnish, feed, and house them — drives their dialogue and animations.
- 🟡 **Kids grow / seasons of life.** Long-term: the kids get taller, Dad's shop expands — visible progress for a long save.
- 🔴 **Family routines out in town.** Mum actually shops at your market, Dad greets customers — tie the family schedule to the businesses/civic buildings.

## 4. Jobs & minigames

- 🟢 **Minigame variety pass.** The mice/rats/grocery loops are solid; add small twists (timed combos, a "golden mouse," a rush-hour grocery round).
- 🟡 **Job board.** A place (Town Hall / your phone) that lists available jobs & rewards, so the player always knows what to do next.
- 🟡 **Skill/level per job.** Do a job repeatedly → faster/bigger rewards, a little "Lv.2 Mouser" flair.
- 🔴 **New minigames for the new buildings.** Hospital: sort supplies. School: help a kid with homework. Café: make a coffee order. Each ties a building to gameplay, not just décor.

## 5. Economy, businesses & employment

- 🟢 **Show the daily tick.** A tiny end-of-day summary card: income, wages, tax, net — so the numbers feel earned.
- 🟢 **Per-sale income (optional).** Right now cashier transactions are visual only; let staffed shops earn a trickle per visible sale on top of daily income (careful with balance).
- 🟡 **Supply & demand.** Too many of one business type → each earns less; variety pays. Makes town-planning a real decision.
- 🟡 **Worker happiness / wages.** Underpay and workers quit; a wage slider per business.
- 🟡 **Business upgrades.** Spend to upgrade a shop (bigger, nicer, higher income) instead of only buying new ones.
- 🔴 **A real market UI.** Prices, trends, a little graph in the 📊 dashboard.

## 6. Presidency & governance

- 🟢 **Approval history graph** in the 🗳️ panel (last N days) so you can see your trend.
- 🟢 **More mail variety** + consequences that show in the world (ignore "clean streets" → more litter).
- 🟡 **Policies with trade-offs.** e.g. "raise taxes" → more treasury, less happiness; toggles rather than one-shot spends.
- 🟡 **Re-election events.** Periodic votes; rivals campaign; you must keep approval up or face a challenger.
- 🔴 **Districts.** Different parts of town have their own happiness; neglect one and it protests. Town-planning + governance combined.

## 7. Town planner

- 🟢 **Overlap warning.** Optional red ghost when a piece would overlap a building (you asked to keep free placement — make it a toggle).
- 🟢 **Grid snap toggle** for tidy layouts (roads already snap; extend to fences/benches).
- 🟡 **More pieces.** Flowerbeds, statues, streetlamp variants, a clock tower, market stalls, playground.
- 🟡 **Undo/redo stack** (undo exists; add redo + multi-undo).
- 🔴 **Zoning / auto-build.** Paint a "residential zone" and houses fill in over time (SimCity-style).

## 8. NPC life (already rich — go further)

- 🟢 **Reactions to you.** NPCs wave when you're beloved, mutter when you're shady/corrupt (some greet/snub exists — expand it).
- 🟢 **Kids chase / play tag** in the park; dogs (friendly ones) get walked.
- 🟡 **Daily rhythm for townsfolk.** Commuters actually go to *your* businesses to shop, then home — not just wander.
- 🟡 **Named regulars.** A few townsfolk with names & tiny stories you can talk to (like the Millers).
- 🔴 **Festivals/events.** A market day, a fair at the park, fireworks on a holiday — the whole town gathers.

## 9. Structure / tech health

- 🟢 **Split `game.js`.** It's the biggest file and does a lot (input, save, HUD, animate loop, prompts). Peel out `save.js`, `hud.js`, `input.js`.
- 🟢 **Population persistence.** Town growth persists now, but planner-house residents don't re-add on reload — unify all "newcomer" sources through one saved counter.
- 🟡 **A tiny test/QA checklist** in the repo (enter each building, buy each thing, jail & release) to catch regressions — we already run `node --check` on all modules.
- 🟡 **Central "interior" abstraction.** Home/shop/shelter/bought/biz/civic all repeat the enter/exit/bounds/render pattern; a small shared helper would cut bugs (the civic exit glitch was one of these).

---

## Suggested next batch (my picks)

1. 🟢 **End-of-day summary card** (§5) — makes the economy legible and satisfying.
2. 🟡 **Per-property bought-home interiors** (§3) — you asked for this when we did the Miller move-in.
3. 🟢 **Tap-a-Miller at home** (§3) + **NPC reactions to your reputation** (§8) — cheap personality.
4. 🔴 **One new building-minigame** (§4) — turns the hospital/school/café into places you *do* something.
