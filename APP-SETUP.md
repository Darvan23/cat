# 📱 Paws & Pennies — Building the iOS & Android Apps

Your game is now a **Capacitor** app. The game itself lives in **`www/index.html`** (with `www/three.min.js` bundled locally). The `ios/` and `android/` folders are the native app projects that wrap it.

> **Golden rule:** edit the game in **`www/index.html`**. After any change, run **`npx cap copy`** to push it into the apps.

---

## 🔁 The everyday workflow
1. Edit `www/index.html` (open it with Live Server to test in the browser, exactly like before).
2. Copy the change into the native apps:
   ```
   npx cap copy
   ```
3. Re-run in Xcode / Android Studio.

(`npx cap sync` also works — it does `copy` **plus** updates native plugin dependencies. Use `sync` after adding Capacitor plugins, `copy` for normal game edits.)

---

## 🍎 iOS (App Store)

**One-time setup**
1. Install CocoaPods (handles iOS dependencies):
   ```
   brew install cocoapods
   ```
2. Finish Xcode's first-time setup (the scaffolder hit this):
   ```
   sudo xcodebuild -runFirstLaunch
   sudo xcodebuild -license accept
   ```
3. Pull dependencies into the iOS project:
   ```
   npx cap sync ios
   ```

**Build & run**
4. Open the project in Xcode:
   ```
   npx cap open ios
   ```
5. In Xcode: select the **App** target → **Signing & Capabilities** → choose your **Team**
   (sign in with your Apple ID; for the store you need the **$99/yr Apple Developer Program**).
6. Pick a simulator (or your plugged-in iPhone) and press **▶ Run**.

**Submit to the App Store**
7. Set a real app icon (see below), bump the version, then **Product → Archive → Distribute App → App Store Connect**.
8. Fill in the listing at <https://appstoreconnect.apple.com> (screenshots, description, privacy) and submit for review (~1–3 days).

---

## 🤖 Android (Play Store)

**One-time setup**
1. Install Android Studio (bundles the Java JDK + Android SDK):
   ```
   brew install --cask android-studio
   ```
   Then open it once and complete the setup wizard (installs the SDK).

**Build & run**
2. Open the project:
   ```
   npx cap open android
   ```
3. Let Gradle finish syncing, then press **▶ Run** on an emulator or a plugged-in phone
   (enable Developer Options + USB debugging on the phone).

**Submit to Google Play**
4. **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)** (create a keystore when prompted — keep it safe!).
5. Upload the `.aab` at <https://play.google.com/console> (**$25 one-time** account), fill in the listing, and submit.

---

## 🎨 App icon & splash screen
Make a single **1024×1024 PNG** icon named `icon.png` and a `splash.png` (2732×2732), then:
```
npm install --save-dev @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor '#1a1a2e' --splashBackgroundColor '#1a1a2e'
npx cap copy
```
This generates every required icon/splash size for both platforms.

---

## 📋 App identity (change anytime)
Set in `capacitor.config.json`:
- **appId:** `com.pawsandpennies.app`  ← your unique bundle ID (reverse-domain). Change to your own domain if you have one.
- **appName:** `Paws & Pennies`

---

## ✅ Status right now
- [x] Capacitor project created, Three.js bundled locally (works offline)
- [x] Android project generated (`android/`)
- [x] iOS project generated (`ios/`)
- [x] Notch / safe-area handling added to the game UI
- [ ] Install CocoaPods → `npx cap sync ios` (you)
- [ ] Install Android Studio (you)
- [ ] App icon + splash (need a 1024px image)
- [ ] Developer accounts + store submission (you)
