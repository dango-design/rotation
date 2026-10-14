# 031 — Blocked stores open in Rotation's browser

**Date:** Oct 13, 2026 · **Status:** Accepted · **Builds on:** [019](019-product-links-on-the-phone.md) · **Milestone:** next

## Context

Product links from Nordstrom and Madewell didn't work. Both stores buy bot protection (F5 and Akamai) that only shows their pages to a full browser:

- **Nordstrom** sends any link reader, even one that says it's Chrome, an empty page that only runs a script to check the browser. Rotation called it "a page that doesn't describe a product".
- **Madewell** turns away the web app's server with 403 Access Denied, because it runs in a data center. From a home connection it lets the reader in, but its photos come from the same protected site.

Denise asked whether every store would need fixing one at a time. They don't: stores buy this protection from a handful of companies, and they all look alike from Rotation's side (a challenge page, an empty page that only runs a script, or a 403/429 refusal). But there's no reliable way to get past the checks from a server. Datacenter addresses are flagged before anything else is checked, hidden browsers get caught, and paid proxies that do get through cost money per page, break the stores' terms and keep breaking.

## Decision

**Rotation doesn't try to get past a store's bot check. It reads the page in the person's own browser instead, which the store has already let in.**

- **Both apps recognize all three kinds of block** and say so plainly: the store "checks for a full web browser before showing its pages". An empty page with no title, photos or text counts, as does a 403 or 429 refusal.
- **On the phone, a blocked link opens in Rotation's own browser** (a web view, so Safari's engine on iPhone), with a note saying why. The person goes to the piece and taps **Add this piece**. The page they're looking at is read with the same reader as a pasted link, and its photos are loaded from inside the page, so a store that won't send photos to an app still works. From there it's the usual flow: the finder picks the product out of the photos, then **Which one is it?** or the details.
- **The browser can also be opened by hand** from the link screen after any error ("Open the page in Rotation's browser").
- **Only product pages are added.** A page with no price and no brand, like a category or home page, gets "This isn't a product page. Open the piece you want, then tap Add this piece."
- **On the web app**, a blocked store still gets the screenshot advice. A browser extension or bookmarklet is the web counterpart, not built yet.

## Why

- **It works for nearly every store at once,** with no list of stores to keep up.
- **It's honest.** The person is a real visitor in a real browser; Rotation reads what they see. Nothing pretends to be a person.
- **It's free and needs no server,** in keeping with the phone reading pages on its own ([019](019-product-links-on-the-phone.md)).

## Consequences

- The browser runs in Expo Go too; `react-native-webview` was already in the app for the piece finder.
- Rotation's browser gives the same app name Safari does, since some stores turn away browsers they don't recognize.
- Some bot protection may still flag in-app browsers. The screenshot path stays for those.
- Not tried on an iPhone yet: the reading and photo loading were checked on Nordstrom and Madewell in a desktop browser, and the iOS build compiles.
- Next: "Share to Rotation" from Safari (a share extension, in the development build), and a bookmarklet or extension for the web app.
