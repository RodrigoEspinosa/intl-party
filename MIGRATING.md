# Migrating to IntlParty

This guide helps you migrate from other internationalization (i18n) libraries to IntlParty.

## Table of Contents

- [From next-intl](#from-next-intl)
- [From react-i18next](#from-react-i18next)
- [From FormatJS (react-intl)](#from-formatjs-react-intl)
- [From lingui](#from-lingui)
- [General Migration Tips](#general-migration-tips)

## From next-intl

[next-intl](https://next-intl-docs.vercel.app/) is a popular i18n library for Next.js. Here's how to migrate:

### Configuration

#### next-intl:

```typescript
// i18n.ts
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));

// middleware.ts
import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "fr", "es"],
  defaultLocale: "en",
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

#### IntlParty:

```typescript
// intl-party.config.ts
export default {
  locales: ["en", "fr", "es"],
  defaultLocale: "en",
  messages: "./messages",
  localePrefix: "as-needed", // matches next-intl default
};

// middleware.ts
import { createSetup } from "@intl-party/nextjs";
import config from "./intl-party.config";

const { middleware, middlewareConfig } = createSetup(config);

export { middleware };
export const config = middlewareConfig;
```

### Usage in Components

#### next-intl:

```tsx
"use client";

import { useTranslations } from "next-intl";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");

  return (
    <div>
      <p>{t("switchLocale")}</p>
      <p>{t("welcomeMessage", { username: "John" })}</p>
    </div>
  );
}
```

#### IntlParty:

```tsx
"use client";

import { useTranslations } from "@intl-party/nextjs";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");

  return (
    <div>
      <p>{t("switchLocale")}</p>
      <p>{t("welcomeMessage", { interpolation: { username: "John" } })}</p>
    </div>
  );
}
```

### Key Differences

1. **Type Safety**: IntlParty provides better TypeScript integration without explicit type assertions
2. **Interpolation**: Use `interpolation` object instead of direct parameter passing
3. **Setup**: Simple configuration with `createSetup` and a single config file
4. **Clean URLs**: Default is clean URLs (no locale prefix)

## From react-i18next

[react-i18next](https://react.i18next.com/) is a React integration for i18next. Here's how to migrate:

### Configuration

#### react-i18next:

```typescript
// i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    debug: true,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

#### IntlParty:

```typescript
// i18n.ts
import { createI18n } from "@intl-party/core";
import enTranslations from "./locales/en.json";
import frTranslations from "./locales/fr.json";

const i18n = createI18n({
  locales: ["en", "fr"],
  defaultLocale: "en",
  namespaces: ["translation", "common"],
});

i18n.addTranslations("en", "translation", enTranslations);
i18n.addTranslations("fr", "translation", frTranslations);

export default i18n;
```

### Usage in Components

#### react-i18next:

```tsx
import React from "react";
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("greeting", { name: "John" })}</p>
      <p>{t("items", { count: 5 })}</p>
      <p>{t("nested.key")}</p>
    </div>
  );
}
```

#### IntlParty:

```tsx
import React from "react";
import { useTranslations } from "@intl-party/react";

function MyComponent() {
  const t = useTranslations("translation");

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("greeting", { interpolation: { name: "John" } })}</p>
      <p>{t("items", { count: 5 })}</p>
      <p>{t("nested.key")}</p>
    </div>
  );
}
```

### Key Differences

1. **Cleaner API**: No need for destructuring, just use the returned function
2. **Interpolation**: Use `interpolation` object for variable replacement
3. **Namespaces**: Explicitly specify the namespace during hook initialization
4. **Type Safety**: Better TypeScript integration without manual type assertions
5. **Loading**: Replace `Suspense` with IntlParty's built-in loading handling

### Trans Component Migration

#### react-i18next:

```tsx
import { Trans } from "react-i18next";

function RichText() {
  return (
    <Trans i18nKey="richText" t={t}>
      Welcome to <strong>{{ name }}</strong>.
    </Trans>
  );
}
```

#### IntlParty:

```tsx
import { Trans } from "@intl-party/react";

function RichText() {
  return (
    <Trans
      i18nKey="richText"
      components={{
        strong: <strong />,
      }}
      interpolation={{ name: "World" }}
    />
  );
}
```

## From FormatJS (react-intl)

[react-intl](https://formatjs.io/docs/react-intl/) is part of the FormatJS suite. Here's how to migrate:

### Configuration

#### react-intl:

```tsx
import React from "react";
import { IntlProvider } from "react-intl";
import English from "./locales/en.json";
import French from "./locales/fr.json";

const messages = {
  en: English,
  fr: French,
};

function App({ locale }) {
  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <MyComponent />
    </IntlProvider>
  );
}
```

#### IntlParty:

```tsx
import React from "react";
import { I18nProvider } from "@intl-party/react";
import { createI18n } from "@intl-party/core";
import English from "./locales/en.json";
import French from "./locales/fr.json";

const i18n = createI18n({
  locales: ["en", "fr"],
  defaultLocale: "en",
  namespaces: ["messages"],
});

// Add translations
i18n.addTranslations("en", "messages", English);
i18n.addTranslations("fr", "messages", French);

function App({ locale }) {
  return (
    <I18nProvider i18n={i18n} initialLocale={locale}>
      <MyComponent />
    </I18nProvider>
  );
}
```

### Usage in Components

#### react-intl:

```tsx
import { useIntl, FormattedMessage } from "react-intl";

function MyComponent() {
  const intl = useIntl();

  return (
    <div>
      <h1>
        <FormattedMessage id="welcome" defaultMessage="Welcome" />
      </h1>
      <p>{intl.formatMessage({ id: "greeting" }, { name: "John" })}</p>
    </div>
  );
}
```

#### IntlParty:

```tsx
import { useTranslations } from "@intl-party/react";

function MyComponent() {
  const t = useTranslations("messages");

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("greeting", { interpolation: { name: "John" } })}</p>
    </div>
  );
}
```

### Key Differences

1. **Simpler Component API**: No need for `FormattedMessage` components
2. **Streamlined Hook**: More intuitive hook usage with direct function return
3. **Interpolation**: Use `interpolation` object for variables
4. **Type Safety**: Better TypeScript integration throughout
5. **Message Definition**: No need for separate `defaultMessage` in components

## From lingui

[lingui](https://lingui.js.org/) is another popular React i18n library. Here's how to migrate:

### Configuration

#### lingui:

```typescript
// lingui.config.js
/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: ["en", "fr", "es"],
  sourceLocale: "en",
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src"],
    },
  ],
  format: "po",
};
```

#### IntlParty:

```typescript
// intl-party.config.ts
export default {
  locales: ["en", "fr", "es"],
  defaultLocale: "en",
  messages: "./src/locales",
};
```

### Usage in Components

#### lingui:

```tsx
import { Trans, Plural } from "@lingui/macro";

function MyComponent() {
  const count = 3;

  return (
    <div>
      <h1>
        <Trans>Welcome</Trans>
      </h1>
      <p>
        <Trans>Hello, {name}!</Trans>
      </p>
      <p>
        <Plural value={count} one="# item" other="# items" />
      </p>
    </div>
  );
}
```

#### IntlParty:

```tsx
import { useTranslations } from "@intl-party/react";

function MyComponent() {
  const count = 3;
  const t = useTranslations("messages");

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("greeting", { interpolation: { name } })}</p>
      <p>{t("items", { count })}</p>
    </div>
  );
}
```

### Key Differences

1. **No Macros Required**: IntlParty doesn't use macros for extraction
2. **Pluralization**: Simpler pluralization with `count` parameter
3. **Message Format**: JSON-based instead of PO files
4. **Type Safety**: Better TypeScript support with auto-completion

## General Migration Tips

1. **Incremental Migration**: Migrate one component or feature at a time
2. **Translation Files**: Convert your existing translation files to JSON format
3. **Key Structure**: Maintain your existing key structure when possible
4. **Namespace Organization**: Group related translations into logical namespaces
5. **Test Thoroughly**: Verify all translations work correctly after migration

### Translation Format

IntlParty uses a simple JSON format for translations:

```json
{
  "common": {
    "welcome": "Welcome to IntlParty",
    "greeting": "Hello {{name}}!",
    "items_zero": "No items",
    "items_one": "{{count}} item",
    "items_other": "{{count}} items",
    "nested": {
      "key": "This is a nested key"
    }
  }
}
```

### Migration Tools

To help with migration, you can use the CLI to extract and validate your translations:

```bash
# Initialize IntlParty in your project
npx intl-party init

# Extract existing keys from your codebase
npx intl-party extract

# Validate your translations
npx intl-party check
```

## Need More Help?

If you encounter specific migration challenges:

1. Check our [troubleshooting guide](./README.md#troubleshooting-guide)
2. Open an issue on GitHub with details about your migration scenario
3. Join our community discussion for more personalized help
