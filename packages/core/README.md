# @intl-party/core

**Core internationalization library that powers the entire IntlParty ecosystem.**

## ✨ Features

- **🔒 Type-Safe**: Full TypeScript support with auto-completion
- **🎯 Framework Agnostic**: Works with any JavaScript framework
- **⚡ Lightweight**: Minimal bundle size and maximum performance
- **🌍 Advanced Locale Detection**: Smart locale detection from multiple sources
- **🛠️ Extensible**: Plugin system for custom functionality
- **📊 Validation**: Built-in validation and consistency checking

## 🚀 Quick Start

### Installation

```bash
npm install @intl-party/core
```

### Basic Usage

```typescript
import { createI18n } from "@intl-party/core";

// Create i18n instance
const i18n = createI18n({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["common", "navigation"],
});

// Add translations
i18n.addTranslations("en", "common", {
  welcome: "Welcome to IntlParty!",
  hello: "Hello {{name}}!",
});

// Use translations
const message = i18n.t("welcome"); // "Welcome to IntlParty!"
const greeting = i18n.t("hello", { interpolation: { name: "World" } }); // "Hello World!"
```

## 🎯 API Reference

### `createI18n(config)`

Creates a new i18n instance.

```typescript
const i18n = createI18n({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["common", "navigation"],
  fallbackChain: { es: "en", fr: "en" },
});
```

#### Configuration Options

```typescript
interface I18nConfig {
  locales: string[]; // Supported locales
  defaultLocale: string; // Default locale
  namespaces: string[]; // Available namespaces
  fallbackChain?: Record<string, string>; // Fallback locales
  interpolation?: {
    prefix?: string; // Interpolation prefix (default: "{{")
    suffix?: string; // Interpolation suffix (default: "}}")
  };
  validation?: {
    strict?: boolean; // Strict validation mode
    logMissing?: boolean; // Log missing translations
  };
}
```

### Core Methods

#### `t(key, options?)`

Main translation function.

```typescript
// Simple translation
i18n.t("welcome"); // "Welcome!"

// With interpolation
i18n.t("greeting", { interpolation: { name: "John" } }); // "Hello John!"

// With namespace
i18n.t("navigation.home", { namespace: "navigation" }); // "Home"

// With count (for plurals)
i18n.t("items", { count: 5 }); // "5 items"
```

#### `addTranslations(locale, namespace, translations)`

Add translations for a specific locale and namespace.

```typescript
i18n.addTranslations("en", "common", {
  welcome: "Welcome",
  goodbye: "Goodbye",
});

i18n.addTranslations("es", "common", {
  welcome: "Bienvenido",
  goodbye: "Adiós",
});
```

#### `setLocale(locale)`

Change the current locale.

```typescript
i18n.setLocale("es");
console.log(i18n.getLocale()); // "es"
```

#### `setNamespace(namespace)`

Change the current namespace.

```typescript
i18n.setNamespace("navigation");
console.log(i18n.getNamespace()); // "navigation"
```

#### `getLocale()`

Get the current locale.

```typescript
const currentLocale = i18n.getLocale();
```

#### `getNamespace()`

Get the current namespace.

```typescript
const currentNamespace = i18n.getNamespace();
```

#### `hasTranslation(key, namespace?)`

Check if a translation exists.

```typescript
if (i18n.hasTranslation("welcome")) {
  console.log("Translation exists");
}
```

## 🌐 Advanced Features

### Locale Detection

```typescript
import { detectLocale } from "@intl-party/core";

// Detect from multiple sources
const locale = detectLocale({
  locales: ["en", "es", "fr"],
  sources: [
    "localStorage", // User preference
    "cookie", // Server-side persistence
    "acceptLanguage", // Browser setting
    "queryParam", // URL parameter
  ],
  fallback: "en",
});
```

### Fallback Chains

```typescript
const i18n = createI18n({
  locales: ["en", "es", "fr", "de"],
  defaultLocale: "en",
  fallbackChain: {
    // If translation missing in Spanish, try English
    es: "en",
    // If translation missing in French, try English
    fr: "en",
    // If translation missing in German, try Spanish, then English
    de: "es",
  },
});
```

### Interpolation (Legacy Format)

```typescript
const i18n = createI18n({
  interpolation: {
    prefix: "{{", // Custom prefix
    suffix: "}}", // Custom suffix
  },
});

i18n.addTranslations("en", "common", {
  greeting: "Hello {{name}}! You have {{count}} messages.",
});

i18n.t("greeting", { interpolation: { name: "John", count: 5 } });
// "Hello John! You have 5 messages."
```

### ICU MessageFormat

For advanced pluralization, gender selection, and locale-specific formatting, IntlParty supports [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/):

```bash
# Install the optional dependency
npm install intl-messageformat
```

