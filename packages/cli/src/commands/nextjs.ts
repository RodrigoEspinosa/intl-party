import { Command } from "commander";
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const nextjsCommand = new Command("nextjs")
  .description("Next.js specific commands for IntlParty")
  .option("--init", "Initialize IntlParty in a Next.js project")
  .option("--simplified", "Use simplified setup (recommended)")
  .action(async (options) => {
    if (options.init) {
      await initializeNextjsProject(options.simplified);
    } else {
      console.log("Please specify an action. Use --init to initialize.");
    }
  });

async function initializeNextjsProject(simplified = false) {
  console.log("🚀 Initializing IntlParty for Next.js...");

  // Check if it's already initialized
  if (existsSync("intl-party.config.ts")) {
    console.log("⚠️  IntlParty already initialized!");
    return;
  }

  // Create config file
  const configContent = simplified
    ? `// Simplified IntlParty configuration for Next.js
export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  messages: "./messages",
  // localePrefix defaults to "never" for clean URLs
  // cookieName defaults to "INTL_LOCALE"
  // namespaces are auto-detected from message files
};`
    : `// Standard IntlParty configuration for Next.js
export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["common"],
  messagesPath: "./messages",

  // Next.js specific settings
  nextjs: {
    defaultLocale: "en",
    cookieName: "INTL_LOCALE",
    localePrefix: "never" as const,
  },

  // Generation settings
  generate: {
    client: true,
    types: true,
    watch: false,
  },
};`;

  writeFileSync("intl-party.config.ts", configContent);
  console.log("✅ Created intl-party.config.ts");

  // Create messages directory and sample files
  const messagesDir = "messages";
  if (!existsSync(messagesDir)) {
    mkdirSync(messagesDir, { recursive: true });
  }

  // Create sample message files
  const locales = ["en", "es", "fr"];
  const sampleMessages = {
    common: {
      welcome: "Welcome to IntlParty!",
      description: "A modern i18n solution for Next.js",
      navigation: {
        home: "Home",
        about: "About",
        contact: "Contact",
      },
    },
  };

  locales.forEach((locale) => {
    const localeDir = join(messagesDir, locale);
    if (!existsSync(localeDir)) {
      mkdirSync(localeDir, { recursive: true });
    }

    const messages = sampleMessages.common;
    if (locale === "es") {
      messages.welcome = "¡Bienvenido a IntlParty!";
      messages.description = "Una solución i18n moderna para Next.js";
      messages.navigation.home = "Inicio";
      messages.navigation.about = "Acerca de";
      messages.navigation.contact = "Contacto";
    } else if (locale === "fr") {
      messages.welcome = "Bienvenue chez IntlParty !";
      messages.description = "Une solution i18n moderne pour Next.js";
      messages.navigation.home = "Accueil";
      messages.navigation.about = "À propos";
      messages.navigation.contact = "Contact";
    }

    writeFileSync(
      join(localeDir, "common.json"),
      JSON.stringify(messages, null, 2)
    );
  });

  console.log("✅ Created sample message files");

  // Create middleware
  const middlewareContent = simplified
    ? `import { createSimplifiedSetup } from "@intl-party/nextjs";
import config from "./intl-party.config";

const { middleware, middlewareConfig } = createSimplifiedSetup(config);

export { middleware };
export const config = middlewareConfig;`
    : `import { createLocaleMatcher } from "@intl-party/nextjs";
import { middleware, shared } from "./src/lib/i18n-setup";

export { middleware };
export const config = {
  matcher: createLocaleMatcher(shared),
};`;

  writeFileSync("middleware.ts", middlewareContent);
  console.log("✅ Created middleware.ts");

  // Update next.config.js if it exists
  if (simplified && existsSync("next.config.js")) {
    const nextConfigContent = `const { createNextConfigWithIntl } = require("@intl-party/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = createNextConfigWithIntl(
  {
    i18nConfig: require("./intl-party.config").default,
    autoGenerate: true,
    watchMode: true,
  },
  nextConfig
);`;

    writeFileSync("next.config.intl-party.js", nextConfigContent);
    console.log(
      "✅ Created next.config.intl-party.js (rename to next.config.js to use)"
    );
  }

  // Create layout example
  const layoutContent = simplified
    ? `import { createSimplifiedSetup } from "@intl-party/nextjs";
import config from "../../../intl-party.config";

const { getLocale, getMessages, Provider } = createSimplifiedSetup(config);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
}`
    : `import { getLocale } from "@intl-party/nextjs/server";
import { ClientProvider } from "./client-provider";
import { defaultMessages } from "../../lib/generated/translations.generated";
import { client } from "../../lib/i18n-setup";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale(client);

  return (
    <html lang={locale}>
      <body>
        <ClientProvider locale={locale} initialData={defaultMessages}>
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}`;

  // Create directory structure for layout
  const appDir = "src/app";
  if (!existsSync(appDir)) {
    mkdirSync(appDir, { recursive: true });
  }

  writeFileSync(join(appDir, "layout.example.tsx"), layoutContent);
  console.log("✅ Created layout.example.tsx");

  // Create page example
  const pageContent = `import { useSimplifiedTranslations } from "@intl-party/nextjs";

export default function HomePage() {
  const t = useSimplifiedTranslations("common");

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{t("welcome")}</h1>
      <p>{t("description")}</p>
      
      <nav>
        <a href="/">{t("navigation.home")}</a> |{" "}
        <a href="/about">{t("navigation.about")}</a> |{" "}
        <a href="/contact">{t("navigation.contact")}</a>
      </nav>
    </div>
  );
}`;

  writeFileSync(join(appDir, "page.example.tsx"), pageContent);
  console.log("✅ Created page.example.tsx");

  console.log("\n🎉 IntlParty initialized successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Review the generated configuration files");
  console.log("2. Move the example files from .example.tsx to .tsx");
  console.log("3. Add translations to your message files");
  console.log("4. Run your development server");

  if (simplified) {
    console.log("\n✨ You're using the simplified setup!");
    console.log("   - Minimal configuration required");
    console.log("   - Clean URLs without locale prefixes");
    console.log("   - Automatic type generation");
  }

  console.log(`\n📚 For more information, visit: https://intl-party.ai/docs`);
}
