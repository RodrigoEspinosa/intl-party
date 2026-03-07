import chalk from "chalk";
import ora from "ora";
import { glob } from "glob";
import fs from "fs-extra";
import path from "node:path";
import { loadConfig, CLIConfig } from "../utils/config";

export interface ExtractOptions {
  source?: string[];
  output?: string;
  dryRun?: boolean;
  update?: boolean;
  removeUnused?: boolean;
  config?: string;
  verbose?: boolean;
}

export async function extractCommand(options: ExtractOptions) {
  const spinner = ora("Loading configuration...").start();
  let config: CLIConfig;

  try {
    config = await loadConfig(options.config);
    spinner.succeed("Configuration loaded");
  } catch (error) {
    spinner.fail("Failed to load configuration");
    console.error(chalk.red("Error:"), error instanceof Error ? error.message : error);
    process.exit(1);
  }

  spinner.start("Extracting translation keys...");

  try {
    const sourcePatterns = options.source || config.sourcePatterns || ["src/**/*.{ts,tsx,js,jsx}"];
    const outputDir = options.output || config.outputDir || "./messages";

    // Find all source files
    const files = await glob(sourcePatterns);
    spinner.succeed(`Found ${files.length} source files`);

    // Extract keys from each file
    const extractedKeys = new Set<string>();

    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      const keys = extractKeysFromContent(content);
      keys.forEach((key) => extractedKeys.add(key));
    }

    spinner.succeed(`Extracted ${extractedKeys.size} unique translation keys`);

    if (options.dryRun) {
      console.log("\nExtracted keys:");
      Array.from(extractedKeys)
        .sort()
        .forEach((key) => {
          console.log(`  ${chalk.cyan(key)}`);
        });
      return;
    }

    // Write extracted keys to output files for all configured locales
    await writeExtractedKeys(Array.from(extractedKeys), outputDir, config, options);

    console.log(chalk.green(`✓ Translation keys extracted to ${outputDir}`));
  } catch (error) {
    spinner.fail("Extraction failed");
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

function extractKeysFromContent(content: string): string[] {
  const keys: string[] = [];

  // Common patterns for translation key usage
  const patterns = [
    /t\(['"`]([^'"`]+)['"`]\)/g, // t('key')
    /useTranslations\(\)\(['"`]([^'"`]+)['"`]\)/g, // useTranslations()('key')
    /useTranslations\(['"`]([^'"`]+)['"`]\)\(['"`]([^'"`]+)['"`]\)/g, // useTranslations('ns')('key')
    /i18nKey=['"`]([^'"`]+)['"`]/g, // i18nKey="key"
    /\{\s*t\(['"`]([^'"`]+)['"`]\)\s*\}/g, // { t('key') }
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      // If there are two capture groups, it's the namespaced version
      if (match[2]) {
        keys.push(`${match[1]}.${match[2]}`);
      } else {
        keys.push(match[1]);
      }
    }
  }

  return keys;
}

async function writeExtractedKeys(
  keys: string[],
  outputDir: string,
  config: CLIConfig,
  options: ExtractOptions
) {
  await fs.ensureDir(outputDir);

  // Group keys by namespace
  const namespaces: Record<string, string[]> = { common: [] };

  for (const key of keys) {
    const parts = key.split(".");
    if (parts.length > 1) {
      const namespace = parts[0];
      const keyWithoutNamespace = parts.slice(1).join(".");

      if (!namespaces[namespace]) {
        namespaces[namespace] = [];
      }
      namespaces[namespace].push(keyWithoutNamespace);
    } else {
      namespaces.common.push(key);
    }
  }

  // Write files for each locale and namespace
  const locales = config.locales || ["en"];

  for (const locale of locales) {
    for (const [namespace, namespaceKeys] of Object.entries(namespaces)) {
      if (namespaceKeys.length === 0) continue;

      const filePath = path.join(outputDir, locale, `${namespace}.json`);
      await fs.ensureDir(path.dirname(filePath));

      let translations: Record<string, string> = {};

      if ((options.update || locale !== config.defaultLocale) && (await fs.pathExists(filePath))) {
        try {
          translations = await fs.readJson(filePath);
        } catch {
          // Ignore read errors, start fresh
        }
      }

      // Add new keys
      for (const key of namespaceKeys) {
        if (!translations[key]) {
          translations[key] = locale === config.defaultLocale ? key : ""; // Use key as default value only for default locale
        }
      }

      // Sort keys if configured
      if (config.extraction?.sortKeys !== false) {
        const sortedTranslations: Record<string, string> = {};
        Object.keys(translations)
          .sort()
          .forEach((k) => {
            sortedTranslations[k] = translations[k];
          });
        translations = sortedTranslations;
      }

      await fs.writeJson(filePath, translations, { spaces: 2 });
    }
  }
}
