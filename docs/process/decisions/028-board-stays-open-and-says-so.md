# 028 — The outfit board stays open, and says so

**Date:** Oct 13, 2026 · **Status:** Accepted · **Builds on:** [021](021-plan-in-the-builder.md) · **Milestone:** next

## Context

Since [021](021-plan-in-the-builder.md), "Plan it" on Today opens the closet with the outfit board beside it, set to that day. The board stays open when you switch tabs, which is useful: you can check Today and come back to the outfit you were building.

In testing, Denise found that this was hard to see. With the board open, clicking a piece in the closet puts it on the board instead of opening it. Someone who planned a day, looked at Today, and came back to the closet to fix a piece's details had no way to know the board was why the click did something else. Nothing on Today said a day was still half planned, and "Plan it" on that same day again wiped what was on the board.

## Decision

**The board stays open across tabs, and every place that's affected by it says so.**

- **Each piece in the closet gets a pencil while the board is open.** A click still puts the piece on the board; the pencil opens it to see or edit, without closing the board. The hint under the closet title says both ("Planning Saturday. Click a piece to put it on the board, or its pencil to edit it.").
- **In a piece's details, "Style it" becomes "Put on the board"** while the board is open, so it adds to the outfit in progress instead of replacing it with a new one.
- **Today shows a bar for a day left half planned:** "Planning Saturday · 3 pieces on the outfit board, not planned yet", with **Back to the board** and **Discard**. That day's tile on the week strip reads "On the board" instead of "Plan it".
- **"Plan it" on that same day picks up where it was left.** Surprise me still starts a fresh outfit.
- **The Closet tab shows a small dot** while the board is open and you're on another page, in the sidebar and in the phone tab bar.

## Why

- **The mode is visible where it matters.** The board changing what a click does is fine as long as you can tell, and can still reach a piece's details.
- **Work isn't lost by looking around.** Leaving to check the week, then coming back to the same day, keeps the outfit.
- **Closing stays a choice.** Discard on Today and the board's own close button are the ways to drop it; nothing drops it by surprise.

## Consequences

- Phone app: not changed here. Its builder is full screen, so the closet and the board don't share a screen the same way.
- An outfit board with no day (built from the closet) also shows the dot on the Closet tab, but no bar on Today, since there's no day waiting on it.
