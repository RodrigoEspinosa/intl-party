import fs from "fs-extra";
import path from "node:path";

export interface CLIConfig {
  locales: string[];
  defaultLocale: string;
  namespaces: string[];
  translationPaths: {
    [locale: string]: {
      [namespace: string]: string;
    };
  };
  sourcePatterns: string[];
  outputDir: string;
  validation?: {
    strict?: boolean;
    logMissing?: boolean;
    throwOnMissing?: boolean;
    validateFormats?: boolean;
  };
  extraction?: {
    keyPrefix?: string;
    markExtracted?: boolean;
    sortKeys?: boolean;
    includeMetadata?: boolean;
  };
  sync?: {
    removeUnused?: boolean;
    addMissing?: boolean;
    preserveOrder?: boolean;
  };
}

const DEFAULT_CONFIG: CLIConfig = {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["common"],
  translationPaths: {},
  // Next.js projects often keep app/, pages/, and components/ at the root
  sourcePatterns: ["{src,app,pages,components,lib}/**/*.{ts,tsx,js,jsx}"],
  outputDir: "./translations",
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

/**
 * Loads a JS/TS/JSON config module. TS (and ESM JS) configs are loaded via
 * jiti so a scaffolded `intl-party.config.ts` actually works instead of
 * throwing "Unknown file extension .ts" at runtime.
 */
async function loadConfigFile(configFile: string): Promise<any> {
  if (configFile.endsWith(".json")) {
    const content = await fs.readFile(configFile, "utf-8");
    return JSON.parse(content);
  }

  const resolved = path.resolve(configFile);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createJiti } = require("jiti");
  const jiti = createJiti(__filename, { interopDefault: true });
  const loaded = await jiti.import(resolved, { default: true });
  return loaded;
}

const CONFIG_CANDIDATES = [
  "intl-party.config.js",
  "intl-party.config.ts",
  "intl-party.config.json",
  ".intl-party.config.js",
  ".intl-party.config.ts",
  ".intl-party.config.json",
];

/**
 * Resolves the path of the config file to use: the explicit one if given
 * (erroring when it's missing), otherwise the first auto-detected candidate,
 * or null when none exists. Lets commands respect intl-party.config.* without
 * an explicit --config flag.
 */
