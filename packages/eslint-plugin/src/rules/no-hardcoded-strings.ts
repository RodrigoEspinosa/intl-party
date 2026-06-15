import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";

type MessageIds =
  | "hardcodedString"
  | "hardcodedStringInAttribute"
  | "replaceWithTranslation";

export interface NoHardcodedStringsOptions {
  attributes?: string[];
  ignorePattern?: string;
  minLength?: number;
  allowedStrings?: string[];
}

export const noHardcodedStrings = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/RodrigoEspinosa/intl-party/blob/main/packages/eslint-plugin/docs/rules/${name}.md`,
)<[NoHardcodedStringsOptions], MessageIds>({
  name: "no-hardcoded-strings",
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hardcoded strings in JSX elements and specific attributes",
      recommended: "recommended",
    },
    // Offered as a suggestion (opt-in) rather than an autofix: the rewrite
    // introduces a t() call that may not be in scope and a key that doesn't
    // exist yet, so applying it blindly via `eslint --fix` would break code.
    hasSuggestions: true,
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
      replaceWithTranslation: "Replace with t('{{key}}')",
    },
  },
  defaultOptions: [{}],
  create(context, [options]) {
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
    } = options || {};

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
        const literalValue = node.value.value as string;
        const key = generateTranslationKey(literalValue);
        context.report({
          node: node.value,
          messageId: "hardcodedStringInAttribute",
          data: {
            text: literalValue,
            attribute: node.name.name,
          },
          suggest: [
            {
              messageId: "replaceWithTranslation",
              data: { key },
              fix: (fixer) =>
                fixer.replaceText(node.value!, `{t('${key}')}`),
            },
          ],
        });
      }
    }

    function checkJSXText(node: TSESTree.JSXText) {
      const text = node.value.trim();
      if (text && isHardcodedString(text)) {
        const key = generateTranslationKey(text);
        context.report({
          node,
          messageId: "hardcodedString",
          data: { text },
          suggest: [
            {
              messageId: "replaceWithTranslation",
              data: { key },
              fix: (fixer) => fixer.replaceText(node, `{t('${key}')}`),
            },
          ],
        });
      }
    }

    function generateTranslationKey(text: string): string {
      const key = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 50);
      // Non-Latin source text strips to empty; fall back to a placeholder so
      // the suggestion never produces t('').
      return key || "translation_key";
    }

    return {
      JSXAttribute: checkJSXAttribute,
      JSXText: checkJSXText,
    };
  },
});
