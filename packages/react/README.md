# @intl-party/react

**React integration for IntlParty with perfect TypeScript support and developer experience.**

## ✨ Features

- **⚛️ React Hooks**: `useTranslations`, `useLocale`, `useNamespace`
- **🎯 Context Provider**: `I18nProvider` for app-wide i18n state
- **🧩 Components**: `Trans`, `LocaleSelector` for declarative translations
- **🔄 Real-time Updates**: Automatic re-renders when locale changes
- **🔒 Type-Safe**: Full TypeScript support with auto-completion
- **⚡ Performance Optimized**: Minimal re-renders and efficient caching

## 🚀 Quick Start

### Installation

```bash
npm install @intl-party/react @intl-party/core
```

### Basic Usage

```tsx
import React from "react";
import { I18nProvider, useTranslations } from "@intl-party/react";
import { createI18n } from "@intl-party/core";

// Create i18n instance
const i18n = createI18n({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["common"],
});

function App() {
  return (
    <I18nProvider i18n={i18n}>
      <Welcome />
    </I18nProvider>
  );
}

function Welcome() {
  const t = useTranslations("common");

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("greeting", { interpolation: { name: "World" } })}</p>
    </div>
  );
}
```

## 🎯 API Reference

### `I18nProvider`

Provides i18n context to the React component tree.

```tsx
<I18nProvider
  i18n={i18nInstance}
  initialLocale="en"
  initialNamespace="common"
  loadingComponent={<Loading />}
  fallbackComponent={<Error />}
>
  {children}
</I18nProvider>
```

#### Props

```typescript
interface I18nProviderProps {
  children: ReactNode;
  i18n?: I18nInstance; // I18n instance
  config?: I18nConfig; // Config (creates instance if not provided)
  initialLocale?: Locale; // Initial locale
  initialNamespace?: Namespace; // Initial namespace
  loadingComponent?: ReactNode; // Loading component
  fallbackComponent?: ReactNode; // Error fallback component
  onLocaleChange?: (locale: Locale) => void;
  onNamespaceChange?: (namespace: Namespace) => void;
  onError?: (error: Error) => void;
}
```

### Hooks

#### `useTranslations(namespace?)`

Main hook for using translations.

```tsx
// Without namespace (uses default)
const t = useTranslations();

// With namespace
const t = useTranslations("common");

// Usage
t("welcome"); // "Welcome!"
t("greeting", { interpolation: { name: "John" } }); // "Hello John!"
t("navigation.home"); // "Home"
```

#### `useLocale()`

Get and set the current locale.

```tsx
function LocaleComponent() {
  const [locale, setLocale] = useLocale();

  return (
    <div>
      <p>Current locale: {locale}</p>
      <button onClick={() => setLocale("es")}>Español</button>
      <button onClick={() => setLocale("fr")}>Français</button>
    </div>
  );
}
```

#### `useNamespace()`

Get and set the current namespace.

```tsx
function NamespaceComponent() {
  const [namespace, setNamespace] = useNamespace();

  return (
    <div>
      <p>Current namespace: {namespace}</p>
      <button onClick={() => setNamespace("navigation")}>Navigation</button>
      <button onClick={() => setNamespace("auth")}>Auth</button>
    </div>
  );
}
```

#### `useI18nContext()`

Access the full i18n context.

```tsx
function AdvancedComponent() {
  const { i18n, locale, namespace, t, setLocale, setNamespace } =
    useI18nContext();

  return (
    <div>
      <p>Locale: {locale}</p>
      <p>Namespace: {namespace}</p>
      <button
        onClick={() => i18n.addTranslations("en", "common", { new: "Key" })}
      >
        Add Translation
      </button>
    </div>
  );
}
```

## 🧩 Components

### `Trans`

Component for translations with rich text and interpolation.

```tsx
import { Trans } from "@intl-party/react";

function RichText() {
  return (
    <Trans
      i18nKey="rich.greeting"
      interpolation={{ name: "John" }}
      components={{
        bold: <strong />,
        link: <a href="/about" />,
      }}
    >
      Hello <bold>{{ name }}</bold>! Learn more <link>about</link>.
    </Trans>
  );
}
```

### `LocaleSelector`

Pre-built locale selector component.

```tsx
import { LocaleSelector } from "@intl-party/react";

function Header() {
  return (
    <LocaleSelector
      locales={[
        { code: "en", name: "English", flag: "🇺🇸" },
        { code: "es", name: "Español", flag: "🇪🇸" },
        { code: "fr", name: "Français", flag: "🇫🇷" },
      ]}
      variant="flags" // or "dropdown" or "compact"
    />
  );
}
```

## 🎨 Advanced Usage

### Typed Translations

