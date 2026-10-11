# 019 — Read product links on the phone itself, with no server

**Date:** Oct 10, 2026 · **Status:** Accepted · **Builds on:** [012](012-find-the-right-piece.md), [018](018-piece-finder-on-the-phone.md) · **Milestone:** next

## Context

On the web, adding a piece by product link goes through two small server routes: one reads the store's page, one fetches its photos. A browser can't read another site's pages or photos, so the server does it for the browser. The phone app left **Product link** switched off, because that server isn't hosted anywhere public yet.

A phone app isn't held to the browser's cross-site rules. The two pieces that make sense of a page are shared code the phone can already use:

- the page reader (`web/src/lib/product-page.ts`)
- the piece finder's product mode (`findInProduct`), which runs on the phone since [018](018-piece-finder-on-the-phone.md)

## Decision

**The phone reads product links itself.**

- It fetches the page and reads it with the web app's own reader, which gives the name, brand, store, price, category and photos.
- It sends the same reader name the web app's server does (`RotationLinkReader`), and gives up after 10 seconds.
- The type comes from what the page names, as on the web (`hintFrom`).

**The piece finder finds the product in the page's photos,** as on the web. It checks them in order, prefers a clean product shot, and skips photos that cut the piece off. The finder's page asks for each photo, and the app downloads it, sizes it and hands it over, since the page can't read store images itself. `findInProduct` and `findInProductPhoto` gained an optional photo loader for this. The web app still uses its image route.

**The screens follow the web:**

- **Add from a product link:** paste a link. **Paste** finds the link inside a store's share text too.
- **Reading the page:** shows progress, such as *Checking photo 2 of 6…*.
- **When the finder is sure,** it goes straight to the details form, which has a **Change photo** button.
- **When it isn't sure,** **Which one is it?** shows the cutout large, the other cutouts, and the page's photos. Picking a photo the finder hadn't checked cuts the product out of it.
- **The details form starts filled in** with the name, brand, store, price, type and color, and keeps the link.

**When a page can't be read,** Rotation says why: the link isn't a web link, the store blocked the request, the store took too long, or the page doesn't describe a product. It then suggests adding the piece by photo or description. When the photos can't be loaded, the piece is drawn from its type and color, as on the web.

## Why

- **It works now,** in Expo Go, with no hosting, no account and no cost.
- **The same reader and finder as the web,** so a link gives the same piece in both apps, and improvements reach both.
- **The person's phone fetches the page,** much as their browser would if they opened it. Nothing goes through a Rotation server.

## Consequences

- Stores that block requests from apps, or that only fill in their product details with their own scripts, can't be read. That's the same limit as the web. The person can still add the piece by photo.
- Claude photo tagging still needs the web app's server, with its API key, so it isn't on the phone.
- A **Share to Rotation** button in Safari's share sheet would skip copying the link. It needs the development build.
