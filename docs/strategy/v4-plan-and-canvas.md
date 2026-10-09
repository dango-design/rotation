# Rotation — Product Strategy & Plan (v4, planning and the outfit canvas)

> **Snapshot.** The strategy at milestone `v4-plan-and-canvas` (Oct 8, 2026) is the same as [v3](v3-three-tabs.md), with the changes below. The live strategy doc is kept in Claude Docs.

Oct 8, 2026 · Denise ([dango-design](https://github.com/dango-design))

## What changed since v3

| Area | v3 | v4 |
| --- | --- | --- |
| An empty day | Showed a finished suggested outfit, so it looked planned | A "blank canvas" card asks for an outfit; empty days in the week strip show a "+" ([decision 006](../process/decisions/006-build-first-suggest-along-the-way.md)) |
| Planning | Accept or shuffle Rotation's suggestion | Build piece by piece on Today: top, bottom, shoes, layer, bag, jewelry, accessory. Each step suggests two pieces with a reason. "Surprise me" fills it in for people who want Rotation to choose |
| Suggestions | Favored pieces unworn for longest | Favor pieces that go with the picks, suit the occasion and the forecast, and haven't been worn this week; then what's in rotation. A long gap alone is no longer a reason, since it often means seasonal |
| Occasion | A toggle in Today's header | Part of the planner, since it only shapes suggestions |
| What counts as an outfit | Top + bottom + shoes, or dress + shoes, to plan or log | Any single piece can be planned, logged or saved ([decision 007](../process/decisions/007-any-piece-is-an-outfit.md)). The full definition stays for outfit counts and Outfit Unlock |
| Categories | Six, with one accessory slot | Eight: dresses & jumpsuits, shorts in bottoms, and new Bags and Jewelry categories with their own outfit slots |
| The outfit board | Fixed spots per slot; shoes drawn as big as a sweater | A design canvas: drag, resize, layer, keyboard shortcuts. Pieces start at true-to-life relative sizes, and the arrangement is saved with the outfit ([decision 008](../process/decisions/008-outfit-canvas.md)) |
| Demo closet | 24 menswear-coded basics, 100 outfits | 30 pieces including three dresses, a skirt and flats: 199 outfits, and light chinos unlock 39 more |
| Decluttering | | No stats under the board, no clash warnings, no "optional" labels, one main button on the empty-day card, and the outfit card stays side by side down to 600px |

## Product principles added

- **Build first, suggest along the way.** People start from a piece they want to wear; Rotation does the matching. Suggestions are a hint with a reason, never a requirement.
- **Real days, not tidy rules.** A record of one piece beats no record, and clashing is a hint, not a block.

## Open questions

- Season and occasion are guessed from the garment type. A per-piece tag (summer, winter, special occasion) would make suggestions sharper.
- One piece per slot: an outfit can't hold a necklace and earrings at once yet.
- On phones the canvas sits above the planner's steps, and dragging from the closet grid onto the board needs a desktop browser.
- Whether people want stats in the background is still untested.

## Decision log

| # | Decision | Milestone |
| --- | --- | --- |
| [001](../process/decisions/001-start-with-gap.md) | Start with Gap as the target retailer | `v0-gap-concept` |
| [002](../process/decisions/002-public-multi-store-app.md) | Become a public app for all major retailers | `v1-multi-store` |
| [003](../process/decisions/003-name-rotation.md) | Name the app Rotation | `v2-rotation-app` |
| [004](../process/decisions/004-build-local-first.md) | Build the first version local-first | `v2-rotation-app` |
| [005](../process/decisions/005-three-tabs.md) | Consolidate to three tabs, and keep stats in the background | `v3-three-tabs` |
| [006](../process/decisions/006-build-first-suggest-along-the-way.md) | Build the outfit first, suggest along the way | `v4-plan-and-canvas` |
| [007](../process/decisions/007-any-piece-is-an-outfit.md) | Any piece is an outfit, and finer categories | `v4-plan-and-canvas` |
| [008](../process/decisions/008-outfit-canvas.md) | The outfit board is a canvas, at true-to-life sizes | `v4-plan-and-canvas` |
