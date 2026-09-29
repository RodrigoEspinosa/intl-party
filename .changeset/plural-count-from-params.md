---
"@intl-party/core": patch
---

Legacy plural messages (`"{{count|item|items}}"`) now use a numeric `count` from the interpolation values when no `count` option is given. The Next.js `useTranslations` hook's `t("items", { count: 2 })` returned the raw template before.
