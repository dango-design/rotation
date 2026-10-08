# Rotation

**Style what you own. Shop what's missing.**

Rotation is a closet and outfit planner for clothes from any store. Add what you own, and it builds an outfit for each day from what you have, explains why each piece made the cut, and plans the week around your calendar and the weather. When something is missing, it recommends the one piece that would unlock the most new outfits, with options from several stores in your size.

> In progress. Store products and prices in suggestions are examples for now. Not affiliated with any retailer.

## Run the app

```bash
cd web
npm install
npm run dev
```

Then open http://localhost:3000. Open http://localhost:3000/?demo to explore Jordan's demo closet without saving anything.

Optional: to have Claude suggest the type, color and name of each photo, set an Anthropic API key before starting:

```bash
echo "ANTHROPIC_API_KEY=your-key" > web/.env.local
```

Run the tests with `npm test` inside `web/`.

## What it does

- **Today:** an outfit for each day from what you own, set for a casual, work or dressy day, using the live forecast for your city. It favors pieces you haven't worn lately. Pick any day in the week strip to plan it or log what you wore.
- **Closet:** add pieces by photo (the background is removed on your device), product link, or description. Tops, dresses, bottoms, outerwear, shoes and accessories. Open the outfit board beside your closet to build and save outfits, with a live pairing check that fades pieces that don't go.
- **Fill the gap:** the pieces that would add the most new outfits, each with store options, your size at each store, and what wasn't recommended and why.
- **Closet report:** outfits you can make, how much of your closet you wear, cost per wear, and where your clothes come from.
- **Your data:** everything stays in your browser. Download a backup or delete everything in Settings.

## How recommendations work

**Piece first, store second.** Rotation decides what kind of piece your closet is missing, then lists matching options from several stores.

1. An outfit is a top, a bottom and shoes, or a dress and shoes, with an optional layer and accessory. Pieces pair when their colors don't compete, two denims aren't the same wash, and none is much dressier than the rest.
2. A piece's **Outfit Unlock** score is the number of new outfits it creates with what you already own. A new layer only counts outfits that none of your layers already work with.
3. Pieces are ranked by unlock × style fit × (1 − duplication). Exact duplicates of what you own are never suggested. Commission is not part of the ranking.
4. Store options are listed by your favorite stores first, then price.

With the demo closet (24 pieces from 15 stores), the engine finds 100 outfits, and light straight chinos would unlock 26 more. The tests in `web/src/lib/engine.test.ts` check these numbers.

## Project layout

| Path | What it is |
| --- | --- |
| `web/` | The Rotation app: Next.js, React and TypeScript |
| `web/src/lib/engine.ts` | Pairing rules and the Outfit Unlock score |
| `web/src/lib/bgremove.ts` | On-device background removal |
| `web/src/app/api/` | Server routes for photo tagging (Claude) and reading product links |
| `mockup/` | The clickable prototype from the concept phase |
| `docs/process/` | The process log: milestones, screenshots and decision records |
| `docs/strategy/` | Strategy snapshots for each milestone |

## Process

This project is documented for a product design portfolio. Every milestone is tagged, with screenshots, a strategy snapshot and decision records in [`docs/process/`](docs/process/README.md).

| Milestone | What it is |
| --- | --- |
| [`v0-gap-concept`](https://github.com/dango-design/rotation/tree/v0-gap-concept) | The first concept, designed around one retailer (Gap Inc.) |
| [`v1-multi-store`](https://github.com/dango-design/rotation/tree/v1-multi-store) | A public app for clothes from all major stores ([why it changed](docs/process/decisions/002-public-multi-store-app.md)) |
| [`v2-rotation-app`](https://github.com/dango-design/rotation/tree/v2-rotation-app) | The first working app, named Rotation ([003](docs/process/decisions/003-name-rotation.md), [004](docs/process/decisions/004-build-local-first.md)) |

## How this was made

Designed by Denise ([dango-design](https://github.com/dango-design)): research direction, product strategy, UX, visual design and every product decision recorded in the process log. Built with [Claude Code](https://claude.com/claude-code) as a build partner, which also helped with competitive research and drafting documentation.

## Credits

- Background removal uses the [U²-Net](https://github.com/xuebinqin/U-2-Net) `u2netp` model (Apache-2.0), run with [ONNX Runtime Web](https://onnxruntime.ai/), following [rembg](https://github.com/danielgatis/rembg)'s pre- and post-processing.
- Weather from [Open-Meteo](https://open-meteo.com/).
