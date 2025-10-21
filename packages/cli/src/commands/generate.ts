import fs from "fs-extra";
import path from "node:path";
import chalk from "chalk";
import ora from "ora";
import { watch } from "chokidar";
import { loadConfig } from "../utils/config";
import { loadTranslations } from "../utils/translations";

export interface GenerateOptions {
  types?: boolean;
  schemas?: boolean;
  docs?: boolean;
  watch?: boolean;
  config?: string;
  output?: string;
  verbose?: boolean;
  client?: boolean;
}

interface MessageData {
  locales: string[];
  namespaces: string[];
  messages: Record<string, Record<string, any>>;
  translationKeys: string[];
  namespaceKeys: string[];
}

async function getMessageData(
  configPath?: string,
  options?: GenerateOptions
): Promise<MessageData> {
  // Try to load config if provided, otherwise auto-detect
  let config;
  let locales: string[];
  let namespaces: string[];
  let translationPaths: Record<string, Record<string, string>>;

  if (configPath && (await fs.pathExists(configPath))) {
    config = await loadConfig(configPath);
    locales = config.locales;
    namespaces = config.namespaces;
    translationPaths = config.translationPaths;
  } else {
    // Zero-config: Auto-detect everything from filesystem
    if (options?.verbose) {
      console.log(
        chalk.gray("No config file found, auto-detecting from filesystem...")
      );
    }

    const autoDetected = await autoDetectMessages(options);
    locales = autoDetected.locales;
    namespaces = autoDetected.namespaces;
    translationPaths = autoDetected.translationPaths;
  }

  // Handle config-based setup if config was loaded
  if (config) {
    // Prioritize Next.js-style config format
    const nextjsConfig = (config as any).shared;
    if (
      nextjsConfig &&
      nextjsConfig.messagesPath &&
      nextjsConfig.locales &&
      nextjsConfig.namespaces
    ) {
      // Convert Next.js config to CLI format
      translationPaths = {};
      for (const locale of nextjsConfig.locales) {
        translationPaths[locale] = {};
        for (const namespace of nextjsConfig.namespaces) {
          translationPaths[locale][namespace] = path.join(
            process.cwd(),
            nextjsConfig.messagesPath,
            locale,
            `${namespace}.json`
          );
        }
      }
      locales = nextjsConfig.locales;
      namespaces = nextjsConfig.namespaces;

      if (options?.verbose) {
        console.log(
          chalk.gray(
            `Using Next.js config: ${locales.length} locales, ${namespaces.length} namespaces`
          )
        );
        console.log(chalk.gray(`Messages path: ${nextjsConfig.messagesPath}`));
      }
    } else if (
      (config as any).messagesPath &&
      (config as any).locales &&
      (config as any).namespaces
    ) {
      // Handle standard config format
      const standardConfig = config as any;
      translationPaths = {};
      for (const locale of standardConfig.locales) {
        translationPaths[locale] = {};
        for (const namespace of standardConfig.namespaces) {
          translationPaths[locale][namespace] = path.join(
            process.cwd(),
            standardConfig.messagesPath,
            locale,
            `${namespace}.json`
          );
        }
      }
      locales = standardConfig.locales;
      namespaces = standardConfig.namespaces;

      if (options?.verbose) {
        console.log(
          chalk.gray(
            `Using standard config: ${locales.length} locales, ${namespaces.length} namespaces`
          )
        );
        console.log(
          chalk.gray(`Messages path: ${standardConfig.messagesPath}`)
        );
      }
    }
  }

  // Load all translations using the existing utility
  const messages = await loadTranslations(
    translationPaths,
    locales,
    namespaces
  );

  // Extract all translation keys for type generation
  const translationKeys = new Set<string>();
  const namespaceKeys = new Set<string>();

  for (const locale of locales) {
    for (const namespace of namespaces) {
      const extractKeys = (obj: any, prefix = ""): void => {
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          const namespaceKey = prefix ? key : fullKey;

          // Add namespaced key (for global translation function)
          translationKeys.add(fullKey);

          if (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          ) {
            // Recursively extract nested keys
            extractKeys(value, fullKey);
          } else {
            // This is a leaf value, add the dot-notation key to namespace keys
            // Remove the namespace prefix for namespace keys
            const dotNotationKey = fullKey.replace(`${namespace}.`, "");
            namespaceKeys.add(dotNotationKey);
          }
        }
      };

      if (messages[locale]?.[namespace]) {
        extractKeys(messages[locale][namespace], namespace);
      }
    }
  }

  return {
    locales,
    namespaces,
    messages,
    translationKeys: Array.from(translationKeys).sort(),
    namespaceKeys: Array.from(namespaceKeys).sort(),
  };
}

