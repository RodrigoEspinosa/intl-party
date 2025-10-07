# @intl-party/nextjs

Next.js integration for IntlParty - full App Router and Pages Router support with SSR/SSG, cookie-based locale storage, and next-intl compatibility.

## Features

- 🚀 **Next.js 13+ App Router** - Full support with server components
- 📄 **Pages Router** - Complete Pages Router integration
- 🍪 **Cookie-based locale** - Store locale in cookies without URL changes
- 🔄 **next-intl compatibility** - Drop-in replacement for next-intl
- 🎯 **Server/Client separation** - Proper bundling for each environment
- 📱 **SSR/SSG ready** - Server-side rendering and static generation
- ⚡ **Middleware support** - Automatic locale detection and routing
- 🎨 **Type safety** - Full TypeScript support

## Installation

```bash
npm install @intl-party/nextjs @intl-party/react @intl-party/core
# or
pnpm add @intl-party/nextjs @intl-party/react @intl-party/core
# or
yarn add @intl-party/nextjs @intl-party/react @intl-party/core
```

## Quick Start (App Router)

### 1. Configuration

```typescript
// lib/i18n.ts
export const locales = ["en", "es", "fr"] as const;
export const defaultLocale = "en" as const;

export const i18nConfig = {
  locales,
  defaultLocale,
  namespaces: ["common", "navigation"],
  cookieName: "INTL_LOCALE", // Store locale in cookies
} as const;
```

### 2. App Layout

```tsx
// app/layout.tsx
import { AppI18nProvider } from "@intl-party/nextjs/client";
import { getLocale } from "@intl-party/nextjs/server";
import { i18nConfig } from "@/lib/i18n";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>
        <AppI18nProvider locale={locale} config={i18nConfig}>
          {children}
        </AppI18nProvider>
      </body>
    </html>
  );
}
```

### 3. Page Components

```tsx
// app/page.tsx
import { useTranslations } from "@intl-party/react";
import { getServerTranslations } from "@intl-party/nextjs/server";

// Server Component
export default async function HomePage() {
  const t = await getServerTranslations("common");

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <ClientComponent />
    </div>
  );
}

// Client Component
("use client");
function ClientComponent() {
  const t = useTranslations("common");

  return <p>{t("description")}</p>;
}
```

### 4. Middleware (Optional)

```typescript
// middleware.ts
import { createI18nMiddleware } from "@intl-party/nextjs";

const i18nMiddleware = createI18nMiddleware({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  cookieName: "INTL_LOCALE",
});

export default i18nMiddleware;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## Cookie-Based Locale Storage

Instead of URL prefixes like `/es/page`, store locale in cookies:

```typescript
// No URL changes needed!
// User visits: example.com/page
// Locale stored in cookie: INTL_LOCALE=es

const i18nConfig = {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  cookieName: "INTL_LOCALE", // Cookie-based storage
  // localePrefix: 'never' - This is implicit with cookie storage
};
```

## Server-Side Usage

### Server Translations

```tsx
// Server Component
import { getServerTranslations, getLocale } from "@intl-party/nextjs/server";

export default async function ServerPage() {
  const locale = await getLocale();
  const t = await getServerTranslations("common");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>Current locale: {locale}</p>
    </div>
  );
}
```

### Server Actions

```tsx
// Server Action
import { setLocale } from "@intl-party/nextjs/server";

async function changeLocale(locale: string) {
  "use server";
  await setLocale(locale);
}

// Client Component
("use client");
export function LocaleSwitcher() {
  return (
    <form action={changeLocale}>
      <button type="submit" name="locale" value="es">
        Español
      </button>
      <button type="submit" name="locale" value="en">
        English
      </button>
    </form>
  );
}
```

## Next-Intl Compatibility

Drop-in replacement for next-intl with compatibility APIs:

```tsx
// These next-intl APIs work with IntlParty:
import {
  useTranslations, // ✅ Compatible
  useLocale, // ✅ Compatible
  getTranslations, // ✅ Compatible (server)
  getLocale, // ✅ Compatible (server)
  setRequestLocale, // ✅ Compatible (server)
  getMessages, // ✅ Compatible (server)
} from "@intl-party/nextjs";

