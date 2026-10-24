/**
 * Runs the built plugin (dist/) through Oxlint's JS plugin support and through
 * ESLint on the same files, and checks they report the same thing. Oxlint's JS
 * plugin API is alpha, so the tested version is pinned in package.json; rerun
 * this after upgrading it before changing the documented support.
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

const packageDir = resolve(__dirname, "..");
const pluginPath = join(packageDir, "dist/index.js");
const bin = (name: string) => join(packageDir, "node_modules/.bin", name);

type RuleConfig = Record<string, unknown>;
type Files = Record<string, string>;

interface Report {
  line: number;
  column: number;
  rule: string;
  severity: "warn" | "error";
  message: string;
}

beforeAll(() => {
  if (!existsSync(pluginPath)) {
    throw new Error(
      "Build the plugin first: pnpm --filter @intl-party/eslint-plugin build",
    );
  }
});

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true });
});

function project(files: Files, rules: RuleConfig): string {
  const dir = mkdtempSync(join(tmpdir(), "intl-party-oxlint-"));
  dirs.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), content);
  }
  writeFileSync(
    join(dir, ".oxlintrc.json"),
    JSON.stringify({
      plugins: [],
      categories: { correctness: "off" },
      jsPlugins: [{ name: "@intl-party", specifier: pluginPath }],
      rules,
    }),
  );
  writeFileSync(
    join(dir, "eslint.config.cjs"),
    `const parser = require(${JSON.stringify(require.resolve("@typescript-eslint/parser"))});
module.exports = [{
  files: ["**/*.tsx"],
  languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
  plugins: { "@intl-party": require(${JSON.stringify(pluginPath)}) },
  rules: ${JSON.stringify(rules)},
}];`,
  );
  return dir;
}

/** Runs a linter CLI; both exit non-zero when they report errors. */
function run(cmd: string, args: string[], cwd: string): string {
  try {
    return execFileSync(cmd, args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const { stdout, stderr } = error as { stdout: string; stderr: string };
    if (!stdout) throw new Error(`${cmd} failed: ${stderr}`, { cause: error });
    return stdout;
  }
}

const byPosition = (a: Report, b: Report) =>
  a.line - b.line || a.column - b.column || a.rule.localeCompare(b.rule);

function oxlint(dir: string, file = "src"): Report[] {
  const { diagnostics } = JSON.parse(
    run(bin("oxlint"), ["-f", "json", file], dir),
  ) as {
    diagnostics: Array<{
      code: string;
      severity: string;
      message: string;
      labels: Array<{ span: { line: number; column: number } }>;
    }>;
  };
  return diagnostics
    .map((d) => ({
      line: d.labels[0].span.line,
      column: d.labels[0].span.column,
      // "@intl-party(no-missing-keys)" -> "@intl-party/no-missing-keys"
      rule: d.code.replace(/\((.*)\)$/, "/$1"),
      severity: (d.severity === "error"
        ? "error"
        : "warn") as Report["severity"],
      message: d.message,
    }))
    .sort(byPosition);
}

interface ESLintMessage {
  line: number;
  column: number;
  ruleId: string;
  severity: number;
  message: string;
  suggestions: Array<{ fix: { range: [number, number]; text: string } }>;
}

function eslintMessages(
  dir: string,
): Array<{ filePath: string; messages: ESLintMessage[] }> {
  return JSON.parse(
    run(bin("eslint"), ["-f", "json", "--no-warn-ignored", "src"], dir),
  );
}

function eslint(dir: string): Report[] {
  return eslintMessages(dir)
    .flatMap((result) => result.messages)
    .map((m) => ({
      line: m.line,
      column: m.column,
      rule: m.ruleId,
      severity: (m.severity === 2 ? "error" : "warn") as Report["severity"],
      message: m.message,
    }))
    .sort(byPosition);
}

function expectParity(files: Files, rules: RuleConfig): Report[] {
  const dir = project(files, rules);
  const reports = eslint(dir);
  expect(oxlint(dir)).toEqual(reports);
  return reports;
}

const messages = {
  "messages/en/common.json": JSON.stringify({
    welcome: "Welcome",
    navigation: { home: "Home" },
  }),
  "messages/en/auth.json": JSON.stringify({ login: "Log in" }),
};

// Each test spawns oxlint. The first run in a job loads the JS plugin cold,
// which took over 5s on a GitHub runner.
describe("Oxlint parity", { timeout: 30_000 }, () => {
  describe("no-hardcoded-strings", () => {
    const source = `export const App = () => (
  <div className="flex-row" title="Click to open">
    <h1>Welcome to our app</h1>
    <input placeholder="Type your name" aria-label="Name" />
    <label>Your name</label>
    <a href="https://example.com">https://example.com</a>
    <span>OK</span>
    <span>API_KEY</span>
    <span>Allowed text</span>
    <span>123456</span>
  </div>
);`;

    it("reports JSX text and attributes with default options", () => {
      const reports = expectParity(
        { "src/App.tsx": source },
        { "@intl-party/no-hardcoded-strings": "warn" },
      );
      expect(reports.map((r) => r.line)).toEqual([2, 3, 4, 4, 5, 9, 10]);
    });

    it("applies rule options", () => {
      const reports = expectParity(
        { "src/App.tsx": source },
        {
          "@intl-party/no-hardcoded-strings": [
            "error",
            {
              attributes: ["aria-label"],
              minLength: 2,
              ignorePattern: "^\\d+$",
              allowedStrings: ["Allowed text"],
            },
          ],
        },
      );
      // Not "title"/"placeholder"; "OK" is CONSTANT_CASE, so still skipped.
      expect(reports.map((r) => r.line)).toEqual([3, 4, 5]);
    });
  });

  describe("no-missing-keys", () => {
    const source = `export function App() {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const tAny = useTranslations();
  return [
    t("welcome"),
    t("navigation.home"),
    t("doesNotExist"),
    tAuth("login"),
    tAuth("logout"),
    tAny("auth.login"),
    tAny("auth.nope"),
  ];
}