```typescript
interface AppTranslations {
  common: {
    welcome: string;
    navigation: {
      home: string;
      about: string;
    };
  };
  auth: {
    login: string;
    register: string;
  };
}

// Create typed i18n instance
const i18n = createI18n<AppTranslations>({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["common", "auth"],
});

// Use with full type safety
function TypedComponent() {
  const t = useTranslations<AppTranslations["common"]>("common");

  return (
    <div>
      {t("welcome")} {/* ✅ Type-safe */}
      {t("navigation.home")} {/* ✅ Type-safe */}
      {t("invalid.key")} {/* ❌ TypeScript error */}
    </div>
  );
}
```

### Multiple Namespaces

```tsx
function MultiNamespaceComponent() {
  const commonT = useTranslations("common");
  const authT = useTranslations("auth");

  return (
    <div>
      <h1>{commonT("welcome")}</h1>
      <button>{authT("login")}</button>
    </div>
  );
}
```

### Server-Side Rendering

```tsx
// Server component (Next.js App Router)
async function ServerPage() {
  const t = await getServerTranslations("common");

  return (
    <div>
      <h1>{t("welcome")}</h1>
    </div>
  );
}
```

### Dynamic Namespace Loading

```tsx
function DynamicComponent({ namespace }: { namespace: string }) {
  const t = useTranslations(namespace);

  return (
    <div>
      <h2>Namespace: {namespace}</h2>
      <p>{t("title")}</p>
    </div>
  );
}
```

## 🔧 Utilities

### `createNamespaceHOC(namespace)`

Higher-order component for automatic namespacing.

```tsx
import { createNamespaceHOC } from "@intl-party/react";

const withNavigation = createNamespaceHOC("navigation");

function NavigationComponent({ t }) {
  return (
    <nav>
      <a href="/">{t("home")}</a>
      <a href="/about">{t("about")}</a>
    </nav>
  );
}

export default withNavigation(NavigationComponent);
```

### `useMultipleTranslations(namespaces)`

Use multiple namespaces at once.

```tsx
function MultiNamespaceComponent() {
  const { common, auth, navigation } = useMultipleTranslations([
    "common",
    "auth",
    "navigation",
  ]);

  return (
    <div>
      <h1>{common("welcome")}</h1>
      <button>{auth("login")}</button>
      <nav>{navigation("home")}</nav>
    </div>
  );
}
```

## 🎨 Styling

### Theme Support

```tsx
import { I18nProvider } from "@intl-party/react";

function ThemedApp() {
  return (
    <I18nProvider
      i18n={i18n}
      theme="dark" // or "light", "auto"
    >
      <App />
    </I18nProvider>
  );
}
```

### Custom Components

```tsx
// Custom translation component
function CustomTrans({ i18nKey, interpolation, components }) {
  const t = useTranslations();

  return (
    <span className="translation">
      {t(i18nKey, { interpolation, components })}
    </span>
  );
}
```

## 🔄 Migration from react-i18next

### Simple Migration

```tsx
// react-i18next
import { useTranslation } from "react-i18next";
const { t } = useTranslation();

// intl-party/react
import { useTranslations } from "@intl-party/react";
const t = useTranslations();
```

### Benefits of switching:

- ✅ **Better TypeScript**: No more `t('key' as any)`
- ✅ **Simpler API**: Less boilerplate code
- ✅ **Performance**: Optimized re-rendering
- ✅ **Modern**: Built for React 18+ and concurrent features

## 📦 Exports

```typescript
// Provider and context
export {
  I18nProvider,
  TypedI18nProvider,
  ScopedI18nProvider,
  useI18nContext,
  useTypedI18nContext,
  withI18n,
  type I18nProviderProps,
  type TypedI18nProviderProps,
  type ScopedI18nProviderProps,
  type I18nContextValue,
  type TypedI18nContextValue,
};

// Hooks
export {
  useTranslations,
  useTypedTranslations,
  useT,
  useTypedT,
  useScopedTranslations,
  useMultipleTranslations,
  useOptionalTranslation,
  useTranslationWithFallback,
  useHasTranslation,
  useTranslationValue,
  useInterpolatedTranslation,
  usePluralization,
};

// Locale and namespace hooks
export {
  useLocale,
  useLocaleInfo,
  useLocaleSwitch,
  useBrowserLocale,
  useLocalePreference,
  useDirection,
  useFormatting,
  useNamespace,
  useNamespaceInfo,
  useNamespaceSwitch,
  useMultipleNamespaces,
  useNamespacePreloading,
};

// Components
export {
  Trans,
  ConditionalTrans,
  PluralTrans,
  RichTrans,
  LocaleSelector,
  FlagLocaleSelector,
  CompactLocaleSelector,
  AccessibleLocaleSelector,
};

// Utilities
export { createI18nHook, createNamespaceHOC, I18nErrorBoundary };
```

## 🤝 Contributing

See the [main README](../../README.md) for contribution guidelines.

## 📄 License

MIT
