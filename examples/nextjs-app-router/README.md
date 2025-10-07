# Next.js App Router Example

This example demonstrates **cookie-based locale storage** with IntlParty and Next.js App Router.

## Key Features

- 🍪 **Cookie-based locale storage** - No URL changes needed
- 🔄 **Real-time language switching** - Instant updates without page reload
- 🌐 **Multi-locale support** - English, Spanish, French, German
- ⚡ **Server-side detection** - Automatic locale detection from cookies/headers
- 🎨 **Modern dark UI** - Clean, minimalist design

## How It Works

1. **Middleware** detects locale from cookies, Accept-Language header, or `?locale=` query param
2. **Server-side** `getLocale()` reads the detected locale for SSR
3. **Client-side** provider preloads all translations for instant switching
4. **Cookie persistence** maintains locale choice across sessions

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Minimal dark theme styles
│   ├── layout.tsx           # Root layout with locale detection
│   ├── page.tsx             # Main demo page
│   └── client-provider.tsx  # Client-side i18n provider
├── messages/                # Translation files
│   ├── en/common.json      # English translations
│   ├── es/common.json      # Spanish translations
│   ├── fr/common.json      # French translations
│   └── de/common.json      # German translations
└── middleware.ts           # Locale detection middleware
```

## Key Code Examples

### Locale Detection (Server)

```tsx
// app/layout.tsx
import { getLocale } from "@intl-party/nextjs/server";

export default async function RootLayout({ children }) {
  const locale = await getLocale(i18nConfig);
  return (
    <html lang={locale}>
      <ClientProvider locale={locale}>{children}</ClientProvider>
    </html>
  );
}
```

### Translation Usage (Client)

```tsx
// app/page.tsx
import { useTranslations, useLocale } from "@intl-party/react";

function MyComponent() {
  const t = useTranslations("common");
  const [locale, setLocale] = useLocale();

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("currentLocale", { interpolation: { locale } })}</p>
      <button onClick={() => setLocale("es")}>Español</button>
    </div>
  );
}
```

### Middleware Configuration

```ts
// middleware.ts
import { createI18nMiddleware } from "@intl-party/nextjs";

export const middleware = createI18nMiddleware({
  locales: ["en", "es", "fr", "de"],
  defaultLocale: "en",
  localePrefix: "never", // No URL changes
  cookieName: "INTL_LOCALE",
  detectFromCookie: true,
  detectFromQuery: true, // Allow ?locale=es
  redirectStrategy: "none", // Just set cookie
});
```

## Testing the Demo

1. **Language Switching**: Click the language buttons to see instant translation updates
2. **Cookie Persistence**: Refresh the page - your language choice is remembered
3. **Query Override**: Try `?locale=es` in the URL to test query-based detection
4. **Browser Detection**: Clear cookies and see automatic detection from Accept-Language header

## What Makes This Special

- **Clean URLs** - No `/es/page` or `/fr/page` needed
- **SEO Friendly** - Same URLs work for all languages
- **Fast Switching** - All translations preloaded for instant updates
- **Automatic Detection** - Works with browser language preferences
- **Server Rendering** - Full SSR support with proper hydration

Perfect for applications where you want internationalization without changing your URL structure!
