# 005 — Consolidate to three tabs, and keep stats in the background

**Date:** Oct 7, 2026 · **Status:** Accepted · **Milestone:** next

## Context

The first working app (`v2-rotation-app`) had six main tabs: Today, Closet, Outfit builder, Planner, Fill the gap and Insights. Looking at them side by side showed a lot of overlap:

- **Today and Planner** showed the same outfit for today, logged wears in two places, and used the same suggestions and forecast.
- **Builder and Closet** both showed the closet: the builder's tray was a small copy of the Closet grid, and its "From your closet" list was the grid filtered to pieces that fit and sorted least-worn first.
- **Today and Insights** repeated the same three closet stats, and "Rediscover what you own" on Today was the same list as "Waiting to be worn" on Insights.
- **Closet and Insights** showed the same wears and cost per wear, once as a grid and once as charts.

Stats were also very prominent: on Today, in the Closet heading, and on every closet card. Most of them are a score to look at now and then, not something that helps you decide what to wear today.

## Decision

Three main tabs, each with one job:

- **Today: getting dressed.** The week strip is now on Today and works as a day picker. The outfit card shows the selected day: what was worn, what is planned, or a suggestion you can plan, shuffle, or swap for a saved outfit. Past days can be logged from saved outfits. The Planner tab is gone.
- **Closet: what you own.** Pieces and Outfits views. The outfit board opens as a panel beside the grid. While it is open, clicking or dragging a piece puts it on the board, and pieces that don't go with the outfit fade and sort to the end. That replaces the builder's tray and its "From your closet" list. Shop the gap stays in the panel. The Outfit builder tab is gone, and old `/builder` and `/planner` links redirect.
- **Fill the gap: what's missing.** Unchanged.

Stats move to the background:

- Today no longer has a stats card.
- The Closet heading is the piece count only.
- Closet cards show the name and brand. A card shows a number only when the closet is sorted by it: wears for most or least worn, cost per wear for lowest cost per wear.
- Insights is renamed **Closet report** and moves to the "You" section next to Settings. Its "Waiting to be worn" list is removed, since Rediscover on Today and the "Least worn" sort cover it.

Numbers that help with a decision stay where the decision is made: outfits unlocked on Fill the gap and Shop the gap, "last worn" on Rediscover, and wears and cost per wear in a piece's detail panel.

## Why

- Each piece of information now has one home, so people don't see the same outfit or the same stats twice.
- The tabs match the tagline: style what you own (Today, Closet), shop what's missing (Fill the gap).
- People open a closet app to get dressed. Stats that don't change day to day are better as a report you visit than a dashboard you scroll past.

## Consequences

- Choosing that stats belong in the background is a judgment call, not a measured result. The app is local-first and has no analytics, so it can't show which numbers people look at. It should be checked once there are real users to ask.
- Clicking a closet piece does two things now: it opens the piece's details normally, and it adds the piece to the board while the board is open. The panel header ("Building an outfit"), the "On board" badges and the faded pieces make the mode visible.
- On phones the board is a bottom sheet over the grid, which is workable but cramped. It is worth revisiting with a phone-first layout.
