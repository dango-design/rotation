# 013 — Optional accounts that back up and sync the closet

**Date:** Oct 9, 2026 · **Status:** Accepted · **Milestone:** next

## Context

The first version kept every closet in the browser ([004](004-build-local-first.md)). That made Rotation private and usable on day one, but a closet couldn't follow someone to their phone or survive a cleared browser, except by downloading a backup file and restoring it by hand. Accounts and sync were the next step in 004's plan.

Constraints:

- The app had to keep working with no account, offline, and in the demo, exactly as before.
- The engine reasons on the device, and the shapes of pieces, outfits and boards were still changing week to week.
- Denise's Supabase project (`games-apps`) already hosts other apps, so Rotation shares its database, its storage and its sign-in settings.

## Decision

**Accounts are optional.** With no account, nothing changes: the closet stays in the browser. Signing in turns on backup and sync. The demo never signs in.

**Sign in with a code sent by email.** No password, and no Google or Apple setup to start. The account is made the first time someone enters their address. If the project's email sends a link instead of a code, the link works in the browser that asked for it.

**The device stays the source the screens read.** Every save still goes to IndexedDB first, so the app is as fast as before and works offline. Each save also notes the change in an outbox on the device. While signed in, the app syncs a moment after a change, when it comes back into view or online, and every minute while open:

1. Photos go up first, then every changed record, as it is now.
2. The app asks the account for everything that changed since the last sync, from any device.
3. **Of two edits to the same record, the newer one wins.** The server keeps the newer of what it has and what arrives, and a device keeps its own change when it's newer than what comes down. Deleting something leaves a marker so other devices delete it too.

**The account stores each record as a JSON document**, one row per piece, outfit, planned day, wear, plus one for the settings and one for the shopping list. The engine never runs on the server, so a column per field would only mean a database change for every design change.

**Photos sync.** Background removal still happens on the device. The finished cutout is uploaded to a private folder only its owner can read. This changes 004's promise that photos never leave the device, so Settings and How it works now say plainly what's saved to the account.

**First sign-in adds the closet already on the device to the account.** Where the account already has the same record, the account's version is kept; everything else is added.

**Signing out takes the closet off the browser.** It stays in the account. If some changes haven't reached the account yet (offline, say), Rotation says how many and asks before signing out. A different account never sees or uploads a closet left by another.

**"Delete all data" deletes from the account too** when signed in, so it still means what it says.

**Rotation keeps to itself in the shared project:** its own `rotation` schema, one `records` table, and a private `rotation-photos` bucket. Row-level security locks every row and photo to its owner; signed-out visitors get no access at all. The browser only holds the publishable key.

## Why

- Optional accounts keep everything 004 got right (privacy by default, no sign-up wall, a demo anyone can open) and add the thing people expect from a closet app: the same closet on every device.
- An emailed code is the shortest path that works on the web and in the phone app alike, with nothing to remember and no third party.
- Local-first sync keeps the app instant and offline-ready. "Newer edit wins" per record is easy to explain, and a person editing their own closet rarely changes the same piece on two devices at once.
- JSON documents let the record shapes keep evolving with the design, while the server still enforces who can read what.

## Consequences

- **The phone app doesn't sync yet.** The sync steps (`web/src/lib/sync.ts`) take the device and the account as plug-ins, so the phone can reuse them with its own storage. That's the next step.
- **Two devices editing the same piece before either syncs:** the later edit wins whole, rather than the two merging field by field. A device whose clock runs fast gets at most five minutes' head start.
- **The shared project's sign-in settings apply to Rotation:** the sign-in email, its sender, how long a code lasts, and the redirect addresses. A Rotation account is the same login as Denise's other apps in that project. Before inviting people beyond the team: a custom email sender (Supabase's built-in one only reaches the project's team), and an email template that includes the code.
- **No account deletion yet.** "Delete all data" empties the account's closet; deleting the login itself needs a small server function.
- **Free plan limits** (shared with the other apps): 500 MB database and 1 GB of file storage, enough for a few thousand photos.
