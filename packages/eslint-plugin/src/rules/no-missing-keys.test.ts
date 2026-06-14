import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";
import { RuleTester } from "@typescript-eslint/rule-tester";
import { noMissingKeys } from "./no-missing-keys";

const ruleTester = new RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
});

// The rule loads translations from disk relative to cwd, so run the tests
// against a temp directory with a `locales/<locale>/<namespace>.json` layout.
let tmpDir: string;
let previousCwd: string;

beforeAll(() => {
  previousCwd = process.cwd();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "intl-party-eslint-"));
  const localeDir = path.join(tmpDir, "locales", "en");
  fs.mkdirSync(localeDir, { recursive: true });
  fs.writeFileSync(
    path.join(localeDir, "common.json"),
    JSON.stringify({ greeting: "Hello", nav: { home: "Home" } }),
  );
  process.chdir(tmpDir);
});

afterAll(() => {
  process.chdir(previousCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

ruleTester.run("no-missing-keys", noMissingKeys, {
  valid: [
    // Key exists in the common namespace
    { code: `t('common.greeting');` },
    { code: `t('common.nav.home');` },
    // Existing namespace passed to useTranslations
    { code: `useTranslations('common');` },
    // Dynamic keys are not checked
    { code: `t(key);` },
    // Non-t calls are ignored
    { code: `parseInt('10');` },
  ],
  invalid: [
    {
      code: `t('common.missing');`,
      errors: [{ messageId: "missingTranslationKey" }],
    },
    {
      code: `useTranslations('nonexistent');`,
      errors: [{ messageId: "missingTranslationKey" }],
    },
    {
      code: `t('0invalid key');`,
      errors: [{ messageId: "invalidTranslationKey" }],
    },
  ],
});
