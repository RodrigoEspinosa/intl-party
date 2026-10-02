# @intl-party/client

## 1.7.0

### Patch Changes

- Updated dependencies [81239e8]
  - @intl-party/core@1.7.0

## 1.6.0

### Patch Changes

- Updated dependencies [bc55192]
- Updated dependencies [0e51a7b]
  - @intl-party/core@1.6.0

## 1.5.0

### Patch Changes

- 08ce400: Type-checked translation keys.
  - `useTranslations(namespace)` (from `@intl-party/react` and `@intl-party/nextjs`) and `useScopedTranslations` now only accept keys that exist in the namespace, and reject unknown namespaces, once messages are registered on the new `IntlPartyRegister` interface. Nothing changes until you register messages.
  - `intl-party generate --types` and `intl-party nextjs --init` write an `intl-party.d.ts` that registers the default locale's JSON files. It augments the intl-party package the project depends on.
  - New `useUntypedTranslations` in `@intl-party/react` for keys built at runtime.
  - The CLI's `--config` flag no longer defaults to `intl-party.config.js`, so commands auto-detect `intl-party.config.ts`. `generate` also understands the `messages: "./messages"` config written by `nextjs --init`.
  - `@intl-party/nextjs` and `@intl-party/client` add `typesVersions`, so their subpath entries (`/client`, `/server`, `/runtime`) have types under `"moduleResolution": "node"`, which Next.js 13–14 use by default.

- Updated dependencies [08ce400]
  - @intl-party/core@1.5.0

## 1.4.0

### Patch Changes

- 2473750: Improve npm discoverability: expand package keywords and add a README for `@intl-party/react-native`.
- Updated dependencies [2473750]
  - @intl-party/core@1.4.0

## 1.3.2

### Patch Changes

- Updated dependencies [9d10d48]
  - @intl-party/core@1.3.2

## 1.3.1

### Patch Changes

- Updated dependencies [2f936f0]
  - @intl-party/core@1.3.1

## 1.3.0

### Minor Changes

- Improve test coverage, fix JSON format issues, and update dependencies

### Patch Changes

- Updated dependencies
  - @intl-party/core@1.3.0
  - @intl-party/react@1.2.0

## 1.2.0

### Minor Changes

- 88dd642: Add ICU MessageFormat support for advanced pluralization and select formatting
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

### Patch Changes

- Updated dependencies [88dd642]
  - @intl-party/core@1.2.0
  - @intl-party/react@1.1.4
