# @intl-party/client

> **Deprecated.** This package will be removed in the next major version. See [#80](https://github.com/RodrigoEspinosa/intl-party/issues/80).

`@intl-party/client` was meant to be a generated, Prisma-style client. It never read the files `intl-party generate --client` writes, so its `TranslationKey` accepted any string, and its `t()` skipped the default-locale fallback and plurals that `@intl-party/core` handles. Calling `createTranslationFunction` or `createClient` now logs a one-time deprecation warning.

## Migrating

Translate with `@intl-party/core`:

```typescript
import { createI18n } from "@intl-party/core";
import en from "./messages/en/common.json";
import es from "./messages/es/common.json";

const i18n = createI18n({
  locales: ["en", "es"],
  defaultLocale: "en",
  namespaces: ["common"],
});
i18n.addTranslations("en", "common", en);
i18n.addTranslations("es", "common", es);

i18n.t("welcome");
i18n.setLocale("es");
```

| `@intl-party/client`                   | Replacement                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `createTranslationFunction(locale, m)` | `createI18n(...)`, then `i18n.addTranslations(locale, namespace, m)` and `i18n.t(key)`         |
| `createClient(locale, m)`              | Same; switch languages with `i18n.setLocale(locale)`                                           |
| `getLocaleMessages(locale, all)`       | `all[locale]`                                                                                  |
| `intl-party generate --client`         | `intl-party generate --types`, which writes `intl-party.d.ts` and registers your message types |

For type-checked keys, use the React or Next.js hooks with `intl-party generate --types`. See the [main README](../../README.md#-type-checked-translation-keys).

## License

MIT
