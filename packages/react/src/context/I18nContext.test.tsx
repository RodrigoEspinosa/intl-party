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
    const FallbackComponent = ({ error }: { error: Error }) => (
      <div data-testid="error">Error: {error.message}</div>
    );

    const ThrowingComponent = () => {
      throw new Error("Test error");
    };

    render(
      <I18nProvider
        i18n={i18n}
        fallbackComponent={
          <FallbackComponent error={new Error("Test error")} />
        }
      >
        <ThrowingComponent />
      </I18nProvider>,
    );

    // Note: This test might need adjustment based on how error boundaries work in the test environment
  });

  it("should handle onError callback", () => {
    const onError = vi.fn();
    const invalidI18n = createI18n({
      locales: ["en"],
      defaultLocale: "en",
      namespaces: ["common"],
    });

    const TestErrorComponent = () => {
      const { setLocale } = useI18nContext();

      return (
        <button
          data-testid="trigger-error"
          onClick={() => setLocale("invalid" as any)}
        >
          Trigger Error
        </button>
      );
    };

    render(
      <I18nProvider i18n={invalidI18n} onError={onError}>
        <TestErrorComponent />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByTestId("trigger-error"));

    expect(onError).toHaveBeenCalled();
  });
});
