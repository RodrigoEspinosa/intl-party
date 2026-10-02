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
  format?: "text" | "json" | "junit";
  config?: string;
  verbose?: boolean;
}

export interface ExtractResult {
  extractedKeys: string[];
  missingKeysByLocale: Record<string, string[]>;
  totalFiles: number;
  totalKeys: number;
}

export async function extractCommand(options: ExtractOptions) {
  const spinner = ora("Loading configuration...").start();
  let config: CLIConfig;

  try {
    config = await loadConfig(options.config);
    spinner.succeed("Configuration loaded");
  } catch (error) {
    spinner.fail("Failed to load configuration");
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }

  spinner.start("Extracting translation keys...");

  try {
    const sourcePatterns = options.source || config.sourcePatterns;
    const outputDir = options.output || config.outputDir || "./messages";

    // Find all source files
    const files = await glob(sourcePatterns);
    spinner.succeed(`Found ${files.length} source files`);

    // Extract keys from each file, resolved to a namespace
    const namespaces = config.namespaces ?? [];
    const defaultNamespace = namespaces.includes("common")
      ? "common"
      : (namespaces[0] ?? "common");
    const references = new Map<string, ResolvedKey>();

    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      for (const ref of extractKeyReferences(content)) {
        const resolved = resolveKeyReference(ref, namespaces, defaultNamespace);
        references.set(formatKey(resolved), resolved);
      }
    }
    const extractedKeys = new Set(references.keys());
    const resolvedKeys = Array.from(references.values());

    spinner.succeed(`Extracted ${extractedKeys.size} unique translation keys`);

    // Compute missing keys per locale
    const missingKeysByLocale = await computeMissingKeys(
      resolvedKeys,
      outputDir,
      config,
    );

    const result: ExtractResult = {
      extractedKeys: Array.from(extractedKeys).sort(),
      missingKeysByLocale,
      totalFiles: files.length,
      totalKeys: extractedKeys.size,
    };

    if (options.dryRun) {
      await outputResults(result, options);
      return;
    }

    // Write extracted keys to output files for all configured locales
    await writeExtractedKeys(resolvedKeys, outputDir, config);

    await outputResults(result, options);
  } catch (error) {
    spinner.fail("Extraction failed");
    console.error(
      chalk.red("Error:"),
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

export function extractKeysFromContent(content: string): string[] {
  const keys: string[] = [];

  // Common patterns for translation key usage. The `t(` pattern uses a
  // negative lookbehind so it only matches a standalone `t(...)` call and not
  // the tail of unrelated functions like parseInt(, format(, or split(.
  const patterns = [
    /(?<![\w.])t\(['"`]([^'"`]+)['"`]\)/g, // t('key')
    /useTranslations\(\)\(['"`]([^'"`]+)['"`]\)/g, // useTranslations()('key')
    /useTranslations\(['"`]([^'"`]+)['"`]\)\(['"`]([^'"`]+)['"`]\)/g, // useTranslations('ns')('key')
    /i18nKey=['"`]([^'"`]+)['"`]/g, // i18nKey="key"
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

export interface KeyReference {
  /** Namespace from the translator's hook, or null if unknown */
  namespace: string | null;
  key: string;
}

export interface ResolvedKey {
  namespace: string;
  /** Dot path inside the namespace file, e.g. "navigation.home" */
  key: string;
}

const TRANSLATION_HOOKS =
  "useTranslations|useScopedTranslations|useZeroTranslations";

/**
 * Finds translation key references and, where possible, the namespace they
 * belong to: `const t = useTranslations("common"); t("navigation.home")` is
 * the key "navigation.home" in "common", not the key "home" in a
 * "navigation" namespace. Calls with params (`t("hi", { name })`) count too.
 */
export function extractKeyReferences(content: string): KeyReference[] {
  const refs: KeyReference[] = [];
  const quoted = `['"\`]([^'"\`]+)['"\`]`;

  // Translator bindings: const t = useTranslations("ns")
  const bindings = new Map<string, string | null>([["t", null]]);
  const bindingRegex = new RegExp(
    `(?:const|let|var)\\s+(\\w+)\\s*=\\s*(?:${TRANSLATION_HOOKS})\\(\\s*(?:${quoted})?\\s*\\)`,
    "g",
  );
  for (const match of content.matchAll(bindingRegex)) {
    bindings.set(match[1], match[2] ?? null);
  }

  for (const [name, namespace] of bindings) {
    const callRegex = new RegExp(
      `(?<![\\w.])${name}\\(\\s*${quoted}\\s*[,)]`,
      "g",
    );
    for (const match of content.matchAll(callRegex)) {
      refs.push({ namespace, key: match[1] });
    }
  }

  // useTranslations("ns")("key") and useTranslations()("key")
  const inlineRegex = new RegExp(
    `(?:${TRANSLATION_HOOKS})\\(\\s*(?:${quoted})?\\s*\\)\\(\\s*${quoted}`,
    "g",
  );
  for (const match of content.matchAll(inlineRegex)) {
    refs.push({ namespace: match[1] ?? null, key: match[2] });
  }

  // <Trans i18nKey="key" />
  for (const match of content.matchAll(new RegExp(`i18nKey=${quoted}`, "g"))) {
    refs.push({ namespace: null, key: match[1] });
  }

  return refs;
}

/**
 * Picks the namespace for a reference. Unscoped keys whose first segment is
 * a known namespace ("auth.title") go to that namespace; anything else goes
 * to the default namespace as a nested path.
 */
export function resolveKeyReference(
  ref: KeyReference,
  namespaces: string[],
  defaultNamespace: string,
): ResolvedKey {
  if (ref.namespace) return { namespace: ref.namespace, key: ref.key };
  const [first, ...rest] = ref.key.split(".");
  if (rest.length > 0 && namespaces.includes(first)) {
    return { namespace: first, key: rest.join(".") };
  }
  return { namespace: defaultNamespace, key: ref.key };
}

function formatKey({ namespace, key }: ResolvedKey): string {
  return `${namespace}:${key}`;
}

function getPath(obj: unknown, keyPath: string): unknown {
  return keyPath
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      obj,
    );
}

function setPath(
  obj: Record<string, unknown>,
  keyPath: string,
  value: string,
): void {
  const parts = keyPath.split(".");
  let node = obj;
  for (const part of parts.slice(0, -1)) {
    if (typeof node[part] !== "object" || node[part] === null) {
      node[part] = {};
    }
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

function groupByNamespace(keys: ResolvedKey[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const { namespace, key } of keys) {
    groups.set(namespace, [...(groups.get(namespace) ?? []), key]);
  }
  return groups;
}

async function computeMissingKeys(
  keys: ResolvedKey[],
  outputDir: string,
  config: CLIConfig,
): Promise<Record<string, string[]>> {
  const missingKeysByLocale: Record<string, string[]> = {};
  const locales = config.locales || ["en"];
  const groups = groupByNamespace(keys);

  for (const locale of locales) {
    const missing: string[] = [];

    for (const [namespace, namespaceKeys] of groups) {
      const filePath = path.join(outputDir, locale, `${namespace}.json`);
      let existingTranslations: Record<string, unknown> = {};

      if (await fs.pathExists(filePath)) {
        try {
          existingTranslations = await fs.readJson(filePath);
        } catch {
          // Ignore read errors
        }
      }

      for (const key of namespaceKeys) {
        if (!getPath(existingTranslations, key)) {
          missing.push(formatKey({ namespace, key }));
        }
      }
    }

    if (missing.length > 0) {
      missingKeysByLocale[locale] = missing;
    }
  }

  return missingKeysByLocale;
}

async function outputResults(result: ExtractResult, options: ExtractOptions) {
  const format = options.format || "text";

  if (format === "json") {
    const output = JSON.stringify(result, null, 2);
    console.log(output);
    return;
  }

  if (format === "junit") {
    const junitXml = generateJUnitXML(result);
    console.log(junitXml);
    return;
  }

  // Text format (default)
  if (options.dryRun) {
    console.log("\nExtracted keys:");
    result.extractedKeys.forEach((key) => {
      console.log(`  ${chalk.cyan(key)}`);
    });
  }

  const localesWithMissing = Object.keys(result.missingKeysByLocale);
  if (localesWithMissing.length > 0) {
    console.log(chalk.yellow("\nMissing keys by locale:"));
    for (const locale of localesWithMissing) {
      const missingKeys = result.missingKeysByLocale[locale];
      console.log(
        chalk.bold(`  ${locale}: ${missingKeys.length} missing key(s)`),
      );
      for (const key of missingKeys) {
        console.log(`    ${chalk.gray("-")} ${key}`);
      }
    }
  } else if (!options.dryRun) {
    console.log(
      chalk.green(
        `\u2713 Translation keys extracted to ${options.output || "./messages"}`,
      ),
    );
  }
}

function generateJUnitXML(result: ExtractResult): string {
  const localesWithMissing = Object.keys(result.missingKeysByLocale);
  const totalMissing = localesWithMissing.reduce(
    (sum, locale) => sum + result.missingKeysByLocale[locale].length,
    0,
  );
  const failures = totalMissing > 0 ? 1 : 0;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<testsuites name="intl-party-extract" tests="1" failures="${failures}" errors="0">\n`;
  xml += `  <testsuite name="key-extraction" tests="1" failures="${failures}" errors="0">\n`;

  if (totalMissing === 0) {
    xml += `    <testcase name="extraction" classname="translations" />\n`;
  } else {
    xml += `    <testcase name="extraction" classname="translations">\n`;
    xml += `      <failure message="${totalMissing} missing translation keys">\n`;
    xml += `        <![CDATA[\n`;

    for (const locale of localesWithMissing) {
      xml += `${locale}:\n`;
      for (const key of result.missingKeysByLocale[locale]) {
        xml += `  - ${key}\n`;
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

async function writeExtractedKeys(
  keys: ResolvedKey[],
  outputDir: string,
  config: CLIConfig,
) {
  await fs.ensureDir(outputDir);
  const groups = groupByNamespace(keys);

  // Write files for each locale and namespace
  const locales = config.locales || ["en"];

  for (const locale of locales) {
    for (const [namespace, namespaceKeys] of groups) {
      const filePath = path.join(outputDir, locale, `${namespace}.json`);
      await fs.ensureDir(path.dirname(filePath));

      let translations: Record<string, unknown> = {};

      // Always merge into the existing file: rewriting from scratch would
      // wipe real translation values and keys the extractor didn't match.
      if (await fs.pathExists(filePath)) {
        try {
          translations = await fs.readJson(filePath);
        } catch {
          // Ignore read errors, start fresh
        }
      }

      // Add new keys as nested paths ("navigation.home" → { navigation: { home } })
      for (const key of namespaceKeys) {
        if (!getPath(translations, key)) {
          // Use the key as a placeholder only in the default locale
          setPath(
            translations,
            key,
            locale === config.defaultLocale ? key : "",
          );
        }
      }

      // Sort keys if configured
      if (config.extraction?.sortKeys !== false) {
        translations = sortKeysDeep(translations);
      }

      await fs.writeJson(filePath, translations, { spaces: 2 });
    }
  }
}

function sortKeysDeep(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    const value = obj[key];
    sorted[key] =
      value && typeof value === "object" && !Array.isArray(value)
        ? sortKeysDeep(value as Record<string, unknown>)
        : value;
  }
  return sorted;
}
