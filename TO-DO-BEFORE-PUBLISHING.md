# ✅ TO-DO BEFORE PUBLISHING (do these once the game is finished)

The app project is already set up. **Keep building the game in `www/index.html` for now.**
When the game is done, work through this checklist to publish.
(Detailed commands for each step are in **APP-SETUP.md**.)

---

## 0. Final game polish (before anything else)
- [ ] Game feels finished (story, jobs, house upgrades, balancing, sounds)
- [ ] Tested fully in the browser (Live Server on `www/index.html`)
- [ ] Run `npx cap copy` to push the final version into both apps

## 1. App look & identity
- [ ] Make a **1024×1024 PNG** app icon (`icon.png`) + a `splash.png` → generate all sizes
      *(ask Claude to wire this up with `@capacitor/assets`)*
- [ ] Confirm app name + ID in `capacitor.config.json`
      (`appName: "Paws & Pennies"`, `appId: "com.pawsandpennies.app"`)

## 2. Developer accounts (paid)
- [ ] **Apple Developer Program** — $99/year → <https://developer.apple.com/programs/>
- [ ] **Google Play Console** — $25 one-time → <https://play.google.com/console>

## 3. Install build tools on this Mac
- [ ] `brew install cocoapods` (iOS)
- [ ] `sudo xcodebuild -runFirstLaunch` + `sudo xcodebuild -license accept`
- [ ] `brew install --cask android-studio`, then open it once to install the SDK

## 4. Build & test on real devices
- [ ] iOS: `npx cap sync ios` → `npx cap open ios` → set signing Team → Run on iPhone
- [ ] Android: `npx cap open android` → let Gradle sync → Run on an Android phone

## 5. Store listing assets (prepare these)
- [ ] App description + short tagline
- [ ] Screenshots (iPhone + Android — taken from the running app)
- [ ] A simple **privacy policy** URL (required by both stores)
- [ ] Age rating / content questionnaire answers (this game = all-ages)

## 6. Submit
- [ ] **iOS:** Xcode → Product → Archive → Distribute → App Store Connect → fill listing → Submit (review ~1–3 days)
- [ ] **Android:** Build → Generate Signed Bundle (.aab) → upload to Play Console → fill listing → Submit
- [ ] ⚠️ **Save your Android keystore + password somewhere safe** — you need the same one for every future update

---

### Reminder
- Edit the game in **`www/index.html`** → run **`npx cap copy`** → rebuild.
- Full command details live in **APP-SETUP.md**.
