# Supabase

Rotation's accounts and sync ([decision 013](../docs/process/decisions/013-optional-accounts-and-sync.md)) use the Supabase project **games-apps** (`ssmiunjctsigikbwdfpc`). That project also hosts other apps, so Rotation keeps to itself:

| What | Name |
| --- | --- |
| Schema | `rotation` |
| Table | `rotation.records`: one row per piece, outfit, planned day, wear, settings and shopping list, as JSON |
| Photo bucket | `rotation-photos` (private), one folder per account |

Row-level security locks every row and photo to its owner. The browser only holds the publishable key.

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
- **Redirect URLs** (Authentication → URL Configuration). Add `http://localhost:3000/**` and the app's public address, so sign-in links land back in Rotation.
- **Email sender.** Supabase's built-in sender only reaches the project's team. A custom sender (SMTP) is needed before inviting anyone else.
