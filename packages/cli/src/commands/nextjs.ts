/* eslint-disable no-console */

import { Command } from "commander";
import { existsSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";

export interface NextjsCommandOptions {
  init?: boolean;
  force?: boolean;
}

/** Major version of the project's installed (or declared) Next.js, if known. */
function getNextMajorVersion(): number | null {
  const candidates = [
    () =>
      JSON.parse(readFileSync("node_modules/next/package.json", "utf-8"))
        .version,
    () => {
      const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
      return pkg.dependencies?.next ?? pkg.devDependencies?.next;
    },
  ];
  for (const read of candidates) {
    try {
      const major = String(read()).match(/\d+/)?.[0];
      if (major) return parseInt(major, 10);
    } catch {
      // Try the next source
    }
  }
  return null;
}

export async function initializeNextjsProject(force = false) {
  console.log(chalk.cyan("🚀 Initializing IntlParty for Next.js..."));

  // Check if it's already initialized
  if (
    existsSync("intl-party.config.ts") ||
    existsSync("intl-party.config.js")
  ) {
    if (!force) {
      console.log(chalk.yellow("⚠️  IntlParty already initialized!"));
      return true;
    }
    console.log(
      chalk.yellow("⚠️  Force flag set, overwriting existing files..."),
    );
  }

  // Detect src directory
  const hasSrcDir = existsSync("src");
  const baseDir = hasSrcDir ? "src" : ".";
  const appDir = join(baseDir, "app");

  // Create config file
  const configContent = `// IntlParty configuration for Next.js
export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  messages: "./messages",
  // localePrefix defaults to "never" for clean URLs
  // cookieName defaults to "INTL_LOCALE"
};`;

  writeFileSync("intl-party.config.ts", configContent);
  console.log(chalk.green("✅ Created intl-party.config.ts"));

  // Create messages directory and sample files
  const messagesDir = "messages";
  if (!existsSync(messagesDir)) {
    mkdirSync(messagesDir, { recursive: true });
  }

  // Create sample message files
  const locales = ["en", "es", "fr"];
  const sampleMessagesBase = {
    welcome: "Welcome to IntlParty!",
    description: "A modern i18n solution for Next.js",
    navigation: {
      home: "Home",
      about: "About",
      contact: "Contact",
    },
  };

  locales.forEach((locale) => {
    const localeDir = join(messagesDir, locale);
    if (!existsSync(localeDir)) {
      mkdirSync(localeDir, { recursive: true });
    }

    const messages = {
      ...sampleMessagesBase,
      navigation: { ...sampleMessagesBase.navigation },
    };
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
      JSON.stringify(messages, null, 2),
    );
  });

  console.log(chalk.green("✅ Created sample message files in ./messages"));

  // Create middleware. Next.js 16 renamed the file convention to proxy.ts.
  const useProxy = (getNextMajorVersion() ?? 0) >= 16;
  const middlewareFile = useProxy ? "proxy.ts" : "middleware.ts";
  const middlewarePath = hasSrcDir ? `src/${middlewareFile}` : middlewareFile;
  const middlewareContent = `import { createSetup } from "@intl-party/nextjs";
import intlConfig from "${hasSrcDir ? "../" : "./"}intl-party.config";

const { middleware } = createSetup(intlConfig);

export { ${useProxy ? "middleware as proxy" : "middleware"} };

// Next.js reads this at build time, so it must stay a static literal.
export const config = {
  matcher: ["/((?!api|_next|_vercel|favicon\\\\.ico).*)", "/"],
};
`;

  writeFileSync(middlewarePath, middlewareContent);
  console.log(chalk.green(`✅ Created ${middlewarePath}`));

  // Create layout and page examples in the correct app directory
  if (!existsSync(appDir)) {
    mkdirSync(appDir, { recursive: true });
  }

  const layoutContent = `import { createSetup } from "@intl-party/nextjs";
import config from "${hasSrcDir ? "../../" : "../"}intl-party.config";

const { getLocale, getMessages, Provider } = createSetup(config);

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
}`;

  writeFileSync(join(appDir, "layout.intl-party.tsx"), layoutContent);

  const pageContent = `"use client";

import { useTranslations } from "@intl-party/nextjs";

export default function HomePage() {
  const t = useTranslations("common");

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>{t("welcome")}</h1>
      <p>{t("description")}</p>
      
      <nav style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <a href="/">{t("navigation.home")}</a>
        <a href="/about">{t("navigation.about")}</a>
        <a href="/contact">{t("navigation.contact")}</a>
      </nav>
    </div>
  );
}`;

  writeFileSync(join(appDir, "page.intl-party.tsx"), pageContent);
  console.log(chalk.green(`✅ Created example files in ${appDir}`));

  // Suggest updating .gitignore
  if (existsSync(".gitignore")) {
    const gitignore = readFileSync(".gitignore", "utf-8");
    if (!gitignore.includes(".intl-party")) {
      console.log(chalk.blue("\n💡 Tip: Add .intl-party/ to your .gitignore"));
    }
  }

  // Suggest installing dependency
  console.log(chalk.blue("\n💡 Tip: Make sure to install the dependency:"));
  console.log(chalk.white("   npm install @intl-party/nextjs"));

  console.log(chalk.green("\n🎉 IntlParty initialized successfully!"));
  console.log("\n📝 Next steps:");
  console.log("1. Review the generated configuration files");
  console.log(
    `2. Move/merge ${appDir}/layout.intl-party.tsx into your RootLayout`,
  );
  console.log("3. Add translations to your message files in ./messages");
  console.log("4. Run your development server");

  console.log(
    `\n📚 For more information, visit: https://github.com/RodrigoEspinosa/intl-party#readme`,
  );

  return true;
}

export const nextjsCommand = new Command("nextjs")
  .description("Next.js specific commands for IntlParty")
  .option("--init", "Initialize IntlParty in a Next.js project")
  .option("--force", "Force overwrite existing files")
  .action(async (options: NextjsCommandOptions) => {
    if (options.init) {
      await initializeNextjsProject(options.force);
    } else {
      console.log("Please specify an action. Use --init to initialize.");
    }
  });
