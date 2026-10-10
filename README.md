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

Optional settings go in `web/.env.local` (copy [`web/.env.example`](web/.env.example)):

- `ANTHROPIC_API_KEY` has Claude suggest the type, color and name of each photo.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` turn on accounts. With them, building a closet and saving need a sign-in, and the closet syncs across devices. Without them (for local development), the closet stays in the browser with no sign-in. See [`supabase/README.md`](supabase/README.md).

Run the tests with `npm test` inside `web/`.

## Run the phone app

The iPhone and Android app is in `mobile/`, built with React Native and Expo. It shares the web app's engine, so both give the same outfits and suggestions. Install Expo Go on your phone, then:

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with the phone's camera. See [`mobile/README.md`](mobile/README.md) for what's in it and what's next.

## Storybook

Every part of the app, from color tokens to full pages, in [Storybook](https://storybook.js.org), with a fixed closet, date and weather so each state looks the same every time:

```bash
cd web
npm run storybook        # http://localhost:6006
```

- **For design review:** color tokens with contrast checks, the type scale, icons, every garment illustration in every color, button states, and each page at phone, tablet and desktop widths in light and dark, including empty and first-run states.
- **For testing:** `npm run test-storybook` renders every story in Chromium, runs its interactions (open a drawer, remove a piece, read a product link) and checks accessibility. Stories are ready for [Chromatic](https://www.chromatic.com) visual tests: add a `CHROMATIC_PROJECT_TOKEN` secret and CI runs them on every pull request.

The Introduction page in Storybook explains how stories get their data and how to add one.

## What it does

- **Today:** plan each day's outfit piece by piece from what you own. Each step suggests the pieces that go with what you've picked, suit a casual, work or dressy day and the live forecast for your city, and haven't been worn this week. Sort any step by least or most worn, recently added or name. Pick any day in the week strip to plan it or log what you wore; one piece is enough. Or tap Surprise me.
- **Closet:** add pieces by photo, product link, or description. Rotation finds each piece in a photo and removes the background on your device; a photo of an outfit or a flat lay can add several pieces at once. For a product link it finds the product among the page's photos. When it can't tell which piece you mean, it shows what it found and asks. Tops, dresses and jumpsuits, bottoms (including skirts and shorts), outerwear, shoes, bags, jewelry and accessories. Open the outfit board beside your closet to build and save outfits, with a live pairing check that fades pieces that don't go. The board works like a design canvas: drag, resize and layer pieces, which start at true-to-life sizes, and the arrangement is saved with the outfit.
- **Fill the gap:** the pieces that would add the most new outfits, each with store options, your size at each store, and what wasn't recommended and why.
- **Closet report:** outfits you can make, how much of your closet you wear, cost per wear, and where your clothes come from.
- **Your account:** anyone can build outfits with the demo closet, no account needed. Building your own closet and saving outfits need a sign-in, with a code sent by email: your closet is then backed up and the same on every device you sign in on. Download a backup or delete everything in Settings.

## How recommendations work

**Piece first, store second.** Rotation decides what kind of piece your closet is missing, then lists matching options from several stores.

1. An outfit is a top, a bottom and shoes, or a dress and shoes, with an optional layer and accessory. Pieces pair when their colors don't compete, two denims aren't the same wash, and none is much dressier than the rest.
2. A piece's **Outfit Unlock** score is the number of new outfits it creates with what you already own. A new layer only counts outfits that none of your layers already work with.
3. Pieces are ranked by unlock × style fit × (1 − duplication). Exact duplicates of what you own are never suggested. Commission is not part of the ranking.
4. Store options are listed by your favorite stores first, then price.

With the demo closet (30 pieces from 16 stores, dresses and a skirt alongside jeans and trousers), the engine finds 199 outfits, and light straight chinos would unlock 39 more. The tests in `web/src/lib/engine.test.ts` check these numbers.

## Project layout

| Path | What it is |
| --- | --- |
| `web/` | The Rotation web app: Next.js, React and TypeScript |
| `mobile/` | The phone app: React Native and Expo, sharing `web/src/lib` |
| `web/src/lib/engine.ts` | Pairing rules and the Outfit Unlock score |
| `web/src/lib/vision/` | On-device piece finding and background removal: the two models, the decision rules, and the cutouts |
| `web/src/lib/product-page.ts` | Reads a product page: name, price, and the photos that show the product |
| `web/src/lib/sync.ts`, `db.ts`, `account.ts` | Local-first sync: the closet on the device, its outbox of changes, and the account in Supabase |
| `supabase/` | The database schema for accounts, applied by hand to a shared Supabase project |
| `web/src/app/api/` | Server routes for photo tagging (Claude), reading product links, and passing store photos to the browser |
| `web/src/stories/` | Storybook stories: foundations, components, patterns and pages, with their fixtures |
| `web/.storybook/` | Storybook setup: fixed date, viewports and themes, Chromatic modes, stand-ins for the server and the on-device models |
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
- Pieces are told apart with [SegFormer](https://github.com/NVlabs/SegFormer) B0 fine-tuned for clothes ([mattmdjaga/segformer_b0_clothes](https://huggingface.co/mattmdjaga/segformer_b0_clothes), MIT; ONNX by [Xenova](https://huggingface.co/Xenova/segformer_b0_clothes)). SegFormer's base weights are under NVIDIA's license, which limits commercial use; see [decision 012](docs/process/decisions/012-find-the-right-piece.md).
- Weather from [Open-Meteo](https://open-meteo.com/).
