# Process log

How this project got from idea to app, kept so every step can be referenced later in a portfolio case study. Each milestone is a git tag with screenshots, a strategy snapshot and the decisions that led to it. The live strategy doc is kept in Claude Docs; each milestone saves a markdown copy here.

**Roles.** Denise ([dango-design](https://github.com/dango-design)) set the direction and made the product decisions. Claude Code was used as a build partner for research, prototyping and documentation.

## Milestones

| Milestone | Date | What it is | Snapshot |
| --- | --- | --- | --- |
| `v0-gap-concept` | Oct 6, 2026 | Closet concept for Gap Inc.: purchase sync, Gap-first recommendations, the Outfit Unlock score, and a 7-screen prototype | [Code](https://github.com/dango-design/rotation/tree/v0-gap-concept) · [Screens](screens/v0-gap-concept/) · [Strategy](../strategy/v0-gap-concept.md) |
| `v1-multi-store` | Oct 6, 2026 | Public app for all major stores: email import, piece-first recommendations with store comparison, size per store, a shopping list by store, and disclosed commissions | [Code](https://github.com/dango-design/rotation/tree/v1-multi-store) · [Screens](screens/v1-multi-store/) · [Strategy](../strategy/v1-multi-store.md) |
| `v2-rotation-app` | Oct 6, 2026 | First working app, named Rotation: real closets stored on the device, photo import with on-device background removal, the engine, daily outfits with live weather, builder, planner, Fill the gap, insights and a demo mode | [Code](https://github.com/dango-design/rotation/tree/v2-rotation-app) · [Screens](screens/v2-rotation-app/) · [Strategy](../strategy/v2-rotation-app.md) |
| `v3-three-tabs` | Oct 7, 2026 | Three tabs instead of six: the week planner moves onto Today, the outfit builder opens beside the closet, saved outfits get their own view, and stats move to a Closet report | [Code](https://github.com/dango-design/rotation/tree/v3-three-tabs) · [Screens](screens/v3-three-tabs/) · [Strategy](../strategy/v3-three-tabs.md) |
| `v4-plan-and-canvas` | Oct 8, 2026 | Planning a day piece by piece with suggestions as you go, any single piece counts as an outfit, bags and jewelry and one-pieces as categories, a design-canvas outfit board at true-to-life sizes, and a unisex demo closet | [Code](https://github.com/dango-design/rotation/tree/v4-plan-and-canvas) · [Screens](screens/v4-plan-and-canvas/) · [Strategy](../strategy/v4-plan-and-canvas.md) |

## Decisions

| # | Decision | Date |
| --- | --- | --- |
| [001](decisions/001-start-with-gap.md) | Start with Gap as the target retailer | Oct 6, 2026 |
| [002](decisions/002-public-multi-store-app.md) | Become a public app that works with all major retailers | Oct 6, 2026 |
| [003](decisions/003-name-rotation.md) | Name the app Rotation | Oct 6, 2026 |
| [004](decisions/004-build-local-first.md) | Build the first version local-first | Oct 6, 2026 |
| [005](decisions/005-three-tabs.md) | Consolidate to three tabs, and keep stats in the background | Oct 7, 2026 |
| [006](decisions/006-build-first-suggest-along-the-way.md) | Build the outfit first, suggest along the way | Oct 7, 2026 |
| [007](decisions/007-any-piece-is-an-outfit.md) | Any piece is an outfit, and finer categories | Oct 8, 2026 |
| [008](decisions/008-outfit-canvas.md) | The outfit board is a canvas, at true-to-life sizes | Oct 8, 2026 |
| [009](decisions/009-react-native-phone-app.md) | Build the phone app in React Native, sharing the web app's engine | Oct 9, 2026 |
| [010](decisions/010-light-and-dark-mode.md) | Light and dark mode, with garments kept on a light backdrop | Oct 9, 2026 |
| [011](decisions/011-neutral-board-backgrounds.md) | Board backgrounds are a few light neutrals, set once | Oct 9, 2026 |
| [012](decisions/012-find-the-right-piece.md) | Find the right piece in a photo or product page, and ask when unsure | Oct 9, 2026 |
| [013](decisions/013-optional-accounts-and-sync.md) | Optional accounts that back up and sync the closet | Oct 9, 2026 |
| [014](decisions/014-sign-in-to-save.md) | Build outfits without an account; sign in to build a closet and save | Oct 9, 2026 |
| [017](decisions/017-cut-out-pieces-on-the-phone.md) | Cut pieces out of photos on the iPhone with Apple's subject lifting | Oct 10, 2026 |
| [018](decisions/018-piece-finder-on-the-phone.md) | Run the web app's piece finder on the phone, with Apple's cutout when it's there | Oct 10, 2026 |
| [019](decisions/019-product-links-on-the-phone.md) | Read product links on the phone itself, with no server | Oct 10, 2026 |

## Capturing a milestone

1. Capture screens at 2x:
   - The app: build and start it (`cd web && npm run build && npx next start -p 3100`, or build and use the `app-prod` launch config), then `scripts/screenshots-app.sh <milestone-name>` (demo closet) and `node scripts/screenshots-flows.mjs <milestone-name>` (screens that need clicks: the empty-day card and the planner's canvas)
   - The prototype: `python3 -m http.server 4173 --directory mockup`, then `scripts/screenshots.sh <milestone-name>` (with and without design notes)
2. Save the strategy doc as `docs/strategy/<milestone-name>.md`
3. Write a decision record in `decisions/` for anything that changed direction
4. Commit, then tag: `git tag -a <milestone-name> -m "<summary>"` and push with `--tags`
