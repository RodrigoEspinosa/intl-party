import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

type MessageIds = "preferUseTranslations" | "preferScopedTranslations";

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
      recommended: "recommended",
    },
    fixable: "code",
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
      preferScopedTranslations:
        'Consider using scoped translations for namespace "{{namespace}}"',
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const { allowDirectUsage = false } = options || {};

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
          fix(fixer) {
            // Simple fix - replace i18n.t with t (assuming useTranslations hook is available)
            return fixer.replaceText(node, "t");
          },
        });
      }
    }

    function checkCallExpression(node: TSESTree.CallExpression) {
      // Check for repeated namespace usage that could benefit from scoped translations
      if (
        node.callee.type === "Identifier" &&
        node.callee.name === "t" &&
        node.arguments.length > 0 &&
        node.arguments[0].type === "Literal" &&
        typeof node.arguments[0].value === "string"
      ) {
        const key = node.arguments[0].value;
        const namespacedKey = key.split(".");

        if (namespacedKey.length > 1) {
          const namespace = namespacedKey[0];

          // This would require tracking usage across the component to determine
          // if scoped translations would be beneficial
          // For now, we'll provide a simple suggestion
          context.report({
            node,
            messageId: "preferScopedTranslations",
            data: { namespace },
          });
        }
      }
    }

    return {
      MemberExpression: checkMemberExpression,
      CallExpression: checkCallExpression,
    };
  },
});
