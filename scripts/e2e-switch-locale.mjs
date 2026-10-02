// Clicks the generated example page's locale buttons in a real browser and
// checks the page switches language (and URL, with a localePrefix).
// Usage: node e2e-switch-locale.mjs <baseUrl> <never|as-needed|always>
// Run from a directory where `playwright` is installed. Set CHROMIUM_PATH to
// use an existing Chromium instead of Playwright's download.
import { chromium } from "playwright";

const [baseUrl, mode = "never"] = process.argv.slice(2);
const headings = {
  en: "Welcome to IntlParty!",
  es: "¡Bienvenido a IntlParty!",
  fr: "Bienvenue chez IntlParty !",
};
const expectedPath = (locale) =>
  mode === "never"
    ? "/"
    : mode === "as-needed" && locale === "en"
      ? "/"
      : `/${locale}`;

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {},
);
const page = await browser.newPage({ locale: "en-US" });
let failed = false;

async function expectLocale(label, locale) {
  try {
    await page.waitForFunction(
      (l) => document.documentElement.lang === l,
      locale,
      { timeout: 10_000 },
    );
    const path = new URL(page.url()).pathname;
    const heading = await page.locator("h1").textContent();
    if (path !== expectedPath(locale) || heading !== headings[locale]) {
      throw new Error(`at ${path}: "${heading}"`);
    }
    console.log(`  ✓ ${label}`);
  } catch (error) {
    console.log(
      `  ✗ ${label}: expected ${locale} at ${expectedPath(locale)} (${error.message})`,
    );
    failed = true;
  }
}

await page.goto(baseUrl + "/");
await expectLocale("starts in English", "en");
for (const locale of ["es", "fr", "en"]) {
  await page.getByRole("button", { name: locale.toUpperCase() }).click();
  await expectLocale(`switching to ${locale}`, locale);
}
await page.getByRole("button", { name: "ES" }).click();
await expectLocale("switching to es again", "es");
await page.goto(baseUrl + "/");
await expectLocale("the choice persists on the next visit", "es");

await browser.close();
process.exit(failed ? 1 : 0);
