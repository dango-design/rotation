# Supabase

Rotation's accounts and sync ([decision 013](../docs/process/decisions/013-optional-accounts-and-sync.md)) use the Supabase project **games-apps** (`ssmiunjctsigikbwdfpc`). That project also hosts other apps, so Rotation keeps to itself:

| What | Name |
| --- | --- |
| Schema | `rotation` |
| Table | `rotation.records`: one row per piece, outfit, planned day, wear, settings and shopping list, as JSON |
| Photo bucket | `rotation-photos` (private), one folder per account |

Row-level security locks every row and photo to its owner. The browser only holds the publishable key.

Claude photo tagging is counted in `rotation.tag_uses`, with no-limit accounts listed in `rotation.tag_approved` ([decision 027](../docs/process/decisions/027-public-site-and-tagging-limits.md)). The browser can't read either table, and only reaches them through `rotation.claim_tag()` and `rotation.tag_status()`. The limits are in `rotation.tag_limits()`. To approve someone, add the email they sign in with:

```sql
insert into rotation.tag_approved (email, note) values ('someone@example.com', 'friend testing the app');
```

## Applying a migration

Other apps' migrations are in the same project's history, so **don't use `supabase db push`** (it expects this folder to hold every migration in the project) **or `supabase config push`** (it would overwrite the sign-in settings every app shares). Run each file directly instead:

```bash
npx supabase@2.120.0 login
npx supabase@2.120.0 db query --linked --project-ref ssmiunjctsigikbwdfpc -f supabase/migrations/20261010042615_rotation_closet_sync.sql
```

The first migration then needs `rotation` added to the exposed schemas: Dashboard → Project Settings → Data API → Exposed schemas.

## Settings shared with the other apps

Changing these affects every app in the project, so check before changing them:

- **Sign-in email template** (Authentication → Emails → Magic Link). To send a code, the template needs `{{ .Token }}`. Keeping the link (`{{ .ConfirmationURL }}`) beside it leaves the other apps' links working.
- **Redirect URLs** (Authentication → URL Configuration). Add `http://localhost:3000/**`, `https://rotation-mu.vercel.app/**` and, for pull request previews, `https://rotation-*-dango-designs-projects.vercel.app/**`, so sign-in links land back in Rotation.
- **Email sender.** Supabase's built-in sender only reaches the project's team. A custom sender (SMTP) is needed before inviting anyone else.
