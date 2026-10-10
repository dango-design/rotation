# Rotation for iPhone and Android

The phone app, built with React Native and Expo (SDK 57). Why React Native: [decision 009](../docs/process/decisions/009-react-native-phone-app.md).

It shares the web app's engine. Everything in `web/src/lib` that decides what to wear or buy is imported as `@core/*`: pairing rules, Outfit Unlock, Today's suggestions, the planner's steps, the canvas layout, the garment drawings and the demo closet. Both apps give the same answers for the same closet. Only storage and screens are written for the phone.

## Try it on your phone

1. Install **Expo Go** from the App Store or Google Play.
2. On the Mac, start the app:

   ```bash
   cd mobile
   npm install
   npx expo start
   ```

3. Scan the QR code with the iPhone camera. The phone and the Mac need to be on the same Wi-Fi.

"Explore a demo closet" loads Jordan's closet without saving anything.

For a quick look in a browser at phone size, run `npx expo start --web`, or use the `mobile-web` launch config. The browser preview is for checking screens; gestures and haptics feel right only on a phone.

Checks: `npm run typecheck` and `npm run lint`.

## Cut out backgrounds (development build)

Expo Go can't cut pieces out of photos, so it keeps them as they are. The cutout runs in Rotation's own development build ([decision 017](../docs/process/decisions/017-cut-out-pieces-on-the-phone.md)), made in the cloud with EAS Build, so no Xcode is needed. It needs an iPhone on iOS 17 or later and an [Apple Developer Program](https://developer.apple.com/programs/) membership. Run these in `mobile/`:

1. Link the app to your Expo account (once). This adds the project's ID to `app.json`, so commit that change:

   ```bash
   npx eas-cli@latest init
   ```

2. Register your iPhone (once per phone). Choose **Website**, open the link on the iPhone, and install the profile from Settings:

   ```bash
   npx eas-cli@latest device:create
   ```

3. Build. The first build asks you to sign in to your Apple account and creates the certificates for you. It takes about 15 minutes in the cloud:

   ```bash
   npx eas-cli@latest build --profile development --platform ios
   ```

4. When it's done, scan the QR code on the build page with the iPhone and install it. iOS asks you to turn on **Developer Mode** (Settings › Privacy & Security) the first time.
5. Run `npx expo start` as usual and open the project in the **Rotation** app instead of Expo Go.

Screens and logic still reload live. Build again only when native code changes, such as `modules/cutout` or a new package with native code.

To try the cutout on a Mac without a build:

```bash
swiftc -target arm64-apple-macosx14.0 modules/cutout/ios/Cutter.swift modules/cutout/try/main.swift -o /tmp/cutout
/tmp/cutout photo.jpg /tmp/cutouts
```

## What's in it

- **Today, Closet and Fill the gap,** with the system tab bar on iOS and Android.
- **Day planner:**
  - Opens full screen, with the canvas on top and each step's pieces in a tray below.
  - Suggested pieces are badged, and pieces that clash are faded.
  - Occasion, Surprise me and sorting work as on the web.
- **Outfit builder:**
  - Opens full screen, with your closet as the tray.
  - A Shop the gap tray offers pieces you could try on the canvas before buying them.
  - Save, wear today, or plan the outfit for any of the next two weeks.
- **The canvas:**
  - Tap a tray piece to add it, or touch and hold it and drag it onto the canvas.
  - Drag pieces to move them.
  - Select a piece, then pinch anywhere on the canvas to resize it.
  - Bring forward, send back, reset to true size or remove it from the bar under the canvas.
  - Arrangements use the same layout model as the web canvas.
- **Adding pieces:**
  - Take a photo, choose one from Photos, or paste one.
  - In the development build on iOS 17 or later, each piece is cut out of the photo on the phone with Apple's subject lifting. A photo with several pieces asks which to add, and each gets its own details. A pair, like shoes, can stay one piece.
  - In Expo Go, photos keep their background. To get a clean piece there, touch and hold it in Photos until it lifts out, tap Copy, then paste it in Rotation.
  - Describe it, and Rotation draws it.
- **More screens:** piece details, store comparison, the shopping list, and Settings (city, shopping suggestions, favorite stores).
- **Your data:**
  - Saved on the phone: the closet as JSON in AsyncStorage, and photos as files in the app's documents folder.
  - Backups use the web app's format, so a closet can move from the browser to the phone and back.

## Not yet

- **Dragging pieces in from other apps.** It needs another small Swift add-on in the development build.
- **Cutouts on Android.** Android keeps photos as they are; ML Kit's subject segmentation would be the counterpart.
- **Product links and Claude photo tagging.** They use the web app's server routes, which aren't hosted yet.
- **The Closet report and How it works pages.**
- **Accounts and sync,** so one closet shows up everywhere. Until then, back up on one device and restore on the other.

## How it's organized

| Path | What it is |
| --- | --- |
| `src/app/` | Screens. `(tabs)/` holds the three tabs; `plan`, `builder`, `item/[id]`, `add`, `compare/[id]`, `list` and `settings` open over them |
| `src/components/OutfitCanvas.tsx` | The canvas: drag, pinch, layer tools |
| `src/components/Carry.tsx` | Touch-and-hold dragging from a tray onto the canvas |
| `src/lib/store.tsx` | App state, mirroring the web store's actions |
| `src/lib/files.ts` | Photos and backup files on the phone (`files.web.ts` for the browser preview) |
| `src/lib/cutout.ts` | Cutting pieces out of photos, when the phone can |
| `modules/cutout/` | The cutout's native module: `ios/Cutter.swift` does the cutting with Vision, `ios/CutoutModule.swift` connects it to the app |
| `eas.json` | EAS Build profiles; `development` is the build with the cutout |
| `metro.config.js` | Lets Metro load the shared code from `web/src/lib` |
