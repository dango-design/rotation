# Rotation

**Style what you own. Shop what's missing.**

A closet and outfit planner for clothes from any store. It builds your closet from order-confirmation emails, styles what you already own, and recommends the one piece that would unlock the most new outfits, with options from several stores in your size.

> Prototype, in progress. Store names are used for illustration; products and prices are examples. Not affiliated with any retailer.

## Run the prototype

No build step. Open `mockup/index.html` in a browser, or serve it:

```bash
python3 -m http.server 4173 --directory mockup
```

Then visit http://localhost:4173. Use the **Design notes** switch in the sidebar to see the design rationale on each screen, or open http://localhost:4173/?notes to start with notes on.

## Screens

Today · Closet (with email, photo and link import) · Outfit builder · Fill the gap · Planner · Insights · Across the journey

## How recommendations work

**Piece first, store second.** The app decides what kind of piece the closet is missing, then lists matching options from several stores.

1. An outfit is a top, a bottom and shoes (plus an optional layer and accessory) that pass the pairing rules: no two competing colors, no same-wash denim on denim, and formality within one step.
2. A piece's **Outfit Unlock** score is the number of new outfits it creates with what you already own. A new layer only counts outfits that none of your layers already work with.
3. Pieces are ranked by unlock × style fit × size availability × (1 − duplication). Commission is not part of the ranking.
4. Store options are listed by your favorite stores first, then price, with the size to buy at each store from your past orders.

With the demo closet (24 pieces from 15 stores), the engine finds 100 outfits. Light straight chinos unlock 26 more, and two jackets score zero because the closet's layers already cover every outfit.

## Process

This project is documented for a product design portfolio. Every milestone is tagged, with screenshots, a strategy snapshot and decision records in [`docs/process/`](docs/process/README.md).

| Milestone | What it is |
| --- | --- |
| [`v0-gap-concept`](https://github.com/dango-design/rotation/tree/v0-gap-concept) | The first concept, designed around one retailer (Gap Inc.) |
| [`v1-multi-store`](https://github.com/dango-design/rotation/tree/v1-multi-store) | A public app for clothes from all major stores ([why it changed](docs/process/decisions/002-public-multi-store-app.md)), later named Rotation ([003](docs/process/decisions/003-name-rotation.md)) |

## What's in `mockup/`

| File | Purpose |
| --- | --- |
| `index.html` | App shell and shared SVG definitions |
| `css/styles.css` | Design tokens and all component styles |
| `js/garments.js` | Flat-lay garment illustrations, recolored from one hex per item |
| `js/data.js` | Demo person (Jordan): 24-piece closet, suggested pieces with store options, planner week |
| `js/engine.js` | Rule-based pairing and the Outfit Unlock score |
| `js/notes.js` | Design-notes copy for each screen |
| `js/app.js` | Views, interactions, drag and drop, overlays |

## How this was made

Designed by Denise ([dango-design](https://github.com/dango-design)): research direction, product strategy, UX, visual design and every product decision recorded in the process log. The prototype was built with [Claude Code](https://claude.com/claude-code) as a build partner, which also helped with competitive research and drafting documentation.
