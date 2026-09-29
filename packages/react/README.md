# @intl-party/react

React bindings for IntlParty: a provider, translation hooks, and `Trans` / `LocaleSelector` components. For Next.js, use [`@intl-party/nextjs`](../nextjs), which builds on this package.

## 🚀 Quick Start

```bash
npm install @intl-party/react @intl-party/core
```

```tsx
import { I18nProvider, useTranslations, useLocale } from "@intl-party/react";
import { createI18n } from "@intl-party/core";

const i18n = createI18n({
  locales: ["en", "es"],
  defaultLocale: "en",
  namespaces: ["common"],
});

i18n.addTranslations("en", "common", {
  welcome: "Welcome!",
  greeting: "Hello {{name}}!",
});
i18n.addTranslations("es", "common", {
  welcome: "¡Bienvenido!",
  greeting: "¡Hola {{name}}!",
});

export function App() {
  return (
    <I18nProvider i18n={i18n}>
      <Welcome />
    </I18nProvider>
  );
}

function Welcome() {
  const t = useTranslations("common");
  const [locale, setLocale] = useLocale();

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("greeting", { interpolation: { name: "Ada" } })}</p>
      <button onClick={() => setLocale(locale === "en" ? "es" : "en")}>
        {locale === "en" ? "Español" : "English"}
      </button>
    </div>
  );
}
```

Components re-render with the new language when the locale changes.

## 🔒 Type-Checked Keys

Register your messages and `useTranslations(namespace)` only accepts keys that exist in that namespace:

```typescript
// intl-party.d.ts
import type common from "./messages/en/common.json";

declare module "@intl-party/react" {
  interface IntlPartyRegister {
    messages: { common: typeof common };
  }
}
```

```tsx
const t = useTranslations("common");
t("welcome"); // ✅
t("welcom"); // ❌ TypeScript error
```

`npx intl-party generate --types` writes this file for you. For keys built at runtime, use `useUntypedTranslations`.

## 🎯 API

### `I18nProvider`

Pass either an instance (`i18n`) or a `config` to create one.

| Prop                                     | Type                      | Notes                                             |
| ---------------------------------------- | ------------------------- | ------------------------------------------------- |
| `i18n`                                   | `I18nInstance`            | An existing instance from `createI18n`            |
| `config`                                 | `I18nConfig`              | Creates an instance if `i18n` isn't given         |
| `initialLocale` / `initialNamespace`     | `string`                  | Applied only to an instance created from `config` |
| `onLocaleChange` / `onNamespaceChange`   | `(value: string) => void` |                                                   |
| `onError`                                | `(error: Error) => void`  |                                                   |
| `loadingComponent` / `fallbackComponent` | `ReactNode`               |                                                   |

### Hooks

| Hook                                  | Returns                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------- |
| `useTranslations(namespace?)`         | `t(key, options?)`, scoped to `namespace` (default: the current namespace) |
| `useScopedTranslations(namespace)`    | `t(key, options?)` bound to `namespace`                                    |
| `useMultipleTranslations(namespaces)` | `{ [namespace]: t }`                                                       |
| `useUntypedTranslations(namespace?)`  | Like `useTranslations`, without registered-key checks                      |
| `useHasTranslation()`                 | `(key, namespace?) => boolean`                                             |
| `useLocale()`                         | `[locale, setLocale]`                                                      |
| `useLocaleInfo()`                     | Details about the current locale                                           |
| `useNamespace()`                      | `[namespace, setNamespace]`                                                |
| `useI18nContext()`                    | `{ i18n, locale, namespace, t, setLocale, setNamespace, isLoading }`       |
| `useOptionalI18nContext()`            | The same, or `null` outside a provider                                     |

`t` options:

```tsx
t("greeting", { interpolation: { name: "Ada" } }); // "Hello {{name}}!" → "Hello Ada!"
t("items", { count: 2 }); // "{{count|item|items}}" → "items"
t("missing", { fallback: "Default text" });
t("title", { namespace: "auth" }); // one-off lookup in another namespace
```

ICU messages (`"{count, plural, one {# item} other {# items}}"`) take their values from `interpolation` and `count`. Install `intl-messageformat` to use them.

## 🧩 Components

### `Trans`

Renders a translation, with React elements for tags in the message:

```json
{ "terms": "I agree to the <link>terms</link>, {{name}}." }
```

```tsx
<Trans
  i18nKey="terms"
  namespace="common"
  values={{ name: "Ada" }}
  components={{ link: <a href="/terms" /> }}
/>
// → I agree to the <a href="/terms">terms</a>, Ada.
```

Props: `i18nKey`, `namespace`, `values` (interpolation), `components`, `count`, `fallback`. String `children` are used as the fallback when the key is missing.

### `LocaleSelector`

A locale switcher for the locales configured on the provider:

```tsx
<LocaleSelector variant="buttons" />
```

Props: `variant` (`"select"`, the default, or `"buttons"` / `"dropdown"`), `showNativeNames`, `filterLocales`, `formatLocale`, `onLocaleChange`, `placeholder`, `disabled`, `className`, `style`.

## 🤝 Contributing

See the [main README](../../README.md) for contribution guidelines.

## 📄 License

MIT
