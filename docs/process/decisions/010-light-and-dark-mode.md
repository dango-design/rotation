# 010 — Light and dark mode, with garments kept on a light backdrop

**Date:** Oct 9, 2026 · **Status:** Accepted · **Milestone:** next

## Context

Rotation only had a light theme. Many people keep their phone or laptop in dark mode, especially in the evening, when planning tomorrow's outfit happens. The question was what dark mode should do to the clothes themselves: the closet tiles, the outfit flat lays and the outfit board.

## Decision

- **Rotation follows the device's light or dark setting.** Settings > Appearance can pin it to Light or Dark instead; the choice is saved in that browser, and a saved theme is applied before the page draws, so it never flashes the other one.
- **The interface turns dark; the clothes don't.** Garment tiles, flat lays and the outfit board are treated like product photos. In dark mode their backdrop only dims a little (a warm light stone instead of linen), and everything drawn on them, such as badges, selection rings, the board's handles and toolbar, keeps its light-mode look.
- **Light mode stays as it was.** Every color now has a light and a dark value, and the light values are the same ones the app already used.

## Why

- A dark backdrop would make black, navy and charcoal pieces nearly disappear, and those are some of the most common pieces in a closet.
- Product photos with white backgrounds are blended into the tile, so a dark tile would darken the garment itself and change how its color reads.
- Shopping apps with a dark mode tend to keep product imagery on light backgrounds for the same reason, so a light tile inside a dark interface is a familiar pattern.

## Consequences

- In dark mode, a grid of closet tiles is a grid of light squares. Dimming the backdrop keeps that from glaring, but the closet is still brighter than the rest of the screen.
- The theme choice is per browser, not part of the closet data, so it isn't included in a closet backup and doesn't follow someone to another device.
- Outfit board backgrounds (#8) need a dark-mode value for each option so they dim along with the tiles.
