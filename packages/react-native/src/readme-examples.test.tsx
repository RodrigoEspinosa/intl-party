// Runs the README examples. Keep this file in sync with README.md.
import React, { useState } from "react";
import { createRequire } from "node:module";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("react-native", () => ({
  Text: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Button: ({ title, onPress }: { title: string; onPress: () => void }) => (
    <button onClick={onPress}>{title}</button>
  ),
}));

import { Text, Button } from "react-native";
import {
  ReactNativeI18nProvider,
  createAsyncStorageDetector,
  createDeviceLocaleDetector,
  useTranslations,
  useLocale,
  useI18nContext,
  type I18nConfig,
} from "./index";

// The detectors load expo-localization and AsyncStorage with require(), so
// stand in for the native modules at the CommonJS loader.
const Module = createRequire(import.meta.url)("node:module") as {
  _load: (id: string, ...rest: unknown[]) => unknown;
};
const originalLoad = Module._load;
let deviceLocales: string[];
let stored: Map<string, string>;

beforeEach(() => {
  deviceLocales = ["es-MX"];
  stored = new Map();
  Module._load = function (id: string, ...rest: unknown[]) {
    if (id === "expo-localization") {
      return {
        getLocales: () => deviceLocales.map((languageTag) => ({ languageTag })),
      };
    }
    if (id === "@react-native-async-storage/async-storage") {
      return {
        default: {
          getItem: async (k: string) => stored.get(k) ?? null,
          setItem: async (k: string, v: string) => void stored.set(k, v),
          removeItem: async (k: string) => void stored.delete(k),
        },
      };
    }
    return originalLoad.call(this, id, ...rest);
  };
});

afterEach(() => {
  Module._load = originalLoad;
});

const en = { welcome: "Welcome!" };
const es = { welcome: "¡Bienvenido!" };

// --- README: Basic Usage + Loading translations
function makeApp() {
  const config: I18nConfig = {
    locales: ["en", "es", "fr"],
    defaultLocale: "en",
    namespaces: ["common"],
  };

  const detectDeviceLocale = createDeviceLocaleDetector({
    supportedLocales: config.locales,
    fallbackLocale: "en",
  });

  const storage = createAsyncStorageDetector({
    supportedLocales: config.locales,
    fallbackLocale: detectDeviceLocale(),
  });

  function TranslationsLoader({ children }: { children: React.ReactNode }) {
    const { i18n } = useI18nContext();
    useState(() => {
      i18n.addTranslations("en", "common", en);
      i18n.addTranslations("es", "common", es);
    });
    return <>{children}</>;
  }

  function Home() {
    const t = useTranslations("common");
    const [locale, setLocale] = useLocale();

    return (
      <>
        <Text>{t("welcome")}</Text>
        <Button
          title={locale === "en" ? "Español" : "English"}
          onPress={() => setLocale(locale === "en" ? "es" : "en")}
        />
      </>
    );
  }

  return function App() {
    return (
      <ReactNativeI18nProvider
        config={config}
        detectLocale={storage.detect}
        onLocaleChange={storage.persist}
        fallbackLocale="en"
        loadingComponent={<Text>Loading…</Text>}
      >
        <TranslationsLoader>
          <Home />
        </TranslationsLoader>
      </ReactNativeI18nProvider>
    );
  };
}

describe("README: Basic Usage", () => {
  it("starts in the device language and persists the user's choice", async () => {
    const App = makeApp();
    render(<App />);

    expect(screen.getByText("Loading…")).toBeTruthy();
    expect(await screen.findByText("¡Bienvenido!")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(await screen.findByText("Welcome!")).toBeTruthy();
    await waitFor(() => expect(stored.get("@intl-party/locale")).toBe("en"));
  });

  it("prefers the saved locale over the device language", async () => {
    stored.set("@intl-party/locale", "en");
    const App = makeApp();
    render(<App />);

    expect(await screen.findByText("Welcome!")).toBeTruthy();
  });
});

describe("README: createDeviceLocaleDetector", () => {
  it('returns "es" on a device set to es-MX', () => {
    const detect = createDeviceLocaleDetector({
      supportedLocales: ["en", "es"],
      fallbackLocale: "en",
    });
    expect(detect()).toBe("es");
  });
});

describe("README: createAsyncStorageDetector", () => {
  it("detect() falls back when the stored value isn't supported", async () => {
    stored.set("@intl-party/locale", "de");
    const storage = createAsyncStorageDetector({
      supportedLocales: ["en"],
      fallbackLocale: "en",
    });
    expect(await storage.detect()).toBe("en");
    await storage.clear();
    expect(stored.size).toBe(0);
  });
});
