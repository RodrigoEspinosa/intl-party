import fs from "fs-extra";
import path from "path";
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
