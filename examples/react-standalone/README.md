# IntlParty React Standalone Example

This is a standalone React application demonstrating how to use IntlParty without Next.js.

## Features

- React with Vite for fast development
- Type-safe translations with IntlParty
- Multi-language support (English, French, Spanish, German)
- Locale switching
- Pluralization example
- Interpolation example

## Getting Started

### Prerequisites

Make sure you have Node.js (v18+) and pnpm installed.

### Installation

```bash
# From the monorepo root
pnpm install
pnpm build

# Run the example
cd examples/react-standalone
pnpm dev
```

## Project Structure

```
react-standalone/
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Main application
│   ├── messages.ts            # Translation messages
│   ├── components/
│   │   └── LocaleSelector.tsx # Language selector
│   └── pages/
│       ├── Home.tsx           # Home page
│       └── About.tsx          # About page
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## How It Works

1. **Setup**: Initialize IntlParty with your supported locales and namespaces

```tsx
// main.tsx
const i18n = createI18n({
  locales: ["en", "fr", "es", "de"],
  defaultLocale: "en",
  namespaces: ["common", "home", "about"],
});
```

2. **Provide translations**: Add translations for each locale and namespace

```tsx
// Add translations
Object.entries(translations).forEach(([locale, namespaces]) => {
  Object.entries(namespaces).forEach(([namespace, messages]) => {
    i18n.addTranslations(locale, namespace, messages);
  });
});
```

3. **Use in components**: Access translations with `useTranslations` hook

```tsx
// In a component
const t = useTranslations("home");
return <h1>{t("title")}</h1>;
```

4. **Change locale**: Use the `useLocale` hook

```tsx
const [locale, setLocale] = useLocale();
```

## Key Features Demonstrated

1. **Basic translation**: `t('key')`
2. **Interpolation**: `t('greeting', { interpolation: { name: 'World' } })`
3. **Pluralization**: `t('counter', { count })`
4. **Namespace separation**: Different namespaces for different sections
5. **Locale switching**: Using the `useLocale` hook

## Learn More

See the [IntlParty documentation](https://github.com/RodrigoEspinosa/intl-party) for more details.
