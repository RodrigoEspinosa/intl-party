import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { TranslationUtils } from "../utils/translation-utils";

type MessageIds = "missingTranslationKey" | "invalidTranslationKey";

export interface NoMissingKeysOptions {
  translationFiles?: string[];
  defaultLocale?: string;
  configPath?: string;
  cacheTimeout?: number;
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
          cacheTimeout: {
            type: "number",
            default: 300000,
            description: "Cache timeout in milliseconds (default: 5 minutes)",
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
      cacheTimeout = 300000,
    } = options || {};

    // Initialize translation utilities
    const translationUtils = new TranslationUtils({
      translationFiles,
      defaultLocale,
      configPath,
      cacheTimeout,
    });

    // Cache for translation keys per file
    const fileTranslationCache = new Map<
      string,
      {
        keys: Set<string>;
        timestamp: number;
      }
    >();

    function isValidTranslationKey(key: string): boolean {
      return translationUtils.isValidTranslationKey(key);
    }

    async function checkTranslationCall(node: TSESTree.CallExpression) {
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

        // Check if key exists in translation files
        try {
          const namespace = translationUtils.extractNamespace(key);
          const baseKey = translationUtils.getBaseKey(key);
          const hasKey = await translationUtils.hasTranslationKey(
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
        } catch (error) {
          // If we can't load translations, skip the check
          // This prevents the rule from breaking when translations aren't available
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

        // Validate namespace exists
        translationUtils
          .getNamespaces(defaultLocale)
          .then((namespaces) => {
            if (!namespaces.includes(namespace)) {
              context.report({
                node: node.arguments[0],
                messageId: "missingTranslationKey",
                data: { key: namespace },
              });
            }
          })
          .catch(() => {
            // Skip if we can't load translations
          });
      }
    }

    function checkTemplateLiteral(node: TSESTree.TemplateLiteral) {
      // Check template literals that might contain translation keys
      // This is a basic implementation - could be enhanced to detect dynamic keys
      for (const quasi of node.quasis) {
        const text = quasi.value.raw;

        // Look for patterns that might be translation keys
        const keyMatches = text.match(/[a-zA-Z][a-zA-Z0-9._-]*/g);

        if (keyMatches) {
          for (const potentialKey of keyMatches) {
            if (isValidTranslationKey(potentialKey)) {
              translationUtils
                .hasTranslationKey(defaultLocale, potentialKey)
                .then((hasKey) => {
                  if (!hasKey) {
                    context.report({
                      node: quasi,
                      messageId: "missingTranslationKey",
                      data: { key: potentialKey },
                    });
                  }
                })
                .catch(() => {
                  // Skip if we can't load translations
                });
            }
          }
        }
      }
    }

    return {
      CallExpression(node) {
        checkTranslationCall(node);
        checkUseTranslationsCall(node);
      },
      TemplateLiteral(node) {
        checkTemplateLiteral(node);
      },
    };
  },
});