// Migration is seamless!
function MyComponent() {
  const t = useTranslations("common"); // Same API as next-intl
  return <h1>{t("title")}</h1>;
}
```

## API Reference

### Client Components

```tsx
import { AppI18nProvider } from "@intl-party/nextjs/client";

<AppI18nProvider
  locale={locale}
  config={i18nConfig}
  messages={preloadedMessages} // Optional
>
  {children}
</AppI18nProvider>;
```

### Server Functions

```tsx
import {
  getLocale, // Get current locale
  getServerTranslations, // Get translation function
  setLocale, // Set locale (server action)
  getMessages, // Get raw messages
} from "@intl-party/nextjs/server";

// Usage
const locale = await getLocale();
const t = await getServerTranslations("common");
const messages = await getMessages("common");
```

### Middleware

```tsx
import { createI18nMiddleware } from "@intl-party/nextjs";

const middleware = createI18nMiddleware({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  cookieName: "INTL_LOCALE",
  detection: {
    strategies: ["cookie", "acceptLanguage"],
  },
});
```

## Configuration Options

```typescript
interface NextI18nConfig {
  locales: string[]; // Supported locales
  defaultLocale: string; // Default locale
  namespaces: string[]; // Available namespaces
  cookieName?: string; // Cookie name for locale storage
  paramName?: string; // URL param name (if needed)
  detection?: {
    strategies: Array<"cookie" | "acceptLanguage" | "subdomain">;
  };
  messages?: Record<string, any>; // Preloaded messages
}
```

## Advanced Usage

### Dynamic Message Loading

```tsx
// Server Component with dynamic loading
import { getServerTranslations } from "@intl-party/nextjs/server";

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  // Load messages for specific product category
  const messages = await import(`@/messages/${locale}/products.json`);
  const t = await getServerTranslations("products", { messages });

  return <h1>{t("title")}</h1>;
}
```

### Multi-Locale Preloading

```tsx
// app/layout.tsx - Preload multiple locales for instant switching
export default async function RootLayout() {
  const locale = await getLocale();

  // Preload common messages for all locales
  const allMessages = {
    en: await import("@/messages/en/common.json"),
    es: await import("@/messages/es/common.json"),
    fr: await import("@/messages/fr/common.json"),
  };

  return (
    <AppI18nProvider
      locale={locale}
      config={i18nConfig}
      messages={allMessages} // Enables instant locale switching
    >
      {children}
    </AppI18nProvider>
  );
}
```

### Custom Locale Detection

```tsx
// middleware.ts
import { createI18nMiddleware } from "@intl-party/nextjs";

export default createI18nMiddleware({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  detection: {
    strategies: ["cookie", "acceptLanguage", "subdomain"],
  },
  // Custom detection logic
  detector: (request) => {
    // Custom logic to detect locale from request
    const customLocale = request.headers.get("x-custom-locale");
    return customLocale || "en";
  },
});
```

## Migration from next-intl

1. **Replace imports**:

   ```tsx
   // Before (next-intl)
   import { useTranslations } from "next-intl";

   // After (IntlParty)
   import { useTranslations } from "@intl-party/nextjs";
   ```

2. **Update configuration**:

   ```tsx
   // Before (next-intl)
   export default createNextIntlPlugin("./i18n.ts");

   // After (IntlParty) - No plugin needed!
   // Just use the provider and middleware
   ```

3. **Keep your message files** - No changes needed to translation JSON files!

## TypeScript Support

```typescript
interface Messages {
  common: {
    welcome: string;
    navigation: {
      home: string;
      about: string;
    };
  };
}

// Typed hooks
const t = useTranslations<Messages>("common");
// t() now has full autocomplete and type checking
```

## License

MIT © IntlParty
