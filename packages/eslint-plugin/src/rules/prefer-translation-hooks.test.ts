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
      code: `i18n.t('greeting');`,
      errors: [{ messageId: "preferUseTranslations" }],
      output: `t('greeting');`,
    },
  ],
});
