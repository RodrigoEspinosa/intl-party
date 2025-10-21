# @intl-party/client Example

This example demonstrates how to use `@intl-party/client` in a similar way to `@prisma/client`. The client package provides type-safe access to generated translations and runtime utilities.

## Setup

1. **Install dependencies:**

   ```bash
   cd examples/client-usage
   pnpm install
   ```

2. **Generate the client package:**

   ```bash
   pnpm run generate
   ```

3. **Run the example:**
   ```bash
   pnpm run dev
   ```

## What's Generated

When you run `intl-party generate --client`, it creates:

- **Type definitions** in `packages/client/generated/translations.generated.ts`
- **Runtime data** in `packages/client/generated/messages.generated.ts`
- **Main exports** in `packages/client/generated/index.generated.ts`

## Usage Patterns

### 1. Type-Safe Translation Keys

```typescript
import { TranslationKey, Locale } from "@intl-party/client";

// ✅ TypeScript validates these keys
const key: TranslationKey = "common.title"; // Valid
const locale: Locale = "en"; // Valid

// ❌ This would cause a TypeScript error
// const invalidKey: TranslationKey = 'invalid.key';
```

### 2. Runtime Message Access

```typescript
import { defaultMessages, getLocaleMessages } from "@intl-party/client";

// Access all messages
const allMessages = defaultMessages;

// Access messages for a specific locale
const enMessages = getLocaleMessages("en");
console.log(enMessages.common.title); // "My Awesome App"
```

### 3. Translation Functions

```typescript
import { createTranslationFunction } from "@intl-party/client";

// Create a type-safe translation function
const t = createTranslationFunction("en");

// Use it with type safety
const title = t("common.title"); // ✅ TypeScript knows this key exists
const welcome = t("common.welcome", { appName: "MyApp" }); // With interpolation
```

### 4. Client Instance (Like PrismaClient)

```typescript
import { createClient } from "@intl-party/client";

const client = createClient();

// Use client methods
const title = client.t("en")("common.title");
const isValid = client.validateTranslationKey("common.title");
const locales = client.getAvailableLocales();
```

### 5. Validation

```typescript
import { validateTranslationKey } from "@intl-party/client";

// Runtime validation
const isValid = validateTranslationKey("common.title"); // true
const isInvalid = validateTranslationKey("invalid.key"); // false
```

## Similar to Prisma

| Prisma                | @intl-party/client             |
| --------------------- | ------------------------------ |
| `npx prisma generate` | `intl-party generate --client` |
| `@prisma/client`      | `@intl-party/client`           |
| `PrismaClient`        | `createClient()`               |
| Model fields          | Translation keys               |
| Database data         | Message data                   |
| Query methods         | Translation functions          |
| Schema validation     | Key validation                 |

## Commands

- `pnpm run generate` - Generate client package files
- `pnpm run generate:watch` - Generate with file watching
- `pnpm run dev` - Run the example
- `pnpm run build` - Build TypeScript

## File Structure

```
examples/client-usage/
├── messages/           # Translation files
│   ├── en/
│   ├── es/
│   ├── fr/
│   └── de/
├── src/
│   └── index.ts        # Example usage
├── i18n.config.ts      # Configuration
└── package.json
```

The generated client files are created in `packages/client/generated/` and provide the same type-safe, runtime-ready experience as `@prisma/client`.
