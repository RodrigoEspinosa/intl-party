import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createI18n } from "@intl-party/core";
import { I18nProvider } from "../context/I18nContext";
import {
  useTranslations,
  useOptionalTranslation,
  useHasTranslation,
} from "./useTranslations";
import type { ReactNode } from "react";

const createWrapper = (
  i18nInstance = createI18n({
    locales: ["en", "es"],
    defaultLocale: "en",
    namespaces: ["common", "auth"],
  }),
) => {
  return ({ children }: { children: ReactNode }) => (
    <I18nProvider i18n={i18nInstance}>{children}</I18nProvider>
  );
};

describe("useTranslations", () => {
  let i18n: ReturnType<typeof createI18n>;

  beforeEach(() => {
    i18n = createI18n({
      locales: ["en", "es"],
      defaultLocale: "en",
      namespaces: ["common", "auth"],
    });

    i18n.addTranslations("en", "common", {
      welcome: "Welcome!",
      hello: "Hello {{name}}!",
      nav: {
        home: "Home",
        about: "About",
      },
    });

    i18n.addTranslations("en", "auth", {
      login: "Login",
      logout: "Logout",
    });
  });

  it("should return translation function", () => {
    const wrapper = createWrapper(i18n);
    const { result } = renderHook(() => useTranslations(), { wrapper });

    expect(typeof result.current).toBe("function");
    expect(result.current("welcome")).toBe("Welcome!");
  });

  it("should use specified namespace", () => {
    const wrapper = createWrapper(i18n);
    const { result } = renderHook(() => useTranslations("auth"), { wrapper });

    expect(result.current("login")).toBe("Login");
  });

  it("should handle interpolation", () => {
    const wrapper = createWrapper(i18n);
    const { result } = renderHook(() => useTranslations(), { wrapper });

    const translated = result.current("hello", {
      interpolation: { name: "World" },
    });

    expect(translated).toBe("Hello World!");
  });

  it("should handle nested keys", () => {
    const wrapper = createWrapper(i18n);
    const { result } = renderHook(() => useTranslations(), { wrapper });

    expect(result.current("nav.home")).toBe("Home");
    expect(result.current("nav.about")).toBe("About");
  });

  it("should update when locale changes", () => {
    i18n.addTranslations("es", "common", {
      welcome: "¡Bienvenido!",
    });

    const wrapper = createWrapper(i18n);
    const { result } = renderHook(() => useTranslations(), { wrapper });

    expect(result.current("welcome")).toBe("Welcome!");

    // Change locale
    act(() => {
      i18n.setLocale("es");
    });

    expect(result.current("welcome")).toBe("¡Bienvenido!");
  });
});

describe("useOptionalTranslation", () => {
  let i18n: ReturnType<typeof createI18n>;

  beforeEach(() => {
    i18n = createI18n({
      locales: ["en"],
      defaultLocale: "en",
      namespaces: ["common"],
    });

    i18n.addTranslations("en", "common", {
      existing: "Exists",
    });
  });

  it("should return translation if key exists", () => {
    const wrapper = createWrapper(i18n);
    const { result } = renderHook(() => useOptionalTranslation("existing"), {
      wrapper,
    });

    expect(result.current).toBe("Exists");
  });

  it("should return undefined if key does not exist", () => {
    const wrapper = createWrapper(i18n);
    const { result } = renderHook(() => useOptionalTranslation("missing"), {
      wrapper,
    });

    expect(result.current).toBeUndefined();
  });
});

describe("useHasTranslation", () => {
  let i18n: ReturnType<typeof createI18n>;

  beforeEach(() => {
    i18n = createI18n({
      locales: ["en"],
      defaultLocale: "en",
      namespaces: ["common"],
    });

    i18n.addTranslations("en", "common", {
      existing: "Exists",
    });
  });

  it("should return function to check translation existence", () => {
    const wrapper = createWrapper(i18n);
    const { result } = renderHook(() => useHasTranslation(), { wrapper });

    expect(typeof result.current).toBe("function");
    expect(result.current("existing")).toBe(true);
    expect(result.current("missing")).toBe(false);
  });

  it("should work with different namespaces", () => {
    i18n.addTranslations("en", "auth", {
      login: "Login",
    });

    const wrapper = createWrapper(i18n);
    const { result } = renderHook(() => useHasTranslation(), { wrapper });

    expect(result.current("login", "auth")).toBe(true);
    expect(result.current("login", "common")).toBe(false);
  });
});
