# Troubleshooting

## Missing translations

**Symptom**: the page shows a key (`welcome`) instead of the translated text.

1. Check the namespace: `useTranslations("common")` reads `messages/<locale>/common.json`.
2. Check the file exists for the active locale, e.g. `messages/es/common.json`.
3. Check the key's spelling and nesting. Nested keys use dot paths: `t("navigation.home")`.
4. Run `npx intl-party check --missing` to list every key missing from any locale.

## Translation keys aren't type-checked

**Symptom**: misspelled keys compile, or the editor doesn't autocomplete keys.

1. Make sure `intl-party.d.ts` exists in your project root. Create or update it with `npx intl-party generate --types`. Re-run this after adding or removing a namespace file.
2. Make sure your `tsconfig.json` `include` covers `intl-party.d.ts`. The default Next.js `"**/*.ts"` does.
3. Make sure `"resolveJsonModule": true` is set. Next.js sets it by default.
4. Restart the TypeScript server (VS Code: "TypeScript: Restart TS Server").

If you have your own `intl-party.d.ts`, the CLI leaves it untouched. Delete it to let the CLI generate one, or add the `IntlPartyRegister` augmentation yourself (see the README).

**Symptom**: a key built at runtime (`t(\`status.${status}\`)`) doesn't compile.

Use `useUntypedTranslations` from `@intl-party/react` for dynamic keys.

## Wrong locale

**Symptom**: the app always shows the default locale.

1. Check that `middleware.ts` (or `proxy.ts` on Next.js 16+) is in the project root, or in `src/` if you use a `src` directory.
2. Check that the locale you expect is listed in `locales` in `intl-party.config.ts`.
3. Check the `INTL_LOCALE` cookie. A stored choice takes priority over `Accept-Language`. Clear it to test browser-language detection.
4. A `?locale=` query parameter currently applies from the next navigation, not the request that carries it ([#45](https://github.com/RodrigoEspinosa/intl-party/issues/45)).

## Edits to message files don't show up

Message files are read on every request. Reload the page after saving. If a change still doesn't appear, check that you edited the file for the locale being shown.

## Middleware runs on routes it shouldn't

Narrow the `matcher` in `middleware.ts` / `proxy.ts`. It must be a static literal:

```typescript
export const config = {
  matcher: ["/((?!api|_next|_vercel|favicon\\.ico).*)", "/"],
};
```

## ESLint plugin: false positives for hardcoded strings

`no-hardcoded-strings` takes a single `ignorePattern` regex, a list of `allowedStrings`, and a `minLength` (default 3):

```javascript
{
  rules: {
    "@intl-party/no-hardcoded-strings": [
      "error",
      {
        // numbers, CONSTANTS, and URLs
        ignorePattern: "^(\\d+|[A-Z_]+|https?://.*)$",
        allowedStrings: ["OK"],
        minLength: 3,
      },
    ],
  },
}
```

## Still stuck?

Search the [existing issues](https://github.com/RodrigoEspinosa/intl-party/issues), then open a new one with a minimal reproduction. `npx intl-party nextjs --init` in a fresh `create-next-app` project is a good starting point.
