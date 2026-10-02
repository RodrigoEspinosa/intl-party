# IntlParty Next.js starter

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/RodrigoEspinosa/intl-party/tree/master/examples/nextjs-starter)

A Next.js App Router app set up with `npx intl-party nextjs --init`, using the published packages. It shows:

- English, Spanish, and French with clean URLs (`/` in every language)
- The language picked from the browser, remembered in a cookie
- A language switcher (`useLocale`)
- Type-checked keys: try `t("welcom")` in `app/page.tsx`

## Run it

```bash
npm install
npm run dev
```

## Try

- Edit `messages/es/common.json` and reload.
- Add `localePrefix: "as-needed"` to `intl-party.config.ts` and move `app/layout.tsx` and `app/page.tsx` into `app/[locale]/` for `/es`-style URLs.
- Delete a key from `messages/fr/common.json`, then run `npm run i18n:check`.

See the [IntlParty README](../../README.md) for the full docs.
