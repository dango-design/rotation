# 009 — Build the phone app in React Native, sharing the web app's engine

**Date:** Oct 9, 2026 · **Status:** Accepted · **Milestone:** next

## Context

Rotation ran only as a web app. On phones, the outfit board was a cramped bottom sheet over the closet grid (decision 005 flagged it), the canvas from decision 008 couldn't take pieces dragged from the closet, and there was no app to install.

Three ways to build a phone app were considered:

- **Native iOS (Swift):** the most iOS feel and direct use of Apple features, but iPhone only, and every rule in the engine would be written twice and kept in sync.
- **React Native with Expo:** one TypeScript codebase for iPhone and Android that reuses the web app's logic, with native tab bars, controls and gestures.
- **The web app, installable or wrapped:** the least work, but the canvas would still feel like a web page.

Three needs shaped the choice:

- **A drag-and-drop canvas that feels native.**
- **Dragging pieces in from other apps.** For example, lifting a shirt out of a photo in Photos and dropping it into Rotation.
- **Augmented reality, possibly.** Live try-on was looked at and set aside: it needs 3D garments, and Rotation has flat photos. A "See it on me" try-on from a still photo, run on a server, could come later in Fill the gap. That would work on any platform.

## Decision

- **React Native with Expo (SDK 57),** in `mobile/`.
- **One engine for both apps.** The phone app imports `web/src/lib` as `@core/*`: pairing rules, Outfit Unlock, Today's suggestions, the planner's steps, the canvas layout, the garment drawings and the demo closet. Only storage and screens are written for the phone.
- **Phone-first layouts instead of shrunk web layouts:**
  - The day planner and the outfit builder open full screen, with the canvas on top and a tray of pieces below. That replaces the bottom sheet from decision 005.
  - Tap a piece in the tray to add it, or touch and hold it and drag it onto the canvas, where it lands at the drop point.
  - On the canvas, drag a piece to move it. Pinch anywhere to resize the selected piece, so even earrings can be resized without covering them. Bring forward, send backward, true size and remove sit in a bar under the canvas.
  - Gestures run on the UI thread and give a light haptic bump on pick-up and drop.
  - The three tabs use the system tab bar on iOS and Android.
- **iOS-only features come as small Swift add-ons** instead of a switch to native: dragging in from other apps, Apple's subject cutout, a home-screen widget. Until then, "Paste a cutout" uses the cutout people can already copy from Photos.

## Why

- Shared rules mean the same closet gets the same outfits, numbers and suggestions everywhere. Saved canvas arrangements draw the same on both apps.
- Rotation is a public app for every store (decision 002). Android comes from the same code.
- With Gesture Handler and Reanimated, a canvas of a handful of pieces feels native. The features that only Swift can reach are small and few.

## Consequences

- The shared code is imported straight from `web/src/lib` for now, so the web app didn't change. Moving it into its own package is a later cleanup.
- Expo Go, the quick way to try the app on a phone, can't load custom Swift code. Dragging in from other apps and automatic background removal need a development build: Xcode on the Mac, or a cloud build with EAS.
- Product links and Claude photo tagging use the web app's server, which isn't hosted yet, so the phone app doesn't offer them.
- Each device keeps its own closet until accounts and sync arrive. Backups use the web app's format, so a closet can be moved by hand in either direction.
- If Rotation became iPhone only and leaned mostly on Apple-only features, native Swift would be worth reconsidering.
