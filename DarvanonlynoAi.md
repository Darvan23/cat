# 🐾 Darvan's Idea List (no AI needed to read this one 😄)

Ideas for what to **add and improve** next, from the full review of the game, notes, story
and cutscene docs. The bugs from that review are already fixed — this is only the fun stuff
that's still open. Work from it like `mynotes.md`: tick things off, cross things out.

Effort tags: 🟢 quick · 🟡 medium · 🔴 big

---

## 1. 💔 Story — the missing heart (do these first, they ARE the game)

- [ ] 🟡 **Act 4 — "The Hard Winter" (the setback).** The game currently jumps from the
  deadline (Act 3) straight to win/fail. When the rent countdown hits ~half, trigger a rough
  patch: rain/snow tint, fewer mice in the park for a few days, and **the cat gets hurt on a
  job** → Dr. Amara patches you up → for one day the family cares for *you* (Lily sits by
  your bed). This is story beat #5 from STORY.md ("the love goes both ways") and it's the
  most emotional thing the game is missing.
- [ ] 🟢 **The overheard whisper (story beat #2).** First time you sleep at home, a short
  3-panel cutscene: the cat hears the parents whisper about rent through the wall — the
  moment the whole game's motivation is born. The cutscene director already exists.
- [ ] 🟡 **The endings montage** — the only cutscene left from CUTSCENES.md (#7). A short
  epilogue tailored to how you played: kind / corrupt / entrepreneur. Long saves currently
  just… continue forever. Even a simple card version gives the game an ending.
- [ ] 🟡 **Lily as your guide.** STORY.md calls her "your narrator" but in-game she's just an
  escort kid. Give her a small daily line pointing at what to do next ("Mum's worried about
  the rent…", "Dad keeps walking past that shop for sale…"). She becomes the quest system
  AND the emotional heart at once.
- [ ] 🟢 **Mr. Crick's redemption.** One extra beat after the rent is paid: he returns with a
  small awkward gift. STORY.md already suggests he softens — one scene lands it.

## 2. 🎮 Gameplay — best things to add

- [ ] 🟢 **A job/task board — the "what do I do next?" fix.** A 📋 button (or Lily's hint)
  listing 2–3 current goals: "🥛 Elena needs milk · 💼 shift opens at 9 · 🏫 2 days of class
  left." The game has SO many systems that new players drown — this is the highest
  impact-per-effort item on the whole list.
- [ ] 🟢 **End-of-day summary card.** At midnight: wage, tips, business net, rent progress on
  one card. Makes the economy feel earned. (Also top pick in IMPROVEMENTS.md §5.)
- [ ] 🟡 **Work-shop polish batch** (from mynotes' open list — the three that matter):
  - **Rush hour** at midday: more customers + a hectic-day bonus.
  - **Restocking**: shelves visibly empty as things sell; a restock chore between customers.
  - **Wrong change costs the till** the difference — real consequences at the register.
  - Tie-in: good boss check-in answers + stocked shelves → better raise odds.
- [ ] 🟡 **Family mood meter.** One ❤️ meter for the Millers (fed by furniture, food,
  deliveries, escorts) that drives their dialogue and animations. All the inputs already
  exist — it just needs a number and faces.
- [ ] 🟡 **Weather.** Rain (NPCs run indoors, the cat shakes water off) + snow. Cheap with the
  day/night system already there, and it unlocks the Hard Winter act.
- [ ] 🟡 **Photo album / memories.** Milestone moments (first coin, shop reopening, election,
  forgiveness) saved as scrapbook cards you can flip through. Fits the cozy vibe and doubles
  as a story recap.
- [ ] 🟢 **Staff greet you in your businesses.** The check-in chat system is now shared
  (bosses + Daniel) — a light version for your own hired cashiers ("Boss! Takings are
  steady.") would make owned businesses feel warmer.
- [ ] 🔴 **One new building minigame** (IMPROVEMENTS §4): hospital = sort supplies, school =
  help with homework, café = make a coffee order. Turns buildings into places you *do*
  something.

## 3. ✨ Polish & feel (cheap wins)

- [ ] 🟢 **Coin-collect burst** — coins arc toward the HUD counter with a sparkle.
- [ ] 🟢 **More idle charm on the cat** — tail-swish, ear-twitch, blink, sit-and-groom when
  standing still a while.
- [ ] 🟢 **Emote button** — meow / purr / happy-hop that NPCs react to.
- [ ] 🟢 **Notification queue** — fast notifications currently overwrite each other.
- [ ] 🟢 **Ambient audio** — soft paw taps, birdsong by day, crickets at night, a bell on
  every shop sale.
- [ ] 🟡 **Tap-a-Miller at home** — the outdoor talk bubbles extended indoors, using their
  current `millerPlan` activity ("Just watching telly", "Doing homework").

## 4. ⚖️ Balance audit (do once, before publishing)

- [ ] 🟡 The economy spans **2 🪙 tips to a 2,000,000/day treasury**. The early game
  (rent = 100) and late game (homes = 60,000+) are different universes. One deliberate pass
  over the coin curve so the mid-game isn't a grind wall:
  - What should an hour of cashier work buy?
  - How long from first business to first home? (Aim: it should feel earned, not endless.)
  - Are minigame payouts still relevant once you own a business? (Maybe scale with rep.)

## 5. 🔧 Tech health (matters — this ships on phones)

- [ ] 🟡 **Performance pass**: cap `renderer.setPixelRatio` at 2, lower shadow map size on
  small screens, and consider `InstancedMesh` for trees/lamps/fences. A big town with
  hundreds of meshes will cook older phones.
- [ ] 🟡 **Save safety**: everything lives in ONE localStorage key — one corrupted write
  loses the whole save. Add a `version` field (future migrations), keep a rolling backup
  copy, add an "export save" button. On phones, use Capacitor Preferences/Filesystem —
  the OS can wipe localStorage.
- [ ] 🟢 **Split `game.js`** (2,400+ lines): peel out `save.js`, `hud.js`, `input.js`.
  Do it BEFORE the next big feature — it gets harder every week.
- [ ] 🟢 **10-minute QA checklist** in the repo: enter every building, buy one of everything,
  jail + release, reload mid-carry-bag. Catches the "works until you reload" bugs.
- [ ] 🟢 **Remember:** the ROOT `index.html` is just a redirect for GitHub Pages now.
  **Only ever edit `www/index.html`** — the redirect can never drift out of sync.

## 6. 🚀 Publishing (see TO-DO-BEFORE-PUBLISHING.md for the full checklist)

- [ ] App icon (1024×1024) + splash screen
- [ ] Privacy policy URL (both stores require it)
- [ ] Screenshots from a real phone
- [ ] `npx cap copy` to push the final web build into the iOS/Android shells

---

## Suggested order

1. 🟢 Job/task board → the game finally tells you what to do
2. 🟢 Whisper cutscene + 🟡 Act 4 winter → the story gets its heart
3. 🟡 Work-shop batch (rush hour / restock / change) → the 9-to-5 gets fun
4. 🟢 End-of-day card + ⚖️ balance pass → the economy feels fair
5. 🟡 Endings montage + 🔧 perf & save safety → ready to publish
