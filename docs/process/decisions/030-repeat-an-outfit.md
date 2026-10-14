# 030 — Repeat an outfit

**Date:** Oct 13, 2026 · **Status:** Accepted · **Builds on:** [029](029-plan-a-day-on-today.md) · **Milestone:** `v5-live-app`

## Context

Planning a day ([029](029-plan-a-day-on-today.md)) starts from single pieces. Denise asked what happens when someone wants to plan an outfit they've worn before. The only way was "Use a saved outfit", which needed the outfit to have been saved, and planned it straight away from a pop-up without a chance to change anything. An outfit logged as worn, but never saved, couldn't be reused at all, even though people repeat outfits all the time.

## Decision

**While planning a day, the pieces side has three tabs: Pieces, Worn before, and Saved.**

- **Worn before** lists outfits from the wear log, one per set of pieces, most recently worn first, arranged as they were last time. Each says when it was last worn and, if more than once, how many times in all ("Worn yesterday · 2 times in all"). An outfit that was planned before it was worn keeps the plan's name. A single piece logged on its own isn't an outfit, so it isn't listed.
- **Saved** lists saved outfits.
- **Picking one puts it on the board,** replacing what's there, so it can be planned as it is or changed first. The card shows "On board" while it matches.
- Outfits with a piece that's no longer in the closet are left out. Tabs with nothing in them aren't shown.

**On a day with nothing planned, "Use a saved outfit" becomes "Repeat an outfit"** ("Pick a past outfit" for a past day). It opens the planner on Worn before, or on Saved if nothing has been worn yet. The pop-up it used to open is gone.

## Why

- **Repeating is normal.** A favorite outfit is worth wearing again; Rotation shouldn't require saving it first.
- **One way to plan.** A repeated outfit lands on the same board as everything else, so it can be adjusted, not just accepted.
- **The wear log already knows.** Every outfit logged as worn is a candidate, with no extra work.

## Consequences

- The demo closet logs a few more outfits from earlier weeks, so Worn before has something to show.
- Worn before isn't in the closet's outfit board (outfits with no day) yet; saved outfits are there already, under Outfits.
- Phone app: not changed.
