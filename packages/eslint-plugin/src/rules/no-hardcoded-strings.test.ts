import { RuleTester } from "@typescript-eslint/rule-tester";
import { noHardcodedStrings } from "./no-hardcoded-strings";

const ruleTester = new RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
});

ruleTester.run("no-hardcoded-strings", noHardcodedStrings, {
  valid: [
    { code: `function Component() { return <div>{t('greeting')}</div>; }` },
    { code: `function Component() { return <div>Hi</div>; }` },
    { code: `function Component() { return <div>CONSTANT_VALUE</div>; }` },
    { code: `function Component() { return <div>div</div>; }` },
    {
      code: `function Component() { return <div>Allowed String</div>; }`,
      options: [{ allowedStrings: ["Allowed String"] }],
    },
    {
      code: `function Component() { return <div>IGNORE-123</div>; }`,
      options: [{ ignorePattern: "^IGNORE-\\d+$" }],
    },
  ],
  invalid: [
    {
      // Fixes are offered as suggestions (opt-in), not applied by `eslint --fix`
      code: `function Component() { return <div>Hello world</div>; }`,
      errors: [
        {
          messageId: "hardcodedString",
          suggestions: [
            {
              messageId: "replaceWithTranslation",
              output: `function Component() { return <div>{t('hello_world')}</div>; }`,
            },
          ],
        },
      ],
    },
    {
      code: `function Component() { return <input placeholder="Enter your name" />; }`,
      errors: [
        {
          messageId: "hardcodedStringInAttribute",
          suggestions: [
            {
              messageId: "replaceWithTranslation",
              output: `function Component() { return <input placeholder={t('enter_your_name')} />; }`,
            },
          ],
        },
      ],
    },
    {
      code: `function Component() { return <div>Hi</div>; }`,
      options: [{ minLength: 2 }],
      errors: [
        {
          messageId: "hardcodedString",
          suggestions: [
            {
              messageId: "replaceWithTranslation",
              output: `function Component() { return <div>{t('hi')}</div>; }`,
            },
          ],
        },
      ],
    },
    {
      // Non-Latin text strips to a placeholder key rather than t('')
      code: `function Component() { return <div>こんにちは世界</div>; }`,
      errors: [
        {
          messageId: "hardcodedString",
          suggestions: [
            {
              messageId: "replaceWithTranslation",
              output: `function Component() { return <div>{t('translation_key')}</div>; }`,
            },
          ],
        },
      ],
    },
  ],
});
