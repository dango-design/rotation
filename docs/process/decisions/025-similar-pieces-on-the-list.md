# 025 — "You have one like it" moves to the shopping list

**Date:** Oct 12, 2026 · **Status:** Accepted · **Changes:** [002](002-public-multi-store-app.md) · **Milestone:** next

## Context

Decision 002 named three trust features for Fill the gap: the duplicate check, "what we didn't recommend", and the switch that hides shopping. In the app, the duplicate check showed up in three places:

- **"What we didn't recommend, and why":** a section listing up to four pieces left out, nearly always because the person already owns one in that color ("You already own one in white and have worn it 41 times").
- **The compare-stores drawer:** a "You already own this" box.
- **"Also worth a look":** "Close to your oxford shirt, so it ranks lower."

Denise questioned the section. Its reasons were obvious (nobody needs telling they own a white tee), and the pieces it listed were never ones people wanted, so it didn't show any real restraint.

## Decision

**A similar piece in the closet is mentioned when someone adds a piece to their shopping list, and on that list, not elsewhere.**

- Adding a piece with a similar one in the closet says so in the confirmation: "Added to your list. You already have a similar one: Classics #585 Chelsea Boots in rustic brown, worn 33 times."
- The same note stays on that piece in the shopping list, where people review what to buy.
- **Similar** means the same kind of piece: the same color if there is one, or else the most worn one of that kind. That's the duplicate check's existing match (`similarNote` in `engine.ts`).
- Removed: the "What we didn't recommend" section, the compare-drawer box, and the "Close to your…" line in "Also worth a look", on the web and the phone. Exact duplicates are still never suggested, and close ones still rank lower, as the ranking note says.

## Why

- **Said where it matters.** "You already have one like it" helps most at the moment someone decides to buy, not as a list of things they'd never have picked.
- **Less noise on Fill the gap.** The page is about what to add, not what was left out.

## Consequences

- One of decision 002's trust features is now part of the duplicate check rather than a section of its own.
- Once real products come in from a feed, "not for you" could come back as a real trust section: popular new pieces that add few outfits to this closet. Those are things people might actually want, which makes leaving them out mean something.
