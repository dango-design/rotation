# 007 — Any piece is an outfit, and finer categories

**Date:** Oct 8, 2026 · **Status:** Accepted · **Milestone:** `v4-plan-and-canvas`

## Context

An outfit had to be a top, a bottom and shoes, or a dress and shoes, before it could be planned, logged or saved. Real days don't fit that rule: no shoes at home, a jumpsuit the app couldn't describe, or "wear the new blazer Friday" planned before the rest. The closet's categories were also coarse: dresses stood alone, and a bag, a hat and a necklace all shared one "accessory" slot, so an outfit couldn't hold a bag and jewelry together.

## Decision

- **Any piece is enough.** Today's planner, and the closet's outfit board, can plan, log or save an outfit with a single piece. The planner's steps (top, bottom, shoes, layer, bag, jewelry, accessory) are a suggested order, and any of them can be skipped. Clashing pieces are still faded as a hint, and the closet's board says when pieces clash.
- **The strict definition stays where it means something.** "Outfits you can make", Outfit Unlock and suggestions still count a complete outfit as a top, a bottom and shoes, or a one-piece and shoes, so those numbers mean the same thing as before.
- **Finer categories:**

| Category | Types |
| --- | --- |
| Dresses & jumpsuits | Dress, jumpsuit or overalls (a one-piece covers the bottom, like a dress) |
| Bottoms | Adds shorts, beside jeans, trousers, joggers and skirts |
| Bags | Tote or shoulder bag, crossbody, backpack, clutch or evening bag |
| Jewelry | Necklace, earrings, bracelet, watch |
| Accessories | Cap, beanie, scarf, belt, sunglasses |

- **Outfits have bag and jewelry slots** beside the accessory slot. Bags, jewelry and accessories finish an outfit but never make one, and they skip the dressiness check.
- **Gold and Silver** join the colors, for jewelry and hardware.
- **Saved closets carry over.** On load, each piece's category comes from its type, and a bag that was in the old accessory slot of a plan, outfit or wear moves to the bag slot.

## Why

- Logging what you actually wore matters more than a tidy definition. A partial record still feeds wear counts and cost per wear.
- Jewelry and bags are how many people finish an outfit, and they're shopped and owned differently from hats or belts.

## Consequences

- The planner shows seven steps. They are a guide, not a checklist.
- Each new type has an illustration, so pieces added by description still look right in the closet and on the board.
- Photo tagging with Claude picks from the new types automatically.