export async function findConfigFile(
  configPath?: string,
): Promise<string | null> {
  if (configPath) {
    if (!(await fs.pathExists(configPath))) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    return configPath;
  }
  for (const candidate of CONFIG_CANDIDATES) {
    if (await fs.pathExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

export async function loadConfig(configPath?: string): Promise<CLIConfig> {
  // An explicitly-provided path that doesn't exist is an error, not a reason
  // to silently fall back to auto-detection.
  if (configPath && !(await fs.pathExists(configPath))) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const configFiles = [configPath, ...CONFIG_CANDIDATES].filter(Boolean);

  for (const configFile of configFiles) {
    if (configFile && (await fs.pathExists(configFile))) {
      try {
        const config = await loadConfigFile(configFile);
        return await resolveMessagesDirectory(
          mergeConfig(DEFAULT_CONFIG, config),
          config,
        );
      } catch (error) {
        throw new Error(
          `Failed to load config from ${configFile}: ${error instanceof Error ? error.message : error}`,
          { cause: error },
        );
      }
    }
  }

  // Try to infer config from package.json
  const packageJsonPath = "package.json";
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const packageJson = await fs.readJson(packageJsonPath);
      if (packageJson["intl-party"]) {
        return mergeConfig(DEFAULT_CONFIG, packageJson["intl-party"]);
      }
    } catch {
      // Ignore package.json parsing errors
    }
  }

  // Try to auto-detect structure
  const autoDetected = await autoDetectConfig();

  return mergeConfig(DEFAULT_CONFIG, autoDetected);
}

async function autoDetectConfig(): Promise<Partial<CLIConfig>> {
  const config: Partial<CLIConfig> = {};

  // Auto-detect translation files
  const commonPaths = [
    "translations",
    "locales",
    "i18n",
    "public/locales",
    "src/locales",
    "src/translations",
    "assets/locales",
  ];

  for (const basePath of commonPaths) {
    if (await fs.pathExists(basePath)) {
      try {
        const entries = await fs.readdir(basePath);
        const locales = entries.filter((entry) =>
          fs.statSync(path.join(basePath, entry)).isDirectory(),
        );

        if (locales.length > 0) {
          config.locales = locales;
          config.translationPaths = {};

          // Try to detect namespaces
          const firstLocaleDir = path.join(basePath, locales[0]);
          const namespaceFiles = await fs.readdir(firstLocaleDir);
          const namespaces = namespaceFiles
            .filter((file) => file.endsWith(".json"))
            .map((file) => path.basename(file, ".json"));

          if (namespaces.length > 0) {
            config.namespaces = namespaces;

            // Build translation paths
            for (const locale of locales) {
              config.translationPaths![locale] = {};
              for (const namespace of namespaces) {
                config.translationPaths![locale][namespace] = path.join(
                  basePath,
                  locale,
                  `${namespace}.json`,
                );
              }
            }
          }

          break;
        }
      } catch {
        // Continue checking other paths
      }
    }
  }

  return config;
}

/**
 * Fills in locales, namespaces, and translationPaths from a `messages`
 * directory laid out as `<messages>/<locale>/<namespace>.json` — the config
 * format `intl-party nextjs --init` writes. Without this, commands saw the
 * default `namespaces: ["common"]` and no translation paths, loaded nothing,
 * and reported "no issues".
 */
async function resolveMessagesDirectory(
  merged: CLIConfig,
  userConfig: any,
): Promise<CLIConfig> {
  const messagesDir = userConfig?.messages;
  if (
    typeof messagesDir !== "string" ||
    Object.keys(userConfig.translationPaths ?? {}).length > 0 ||
    !(await fs.pathExists(messagesDir))
  ) {
    return merged;
  }

  const entries = await fs.readdir(messagesDir);
  const detectedLocales: string[] = [];
  const detectedNamespaces = new Set<string>();
  for (const entry of entries) {
    const localeDir = path.join(messagesDir, entry);
    if (!(await fs.stat(localeDir)).isDirectory()) continue;
    detectedLocales.push(entry);
    for (const file of await fs.readdir(localeDir)) {
      if (file.endsWith(".json")) {
        detectedNamespaces.add(path.basename(file, ".json"));
      }
    }
  }

  const locales: string[] = userConfig.locales?.length
    ? userConfig.locales
    : detectedLocales;
  const namespaces: string[] = userConfig.namespaces?.length
    ? userConfig.namespaces
    : [...detectedNamespaces].sort();

  const translationPaths: CLIConfig["translationPaths"] = {};
  for (const locale of locales) {
    translationPaths[locale] = {};
    for (const namespace of namespaces) {
      translationPaths[locale][namespace] = path.join(
        messagesDir,
        locale,
        `${namespace}.json`,
      );
    }
  }

  return {
    ...merged,
    locales,
    defaultLocale: locales.includes(merged.defaultLocale)
      ? merged.defaultLocale
      : locales[0],
    namespaces,
    translationPaths,
  };
}

function mergeConfig(defaultConfig: CLIConfig, userConfig: any): CLIConfig {
  const merged = {
    ...defaultConfig,
    ...userConfig,
    validation: {
      ...defaultConfig.validation,
      ...userConfig.validation,
    },
    extraction: {
      ...defaultConfig.extraction,
      ...userConfig.extraction,
    },
    sync: {
      ...defaultConfig.sync,
      ...userConfig.sync,
    },
    translationPaths: {
      ...defaultConfig.translationPaths,
      ...userConfig.translationPaths,
    },
  };

  // Support config aliases
  if (userConfig.messages && !userConfig.outputDir) {
    merged.outputDir = userConfig.messages;
  }

  if (userConfig.sourceDir && !userConfig.sourcePatterns) {
    merged.sourcePatterns = [
      path.join(userConfig.sourceDir, "**/*.{ts,tsx,js,jsx}"),
    ];
  }

  return merged;
}

export async function saveConfig(
  config: CLIConfig,
  configPath: string = "intl-party.config.json",
): Promise<void> {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}