function generateTypescriptTypes(data: MessageData): string {
  const { locales, namespaces, translationKeys, namespaceKeys } = data;

  // Generate union type for all translation keys (with namespace prefix)
  const keyUnion = translationKeys.map((key) => `"${key}"`).join(" | ");

  // Generate union type for namespace-specific keys (without namespace prefix)
  const namespaceKeyUnion = namespaceKeys
    .map((key: string) => `"${key}"`)
    .join(" | ");

  // Generate namespace types with proper nested structure
  const namespaceTypes = namespaces
    .map((ns) => {
      // Get the actual message structure for this namespace
      const messageStructure = data.messages[locales[0]]?.[ns];
      if (!messageStructure) return `  "${ns}": {};`;

      // Generate nested interface from the actual structure
      const generateNestedInterface = (obj: any, indent = 2): string => {
        const spaces = "  ".repeat(indent);
        const entries = Object.entries(obj);

        if (entries.length === 0) return "{}";

        const interfaceLines = entries.map(([key, value]) => {
          if (
            typeof value === "object" &&
            value !== null &&
            !Array.isArray(value)
          ) {
            return `${spaces}"${key}": ${generateNestedInterface(value, indent + 1)};`;
          } else {
            return `${spaces}"${key}": string;`;
          }
        });

        return `{\n${interfaceLines.join("\n")}\n${"  ".repeat(indent - 1)}}`;
      };

      return `  "${ns}": ${generateNestedInterface(messageStructure)};`;
    })
    .join("\n");

  // Generate locale types
  const localeTypes = locales
    .map((locale) => {
      return `  "${locale}": {
${namespaceTypes}
  };`;
    })
    .join("\n");

  return `// Generated by @intl-party/cli - do not edit
// This file contains type-safe definitions for your translations

export type TranslationKey = ${keyUnion};

export type NamespaceTranslationKey = ${namespaceKeyUnion};

export type TranslationNamespace = ${namespaces.map((ns) => `"${ns}"`).join(" | ")};

export type Locale = ${locales.map((locale) => `"${locale}"`).join(" | ")};

export interface Translations {
${localeTypes}
}

export interface NamespaceTranslations {
${namespaceTypes}
}

// Helper type for getting translation value type
export type TranslationValue<T extends TranslationKey> = string;

// Helper type for getting namespace translations
export type GetNamespaceTranslations<N extends TranslationNamespace> = 
  Translations[Locale][N];

// Type-safe translation function signature
export interface TranslationFunction {
  <T extends TranslationKey>(key: T, options?: Record<string, any>): TranslationValue<T>;
  <T extends TranslationNamespace>(namespace: T): GetNamespaceTranslations<T>;
}

// Default messages object (for runtime usage)
export const defaultMessages: Translations = ${JSON.stringify(data.messages, null, 2)} as const;
`;
}

function generateClientMessages(data: MessageData): string {
  return `// Generated by @intl-party/cli - do not edit
// This file contains runtime message data for the client package

import type { Translations } from './translations.generated';

export const messages: Translations = ${JSON.stringify(data.messages, null, 2)} as const;

// Re-export for convenience
export { messages as defaultMessages } from './translations.generated';
`;
}