```typescript
i18n.addTranslations("en", "common", {
  // ICU plural
  items: "{count, plural, one {# item} other {# items}}",
  // ICU select
  pronoun: "{gender, select, male {He} female {She} other {They}}",
  // Simple ICU argument
  welcome: "Hello {name}!",
});

// Usage
i18n.t("items", { count: 1 }); // "1 item"
i18n.t("items", { count: 5 }); // "5 items"
i18n.t("pronoun", { interpolation: { gender: "female" } }); // "She"
i18n.t("welcome", { interpolation: { name: "World" } }); // "Hello World!"
```

#### Locale-Specific Plural Rules

ICU MessageFormat automatically uses the correct plural rules for each locale:

```typescript
// Russian has complex plural rules (one, few, many, other)
i18n.addTranslations("ru", "common", {
  items: "{count, plural, one {# товар} few {# товара} many {# товаров} other {# товара}}",
});

i18n.setLocale("ru");
i18n.t("items", { count: 1 });  // "1 товар"
i18n.t("items", { count: 2 });  // "2 товара"
i18n.t("items", { count: 5 });  // "5 товаров"
i18n.t("items", { count: 21 }); // "21 товар"
```

#### Format Detection

IntlParty automatically detects which format each message uses:

```typescript
import { isICUFormat, isLegacyFormat, detectMessageFormat } from "@intl-party/core";

isICUFormat("{count, plural, one {#} other {#}}"); // true
isICUFormat("Hello {{name}}!");                    // false

isLegacyFormat("Hello {{name}}!");                 // true
isLegacyFormat("{count, plural, one {#} other {#}}"); // false

detectMessageFormat("{count, plural, ...}"); // "icu"
detectMessageFormat("Hello {{name}}!");      // "legacy"
detectMessageFormat("Hello world!");         // "plain"
```

Both formats can coexist in the same project - use whichever is appropriate for each message.

### Validation

```typescript
const i18n = createI18n({
  validation: {
    strict: true, // Throw errors for missing translations
    logMissing: true, // Console log missing translations
  },
});

// Will log warning if key doesn't exist
i18n.t("nonexistent.key");
```

## 🔧 Utilities

### `createScopedTranslator(namespace)`

Create a translation function scoped to a namespace.

```typescript
const t = i18n.createScopedTranslator("navigation");

t("home"); // Same as i18n.t("navigation.home", { namespace: "navigation" })
t("about"); // Same as i18n.t("navigation.about", { namespace: "navigation" })
```

### `getAvailableLocales()`

Get all available locales.

```typescript
const locales = i18n.getAvailableLocales(); // ["en", "es", "fr"]
```

### `getAvailableNamespaces()`

Get all available namespaces.

```typescript
const namespaces = i18n.getAvailableNamespaces(); // ["common", "navigation"]
```

### `validateTranslations()`

Validate all translations for completeness and consistency.

```typescript
const validation = i18n.validateTranslations();

console.log(validation.missing); // Missing translations
console.log(validation.unused); // Unused translations
console.log(validation.inconsistent); // Inconsistent translations
```

## 📊 Events

Listen to i18n events:

```typescript
// Locale change
i18n.on("localeChange", ({ locale }) => {
  console.log(`Locale changed to ${locale}`);
});

// Namespace change
i18n.on("namespaceChange", ({ namespace }) => {
  console.log(`Namespace changed to ${namespace}`);
});

// Translations loading
i18n.on("translationsLoading", ({ locale, namespace }) => {
  console.log(`Loading ${namespace} for ${locale}`);
});

// Translations loaded
i18n.on("translationsLoaded", ({ locale, namespace }) => {
  console.log(`Loaded ${namespace} for ${locale}`);
});
```

## 🎨 TypeScript Support

### Type-Safe Translation Keys

```typescript
interface Translations {
  common: {
    welcome: string;
    navigation: {
      home: string;
      about: string;
    };
  };
}

const i18n = createI18n<Translations>({
  locales: ["en", "es"],
  defaultLocale: "en",
  namespaces: ["common"],
});

// Fully typed translation function
const t = i18n.t;

t("welcome"); // ✅ Type-safe
t("navigation.home"); // ✅ Type-safe
t("invalid.key"); // ❌ TypeScript error
```

### Generic Types

```typescript
interface AppTranslations {
  common: CommonTranslations;
  navigation: NavigationTranslations;
  auth: AuthTranslations;
}

const i18n = createI18n<AppTranslations>({
  // ... config
});
```

## 🔄 Migration from other libraries

### From react-i18next

```typescript
// react-i18next
import i18n from "i18next";
i18n.t("key");

// intl-party/core
import { createI18n } from "@intl-party/core";
const i18n = createI18n(config);
i18n.t("key");
```

### From FormatJS

```typescript
// FormatJS
import { IntlProvider } from "react-intl";

// intl-party/core
import { createI18n } from "@intl-party/core";
const i18n = createI18n(config);
```

## 📦 Package Structure

```
@intl-party/core/
├── src/
│   ├── index.ts           # Main exports
│   ├── i18n.ts           # Core I18n class
│   ├── detection/         # Locale detection utilities
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── validation/       # Validation utilities
└── dist/                # Built distribution
```

## 🤝 Contributing

See the [main README](../../README.md) for contribution guidelines.

## 📄 License

MIT
