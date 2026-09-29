---
"@intl-party/eslint-plugin": patch
---

`no-missing-keys` resolves keys inside the namespace of the translator they're called on (`const t = useTranslations("common")`), so nested keys like `t("navigation.home")` are no longer reported as missing. Translators with any variable name are checked. `prefer-translation-hooks` no longer suggests scoping for nested keys on a translator that's already scoped.
