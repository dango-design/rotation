# 006 — Build the outfit first, suggest along the way

**Date:** Oct 7, 2026 · **Status:** Accepted; planning piece by piece replaced by [021](021-plan-in-the-builder.md) · **Milestone:** `v4-plan-and-canvas`

## Context

On Today, a day with nothing planned showed a finished suggested outfit in the main card. It looked the same as a planned day, so an empty day didn't read as empty. It also put Rotation's choice first, when most people want to pick at least one piece themselves and get help with the rest.

## Decision

- **An empty day asks for an outfit.** Under the week strip, a day with nothing planned shows a distinct callout instead of a suggestion: a "blank canvas" prompt, the day's weather, and one **Plan** button. Empty days in the strip show a "+" and "Plan it"; clicking one starts planning that day.
- **Planning is piece by piece.** The planner opens in place on Today: top, bottom, shoes, then an optional layer and extra. Each step lists your pieces for that slot. Two are marked **Suggested**, with a short reason ("Right for a work day", "Warm for 48°"). They go with what you've picked, suit the occasion and the forecast, haven't been worn this week, and, among those, are the ones you wear most. A long gap is not a reason on its own: a piece unworn for months is often seasonal or for one kind of day, and Rediscover on Today is where those come back. A sort menu (Suggested, Least worn, Most worn, Recently added, Name) lets people browse a step their own way. Pieces that clash fade as a hint, but any complete outfit can be planned. After each pick the planner moves to the next step, and the layer step says whether the forecast calls for one.
- **The occasion is part of planning.** The Casual, Work and Dressy toggle moved from the page header into the planner, since it only shapes suggestions. Suggestions favor pieces at that occasion's own formality. The last choice is remembered for the next day planned.
- **Suggestions are opt-in.** **Surprise me** fills the board with a suggested outfit to adjust, from the callout or inside the planner. **Use a saved outfit** stays available.
- **Past days** with nothing logged ask "What did you wear?" and log through the same planner.
- A planned day's card offers **Wear this**, **Change** (reopens the planner with the outfit on it) and **Clear plan**.

The planner and the closet's outfit board share one board component, so outfits look and behave the same in both places.

## Why

- An empty day should look empty. A prompt makes the next step obvious.
- People dress around a piece they want to wear. Starting from their pick, then suggesting what goes with it, keeps them in charge while still doing the matching work.
- Rotation's values hold: suggestions come from the closet first, favor pieces that haven't been worn lately, and never push a purchase into the plan.

## Consequences

- Planning a day takes a few taps instead of one, but "Surprise me" is still a single tap for people who want Rotation to choose.
- The planner only offers pieces you own. Pieces to shop stay in Fill the gap and in the closet's outfit board.
- On phones the board sits above the steps, so picking pieces means scrolling between them. A phone-first layout is still open.
