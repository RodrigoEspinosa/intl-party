# IntlParty 🎉

A comprehensive, type-safe internationalization (i18n) library for modern web applications. Built with TypeScript-first approach and designed for exceptional developer experience.

## ✨ Features

- **🔒 Type-Safe**: Full TypeScript support with auto-completion for translation keys
- **🎯 Framework Agnostic**: Core library works with any JavaScript framework
- **⚛️ React Integration**: Dedicated hooks, context, and components for React
- **🔄 Next.js Support**: First-class support for both App Router and Pages Router
- **🌍 Advanced Locale Detection**: Intelligent locale detection from various sources
- **✅ Validation Tools**: Comprehensive validation and consistency checking
- **🛠️ CLI Tools**: Command-line interface for translation management
- **📊 Developer Experience**: ESLint plugin, VS Code extension, and debugging tools
- **🚀 Performance**: Lazy loading, caching, and tree-shaking optimized

## 📦 Packages

This monorepo contains the following packages:

- **[@intl-party/core](./packages/core)** - Core internationalization library
- **[@intl-party/react](./packages/react)** - React integration with hooks and components
- **[@intl-party/nextjs](./packages/nextjs)** - Next.js integration for App and Pages Router
- **[@intl-party/cli](./packages/cli)** - Command-line tools for translation management
- **[@intl-party/eslint-plugin](./packages/eslint-plugin)** - ESLint rules for i18n best practices

## 🚀 Quick Start

### Installation

```bash
# Core library
npm install @intl-party/core

# React integration
npm install @intl-party/react

# Next.js integration
npm install @intl-party/nextjs

# CLI tools
npm install -g @intl-party/cli
```

### Basic Usage

```typescript
import { createI18n } from "@intl-party/core";

// Create i18n instance
const i18n = createI18n({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["common", "auth"],
  fallbackChain: { es: "en", fr: "en" },
});

// Add translations
i18n.addTranslations("en", "common", {
  welcome: "Welcome to IntlParty!",
  hello: "Hello {{name}}!",
});

// Use translations
const message = i18n.t("welcome"); // "Welcome to IntlParty!"
const greeting = i18n.t("hello", { interpolation: { name: "World" } }); // "Hello World!"
```

### React Usage

```tsx
import { I18nProvider, useTranslations } from "@intl-party/react";

function App() {
  return (
    <I18nProvider config={i18nConfig}>
      <Welcome />
    </I18nProvider>
  );
}

function Welcome() {
  const t = useTranslations("common");

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
```

### Next.js App Router

```tsx
// app/[locale]/layout.tsx
import { AppI18nProvider } from "@intl-party/nextjs/app";

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <AppI18nProvider locale={locale} config={i18nConfig}>
      {children}
    </AppI18nProvider>
  );
}
```

## 🎯 Why IntlParty?

### Type Safety First

IntlParty provides complete type safety for your translation keys with auto-completion:

```typescript
// Define your translation structure
interface Translations {
  common: {
    welcome: string;
    navigation: {
      home: string;
      about: string;
    };
  };
}

// Get fully typed translation function
const t = useTypedTranslations<Translations["common"]>();
t("navigation.home"); // ✅ Type-safe and auto-completed
t("invalid.key"); // ❌ TypeScript error
```

### Advanced Locale Detection

Smart locale detection from multiple sources:

```typescript
const i18n = createI18n({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  detection: {
    strategies: [
      "localStorage", // User preference
      "cookie", // Server-side persistence
      "acceptLanguage", // Browser setting
      "geographic", // Country-based detection
      "queryParam", // URL parameter
      "path", // URL path segment
    ],
  },
});
```

### Comprehensive Validation

Ensure translation consistency across your application:

```bash
# Validate all translations
intl-party validate

# Check for missing translations
intl-party check --missing

# Extract translation keys from code
intl-party extract --source "src/**/*.{ts,tsx}"

# Sync translations across locales
intl-party sync --base en --target es,fr
```

## 📚 Documentation

- [Getting Started Guide](./docs/getting-started.md)
- [Core Concepts](./docs/concepts.md)
- [React Integration](./docs/react.md)
- [Next.js Integration](./docs/nextjs.md)
- [CLI Reference](./docs/cli.md)
- [API Reference](./docs/api.md)
- [Migration Guide](./docs/migration.md)
- [Examples](./examples)

## 🔧 Development

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Setup

```bash
# Clone the repository
git clone https://github.com/intl-party/intl-party.git
cd intl-party

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start development mode
pnpm dev
```

### Project Structure

```
intl-party/
├── packages/
│   ├── core/           # Core library
│   ├── react/          # React integration
│   ├── nextjs/         # Next.js integration
│   ├── cli/            # CLI tools
│   └── eslint-plugin/  # ESLint plugin
├── examples/
│   ├── nextjs-app-router/
│   ├── react-spa/
│   └── vanilla-js/
├── docs/               # Documentation
└── apps/               # Internal tooling apps
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork and clone the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and add tests
4. Run the test suite: `pnpm test`
5. Commit your changes: `git commit -m 'Add my feature'`
6. Push to your fork: `git push origin feature/my-feature`
7. Create a Pull Request

## 📄 License

MIT © [IntlParty Team](./LICENSE)

## 🙏 Acknowledgments

IntlParty is inspired by and builds upon the excellent work of:

- [react-i18next](https://github.com/i18next/react-i18next)
- [next-intl](https://github.com/amannn/next-intl)
- [FormatJS](https://github.com/formatjs/formatjs)

Special thanks to the open-source community for their contributions to internationalization tooling.

---

**Made with ❤️ by the IntlParty team**
