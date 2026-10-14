# 026 — Keep the quiet editorial look

**Date:** Oct 12, 2026 · **Status:** Accepted · **Milestone:** `v5-live-app`

## Context

Before putting Rotation on Vercel, Denise wanted to see what other visual directions were possible, to check that the current look was a choice and not a default. Four directions were mocked up on Oct 12, 2026. Each had a wordmark, colors, type, buttons and the Today and Closet screens ([design canvas](https://claude.ai/artifact/GBrk1EWJaTzB2jg6zHogtB), private to Denise):

| Direction | Look | Type | Voice |
| --- | --- | --- | --- |
| Dress-Up (whimsical) | Paper-doll sticker book: peach, tomato, butter and sky, garments as tilted white-edged stickers | Fraunces Soft, Figtree, Caveat for handwritten notes | "Play dress-up with the closet you already have." |
| Rotation 2K (2000s) | Chrome wordmark with an orbit ring, glossy Aqua buttons, little windows (`todays_fit.jpg`), pixel labels | Michroma, Nunito, Silkscreen | "your closet, on shuffle." |
| The Edit (editorial) | Magazine masthead, hairline rules, one lipstick red; Today laid out as a cover with numbered credits | Bodoni Moda, Archivo Condensed | "Wear what you own, beautifully." |
| Archive (streetwear utility) | Near-black with one volt-lime signal, item numbers (RTN-014), wear counts as bars, garment tags | Big Shoulders Display, IBM Plex Mono | "Every piece logged. Every fit on record." |

## Decision

**Rotation keeps its current look: quiet editorial.** Warm, calm and editorial, with linen tones and a fashion-magazine serif. The interface stays in the background so the clothes carry the color. In short: the interface is the hanger, not the outfit.

What makes it that, on web and phone:

- **A warm neutral ground.** Linen off-white (`#f3f0ea`), not pure white, so screens feel like paper or a studio wall more than a tech product.
- **A serif voice, a plain sans for everything else.** Instrument Serif for headings, DM Sans for the interface.
- **Two restrained accents.** Deep navy (`#1e3a6e`) for actions and Fill the gap, and clay for warmth. Neither competes with the clothes.
- **Clothes come first.** Garments sit on soft tile backdrops. Outfit boards use near-colorless neutrals so colors read true, and both stay light in dark mode ([010](010-light-and-dark-mode.md), [011](011-neutral-board-backgrounds.md)).
- **Soft and undecorated.** 16px corners, gentle shadows, no gradients, stickers or textures.

## Why

- **The clothes should be the loudest thing on screen.** Dress-Up and Rotation 2K bring their own color and decoration, which competes with the garments and changes how their colors read on the board.
- **It suits every store.** Rotation is retailer-neutral ([002](002-public-multi-store-app.md)). A calm, neutral frame suits a Uniqlo tee and a J.Crew blazer equally. A strong style reads as a brand of its own and leans toward one kind of wardrobe.
- **It reaches the widest group.** Archive speaks to streetwear and menswear fans. Dress-Up and Rotation 2K speak to a younger, trend-led crowd. The current look is unisex and suits the demo closet's mix.
- **It reads as fashion without becoming a magazine.** The Edit pushes the serif and the rules much further, so the app reads like something to look at rather than a tool you use every morning. The current look keeps the fashion feel and the calm of a daily tool.

## Consequences

- No visual change before the Vercel launch. Effort goes to features and polish within the current system.
- Ideas from the explorations that could fit inside it later, kept small: The Edit's numbered credits for a look's pieces, Archive's wear counts shown as bars in the Closet report, and Rotation 2K's "shuffle" as a name for Surprise me.
- The four boards are kept on the design canvas as the record of the alternatives.
