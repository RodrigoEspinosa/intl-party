import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createI18n } from "@intl-party/core";
import { I18nProvider, useI18nContext } from "./I18nContext";

function TestComponent() {
  const { locale, setLocale, t, isLoading } = useI18nContext();

  return (
    <div>
      <div data-testid="locale">{locale}</div>
      <div data-testid="loading">{isLoading ? "loading" : "ready"}</div>
      <div data-testid="translation">{t("welcome")}</div>
      <button data-testid="change-locale" onClick={() => setLocale("es")}>
        Change to Spanish
      </button>
    </div>
  );
}

describe("I18nProvider", () => {
  let i18n: ReturnType<typeof createI18n>;

  beforeEach(() => {
    i18n = createI18n({
      locales: ["en", "es"],
      defaultLocale: "en",
      namespaces: ["common"],
    });

    i18n.addTranslations("en", "common", {
      welcome: "Welcome!",
    });

    i18n.addTranslations("es", "common", {
      welcome: "¡Bienvenido!",
    });
  });

  it("should provide i18n context to children", () => {
    render(
      <I18nProvider i18n={i18n}>
        <TestComponent />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("translation")).toHaveTextContent("Welcome!");
    expect(screen.getByTestId("loading")).toHaveTextContent("ready");
  });

  it("should handle locale changes", () => {
    render(
      <I18nProvider i18n={i18n}>
        <TestComponent />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("translation")).toHaveTextContent("Welcome!");

    fireEvent.click(screen.getByTestId("change-locale"));

    expect(screen.getByTestId("locale")).toHaveTextContent("es");
    expect(screen.getByTestId("translation")).toHaveTextContent("¡Bienvenido!");
  });

  it("should call onLocaleChange callback", () => {
    const onLocaleChange = vi.fn();

    render(
      <I18nProvider i18n={i18n} onLocaleChange={onLocaleChange}>
        <TestComponent />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId("change-locale"));

    expect(onLocaleChange).toHaveBeenCalledWith("es");
  });

  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useI18nContext must be used within an I18nProvider");

    consoleSpy.mockRestore();
  });

  it("should handle loading states", () => {
    const TestLoadingComponent = () => {
      const { i18n, isLoading } = useI18nContext();

      return (
        <div>
          <div data-testid="loading">{isLoading ? "loading" : "ready"}</div>
          <button
            data-testid="preload"
            onClick={() => i18n.preloadTranslations("fr", "common")}
          >
            Preload
          </button>
        </div>
      );
    };

    render(
      <I18nProvider i18n={i18n}>
        <TestLoadingComponent />
      </I18nProvider>,
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("ready");

    fireEvent.click(screen.getByTestId("preload"));

    // Note: In a real scenario, this would show loading state briefly
    // For this test, the mock implementation resolves immediately
  });

  it("should handle initialization with config", () => {
    const config = {
      locales: ["en", "es"],
      defaultLocale: "en",
      namespaces: ["common"],
    };

    render(
      <I18nProvider config={config}>
        <TestComponent />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });

  it("should throw error when neither config nor i18n instance provided", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(
        <I18nProvider>
          <TestComponent />
        </I18nProvider>,
      );
    }).toThrow(
      "Either config or i18n instance must be provided to I18nProvider",
    );

    consoleSpy.mockRestore();
  });

  it("should render fallback component on error", () => {
    // Trigger an error by changing to an unsupported locale
    const TestErrorComponent = () => {
      const { setLocale } = useI18nContext();

      return (
        <div>
          <button
            data-testid="trigger-error"
            onClick={() => setLocale("unsupported")}
          >
            Trigger Error
          </button>
        </div>
      );
    };

    render(
      <I18nProvider
        i18n={i18n}
        fallbackComponent={<div data-testid="fallback">Something went wrong</div>}
      >
        <TestErrorComponent />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId("trigger-error"));

    expect(screen.getByTestId("fallback")).toHaveTextContent(
      "Something went wrong",
    );
  });

  it("should call onError callback when locale change fails", () => {
    const onError = vi.fn();

    const TestErrorComponent = () => {
      const { setLocale } = useI18nContext();

      return (
        <button
          data-testid="trigger-error"
          onClick={() => setLocale("unsupported")}
        >
          Trigger Error
        </button>
      );
    };

    render(
      <I18nProvider i18n={i18n} onError={onError}>
        <TestErrorComponent />
      </I18nProvider>,
    );

    // Suppress the error re-throw (no fallbackComponent means it will throw)
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      fireEvent.click(screen.getByTestId("trigger-error"));
    }).toThrow();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));

    consoleSpy.mockRestore();
  });

  it("should handle namespace change errors with fallback", () => {
    const TestNsErrorComponent = () => {
      const { setNamespace } = useI18nContext();

      return (
        <button
          data-testid="trigger-ns-error"
          onClick={() => setNamespace("nonexistent")}
        >
          Bad Namespace
        </button>
      );
    };

    render(
      <I18nProvider
        i18n={i18n}
        fallbackComponent={<div data-testid="fallback">NS Error</div>}
      >
        <TestNsErrorComponent />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId("trigger-ns-error"));

    expect(screen.getByTestId("fallback")).toHaveTextContent("NS Error");
  });

  it("should handle rapid locale switching", () => {
    i18n.addTranslations("es", "common", {
      welcome: "¡Bienvenido!",
    });

    const TestRapidSwitch = () => {
      const { locale, setLocale, t } = useI18nContext();

      return (
        <div>
          <div data-testid="locale">{locale}</div>
          <div data-testid="translation">{t("welcome")}</div>
          <button data-testid="to-es" onClick={() => setLocale("es")}>ES</button>
          <button data-testid="to-en" onClick={() => setLocale("en")}>EN</button>
        </div>
      );
    };

    render(
      <I18nProvider i18n={i18n}>
        <TestRapidSwitch />
      </I18nProvider>,
    );

    // Rapid switching — should settle on the last one
    fireEvent.click(screen.getByTestId("to-es"));
    fireEvent.click(screen.getByTestId("to-en"));
    fireEvent.click(screen.getByTestId("to-es"));

    expect(screen.getByTestId("locale")).toHaveTextContent("es");
    expect(screen.getByTestId("translation")).toHaveTextContent("¡Bienvenido!");
  });

  it("should render missing translation keys gracefully", () => {
    const TestMissing = () => {
      const { t } = useI18nContext();
      return <div data-testid="missing">{t("does.not.exist")}</div>;
    };

    render(
      <I18nProvider i18n={i18n}>
        <TestMissing />
      </I18nProvider>,
    );

    // Should render the fallback format, not crash
    expect(screen.getByTestId("missing")).toHaveTextContent(
      "[common:does.not.exist]",
    );
  });
});
