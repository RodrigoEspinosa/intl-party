import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { TranslationUtils } from "../utils/translation-utils";

type MessageIds = "missingTranslationKey" | "invalidTranslationKey";

export interface NoMissingKeysOptions {
  translationFiles?: string[];
  defaultLocale?: string;
  configPath?: string;
}

export const noMissingKeys = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/RodrigoEspinosa/intl-party/blob/main/packages/eslint-plugin/docs/rules/${name}.md`
)<[NoMissingKeysOptions], MessageIds>({
  name: "no-missing-keys",
  meta: {
    type: "problem",
    docs: {
      description: "Ensure all translation keys exist in translation files",
      recommended: "recommended",
    },
    schema: [
      {
        type: "object",
        properties: {
          translationFiles: {
            type: "array",
            items: { type: "string" },
            description: "Paths to translation files to check against",
          },
          defaultLocale: {
            type: "string",
            default: "en",
            description: "Default locale to check keys against",
          },
          configPath: {
            type: "string",
            description: "Path to intl-party configuration file",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingTranslationKey:
        'Translation key "{{key}}" is missing from translation files',
      invalidTranslationKey: 'Translation key "{{key}}" has invalid format',
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const {
      translationFiles = [],
      defaultLocale = "en",
      configPath,
    } = options || {};

    // Initialize translation utilities
    const translationUtils = new TranslationUtils({
      translationFiles,
      defaultLocale,
      configPath,
    });

    function isValidTranslationKey(key: string): boolean {
      return translationUtils.isValidTranslationKey(key);
    }

    // ESLint rules must report synchronously during traversal, so all
    // translation loading is synchronous (with a module-level cache).
    function translationsAvailable(): boolean {
      try {
        return translationUtils.hasTranslations();
      } catch {
        return false;
      }
    }

    function checkTranslationCall(node: TSESTree.CallExpression) {
      // Check t() function calls
      if (
        node.callee.type === "Identifier" &&
        node.callee.name === "t" &&
        node.arguments.length > 0 &&
        node.arguments[0].type === "Literal" &&
        typeof node.arguments[0].value === "string"
      ) {
        const key = node.arguments[0].value;

        if (!isValidTranslationKey(key)) {
          context.report({
            node: node.arguments[0],
            messageId: "invalidTranslationKey",
            data: { key },
          });
          return;
        }

        // If we can't load translations, skip the check
        // This prevents the rule from breaking when translations aren't available
        if (!translationsAvailable()) {
          return;
        }

        try {
          const namespace = translationUtils.extractNamespace(key);
          const baseKey = translationUtils.getBaseKey(key);
          const hasKey = translationUtils.hasTranslationKey(
            defaultLocale,
            namespace ? baseKey : key,
            namespace || undefined
          );

          if (!hasKey) {
            context.report({
              node: node.arguments[0],
              messageId: "missingTranslationKey",
              data: { key },
            });
          }
        } catch {
          // Skip if we can't load translations
        }
      }
    }

    function checkUseTranslationsCall(node: TSESTree.CallExpression) {
      // Check useTranslations() calls
      if (
        node.callee.type === "Identifier" &&
        node.callee.name === "useTranslations" &&
        node.arguments.length > 0 &&
        node.arguments[0].type === "Literal" &&
        typeof node.arguments[0].value === "string"
      ) {
        const namespace = node.arguments[0].value;

        if (!translationsAvailable()) {
          return;
        }

        try {
          const namespaces = translationUtils.getNamespaces(defaultLocale);
          if (!namespaces.includes(namespace)) {
            context.report({
              node: node.arguments[0],
              messageId: "missingTranslationKey",
              data: { key: namespace },
            });
          }
        } catch {
          // Skip if we can't load translations
        }
      }
    }

    return {
      CallExpression(node) {
        checkTranslationCall(node);
        checkUseTranslationsCall(node);
      },
    };
  },
});
