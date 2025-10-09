module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    // Allow unused vars that start with underscore
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    // Allow console logs in development
    "no-console": "warn",
    // Prefer const over let when possible
    "prefer-const": "error",
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint", "react", "react-hooks"],
      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
      rules: {
        // TypeScript handles unused vars better
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-empty-function": "warn",
        "@typescript-eslint/no-non-null-assertion": "warn",
        "@typescript-eslint/ban-types": "warn",
        "no-prototype-builtins": "warn",
        // React rules
        "react/jsx-uses-react": "warn",
        "react/jsx-uses-vars": "warn",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
      settings: {
        react: {
          version: "detect",
        },
      },
    },
    {
      files: ["**/*.test.*", "**/*.spec.*"],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        "no-console": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },
  ],
};
