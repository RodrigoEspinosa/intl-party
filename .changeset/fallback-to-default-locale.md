---
"@intl-party/core": minor
---

Missing translations now fall back to the default locale. Before, without a `fallbackChain` entry, a key missing from the current locale rendered as `[namespace:key]` even when the default locale had it. Every fallback chain now ends at `defaultLocale` (e.g. `{ fr: "es" }` resolves fr → es → en), and `getFallbackChain()` reports it. `hasTranslation()` follows the same chain, so it returns `true` when only the default locale has the key; use `validateTranslations()` to find gaps in one locale. Cached lookups are now refreshed when any locale further down a chain changes, not only the next one.
