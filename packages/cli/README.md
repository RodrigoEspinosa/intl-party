# @intl-party/cli

Command-line tools for IntlParty: scaffold a Next.js project, register your messages for type-checked keys, and find missing or unused translations, locally or in CI.

```bash
npm install --save-dev @intl-party/cli
npx intl-party --help
```

## Quick Start (Next.js)

```bash
npx intl-party nextjs --init        # config, middleware, messages, layout, intl-party.d.ts
npx intl-party check --missing      # exit 1 if any locale is missing a key
```

The CLI reads `intl-party.config.ts` (or `.js` / `.json`) from the working directory. Locales and namespaces are read from your messages directory, laid out as `<messages>/<locale>/<namespace>.json`:

```typescript
// intl-party.config.ts
export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  messages: "./messages",
};
```

## Commands

### `nextjs --init`

Scaffolds a Next.js App Router project: `intl-party.config.ts`, `middleware.ts` (`proxy.ts` on Next.js 16+), sample `messages/`, `intl-party.d.ts`, and an example layout and page (`app/layout.intl-party.tsx`, `app/page.intl-party.tsx`) to merge into yours. Use `--force` to overwrite existing files.

`--locale-prefix as-needed` (or `always`) sets up `/es/about`-style URLs: it adds `localePrefix` to the config and puts the example layout and page under `app/[locale]/`.

### `check`

Fails (exit 1) when translations have problems, so you can run it in CI.

```bash
npx intl-party check                  # all checks
npx intl-party check --missing        # keys present in one locale but not another
npx intl-party check --format-errors  # unmatched {{ }} interpolation brackets
```

It also fails if no translation files can be found, so a misconfigured project doesn't pass silently.

### `validate`

A completeness and consistency report, with machine-readable output:

```bash
npx intl-party validate
npx intl-party validate --locales es fr --namespaces common
npx intl-party validate --format json --output report.json   # or --format junit
npx intl-party validate --strict
```

### `generate --types`

Writes `intl-party.d.ts`, which registers your default locale's message files so `useTranslations(namespace)` only accepts keys that exist. Re-run it after adding or removing a namespace file; editing keys needs no regeneration. A hand-written `intl-party.d.ts` is left untouched.

```bash
npx intl-party generate --types
npx intl-party generate --types --watch
```

It also writes generated types and message modules to `--output` (default `./node_modules/.intl-party`). `--schemas` and `--docs` add JSON schemas and a Markdown summary.

### `extract`

Finds the translation keys your code uses and adds any that are missing to the message files.

```bash
npx intl-party extract --dry-run   # list keys and what's missing, write nothing
npx intl-party extract             # add missing keys
```

- It scans `src/`, `app/`, `pages/`, `components/`, and `lib/` by default. Use `--source "<glob>"` or `sourcePatterns` in the config to change that.
- It recognizes `t("key")` and `t("key", { … })` on translators from `useTranslations("namespace")` (any variable name), `useTranslations("ns")("key")`, and `<Trans i18nKey="key" />`.
- Keys go into the translator's namespace as nested paths: `t("navigation.home")` under `useTranslations("common")` becomes `{ "navigation": { "home": … } }` in `common.json`.
- New keys get the key as a placeholder in the default locale and an empty string elsewhere. Existing values are never overwritten.

### `sync`

Copies keys from a base locale (default: `defaultLocale`) into the others:

```bash
npx intl-party sync --dry-run          # show what would change
npx intl-party sync                    # add missing keys (base-locale text as placeholder)
npx intl-party sync --base en --target es fr
npx intl-party sync --interactive      # choose whether to add and/or remove
```

To also remove keys that no longer exist in the base locale, set `sync: { removeUnused: true }` in the config, or answer yes in `--interactive` mode. `--missing-only` never removes.

### `check-config`

Validates `intl-party.config.*`.

### `init`

An interactive setup for non-Next.js projects (`--template react|vanilla`). It needs a terminal.

## Global options

| Option                | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `-c, --config <path>` | Config file (default: auto-detect `intl-party.config.{js,ts,json}`) |
| `-v, --verbose`       | More output                                                         |
| `--no-color`          | Plain output                                                        |

## Configuration reference

| Field               | Default                                                   | Used by   |
| ------------------- | --------------------------------------------------------- | --------- |
| `locales`           | detected from the messages directory                      | all       |
| `defaultLocale`     | first locale                                              | all       |
| `messages`          | `"./messages"`                                            | all       |
| `namespaces`        | every `<namespace>.json` found                            | all       |
| `sourcePatterns`    | `["{src,app,pages,components,lib}/**/*.{ts,tsx,js,jsx}"]` | `extract` |
| `sync.removeUnused` | `false`                                                   | `sync`    |
| `sync.addMissing`   | `true`                                                    | `sync`    |

## CI example

```yaml
# .github/workflows/i18n.yml
name: i18n
on: [pull_request]
jobs:
  translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx intl-party check
```

## License

MIT
