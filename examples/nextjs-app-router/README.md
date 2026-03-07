# IntlParty Next.js App Router Example

This example demonstrates the **simplified setup** for IntlParty with Next.js App Router.

## 🚀 Features Demonstrated

- ✅ **Zero-config setup** with `intl-party.config.ts`
- ✅ **Clean URLs** without locale prefixes
- ✅ **Automatic SSR** with message loading
- ✅ **Type-safe translations** with auto-completion
- ✅ **Cookie-based locale detection**
- ✅ **Hot reloading** for translation changes

## 📁 Project Structure

```
nextjs-app-router/
├── intl-party.config.ts          # Simplified configuration
├── middleware.ts                 # Automatic locale detection
├── messages/                    # Translation files
│   ├── en/
│   │   ├── common.json
│   │   └── navigation.json
│   ├── es/
│   │   ├── common.json
│   │   └── navigation.json
│   ├── fr/
│   │   ├── common.json
│   │   └── navigation.json
│   └── de/
│       ├── common.json
│       └── navigation.json
└── src/app/
    ├── layout.tsx                # SSR setup with Provider
    ├── page.tsx                 # Using translations
    ├── compat-demo/              # Compatibility examples
    └── ssr-demo/               # Server-side rendering demo
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Run Development Server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

### 3. Test Locale Switching

Open http://localhost:3000 and try:

- **Cookie method**: Add `?locale=es` to URL
- **Header method**: Change browser language
- **Clean URLs**: Notice no `/en/` prefix needed!

## 📖 Configuration

### intl-party.config.ts

```typescript
export default {
  locales: ["en", "es", "fr", "de"],
  defaultLocale: "en",
  messages: "./messages",
  // localePrefix defaults to "never" for clean URLs
  // cookieName defaults to "INTL_LOCALE"
  // namespaces are auto-detected from message files
};
```

### middleware.ts

```typescript
import { createSimplifiedSetup } from "@intl-party/nextjs";
import config from "./intl-party.config";

const { middleware, middlewareConfig } = createSimplifiedSetup(config);

export { middleware };
export const config = middlewareConfig;
```

### app/layout.tsx

```tsx
import { createSimplifiedSetup } from "@intl-party/nextjs";
import config from "../../intl-party.config";

const { getLocale, getMessages, Provider } = createSimplifiedSetup(config);

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <Provider locale={locale} initialMessages={messages}>
          {children}
        </Provider>
      </body>
    </html>
  );
}
```

## 🎯 Usage Examples

### Basic Usage

```tsx
import { useSimplifiedTranslations } from "@intl-party/nextjs";

export default function HomePage() {
  const t = useSimplifiedTranslations("common");

  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
```

### With Interpolation

```tsx
export default function Greeting() {
  const t = useSimplifiedTranslations("common");

  return <p>{t("greeting", { name: "John", count: 5 })}</p>;
}
```

### Nested Keys

```tsx
export default function Navigation() {
  const t = useSimplifiedTranslations("navigation");

  return (
    <nav>
      <a href="/">{t("home")}</a>
      <a href="/about">{t("about")}</a>
      <a href="/contact">{t("contact")}</a>
    </nav>
  );
}
```

### Multiple Namespaces

```tsx
export default function ComplexPage() {
  const commonT = useSimplifiedTranslations("common");
  const navT = useSimplifiedTranslations("navigation");

  return (
    <div>
      <h1>{commonT("welcome")}</h1>
      <nav>{navT("home")}</nav>
    </div>
  );
}
```

## 🌐 Translation Files

### messages/en/common.json

```json
{
  "welcome": "Welcome to IntlParty!",
  "description": "A modern i18n solution for Next.js with perfect TypeScript support.",
  "greeting": "Hello {{name}}! You have {{count}} messages.",
  "features": {
    "title": "Key Features",
    "zeroConfig": "Zero-Config Setup",
    "typeSafe": "Perfect TypeScript",
    "cleanUrls": "Clean URLs",
    "ssr": "Automatic SSR"
  }
}
```

### messages/es/common.json

```json
{
  "welcome": "¡Bienvenido a IntlParty!",
  "description": "Una solución i18n moderna para Next.js con soporte TypeScript perfecto.",
  "greeting": "¡Hola {{name}}! Tienes {{count}} mensajes.",
  "features": {
    "title": "Características Clave",
    "zeroConfig": "Configuración Cero",
    "typeSafe": "TypeScript Perfecto",
    "cleanUrls": "URLs Limpias",
    "ssr": "SSR Automático"
  }
}
```

## 🎨 Advanced Features

### Locale Switching Component

```tsx
"use client";

import { useState } from "react";
import { useSimplifiedTranslations } from "@intl-party/nextjs";

export default function LocaleSwitcher() {
  const [currentLocale, setCurrentLocale] = useState("en");
  const t = useSimplifiedTranslations();

  const switchLocale = (locale: string) => {
    // Set cookie and reload
    document.cookie = `INTL_LOCALE=${locale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div>
      <p>{t("currentLocale", { locale: currentLocale })}</p>
      <button onClick={() => switchLocale("en")}>English</button>
      <button onClick={() => switchLocale("es")}>Español</button>
      <button onClick={() => switchLocale("fr")}>Français</button>
    </div>
  );
}
```

### Server Component with Dynamic Loading

```tsx
import { createSimplifiedSetup } from "@intl-party/nextjs";
import config from "../../../intl-party.config";

const { getMessages } = createSimplifiedSetup(config);

export default async function DynamicPage({ params }) {
  const locale = params.locale || "en";
  const messages = await getMessages(locale);

  return (
    <div>
      <h1>Dynamic content for {locale}</h1>
      <p>Loaded {Object.keys(messages).length} namespaces</p>
    </div>
  );
}
```

## 🔧 Development

### Hot Reloading

When you edit any translation file in `messages/`, the app automatically:

1. 🔄 Detects the file change
2. ⚡ Regenerates types and messages
3. 🚀 Triggers Next.js hot reload
4. ✨ Updates the UI instantly

### Type Generation

Types are automatically generated from your translation files:

```typescript
// Auto-generated types give you:
const t = useSimplifiedTranslations("common");

t("welcome"); // ✅ Type-safe
t("navigation.home"); // ✅ Type-safe
t("invalid.key"); // ❌ TypeScript error
```

### Adding New Languages

1. Create new directory: `messages/pt/`
2. Copy translation files from `messages/en/`
3. Translate the content
4. Add to config: `locales: ["en", "es", "fr", "de", "pt"]`
5. Restart development server

## 🚀 Deployment

The simplified setup works out of the box with:

- ✅ **Vercel** - No configuration needed
- ✅ **Netlify** - No configuration needed
- ✅ **AWS Amplify** - No configuration needed
- ✅ **Docker** - Works with standard Next.js Docker setup
- ✅ **Static Export** - Works with `next export`

## 🆚 Traditional vs Simplified

| Feature            | Traditional Setup | Simplified Setup |
| ------------------ | ----------------- | ---------------- |
| **Files Required** | 5+ files          | 2 files          |
| **Setup Time**     | 15-30 minutes     | 2 minutes        |
| **Configuration**  | Complex           | Minimal          |
| **Type Safety**    | Manual casting    | Automatic        |
| **Hot Reloading**  | Manual setup      | Built-in         |
| **Learning Curve** | Medium            | Easy             |

## 🤝 Contributing

This is a demo project. For contributing to IntlParty itself, see the [main repository](https://github.com/RodrigoEspinosa/intl-party).

## 📄 License

MIT
