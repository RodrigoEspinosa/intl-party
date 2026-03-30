# @intl-party/core

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
