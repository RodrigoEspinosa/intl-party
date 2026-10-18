import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const packageDir = resolve(__dirname, "..");
const biomeBin = join(
  dirname(createRequire(__filename).resolve("@biomejs/biome/package.json")),
  "bin/biome",
);

interface Diagnostic {
  category: string;
  message: string;
  location: {
    path: string;
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true });
});

/**
 * Lints `source` with only the given plugin enabled and returns the trimmed
 * source text each plugin diagnostic points at.
 */
function lint(
  plugin: string,
  source: string,
  filename = "App.tsx",
  includes?: string[],
) {
  const dir = mkdtempSync(join(tmpdir(), "intl-party-biome-"));
  dirs.push(dir);
  const path = join(packageDir, plugin);
  writeFileSync(
    join(dir, "biome.json"),
    JSON.stringify({
      plugins: [includes ? { path, includes } : path],
      linter: { rules: { recommended: false } },
    }),
  );
  mkdirSync(dirname(join(dir, filename)), { recursive: true });
  writeFileSync(join(dir, filename), source);

  let stdout: string;
  try {
    stdout = execFileSync(biomeBin, ["lint", "--reporter=json", filename], {
      cwd: dir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (error) {
    // Biome exits non-zero when it reports errors; the JSON is still on stdout.
    stdout = (error as { stdout: string }).stdout;
  }

  const lines = source.split("\n");
  const diagnostics = (
    JSON.parse(stdout) as { diagnostics: Diagnostic[] }
  ).diagnostics.filter((d) => d.category === "plugin");

  // A plugin that fails to load or run is reported as a plugin diagnostic
  // with no position, rather than as a crash.
  const broken = diagnostics.find((d) => d.location.start.line === 0);
  if (broken) throw new Error(broken.message);

  return diagnostics.map(({ message, location: { start, end } }) => {
    const text =
      start.line === end.line
        ? lines[start.line - 1].slice(start.column - 1, end.column - 1)
        : [
            lines[start.line - 1].slice(start.column - 1),
            ...lines.slice(start.line, end.line - 1),
            lines[end.line - 1].slice(0, end.column - 1),
          ].join("\n");
    return { text: text.trim(), message };
  });
}

describe("no-hardcoded-strings.grit", () => {
  const texts = (source: string) =>
    lint("no-hardcoded-strings.grit", source).map((d) => d.text);

  it("reports JSX text", () => {
    const result = lint(
      "no-hardcoded-strings.grit",
      "export const A = () => <h1>Welcome to our app</h1>;",
    );
    expect(result).toEqual([
      {
        text: "Welcome to our app",
        message:
          "Hardcoded JSX text should be translated with t() (intl-party/no-hardcoded-strings)",
      },
    ]);
  });

  it("reports multi-line JSX text", () => {
    expect(
      texts(`export const A = () => (
  <p>
    Read the docs
    before you start
  </p>
);`),
    ).toEqual(["Read the docs\n    before you start"]);
  });

  it("reports the target attributes", () => {
    const result = lint(
      "no-hardcoded-strings.grit",
      `export const A = () => (
  <>
    <input placeholder="Type your name" />
    <button title='Open the menu' />
    <a aria-label="Go home" aria-description="Back to start" />
    <img alt="Company logo" />
  </>
);`,
    );
    expect(result.map((d) => d.text)).toEqual([
      '"Type your name"',
      "'Open the menu'",
      '"Go home"',
      '"Back to start"',
      '"Company logo"',
    ]);
    expect(result[0].message).toBe(
      "Hardcoded attribute string should be translated with t() (intl-party/no-hardcoded-strings)",
    );
  });

  it("ignores other attributes", () => {
    expect(
      texts(
        `export const A = () => <div className="Some classes here" data-label="Not checked" />;`,
      ),
    ).toEqual([]);
  });

  it("ignores translated expressions", () => {
    expect(
      texts(`export const A = ({ t }) => (
  <p title={t("title")} alt={"Company logo"} placeholder={\`Type here\`}>
    {t("welcome")}
  </p>
);`),
    ).toEqual([]);
  });

  it("ignores technical strings, short text and whitespace", () => {
    expect(
      texts(`export const A = () => (
  <div>
    <a href="https://example.com">https://example.com</a>
    <span title="/path/to/page">./relative</span>
    <span>flex-row</span>
    <span alt="MAX_SIZE">API_KEY</span>
    <span title="12px">50%</span>
    <span>Button</span>
    <span alt="ok">OK</span>
    <span>  </span>
  </div>
);`),
    ).toEqual([]);
  });

  it("matches the whole string, not a substring", () => {
    // Contains a kebab-case word and a URL, but is still a sentence.
    expect(
      texts(
        `export const A = () => <p title="See https://example.com">Use the flex-row class</p>;`,
      ),
    ).toEqual(['"See https://example.com"', "Use the flex-row class"]);
  });

  it("does not check string literals outside JSX", () => {
    expect(texts(`export const message = "Hello there";`)).toEqual([]);
  });
});

describe("prefer-translation-hooks.grit", () => {
  const texts = (source: string, filename?: string) =>
    lint("prefer-translation-hooks.grit", source, filename).map((d) => d.text);

  it("reports direct i18n.t usage", () => {
    const result = lint(
      "prefer-translation-hooks.grit",
      `export const A = ({ i18n }) => <p>{i18n.t("welcome")}</p>;`,
    );
    expect(result).toEqual([
      {
        text: "i18n.t",
        message:
          "Prefer the useTranslations() hook over direct i18n.t() usage (intl-party/prefer-translation-hooks)",
      },
    ]);
  });

  it("reports references and optional calls", () => {
    expect(
      texts(`const translate = i18n.t;
i18n?.t("welcome");`),
    ).toEqual(["i18n.t", "i18n?.t"]);
  });

  it("ignores t() and other objects", () => {
    expect(
      texts(`const t = useTranslations();
t("welcome");
app.i18n.t("welcome");
i18n.translate("welcome");
other.t("welcome");`),
    ).toEqual([]);
  });

  it("checks plain .ts files too, so scope it with includes", () => {
    expect(texts(`i18n.t("welcome");`, "server.ts")).toEqual(["i18n.t"]);
  });
});

describe("README setup", () => {
  // The includes globs from the README. Biome matches plugin includes against
  // absolute paths, so a pattern like "src/**" would silently match nothing.
  const includes = ["**/*.jsx", "**/*.tsx"];
  const source = `export const A = ({ i18n }) => <p>{i18n.t("a")} Hello there</p>;`;

  it("runs the plugins on component files", () => {
    for (const filename of ["src/App.tsx", "src/components/Nav.jsx"]) {
      expect(
        lint("prefer-translation-hooks.grit", source, filename, includes),
      ).toHaveLength(1);
      expect(
        lint("no-hardcoded-strings.grit", source, filename, includes),
      ).toHaveLength(1);
    }
  });

  it("skips other files", () => {
    expect(
      lint(
        "prefer-translation-hooks.grit",
        `i18n.t("a");`,
        "src/server.ts",
        includes,
      ),
    ).toEqual([]);
  });

  it("honors biome-ignore lint/plugin comments", () => {
    expect(
      lint(
        "no-hardcoded-strings.grit",
        `export const A = () => (
  <p>
    {/* biome-ignore lint/plugin: product name */}
    <span>Intl Party</span>
  </p>
);`,
      ),
    ).toEqual([]);
  });
});
