const warned = new Set<string>();

/**
 * Warns once per API that the next.config / webpack integration is
 * deprecated. It adds a webpack hook (Next.js 16 builds with Turbopack and
 * refuses a webpack config), and nothing needs it anymore: messages are read
 * per request and `intl-party.d.ts` imports the JSON directly.
 */
export function warnWebpackIntegrationDeprecated(api: string): void {
  if (warned.has(api)) return;
  warned.add(api);
  console.warn(
    `[intl-party] ${api} is deprecated and will be removed in the next major ` +
      "version. Remove it from next.config: message edits already apply on " +
      "reload, and `npx intl-party generate --types` keeps intl-party.d.ts " +
      "in sync. See https://github.com/RodrigoEspinosa/intl-party/issues/41",
  );
}
