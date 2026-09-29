import { RuleTester } from "@typescript-eslint/rule-tester";
import tsParser from "@typescript-eslint/parser";
import { preferTranslationHooks } from "./prefer-translation-hooks";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run("prefer-translation-hooks", preferTranslationHooks, {
  valid: [
    // A single namespaced call is idiomatic and must not be flagged
    { code: `t('common.greeting');` },
    // Two usages of the same namespace stay below the threshold
    { code: `t('common.greeting'); t('common.farewell');` },
    // Three usages across different namespaces
    { code: `t('common.a'); t('nav.b'); t('auth.c');` },
    // Nested keys on a scoped translator aren't namespace prefixes
    {
      code: `const t = useTranslations('common'); t('nav.a'); t('nav.b'); t('nav.c');`,
    },
    // Un-namespaced keys are never flagged
    { code: `t('greeting'); t('farewell'); t('welcome');` },
    // Direct i18n.t is allowed when configured
    {
      code: `i18n.t('greeting');`,
      options: [{ allowDirectUsage: true }],
    },
  ],
  invalid: [
    {
      // Three calls sharing a namespace: one report, on the first call
      code: `t('common.a'); t('common.b'); t('common.c');`,
      errors: [{ messageId: "preferScopedTranslations" }],
    },
    {
      // Offered as a suggestion; `eslint --fix` leaves the code unchanged
      code: `i18n.t('greeting');`,
      errors: [
        {
          messageId: "preferUseTranslations",
          suggestions: [
            { messageId: "replaceWithHook", output: `t('greeting');` },
          ],
        },
      ],
    },
  ],
});
