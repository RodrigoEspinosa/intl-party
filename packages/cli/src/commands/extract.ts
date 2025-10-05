import chalk from "chalk";
import ora from "ora";
import { glob } from "glob";
import fs from "fs-extra";
import path from "path";

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
  const spinner = ora("Extracting translation keys...").start();

  try {
    const sourcePatterns = options.source || ["src/**/*.{ts,tsx,js,jsx}"];
    const outputDir = options.output || "./translations";

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

    // Write extracted keys to output files
    await writeExtractedKeys(Array.from(extractedKeys), outputDir, options);

    console.log(chalk.green(`✓ Translation keys extracted to ${outputDir}`));
  } catch (error) {
    spinner.fail("Extraction failed");
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error,
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
    /i18nKey=['"`]([^'"`]+)['"`]/g, // i18nKey="key"
    /\{\s*t\(['"`]([^'"`]+)['"`]\)\s*\}/g, // { t('key') }
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      keys.push(match[1]);
    }
  }

  return keys;
}

async function writeExtractedKeys(
  keys: string[],
  outputDir: string,
  options: ExtractOptions,
) {
  await fs.ensureDir(outputDir);

  // Group keys by namespace (if they have dot notation)
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

  // Write files for each namespace
  for (const [namespace, namespaceKeys] of Object.entries(namespaces)) {
    if (namespaceKeys.length === 0) continue;

    const filePath = path.join(outputDir, "en", `${namespace}.json`);
    await fs.ensureDir(path.dirname(filePath));

    let translations: Record<string, string> = {};

    if (options.update && (await fs.pathExists(filePath))) {
      try {
        translations = await fs.readJson(filePath);
      } catch {
        // Ignore read errors, start fresh
      }
    }

    // Add new keys
    for (const key of namespaceKeys) {
      if (!translations[key]) {
        translations[key] = key; // Use key as default value
      }
    }

    await fs.writeJson(filePath, translations, { spaces: 2 });
  }
}
