# 001 — Start with Gap as the target retailer

**Date:** Oct 6, 2026 · **Status:** Accepted · **Milestone:** `v0-gap-concept`

## Context

The project started with two goals: a personal closet and outfit-planning web app (similar to Indyx), and a portfolio piece for Gap Inc.'s Sr UX Designer – Customer Journey Experience Design role. The brief was to show how a closet app could recommend Gap items that go with what a customer already owns, prioritizing Gap pieces they had already bought.

Research before designing found:

- Getting clothes into the app (the "cold start") is the biggest pain point in closet apps. Indyx sells a $295 in-home cataloguing service to solve it.
- Gap Inc. unified its loyalty program across its four brands in Feb 2026, and lists styling guidance as a member perk.
- On Oct 5, 2026, Gap brand launched a styling experience with Alta, an AI closet app.

## Decision

Design the first concept around Gap Inc.:

- Build the closet automatically from Gap Inc. purchase history.
- Rank recommendations "Gap-first, never Gap-only": owned Gap pieces first, then the customer's other clothes, then new Gap items.
- Rank new items by an **Outfit Unlock score**: the number of new outfits an item creates with what the customer already owns.

## Why

- Designing for one real retailer gave concrete constraints: a real loyalty program, product mix and set of channels.
- It tied the work directly to the role's focus on end-to-end customer journeys, especially post-purchase.

## What was built

- A strategy doc ([snapshot](../../strategy/v0-gap-concept.md))
- A 7-screen clickable prototype with a design-notes overlay ([screens](../screens/v0-gap-concept/))
- A rule-based pairing engine. With the demo closet of 24 pieces, it finds 100 outfits; khakis would unlock 26 more, and two jackets would unlock none.

## Trade-offs known at the time

- Purchase sync relies on data only Gap holds, so it can only exist inside Gap's own channels.
- Favoring one retailer's products is expected inside that retailer's app, but reads as advertising anywhere else.
- Real Gap product-line and program names were replaced with generic ones before publishing, to avoid implying affiliation.
