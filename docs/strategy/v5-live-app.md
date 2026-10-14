# Rotation — Product Strategy & Plan (v5, the live app)

> **Snapshot.** The strategy at milestone `v5-live-app` (Oct 13, 2026) is the same as [v4](v4-plan-and-canvas.md), with the changes below. The live strategy doc is kept in Claude Docs.

Oct 13, 2026 · Denise ([dango-design](https://github.com/dango-design))

Rotation is now a public website at [rotation-mu.vercel.app](https://rotation-mu.vercel.app), with accounts that sync, and a phone app for iPhone and Android that shares the web app's engine. Planning a day happens right on Today, and any outfit worn before can be planned again.

## What changed since v4

| Area | v4 | v5 |
| --- | --- | --- |
| Where it runs | A local web app | Live on Vercel, deployed from main with a preview for every pull request ([decision 027](../process/decisions/027-public-site-and-tagging-limits.md)), plus a React Native phone app sharing the same engine ([009](../process/decisions/009-react-native-phone-app.md)) |
| Accounts | None; the closet lived in one browser | Optional sign-in by emailed code; the closet stays on the device and syncs, photos included ([013](../process/decisions/013-optional-accounts-and-sync.md)). Anyone can build outfits with the demo closet; building a closet and saving need an account ([014](../process/decisions/014-sign-in-to-save.md)) |
| Planning a day | Piece by piece on Today, in a fixed order with suggested picks | The same outfit board as the closet, with no step order ([021](../process/decisions/021-plan-in-the-builder.md)), now right on Today: your pieces beside the board, the week strip above ([029](../process/decisions/029-plan-a-day-on-today.md)) |
| Wearing something again | Only a saved outfit, planned from a pop-up as it was | Worn before lists every outfit from the wear log, newest first, with how often it was worn; picking one puts it on the board to adjust ([030](../process/decisions/030-repeat-an-outfit.md)) |
| The outfit board's mode | Opened beside the closet and stayed there; a click put a piece on it, with nothing saying so | Each piece has a pencil to edit it while the board is open, a half-planned day waits in a bar, and a dot marks the tab that holds the board ([028](../process/decisions/028-board-stays-open-and-says-so.md)) |
| Judging outfits | Clashing pieces faded on the board | No grading at all; pairing rules only drive Surprise me, Rediscover and Fill the gap ([022](../process/decisions/022-no-outfit-judging.md)) |
| The canvas | Square | Phone-shaped, exports as an iPhone-sized image ([015](../process/decisions/015-phone-shaped-canvas-and-export.md)), with a background per outfit in any color ([016](../process/decisions/016-outfit-backgrounds.md)) |
| Adding pieces | Photo with background removal, or a link | Finds each piece in a photo or a product page and asks when unsure ([012](../process/decisions/012-find-the-right-piece.md)); on the phone too, with Apple's subject lifting on iPhone ([017](../process/decisions/017-cut-out-pieces-on-the-phone.md), [018](../process/decisions/018-piece-finder-on-the-phone.md)), links read with no server ([019](../process/decisions/019-product-links-on-the-phone.md)), and screenshots of product pages ([020](../process/decisions/020-read-screenshots.md)) |
| Photo tagging | Optional, with your own key | On for everyone signed in, limited to 10 a day each and 150 a day overall, except approved accounts ([027](../process/decisions/027-public-site-and-tagging-limits.md)) |
| Demo closet | 30 drawn pieces | 30 real pieces from 11 stores, linked to their product pages; the stores' photos are cut out on the visitor's device ([024](../process/decisions/024-real-pieces-in-the-demo.md)) |
| Look | Light only | Light and dark, following the device, with clothes kept on a light backdrop ([010](../process/decisions/010-light-and-dark-mode.md)); the quiet editorial look kept after four alternatives were mocked up ([026](../process/decisions/026-keep-the-quiet-editorial-look.md)) |
| Phones (web) | The sidebar became a top bar that scrolled sideways | Three tabs along the bottom, the You pages behind a button, and the outfit board as a sheet over your pieces (PR #35) |

## Product principles added

- **The clothes carry the color.** The interface stays calm and neutral (linen ground, serif headings, two quiet accents), so any store's pieces look true and nothing on screen competes with them.
- **Real days, not tidy rules** (changed). One piece is enough to plan or log a day, and Rotation never grades whether pieces go together: style is personal.

## Open questions

- Accounts are on for the team only; a custom sign-in email is needed before anyone else can sign in. Sync on the phone isn't built yet.
- Worn before is only offered when planning a day, not beside the closet's own outfit board.
- Should people tag pieces as seasonal or for special occasions, so suggestions stop guessing from the garment type?
- Should an outfit hold several pieces of jewelry or accessories at once (a necklace and earrings)?
- The Android build and the over-the-air updates (decision 023, [PR #27](https://github.com/dango-design/rotation/pull/27)) are still in review.

## Screens

[docs/process/screens/v5-live-app/](../process/screens/v5-live-app/): every page in the demo closet, the empty day, planning on Today, repeating an outfit, Today in dark mode, and the phone layout.
