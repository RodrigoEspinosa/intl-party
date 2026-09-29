import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { TranslatorBindings } from "../utils/translator-bindings";

type MessageIds =
  | "preferUseTranslations"
  | "replaceWithHook"
  | "preferScopedTranslations";

export interface PreferTranslationHooksOptions {
  allowDirectUsage?: boolean;
}

export const preferTranslationHooks = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/RodrigoEspinosa/intl-party/blob/main/packages/eslint-plugin/docs/rules/${name}.md`,
)<[PreferTranslationHooksOptions], MessageIds>({
  name: "prefer-translation-hooks",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer using translation hooks over direct i18n instance usage in React components",
    },
    // A suggestion, not an autofix: the rewrite assumes a `t` from
    // useTranslations() is in scope, which `eslint --fix` can't guarantee.
    hasSuggestions: true,
    schema: [
      {
        type: "object",
        properties: {
          allowDirectUsage: {
            type: "boolean",
            default: false,
            description: "Allow direct i18n instance usage",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferUseTranslations:
        "Prefer using useTranslations() hook instead of direct i18n.t() usage",
      replaceWithHook:
        "Replace i18n.t with t (requires `const t = useTranslations()` in scope)",
      preferScopedTranslations:
        'Consider using scoped translations for namespace "{{namespace}}"',
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const { allowDirectUsage = false } = options || {};

    // Scoped translations only pay off when a namespace is repeated;
    // a single t('ns.key') call is idiomatic and should not be flagged.
    const SCOPED_TRANSLATIONS_THRESHOLD = 3;
    const namespaceUsage = new Map<string, TSESTree.CallExpression[]>();
    const bindings = new TranslatorBindings();

    function checkMemberExpression(node: TSESTree.MemberExpression) {
      // Check for i18n.t() usage
      if (
        node.object.type === "Identifier" &&
        node.object.name === "i18n" &&
        node.property.type === "Identifier" &&
        node.property.name === "t" &&
        !allowDirectUsage
      ) {
        context.report({
          node,
          messageId: "preferUseTranslations",
          suggest: [
            {
              messageId: "replaceWithHook",
              fix: (fixer) => fixer.replaceText(node, "t"),
            },
          ],
        });
      }
    }

    function checkCallExpression(node: TSESTree.CallExpression) {
      // Check for repeated namespace usage that could benefit from scoped translations
      if (
        node.callee.type === "Identifier" &&
        node.callee.name === "t" &&
        // Already scoped (e.g. useTranslations("common")): a dotted key is a
        // nested key inside that namespace, not a namespace prefix.
        bindings.namespaceOf(node.callee.name) === null &&
        node.arguments.length > 0 &&
        node.arguments[0].type === "Literal" &&
        typeof node.arguments[0].value === "string"
      ) {
        const key = node.arguments[0].value;
        const namespacedKey = key.split(".");

        if (namespacedKey.length > 1) {
          const namespace = namespacedKey[0];
          const calls = namespaceUsage.get(namespace) ?? [];
          calls.push(node);
          namespaceUsage.set(namespace, calls);
        }
      }
    }

    return {
      VariableDeclarator(node) {
        bindings.record(node);
      },
      MemberExpression: checkMemberExpression,
      CallExpression: checkCallExpression,
      "Program:exit"() {
        for (const [namespace, calls] of namespaceUsage) {
          if (calls.length >= SCOPED_TRANSLATIONS_THRESHOLD) {
            // Report once per namespace, on the first usage
            context.report({
              node: calls[0],
              messageId: "preferScopedTranslations",
              data: { namespace },
            });
          }
        }
      },
    };
  },
});
