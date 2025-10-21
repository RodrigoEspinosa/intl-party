# IntlParty 🎉

The **easiest and most developer-friendly** internationalization (i18n) library for Next.js with TypeScript. Built with zero-config setup and perfect TypeScript integration.

## ✨ Why Choose IntlParty?

- **🚀 Zero-Config Setup**: Get started in 2 minutes, not 2 hours
- **🔒 Perfect TypeScript**: Full type safety with auto-completion, no casting required
- **⚡ Next.js Native**: Built specifically for Next.js App Router with SSR/SSG
- **🌍 Clean URLs**: No more ugly `/en/` prefixes (optional)
- **🎯 Developer First**: Intuitive API that just works
- **🛠️ Automatic**: Type generation, message loading, and hot reloading

## 🚀 Quick Start (Next.js)

### 1. Installation

```bash
npm install @intl-party/nextjs
# or
pnpm add @intl-party/nextjs
# or
yarn add @intl-party/nextjs
```

### 2. Initialize (One Command)

```bash
npx intl-party nextjs --init --simplified
```

This creates:

- `intl-party.config.ts` - Your i18n configuration
- `middleware.ts` - Automatic locale detection
- `messages/` - Sample translation files
- Example layout and page components

### 3. Start Using

```tsx
// app/page.tsx
import { useSimplifiedTranslations } from "@intl-party/nextjs";

export default function HomePage() {
  const t = useSimplifiedTranslations("common");

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("description", { name: "John" })}</p>
    </div>
  );
}
```

That's it! 🎉 Your app is now internationalized with full TypeScript support.

## 📁 Project Structure

```
your-app/
├── intl-party.config.ts     # Your i18n config
├── middleware.ts            # Automatic locale detection
├── messages/               # Translation files
│   ├── en/
│   │   └── common.json
│   ├── es/
│   │   └── common.json
│   └── fr/
│       └── common.json
└── app/
    ├── layout.tsx           # Auto-configured
    └── page.tsx            # Use translations
```

## 🔧 Configuration

Create `intl-party.config.ts` in your project root:

```typescript
// intl-party.config.ts
export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  messages: "./messages", // Optional - defaults to "./messages"

  // Advanced options (optional)
  // localePrefix: "never", // Clean URLs without /en/ prefix
  // cookieName: "INTL_LOCALE", // Cookie name for locale storage
};
```

## 🎯 API Reference

### `useSimplifiedTranslations(namespace?)`

The main hook for using translations.

```tsx
// Without namespace (uses default)
const t = useSimplifiedTranslations();

// With namespace
const t = useSimplifiedTranslations("common");

// Simple usage
t("welcome"); // "Welcome!"

// With interpolation
t("greeting", { name: "John" }); // "Hello John!"

// Nested keys
t("navigation.home"); // "Home"
```

### `createSimplifiedSetup(config)`

Creates the complete i18n setup for Next.js.

```typescript
import { createSimplifiedSetup } from "@intl-party/nextjs";
import config from "./intl-party.config";

const {
  middleware, // Next.js middleware
  middlewareConfig, // Middleware matcher config
  getLocale, // Server-side locale detection
  getMessages, // Server-side message loading
  Provider, // React provider
} = createSimplifiedSetup(config);
```

## 🌐 Translation Files

Translation files are simple JSON:

```json
// messages/en/common.json
{
  "welcome": "Welcome to IntlParty!",
  "description": "A modern i18n solution for Next.js",
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "greeting": "Hello {{name}}!"
}
```

```json
// messages/es/common.json
{
  "welcome": "¡Bienvenido a IntlParty!",
  "description": "Una solución i18n moderna para Next.js",
  "navigation": {
    "home": "Inicio",
    "about": "Acerca de",
    "contact": "Contacto"
  },
  "greeting": "¡Hola {{name}}!"
}
```

## 🏗️ Setup Examples

### Middleware (Automatic)

```typescript
// middleware.ts
import { createSimplifiedSetup } from "@intl-party/nextjs";
import config from "./intl-party.config";

const { middleware, middlewareConfig } = createSimplifiedSetup(config);

export { middleware };
export const config = middlewareConfig;
```

### Layout (Automatic SSR)

