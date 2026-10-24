let warned = false;

/**
 * Warns once that @intl-party/client is deprecated. It never read the files
 * `intl-party generate --client` writes, so its keys were plain strings and
 * its `t()` skipped core's fallbacks and plurals.
 */
export function warnClientDeprecated(): void {
  if (warned) return;
  warned = true;
  console.warn(
    "[intl-party] @intl-party/client is deprecated and will be removed in " +
      "the next major version. Use createI18n from @intl-party/core, and " +
      "`npx intl-party generate --types` for type-checked keys. See " +
      "https://github.com/RodrigoEspinosa/intl-party/issues/80",
  );
}
