import fs from "fs-extra";
import path from "node:path";
import type { AllTranslations } from "@intl-party/core";

export async function loadTranslations(
  translationPaths: Record<string, Record<string, string>>,
  locales: string[],
  namespaces: string[],
): Promise<AllTranslations> {
  const translations: AllTranslations = {};

  for (const locale of locales) {
    translations[locale] = {};

    for (const namespace of namespaces) {
      const translationPath = translationPaths[locale]?.[namespace];

      if (translationPath && (await fs.pathExists(translationPath))) {
        try {
          const content = await fs.readJson(translationPath);
          translations[locale][namespace] = content;
        } catch (error) {
          console.warn(
            `Failed to load ${locale}/${namespace} from ${translationPath}`,
          );
          translations[locale][namespace] = {};
        }
      } else {
        translations[locale][namespace] = {};
      }
    }
  }

  return translations;
}

/**
 * Throws when none of the configured translation files exist. Without this,
 * a misconfigured project loads nothing and `check` / `validate` report
 * "no issues", which silently passes in CI.
 */
export async function assertTranslationFilesExist(
  translationPaths: Record<string, Record<string, string>>,
  locales: string[],
  namespaces: string[],
): Promise<void> {
  for (const locale of locales) {
    for (const namespace of namespaces) {
      const file = translationPaths[locale]?.[namespace];
      if (file && (await fs.pathExists(file))) return;
    }
  }
  throw new Error(
    "No translation files found. Expected <messages>/<locale>/<namespace>.json " +
      "(set `messages` in intl-party.config.ts, or run `intl-party nextjs --init`).",
  );
}

export async function saveTranslations(
  translations: AllTranslations,
  translationPaths: Record<string, Record<string, string>>,
): Promise<void> {
  for (const [locale, localeTranslations] of Object.entries(translations)) {
    for (const [namespace, namespaceTranslations] of Object.entries(
      localeTranslations,
    )) {
      const translationPath = translationPaths[locale]?.[namespace];

      if (translationPath) {
        await fs.ensureDir(path.dirname(translationPath));
        await fs.writeJson(translationPath, namespaceTranslations, {
          spaces: 2,
        });
      }
    }
  }
}
