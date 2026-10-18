---
"@intl-party/eslint-plugin": patch
---

Document using the plugin with Oxlint's JS plugin support (`jsPlugins` in `.oxlintrc.json`). All three rules were tested with Oxlint 1.88.0, including rule options, translation-file loading and suggestions. A parity test now runs the built plugin through both Oxlint and ESLint. The presets can't be used in Oxlint, and `oxlint --fix-suggestions` applies the `t('key')` suggestions that `eslint --fix` doesn't, so the README warns against it.