```tsx
// app/layout.tsx
import { createSimplifiedSetup } from "@intl-party/nextjs";
import config from "../intl-party.config";

const { getLocale, getMessages, Provider } = createSimplifiedSetup(config);

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <Provider locale={locale} initialMessages={messages}>
          {children}
        </Provider>
      </body>
    </html>
  );
}
```

### Next.js Config Integration

```javascript
// next.config.js
const { createNextConfigWithIntl } = require("@intl-party/nextjs");

module.exports = createNextConfigWithIntl(
  {
    i18nConfig: {
      locales: ["en", "es", "fr"],
      defaultLocale: "en",
      messages: "./messages",
    },
    autoGenerate: true, // Auto-generate types during build
    watchMode: true, // Watch for changes in development
  },
  {
    // Your existing Next.js config
    reactStrictMode: true,
    swcMinify: true,
  },
);
```

## 🎨 Advanced Features

### Clean URLs (Default)

By default, IntlParty uses cookie-based locale detection for clean URLs:

```
✅ Clean URLs:
  /about          # Shows in user's preferred language
  /contact        # Shows in user's preferred language

❌ Traditional URLs:
  /en/about        # English version
  /es/about        # Spanish version
  /fr/about        # French version
```

### URL Prefixes (Optional)

If you prefer URL prefixes, just change the config:

```typescript
// intl-party.config.ts
export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  localePrefix: "always", // or "as-needed"
};
```

### Automatic Type Generation

Get full TypeScript support without any manual work:

```typescript
// Fully typed translation keys
const t = useSimplifiedTranslations("common");

t("welcome"); // ✅ Type-safe
t("navigation.home"); // ✅ Type-safe
t("invalid.key"); // ❌ TypeScript error

// Auto-completion works everywhere
t("nav"); // → suggests "navigation"
```

### Hot Reloading

Translation changes automatically reload in development:

1. Edit `messages/en/common.json`
2. Save the file
3. See changes immediately in your browser

## 🛠️ CLI Commands

### Initialize Project

```bash
# Initialize with simplified setup (recommended)
npx intl-party nextjs --init --simplified

# Initialize with traditional setup
npx intl-party nextjs --init
```

### Generate Types

```bash
# Generate TypeScript types
npx intl-party generate --types

# Watch for changes
npx intl-party generate --types --watch
```

### Validate Translations

```bash
# Check for missing translations
npx intl-party check --missing

# Validate all translations
npx intl-party validate
```

## 📦 Packages

- **[@intl-party/nextjs](./packages/nextjs)** - Next.js integration (main package)
- **[@intl-party/core](./packages/core)** - Core internationalization library
- **[@intl-party/react](./packages/react)** - React hooks and components
- **[@intl-party/cli](./packages/cli)** - Command-line tools

## 🆚 Comparison

| Feature                  | IntlParty   | next-intl  | react-i18next       |
| ------------------------ | ----------- | ---------- | ------------------- |
| **Setup Time**           | 2 minutes   | 15 minutes | 30 minutes          |
| **Type Safety**          | ✅ Perfect  | ✅ Good    | ⚠️ Requires casting |
| **Clean URLs**           | ✅ Default  | ⚠️ Complex | ⚠️ Manual           |
| **Next.js App Router**   | ✅ Native   | ✅ Good    | ⚠️ Limited          |
| **Auto Type Generation** | ✅ Built-in | ⚠️ Manual  | ❌ None             |
| **Hot Reloading**        | ✅ Built-in | ⚠️ Manual  | ❌ None             |
| **Learning Curve**       | 🟢 Easy     | 🟡 Medium  | 🔴 Hard             |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/intl-party/intl-party.git
cd intl-party

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development
pnpm dev
```

## 📄 License

MIT © [IntlParty Team](./LICENSE)

---

**Made with ❤️ for the Next.js community**

## 🙏 Acknowledgments

Inspired by the excellent work of:

- [next-intl](https://github.com/amannn/next-intl)
- [react-i18next](https://github.com/i18next/react-i18next)
- [FormatJS](https://github.com/formatjs/formatjs)

But built from the ground up for the **easiest possible developer experience** with Next.js and TypeScript.
