---
"@intl-party/eslint-plugin": patch
---

`prefer-translation-hooks` now offers the `i18n.t` → `t` rewrite as an editor suggestion instead of an autofix, so `eslint --fix` no longer produces code that references an undefined `t`.
