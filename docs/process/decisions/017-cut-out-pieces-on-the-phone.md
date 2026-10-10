# 017 — Cut pieces out of photos on the iPhone with Apple's subject lifting

**Date:** Oct 10, 2026 · **Status:** Accepted · **Milestone:** next

## Context

On the web, a photo's background is removed in the browser, and each piece in it is found and cut out ([004](004-build-local-first.md), [012](012-find-the-right-piece.md)). The phone app ([009](009-react-native-phone-app.md)) couldn't do either. Those models run on ONNX Runtime, which Expo Go doesn't include, so the phone kept every photo as it was. The only way to a clean piece was to cut it out in Photos first, copy it, and paste it into Rotation.

Testing the phone app on Oct 10, Denise pasted a product photo and got the whole photo, grey background and all, as one "White t-shirt".

There were two ways to fix it:

- **Apple's subject lifting**, the same cutout Photos makes when you touch and hold a photo. It needs a small native add-on, so the app has to run as its own development build instead of in Expo Go. That build needs an Apple Developer Program membership ($99 a year).
- **The web app's background remover running inside the phone app** in a hidden web view. It works in Expo Go and needs no account, but the app gets bigger, each photo takes a few seconds, and the work is thrown away once there's a native build.

Denise chose Apple's.

## Decision

**Every photo is cut out on the phone.** Taking a photo, choosing one from Photos and pasting one all go through the same step. The app reads the photo upright and at most 2048 pixels on its long side. Apple's Vision framework (`VNGenerateForegroundInstanceMaskRequest`, iOS 17 and later) then finds each separate piece and cuts it out onto a clear background. Nothing leaves the phone.

**One piece goes straight to its details.** When a photo holds several, **Which pieces?** shows each cutout, plus all of them together as one piece. You pick the ones to add, and each gets its own details form, as on the web. Two pieces of about the same size and shape start out together, since they're most likely a pair, like shoes or earrings. **Use the photo as it is** is always there.

**A photo that's already a cutout is kept as it is.** If the corners are see-through, as with a piece copied from Photos, it isn't cut again.

**When the phone can't cut out, the photo is kept and the form says why.** That covers Expo Go, iPhones before iOS 17, Android and the browser preview. A cutout pasted from Photos still comes in clean.

**It's a local Expo module,** `mobile/modules/cutout`. The cutting is plain Swift with no UIKit (`Cutter.swift`), so it also runs on a Mac and can be tried on real photos without an iPhone build. `CutoutModule.swift` is the thin bridge to the app.

**The app runs as a development build,** made in the cloud with EAS Build, since this Mac has no Xcode. The build includes `expo-dev-client`, and the bundle identifier is `com.dangodesign.rotation`. The steps are in [mobile/README.md](../../../mobile/README.md#cut-out-backgrounds-development-build).

## Why

- **The cutout people already know.** It's the same lifting as in Photos: instant, with clean edges, and it handles hair, straps and folds well.
- **On the device,** like the web's remover, so photos stay private.
- **No model files to ship or keep up to date.** Vision is part of iOS.
- **It separates pieces,** so a flat lay photo can become several closet pieces in one go.
- **The development build is a step the app needs anyway.** TestFlight, the App Store and dragging pieces in from other apps all need it.

## Consequences

- Trying cutouts needs the Apple Developer Program and a development build. Everything else still runs in Expo Go, with photos kept as they are.
- Native code changes need a new build. Screen and logic changes still load live, as in Expo Go.
- Pieces that touch or overlap in a photo come out as one cutout, as they would in Photos. Laying pieces apart fixes it. The web's piece finder (012) can split touching pieces, and could come to the phone later.
- Android keeps photos as they are for now. ML Kit's subject segmentation would be the Android counterpart.
- Dragging pieces in from other apps is still to come, in the same development build.
