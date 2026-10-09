# 008 — The outfit board is a canvas, at true-to-life sizes

**Date:** Oct 8, 2026 · **Status:** Accepted · **Milestone:** `v4-plan-and-canvas`

## Context

Outfits were drawn on a fixed flat-lay grid: each slot had one hand-tuned spot and size, so shoes were drawn about as big as a sweater and nothing could be moved. People arranging an outfit expect it to behave like a mood board or a design tool.

## Decision

- **The outfit board works like a design canvas,** on Today's planner and on Closet's outfit board:
  - Drag a piece to move it.
  - Drag any corner to resize it. Pieces stay square, so a drawing never stretches.
  - A small toolbar on the selected piece offers bring forward, send backward, back to true size, and remove.
  - Keyboard: arrows nudge (Shift for bigger steps), `]` and `[` move a piece up or down the stack (with ⌘ or Ctrl, all the way to the front or back), Delete removes it, and Escape deselects.
  - **Tidy up** puts every piece back at its true size and default spot.
  - Pieces dragged from the closet grid land where they're dropped, on top.
- **Pieces start at true-to-life sizes.** Each garment type has a typical real size; the canvas shows about 2.1 m across, so jeans are longer than a tee, a tote is about a third of the canvas, and earrings are small. Very small pieces (earrings, bracelets, sunglasses) get a minimum size so they can still be seen and grabbed.
- **The arrangement is saved with the outfit.** Plans, saved outfits and logged wears keep their layout, and every preview (the outfit card on Today, the week strip, saved outfits, the picker) draws it the same way. Swapping a piece keeps its spot but uses the new piece's true size.
- **Outfits without a layout** are arranged automatically at true sizes, so older plans and suggestions still look right.

## Why

- Arranging a look is part of planning it, and people know how canvas tools behave.
- True relative sizes make a flat lay read like real clothes on a bed or floor, not icons on a grid.

## Consequences

- True sizes are typical sizes per garment type, not the person's actual piece. A cropped jacket starts at the same size as a long one until resized.
- Moving and resizing work with a mouse, a trackpad or touch. Dragging from the closet grid onto the board uses the browser's drag and drop, which phones don't support. On a phone, people tap a piece in the grid to add it, then move it on the board.
