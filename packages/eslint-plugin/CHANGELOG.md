# @intl-party/eslint-plugin

## 1.6.0

### Patch Changes

- 4939f0c: `prefer-translation-hooks` now offers the `i18n.t` → `t` rewrite as an editor suggestion instead of an autofix, so `eslint --fix` no longer produces code that references an undefined `t`.
- eb1e9e5: `no-missing-keys` resolves keys inside the namespace of the translator they're called on (`const t = useTranslations("common")`), so nested keys like `t("navigation.home")` are no longer reported as missing. Translators with any variable name are checked. `prefer-translation-hooks` no longer suggests scoping for nested keys on a translator that's already scoped.

## 1.4.0

### Patch Changes

- 2473750: Improve npm discoverability: expand package keywords and add a README for `@intl-party/react-native`.

## 1.2.0

### Minor Changes

- Improve test coverage, fix JSON format issues, and update dependencies

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
