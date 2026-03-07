# prefer-translation-hooks

Prefer using translation hooks over direct i18n instance usage in React components.

## Rule Details

In React applications, it's better to use the `useTranslations` hook. These hooks handle locale changes and subscription to translation updates automatically. Direct usage of the `i18n` instance might not trigger re-renders when the locale changes.

### Examples

❌ **Incorrect**

```tsx
import { i18n } from "./i18n";

function Component() {
  return <div>{i18n.t("welcome")}</div>;
}
```

✅ **Correct**

```tsx
import { useTranslations } from "@intl-party/nextjs";

function Component() {
  const t = useTranslations("common");
  return <div>{t("welcome")}</div>;
}
```

## Options

### `allowDirectUsage` (default: `false`)

If set to `true`, direct usage of `i18n.t()` will not be flagged. Use this if you have specific reasons to use the raw instance in certain components.
