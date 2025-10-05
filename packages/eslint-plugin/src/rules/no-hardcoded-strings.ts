import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

type MessageIds = "hardcodedString" | "hardcodedStringInAttribute";

export const noHardcodedStrings = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/intl-party/intl-party/blob/main/packages/eslint-plugin/docs/rules/${name}.md`,
)<[], MessageIds>({
  name: "no-hardcoded-strings",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hardcoded strings in JSX elements and specific attributes",
      recommended: "warn",
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          attributes: {
            type: "array",
            items: { type: "string" },
            default: [
              "placeholder",
              "title",
              "aria-label",
              "aria-description",
              "alt",
            ],
          },
          ignorePattern: {
            type: "string",
            description: "Regex pattern for strings to ignore",
          },
          minLength: {
            type: "number",
            default: 3,
            description: "Minimum string length to check",
          },
          allowedStrings: {
            type: "array",
            items: { type: "string" },
            default: [],
            description: "Array of specific strings that are allowed",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hardcodedString:
        'Hardcoded string "{{text}}" should be translated using t() function',
      hardcodedStringInAttribute:
        'Hardcoded string "{{text}}" in {{attribute}} attribute should be translated using t() function',
    },
  },
  defaultOptions: [{}],
  create(context, [options = {}]) {
    const {
      attributes = [
        "placeholder",
        "title",
        "aria-label",
        "aria-description",
        "alt",
      ],
      ignorePattern,
      minLength = 3,
      allowedStrings = [],
    } = options;

    const ignoreRegex = ignorePattern ? new RegExp(ignorePattern) : null;

    function isHardcodedString(value: string): boolean {
      // Skip if too short
      if (value.length < minLength) return false;

      // Skip if explicitly allowed
      if (allowedStrings.includes(value)) return false;

      // Skip if matches ignore pattern
      if (ignoreRegex && ignoreRegex.test(value)) return false;

      // Skip if it looks like a URL, class name, or technical identifier
      if (/^(https?:\/\/|\/|\.\/|\.\.\/)/.test(value)) return false;
      if (/^[a-z-]+$/.test(value) && value.includes("-")) return false; // CSS classes
      if (/^[A-Z_][A-Z0-9_]*$/.test(value)) return false; // Constants
      if (/^\d+(\.\d+)?(px|em|rem|%|vh|vw)$/.test(value)) return false; // CSS units

      // Skip single words that are likely technical
      const technicalWords = [
        "div",
        "span",
        "button",
        "input",
        "form",
        "header",
        "footer",
        "nav",
        "main",
        "section",
        "article",
      ];
      if (technicalWords.includes(value.toLowerCase())) return false;

      return true;
    }

    function checkJSXAttribute(node: TSESTree.JSXAttribute) {
      if (
        node.name.type === "JSXIdentifier" &&
        attributes.includes(node.name.name) &&
        node.value?.type === "Literal" &&
        typeof node.value.value === "string" &&
        isHardcodedString(node.value.value)
      ) {
        context.report({
          node: node.value,
          messageId: "hardcodedStringInAttribute",
          data: {
            text: node.value.value,
            attribute: node.name.name,
          },
          fix(fixer) {
            return fixer.replaceText(
              node.value!,
              `{t('${generateTranslationKey(node.value!.value as string)}')}`,
            );
          },
        });
      }
    }

    function checkJSXText(node: TSESTree.JSXText) {
      const text = node.value.trim();
      if (text && isHardcodedString(text)) {
        context.report({
          node,
          messageId: "hardcodedString",
          data: { text },
          fix(fixer) {
            return fixer.replaceText(
              node,
              `{t('${generateTranslationKey(text)}')}`,
            );
          },
        });
      }
    }

    function generateTranslationKey(text: string): string {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 50);
    }

    return {
      JSXAttribute: checkJSXAttribute,
      JSXText: checkJSXText,
    };
  },
});
