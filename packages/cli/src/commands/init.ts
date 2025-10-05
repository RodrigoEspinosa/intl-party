import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import inquirer from "inquirer";
import { saveConfig } from "../utils/config";
import type { CLIConfig } from "../utils/config";

export interface InitOptions {
  force?: boolean;
  template?: string;
  config?: string;
  verbose?: boolean;
}

export async function initCommand(options: InitOptions) {
  const spinner = ora("Initializing IntlParty configuration...").start();

  try {
    // Check if config already exists
    const configPath = "intl-party.config.json";
    if ((await fs.pathExists(configPath)) && !options.force) {
      spinner.stop();
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: "Configuration file already exists. Overwrite?",
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.yellow("Initialization cancelled."));
        return;
      }
    }

    spinner.start("Setting up configuration...");

    // Prompt for configuration options
    spinner.stop();
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "defaultLocale",
        message: "Default locale:",
        default: "en",
      },
      {
        type: "input",
        name: "locales",
        message: "Supported locales (comma-separated):",
        default: "en,es,fr",
        filter: (input: string) => input.split(",").map((l) => l.trim()),
      },
      {
        type: "input",
        name: "namespaces",
        message: "Translation namespaces (comma-separated):",
        default: "common",
        filter: (input: string) => input.split(",").map((n) => n.trim()),
      },
      {
        type: "input",
        name: "translationsDir",
        message: "Translations directory:",
        default: "./translations",
      },
      {
        type: "input",
        name: "sourceDir",
        message: "Source directory:",
        default: "./src",
      },
    ]);

    // Create configuration
    const config: CLIConfig = {
      locales: answers.locales,
      defaultLocale: answers.defaultLocale,
      namespaces: answers.namespaces,
      translationPaths: {},
      sourcePatterns: [`${answers.sourceDir}/**/*.{ts,tsx,js,jsx}`],
      outputDir: answers.translationsDir,
      validation: {
        strict: false,
        logMissing: true,
        throwOnMissing: false,
        validateFormats: true,
      },
      extraction: {
        keyPrefix: "",
        markExtracted: true,
        sortKeys: true,
        includeMetadata: false,
      },
      sync: {
        removeUnused: false,
        addMissing: true,
        preserveOrder: true,
      },
    };

    // Build translation paths
    for (const locale of answers.locales) {
      config.translationPaths[locale] = {};
      for (const namespace of answers.namespaces) {
        config.translationPaths[locale][namespace] = path.join(
          answers.translationsDir,
          locale,
          `${namespace}.json`,
        );
      }
    }

    spinner.start("Creating directory structure...");

    // Create directory structure
    await fs.ensureDir(answers.translationsDir);

    for (const locale of answers.locales) {
      const localeDir = path.join(answers.translationsDir, locale);
      await fs.ensureDir(localeDir);

      for (const namespace of answers.namespaces) {
        const filePath = path.join(localeDir, `${namespace}.json`);
        if (!(await fs.pathExists(filePath))) {
          await fs.writeJson(filePath, {}, { spaces: 2 });
        }
      }
    }

    // Save configuration
    await saveConfig(config, configPath);

    // Create example template files based on template option
    if (options.template) {
      await createTemplateFiles(options.template, answers);
    }

    spinner.succeed("IntlParty configuration initialized successfully!");

    console.log(chalk.green("\n✓ Configuration created:"), configPath);
    console.log(
      chalk.green("✓ Translation directories created:"),
      answers.translationsDir,
    );

    if (options.template) {
      console.log(chalk.green("✓ Template files created"));
    }

    console.log(chalk.blue("\nNext steps:"));
    console.log("1. Add translations to your JSON files");
    console.log(
      "2. Run",
      chalk.cyan("intl-party extract"),
      "to extract keys from your code",
    );
    console.log(
      "3. Run",
      chalk.cyan("intl-party validate"),
      "to check your translations",
    );
  } catch (error) {
    spinner.fail("Initialization failed");
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

async function createTemplateFiles(template: string, config: any) {
  switch (template) {
    case "nextjs":
      await createNextJSTemplate(config);
      break;
    case "react":
      await createReactTemplate(config);
      break;
    case "vanilla":
      await createVanillaTemplate(config);
      break;
    default:
      console.log(chalk.yellow(`Unknown template: ${template}`));
  }
}

async function createNextJSTemplate(config: any) {
  const middlewareContent = `import { createI18nMiddleware } from '@intl-party/nextjs/middleware';

export default createI18nMiddleware({
  locales: ${JSON.stringify(config.locales)},
  defaultLocale: '${config.defaultLocale}',
  localePrefix: 'as-needed'
});

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|favicon.ico).*)'
  ]
};
`;

  const layoutContent = `import { AppI18nProvider } from '@intl-party/nextjs/app';

export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body>
        <AppI18nProvider locale={locale} config={{
          locales: ${JSON.stringify(config.locales)},
          defaultLocale: '${config.defaultLocale}',
          namespaces: ${JSON.stringify(config.namespaces)}
        }}>
          {children}
        </AppI18nProvider>
      </body>
    </html>
  );
}
`;

  await fs.writeFile("middleware.ts", middlewareContent);
  await fs.ensureDir("app/[locale]");
  await fs.writeFile("app/[locale]/layout.tsx", layoutContent);
}

async function createReactTemplate(config: any) {
  const appContent = `import { I18nProvider } from '@intl-party/react';
import { createI18n } from '@intl-party/core';

const i18n = createI18n({
  locales: ${JSON.stringify(config.locales)},
  defaultLocale: '${config.defaultLocale}',
  namespaces: ${JSON.stringify(config.namespaces)}
});

function App() {
  return (
    <I18nProvider i18n={i18n}>
      <div className="App">
        <h1>IntlParty React App</h1>
        {/* Your app content */}
      </div>
    </I18nProvider>
  );
}

export default App;
`;

  await fs.writeFile("src/App.tsx", appContent);
}

async function createVanillaTemplate(config: any) {
  const indexContent = `import { createI18n } from '@intl-party/core';

const i18n = createI18n({
  locales: ${JSON.stringify(config.locales)},
  defaultLocale: '${config.defaultLocale}',
  namespaces: ${JSON.stringify(config.namespaces)}
});

// Load translations
// Add your translation loading logic here

// Use translations
console.log(i18n.t('welcome'));
`;

  await fs.ensureDir("src");
  await fs.writeFile("src/index.ts", indexContent);
}
