# 023 — An Android build to install, with over-the-air updates

**Date:** Oct 10, 2026 · **Status:** Accepted · **Builds on:** [009](009-react-native-phone-app.md), [017](017-cut-out-pieces-on-the-phone.md) · **Milestone:** next

## Context

On Android, Rotation ran only inside Expo Go, pulling its code from the dev server on the Mac. It worked only while the Mac was running on the same Wi-Fi, had no icon of its own, and couldn't be handed to anyone else to try.

A build of Rotation itself fixes that, but a build is fixed at the moment it's made. Rebuilding (about 15 minutes in the cloud) and reinstalling for every change would make it a chore to keep current.

## Decision

**Android gets an installable build, made in the cloud with EAS Build.** The `preview` profile makes an APK that installs from a link, outside Google Play. The app is linked to the Expo project `@deniseango/rotation`, with the Android package `com.dangodesign.rotation`, the same ID as iOS.

**Builds update over the air with EAS Update.** Screens and logic, which are most of Rotation, ship as an update to a channel (`development`, `preview`, `production`, one per build profile). The app checks when it opens, downloads the update, and uses it from the next start. Settings › This version names the running update and offers **Restart now** once a newer one is waiting.

**The runtime version is a fingerprint of the native code.** An update reaches only builds whose native code matches, so a forgotten rebuild leaves a phone on its last version instead of crashing. The branch and commit tag from `app.config.js` is left out of the fingerprint, or every commit would look like a native change.

## Why

- **Rotation away from the desk.** An installed copy works anywhere, which matters for an app about getting dressed.
- **Changes still arrive quickly.** Updates take about a minute to publish, so the build doesn't fall behind the code.
- **No store yet.** An APK from a link needs no Google developer account or review, which suits testing with a few people.
- **Safe by default.** The fingerprint decides what needs a new build, so nobody has to remember.

## Consequences

- A new build is needed when native code changes: a package with native parts, an Expo SDK upgrade, or `modules/`.
- iOS can use the same `preview` build and updates once the Apple Developer Program membership is in place ([017](017-cut-out-pieces-on-the-phone.md)). The development build keeps loading from the dev server.
- Android still uses only the piece finder for cutouts; Apple's cutout is iOS-only.
- Google Play would use the `production` profile and channel. That waits until Rotation is ready for the public.
