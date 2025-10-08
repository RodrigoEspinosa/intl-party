import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

type MessageIds = "missingTranslationKey" | "invalidTranslationKey";

export interface NoMissingKeysOptions {
  translationFiles?: string[];
  defaultLocale?: string;
}

export const noMissingKeys = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/intl-party/intl-party/blob/main/packages/eslint-plugin/docs/rules/${name}.md`,
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
    const { translationFiles = [], defaultLocale = "en" } = options || {};

    // In a real implementation, we would load and cache translation files
    // For now, this is a placeholder structure
    const translationKeys = new Set<string>();

    function isValidTranslationKey(key: string): boolean {
      // Check if key follows valid format (e.g., namespace.key or just key)
      return /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(key);
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

        // In a real implementation, check against loaded translation files
        // For now, we'll skip the missing key check as it requires file system access
        // which should be done during plugin initialization
      }
    }

    function checkUseTranslationsCall(node: TSESTree.CallExpression) {
      // Check useTranslations() calls and subsequent usage
      if (
        node.callee.type === "Identifier" &&
        node.callee.name === "useTranslations"
      ) {
        // This would require more complex analysis to track the returned function
        // and its usage throughout the component
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
