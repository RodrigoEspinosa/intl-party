import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { loadConfig, type CLIConfig } from "../utils/config";
import { loadTranslations, saveTranslations } from "../utils/translations";
import type { AllTranslations } from "@intl-party/core";

export interface SyncOptions {
  base?: string;
  target?: string[];
  missingOnly?: boolean;
  interactive?: boolean;
  config?: string;
  verbose?: boolean;
}

export async function syncCommand(options: SyncOptions) {
  const spinner = ora("Loading configuration...").start();

  try {
    // Load configuration
    const config = await loadConfig(options.config);
    spinner.text = "Loading translations...";

    // Load all translations
    const translations = await loadTranslations(
      config.translationPaths,
      config.locales,
      config.namespaces
    );

    spinner.succeed("Configuration loaded");

    // Determine base locale and target locales
    const baseLocale = options.base || config.defaultLocale;
    const targetLocales =
      options.target || config.locales.filter((l) => l !== baseLocale);

    if (!config.locales.includes(baseLocale)) {
      throw new Error(`Base locale '${baseLocale}' not found in configuration`);
    }

    // Analyze differences
    const analysis = analyzeTranslations(
      translations,
      baseLocale,
      targetLocales,
      config.namespaces
    );

    if (options.verbose) {
      displayAnalysis(analysis);
    }

    // Handle interactive mode
    if (
      options.interactive &&
      (analysis.missingKeys.length > 0 || analysis.unusedKeys.length > 0)
    ) {
      const shouldProceed = await confirmSync(analysis);
      if (!shouldProceed) {
        console.log(chalk.yellow("Sync cancelled by user"));
        return;
      }
    }

    // Perform sync
    const updatedTranslations = await performSync(
      translations,
      analysis,
      baseLocale,
      targetLocales,
      config.namespaces,
      options
    );

    // Save updated translations
    spinner.start("Saving translations...");
    await saveTranslations(updatedTranslations, config.translationPaths);
    spinner.succeed("Translations synchronized successfully");

    // Display summary
    displaySummary(analysis, updatedTranslations);
  } catch (error) {
    spinner.fail("Sync failed");
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

interface SyncAnalysis {
  missingKeys: Array<{
    locale: string;
    namespace: string;
    key: string;
  }>;
  unusedKeys: Array<{
    locale: string;
    namespace: string;
    key: string;
  }>;
  totalKeys: number;
  missingCount: number;
  unusedCount: number;
}

function analyzeTranslations(
  translations: AllTranslations,
  baseLocale: string,
  targetLocales: string[],
  namespaces: string[]
): SyncAnalysis {
  const missingKeys: SyncAnalysis["missingKeys"] = [];
  const unusedKeys: SyncAnalysis["unusedKeys"] = [];

  // Get all keys from base locale
  const baseKeys = new Set<string>();
  for (const namespace of namespaces) {
    const baseTranslations = translations[baseLocale]?.[namespace] || {};
    collectKeys(baseTranslations, "", baseKeys);
  }

  // Check for missing keys in target locales
  for (const locale of targetLocales) {
    for (const namespace of namespaces) {
      const targetTranslations = translations[locale]?.[namespace] || {};
      const targetKeys = new Set<string>();
      collectKeys(targetTranslations, "", targetKeys);

      for (const key of baseKeys) {
        if (!targetKeys.has(key)) {
          missingKeys.push({ locale, namespace, key });
        }
      }
    }
  }

  // Check for unused keys (keys in target locales but not in base)
  for (const locale of targetLocales) {
    for (const namespace of namespaces) {
      const targetTranslations = translations[locale]?.[namespace] || {};
      const targetKeys = new Set<string>();
      collectKeys(targetTranslations, "", targetKeys);

      for (const key of targetKeys) {
        if (!baseKeys.has(key)) {
          unusedKeys.push({ locale, namespace, key });
        }
      }
    }
  }

  return {
    missingKeys,
    unusedKeys,
    totalKeys: baseKeys.size,
    missingCount: missingKeys.length,
    unusedCount: unusedKeys.length,
  };
}

function collectKeys(obj: any, prefix: string, keys: Set<string>): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      collectKeys(value, fullKey, keys);
    } else {
      keys.add(fullKey);
    }
  }
}

