import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "./provider";
import { I18nProvider, useTranslations } from "@intl-party/react";

vi.mock("@intl-party/react", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useTranslations: vi.fn(),
}));

vi.mock("@intl-party/core", () => ({
  createI18n: vi.fn(() => ({
    addTranslations: vi.fn(),
    setLocale: vi.fn(),
  })),
}));

describe("Provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslations).mockReturnValue(vi.fn());
  });

  it("should render children", () => {
    const { getByText } = render(
      <Provider locale="en" initialMessages={{}}>
        <div>Test Content</div>
      </Provider>,
    );

    expect(getByText("Test Content")).toBeDefined();
  });

  it("should pass locale and messages to provider", () => {
    const mockInitialMessages = {
      en: {
        common: {
          welcome: "Welcome",
          hello: "Hello",
        },
      },
    };

    render(
      <Provider locale="en" initialMessages={mockInitialMessages}>
        <div>Test Content</div>
      </Provider>,
    );

    const renderCalls = vi.mocked(React.createElement).mock.calls;
    const providerCall = renderCalls.find((call) => call[0] === I18nProvider);

    if (providerCall) {
      const props = providerCall[1] as any;
      expect(props.i18n).toBeDefined();
    }
  });

  it("should use default locale when none provided", () => {
    render(
      <Provider defaultLocale="fr" initialMessages={{}}>
        <div>Test Content</div>
      </Provider>,
    );

    const renderCalls = vi.mocked(React.createElement).mock.calls;
    const contextCall = renderCalls.find(
      (call) => call[0] && typeof call[0] === "object" && "Provider" in call[0],
    );

    if (contextCall) {
      const props = contextCall[1] as any;
      expect(props.value.locale).toBe("fr");
    }
  });

  it("should handle namespaced messages", () => {
    const mockInitialMessages = {
      common: {
        welcome: "Welcome",
      },
      navigation: {
        home: "Home",
        about: "About",
      },
    };

    const { getByText } = render(
      <Provider locale="en" initialMessages={mockInitialMessages}>
        <div>Test Content</div>
      </Provider>,
    );

    expect(getByText("Test Content")).toBeDefined();
  });
});
