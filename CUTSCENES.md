# 🎬 Paws & Pennies — Cutscenes Design

A dedicated plan for adding **cutscenes** — short, "video-looking" story moments — starting with the **cat-selection intro** and covering the big beats of the game.

---

## Goals & style

- **Cozy storybook feel** — warm, gentle, a little emotional (this is a game about a rescued cat helping a poor family).
- **Short & skippable** — 8–20 seconds each. Always a **Skip ▶** button (and auto-skip on replays).
- **No new dependencies** — must work with our stack: classic `<script>` Three.js, DOM overlays, canvas textures, no build step.
- **Reuse what we have** — the game already has multiple 3D scenes, a movable camera, `showDialogue`, a `#fade` overlay, `#flash`, and `makeTextSign` (canvas-texture text). Cutscenes are mostly *sequencing* these.

---

## Two techniques (use both)

### A) In-engine camera cinematics 🎥
Move the **game camera** along a scripted path over a real 3D scene (town, home, jail…), with letterbox bars + captions. Best for gameplay-world moments (becoming President, the jail march, a ribbon-cutting).
- Pros: uses real models we already built; cheap; feels continuous with play.
- Building blocks: tween `camera.position`/`lookAt` over time; toggle a `letterbox` overlay; drive existing NPCs/family into position; `showDialogue`/captions.

### B) 2D painted panels 🖼️
Full-screen **canvas-drawn illustrations** (or layered emoji/vector art) that fade between each other with captions — comic/visual-novel style. Best for backstory & big emotional beats (the intro rescue, endings).
- Pros: "video-looking," full art control, plays before the 3D world is even built.
- Building blocks: a `<canvas>` we draw simple shapes/gradients/emoji on (we already draw the map & minimap this way), cross-fades, Ken-Burns slow zoom for life.

**Recommendation:** intro & endings = **panels**; in-game milestones = **camera cinematics**.

---

## Proposed system: `cutscene.js`

A tiny data-driven **director**. A cutscene is a list of **beats**; the director plays them in order, handles fades, captions, timing, and skipping.

```
// A beat is one of:
//  { panel: drawFn, caption, dur, zoom }              // 2D painted panel (technique B)
//  { cam: {from, to, lookFrom, lookTo}, caption, dur } // camera move over the live 3D scene (technique A)
//  { wait: ms } | { flash } | { sfx } | { run: fn }    // helpers
playCutscene(beatsArray, onDone)
```

DOM pieces (add once to `index.html`):
- `#cutscene` — full-screen overlay (black), holds the 2D `<canvas>` and the letterbox bars.
- `#cs-caption` — bottom caption line.
- `#cs-skip` — Skip button (top-right).
- Letterbox = two black bars sliding in from top/bottom (for camera cinematics we keep the 3D visible between them).

Director responsibilities: run a `requestAnimationFrame` loop, advance beats on their `dur`, cross-fade panels, ease camera tweens, wire **Skip** (jump to `onDone`), and **remember seen cutscenes** in the save so replays auto-skip (a `state.seenCutscenes` set).

Data-drive the actual scenes in the same file (`CUTSCENES = { intro: [...], president: [...] }`), so writing a new one is just adding beats.

---

## The cutscenes

### 1) ⭐ Intro — "The Rescue" (flagship, technique B panels)
**Trigger:** after `confirmAdopt()` picks a cat, before `startGame()` drops you in the world.
Beats (painted panels, slow Ken-Burns zoom, gentle music):
1. Rain on a cardboard box in an alley — a tiny pair of eyes. *Caption: "Cold nights. An empty tummy. A little cat with no one."*
2. A shelter — rows of cages, your chosen cat among them (use the chosen coat colours!). *"Then, a shelter. A roof. But still… waiting."*
3. The Miller family at the counter, hands nearly empty. *"The Millers had almost nothing. But they had room in their hearts."*
4. A hand reaching in; the cat lifted out. *"They chose you."*
5. Walking home together down the street toward the little poor house. *"A new life begins — and this family needs you as much as you need them."*
→ fade to the game, spawn at the Miller home (the existing first-entry dialogue can follow).

