# no-missing-keys

Ensure all translation keys exist in translation files. This rule helps catch typos and missing translations before they reach production.

## Rule Details

This rule checks the arguments passed to `t()` and `useTranslations()` against your project's translation files. It will report an error if a key is not found in the translation files for the default locale.

### Examples

❌ **Incorrect**

```tsx
// If 'welcome_msg' doesn't exist in translations
t('welcome_msg')
```

✅ **Correct**

```tsx
// If 'welcome' exists in translations
t('welcome')
```

## Options

### `translationFiles`

An array of paths to your translation JSON files. If not provided, it will attempt to find them automatically.

### `defaultLocale` (default: `en`)

The locale to check against.

### `configPath`

Path to your `intl-party.config.ts` or `intl-party.config.js`.

### `cacheTimeout` (default: 300,000 ms)

How long to cache the translation files in memory.

