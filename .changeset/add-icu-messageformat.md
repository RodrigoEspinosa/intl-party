---
"@intl-party/core": minor
"@intl-party/client": minor
---

Add ICU MessageFormat support for advanced pluralization and select formatting

- Added auto-detection of ICU vs legacy `{{variable}}` format per message
- Support for ICU plural rules (one/other, few/many for complex locales like Russian)
- Support for ICU select formatting (gender, etc.)
- LRU cache for compiled ICU messages (500 entries) for performance
- Optional `intl-messageformat` peer dependency (~15KB gzipped)
- Both formats can coexist in the same project

New exports from `@intl-party/core`:
- `isICUFormat(text)` - detect ICU format patterns
- `isLegacyFormat(text)` - detect legacy `{{var}}` patterns
- `detectMessageFormat(text)` - returns 'icu' | 'legacy' | 'plain'
- `formatICUMessage(message, locale, values)` - format ICU messages
- `isICULibraryAvailable()` - check if intl-messageformat is installed
- `clearICUCache()` - clear compiled message cache
- `getICUCacheStats()` - get cache statistics
- `MessageFormatConfig` type
- `DEFAULT_MESSAGE_FORMAT_CONFIG` constant

Example usage:
```typescript
// ICU plural
i18n.t("items", { count: 5 });
// Message: "{count, plural, one {# item} other {# items}}"
// Output: "5 items"

// ICU select
i18n.t("pronoun", { interpolation: { gender: "female" } });
// Message: "{gender, select, male {He} female {She} other {They}}"
// Output: "She"

// Legacy format still works
i18n.t("greeting", { interpolation: { name: "World" } });
// Message: "Hello {{name}}!"
// Output: "Hello World!"
```
