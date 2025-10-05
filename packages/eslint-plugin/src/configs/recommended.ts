export const recommended = {
  plugins: ["@intl-party"],
  rules: {
    "@intl-party/no-hardcoded-strings": "warn",
    "@intl-party/no-missing-keys": "error",
    "@intl-party/prefer-translation-hooks": "warn",
  },
  settings: {
    "intl-party": {
      // Default settings
      translationFiles: ["./translations/**/*.json"],
      defaultLocale: "en",
      namespaces: ["common"],
    },
  },
};
