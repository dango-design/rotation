# 016 — Each outfit can have its own background, in any color

**Date:** Oct 10, 2026 · **Status:** Accepted · **Changes:** "one preference for the whole app" in [011](011-neutral-board-backgrounds.md) · **Milestone:** next

## Context

[011](011-neutral-board-backgrounds.md) kept backgrounds to four light neutrals, set once for the whole app. It set aside colors until outfits could be shared, and said to save the background with each outfit then. [015](015-phone-shaped-canvas-and-export.md) added exporting an outfit as a phone-sized image.

Denise decided people should choose any background color, per outfit, from a set of swatches or any color at all.

## Decision

- **Each outfit has its own background.** It's saved with the outfit, with a plan and with a logged wear, and the export uses it. An outfit without one uses the default.
- **The default stays in Settings > Outfit boards**, one of the four neutrals. It covers every outfit that hasn't picked its own, including suggestions.
- **A dot in the canvas corner opens the colors:** the four neutrals, ten colors (Blush, Butter, Sage, Sky, Lilac, Terracotta, Olive, Navy, Charcoal, Black), and Any color, which opens the system color picker.
- **Thumbnails match:** the week strip, the day's outfit card, saved outfits and the picker for saved outfits all show each outfit's background.
- **On a dark background**, the canvas's empty-state words turn light.
- **Product photos keep their white on a color.** On a neutral they're still multiplied into the board. On a color, multiplying would tint the piece, so they show on a small white card instead.

## Why

- A background is part of how an outfit looks once it leaves the app, so it belongs to the outfit, not to the device.
- The palette is a fast start that looks good with most pieces. Any color covers the rest, like matching a brand color or a lock screen.
- Keeping the default neutral means the closet and planning screens still show true colors unless someone chooses otherwise.

## Consequences

- Outfits, plans and wears carry an optional `bg`: a neutral's name or `#rrggbb`. It travels with the record through sync, with no change on the server.
- Colored backgrounds can change how a piece's color reads on the board. That's the person's call now, and the default protects everyone else.
- The phone app shows each outfit's background and keeps it when a plan is changed or logged, but it can't pick one yet.
- Photos pulled from store pages show a white card on a color. Removing their background on import ([012](012-find-the-right-piece.md)) would let them sit on any color.
