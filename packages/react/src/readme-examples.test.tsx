import React from "react";
import { it, expect } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { createI18n } from "@intl-party/core";
import {
  I18nProvider,
  useTranslations,
  useLocale,
  Trans,
  LocaleSelector,
} from "./index";

function make() {
  const i18n = createI18n({
    locales: ["en", "es"],
    defaultLocale: "en",
    namespaces: ["common", "auth"],
  });
  i18n.addTranslations("en", "common", {
    welcome: "Welcome!",
    greeting: "Hello {{name}}!",
    items: "{{count|item|items}}",
    terms: "I agree to the <link>terms</link>, {{name}}.",
  });
  i18n.addTranslations("es", "common", {
    welcome: "¡Bienvenido!",
    greeting: "¡Hola {{name}}!",
  });
  i18n.addTranslations("en", "auth", { title: "Sign in" });
  return i18n;
}
function Welcome() {
  const t = useTranslations("common");
  const [locale, setLocale] = useLocale();
  return (
    <div>
      <h1>{t("welcome")}</h1>
      <p data-testid="g">{t("greeting", { interpolation: { name: "Ada" } })}</p>
      <p data-testid="opts">
        {[
          t("items", { count: 2 }),
          t("missing", { fallback: "Default text" }),
          t("title", { namespace: "auth" }),
        ].join("|")}
      </p>
      <button onClick={() => setLocale(locale === "en" ? "es" : "en")}>
        {locale === "en" ? "Español" : "English"}
      </button>
    </div>
  );
}
// Mirrors the examples in README.md; update both together.
it("README examples render as documented", () => {
  const i18n = make();
  render(
    <I18nProvider i18n={i18n}>
      <Welcome />
      <div data-testid="trans">
        <Trans
          i18nKey="terms"
          namespace="common"
          values={{ name: "Ada" }}
          components={{ link: <a href="/terms" /> }}
        />
      </div>
      <div data-testid="sel">
        <LocaleSelector variant="buttons" />
      </div>
    </I18nProvider>,
  );
  expect(screen.getByRole("heading").textContent).toBe("Welcome!");
  expect(screen.getByTestId("g").textContent).toBe("Hello Ada!");
  expect(screen.getByTestId("opts").textContent).toBe(
    "items|Default text|Sign in",
  );
  expect(screen.getByTestId("trans").innerHTML).toBe(
    'I agree to the <a href="/terms">terms</a>, Ada.',
  );
  expect(
    Array.from(screen.getByTestId("sel").querySelectorAll("button")).map(
      (b) => b.textContent,
    ),
  ).toEqual(["English", "español"]);
  act(() => {
    fireEvent.click(screen.getByText("Español"));
  });
  expect(screen.getByRole("heading").textContent).toBe("¡Bienvenido!");
});
