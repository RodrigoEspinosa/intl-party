# @intl-party/nextjs

**The easiest Next.js internationalization solution with perfect TypeScript support.**

## ✨ Features

- **🚀 Zero-Config Setup**: Get started in 2 minutes
- **🔒 Perfect TypeScript**: Full type safety, no casting required
- **⚡ Next.js Native**: Built for App Router with SSR/SSG
- **🌍 Clean URLs**: No ugly `/en/` prefixes by default
- **🎯 Developer First**: Intuitive API that just works
- **🛠️ Automatic**: Type generation and hot reloading

## 🚀 Quick Start

### 1. Installation

```bash
npm install @intl-party/nextjs
```

### 2. Initialize

```bash
npx intl-party nextjs --init
```

### 3. Use

```tsx
import { useTranslations } from "@intl-party/nextjs";

export default function Page() {
  const t = useTranslations("common");
  return <h1>{t("welcome")}</h1>;
}
```

## 📁 Configuration

Create `intl-party.config.ts` in your project root:

```typescript
export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  messages: "./messages",
};
```

## 🎯 API Reference

### Setup

```typescript
import { createSetup } from "@intl-party/nextjs";
import config from "./intl-party.config";

const {
  middleware, // Next.js middleware
  middlewareConfig, // Middleware matcher config
  getLocale, // Server-side locale detection
  getMessages, // Server-side message loading
  Provider, // React provider
} = createSetup(config);
```

### Hooks

#### `useTranslations(namespace?)`

The main hook for using translations.

```tsx
// Without namespace
const t = useTranslations();

// With namespace
const t = useTranslations("common");

// Usage
t("welcome"); // "Welcome!"
t("greeting", { name: "John" }); // "Hello John!"
t("navigation.home"); // "Home"
```

### Configuration Types

```typescript
interface I18nConfig {
  // Required
  locales: string[];
  defaultLocale: string;

  // Optional with smart defaults
  messages?: string; // Path to messages directory (default: "./messages")
  namespaces?: string[]; // Auto-detected if not provided
  localePrefix?: "always" | "as-needed" | "never"; // Default: "never"
  cookieName?: string; // Default: "INTL_LOCALE"
}
```

## 🏗️ Setup Examples

### Middleware

```typescript
// middleware.ts
import { createSetup } from "@intl-party/nextjs";
import config from "./intl-party.config";

const { middleware, middlewareConfig } = createSetup(config);

export { middleware };
export const config = middlewareConfig;
```

### Layout with SSR

```tsx
// app/layout.tsx
import { createSetup } from "@intl-party/nextjs";
import config from "../intl-party.config";

const { getLocale, getMessages, Provider } = createSetup(config);

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
    autoGenerate: true,
    watchMode: true,
  },
  {
    // Your existing Next.js config
    reactStrictMode: true,
  },
);
```

## 🌐 Translation Files

Translation files are simple JSON:

```json
// messages/en/common.json
{
  "welcome": "Welcome to IntlParty!",
  "navigation": {
    "home": "Home",
    "about": "About"
  },
  "greeting": "Hello {{name}}!"
}
```

```json
// messages/es/common.json
{
  "welcome": "¡Bienvenido a IntlParty!",
  "navigation": {
    "home": "Inicio",
    "about": "Acerca de"
  },
  "greeting": "¡Hola {{name}}!"
}
```

## 🎨 Advanced Features

### Clean URLs (Default)

By default, uses cookie-based locale detection:

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

```typescript
// intl-party.config.ts
export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  localePrefix: "always", // or "as-needed"
};
```

### Automatic Type Generation

Get full TypeScript support:

```typescript
const t = useTranslations("common");

t("welcome"); // ✅ Type-safe with auto-completion
t("navigation.home"); // ✅ Type-safe
t("invalid.key"); // ❌ TypeScript error
```

### Hot Reloading

Translation changes automatically reload in development.

## 🔧 Advanced API

### Locale Detection Strategies

The middleware automatically detects locale from:

1. **Cookie** (`INTL_LOCALE` by default)
2. **Accept-Language** header
3. **Query parameter** (`?locale=es`)
4. **URL path** (if `localePrefix` is enabled)

### Server-Side Functions

```typescript
import { createSetup } from "@intl-party/nextjs";

const { getLocale, getMessages } = createSetup(config);

// Get current locale
const locale = await getLocale(request);

// Get messages for a locale
const messages = await getMessages("es");
```

## 🛠️ Advanced Setup

If you need more control, you can use the advanced setup:

```typescript
import {
  createSharedI18nConfig,
  AppI18nProvider,
  getLocale,
} from "@intl-party/nextjs";

const { middleware, client, shared } = createSharedI18nConfig({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  // ... more options
});
```

## 🆚 Migration from next-intl

### From next-intl:

```typescript
// next-intl
import { useTranslations, useLocale } from "next-intl";

const t = useTranslations("common");
const locale = useLocale();

// intl-party
import { useTranslations } from "@intl-party/nextjs";

const t = useTranslations("common");
// Locale is handled automatically
```

### Benefits of switching:

- ✅ **Easier setup** (2 min vs 15 min)
- ✅ **Clean URLs by default**
- ✅ **No manual type casting**
- ✅ **Automatic type generation**
- ✅ **Built-in hot reloading**

## 📦 Exports

```typescript
// Main setup
export {
  createSetup,
  I18nProvider,
  useTranslations,
  type I18nConfig,
} from "./setup";

// Next.js integration
export {
  withIntlParty,
  createNextConfigWithIntl,
  type NextIntegrationOptions,
} from "./next-integration";

// Advanced setup
export {
  createSharedI18nConfig,
  AppI18nProvider,
  NextIntlClientProvider,
} from "./index";

// Server utilities
export { getLocale, getServerTranslations, getMessages } from "./server";

// Middleware
export { createI18nMiddleware, createLocaleMatcher } from "./middleware";
```

## 🤝 Contributing

See the [main README](../../README.md) for contribution guidelines.

## 📄 License

MIT
