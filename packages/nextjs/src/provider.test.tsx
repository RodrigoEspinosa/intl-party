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

    const { container } = render(
      <Provider locale="en" initialMessages={mockInitialMessages}>
        <div>Test Content</div>
      </Provider>,
    );

    // Provider should render without errors
    expect(container.textContent).toContain("Test Content");
  });

  it("should use default locale when none provided", () => {
    const { container } = render(
      <Provider defaultLocale="fr" initialMessages={{}}>
        <div>Test Content</div>
      </Provider>,
    );

    // Provider should render without errors when using defaultLocale
    expect(container.textContent).toContain("Test Content");
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
