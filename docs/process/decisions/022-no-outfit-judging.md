# 022 — The builder doesn't judge whether pieces go together

**Date:** Oct 10, 2026 · **Status:** Accepted · **Builds on:** [021](021-plan-in-the-builder.md) · **Milestone:** next

## Context

The outfit builder checked every outfit against Rotation's pairing rules, on the web and the phone.

- **A verdict under the canvas:** "These work together", or a warning such as "Burgundy and Rust compete for attention".
- **Faded pieces:** closet pieces that broke a rule faded and sorted to the end of the tray. On the web, the closet had a "Works with this outfit" sort.

Denise decided against it. Everyone has their own style, and a combination the rules call a clash can be exactly what someone wants to wear. The builder shouldn't grade it.

## Decision

**The builder no longer checks or grades outfits.**

- No verdict under the canvas. Only the count of pieces still to shop stays.
- No fading. The closet tray keeps its own order (least worn first on the phone, the chosen sort on the web), and every piece looks the same.
- The "Works with this outfit" sort is gone from the web closet.

**The pairing rules stay behind the scenes,** where Rotation itself picks pieces: Surprise me, Rediscover's outfits, and Fill the gap's Outfit Unlock counts. Those are Rotation's suggestions, not a judgement of what someone built.

## Why

- **Style is personal.** Rotation helps people wear what they own; it shouldn't tell them they're wrong.
- **Less noise.** A warning or faded pieces on every outfit is noise to someone who knows what they like.

## Consequences

- Someone who wants help matching can still use Surprise me, or start from a suggestion.
- Suggestions can still disagree with what people build by hand. If that starts to feel inconsistent, the rules behind suggestions are the next thing to revisit.
