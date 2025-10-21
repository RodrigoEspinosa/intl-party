# Zero-Config IntlParty Setup

This example demonstrates the **truly zero-config** IntlParty setup for Next.js App Router.

## What's Auto-Detected

Everything is automatically detected from your `messages/` directory:

- **Locales**: Auto-detected from directory names (`en/`, `es/`, `fr/`, `de/`)
- **Namespaces**: Auto-detected from JSON files (`common.json`, `auth.json`, etc.)
- **Default Locale**: First locale found in messages directory
- **Messages Path**: Defaults to `./messages`
- **Cookie Name**: Defaults to `INTL_LOCALE`
- **URL Strategy**: Clean URLs (no locale prefix) by default

## File Structure

```
messages/
├── en/
│   └── common.json
├── es/
│   └── common.json
├── fr/
│   └── common.json
└── de/
    └── common.json
```

## Zero-Config Files

### `middleware.ts`

```typescript
// Zero-config middleware - everything auto-detected
import { middleware, config } from "@intl-party/nextjs/simple-middleware";

export { middleware };
export { config };
```

### `next.config.js`

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... your config
};

// Zero-config: Only apply IntlParty hot reloading plugin in development
if (process.env.NODE_ENV === "development") {
  const {
    withIntlPartyHotReload,
  } = require("@intl-party/nextjs/webpack-plugin");
  module.exports = withIntlPartyHotReload(nextConfig);
} else {
  module.exports = nextConfig;
}
```

### `src/app/layout.tsx`

```typescript
import { Provider } from "@intl-party/nextjs/zero-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
```

## Benefits

1. **No Manual Configuration**: Everything is auto-detected
2. **No Duplicate Settings**: Single source of truth (messages directory)
3. **Automatic Updates**: Add new locales/namespaces by adding files
4. **Clean URLs**: No locale prefixes by default
5. **Type Safety**: Auto-generated types from your messages

## Adding New Locales

Just add a new directory to `messages/`:

```
messages/
├── en/
├── es/
├── fr/
├── de/
└── ja/          # ← New locale automatically detected
    └── common.json
```

## Adding New Namespaces

Just add a new JSON file:

```
messages/en/
├── common.json
├── auth.json
└── dashboard.json  # ← New namespace automatically detected
```

## Development

```bash
# Start development server
pnpm dev

# Extract translation keys from your code
pnpm i18n:extract

# Generate type-safe translations
pnpm i18n:generate

# Sync translations between locales
pnpm i18n:sync
```

That's it! No configuration files needed. Everything is detected automatically from your messages directory structure.
