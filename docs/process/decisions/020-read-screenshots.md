# 020 — Fill in a piece's details from a screenshot of its product page

**Date:** Oct 10, 2026 · **Status:** Accepted · **Builds on:** [018](018-piece-finder-on-the-phone.md), [019](019-product-links-on-the-phone.md) · **Milestone:** next

## Context

Some stores check for a full web browser before showing a product page, so Rotation can't read their links. Abercrombie & Fitch is one. [019](019-product-links-on-the-phone.md) suggests a screenshot of the product page instead, added with **Choose from Photos**. The piece finder cuts the piece out of the screenshot, but the name, brand, store and price on the screen still had to be typed in by hand.

The phone can read the text in a screenshot. Denise chose the same pairing as for cutouts: a reader that works in Expo Go now, and Apple's reader in the development build.

## Decision

**A photo from the library or a pasted one is read for text, alongside the cutout.** Camera photos aren't, since they're of the clothes themselves.

- **In the development build:** Apple's text recognition, the same as Live Text. It's `TextReader.swift` in `modules/cutout`, next to the cutout. It's free, on the phone and very accurate.
- **Everywhere else:** Tesseract, an open-source text reader, in the piece finder's hidden web view. It's about 7 MB downloaded once, then kept on the phone. It starts loading when **Choose from Photos** or **Paste** is tapped, so it's usually ready by the time a photo is chosen.

**What the text means is decided in shared code,** `web/src/lib/page-text.ts`, which the web app's tests cover. It's the same whichever reader ran:

- **Name:** the largest text that names a garment and isn't a button, a menu or a sentence. A name that wraps onto two lines is joined, and a store name after a separator ("… | Store") is dropped.
- **Price:** the first price on the page, or the lower of a sale price and the original beside it. Promotions ("$20 off orders over $100", free shipping) are skipped.
- **Store:** the site in the browser's address bar when the screenshot shows it, matched to a known store (abercrombie.com is Abercrombie & Fitch) or named from the site.
- **Brand:** a known brand's name on the page, otherwise the store.
- **Type:** from the name, as for product links.

**A screenshot is about one product,** so its details go with the piece the name describes. When the screenshot shows several pieces, that piece is the one picked to start with. The form says the details were read from the screenshot and should be checked. Size isn't read; screenshots rarely show it reliably.

## Why

- **It closes the gap for stores that block links.** A screenshot fills in almost as much as a link does.
- **Nothing leaves the phone, and nothing costs anything.** Claude's photo tagging would understand more, but it needs a hosted server, costs a little per photo and sends the photo out, so it stays an option for later.
- **One meaning for the text, whichever reader read it,** so moving to Apple's reader changes accuracy, not behavior.

## Consequences

- Tesseract reads plain text well and stylized logos less well. That's one reason the address bar counts for the store.
- Reading text adds a moment to library photos in Expo Go: about 5 seconds the first time, while the reader downloads, then a couple of seconds each, in parallel with the cutout.
- The rules are tested on typical store layouts. Unusual ones may fill in less, never something that isn't on the page, and the person checks every field before saving.
