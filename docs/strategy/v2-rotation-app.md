# Rotation — Product Strategy & Plan (v2, first working app)

> **Snapshot.** The strategy at milestone `v2-rotation-app` (Oct 6, 2026) is the same as [v1](v1-multi-store.md), with the changes below. The live strategy doc is kept in Claude Docs.

Oct 6, 2026 · Denise ([dango-design](https://github.com/dango-design))

## What changed since v1

| Area | v1 | v2 |
| --- | --- | --- |
| Name | Outfit Builder (working title) | **Rotation** ([decision 003](../process/decisions/003-name-rotation.md)) |
| Product | Clickable prototype with a fixed demo closet | A working web app in `web/` for real closets, plus the demo closet at `?demo` |
| Getting clothes in | Order emails (simulated) | Photo with on-device background removal, product link, or description; optional AI tagging. Order emails are next |
| Data | None stored | On the device (IndexedDB), with backup and restore ([decision 004](../process/decisions/004-build-local-first.md)) |
| Shopping | Example store options | The same, labeled as examples, with "find it" search links |
| Closets supported | Tops, bottoms, layers, shoes, accessories | Adds dresses and skirts; a dress plus shoes is a complete outfit |
| Weather | Simulated | Live forecast from Open-Meteo for the person's city |
| Roadmap | Phase 1 planned | **Phase 1 built.** Next: Supabase accounts and sync, order-email import, product feeds |

## Decision log

| # | Decision | Milestone |
| --- | --- | --- |
| [001](../process/decisions/001-start-with-gap.md) | Start with Gap as the target retailer | `v0-gap-concept` |
| [002](../process/decisions/002-public-multi-store-app.md) | Become a public app for all major retailers | `v1-multi-store` |
| [003](../process/decisions/003-name-rotation.md) | Name the app Rotation | `v2-rotation-app` |
| [004](../process/decisions/004-build-local-first.md) | Build the first version local-first | `v2-rotation-app` |
