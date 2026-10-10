# @intl-party/react

## 1.10.0

### Minor Changes

- d07b947: Require Node.js 22.12 or later. Node 20 reached end of life in April 2026.

  - `@intl-party/cli`: update commander, chalk, chokidar, glob, ora and inquirer to their latest majors (bundled into the CLI, so nothing changes for users).
  - `@intl-party/core`, `@intl-party/nextjs`: update `@formatjs/intl-localematcher` to 0.9.
  - `@intl-party/nextjs`: update chokidar to 5. The client entry now uses the automatic JSX runtime (`react/jsx-runtime`), the same as `@intl-party/react`.

### Patch Changes

- Updated dependencies [d07b947]
  - @intl-party/core@1.10.0

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

### Minor Changes

- 08ce400: Type-checked translation keys.
  - `useTranslations(namespace)` (from `@intl-party/react` and `@intl-party/nextjs`) and `useScopedTranslations` now only accept keys that exist in the namespace, and reject unknown namespaces, once messages are registered on the new `IntlPartyRegister` interface. Nothing changes until you register messages.
  - `intl-party generate --types` and `intl-party nextjs --init` write an `intl-party.d.ts` that registers the default locale's JSON files. It augments the intl-party package the project depends on.
  - New `useUntypedTranslations` in `@intl-party/react` for keys built at runtime.
  - The CLI's `--config` flag no longer defaults to `intl-party.config.js`, so commands auto-detect `intl-party.config.ts`. `generate` also understands the `messages: "./messages"` config written by `nextjs --init`.
  - `@intl-party/nextjs` and `@intl-party/client` add `typesVersions`, so their subpath entries (`/client`, `/server`, `/runtime`) have types under `"moduleResolution": "node"`, which Next.js 13–14 use by default.

### Patch Changes

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

## 1.2.0

### Minor Changes

- Improve test coverage, fix JSON format issues, and update dependencies

### Patch Changes

- Updated dependencies
  - @intl-party/core@1.3.0

## 1.1.4

### Patch Changes

- Updated dependencies [88dd642]
  - @intl-party/core@1.2.0

## 1.1.3

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

- Updated dependencies
  - @intl-party/core@1.0.2

## 1.1.1

### Patch Changes

- 7cb5b05: Enhanced Next.js integration with proper server/client separation and next-intl compatibility APIs. Added conditional exports with react-server conditions, server-only translation utilities, and compatibility functions for seamless migration from next-intl.

## 1.1.0

### Minor Changes

- 4136ede: Add support for cookie-based locale storage and next-intl compatibility

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

### Patch Changes

- Updated dependencies
  - @intl-party/core@1.0.0
