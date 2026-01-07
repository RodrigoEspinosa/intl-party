import path from "path";
import { ESLintUtils } from "@typescript-eslint/utils";
import { noHardcodedStrings } from "./no-hardcoded-strings";

const ruleTester = new ESLintUtils.RuleTester({
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
    {
      code: `function Component() { return <a href="https://example.com">Link</a>; }`,
    },
    { code: `function Component() { return <div>CONSTANT_VALUE</div>; }` },
    {
      code: `function Component() { return <div style={{ width: '100px' }}>Content</div>; }`,
    },
    { code: `function Component() { return <div>div</div>; }` },
    {
      code: `function Component() { return <div>Allowed String</div>; }`,
      options: [{ allowedStrings: ["Allowed String"] }],
    },
    {
      code: `function Component() { return <div>IGNORE-123</div>; }`,
      options: [{ ignorePattern: "^IGNORE-\\d+$" }],
    },
    {
      code: `function Component() { return <div className="some-class">Content</div>; }`,
    },
  ],
  invalid: [
    {
      code: `function Component() { return <div>Hello world</div>; }`,
      errors: [{ messageId: "hardcodedString" }],
      output: `function Component() { return <div>{t('hello_world')}</div>; }`,
    },
    {
      code: `function Component() { return <input placeholder="Enter your name" />; }`,
      errors: [{ messageId: "hardcodedStringInAttribute" }],
      output: `function Component() { return <input placeholder={t('enter_your_name')} />; }`,
    },
    {
      code: `function Component() { return <div data-tooltip="Click me">Content</div>; }`,
      options: [{ attributes: ["data-tooltip"] }],
      errors: [{ messageId: "hardcodedStringInAttribute" }],
      output: `function Component() { return <div data-tooltip={t('click_me')}>Content</div>; }`,
    },
    {
      code: `
        function Component() {
          return (
            <div>
              <h1>Welcome to our app</h1>
              <p>This is a description</p>
              <button aria-label="Close dialog">Close</button>
            </div>
          );
        }
      `,
      errors: [
        { messageId: "hardcodedString" },
        { messageId: "hardcodedString" },
        { messageId: "hardcodedStringInAttribute" },
        { messageId: "hardcodedString" },
      ],
    },
    {
      code: `function Component() { return <div>Hi</div>; }`,
      options: [{ minLength: 2 }],
      errors: [{ messageId: "hardcodedString" }],
      output: `function Component() { return <div>{t('hi')}</div>; }`,
    },
  ],
});
