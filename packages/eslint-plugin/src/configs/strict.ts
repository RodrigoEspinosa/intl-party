export const strict = {
  plugins: ["@intl-party"],
  rules: {
    "@intl-party/no-hardcoded-strings": [
      "error",
      {
        attributes: [
          "placeholder",
          "title",
          "aria-label",
          "aria-description",
          "alt",
          "label",
        ],
        minLength: 2,
        ignorePattern: "^[A-Z_][A-Z0-9_]*$", // Ignore constants
      },
    ],
    "@intl-party/no-missing-keys": "error",
    "@intl-party/prefer-translation-hooks": [
      "error",
      {
        allowDirectUsage: false,
      },
    ],
  },
  settings: {
    "intl-party": {
      translationFiles: ["./translations/**/*.json"],
      defaultLocale: "en",
      namespaces: ["common"],
    },
  },
};
