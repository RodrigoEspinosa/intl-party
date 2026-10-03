# @intl-party/core

## 1.10.0

### Minor Changes

- d07b947: Require Node.js 22.12 or later. Node 20 reached end of life in April 2026.

  - `@intl-party/cli`: update commander, chalk, chokidar, glob, ora and inquirer to their latest majors (bundled into the CLI, so nothing changes for users).
  - `@intl-party/core`, `@intl-party/nextjs`: update `@formatjs/intl-localematcher` to 0.9.
  - `@intl-party/nextjs`: update chokidar to 5. The client entry now uses the automatic JSX runtime (`react/jsx-runtime`), the same as `@intl-party/react`.

## 1.7.0

### Minor Changes

- 81239e8: Support i18next-style plural keys. With a `count`, `t("items", { count })` now resolves `items_zero` (for 0), then `items_<category>` using the locale's plural rules (`one`, `few`, `many`, …), then `items_other`. So react-i18next message files work unchanged. An exact `items` key still takes precedence.

  In development, a one-time warning now explains that ICU plural/select messages need the optional `intl-messageformat` package. Before, they rendered their raw ICU text without explanation.

## 1.6.0

### Minor Changes

- bc55192: Missing translations now fall back to the default locale. Before, without a `fallbackChain` entry, a key missing from the current locale rendered as `[namespace:key]` even when the default locale had it. Every fallback chain now ends at `defaultLocale` (e.g. `{ fr: "es" }` resolves fr → es → en), and `getFallbackChain()` reports it. `hasTranslation()` follows the same chain, so it returns `true` when only the default locale has the key; use `validateTranslations()` to find gaps in one locale. Cached lookups are now refreshed when any locale further down a chain changes, not only the next one.

### Patch Changes

- 0e51a7b: Legacy plural messages (`"{{count|item|items}}"`) now use a numeric `count` from the interpolation values when no `count` option is given. The Next.js `useTranslations` hook's `t("items", { count: 2 })` returned the raw template before.

## 1.5.0

### Minor Changes

- 08ce400: Type-checked translation keys.
  - `useTranslations(namespace)` (from `@intl-party/react` and `@intl-party/nextjs`) and `useScopedTranslations` now only accept keys that exist in the namespace, and reject unknown namespaces, once messages are registered on the new `IntlPartyRegister` interface. Nothing changes until you register messages.
  - `intl-party generate --types` and `intl-party nextjs --init` write an `intl-party.d.ts` that registers the default locale's JSON files. It augments the intl-party package the project depends on.
  - New `useUntypedTranslations` in `@intl-party/react` for keys built at runtime.
  - The CLI's `--config` flag no longer defaults to `intl-party.config.js`, so commands auto-detect `intl-party.config.ts`. `generate` also understands the `messages: "./messages"` config written by `nextjs --init`.
  - `@intl-party/nextjs` and `@intl-party/client` add `typesVersions`, so their subpath entries (`/client`, `/server`, `/runtime`) have types under `"moduleResolution": "node"`, which Next.js 13–14 use by default.

## 1.4.0

### Patch Changes

- 2473750: Improve npm discoverability: expand package keywords and add a README for `@intl-party/react-native`.

## 1.3.2

### Patch Changes

- 9d10d48: Ignore malformed locale cookie encoding so detection can continue to later strategies. Persist locale changes when sessionStorage is configured, with storage failures reported through the existing error handler. Remove an unreachable unused-key validation loop.

## 1.3.1

### Patch Changes

- 2f936f0: Fix `createStableCacheKey` collapsing every set of interpolated values into one cache key.

  `JSON.stringify`'s array replacer is an allow-list applied at every depth, so
  `interpolation`'s own keys were filtered out and all interpolated values
  serialised identically. `TranslationStore.getTranslation` derives its cache key
  from that string, so the first value rendered for a key was cached and returned
  for every later call regardless of the values passed.

  Anything with a live count, total, timer, or name went stale after first paint.
  The fix landed on master in aa058aa (#29) but was never published; `latest`
  (1.3.0) still carries the bug.

  Closes #33.

## 1.3.0

### Minor Changes

- Improve test coverage, fix JSON format issues, and update dependencies

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

## 1.0.2

### Patch Changes

- ## 🚀 Major Improvements & Bug Fixes

  ### **Core Package (@intl-party/core)**
  - Fixed locale detection tests with proper navigator mocking
  - Resolved validation test issues with complete translation sets
  - Improved SSR compatibility and error handling

  ### **React Package (@intl-party/react)**
  - Added SSR fallback context handling for server-side rendering
  - Fixed React context issues during static generation
  - Improved error boundary handling and test coverage
  - Added comprehensive test infrastructure

  ### **NextJS Package (@intl-party/nextjs)**
  - Enhanced SSR/SSG compatibility with dynamic rendering
  - Fixed context provider issues in Next.js environments
  - Improved server-side translation loading

  ### **CLI Package (@intl-party/cli)**
  - Added basic test infrastructure and setup
  - Improved command-line tool reliability
  - Enhanced error handling and user feedback

  ### **ESLint Plugin (@intl-party/eslint-plugin)**
  - **Major TypeScript compatibility fixes**
  - Resolved all compilation errors in CI builds
  - Fixed ESLint rule type definitions and option schemas
  - Added proper TypeScript interfaces for all rules
  - Improved rule validation and error handling

  ### **Infrastructure & CI**
  - **Added comprehensive ESLint configuration** for all packages
  - Fixed test execution mode (single-run vs watch mode)
  - Optimized CI workflow to skip unnecessary publish attempts
  - Added proper test setup files for all packages
  - Improved build reliability and type safety

  ### **Testing**
  - **All tests now pass** across all packages
  - Fixed React error boundary test issues
  - Added missing test files and infrastructure
  - Improved test coverage and reliability

  This release includes significant improvements to build reliability, testing infrastructure, and TypeScript compatibility across all packages.

## 1.0.0

### Major Changes

- 🎉 Initial release of IntlParty - A comprehensive, type-safe internationalization library

  ### Features

  #### @intl-party/core
  - Type-safe translation system with namespace support
  - Advanced locale detection from multiple sources
  - Comprehensive validation and error handling
  - Performance optimized with caching and lazy loading
  - Event system for real-time updates

  #### @intl-party/react
  - React hooks: useTranslations, useLocale, useNamespace
  - Context providers with scoped translation support
  - React components: Trans, LocaleSelector, PluralTrans
  - Error boundaries and loading state management
  - Full TypeScript integration

  #### @intl-party/nextjs
  - Next.js App Router support with server components
  - Intelligent middleware for locale routing
  - Static generation and metadata helpers
  - Server actions for locale switching

  #### @intl-party/cli
  - Project initialization with templates
  - Translation validation and consistency checking
  - Key extraction from source code
  - Multiple output formats

  #### @intl-party/eslint-plugin
  - Rules for detecting hardcoded strings
  - Translation key validation
  - Auto-fixing capabilities

  ### Technical Highlights
  - Zero runtime dependencies in core
  - Tree-shaking optimized
  - SSR/SSG ready
  - Comprehensive test suite
  - Monorepo with proper tooling
