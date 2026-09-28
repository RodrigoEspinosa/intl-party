import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createI18n } from "@intl-party/core";
import { useLocale } from "@intl-party/react";
import { ReactNativeI18nProvider } from "./provider";

const config = {
  locales: ["en", "es"],
  defaultLocale: "en",
  namespaces: ["common"],
};

function LocaleProbe() {
  const [locale] = useLocale();
  return <div data-testid="locale">{locale}</div>;
}

describe("ReactNativeI18nProvider", () => {
  it("applies the detected locale when created from config", async () => {
    render(
      <ReactNativeI18nProvider config={config} detectLocale={async () => "es"}>
        <LocaleProbe />
      </ReactNativeI18nProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("locale").textContent).toBe("es"),
    );
  });

  it("applies the detected locale to a caller-supplied i18n instance", async () => {
    const i18n = createI18n(config);
    const onLocaleChange = vi.fn();

    render(
      <ReactNativeI18nProvider
        i18n={i18n}
        detectLocale={async () => "es"}
        onLocaleChange={onLocaleChange}
      >
        <LocaleProbe />
      </ReactNativeI18nProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("locale").textContent).toBe("es"),
    );
    expect(i18n.getLocale()).toBe("es");
    // Detection is not a user choice, so it must not trigger persistence.
    expect(onLocaleChange).not.toHaveBeenCalled();
  });

  it("ignores an unsupported detected locale on a caller-supplied instance", async () => {
    const i18n = createI18n(config);

    render(
      <ReactNativeI18nProvider i18n={i18n} detectLocale={async () => "fr"}>
        <LocaleProbe />
      </ReactNativeI18nProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("locale").textContent).toBe("en"),
    );
  });
});
