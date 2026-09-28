# IntlParty 🎉

[![npm version](https://img.shields.io/npm/v/@intl-party/nextjs.svg?label=%40intl-party%2Fnextjs)](https://www.npmjs.com/package/@intl-party/nextjs)
[![npm downloads](https://img.shields.io/npm/dm/@intl-party/core.svg)](https://www.npmjs.com/package/@intl-party/core)
[![CI](https://github.com/RodrigoEspinosa/intl-party/actions/workflows/ci.yml/badge.svg)](https://github.com/RodrigoEspinosa/intl-party/actions/workflows/ci.yml)
[![bundle size](https://deno.bundlejs.com/badge?q=@intl-party/core)](https://bundlejs.com/?q=@intl-party/core)
[![TypeScript](https://img.shields.io/badge/types-included-blue.svg)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/@intl-party/core.svg)](./LICENSE)

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
npx intl-party nextjs --init
```

This creates:

- `intl-party.config.ts` - Your i18n configuration
- `middleware.ts` (`proxy.ts` on Next.js 16+) - Automatic locale detection
- `messages/` - Sample translation files
- `intl-party.d.ts` - Registers your messages so keys are type-checked
- Example layout and page components

### 3. Start Using

```tsx
// app/page.tsx
"use client";

import { useTranslations } from "@intl-party/nextjs";

export default function HomePage() {
  const t = useTranslations("common");

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
├── intl-party.d.ts          # Type-checked translation keys
├── middleware.ts            # Automatic locale detection (proxy.ts on Next 16+)
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

### `useTranslations(namespace?)`

The main hook for using translations.

```tsx
// Without namespace (uses default)
const t = useTranslations();

// With namespace
const t = useTranslations("common");

// Simple usage
t("welcome"); // "Welcome!"

// With interpolation
t("greeting", { name: "John" }); // "Hello John!"

// Nested keys
t("navigation.home"); // "Home"
```

### `createSetup(config)`

Creates the complete i18n setup for Next.js.

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

## 🏗️ Setup Examples

### Middleware (Automatic)

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

### Layout (Automatic SSR)

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

Translation changes automatically reload in development:

1. Edit `messages/en/common.json`
2. Save the file
3. See changes immediately in your browser

## 🛠️ CLI Commands

### Initialize Project

```bash
# Initialize your project
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
- **[@intl-party/react-native](./packages/react-native)** - React Native and Expo integration
- **[@intl-party/eslint-plugin](./packages/eslint-plugin)** - Lint rules for hardcoded strings and i18n best practices

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

Want to migrate from another i18n library? Check our detailed [Migration Guide](./MIGRATING.md) for step-by-step instructions on migrating from next-intl, react-i18next, FormatJS (react-intl), and lingui.

## 🔧 Troubleshooting Guide

### Common Issues

#### Missing Translations

**Symptom**: Seeing translation keys instead of translated text (`common.welcome` instead of "Welcome").

**Solutions**:

1. Ensure the correct namespace is being used: `useTranslations("common")`
2. Check that the translation file exists in your locale directory (e.g., `/messages/en/common.json`)
3. Verify the key exists in your translation file with exact spelling and casing
4. Run `npx intl-party check --missing` to identify all missing translations

#### Type Generation Issues

**Symptom**: TypeScript errors or missing type completion for translation keys.

**Solutions**:

1. Run `npx intl-party generate --types` to regenerate `intl-party.d.ts` (needed after adding a namespace)
2. Check that `intl-party.d.ts` is covered by your `tsconfig.json` `include` and that `resolveJsonModule` is enabled
3. Restart your TypeScript server (`Ctrl+Shift+P` → "TypeScript: Restart TS Server" in VSCode)
4. Verify that the key exists in your translation files

#### Locale Detection Not Working

**Symptom**: App always shows default locale regardless of browser settings or URL.

**Solutions**:

1. Ensure `middleware.ts` is correctly set up and exported
2. Check that your `next.config.js` doesn't override the i18n configuration
3. Clear browser cookies and try again
4. Test with query parameter override: `?locale=fr`
5. Check server logs for middleware execution errors

#### Hot Reloading Not Working

**Symptom**: Changes to translation files don't appear immediately.

**Solutions**:

1. Ensure you're in development mode (`npm run dev`)
2. Check that your `next.config.js` includes the IntlParty plugin
3. Restart the development server
4. Run with watch mode explicitly: `npx intl-party generate --watch`

#### Next.js App Router SSR Issues

**Symptom**: Server components show different translations than client components.

**Solutions**:

1. Ensure you're using `getServerTranslations` for server components
2. Check that your `Provider` in `layout.tsx` correctly passes `initialMessages`
3. Verify locale detection consistency between server and client
4. Use the `debug` option in configuration to log i18n state: `debug: process.env.NODE_ENV !== 'production'`

#### URL Prefix Configuration

**Symptom**: URL prefixes not working as expected (`/en/about` vs `/about`).

**Solutions**:

1. Check your `localePrefix` setting in `intl-party.config.ts`:
   - `"never"` - No prefixes, uses cookies (default)
   - `"as-needed"` - Only non-default locales have prefix
   - `"always"` - All locales have prefix
2. Update `middleware.ts` if you changed the configuration
3. Clear cookies and refresh

### Debugging

#### Enable Debug Mode

Add debug mode to your configuration:

```typescript
// intl-party.config.ts
export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  debug: process.env.NODE_ENV !== "production",
  // ...other settings
};
```

#### Inspect Generated Files

Generated files are located at:

- Type definitions: `node_modules/.intl-party/types`
- Client package: `node_modules/@intl-party/client/generated`

#### CLI Diagnostics

```bash
# Validate configuration
npx intl-party check-config

# Check for missing translations
npx intl-party check --missing

# Validate translation format
npx intl-party check --format-errors

# Get verbose output
npx intl-party check --verbose
```

### Specific Package Issues

#### Next.js Integration

**Issue**: Middleware conflicts with other middleware

**Solution**: Use the matcher option in `middleware.ts` to limit scope:

```typescript
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

#### ESLint Plugin

**Issue**: False positives for hardcoded strings

**Solution**: Add patterns to ignore in your `.eslintrc.js`:

```javascript
{
  "rules": {
    "@intl-party/no-hardcoded-strings": ["error", {
      "ignorePatterns": [
        "^\\d+$", // Numbers
        "^[A-Z_]+$", // Constants
        "^https?://", // URLs
      ]
    }]
  }
}
```

#### React Integration

**Issue**: Component re-renders on every locale change

**Solution**: Use memoization:

```jsx
import { useTranslations, useLocale } from "@intl-party/react";
import { memo } from "react";

const MyComponent = memo(function MyComponent() {
  const t = useTranslations("common");
  return <div>{t("title")}</div>;
});
```

### Getting Help

If you can't solve your issue with this guide:

1. Check existing [GitHub issues](https://github.com/RodrigoEspinosa/intl-party/issues)
2. Search the documentation for your specific error
3. Create a minimal reproduction in a new project
4. Open a detailed issue with steps to reproduce

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
