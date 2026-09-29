# @intl-party/eslint-plugin

ESLint rules for IntlParty projects: catch untranslated text in JSX, translation keys that don't exist, and direct `i18n.t()` calls in components.

## Installation

```bash
npm install --save-dev @intl-party/eslint-plugin
```

Requires ESLint 8 or later. For `.tsx` files, use a parser that understands TypeScript and JSX, such as `@typescript-eslint/parser`.

## Setup

### Flat config (ESLint 9)

```javascript
// eslint.config.mjs
import intlParty from "@intl-party/eslint-plugin";

export default [
  // ...your other config, including a TypeScript/JSX parser for .tsx files
  intlParty.configs["flat/recommended"],
];
```

`configs["flat/strict"]` is also available. To choose rules yourself:

```javascript
export default [
  {
    plugins: { "@intl-party": intlParty },
    rules: {
      "@intl-party/no-hardcoded-strings": "warn",
      "@intl-party/no-missing-keys": "error",
      "@intl-party/prefer-translation-hooks": "warn",
    },
  },
];
```

### Legacy config (`.eslintrc`, ESLint 8)

```javascript
// .eslintrc.js
module.exports = {
  extends: ["plugin:@intl-party/recommended"], // or plugin:@intl-party/strict
};
```

## Presets

| Rule                                   | `recommended` | `strict`                                     |
| -------------------------------------- | ------------- | -------------------------------------------- |
| `@intl-party/no-hardcoded-strings`     | `warn`        | `error`, `minLength: 2`, also checks `label` |
| `@intl-party/no-missing-keys`          | `error`       | `error`                                      |
| `@intl-party/prefer-translation-hooks` | `warn`        | `error`                                      |

## Rules

### `no-hardcoded-strings`

Reports text in JSX that should come from a translation. It checks:

- JSX text: `<p>Hello there</p>`
- String values of the `placeholder`, `title`, `aria-label`, `aria-description`, and `alt` attributes (configurable with `attributes`)

It doesn't check string literals outside JSX, such as `const message = "Hello"`.

```jsx
// ❌
<h1>Welcome to our app</h1>
<input placeholder="Type your name" />

// ✅
<h1>{t("welcome")}</h1>
<input placeholder={t("namePlaceholder")} />
```

These are skipped automatically: text shorter than `minLength`, URLs and paths (`https://…`, `/…`, `./…`), kebab-case class names, `CONSTANT_CASE` values, CSS units (`12px`, `50%`), and tag-like words (`div`, `button`, …).

The rule offers an editor suggestion to replace the text with a `t()` call. It isn't applied by `eslint --fix`, because the key it proposes won't exist yet.

| Option           | Type       | Default                                                             |
| ---------------- | ---------- | ------------------------------------------------------------------- |
| `attributes`     | `string[]` | `["placeholder", "title", "aria-label", "aria-description", "alt"]` |
| `minLength`      | `number`   | `3`                                                                 |
| `ignorePattern`  | `string`   | none; a regex, e.g. `"^(\\d+\|[A-Z_]+)$"`                           |
| `allowedStrings` | `string[]` | `[]`                                                                |

```javascript
"@intl-party/no-hardcoded-strings": ["warn", {
  ignorePattern: "^(\\d+|[A-Z_]+|https?://.*)$",
  allowedStrings: ["OK"],
  minLength: 2,
}],
```

### `no-missing-keys`

Reports `t("key")` calls whose key doesn't exist in the default locale's messages, and keys with an invalid format. Only string-literal keys are checked, so dynamic keys are ignored.

```jsx
const t = useTranslations("common");
t("welcome"); // ✅ exists in messages/en/common.json
t("doesNotExist"); // ❌ Translation key "doesNotExist" is missing
```

Messages are loaded from the first of these that works:

1. The config file at `configPath`, or an `intl-party.config.js` / `intl-party.config.json` in the working directory (its `locales` and `messages` directory). An `intl-party.config.ts` can't be loaded by the rule and is skipped.
2. `translationFiles`, if set
3. The first of `messages/`, `locales/`, `i18n/`, `public/locales/`, `src/locales/`, `src/translations/` that exists, laid out as `<locale>/<namespace>.json`

If no messages can be loaded, the missing-key check is skipped. Loaded messages are cached for 5 minutes, so a long-running ESLint process (e.g. in your editor) may take that long to see new keys.

| Option             | Type       | Default                                                              |
| ------------------ | ---------- | -------------------------------------------------------------------- |
| `translationFiles` | `string[]` | auto-detected; file paths (not globs) like `messages/en/common.json` |
| `defaultLocale`    | `string`   | `"en"`                                                               |
| `configPath`       | `string`   | auto-detected                                                        |

With `const t = useTranslations("common")`, keys passed to `t` are looked up inside `common`, so nested keys like `t("navigation.home")` work. This applies to translators from `useTranslations`, `useScopedTranslations`, and `useZeroTranslations`, whatever the variable is named. A `t` that isn't bound to a namespace accepts a key that exists as a full path in any namespace, or as `namespace.key`.

### `prefer-translation-hooks`

Reports direct `i18n.t(...)` calls and suggests the `useTranslations()` hook. It also reports when three or more `t("x.…")` calls in a file share the prefix `x`, suggesting a scoped translator for it. Translators that are already scoped (`useTranslations("common")`) are ignored.

```jsx
// ❌
const { i18n } = useI18nContext();
i18n.t("welcome");

// ✅
const t = useTranslations("common");
t("welcome");
```

Your editor offers a suggestion to rewrite `i18n.t` to `t`. It isn't applied by `eslint --fix`, because it doesn't add the `useTranslations()` call that defines `t`.

| Option             | Type      | Default                                      |
| ------------------ | --------- | -------------------------------------------- |
| `allowDirectUsage` | `boolean` | `false`; `true` disables the `i18n.t` report |

## License

MIT
