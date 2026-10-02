# IntlParty 🎉

[![npm version](https://img.shields.io/npm/v/@intl-party/nextjs.svg?label=%40intl-party%2Fnextjs)](https://www.npmjs.com/package/@intl-party/nextjs)
[![npm downloads](https://img.shields.io/npm/dm/@intl-party/core.svg)](https://www.npmjs.com/package/@intl-party/core)
[![CI](https://github.com/RodrigoEspinosa/intl-party/actions/workflows/ci.yml/badge.svg)](https://github.com/RodrigoEspinosa/intl-party/actions/workflows/ci.yml)
[![bundle size](https://deno.bundlejs.com/badge?q=@intl-party/core)](https://bundlejs.com/?q=@intl-party/core)
[![TypeScript](https://img.shields.io/badge/types-included-blue.svg)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/@intl-party/core.svg)](./LICENSE)

Type-safe internationalization for the Next.js App Router, React, and React Native. Translation keys are checked at compile time, URLs stay clean (`/about`, not `/en/about`), and one command sets up a working project.

## ✨ Why IntlParty?

- **🔒 Type-checked keys**: `t("welcom")` is a compile error, and your editor autocompletes keys from your JSON files. No manual type declarations.
- **🚀 One-command setup**: `npx intl-party nextjs --init` scaffolds the config, middleware, messages, layout, and types.
- **🌍 Clean URLs**: the locale comes from a cookie or `Accept-Language`, so routes stay the same in every language.
- **💬 Two message formats**: simple `{{name}}` interpolation, or ICU MessageFormat for plurals and selects. Mix them freely.
- **🛠️ CLI checks**: find missing translations and format errors in CI with `intl-party check`.
- **📱 React Native too**: the same hooks, with device-locale detection and a persisted preference.

Every change is tested end to end: CI scaffolds an app with the CLI and builds it on Next.js 14, 15, and 16. It then checks that a misspelled key fails to compile and that pages render in the right language.

## 🚀 Quick Start (Next.js)

### 1. Install

```bash
npm install @intl-party/nextjs
```

### 2. Initialize

```bash
npx intl-party nextjs --init
```

This creates:

- `intl-party.config.ts`: locales and the messages directory
- `middleware.ts` (`proxy.ts` on Next.js 16+): locale detection
- `messages/{en,es,fr}/common.json`: sample translations
- `intl-party.d.ts`: registers your messages so keys are type-checked
- `app/layout.intl-party.tsx` and `app/page.intl-party.tsx`: an example layout and page to merge into yours

### 3. Translate

```tsx
// app/page.tsx
"use client";

import { useTranslations } from "@intl-party/nextjs";

export default function HomePage() {
  const t = useTranslations("common");

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("description")}</p>
      <a href="/about">{t("navigation.about")}</a>
    </div>
  );
}
```

Visitors see the page in the first locale their browser prefers that you support, falling back to `defaultLocale`.

## 🔒 Type-Checked Translation Keys

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

## 🔧 Configuration

```typescript
// intl-party.config.ts
import type { SetupConfig } from "@intl-party/nextjs";

export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  messages: "./messages", // optional, this is the default
  // localePrefix: "as-needed", // see "Locale in the URL" below
  // cookieName: "INTL_LOCALE", // optional, this is the default
} satisfies SetupConfig;
```

By default URLs stay clean (`/about` in every language). The locale is resolved from a `?locale=` parameter, then the `INTL_LOCALE` cookie, then `Accept-Language`, then `defaultLocale`.

### Locale in the URL

For `/es/about`-style URLs (better for SEO and shareable links), set `localePrefix` and put your pages under `app/[locale]/`:

| `localePrefix`      | `/about` in English | `/about` in Spanish | Visiting `/` with a Spanish browser |
| ------------------- | ------------------- | ------------------- | ----------------------------------- |
| `"never"` (default) | `/about`            | `/about`            | Spanish page at `/`                 |
| `"as-needed"`       | `/about`            | `/es/about`         | Redirects to `/es`                  |
| `"always"`          | `/en/about`         | `/es/about`         | Redirects to `/es`                  |

`npx intl-party nextjs --init --locale-prefix as-needed` scaffolds this layout. The locale in the URL takes priority over the cookie and browser settings.

### Switching locale

```tsx
"use client";
import { useLocale } from "@intl-party/nextjs/client";

export function LocaleSwitcher() {
  const [locale, setLocale] = useLocale();
  return (
    <button onClick={() => setLocale(locale === "en" ? "es" : "en")}>
      {locale === "en" ? "Español" : "English"}
    </button>
  );
}
```

`setLocale` remembers the choice in the cookie and loads the new locale's messages from the server. With clean URLs the page re-renders in place; with a `localePrefix`, it navigates to the same page's URL in the new locale. Pass `routing` from `createSetup` to `<Provider>` (the generated layout does) so it knows which.

## 🏗️ How the Setup Fits Together

`createSetup(config)` returns everything the generated files use:

```typescript
import { createSetup } from "@intl-party/nextjs";
import config from "./intl-party.config";

const {
  middleware, // detects the locale and stores it in a cookie
  getLocale, // resolves the current request's locale (server)
  getMessages, // loads messages for a locale (server)
  Provider, // client provider for your root layout
  routing, // URL settings to pass to <Provider routing={routing}>
} = createSetup(config);
```

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

### Root layout

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

Message files are read on each request, so edits show up on the next page load without restarting the dev server.

Translation hooks run in Client Components (`"use client"`). Server Components can render inside the `Provider`, but they can't call `useTranslations` themselves.

## 🌐 Translation Files

Translation files are simple JSON. IntlParty supports two message formats:

### Legacy Format (Simple)

The default `{{variable}}` syntax for basic interpolation and pluralization:

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
  "greeting": "Hello {{name}}!",
  "items": "{{count|item|items}}"
}
```

### ICU MessageFormat (Advanced)

For complex pluralization, gender selection, and locale-specific formatting, use [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/):

```json
// messages/en/common.json
{
  "itemCount": "{count, plural, one {# item} other {# items}}",
  "greeting": "{gender, select, male {He} female {She} other {They}} liked your post",
  "welcome": "Hello {name}!"
}
```

```json
// messages/ru/common.json (Russian with complex plural rules)
{
  "itemCount": "{count, plural, one {# товар} few {# товара} many {# товаров} other {# товара}}"
}
```

To use ICU MessageFormat, install the optional dependency:

```bash
npm install intl-messageformat
```

**Auto-detection**: IntlParty automatically detects which format each message uses. You can mix both formats in the same project - legacy `{{variable}}` and ICU `{variable, type}` patterns coexist seamlessly.

```json
// messages/es/common.json (both formats work together)
{
  "welcome": "¡Bienvenido a IntlParty!",
  "greeting": "¡Hola {{name}}!",
  "itemCount": "{count, plural, one {# artículo} other {# artículos}}"
}
```

## 🛠️ CLI

```bash
npx intl-party nextjs --init        # scaffold a Next.js project
npx intl-party generate --types     # update intl-party.d.ts after adding a namespace
npx intl-party check --missing      # list keys missing from any locale
npx intl-party check --format-errors
npx intl-party validate             # completeness and consistency report
npx intl-party check-config
```

Run `npx intl-party --help` for all commands, including `extract` and `sync`.

## 📦 Packages

| Package                                                 | Use it for                                         |
| ------------------------------------------------------- | -------------------------------------------------- |
| [`@intl-party/nextjs`](./packages/nextjs)               | Next.js App Router (start here)                    |
| [`@intl-party/react`](./packages/react)                 | React apps without Next.js                         |
| [`@intl-party/react-native`](./packages/react-native)   | React Native and Expo                              |
| [`@intl-party/cli`](./packages/cli)                     | Scaffolding, type registration, translation checks |
| [`@intl-party/eslint-plugin`](./packages/eslint-plugin) | Catching hardcoded strings                         |
| [`@intl-party/core`](./packages/core)                   | Framework-agnostic engine the others build on      |

## 🆚 How It Compares

|                                        | IntlParty                           | next-intl                  | react-i18next            |
| -------------------------------------- | ----------------------------------- | -------------------------- | ------------------------ |
| Type-checked keys                      | ✅ declaration generated by the CLI | ✅ declaration you write   | ✅ declaration you write |
| Project scaffolding                    | ✅ `intl-party nextjs --init`       | Manual                     | Manual                   |
| Clean URLs (no `/en/`)                 | ✅ default                          | ✅ `localePrefix: "never"` | Not routing-aware        |
| Locale-prefixed routes                 | ✅ `localePrefix: "as-needed"`      | ✅                         | Not routing-aware        |
| Hooks in Server Components             | ❌ Client Components only           | ✅                         | ❌                       |
| Missing-translation checks             | ✅ `intl-party check --missing`     | Not built in               | Not built in             |
| Client bundle (provider + hook, gzip)¹ | 14.2 kB                             | 12.6 kB                    | 17 kB                    |

¹ Measured with [bundlejs](https://bundlejs.com) (React and Next.js external): `@intl-party/nextjs/client` 1.4.0 `{ Provider, useTranslations }`, `next-intl` 4.14.7 `{ NextIntlClientProvider, useTranslations }`, and `react-i18next` + `i18next` `{ I18nextProvider, useTranslation }`.

next-intl is the more complete choice today if you need translations in Server Components. IntlParty is aimed at teams who want type-checked keys and a working setup in one command.

Migrating? The [Migration Guide](./MIGRATING.md) covers next-intl, react-i18next, FormatJS (react-intl), and Lingui.

## 🔧 Troubleshooting

See [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for missing translations, type errors, and locale detection issues. If that doesn't help, [open an issue](https://github.com/RodrigoEspinosa/intl-party/issues) with a minimal reproduction.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/RodrigoEspinosa/intl-party.git
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

## 🤖 AI Disclaimer

This project was developed heavily using AI assistance. While we strive for high code quality and security, please review the code and use it at your own discretion. We welcome contributions to improve and refine the codebase.
