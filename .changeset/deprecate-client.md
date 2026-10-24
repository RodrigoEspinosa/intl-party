---
"@intl-party/client": minor
"@intl-party/cli": minor
---

Deprecate `@intl-party/client` and `intl-party generate --client`. Both now warn once when used, and both will be removed in the next major version. The package never read the files `generate --client` writes, so its `TranslationKey` accepted any string. Its `t()` also skipped the default-locale fallback and plurals. Use `createI18n` from `@intl-party/core`, and `generate --types` for type-checked keys. See #80.
