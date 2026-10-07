# 002 — Become a public app that works with all major retailers

**Date:** Oct 6, 2026 · **Status:** Accepted · **Replaces:** the Gap-specific parts of [001](001-start-with-gap.md)

## Context

The goal changed from a concept pitched to one retailer to a real, public app that people can use with clothes from any major store. Reviewing the v0 concept against that goal surfaced four problems:

1. **It looked affiliated with Gap.** Gap's product-line names, loyalty program and a "Sync Gap Inc. purchases" button make a public app read as a Gap product.
2. **Purchase sync can't be real.** Retailers don't offer a public way to read a customer's order history, so a public app has to get clothes in some other way.
3. **Favoring one retailer is a conflict of interest.** Inside Gap's own app, recommending Gap is expected. In an app that works with many stores, quietly ranking one retailer first is a hidden ad.
4. **It narrows the portfolio piece.** A Gap-only concept is hard to reuse outside one application.

## Options considered

| Option | Verdict |
| --- | --- |
| Keep the Gap-only concept | Rejected: can't be a real public app |
| One shared platform plus a separate edition for each retailer | Rejected: still a retailer product, and splits effort |
| A public, retailer-neutral app for all major retailers | **Chosen** |

## Decision

- **Any store, from day one.** Clothes come in from order-confirmation emails, product links and photos. A browser extension comes later.
- **Neutral recommendations.** Fill the gap recommends the missing *piece* (for example, light-colored straight chinos), then lists matching options from several stores. Pieces are ranked only by Outfit Unlock, style fit, size availability and duplication. Store options are sorted by the customer's favorite stores, then by price.
- **Transparent business model.** If the app earns affiliate commissions, it says so, and commissions never change the ranking.
- **No retailer-specific editions.**
- **Drop the name "Staple".** A new name is still to be chosen; `outfit-builder` is the working repository name.

## What carries over from v0

- The Outfit Unlock score and the rule-based pairing engine
- The trust patterns: the duplicate check, "what we didn't recommend", and the switch to hide shopping
- End-to-end journey thinking, now across any store instead of one retailer's channels
- The prototype's screens and visual system

## Consequences

- Cold start now depends on email import working well across many retailers' receipt formats. That becomes the main technical risk.
- Product data for suggestions needs a multi-store source, such as affiliate product feeds.
- For the Gap application, the v0 concept and this pivot together show both retail-specific journey design and the judgment to change direction.
