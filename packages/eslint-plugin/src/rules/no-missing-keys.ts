import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { TranslatorBindings } from "../utils/translator-bindings";
import { TranslationUtils } from "../utils/translation-utils";

type MessageIds = "missingTranslationKey" | "invalidTranslationKey";

export interface NoMissingKeysOptions {
  translationFiles?: string[];
  defaultLocale?: string;
  configPath?: string;
}

export const noMissingKeys = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/RodrigoEspinosa/intl-party/blob/main/packages/eslint-plugin/docs/rules/${name}.md`,
)<[NoMissingKeysOptions], MessageIds>({
  name: "no-missing-keys",
  meta: {
    type: "problem",
    docs: {
      description: "Ensure all translation keys exist in translation files",
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

    const bindings = new TranslatorBindings();

    // A key exists if it's in the translator's namespace; for an unscoped
    // translator, if it's a full path in any namespace or `namespace.rest`.
    function keyExists(key: string, namespace: string | null): boolean {
      if (namespace) {
        return translationUtils.hasTranslationKey(
          defaultLocale,
          key,
          namespace,
        );
      }
      if (translationUtils.hasTranslationKey(defaultLocale, key)) return true;
      const prefix = translationUtils.extractNamespace(key);
      return (
        prefix !== null &&
        translationUtils.getNamespaces(defaultLocale).includes(prefix) &&
        translationUtils.hasTranslationKey(
          defaultLocale,
          translationUtils.getBaseKey(key),
          prefix,
        )
      );
    }

    function checkTranslationCall(node: TSESTree.CallExpression) {
      // Check t() calls and translators bound from translation hooks
      if (
        node.callee.type === "Identifier" &&
        (node.callee.name === "t" || bindings.isTranslator(node.callee.name)) &&
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
          if (!keyExists(key, bindings.namespaceOf(node.callee.name))) {
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
      VariableDeclarator(node) {
        bindings.record(node);
      },
      CallExpression(node) {
        checkTranslationCall(node);
        checkUseTranslationsCall(node);
      },
    };
  },
});
