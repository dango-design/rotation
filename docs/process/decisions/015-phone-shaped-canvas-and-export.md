# 015 — The outfit canvas is phone-shaped, and an outfit exports as a phone-sized image

**Date:** Oct 10, 2026 · **Status:** Accepted · **Changes:** the canvas shape in [008](008-outfit-canvas.md) · **Milestone:** next

## Context

Denise asked for a way to export an outfit as an image that fits an iPhone, with the canvas shaped to match so people arrange their pieces for the export.

The canvas from [008](008-outfit-canvas.md) was nearly square (1 : 1.02) and showed about 2.1 m across. A square outfit on a phone screen leaves most of the screen empty, and cropping it would cut off pieces people had placed.

## Decision

- **The canvas is the shape of an iPhone screen:** 1320 × 2868, the iPhone 16 and 17 Pro Max at full resolution. Every recent iPhone has the same 19.5 : 9 shape, so the image fills any of them. The planner on Today, the closet's outfit board and the phone app all use it.
- **Export image** sits in the planner's action bar and under the closet's outfit board. It draws the canvas exactly as arranged, on the board background, as a PNG at 1320 × 2868. On a phone it opens the share sheet, where Save Image puts it in Photos. On a computer it downloads.
- **The canvas shows about 1.5 m across**, down from 2.1 m, so pieces fill the narrower width. Sizes stay true to life relative to each other.
- **A fresh outfit lays out top to bottom**, the way it's worn: layer and top, then bottom, then shoes beside the bag, with jewelry and accessories at the top.
- **Thumbnails zoom to the pieces.** The week strip, saved outfits and outfit cards show the pieces as large as they fit, not the whole phone shape.
- **Outfits arranged on the square canvas keep their look.** Each piece keeps its size and position across, and the arrangement moves to the middle of the taller canvas. Tidy up puts it back at the new true sizes.
- **The export is always light**, like the board in dark mode ([010](010-light-and-dark-mode.md)).

## Why

- The canvas is the export. If what people arrange is what they get, nothing gets cropped and no one has to guess where the edges are.
- A tall frame suits an outfit: top over bottom over shoes is already the shape of a person.
- Zooming thumbnails to the pieces keeps small previews readable. A whole phone shape in a square tile would draw a tee about 40 px wide in the week strip.
- Moving old arrangements, rather than resetting them, respects work people already did.

## Consequences

- The planner and the closet board are taller and narrower. On the web, the planner's canvas is sized by the window's height, and the pieces column beside it gets more room.
- Each saved piece position now records the canvas shape it was arranged on (`v` in the layout), so old and new arrangements can be told apart.
- The phone app shows the new canvas, but it can't export yet. That needs a native capture and save step (for example `react-native-view-shot` with `expo-media-library`), which is the next step.
- [011](011-neutral-board-backgrounds.md) set aside colorful backgrounds until outfits could be shared. That time has come, but this change keeps the four neutrals. A per-outfit background, and a guide for the lock screen clock, are open questions.
