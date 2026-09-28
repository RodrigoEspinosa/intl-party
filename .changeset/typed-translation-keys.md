---
"@intl-party/core": minor
"@intl-party/react": minor
"@intl-party/nextjs": minor
"@intl-party/cli": minor
"@intl-party/client": patch
---

Type-checked translation keys.

- `useTranslations(namespace)` (from `@intl-party/react` and `@intl-party/nextjs`) and `useScopedTranslations` now only accept keys that exist in the namespace, and reject unknown namespaces, once messages are registered on the new `IntlPartyRegister` interface. Nothing changes until you register messages.
- `intl-party generate --types` and `intl-party nextjs --init` write an `intl-party.d.ts` that registers the default locale's JSON files. It augments the intl-party package the project depends on.
- New `useUntypedTranslations` in `@intl-party/react` for keys built at runtime.
- The CLI's `--config` flag no longer defaults to `intl-party.config.js`, so commands auto-detect `intl-party.config.ts`. `generate` also understands the `messages: "./messages"` config written by `nextjs --init`.
- `@intl-party/nextjs` and `@intl-party/client` add `typesVersions`, so their subpath entries (`/client`, `/server`, `/runtime`) have types under `"moduleResolution": "node"`, which Next.js 13–14 use by default.
