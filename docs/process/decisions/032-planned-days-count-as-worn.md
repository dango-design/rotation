# 032 — A planned day counts as worn once it passes

**Date:** Oct 14, 2026 · **Status:** Accepted · **Builds on:** [029](029-plan-a-day-on-today.md), [030](030-repeat-an-outfit.md) · **Milestone:** next

## Context

A planned outfit only counted as worn after the person tapped **Wear this** on Today. Once tapped, the card showed a **Logged** chip and nothing else. There was no way to undo a mis-tap or say "I swapped the boots", short of editing each piece's wear count by hand.

Denise asked how someone would undo or edit a logged outfit, then questioned the step itself: if someone planned an outfit, Rotation can assume they wore it once the day has passed. Planning is the effort people actually make. Confirming it afterwards is the step they skip, and every skipped day leaves the wear log, cost per wear and Rediscover a little more wrong.

## Decision

**A planned day counts as worn once it has passed. A past day stays editable instead of needing to be confirmed.**

- **No more Wear this.** A planned day says "Counts as worn once the day is over. You can change it after." The day after, its pieces get the wear and their last worn day, as if it had been tapped.
- **A worn day has Change and Didn't wear it.** **Change** opens the outfit board on that day with what was worn, and **Log as worn** replaces it. **Didn't wear it** takes the wear back off each piece, putting its count and last worn day back, and clears the day so it isn't logged again.
- **One outfit per day.** A day's outfit is saved under its own id (`day:<date>`), whether it came from a plan that passed, a past day logged on the board, or **Wear today** in the closet. Logging a day again replaces it rather than adding a second wear. A piece logged on its own from its details ("Wore it today") stays a separate wear.
- **A day already logged another way is left alone.** If an outfit was logged on that day before this change, or the planned pieces were logged one by one, the plan isn't counted again.
- **Today can be logged early.** **Wear today** in the closet logs today straight away and makes it the day's outfit; **Change** on it works the same as on a past day.

## Why

- **The log fills itself.** People who plan get an accurate wear history with no extra taps.
- **Mistakes are cheap.** A plan that didn't happen is one tap to take back, and a swap is the same board used to plan it.
- **Two devices agree.** Because a day's outfit has a fixed id, two devices that both see a plan pass write the same record instead of counting it twice.

## Consequences

- Plans that were never confirmed before this change count as worn the first time the app opens after it. Plans are only a few days ahead, so this is a handful of days at most.
- The rule lives in `web/src/lib/wear.ts` (`settle`, `putOn`, `takeOff`, `dayWear`), shared by the web and phone stores. Each wear now notes every piece's previous last worn day (`before`), so taking it back is exact.
- The closet report's "Outfits logged this week" is now "Outfits worn this week".
- Days with nothing planned still need to be logged by hand, from the board or a saved outfit.
- **Update, Oct 14, 2026:** **Wear today** was taken off the closet's outfit board ([PR #43](https://github.com/dango-design/rotation/pull/43)), which now only makes outfits to save. Today is logged by planning it on Today, and it counts once the day is over.
