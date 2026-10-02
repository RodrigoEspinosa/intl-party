---
"@intl-party/cli": minor
---

The CLI now works on projects created by `intl-party nextjs --init`.

- `check`, `validate`, `sync`, and `extract` read locales and namespaces from the config's `messages` directory. They used to load nothing and report "no issues", so `check --missing` always passed. Expect it to start reporting real gaps, and to exit with code 1 when it does.
- `extract` scans `src/`, `app/`, `pages/`, `components/`, and `lib/` by default, and `--source` no longer overrides the config's `sourcePatterns` when it isn't passed.
- `extract` resolves keys in the translator's namespace (`const t = useTranslations("common"); t("navigation.home")`), reads and writes nested keys, and picks up calls with params (`t("greeting", { name })`). It used to write `navigation.json` with a flat `home` key. Keys are now reported as `namespace:key`.
- Removed `extract --update` and `extract --remove-unused`. They were never implemented: `extract` always merges new keys. To remove unused keys, use `intl-party sync` with `sync: { removeUnused: true }` in the config, or `sync --interactive`.
- `check` and `validate` exit with an error when no translation files are found, instead of reporting "no issues" for a misconfigured project.
- `sync` uses the config's `defaultLocale` as the base locale when `--base` isn't passed. It was always `en` before.