function generateJavaScriptMessages(data: MessageData): string {
  return `// Generated by @intl-party/cli - do not edit
// This file contains runtime message data for easy imports

export const defaultMessages = ${JSON.stringify(data.messages, null, 2)};

// Export individual locale messages for convenience
${data.locales.map((locale) => `export const ${locale}Messages = defaultMessages.${locale};`).join("\n")}
`;
}

function generateClientIndex(): string {
  return `// Generated by @intl-party/cli - do not edit
// This file is the main entry point for the client package

export * from './translations.generated';
export * from './messages.generated';
`;
}

function generateJsonSchemas(data: MessageData): string {
  const schemas: Record<string, any> = {};

  // Generate schema for each locale and namespace combination
  for (const locale of data.locales) {
    for (const namespace of data.namespaces) {
      const messages = data.messages[locale]?.[namespace] || {};
      const schema = createJsonSchema(messages);

      const schemaName = `${locale}_${namespace}`;
      schemas[schemaName] = {
        $schema: "http://json-schema.org/draft-07/schema#",
        $id: `#/schemas/${schemaName}`,
        title: `Translation schema for ${locale}/${namespace}`,
        description: `JSON schema for translation keys in ${namespace} namespace for ${locale} locale`,
        type: "object",
        properties: schema.properties,
        required: schema.required,
        additionalProperties: false,
      };
    }
  }

  // Generate a combined schema for all translations
  const combinedSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "#/schemas/translations",
    title: "IntlParty Translation Schema",
    description: "JSON schema for all IntlParty translations",
    type: "object",
    properties: {},
    definitions: {},
  };

  // Add locale definitions
  for (const locale of data.locales) {
    combinedSchema.properties[locale] = {
      type: "object",
      description: `Translations for ${locale} locale`,
      properties: {},
    };

    for (const namespace of data.namespaces) {
      const schemaName = `${locale}_${namespace}`;
      combinedSchema.properties[locale].properties[namespace] = {
        $ref: `#/definitions/${schemaName}`,
      };

      combinedSchema.definitions[schemaName] = schemas[schemaName];
    }
  }

  return JSON.stringify(
    {
      schemas,
      combined: combinedSchema,
      metadata: {
        generated: new Date().toISOString(),
        locales: data.locales,
        namespaces: data.namespaces,
        version: "1.0.0",
      },
    },
    null,
    2
  );
}

function createJsonSchema(
  obj: any,
  prefix: string = ""
): { properties: any; required: string[] } {
  const properties: any = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Recursively create schema for nested objects
      const nestedSchema = createJsonSchema(value, fullKey);
      properties[key] = {
        type: "object",
        properties: nestedSchema.properties,
        required: nestedSchema.required,
        description: `Translation key: ${fullKey}`,
      };
    } else {
      // Leaf node - actual translation value
      properties[key] = {
        type: "string",
        description: `Translation key: ${fullKey}`,
        examples: [value],
      };
      required.push(key);
    }
  }

  return { properties, required };
}

function generateDocumentation(data: MessageData): string {
  const lines: string[] = [];

  // Header
  lines.push("# Translation Documentation");
  lines.push("");
  lines.push(`Generated on: ${new Date().toISOString()}`);
  lines.push(`Locales: ${data.locales.join(", ")}`);
  lines.push(`Namespaces: ${data.namespaces.join(", ")}`);
  lines.push("");

  // Table of contents
  lines.push("## Table of Contents");
  for (const locale of data.locales) {
    lines.push(`- [${locale.toUpperCase()}](#${locale.toLowerCase()})`);
  }
  lines.push("");

  // Documentation for each locale
  for (const locale of data.locales) {
    lines.push(`## ${locale.toUpperCase()}`);
    lines.push("");

    for (const namespace of data.namespaces) {
      const messages = data.messages[locale]?.[namespace] || {};

      if (Object.keys(messages).length === 0) {
        continue;
      }

      lines.push(`### ${namespace} namespace`);
      lines.push("");

      // Generate documentation for each key
      generateNamespaceDocumentation(messages, lines, "");
    }

    lines.push("");
  }

  // Summary
  lines.push("## Summary");
  lines.push("");

  const totalKeys = Object.values(data.messages)
    .flatMap((locale) => Object.values(locale))
    .reduce((total, namespace) => {
      return total + countKeys(namespace);
    }, 0);

  lines.push(`- **Total locales**: ${data.locales.length}`);
  lines.push(`- **Total namespaces**: ${data.namespaces.length}`);
  lines.push(`- **Total translation keys**: ${totalKeys}`);
  lines.push("");

  // Key statistics by locale
  lines.push("### Keys by Locale");
  lines.push("");

  for (const locale of data.locales) {
    const localeKeys = Object.values(data.messages[locale] || {}).reduce(
      (total, namespace) => total + countKeys(namespace),
      0
    );
    lines.push(`- **${locale}**: ${localeKeys} keys`);
  }

  return lines.join("\n");
}