function Other() {
  const t = useTranslations("nope");
  return null;
}`;

    it("checks keys against an auto-detected messages directory", () => {
      const reports = expectParity(
        { ...messages, "src/App.tsx": source },
        { "@intl-party/no-missing-keys": "error" },
      );
      expect(reports.map((r) => r.message)).toEqual([
        'Translation key "doesNotExist" is missing from translation files',
        'Translation key "logout" is missing from translation files',
        'Translation key "auth.nope" is missing from translation files',
        'Translation key "nope" is missing from translation files',
      ]);
    });

    it("loads messages from intl-party.config.json", () => {
      const reports = expectParity(
        {
          "intl-party.config.json": JSON.stringify({
            locales: ["en"],
            defaultLocale: "en",
            messages: "./translations",
          }),
          "translations/en/common.json": JSON.stringify({ hello: "Hi" }),
          "src/App.tsx": `export const App = () => {
  const t = useTranslations("common");
  return [t("hello"), t("gone")];
};`,
        },
        { "@intl-party/no-missing-keys": "error" },
      );
      expect(reports.map((r) => r.message)).toEqual([
        'Translation key "gone" is missing from translation files',
      ]);
    });

    it("loads messages from the translationFiles option", () => {
      const reports = expectParity(
        {
          "i18n-src/en/common.json": JSON.stringify({ hello: "Hi" }),
          "src/App.tsx": `export const App = () => {
  const t = useTranslations("common");
  return [t("hello"), t("gone")];
};`,
        },
        {
          "@intl-party/no-missing-keys": [
            "error",
            { translationFiles: ["i18n-src/en/common.json"] },
          ],
        },
      );
      expect(reports.map((r) => r.message)).toEqual([
        'Translation key "gone" is missing from translation files',
      ]);
    });

    it("sees translation file edits on the next run", () => {
      const files = {
        ...messages,
        "src/App.tsx": `export const App = () => {
  const t = useTranslations("common");
  return t("added");
};`,
      };
      const rules = { "@intl-party/no-missing-keys": "error" };
      const dir = project(files, rules);
      expect(oxlint(dir)).toHaveLength(1);

      writeFileSync(
        join(dir, "messages/en/common.json"),
        JSON.stringify({ added: "Added" }),
      );
      expect(oxlint(dir)).toEqual([]);
      expect(eslint(dir)).toEqual([]);
    });
  });

  describe("prefer-translation-hooks", () => {
    const source = `export function App({ i18n }) {
  return [i18n.t("welcome"), t("nav.a"), t("nav.b"), t("nav.c"), t("other.a")];
}`;

    it("reports i18n.t and repeated namespace prefixes", () => {
      const reports = expectParity(
        { "src/App.tsx": source },
        { "@intl-party/prefer-translation-hooks": "warn" },
      );
      expect(reports.map((r) => r.message)).toEqual([
        "Prefer using useTranslations() hook instead of direct i18n.t() usage",
        'Consider using scoped translations for namespace "nav"',
      ]);
    });

    it("applies allowDirectUsage", () => {
      const reports = expectParity(
        { "src/App.tsx": source },
        {
          "@intl-party/prefer-translation-hooks": [
            "warn",
            { allowDirectUsage: true },
          ],
        },
      );
      expect(reports.map((r) => r.message)).toEqual([
        'Consider using scoped translations for namespace "nav"',
      ]);
    });
  });

  describe("fixes and suggestions", () => {
    const source = `export function App({ i18n }) {
  return <p title="Open the menu">Hello there {i18n.t("x")}</p>;
}`;
    const rules = {
      "@intl-party/no-hardcoded-strings": "warn",
      "@intl-party/prefer-translation-hooks": "warn",
    };

    it("--fix changes nothing, as with eslint --fix", () => {
      const dir = project({ "src/App.tsx": source }, rules);
      run(bin("oxlint"), ["--fix", "src"], dir);
      run(bin("eslint"), ["--fix", "src"], dir);
      expect(readFileSync(join(dir, "src/App.tsx"), "utf8")).toBe(source);
    });

    it("--fix-suggestions applies the same edits as ESLint's suggestions", () => {
      const dir = project({ "src/App.tsx": source }, rules);

      // Apply each ESLint report's first suggestion, last edit first.
      const edits = eslintMessages(dir)[0]
        .messages.map((m) => m.suggestions[0].fix)
        .sort((a, b) => b.range[0] - a.range[0]);
      const expected = edits.reduce(
        (text, { range: [start, end], text: replacement }) =>
          text.slice(0, start) + replacement + text.slice(end),
        source,
      );
      expect(edits).toHaveLength(3);

      run(bin("oxlint"), ["--fix-suggestions", "src"], dir);
      expect(readFileSync(join(dir, "src/App.tsx"), "utf8")).toBe(expected);
    });
  });

  it("honors oxlint-disable and eslint-disable comments", () => {
    const dir = project(
      {
        "src/App.tsx": `export const App = () => (
  <div>
    {/* oxlint-disable-next-line @intl-party/no-hardcoded-strings */}
    <p>Disabled by an oxlint comment</p>
    {/* eslint-disable-next-line @intl-party/no-hardcoded-strings */}
    <p>Disabled by an eslint comment</p>
    <p>Still reported here</p>
  </div>
);`,
      },
      { "@intl-party/no-hardcoded-strings": "warn" },
    );
    expect(oxlint(dir).map((r) => r.line)).toEqual([7]);
  });
});
