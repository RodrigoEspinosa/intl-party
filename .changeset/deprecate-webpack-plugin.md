---
"@intl-party/nextjs": minor
---

Deprecate the `@intl-party/nextjs/webpack-plugin` entry: `withIntlParty`, `createNextConfigWithIntl`, `withIntlPartyHotReload`, and `IntlPartyHotReloadPlugin`. Each now warns once when used, and the entry will be removed in the next major version. These add a webpack hook, which fails Next.js 16 builds (Turbopack is the default), and they're no longer needed: message edits apply on reload, and `intl-party.d.ts` imports your JSON directly. Remove them from `next.config`. See #41.
