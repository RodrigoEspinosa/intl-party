# @intl-party/core

The framework-agnostic engine behind IntlParty: message storage, interpolation, plurals, ICU MessageFormat, fallbacks, and locale detection. Most apps use it through [`@intl-party/nextjs`](../nextjs) or [`@intl-party/react`](../react).

## 🚀 Quick Start

```bash
npm install @intl-party/core
```

```typescript
import { createI18n } from "@intl-party/core";

const i18n = createI18n({
  locales: ["en", "es"],
  defaultLocale: "en",
  namespaces: ["common"],
});

i18n.addTranslations("en", "common", {
  welcome: "Welcome!",
  greeting: "Hello {{name}}!",
  navigation: { home: "Home" },
});

i18n.t("welcome"); // "Welcome!"
i18n.t("greeting", { interpolation: { name: "Ada" } }); // "Hello Ada!"
i18n.t("navigation.home"); // "Home"
```

## 🔧 Configuration

```typescript
createI18n({
  locales: ["en", "es", "fr"], // required
  defaultLocale: "en", // required, must be in locales
  namespaces: ["common", "auth"], // required
  fallbackChain: { fr: "es" }, // optional: fr → es → defaultLocale
  detection: { strategies: ["localStorage", "cookie", "acceptLanguage"] }, // optional
  validation: { logMissing: true }, // optional
  onError: (error) => report(error), // optional
});
```

| Option          | Type                                                          | Notes                                                                                                                                                |
| --------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fallbackChain` | `Record<Locale, Locale>`                                      | Where to look when a key is missing. Every chain ends at `defaultLocale`.                                                                            |
| `detection`     | `{ strategies, storageKey?, cookieName?, … }`                 | Picks the initial locale. Strategies: `localStorage`, `sessionStorage`, `cookie`, `acceptLanguage`, `queryParam`, `path`, `subdomain`, `geographic`. |
| `validation`    | `{ strict?, logMissing?, throwOnMissing?, validateFormats? }` |                                                                                                                                                      |
| `cache`         | `{ maxSize?, ttl?, strategy? }`                               | Translation result cache                                                                                                                             |
| `onError`       | `(error) => void`                                             | Recoverable errors. Defaults to `console.warn` in development.                                                                                       |

## 🎯 Translating

```typescript
i18n.t("greeting", { interpolation: { name: "Ada" } });
i18n.t("items", { count: 2 });
i18n.t("title", { namespace: "auth" }); // look up in another namespace
i18n.t("missing", { fallback: "Default text" });
```

Keys are looked up in the current namespace (the first in `namespaces`, or set with `setNamespace`), then in the fallback locales.

### Message formats

Both formats can be mixed; each message's format is detected automatically.

**Simple** (`{{name}}` placeholders, `{{count|one|other}}` plurals):

```typescript
i18n.addTranslations("en", "common", {
  greeting: "Hello {{name}}!",
  items: "{{count}} {{count|item|items}}",
});

i18n.t("items", { count: 1 }); // "1 item"
i18n.t("items", { count: 5 }); // "5 items"
```

**ICU MessageFormat**, for locale-aware plurals and selects. Install the optional `intl-messageformat` dependency to use it:

```typescript
i18n.addTranslations("ru", "common", {
  files:
    "{count, plural, one {# файл} few {# файла} many {# файлов} other {# файла}}",
});
i18n.setLocale("ru");

i18n.t("files", { count: 1 }); // "1 файл"
i18n.t("files", { count: 3 }); // "3 файла"
i18n.t("files", { count: 5 }); // "5 файлов"
i18n.t("files", { count: 21 }); // "21 файл"
```

`isICUFormat`, `isLegacyFormat`, and `detectMessageFormat` are exported if you need to check a message yourself.

## 📚 Instance API

| Method                                                               | Description                                                       |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `t(key, options?)`                                                   | Translate                                                         |
| `addTranslations(locale, namespace, messages)`                       | Add or merge messages                                             |
| `removeTranslations(locale, namespace?)`                             | Remove messages                                                   |
| `setLocale(locale)` / `getLocale()`                                  | Change or read the locale. Unsupported locales throw.             |
| `setNamespace(namespace)` / `getNamespace()`                         | Change or read the default namespace                              |
| `hasTranslation(key, namespace?)`                                    | Whether a key resolves for the current locale, counting fallbacks |
| `createScopedTranslator(namespace)`                                  | A `t` bound to one namespace                                      |
| `getAvailableLocales()` / `getAvailableNamespaces()`                 | Configured locales and namespaces                                 |
| `validateTranslations()`                                             | `{ valid, errors, warnings }`, e.g. keys missing from a locale    |
| `formatDate`, `formatNumber`, `formatCurrency`, `formatRelativeTime` | `Intl` formatters for the current locale                          |
| `on(event, listener)` / `off(event, listener)`                       | Subscribe to events                                               |

### Events

```typescript
i18n.on("localeChange", ({ locale, previousLocale }) => {
  document.documentElement.lang = locale;
});
```

Events: `localeChange`, `namespaceChange`, `translationsAdded`, `translationsRemoved`, `translationsPreloading`, `translationsPreloaded`.

## 🔒 Type-Checked Keys

Register your messages to get compile-time key checking in the React and Next.js hooks:

```typescript
// intl-party.d.ts
import type common from "./messages/en/common.json";

declare module "@intl-party/core" {
  interface IntlPartyRegister {
    messages: { common: typeof common };
  }
}
```

If you use the React or Next.js packages, augment that package instead. `npx intl-party generate --types` writes this file for you. See the [main README](../../README.md#-type-checked-translation-keys).

## 📄 License

MIT
