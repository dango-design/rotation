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
  - Take a photo, or choose one from Photos.
  - Paste a cutout: in Photos, touch and hold the piece until it lifts out, tap Copy, then paste it in Rotation.
  - Describe it, and Rotation draws it.
- **More screens:** piece details, store comparison, the shopping list, and Settings (city, shopping suggestions, favorite stores).
- **Your data:**
  - Saved on the phone: the closet as JSON in AsyncStorage, and photos as files in the app's documents folder.
  - Backups use the web app's format, so a closet can move from the browser to the phone and back.

## Not yet

- **Dragging pieces in from other apps, and automatic background removal.** Both need a small Swift add-on and a development build, which Expo Go can't run. Build one with Xcode (`npx expo run:ios`) or in the cloud (`npx eas-cli@latest build --profile development`).
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
| `metro.config.js` | Lets Metro load the shared code from `web/src/lib` |
