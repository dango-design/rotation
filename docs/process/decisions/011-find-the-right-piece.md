# 011 — Find the right piece in a photo or product page, and ask when unsure

**Date:** Oct 9, 2026 · **Status:** Accepted · **Milestone:** next

## Context

Adding a piece by photo or product link didn't reliably give a clean picture of the right piece:

- **Photos** were cut out with one salient-object model (U²-Net). It outlines "the main thing" in a photo, so a photo of someone wearing an outfit came out as the whole person, and a flat lay of three pieces came out as one blob. The person then had to choose between that cutout and the original photo, every time.
- **Product links** used only the first photo the page named (JSON-LD or `og:image`). On many stores that is a model wearing the full outfit, a tiny thumbnail, or a different color. The photo was kept as is, background and all.

The goal: every photo and link should end with a clean cutout of the piece the person meant, and when the app can't tell which piece that is, it should show what it found and ask.

## Decision

**Two on-device models, each used where it is reliable.**

- A clothing parser (SegFormer B0 fine-tuned on the ATR human-parsing dataset, 4 MB) labels each pixel as top, skirt, pants, dress, shoes, bag, hat, scarf, belt, sunglasses, skin or hair. It can't see jewelry.
- U²-Net (u2netp, 4.5 MB) outlines the objects in the photo.
- The parser learned from photos of people. On a product shot it labels a sneaker as "pants" and "top", so its garment labels are only trusted when it also sees skin or hair. Its clothing probability is still useful everywhere for telling garments from props like a plant or a phone.
- Both cutouts are refined with a guided filter against the full-size photo, so a coarse 128×128 garment map follows the real fabric edge.

**What the app decides, by kind of photo:**

| Photo | What it does |
| --- | --- |
| Someone wearing one piece, cropped close | Cuts that piece out. Sure. |
| Someone wearing an outfit | Cuts each piece out (top, bottoms, dress, shoes, bag, hat, scarf, belt, sunglasses) and asks which to add. Several can be added in one go. |
| One piece on its own (product shot, hanger, bed) | Cuts the object out. Sure. Props the parser sees as background are left out. |
| Several separate pieces (a flat lay) | Cuts each one out and asks. |
| Pieces lying on each other | Splits the object by color (textures and stripes are blurred away first, so a striped shirt stays one piece) and asks, offering them apart and together. |
| Nothing clear | Asks, with the photo as it is. |

When the app is sure it goes straight to the details form, with a "Not the right piece? Choose another" link back to everything it found.

**Product links find the product among the page's photos.**

- The server collects every photo the page says belongs to the product (JSON-LD gallery, the linked color's variant, Open Graph), dedupes sizes and keeps the largest, then adds gallery images from the markup that share the product's code. Other colors, logos, swatches and color chips are left out. Shopify photos are requested at 1200 px.
- The product's name, category and link say what part it is ("Wide-Leg Trouser" is bottoms) and suggest its type, using the finer categories from [007](007-any-piece-is-an-outfit.md) (a slip dress, a crossbody bag, hoop earrings). On a model photo, that part is the one cut out.
- The browser checks the photos in gallery order and stops at the first clean product shot. Otherwise it ranks them: product shot first, then a model wearing the named part, earlier photos winning ties. If none is clearly right, it asks, showing cutouts from the best photos.
- Store photos reach the browser through a small image proxy (`/api/image`), since most store image hosts don't allow pages to read their pixels. It fetches public raster images only, with the same private-network checks as the link reader, refuses requests from other sites, and allows 60 photos a minute per address (the link reader, 20 links).
- Link imports are now cut out like photos. A new `cutout` field on a piece keeps older link imports, which kept the store's white background, drawn the way they were.

## Why

- Asking only when unsure keeps the common cases (one piece, one product shot) to zero extra taps, and turns the hard cases (an outfit, a flat lay) into a feature: several pieces from one photo.
- Being wrong and sure is worse than asking. Where signals conflict, the app asks; the whole piece is always one of the options, and so is the photo as it is.
- Everything visual stays on the device, as decided in [004](004-build-local-first.md). Only the product page and its public photos pass through the server.
- The picker's cutouts sit on garment tiles, so they keep their light backdrop in dark mode, like the rest of the closet ([010](010-light-and-dark-mode.md)).

## Consequences

- **License to check before any commercial use.** The parser's fine-tuned weights are MIT-licensed, but SegFormer's base weights come from NVIDIA under a license that limits commercial use, and the ATR dataset is for research. That is fine for a portfolio project; a commercial launch needs a parser with a clear license or a review.
- **Known limits.** Pieces of similar color lying on each other stay one piece (blue socks on jeans). A jacket worn open over a tee is one "top" to the parser. Both are recoverable from the picker or by retaking the photo.
- **Speed.** About 0.6 s per photo of a person and 1.7 s per product shot on a laptop, single-threaded WebAssembly. A product page with no clean product shot can take several seconds. Multi-threading or WebGPU would cut this but need cross-origin isolation or a larger runtime.
- **The rate limits are per server instance and trust the forwarded address**, which is enough to stop casual misuse but not a determined one. A public deployment with several instances would need a shared limit.
- Without Claude tagging, the form now still suggests a type: from the product's name for links, and from the parser's part for photos of people.
