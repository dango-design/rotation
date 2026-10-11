# 021 — Plan a day in the outfit builder

**Date:** Oct 10, 2026 · **Status:** Accepted · **Replaces:** the piece-by-piece planner in [006](006-build-first-suggest-along-the-way.md) · **Milestone:** next

## Context

Rotation had two ways to put an outfit together, and they worked differently.

- **The outfit builder,** beside the closet on the web and full screen on the phone. Any piece goes on the canvas in any order. Pieces that clash fade, and Shop the gap offers pieces to try.
- **The day planner,** on Today. It walked through slots in a fixed order (top, bottom, shoes, then a layer and extras), jumped to the next slot after each pick, and marked two pieces per slot as Suggested. It also had the occasion toggle, a sort menu and Surprise me.

Denise found the builder friendlier, with less in the way. People dress around a piece they feel like wearing, and the builder lets them start there. In the planner, the step order and the jump after each pick got in the way. Having two flows also meant the same outfit felt different depending on where it was started.

## Decision

**Planning a day opens the outfit builder, set to that day.** "Plan it" on an empty day, "Plan today's outfit", Surprise me and Change on Today all open the same builder people use from the closet. On the web, that's the closet with the outfit board open. On the phone, it's the full-screen builder.

While it's set to a day:

- **The header says so:** "Planning Saturday", or "Logging Tuesday" for a past day.
- **The main button is "Plan for Saturday"** (or **Log as worn**). It saves the plan and goes back to that day on Today. Save outfit stays beside it.
- **The forecast is shown,** with whether it calls for a layer. With no city set, it asks for one; past the 7-day forecast, it says there's no forecast yet.
- **Surprise me** fills the canvas with a suggested outfit to adjust. Pressing it again offers a different one. When the closet has no top, bottom and shoes that go together (or a dress and shoes), it says so instead of disappearing.
- **Cancel** goes back to Today without planning anything.

Everything else is the builder as it was: any piece, in any order, clashing pieces faded, and Shop the gap to try pieces you don't own. As before, an outfit with a piece still to buy can't be planned.

**Removed:** the day planner, its step order, the Suggested badges and their reasons, the sort menu, and the occasion toggle. The occasion setting still shapes Surprise me and Today's suggestions; it just isn't shown while planning.

## Why

- **Less in the way.** Nothing decides the order you pick in, and nothing moves on without you.
- **One way to build an outfit.** What people learn in the closet works on Today, and the reverse.
- **The help that mattered stays.** The forecast and Surprise me were the parts of the planner that helped without directing.

## Consequences

- On the web, planning a day leaves Today for the closet, then comes back to the day when it's planned or cancelled.
- Pieces aren't suggested one slot at a time any more. Faded pieces still show what clashes, and Surprise me still does the matching for people who want it.
- The occasion can't be changed in the app for now. If it's missed, Settings is the place for it.
- Shop the gap is available while planning, so a day can be tried with a piece you don't own yet, though it can only be planned once every piece is owned.