function generateNamespaceDocumentation(
  obj: any,
  lines: string[],
  prefix: string
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Nested object
      lines.push(`#### ${fullKey}`);
      lines.push("");
      lines.push("Nested translation object containing:");
      lines.push("");

      const nestedKeys = Object.keys(value);
      for (const nestedKey of nestedKeys) {
        lines.push(`- \`${fullKey}.${nestedKey}\``);
      }
      lines.push("");

      // Recursively document nested keys
      generateNamespaceDocumentation(value, lines, fullKey);
    } else {
      // Leaf node - actual translation
      lines.push(`#### ${fullKey}`);
      lines.push("");
      lines.push(`**Translation**: \`"${value}"\``);
      lines.push("");

      // Add interpolation info if the value contains placeholders
      const interpolationMatches = String(value).match(/\{\{([^}]+)\}\}/g);
      if (interpolationMatches) {
        lines.push("**Interpolation variables**:");
        lines.push("");
        const variables = interpolationMatches.map((match) =>
          match.replace(/[{}]/g, "")
        );
        const uniqueVariables = [...new Set(variables)];
        for (const variable of uniqueVariables) {
          lines.push(`- \`${variable}\``);
        }
        lines.push("");
      }
    }
  }
}

function countKeys(obj: any): number {
  let count = 0;

  for (const value of Object.values(obj)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      count += countKeys(value);
    } else {
      count += 1;
    }
  }

  return count;
}

async function autoDetectMessages(options?: GenerateOptions): Promise<{
  locales: string[];
  namespaces: string[];
  translationPaths: Record<string, Record<string, string>>;
}> {
  const cwd = process.cwd();

  // Look for common message directory patterns
  const possibleMessageDirs = [
    path.join(cwd, "messages"),
    path.join(cwd, "locales"),
    path.join(cwd, "translations"),
    path.join(cwd, "i18n"),
  ];

  let messagesDir: string | null = null;
  for (const dir of possibleMessageDirs) {
    if (await fs.pathExists(dir)) {
      messagesDir = dir;
      break;
    }
  }

  if (!messagesDir) {
    throw new Error(
      "No messages directory found. Expected one of: messages/, locales/, translations/, i18n/"
    );
  }

  if (options?.verbose) {
    console.log(chalk.gray(`Found messages directory: ${messagesDir}`));
  }

  // Auto-detect locales from directory structure
  const localeDirs = await fs.readdir(messagesDir);
  const detectedLocales = localeDirs.filter(async (dir) => {
    const localePath = path.join(messagesDir!, dir);
    const stat = await fs.stat(localePath);
    return stat.isDirectory();
  });

  // Wait for all stat checks to complete
  const validLocales = [];
  for (const dir of localeDirs) {
    const localePath = path.join(messagesDir!, dir);
    const stat = await fs.stat(localePath);
    if (stat.isDirectory()) {
      validLocales.push(dir);
    }
  }

  if (validLocales.length === 0) {
    throw new Error(`No locale directories found in ${messagesDir}`);
  }

  // Auto-detect namespaces from the first locale
  const firstLocale = validLocales[0];
  const firstLocalePath = path.join(messagesDir, firstLocale);
  const namespaceFiles = await fs.readdir(firstLocalePath);
  const detectedNamespaces = namespaceFiles
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.basename(file, ".json"));

  if (detectedNamespaces.length === 0) {
    throw new Error(`No JSON files found in ${firstLocalePath}`);
  }

  // Build translation paths
  const translationPaths: Record<string, Record<string, string>> = {};
  for (const locale of validLocales) {
    translationPaths[locale] = {};
    for (const namespace of detectedNamespaces) {
      translationPaths[locale][namespace] = path.join(
        messagesDir,
        locale,
        `${namespace}.json`
      );
    }
  }

  if (options?.verbose) {
    console.log(
      chalk.gray(
        `Auto-detected ${validLocales.length} locales: ${validLocales.join(", ")}`
      )
    );
    console.log(
      chalk.gray(
        `Auto-detected ${detectedNamespaces.length} namespaces: ${detectedNamespaces.join(", ")}`
      )
    );
  }

  return {
    locales: validLocales,
    namespaces: detectedNamespaces,
    translationPaths,
  };
}

