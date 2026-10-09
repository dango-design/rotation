# 010 — Board backgrounds are a few light neutrals, set once

**Date:** Oct 9, 2026 · **Status:** Accepted · **Milestone:** next

## Context

The outfit board and every flat lay sat on one fixed color (linen), and some pieces got lost on it, like a white tee or a cream tote. A look at how other closet apps handle backgrounds (Oct 8, 2026):

- **Whering and Indyx** keep a fixed plain canvas. At least one Whering reviewer has asked for background colors.
- **Fits** offers solid colors and gradients, plus stickers.
- **Acloset and Combyne** offer decorative backgrounds and stickers, and Combyne lets people upload their own. Combyne's own guide warns that cutouts often keep a white edge that looks rough on colored backgrounds.
- **Polyvore and Pinterest Shuffles** treat the background as one more layer in a free collage.
- **Alta** sidesteps backgrounds and shows the outfit on an AI avatar.

Decorative backgrounds show up in apps built around sharing and collage. Apps built around planning keep the canvas plain.

## Decision

- **Four backgrounds:** White, Linen (the original, still the default), Mist and Stone. All are light, with almost no hue.
- **Two places to pick one:** swatches in the board's bottom-right corner, next to Tidy up, shown while you work on the canvas; and Settings > Outfit boards.
- **One preference for the whole app, not per outfit.** The planner, the closet board, the week strip, saved outfits and drawers all match.
- **White gets a thin edge** so it stands apart from the white cards around it.

## Why

- The board is where people judge whether colors work together, and a tinted background changes how a piece's color reads.
- Pieces imported from store links keep their white product background and are blended into the board. On a dark board those photos would turn into dark squares, so there's no dark option.
- Stone gives white and cream pieces something to stand out against without going dark.
- A single preference keeps every thumbnail consistent and needs no change to saved outfits.

## Consequences

- No charcoal, colors, patterns or photo backgrounds for now. Those suit sharing a look. Revisit them when there's a way to share or export an outfit, and save the background with each outfit then.
- A dark background would first need product photos to have their white background removed, so they no longer rely on blending.
- Light and dark mode ([#9](https://github.com/dango-design/rotation/pull/9)) dims the board in dark mode instead of inverting it, which fits this decision. Whichever of the two lands second needs to give the four board colors dark-mode values.
