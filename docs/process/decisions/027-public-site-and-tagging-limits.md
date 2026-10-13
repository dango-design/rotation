# 027 — A public site on Vercel, with limits on photo tagging

**Date:** Oct 12, 2026 · **Status:** Accepted · **Milestone:** next

## Context

Until now Rotation only ran on a laptop (`npm run dev`). To share it as a real app and a portfolio piece, it needs a public address. The web app is a Next.js app in `web/`, so Vercel is the natural host.

Most of the app runs in the browser. Closets live on the device and sync through Supabase ([013](013-optional-accounts-and-sync.md)), pieces are found on the device ([012](012-find-the-right-piece.md)), and the models load from jsDelivr. Three server routes remain:

- `/api/link` reads a product page someone pastes.
- `/api/image` passes a store's product photo through so the browser can cut it out.
- `/api/tag` asks Claude for a photo's type, color and name. Every call is billed to the server's Anthropic account.

The first two were already limited to Rotation's own pages and to a few dozen requests a minute. `/api/tag` had no limits at all. On a public site anyone could call it as often as they liked, all billed to Denise.

## Decision

**Rotation is hosted on Vercel** as the project `rotation` (team dango-design's projects), at https://rotation-mu.vercel.app. It builds from `web/`. Every merge to `main` deploys to production, and every pull request gets its own preview.

**Photo tagging stays on, with limits for everyone except approved accounts:**

- **On the public site, tagging needs a sign-in.** The browser sends the person's sign-in token, and the server claims one tag for that account from the database before calling Claude (`rotation.claim_tag`).
- **Approved accounts have no daily limit.** That's Denise and anyone she adds to `rotation.tag_approved`, by the email they sign in with.
- **Everyone else gets 10 tags a day each,** counted over the last 24 hours.
- **All of them together share a cap of 150 tags a day,** so a burst of new sign-ups can't run the bill up.
- **Only Rotation's own pages can call it, at most 10 a minute per address,** the same guard the other two routes use.
- **When the limit is reached, adding still works.** The form says the tags are used up for today, and the person fills in the type, color and name themselves. Settings shows how many tags are left today, or that the account has no limit.

The limits live in one SQL function (`rotation.tag_limits()`), so changing them doesn't need a new deploy. Both tables are closed to the browser. People only reach them through the two functions, which only read or add the caller's own uses.

A build without accounts (local development, Storybook) has no allowance to check. Tagging there works as before.

## Why

- **The bill needs a ceiling before the link is shared.** A per-person limit stops one person from running it up. The shared cap also covers lots of new accounts, and an account costs nothing to make.
- **Accounts were the natural key.** Building a closet already needs a sign-in ([014](014-sign-in-to-save.md)), so tying tags to the account adds no step. Counting by network address is easy to get around and unfair on shared networks. Counting on the server in memory also resets with every Vercel instance.
- **The count lives in the database, not on the server.** Vercel runs routes as short-lived functions, so a count kept in memory doesn't last. Postgres keeps the count, and an advisory lock means two quick requests can't both take the last tag.
- **No new secrets.** The server checks with the person's own token and the publishable key. A service-role key never has to go on Vercel.
- **Approving by email** lets Denise add someone before they've signed up.

## Consequences

- **Setup Denise does herself** (auto mode doesn't apply SQL to the shared database or write secrets):
  1. Run the migration `supabase/migrations/20261012230000_rotation_tag_limits.sql`, then add her own sign-in email to `rotation.tag_approved`.
  2. Add the environment variables in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `ANTHROPIC_API_KEY`.
  3. In Supabase's redirect URLs, add `https://rotation-mu.vercel.app/**` for production and `https://rotation-*-dango-designs-projects.vercel.app/**` for previews. This setting is shared across all apps in the project. It's only an addition, and the site URL stays as it is.
- Supabase's built-in email sender only reaches the project's team, so people outside it can't get a sign-in code yet. A custom sender (SMTP) is the next step before inviting anyone ([supabase/README.md](../../../supabase/README.md)).
- A tag counts once it's claimed, even if Claude then fails or the photo isn't clothing.
- The phone app doesn't call tagging, so nothing changes there.
