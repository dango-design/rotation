# Process log

How this project got from idea to app, kept so every step can be referenced later in a portfolio case study. Each milestone is a git tag with screenshots, a strategy snapshot and the decisions that led to it.

## Milestones

| Milestone | Date | What it is | Snapshot |
| --- | --- | --- | --- |
| `v0-gap-concept` | Oct 6, 2026 | Closet concept for Gap Inc.: purchase sync, Gap-first recommendations, the Outfit Unlock score, and a 7-screen prototype | [Code](https://github.com/dango-design/outfit-builder/tree/v0-gap-concept) · [Screens](screens/v0-gap-concept/) · [Strategy](../strategy/v0-gap-concept.md) |

## Decisions

| # | Decision | Date |
| --- | --- | --- |
| [001](decisions/001-start-with-gap.md) | Start with Gap as the target retailer | Oct 6, 2026 |
| [002](decisions/002-public-multi-store-app.md) | Become a public app that works with all major retailers | Oct 6, 2026 |

## Capturing a milestone

1. Serve the prototype: `python3 -m http.server 4173 --directory mockup`
2. Capture screens: `scripts/screenshots.sh <milestone-name>` (each screen, with and without design notes, at 2x)
3. Save the strategy doc as `docs/strategy/<milestone-name>.md`
4. Write a decision record in `decisions/` for anything that changed direction
5. Commit, then tag: `git tag -a <milestone-name> -m "<summary>"` and push with `--tags`