function generateCacheHash(data: MessageData): string {
  const crypto = require("crypto");
  const content = JSON.stringify({
    locales: data.locales.sort(),
    namespaces: data.namespaces.sort(),
    messages: data.messages,
  });
  return crypto.createHash("md5").update(content).digest("hex");
}

async function writeGeneratedFiles(
  data: MessageData,
  outputDir: string,
  options: GenerateOptions
): Promise<void> {
  await fs.ensureDir(outputDir);

  // Generate cache hash
  const cacheHash = generateCacheHash(data);
  const cacheFilePath = path.join(outputDir, ".intl-party-cache");

  // Check if we need to regenerate
  let shouldRegenerate = true;
  if (await fs.pathExists(cacheFilePath)) {
    const existingHash = await fs.readFile(cacheFilePath, "utf-8");
    if (existingHash === cacheHash) {
      shouldRegenerate = false;
    }
  }

  if (!shouldRegenerate && !options.watch && !options.client) {
    if (options.verbose) {
      console.log(chalk.gray("No changes detected, skipping generation"));
    }
    return;
  }

  // Generate TypeScript types
  if (options.types !== false) {
    const typesContent = generateTypescriptTypes(data);
    const typesFilePath = path.join(outputDir, "translations.generated.ts");
    await fs.writeFile(typesFilePath, typesContent);

    // Also generate a JavaScript version for easier imports
    const jsContent = generateJavaScriptMessages(data);
    const jsFilePath = path.join(outputDir, "messages.generated.js");
    await fs.writeFile(jsFilePath, jsContent);

    if (options.verbose) {
      console.log(chalk.green(`✓ Generated types: ${typesFilePath}`));
    }
  }

  // Generate schemas
  if (options.schemas) {
    const schemasContent = generateJsonSchemas(data);
    const schemasFilePath = path.join(outputDir, "schemas.json");
    await fs.writeFile(schemasFilePath, schemasContent);

    if (options.verbose) {
      console.log(chalk.green(`✓ Generated schemas: ${schemasFilePath}`));
    }
  }

  // Generate documentation
  if (options.docs) {
    const docsContent = generateDocumentation(data);
    const docsFilePath = path.join(outputDir, "translations.md");
    await fs.writeFile(docsFilePath, docsContent);

    if (options.verbose) {
      console.log(chalk.green(`✓ Generated documentation: ${docsFilePath}`));
    }
  }

  // Write cache file
  await fs.writeFile(cacheFilePath, cacheHash);
}

