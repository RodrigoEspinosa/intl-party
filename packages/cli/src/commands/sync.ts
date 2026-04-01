import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import inquirer from "inquirer";
import { loadConfig, type CLIConfig } from "../utils/config";
import { loadTranslations, saveTranslations } from "../utils/translations";
import type { AllTranslations } from "@intl-party/core";

export interface SyncOptions {
  base?: string;
  target?: string[];
  missingOnly?: boolean;
  interactive?: boolean;
  format?: "text" | "json" | "junit";
  output?: string;
  dryRun?: boolean;
  config?: string;
  verbose?: boolean;
}

export interface SyncAnalysis {
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

    // If dry-run, just output the analysis and return
    if (options.dryRun) {
      await outputResults(analysis, options);
      return;
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
    const updatedTranslations = performSync(
      translations,
      analysis,
      baseLocale,
      options
    );

    // Save updated translations
    spinner.start("Saving translations...");
    await saveTranslations(updatedTranslations, config.translationPaths);
    spinner.succeed("Translations synchronized successfully");

    // Output results
    await outputResults(analysis, options);
  } catch (error) {
    spinner.fail("Sync failed");
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

export function analyzeTranslations(
  translations: AllTranslations,
  baseLocale: string,
  targetLocales: string[],
  namespaces: string[]
): SyncAnalysis {
  const missingKeys: SyncAnalysis["missingKeys"] = [];
  const unusedKeys: SyncAnalysis["unusedKeys"] = [];

  // Get all keys from base locale per namespace
  for (const namespace of namespaces) {
    const baseTranslations = translations[baseLocale]?.[namespace] || {};
    const baseKeys = new Set<string>();
    collectKeys(baseTranslations, "", baseKeys);

    // Check each target locale
    for (const locale of targetLocales) {
      const targetTranslations = translations[locale]?.[namespace] || {};
      const targetKeys = new Set<string>();
      collectKeys(targetTranslations, "", targetKeys);

      // Missing: in base but not in target
      for (const key of baseKeys) {
        if (!targetKeys.has(key)) {
          missingKeys.push({ locale, namespace, key });
        }
      }

      // Extra/unused: in target but not in base
      for (const key of targetKeys) {
        if (!baseKeys.has(key)) {
          unusedKeys.push({ locale, namespace, key });
        }
      }
    }
  }

  // Compute total base keys across all namespaces
  let totalKeys = 0;
  for (const namespace of namespaces) {
    const baseTranslations = translations[baseLocale]?.[namespace] || {};
    const baseKeys = new Set<string>();
    collectKeys(baseTranslations, "", baseKeys);
    totalKeys += baseKeys.size;
  }

  return {
    missingKeys,
    unusedKeys,
    totalKeys,
    missingCount: missingKeys.length,
    unusedCount: unusedKeys.length,
  };
}

function collectKeys(obj: Record<string, unknown>, prefix: string, keys: Set<string>): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      collectKeys(value as Record<string, unknown>, fullKey, keys);
    } else {
      keys.add(fullKey);
    }
  }
}