function displayAnalysis(analysis: SyncAnalysis): void {
  console.log(chalk.bold("\n📊 Translation Analysis:"));
  console.log(`Total keys in base locale: ${chalk.blue(analysis.totalKeys)}`);
  console.log(`Missing keys: ${chalk.yellow(analysis.missingCount)}`);
  console.log(`Unused keys: ${chalk.red(analysis.unusedCount)}`);

  if (analysis.missingKeys.length > 0) {
    console.log(chalk.yellow("\n⚠️  Missing Keys:"));
    const grouped = groupKeysByLocale(analysis.missingKeys);
    for (const [locale, keys] of Object.entries(grouped)) {
      console.log(chalk.gray(`  ${locale}: ${keys.length} keys`));
      if (keys.length <= 10) {
        keys.forEach((key) =>
          console.log(chalk.gray(`    - ${key.namespace}.${key.key}`))
        );
      }
    }
  }

  if (analysis.unusedKeys.length > 0) {
    console.log(chalk.red("\n🗑️  Unused Keys:"));
    const grouped = groupKeysByLocale(analysis.unusedKeys);
    for (const [locale, keys] of Object.entries(grouped)) {
      console.log(chalk.gray(`  ${locale}: ${keys.length} keys`));
      if (keys.length <= 10) {
        keys.forEach((key) =>
          console.log(chalk.gray(`    - ${key.namespace}.${key.key}`))
        );
      }
    }
  }
}

function groupKeysByLocale(keys: SyncAnalysis["missingKeys"]) {
  return keys.reduce(
    (acc, key) => {
      if (!acc[key.locale]) acc[key.locale] = [];
      acc[key.locale].push(key);
      return acc;
    },
    {} as Record<string, typeof keys>
  );
}

async function confirmSync(analysis: SyncAnalysis): Promise<boolean> {
  const questions = [];

  if (analysis.missingCount > 0) {
    questions.push({
      type: "confirm",
      name: "addMissing",
      message: `Add ${analysis.missingCount} missing translation keys?`,
      default: true,
    });
  }

  if (analysis.unusedCount > 0) {
    questions.push({
      type: "confirm",
      name: "removeUnused",
      message: `Remove ${analysis.unusedCount} unused translation keys?`,
      default: false,
    });
  }

  const answers = await inquirer.prompt(questions);
  return answers.addMissing || answers.removeUnused;
}

async function performSync(
  translations: AllTranslations,
  analysis: SyncAnalysis,
  baseLocale: string,
  targetLocales: string[],
  namespaces: string[],
  options: SyncOptions
): Promise<AllTranslations> {
  const updatedTranslations = JSON.parse(JSON.stringify(translations));

  // Add missing keys
  if (
    analysis.missingKeys.length > 0 &&
    (options.missingOnly || !options.missingOnly)
  ) {
    for (const missing of analysis.missingKeys) {
      const baseValue = getNestedValue(
        updatedTranslations[baseLocale]?.[missing.namespace] || {},
        missing.key
      );

      setNestedValue(
        updatedTranslations[missing.locale][missing.namespace],
        missing.key,
        baseValue
      );
    }
  }

  // Remove unused keys
  if (analysis.unusedKeys.length > 0 && !options.missingOnly) {
    for (const unused of analysis.unusedKeys) {
      removeNestedValue(
        updatedTranslations[unused.locale][unused.namespace],
        unused.key
      );
    }
  }

  return updatedTranslations;
}

function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

function removeNestedValue(obj: any, path: string): void {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => current?.[key], obj);
  if (target) {
    delete target[lastKey];
  }
}

function displaySummary(
  analysis: SyncAnalysis,
  translations: AllTranslations
): void {
  console.log(chalk.bold.green("\n✅ Sync Complete!"));
  console.log(`Added ${chalk.green(analysis.missingCount)} missing keys`);
  console.log(`Removed ${chalk.red(analysis.unusedCount)} unused keys`);
  console.log(
    `Total translations: ${Object.keys(translations).length} locales`
  );
}
