---
"@intl-party/nextjs": minor
"@intl-party/cli": minor
---

Locale-prefixed URLs and working locale switching.

- `localePrefix: "as-needed"` and `"always"` now work with `createSetup` and pages under `app/[locale]/`. With `"as-needed"`, the middleware now serves unprefixed default-locale URLs from the `[locale]` route (`/about` → `/en/about` internally). Before, they fell through and 404ed.
- `setLocale` from `useLocale()` used to switch to a locale whose messages weren't loaded, rendering `[namespace:key]` placeholders. When the server supplies the locale (`<Provider locale={…}>`), it now saves the cookie and either re-renders with the new locale's messages (clean URLs) or navigates to the localized URL (prefixed URLs). `createSetup` returns `routing` for `<Provider routing={routing}>`. The Provider also follows a new server-supplied `locale` prop.
- New `localizePath(path, locale, routing)` helper. `useLocale` is now exported from `@intl-party/nextjs` as well as `/client`.
- `intl-party nextjs --init --locale-prefix as-needed|always` scaffolds the `app/[locale]/` layout. The generated config uses `satisfies SetupConfig`, the layout passes `routing`, and the example page includes a language switcher.
