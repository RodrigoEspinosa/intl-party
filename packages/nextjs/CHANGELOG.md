# @intl-party/nextjs

## 1.1.1

### Patch Changes

- 7cb5b05: Enhanced Next.js integration with proper server/client separation and next-intl compatibility APIs. Added conditional exports with react-server conditions, server-only translation utilities, and compatibility functions for seamless migration from next-intl.
- Updated dependencies [7cb5b05]
  - @intl-party/react@1.1.1

## 1.1.0

### Minor Changes

- 4136ede: Add support for cookie-based locale storage and next-intl compatibility

### Patch Changes

- Updated dependencies [4136ede]
  - @intl-party/react@1.1.0

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
  - @intl-party/react@1.0.0
