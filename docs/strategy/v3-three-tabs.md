# Rotation — Product Strategy & Plan (v3, three tabs)

> **Snapshot.** The strategy at milestone `v3-three-tabs` (Oct 7, 2026) is the same as [v2](v2-rotation-app.md), with the changes below. The live strategy doc is kept in Claude Docs.

Oct 7, 2026 · Denise ([dango-design](https://github.com/dango-design))

## What changed since v2

| Area | v2 | v3 |
| --- | --- | --- |
| Main tabs | Six: Today, Closet, Outfit builder, Planner, Fill the gap, Insights | **Three:** Today, Closet, Fill the gap ([decision 005](../process/decisions/005-three-tabs.md)) |
| Planning the week | A separate Planner tab that repeated today's outfit | A week strip on Today that picks the day; one outfit card shows worn, planned or suggested |
| Building outfits | A separate builder with its own copy of the closet as a tray | The board opens beside the Closet grid; pieces that don't fit fade and sort last |
| Saved outfits | At the bottom of the builder | An Outfits view in Closet |
| Stats | On Today, in the Closet heading, on every closet card, and on Insights | Background only: a Closet report under "You", and a number on a card only when the closet is sorted by it |
| Neglected pieces | Listed on both Today and Insights | Once, as "Rediscover what you own" on Today |

## Product principle added

**One home for each thing.** Each outfit, list and number appears in one place. Numbers that help with a decision stay where the decision is made (outfits unlocked when shopping, last worn when rediscovering, wears and cost per wear in a piece's details); scores that don't change day to day live in the report.

## Open questions

- Whether people want the stats in the background is a judgment call. The app has no analytics, so it should be checked with real users.
- On phones the board is a bottom sheet over the grid. It works but is cramped and needs a phone-first design.

## Decision log

| # | Decision | Milestone |
| --- | --- | --- |
| [001](../process/decisions/001-start-with-gap.md) | Start with Gap as the target retailer | `v0-gap-concept` |
| [002](../process/decisions/002-public-multi-store-app.md) | Become a public app for all major retailers | `v1-multi-store` |
| [003](../process/decisions/003-name-rotation.md) | Name the app Rotation | `v2-rotation-app` |
| [004](../process/decisions/004-build-local-first.md) | Build the first version local-first | `v2-rotation-app` |
| [005](../process/decisions/005-three-tabs.md) | Consolidate to three tabs, and keep stats in the background | `v3-three-tabs` |
