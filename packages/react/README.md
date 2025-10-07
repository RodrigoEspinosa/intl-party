# @intl-party/react

React integration for IntlParty - hooks, context, and components for type-safe internationalization in React applications.

## Features

- ⚛️ **React hooks** - `useTranslations`, `useLocale`, `useNamespace`
- 🎯 **Context provider** - `I18nProvider` for app-wide i18n state
- 🧩 **Components** - `Trans`, `LocaleSelector` for declarative translations
- 🔄 **Real-time updates** - Automatic re-renders when locale changes
- 📱 **SSR support** - Server-side rendering compatible
- 🎨 **Type safety** - Full TypeScript support with typed hooks

## Installation

```bash
npm install @intl-party/react @intl-party/core
# or
pnpm add @intl-party/react @intl-party/core
# or
yarn add @intl-party/react @intl-party/core
```

## Quick Start

```tsx
import React from "react";
import { I18nProvider, useTranslations, useLocale } from "@intl-party/react";
import { createI18n } from "@intl-party/core";

// Create i18n instance
const i18n = createI18n({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["common"],
});

// Add translations
i18n.addTranslations("en", "common", {
  welcome: "Welcome!",
  greeting: "Hello, {{name}}!",
});

i18n.addTranslations("es", "common", {
  welcome: "¡Bienvenido!",
  greeting: "¡Hola, {{name}}!",
});

function App() {
  return (
    <I18nProvider i18n={i18n}>
      <HomePage />
    </I18nProvider>
  );
}

function HomePage() {
  const t = useTranslations("common");
  const { locale, setLocale } = useLocale();

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("greeting", { interpolation: { name: "John" } })}</p>

      <button onClick={() => setLocale("es")}>Español</button>
      <button onClick={() => setLocale("en")}>English</button>

      <p>Current locale: {locale}</p>
    </div>
  );
}
```

## Hooks

### useTranslations

Get a translation function for a specific namespace:

```tsx
import { useTranslations } from "@intl-party/react";

function MyComponent() {
  const t = useTranslations("common");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>
        {t("description", {
          interpolation: { name: "User" },
          count: 5,
        })}
      </p>
    </div>
  );
}

// With fallback namespace
function MyComponent() {
  const t = useTranslations(["common", "fallback"]);
  return <h1>{t("title")}</h1>;
}
```

### useLocale

Manage the current locale:

```tsx
import { useLocale } from "@intl-party/react";

function LocaleSwitcher() {
  const { locale, setLocale, availableLocales } = useLocale();

  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      {availableLocales.map((loc) => (
        <option key={loc} value={loc}>
          {loc}
        </option>
      ))}
    </select>
  );
}
```

### useNamespace

Manage the current namespace:

```tsx
import { useNamespace } from "@intl-party/react";

function NamespaceSwitcher() {
  const { namespace, setNamespace, availableNamespaces } = useNamespace();

  return (
    <div>
      <p>Current namespace: {namespace}</p>
      {availableNamespaces.map((ns) => (
        <button key={ns} onClick={() => setNamespace(ns)}>
          {ns}
        </button>
      ))}
    </div>
  );
}
```

### useI18nContext

Access the full i18n context:

```tsx
import { useI18nContext } from "@intl-party/react";

function AdvancedComponent() {
  const { i18n, locale, namespace } = useI18nContext();

  // Direct access to i18n instance
  const hasTranslation = i18n.hasTranslation("some.key");

  return <div>...</div>;
}
```

## Components

### Trans Component

Declarative translation with JSX interpolation:

```tsx
import { Trans } from "@intl-party/react";

function MyComponent() {
  return (
    <Trans
      namespace="common"
      i18nKey="welcome.message"
      values={{ name: "John", count: 5 }}
      components={{
        bold: <strong />,
        link: <a href="/profile" />,
      }}
    />
  );
}
```

Translation file:

```json
{
  "welcome": {
    "message": "Hello <bold>{{name}}</bold>! You have <link>{{count}} messages</link>."
  }
}
```

### LocaleSelector Component

Pre-built locale selector:

```tsx
import { LocaleSelector } from "@intl-party/react";

function Header() {
  return (
    <header>
      <h1>My App</h1>
      <LocaleSelector
        className="locale-selector"
        showFlags={true}
        onChange={(locale) => console.log("Locale changed to:", locale)}
      />
    </header>
  );
}
```

## Provider Configuration

### I18nProvider

```tsx
import { I18nProvider } from "@intl-party/react";

function App() {
  return (
    <I18nProvider
      i18n={i18nInstance}
      fallback={<div>Loading translations...</div>}
    >
      <YourApp />
    </I18nProvider>
  );
}
```

### Server-Side Rendering

For SSR compatibility, initialize with server-detected locale:

```tsx
// Server-side
import { createI18n } from "@intl-party/core";

function createServerI18n(locale: string) {
  const i18n = createI18n({
    locales: ["en", "es", "fr"],
    defaultLocale: "en",
    namespaces: ["common"],
  });

  i18n.setLocale(locale);
  return i18n;
}

// In your SSR setup
const i18n = createServerI18n(detectedLocale);
```

## TypeScript Support

Create typed hooks for better developer experience:

```tsx
interface MyTranslations {
  common: {
    welcome: string;
    user: {
      profile: string;
      settings: string;
    };
  };
  navigation: {
    home: string;
    about: string;
  };
}

// Type the hooks
const useTypedTranslations = useTranslations as <
  T extends keyof MyTranslations,
>(
  namespace: T,
) => (key: string) => string;

function TypedComponent() {
  const t = useTypedTranslations("common");
  // Now t() has autocomplete for keys in 'common' namespace
  return <h1>{t("welcome")}</h1>;
}
```

## Advanced Usage

### Dynamic namespace loading

```tsx
import { useTranslations, useI18nContext } from "@intl-party/react";

function DynamicComponent() {
  const { i18n } = useI18nContext();
  const t = useTranslations("dynamic");

  useEffect(() => {
    // Load translations dynamically
    import(`./translations/${i18n.locale}/dynamic.json`).then(
      (translations) => {
        i18n.addTranslations(i18n.locale, "dynamic", translations.default);
      },
    );
  }, [i18n.locale]);

  return <div>{t("content")}</div>;
}
```

### Custom hook for scoped translations

```tsx
function usePageTranslations(page: string) {
  const { i18n } = useI18nContext();
  return useMemo(
    () => i18n.createScopedTranslator(`pages.${page}`),
    [i18n, page],
  );
}

function ContactPage() {
  const t = usePageTranslations("contact");
  return <h1>{t("title")}</h1>; // translates 'pages.contact.title'
}
```

## License

MIT © IntlParty