function displayAnalysis(analysis: SyncAnalysis): void {
  console.log(chalk.bold("\nTranslation Analysis:"));
  console.log(`Total keys in base locale: ${chalk.blue(analysis.totalKeys)}`);
  console.log(`Missing keys: ${chalk.yellow(analysis.missingCount)}`);
  console.log(`Unused keys: ${chalk.red(analysis.unusedCount)}`);

  if (analysis.missingKeys.length > 0) {
    console.log(chalk.yellow("\nMissing Keys:"));
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
    console.log(chalk.red("\nUnused Keys:"));
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

function performSync(
  translations: AllTranslations,
  analysis: SyncAnalysis,
  baseLocale: string,
  options: SyncOptions
): AllTranslations {
  const updatedTranslations = JSON.parse(JSON.stringify(translations));

  // Add missing keys with placeholder values
  if (analysis.missingKeys.length > 0) {
    for (const missing of analysis.missingKeys) {
      const baseValue = getNestedValue(
        updatedTranslations[baseLocale]?.[missing.namespace] || {},
        missing.key
      );

      if (!updatedTranslations[missing.locale]) {
        updatedTranslations[missing.locale] = {};
      }
      if (!updatedTranslations[missing.locale][missing.namespace]) {
        updatedTranslations[missing.locale][missing.namespace] = {};
      }

      setNestedValue(
        updatedTranslations[missing.locale][missing.namespace],
        missing.key,
        baseValue
      );
    }
  }

  // Remove unused keys (only when not missing-only mode)
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

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: unknown, key: string) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  const target = keys.reduce((current: Record<string, unknown>, key: string) => {
    if (!current[key]) current[key] = {};
    return current[key] as Record<string, unknown>;
  }, obj);
  target[lastKey] = value;
}

function removeNestedValue(obj: Record<string, unknown>, path: string): void {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  const target = keys.reduce((current: unknown, key: string) => {
    if (current && typeof current === "object") {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
  if (target && typeof target === "object") {
    delete (target as Record<string, unknown>)[lastKey];
  }
}

async function outputResults(analysis: SyncAnalysis, options: SyncOptions) {
  const format = options.format || "text";

  if (format === "json") {
    const output = JSON.stringify(analysis, null, 2);

    if (options.output) {
      await fs.writeFile(options.output, output);
      console.log(chalk.green("\u2713"), `Results written to ${options.output}`);
    } else {
      console.log(output);
    }
    return;
  }

  if (format === "junit") {
    const junitXml = generateJUnitXML(analysis);

    if (options.output) {
      await fs.writeFile(options.output, junitXml);
      console.log(chalk.green("\u2713"), `JUnit report written to ${options.output}`);
    } else {
      console.log(junitXml);
    }
    return;
  }

  // Text format (default)
  if (options.dryRun) {
    displayAnalysis(analysis);
    return;
  }

  displaySummary(analysis);
}

function displaySummary(analysis: SyncAnalysis): void {
  console.log(chalk.bold.green("\nSync Complete!"));
  console.log(`Added ${chalk.green(analysis.missingCount)} missing keys`);
  console.log(`Removed ${chalk.red(analysis.unusedCount)} unused keys`);
}

function generateJUnitXML(analysis: SyncAnalysis): string {
  const totalTests = 1;
  const failures = analysis.missingCount > 0 || analysis.unusedCount > 0 ? 1 : 0;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<testsuites name="intl-party-sync" tests="${totalTests}" failures="${failures}" errors="0">\n`;
  xml += `  <testsuite name="translation-sync" tests="${totalTests}" failures="${failures}" errors="0">\n`;

  if (failures === 0) {
    xml += `    <testcase name="sync" classname="translations" />\n`;
  } else {
    xml += `    <testcase name="sync" classname="translations">\n`;
    xml += `      <failure message="Translation sync issues found">\n`;
    xml += `        <![CDATA[\n`;

    if (analysis.missingKeys.length > 0) {
      xml += `Missing keys (${analysis.missingCount}):\n`;
      const grouped = groupKeysByLocale(analysis.missingKeys);
      for (const [locale, keys] of Object.entries(grouped)) {
        xml += `  ${locale}:\n`;
        for (const key of keys) {
          xml += `    - ${key.namespace}.${key.key}\n`;
        }
      }
    }

    if (analysis.unusedKeys.length > 0) {
      xml += `Unused keys (${analysis.unusedCount}):\n`;
      const grouped = groupKeysByLocale(analysis.unusedKeys);
      for (const [locale, keys] of Object.entries(grouped)) {
        xml += `  ${locale}:\n`;
        for (const key of keys) {
          xml += `    - ${key.namespace}.${key.key}\n`;
        }
      }
    }

    xml += `        ]]>\n`;
    xml += `      </failure>\n`;
    xml += `    </testcase>\n`;
  }

  xml += `  </testsuite>\n`;
  xml += `</testsuites>\n`;

  return xml;
}
