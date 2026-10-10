# 014 — Build outfits without an account; sign in to build a closet and save

**Date:** Oct 9, 2026 · **Status:** Accepted · **Replaces:** "accounts are optional" in [013](013-optional-accounts-and-sync.md) · **Milestone:** next

## Context

[013](013-optional-accounts-and-sync.md) made accounts optional. With no account, the closet stayed in the browser as it had since [004](004-build-local-first.md). Signing in turned on backup and sync.

That left two kinds of closet: one in an account, which follows the person to every device, and one in a single browser, which is lost when the browser's data is cleared and never reaches the phone. Every screen about data had to explain both, and sync had to take in closets made before anyone signed in.

Denise decided where the line goes: a login isn't required to build an outfit, but it is required to save and to build a closet.

## Decision

**Building an outfit needs no account.** Jordan's demo closet is open to everyone. Anyone can put pieces on the board, try pieces from stores, and plan days without signing in. As before, nothing in the demo is saved. Signed out, the welcome screen and the empty closet offer **Build an outfit with a demo closet**, which opens the outfit board in the demo.

**Building a closet and saving need an account.** Signed out, these ask to sign in first:

- Adding pieces
- Saving an outfit, or planning or logging a day
- Editing or removing a piece
- The shopping list
- Closet settings: city, favorite stores, board background and the shopping switch

The prompt uses the same emailed code as Settings. Once the code works and the account's closet has arrived, the prompt closes and finishes what the person started: **Add your first piece** opens Add pieces, and **Save outfit** saves the outfit. If the account can't be reached, the prompt closes and the person tries again.

**Signed out, nothing is saved.** Each save in the app's store does nothing while no one is signed in, so a button that forgets to ask can't quietly save to the browser.

**What doesn't ask:** Appearance (a choice for this browser, kept in the browser), downloading a closet, and deleting everything on the device. Anyone can delete what's on their device.

**A closet left in the browser from before accounts** stays on screen, and outfits can still be built from it, but changes ask to sign in. Signing in adds it to the account, as 013 describes.

**Signed in, nothing changes from 013.** The closet saves on the device first, works offline and syncs. If a session lapses without a sign-out, the closet stays open and keeps saving on the device, and its changes go up at the next sign-in with the same email.

**A build without accounts set up** (no Supabase settings, as in local development and Storybook) keeps the closet in the browser with no sign-in, as before.

## Why

- **One kind of closet.** Every closet is backed up and on every device the person signs in on. "Where is my closet?" has one answer, and the screens don't have to explain two.
- **No wall in front of the part people come to try.** Putting an outfit together still takes no sign-up. The account is asked for when there's something worth keeping.
- **Asking at the moment of saving, then finishing the action,** keeps signing in from feeling like a detour.
- **The phone app starts with accounts.** Its closets won't need moving into an account later.

## Consequences

- **Nobody outside the Supabase team can build a closet yet.** Supabase's built-in email only reaches the project's team. 013 needed a custom email sender before inviting people; now any real use beyond the demo needs one.
- **The first piece needs a connection,** because signing in does. After that, the closet works offline as before.
- **The demo is the way to try Rotation before signing in.** Outfits built there can't move to a new account, since they're made of Jordan's pieces.
- **004's "usable with no account" now holds only for the demo.** Real closets live in accounts.
- **The phone app still keeps its closet on the phone** until phone sign-in arrives, the next step after 013. It follows this rule from then on.