async function generateClientPackage(
  data: MessageData,
  options: GenerateOptions
): Promise<void> {
  console.log(chalk.blue("🔧 Generating client package files..."));
  if (options.verbose) {
    console.log(chalk.gray(`Data: ${JSON.stringify(data, null, 2)}`));
  }
  // Find the monorepo root by looking for the root package.json
  let rootDir = process.cwd();
  while (rootDir !== path.dirname(rootDir)) {
    const packageJsonPath = path.join(rootDir, "package.json");
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      if (packageJson.name === "@intl-party/monorepo") {
        break;
      }
    }
    rootDir = path.dirname(rootDir);
  }

  const clientDir = path.join(rootDir, "packages/client/generated");
  await fs.ensureDir(clientDir);

  // Generate types for client package
  const typesContent = generateTypescriptTypes(data);
  const typesFilePath = path.join(clientDir, "translations.generated.ts");
  if (options.verbose) {
    console.log(chalk.gray(`Writing types to: ${typesFilePath}`));
  }
  await fs.writeFile(typesFilePath, typesContent);

  // Generate messages for client package
  const messagesContent = generateClientMessages(data);
  const messagesFilePath = path.join(clientDir, "messages.generated.ts");
  if (options.verbose) {
    console.log(chalk.gray(`Writing messages to: ${messagesFilePath}`));
  }
  await fs.writeFile(messagesFilePath, messagesContent);

  // Generate index for client package
  const indexContent = generateClientIndex();
  const indexPath = path.join(clientDir, "index.generated.ts");
  if (options.verbose) {
    console.log(chalk.gray(`Writing index to: ${indexPath}`));
  }
  await fs.writeFile(indexPath, indexContent);

  if (options.verbose) {
    console.log(
      chalk.green(`✓ Generated client package files in ${clientDir}`)
    );
  }
}

async function setupWatcher(
  configPath: string | undefined,
  outputDir: string,
  options: GenerateOptions
): Promise<void> {
  const config = await loadConfig(configPath);
  const { translationPaths } = config;

  // Collect all translation file paths
  const watchPaths: string[] = [];
  for (const localePaths of Object.values(translationPaths)) {
    watchPaths.push(...Object.values(localePaths));
  }

  console.log(
    chalk.blue(`👀 Watching for changes in ${watchPaths.length} files...`)
  );

  const watcher = watch(watchPaths, {
    ignoreInitial: true,
    persistent: true,
  });

  watcher.on("change", async (filePath: string) => {
    console.log(chalk.yellow(`📝 File changed: ${filePath}`));

    try {
      const data = await getMessageData(configPath);
      await writeGeneratedFiles(data, outputDir, options);
      console.log(chalk.green("✓ Regenerated translations"));
    } catch (error) {
      console.error(chalk.red("✗ Failed to regenerate:"), error);
    }
  });

  // Handle process termination
  process.on("SIGINT", () => {
    watcher.close();
    console.log(chalk.gray("\n👋 Stopped watching"));
    process.exit(0);
  });
}

export async function generateCommand(options: GenerateOptions) {
  const spinner = ora("Loading translation data...").start();

  // Debug logging
  if (options.verbose) {
    console.log(
      chalk.gray(`Debug options: ${JSON.stringify(options, null, 2)}`)
    );
  }

  try {
    // Load message data using the config utility
    const data = await getMessageData(options.config, options);

    spinner.succeed(
      `Loaded ${data.locales.length} locales, ${data.namespaces.length} namespaces, ${data.translationKeys.length} keys`
    );

    // Determine output directory
    const outputDir = options.output || "./node_modules/.intl-party";

    // Write generated files
    spinner.start("Generating files...");
    await writeGeneratedFiles(data, outputDir, options);
    spinner.succeed("Files generated successfully");

    console.log(chalk.green(`✓ Generated translation files in ${outputDir}`));

    // Generate client package files if requested (always, regardless of cache)
    if (options.client) {
      await generateClientPackage(data, options);
    }

    // Setup watch mode if requested
    if (options.watch) {
      await setupWatcher(options.config, outputDir, options);
    }
  } catch (error) {
    spinner.fail("Generation failed");
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}
