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
// app/layout.tsx (app/[locale]/layout.tsx with a localePrefix)
import { createSetup } from "@intl-party/nextjs";
import config from "../intl-party.config";

const { getLocale, getMessages, Provider, routing } = createSetup(config);

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <Provider locale={locale} initialMessages={messages} routing={routing}>
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

### Clean URLs or locale-prefixed URLs

By default URLs stay clean (`/about` in every language), and the locale comes from a `?locale=` parameter, the `INTL_LOCALE` cookie, or `Accept-Language`. For `/es/about`-style URLs, set `localePrefix: "as-needed"` (no prefix for the default locale) or `"always"`, and put your pages under `app/[locale]/`. `npx intl-party nextjs --init --locale-prefix as-needed` scaffolds this.

### Switching locale

`const [locale, setLocale] = useLocale()` from `@intl-party/nextjs/client`. `setLocale` saves the choice in the cookie and loads the new locale's messages from the server: it re-renders in place with clean URLs, and navigates to the new locale's URL with a `localePrefix`. Pass `routing` from `createSetup` to `<Provider>`.

### Type-Checked Translation Keys

`npx intl-party nextjs --init` creates an `intl-party.d.ts` that registers your default locale's message files. From then on, `useTranslations` only accepts keys that exist in that namespace:

```typescript
const t = useTranslations("common");

t("welcome"); // ✅
t("navigation.home"); // ✅ nested keys use dot paths
t("welcom"); // ❌ TypeScript error: not a key in "common"
t("navigation"); // ❌ TypeScript error: not a string
useTranslations("checkout"); // ❌ TypeScript error: unknown namespace
```

The file imports the JSON directly, so adding or renaming keys needs no build step. After adding or removing a namespace file, run `npx intl-party generate --types` to update it. The generated `intl-party.d.ts` looks like this:

```typescript
import type ns0_common from "./messages/en/common.json";

declare module "@intl-party/nextjs" {
  interface IntlPartyRegister {
    messages: { common: typeof ns0_common };
  }
}
```

Your `tsconfig.json` needs `"resolveJsonModule": true`, which Next.js sets by default. For keys built at runtime, use `useUntypedTranslations` from `@intl-party/react`.

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

## 🤝 Contributing

See the [main README](../../README.md) for contribution guidelines.

## 📄 License

MIT
