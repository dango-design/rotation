# 024 — The demo closet is real pieces with the stores' photos

**Date:** Oct 12, 2026 · **Status:** Accepted · **Builds on:** [019](019-product-links-on-the-phone.md), [012](012-find-the-right-piece.md) · **Milestone:** `v5-live-app`

## Context

Jordan's demo closet (`?demo`) was 30 made-up pieces drawn as illustrations. It showed how Rotation works, but not what a closet looks like once someone has added their own clothes, which is with photos. Denise wanted real clothing images in the demo.

Copying store product photos into the repo wasn't an option. The repo is public and the photos are the stores' copyrighted work. Most store sites also refuse automated page requests (403s and bot checks), and Rotation doesn't try to get past those.

## Decision

**Every demo piece is a real product, linked to its store page, and shows the store's own product photo.**

- 30 pieces from 11 stores (Gap, J.Crew, Old Navy, Banana Republic, Everlane, Levi's, Uniqlo, Nike, Blundstone, G.H. Bass, Rothy's). Names, colors and prices are as listed in October 2026. Each piece keeps its id, wears and dates, so the planned week and the history still line up.
- **The photos are loaded when the demo runs, not copied.** Each piece stores the photo's address. The demo fetches it through the app's image route and cuts the piece out on the visitor's device with the piece finder (decision 012). That's the same path as adding a piece from a product link. Cutouts are kept in that browser's cache, so a second visit shows them straight away.
- **Pieces start drawn and switch to photos as they're ready.** The week's planned outfits go first. The first visit takes about a minute to bring in all 30. A photo a store moves or blocks just leaves that piece drawn.
- **Each piece's details link to the store page** ("See it at J.Crew"), for any piece added from a link, not just the demo. In the closet grid, linked pieces show their store, like email imports.
- Photos were chosen as product-only shots (laydowns or product on a plain background) from image hosts that serve the app's image route.

## Why

- **It shows the real product.** A closet of real clothes, cut out the way the app cuts out anyone's, is what people will actually see.
- **Nothing copyrighted is in the repo.** Rotation stores links, like a bookmark, and each visitor's browser does the cutting.
- **It exercises the real pipeline.** The demo now runs the image route, the piece finder and the cutout on every first visit.

## Consequences

- **The demo depends on stores keeping their photos where they are.** Pieces fall back to drawings when a photo moves; the list will need a refresh now and then.
- **First-visit cost.** Both vision models (about 9 MB) load, and each cutout briefly holds the main thread; the demo spaces them out between frames. Moving the finder into a worker would remove the stutter.
- **A finder weakness surfaced.** On product shots with beige or cream backgrounds, the clothes parser can mistake the background for skin, decide someone is wearing the piece, and cut out the wrong shape. That affects people adding those products by link too. The demo uses photos the finder handles; the parser check needs its own fix. *Update, Oct 12, 2026:* fixed on branch `fix/finder-product-shots`. The check now looks for the shape of a person (a head at the top of the figure, or a crop at the top of the photo), not just skin. Tested on 99 real store photos: all 44 photos of people are still found, and product shots taken for worn dropped from 18 of 55 to 3.
- **The phone app still draws the demo.** Its store doesn't load the photos yet; the phone's piece finder (decision 018) can do the same job.
- **Fill the gap is still illustrated.** Its suggestions are example pieces with no product behind them. Real photos there come with a product feed, which is the next step.
