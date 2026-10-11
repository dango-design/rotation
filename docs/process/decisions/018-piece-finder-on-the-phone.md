# 018 — Run the web app's piece finder on the phone, with Apple's cutout when it's there

**Date:** Oct 10, 2026 · **Status:** Accepted · **Builds on:** [017](017-cut-out-pieces-on-the-phone.md) · **Milestone:** next

## Context

[017](017-cut-out-pieces-on-the-phone.md) cut pieces out of photos with Apple's subject lifting. That only runs in Rotation's own development build, which needs a paid Apple Developer Program membership. Until then, Denise tests in Expo Go, where photos still kept their background.

Apple's cutout also keeps touching pieces together. In Denise's test photo, a bodysuit and pants overlap, and it came out as one piece. The web app's piece finder ([012](012-find-the-right-piece.md)) tells them apart.

The other option in 017 was to run the web app's remover inside the phone app. Denise asked what "a bigger app" would cost. It's about 23 MB once: the two models (9 MB) and ONNX Runtime's engine (14 MB). It doesn't grow with each photo. Each piece's own photo is stored either way.

She chose to run both.

## Decision

**The web app's piece finder runs on the phone, in a hidden web view.** It's the same code as on the web (`web/src/lib/vision`), so both apps find and cut out pieces the same way.

- `mobile/finder/entry.ts` is the page's script.
- `scripts/build-finder.mjs` bundles it with esbuild into `src/lib/finder-bundle.ts`, which is 20 KB.
- `components/PieceFinder.tsx` hosts the web view and passes photos in and cutouts out.

It works in Expo Go and on any phone. Photos never leave the phone.

**The models and ONNX Runtime download once, the first time the Add screen opens, and are then cached.** They come from jsDelivr: ONNX Runtime at the version the web app uses, and the models from this repository at a fixed commit. A pinned commit means the cached copies never go out of date. The download starts as soon as Add pieces opens, so it's usually done by the time a photo is picked. The first photo says it may take a little longer.

**With Apple's cutout too** (the development build on iOS 17 or later):

- Apple cuts the photo first.
- If Apple finds one subject, the finder looks at that cutout. When it sees two or more pieces, they're offered separately, with Apple's cleaner outline as **All together**.
- When the finder sees one piece, Apple's cutout is used, with the type and color the finder saw.

**The details form starts from what the finder saw:** the type from the kind of piece it found, and the closest color swatch, as on the web.

**When nothing can run,** the photo is kept and the form says why. That covers the first download failing with no connection, and the browser preview.

## Why

- **Cutouts work now, without a paid account.** The development build becomes an improvement, not a requirement.
- **The same finder as the web,** including splitting pieces that touch, and one place to improve it.
- **About 23 MB, once.** It's downloaded rather than built into the app, so the app itself stays small, and someone who never adds a photo never downloads it.

## Consequences

- The first photo needs a connection. After that the finder works offline from the cache, unless iOS clears it.
- Each photo takes a few seconds on the phone. Apple's cutout is near-instant, but it can't split touching pieces.
- The phone depends on jsDelivr for the download, as the web app already does for ONNX Runtime. If the models change, the pinned commit in `PieceFinder.tsx` moves with them.
- Changing `web/src/lib/vision` or `finder/entry.ts` means running `npm run build:finder` in `mobile/` and committing the bundle.
