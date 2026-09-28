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
"use client";

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
import intlConfig from "./intl-party.config";

const { middleware } = createSetup(intlConfig);

export { middleware };

// Next.js reads this at build time, so it must be a static literal.
export const config = {
  matcher: ["/((?!api|_next|_vercel|favicon\\.ico).*)", "/"],
};
```

On Next.js 16+, name the file `proxy.ts` and export the function as `proxy`: `export { middleware as proxy };`. `npx intl-party nextjs --init` does this for you.

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

// Current request's locale (cookie, then Accept-Language)
const locale = await getLocale();

// Messages keyed by locale: { es: { common: {...}, ... } }
const messages = await getMessages("es");
```

## 🛠️ Advanced Setup

For full control over detection, build the middleware yourself:

```typescript
// middleware.ts
import { createI18nMiddleware } from "@intl-party/nextjs";

export const middleware = createI18nMiddleware({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  detectFromQuery: false,
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|favicon\\.ico).*)", "/"],
};
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

| Entry point                         | Use from                         | Exports                                                                                                                                                                              |
| ----------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@intl-party/nextjs`                | middleware, layouts, client code | `createSetup`, `useTranslations`, `createI18nMiddleware`, `createLocaleMatcher`, `createZeroConfigSetup`, `loadMessages`, `loadMessagesForLocale`, `loadAllMessages`, `detectConfig` |
| `@intl-party/nextjs/client`         | client components                | `Provider`, `useTranslations`, `useLocale`, `AppI18nProvider`, `NextIntlClientProvider`                                                                                              |
| `@intl-party/nextjs/server`         | server components                | `getLocale`, `getServerTranslations`, `createServerTranslations`, `getLocaleFromParams`, `loadMessagesForLocale`                                                                     |
| `@intl-party/nextjs/webpack-plugin` | `next.config.js`                 | `withIntlPartyHotReload` (webpack builds only)                                                                                                                                       |

## 🤝 Contributing

See the [main README](../../README.md) for contribution guidelines.

## 📄 License

MIT
