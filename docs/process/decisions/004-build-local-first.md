# 004 — Build the first version local-first

**Date:** Oct 6, 2026 · **Status:** Accepted · **Milestone:** `v2-rotation-app`

## Context

The prototype (`mockup/`) proved the concept with a fixed demo closet. The next step was a real app people can use with their own clothes. Three pieces of the full plan depend on outside setup:

- **Accounts and sync** need a hosted database (Supabase) that has not been connected yet.
- **Order-email import** needs a Google Cloud project, and Google's review for the read-only Gmail scope before the public can use it.
- **Live store products** need affiliate or retailer product feeds.

## Decision

Build Phase 1 so it works with no accounts and no outside services:

- **Closets live on the device.** Pieces, photos, outfits, plans and wear history are stored in the browser (IndexedDB). People can download a backup file and restore it.
- **Photos are the main way in.** Backgrounds are removed in the browser with U²-Net (u2netp, Apache-2.0), so photos never leave the device. The app suggests a color from the photo. Product links and plain descriptions are the other two ways to add a piece.
- **AI tagging is optional.** When the server has an Anthropic API key, Claude suggests the type, color and a name for each photo, and the person confirms them.
- **Store options are examples.** Fill the gap ranks real logic against an example catalog of 30 pieces, with "find it" links that search the store. The app says this openly.
- **A demo mode** (`?demo`) loads Jordan's closet in memory, so the app can be explored and shared without anyone's data.

Next.js's Cache Components and Partial Prefetching are left off. They target data rendered on the server, and every page here renders from data on the device.

## Why

- It can be used today, without waiting on accounts, Google review or partner deals.
- Keeping data on the device is the strongest privacy story for a first version.
- The engine and screens are the same ones that will run once accounts and imports arrive.

## Consequences

- A closet doesn't follow the person to another device until sync arrives; backup and restore cover the gap.
- Cold start still relies on photos until email import ships, so the add-piece flow has to be fast.
- Next: Supabase accounts and sync, then order-email import, then real product feeds.