> Personalisation: draw the cat with the player's chosen colours (we already store `state.chosenCat` / `catCustom`).

### 2) 🪙 "First Coins" (short, technique A, optional)
**Trigger:** first time `state.earned` crosses a small threshold. A 3-second camera push-in on the cat with a coin sparkle. *"Your first honest coins. It's a start."*

### 3) 🏪 "Dad's Shop Reopens" (camera cinematic)
**Trigger:** after `completeBuyProperty(shop)`. Camera pans to the shop, the OPEN sign flips, Dad walks in, a little crowd claps. *"Daniel has honest work again."*

### 4) 🎉 "Elected!" (camera cinematic + confetti)
**Trigger:** after `becomePresident()`. Camera sweeps the town square, a podium, townsfolk cheering, `#flash` + falling confetti (reuse the heart/flash particle system). *"By the will of the town… President."*

### 5) ⛓️ "The Fall" (camera cinematic, darker)
**Trigger:** on `goToJail()`. Rain returns, the gloom overlay deepens, police flank the cat, a slow march to the cell; letterbox tight. *"Power turned your head. The town turned its back."* Leads into the existing jail scene.

### 6) 🌱 "Redemption" (panels or camera)
**Trigger:** buying your own home after being homeless/disgraced (`completeBuyProperty` while `state.homeless`). Sunrise, a key in a door, the disgrace lifting. *"You clawed your way back — honestly, this time."*

### 7) 🏆 Endings (panels)
**Triggers (soft "chapters," optional):** e.g. Beloved President for N days, or all shelter cats freed. A short montage panel epilogue tailored to how you played (kind vs corrupt vs entrepreneur). Gives long saves a payoff.

### 8) 🎪 Festival / seasonal (stretch)
Ribbon-cutting when you open a hospital/school/shelter (ties into the new civic buildings): camera cinematic of the town gathering, you cut a ribbon, +happiness. *"A gift to the whole town."*

---

## Build order (smallest useful first)

1. ✅ **Director + overlay + Skip + save-flag** (`cutscene.js`, `#cutscene` DOM, CSS). Both beat types (2D panels + camera cinematics) shipped.
2. ✅ **The Intro** (#1) — the emotional hook, plays at first adopt (`beginAdventure` → `INTRO_CUTSCENE`).
3. ✅ **Camera-cinematic beat type** (technique A) + **Elected!** (#4) — `playElectedCutscene`, fires from `becomePresident()`.
4. ✅ **The Fall** (#5) — `playFallCutscene`, fires from `goToJail()` (storm tint + police-light flashes, then the cell).
   ✅ **Dad's Shop** (#3) — `playShopCutscene`, fires from `completeBuyProperty()` (shop branch).
   ✅ **Redemption** (#6) — `playRedemptionCutscene` (panels), fires from `completeBuyProperty()` (homeless branch).
   ✅ **Festival / ribbon-cutting** (#8) — `playRibbonCutscene(id)`, fires from `buildCivic()` for hospital/school/shelter.
5. ⬜ **Endings** (#7) — soft chapter epilogues (Beloved President for N days / all shelter cats freed / kind-vs-corrupt-vs-entrepreneur montage). The last piece of polish left.

## Hooks that already exist (where each cutscene fires)
- Intro → `confirmAdopt()` / before `startGame()`
- Shop → `completeBuyProperty()` (shop branch)
- President → `becomePresident()`
- Jail → `goToJail()`
- Redemption → `completeBuyProperty()` (homeless branch)
- Civic ribbon → `buildCivic()`

## Assets / effort
- All art can start as **canvas-drawn** (gradients, simple shapes, emoji) — zero external files, matches how we draw the map. Upgrade to hand-drawn images later if wanted (inline as data-URIs to keep the no-build setup).
- Reuse existing: `#fade`, `#flash`, gloom overlay, `showDialogue`, heart/flash particles, `makeTextSign`.
