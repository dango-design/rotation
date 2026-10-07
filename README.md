# Staple — closet and outfit planner (concept)

**Style what you own. Shop what's missing.**

Staple is a portfolio concept: a closet and outfit planner that builds itself from a customer's Gap Inc. purchase history, then recommends the Gap pieces that unlock the most new outfits with what they already own.

> Self-initiated concept. Not affiliated with or endorsed by Gap Inc. Product names and prices are illustrative.

## Run the prototype

No build step. Either open `mockup/index.html` in a browser, or serve it:

```bash
python3 -m http.server 4173 --directory mockup
```

Then visit http://localhost:4173. Use the **Design notes** switch in the sidebar to overlay the design rationale on each screen, or open http://localhost:4173/?notes to start with notes on.

## Process

Every milestone is tagged and documented in [`docs/process/`](docs/process/README.md): screenshots of each screen, a snapshot of the strategy, and decision records explaining what changed and why.

## What's in `mockup/`

| File | Purpose |
| --- | --- |
| `index.html` | App shell and shared SVG definitions |
| `css/styles.css` | Design tokens and all component styles |
| `js/garments.js` | Flat-lay garment illustrations, recolored from one hex per item |
| `js/data.js` | Demo customer (Jordan): 24-piece closet, illustrative Gap catalog, planner week |
| `js/engine.js` | Rule-based pairing and the Outfit Unlock score |
| `js/notes.js` | Design-notes copy for each screen |
| `js/app.js` | Views, interactions, drag and drop, overlays |

## Screens

Today · Closet (with purchase sync and photo import) · Outfit builder · Fill the gap · Planner · Insights · Across the journey

## How the Outfit Unlock score works

An outfit is a top, a bottom and shoes (plus an optional layer and accessory) that pass the pairing rules: no two competing colors, no same-wash denim on denim, and formality within one step. A new item's **unlock** is the number of outfits it creates with pieces the customer already owns. A new layer only counts outfits that no owned layer already works with. Picks are ranked by unlock × style fit × (1 − duplicate penalty).

With the demo closet, the engine finds 100 outfits. Straight Khakis unlock 26 more, and both Gap jackets score zero because the customer's existing layers already cover every outfit.
