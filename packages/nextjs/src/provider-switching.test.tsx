import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

import { Provider, useLocale, useTranslations } from "./client-exports";

function Switcher() {
  const t = useTranslations("common");
  const [locale, setLocale] = useLocale();
  return (
    <div>
      <p data-testid="text">{t("welcome")}</p>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setLocale("es")}>es</button>
    </div>
  );
}

const en = { en: { common: { welcome: "Welcome" } } };
const es = { es: { common: { welcome: "Bienvenido" } } };

describe("Provider locale switching", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
    window.history.replaceState(null, "", "/about?x=1");
  });

  it("clean URLs: saves the cookie and refreshes server data", () => {
    render(
      <Provider locale="en" initialMessages={en}>
        <Switcher />
      </Provider>,
    );
    act(() => screen.getByText("es").click());

    expect(document.cookie).toContain("INTL_LOCALE=es");
    expect(refresh).toHaveBeenCalledTimes(1);
    // No client-only switch to a locale whose messages aren't loaded
    expect(screen.getByTestId("text").textContent).toBe("Welcome");
  });

  it("prefixed URLs: navigates to the localized path", () => {
    render(
      <Provider
        locale="en"
        initialMessages={en}
        routing={{
          locales: ["en", "es"],
          defaultLocale: "en",
          localePrefix: "as-needed",
        }}
      >
        <Switcher />
      </Provider>,
    );
    act(() => screen.getByText("es").click());

    expect(push).toHaveBeenCalledWith("/es/about?x=1");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("renders the new locale once the server sends it", () => {
    const { rerender } = render(
      <Provider locale="en" initialMessages={en}>
        <Switcher />
      </Provider>,
    );
    rerender(
      <Provider locale="es" initialMessages={es}>
        <Switcher />
      </Provider>,
    );

    expect(screen.getByTestId("locale").textContent).toBe("es");
    expect(screen.getByTestId("text").textContent).toBe("Bienvenido");
  });
});
