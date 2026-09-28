# @intl-party/react-native

**React Native and Expo integration for IntlParty — device locale detection, persisted locale preference, and the same type-safe hooks as `@intl-party/react`.**

[![npm version](https://img.shields.io/npm/v/@intl-party/react-native.svg)](https://www.npmjs.com/package/@intl-party/react-native)
[![license](https://img.shields.io/npm/l/@intl-party/react-native.svg)](https://github.com/RodrigoEspinosa/intl-party/blob/master/LICENSE)

## ✨ Features

- **📱 Device Locale Detection**: Reads the user's preferred locales via `expo-localization` or `react-native-localize`
- **💾 Persisted Preference**: Stores the chosen locale in AsyncStorage
- **⏳ Async-Aware Provider**: `ReactNativeI18nProvider` waits for detection before rendering
- **⚛️ Same Hooks**: Re-exports `useTranslations`, `useLocale`, `Trans`, and friends from `@intl-party/react`
- **🧩 Optional Native Deps**: Every native module is an optional peer dependency — install only what you use

## 🚀 Quick Start

### Installation

```bash
npm install @intl-party/react-native @intl-party/core
```

Then install the native modules you need:

```bash
# Expo projects
npx expo install expo-localization @react-native-async-storage/async-storage

# Bare React Native projects
npm install react-native-localize @react-native-async-storage/async-storage
```

### Basic Usage

```tsx
import { Text, Button } from "react-native";
import {
  ReactNativeI18nProvider,
  createAsyncStorageDetector,
  createDeviceLocaleDetector,
  useTranslations,
  useLocale,
  type I18nConfig,
} from "@intl-party/react-native";

const config: I18nConfig = {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["common"],
};

const detectDeviceLocale = createDeviceLocaleDetector({
  supportedLocales: config.locales,
  fallbackLocale: "en",
});

// Use the user's saved choice if there is one, otherwise the device language
const storage = createAsyncStorageDetector({
  supportedLocales: config.locales,
  fallbackLocale: detectDeviceLocale(),
});

export default function App() {
  return (
    <ReactNativeI18nProvider
      config={config}
      detectLocale={storage.detect}
      onLocaleChange={storage.persist}
      fallbackLocale="en"
      loadingComponent={<Text>Loading…</Text>}
    >
      <Home />
    </ReactNativeI18nProvider>
  );
}

function Home() {
  const t = useTranslations("common");
  const [locale, setLocale] = useLocale();

  return (
    <>
      <Text>{t("welcome")}</Text>
      <Button
        title={locale === "en" ? "Español" : "English"}
        onPress={() => setLocale(locale === "en" ? "es" : "en")}
      />
    </>
  );
}
```

### Loading translations

When the provider is created from `config`, add your messages to its instance once, before the first render that uses them:

```tsx
import { useState } from "react";
import { useI18nContext } from "@intl-party/react-native";
import en from "./messages/en/common.json";
import es from "./messages/es/common.json";

function TranslationsLoader({ children }: { children: React.ReactNode }) {
  const { i18n } = useI18nContext();
  useState(() => {
    i18n.addTranslations("en", "common", en);
    i18n.addTranslations("es", "common", es);
  });
  return <>{children}</>;
}
```

Wrap `<Home />` in `<TranslationsLoader>` inside the provider.

## 🎯 API Reference

### `ReactNativeI18nProvider`

Accepts every `I18nProvider` prop from `@intl-party/react` except `initialLocale`, plus:

| Prop               | Type                              | Description                                                      |
| ------------------ | --------------------------------- | ---------------------------------------------------------------- |
| `detectLocale`     | `() => Promise<Locale> \| Locale` | Resolves the initial locale. Sync detectors work too.            |
| `onLocaleChange`   | `(locale: Locale) => void`        | Called when the locale changes — use it to persist the choice.   |
| `fallbackLocale`   | `Locale`                          | Used if detection throws. Defaults to `config.defaultLocale`.    |
| `loadingComponent` | `ReactNode`                       | Rendered while detection is pending. Renders nothing by default. |

### `createDeviceLocaleDetector(options)`

Returns a synchronous function that matches the device's preferred locales against `supportedLocales`, trying an exact match (`pt-BR`) and then the language only (`pt`).

Sources, in order: `expo-localization` → `react-native-localize` → `fallbackLocale`.

```ts
const detect = createDeviceLocaleDetector({
  supportedLocales: ["en", "es"],
  fallbackLocale: "en",
});
detect(); // "es" on a device set to es-MX
```

### `createAsyncStorageDetector(options)`

Returns `{ detect, persist, clear }` for storing the locale preference in AsyncStorage. Requires `@react-native-async-storage/async-storage`.

| Option             | Type       | Default                |
| ------------------ | ---------- | ---------------------- |
| `supportedLocales` | `Locale[]` | —                      |
| `fallbackLocale`   | `Locale`   | —                      |
| `storageKey`       | `string`   | `"@intl-party/locale"` |

`detect()` never throws: it returns `fallbackLocale` if storage is unavailable or the stored value isn't supported.

### Hooks and components

Everything from [`@intl-party/react`](../react) is re-exported, so you don't need to install it separately: `useTranslations`, `useLocale`, `useNamespace`, `useHasTranslation`, `Trans`, and more. See the [React package docs](../react/README.md) for details.

## 📄 License

MIT © [RodrigoEspinosa](https://github.com/RodrigoEspinosa)
