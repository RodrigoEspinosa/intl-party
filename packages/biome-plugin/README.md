# @intl-party/biome-plugin

[Biome](https://biomejs.dev) linter plugins for IntlParty projects: catch untranslated text in JSX and direct `i18n.t()` calls in components, without adding ESLint.

They're [GritQL plugins](https://biomejs.dev/linter/plugins/) that port two of the [`@intl-party/eslint-plugin`](../eslint-plugin) rules. GritQL matches source patterns only, so the ports have fewer features than the ESLint rules. See [Differences from the ESLint rules](#differences-from-the-eslint-rules).

## Installation

```bash
npm install --save-dev @intl-party/biome-plugin
```

Requires Biome 2.5 or later. Tested with Biome 2.5.15.

## Setup

Biome loads plugins by file path, so point `plugins` at the files in `node_modules`:

```json
{
  "plugins": [
    {
      "path": "./node_modules/@intl-party/biome-plugin/no-hardcoded-strings.grit",
      "includes": ["**/*.jsx", "**/*.tsx"]
    },
    {
      "path": "./node_modules/@intl-party/biome-plugin/prefer-translation-hooks.grit",
      "includes": ["**/*.jsx", "**/*.tsx"]
    }
  ]
}
```

The paths are relative to `biome.json`. In a monorepo, install the package next to the `biome.json` that references it.

`includes` limits each plugin to your component files. Without it, a plugin runs on every file Biome checks. That matters most for `prefer-translation-hooks`, because server code and scripts may call `i18n.t()` on purpose. Start each pattern with `**/`: Biome 2.5 matches plugin `includes` against absolute paths, so a pattern like `src/components/**` matches nothing. Use `["**/components/**"]` instead.

Diagnostics show up in `biome lint` and `biome check` as warnings. Warnings don't fail the command unless you pass `--error-on-warnings`.

### Suppressing a diagnostic

Use a `lint/plugin` suppression comment:

```jsx
<p>
  {/* biome-ignore lint/plugin: product name */}
  <span>IntlParty</span>
</p>
```

## Rules

### `no-hardcoded-strings.grit`

Reports text in JSX that should come from a translation. It checks:

- JSX text: `<p>Hello there</p>`
- String values of the `placeholder`, `title`, `aria-label`, `aria-description`, and `alt` attributes

It doesn't check string literals outside JSX, such as `const message = "Hello"`, or strings inside JSX expressions, such as `title={"Hello"}`.

```jsx
// ❌
<h1>Welcome to our app</h1>
<input placeholder="Type your name" />

// ✅
<h1>{t("welcome")}</h1>
<input placeholder={t("namePlaceholder")} />
```

These are skipped: text shorter than 3 characters (trimmed), URLs and paths (`https://…`, `/…`, `./…`), kebab-case class names, `CONSTANT_CASE` values, CSS units (`12px`, `50%`), and tag-like words (`div`, `button`, …). A skip only applies when it matches the whole text, so `Use the flex-row class` is still reported.

### `prefer-translation-hooks.grit`

Reports direct `i18n.t` usage, including `i18n?.t` and references like `const translate = i18n.t`, and suggests the `useTranslations()` hook.

```jsx
// ❌
const { i18n } = useI18nContext();
i18n.t("welcome");

// ✅
const t = useTranslations("common");
t("welcome");
```

## Differences from the ESLint rules

| ESLint feature                                                                               | Biome plugin                                                                                                                                                  |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-hardcoded-strings` options: `attributes`, `minLength`, `ignorePattern`, `allowedStrings` | Not available, because GritQL plugins can't take options. To change them, copy the `.grit` file into your project, edit it, and point `plugins` at your copy. |
| Editor suggestion to replace text with `t('key')`                                            | Not offered. The rewrite needs a `t` in scope and a key that exists, which a source pattern can't check.                                                      |
| `prefer-translation-hooks` report when three or more `t("x.…")` calls share a prefix         | Not available, because it needs to count calls across a file.                                                                                                 |
| `prefer-translation-hooks` `allowDirectUsage` option                                         | Leave the plugin out of `plugins`, or narrow its `includes`.                                                                                                  |
| `no-missing-keys`                                                                            | Not ported. It loads your config and translation files, which GritQL can't do. See [Checking for missing keys](#checking-for-missing-keys).                   |
| Messages include the reported text                                                           | Messages are fixed text. The diagnostic's location points at the text.                                                                                        |

### Checking for missing keys

To list keys your code uses that aren't in your translation files, run:

```bash
npx intl-party extract --dry-run
```

It scans the files in your config's `sourcePatterns` and prints the missing keys for each locale, without writing anything. It exits successfully even when keys are missing, so it won't fail a CI job. To fail the build on a missing key, run [`@intl-party/eslint-plugin`](../eslint-plugin)'s `no-missing-keys` rule on its own next to Biome.

## License

MIT
