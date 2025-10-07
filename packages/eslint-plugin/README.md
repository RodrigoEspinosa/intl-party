# @intl-party/eslint-plugin

ESLint plugin for IntlParty - enforce best practices and catch common i18n issues in your code.

## Features

- 🚫 **No hardcoded strings** - Detect untranslated user-facing text
- 🔍 **Missing translation keys** - Catch references to non-existent translation keys
- ⚛️ **React hooks enforcement** - Prefer translation hooks over direct i18n usage
- 📝 **Consistent patterns** - Enforce consistent translation patterns across your codebase
- ⚙️ **Configurable rules** - Customize rules to fit your project needs

## Installation

```bash
npm install --save-dev @intl-party/eslint-plugin
# or
pnpm add -D @intl-party/eslint-plugin
# or
yarn add --dev @intl-party/eslint-plugin
```

## Configuration

### Basic Setup

Add the plugin to your ESLint configuration:

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["@intl-party"],
  extends: ["@intl-party/recommended"],
};
```

### Manual Configuration

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["@intl-party"],
  rules: {
    "@intl-party/no-hardcoded-strings": "error",
    "@intl-party/no-missing-keys": "error",
    "@intl-party/prefer-translation-hooks": "warn",
  },
};
```

### TypeScript Configuration

```javascript
// .eslintrc.js
module.exports = {
  extends: ["@intl-party/recommended", "@intl-party/typescript"],
  parserOptions: {
    project: "./tsconfig.json",
  },
};
```

## Rules

### `@intl-party/no-hardcoded-strings`

Prevents hardcoded user-facing strings that should be translated.

#### ❌ Incorrect

```jsx
function Welcome() {
  return <h1>Welcome to our app!</h1>; // Hardcoded string
}

function Button() {
  return <button>Click here</button>; // Hardcoded string
}

const message = "Hello world"; // Hardcoded string
```

#### ✅ Correct

```jsx
function Welcome() {
  const t = useTranslations("common");
  return <h1>{t("welcome")}</h1>;
}

function Button() {
  const t = useTranslations("common");
  return <button>{t("clickHere")}</button>;
}

const message = t("hello");
```

#### Configuration

```javascript
{
  "@intl-party/no-hardcoded-strings": ["error", {
    "ignorePatterns": [
      "^\\d+$",           // Numbers
      "^[A-Z_]+$",        // Constants
      "^https?://",       // URLs
      "className",        // CSS classes
      "data-*"            // Data attributes
    ],
    "ignoreElements": ["script", "style"],
    "ignoreAttributes": ["className", "id", "data-testid"]
  }]
}
```

### `@intl-party/no-missing-keys`

Catches references to translation keys that don't exist in your translation files.

#### ❌ Incorrect

```jsx
function Component() {
  const t = useTranslations("common");
  return <h1>{t("nonExistentKey")}</h1>; // Key doesn't exist
}
```

#### ✅ Correct

```jsx
function Component() {
  const t = useTranslations("common");
  return <h1>{t("welcome")}</h1>; // Key exists in common namespace
}
```

#### Configuration

```javascript
{
  "@intl-party/no-missing-keys": ["error", {
    "translationsPath": "./messages",
    "defaultLocale": "en",
    "namespaces": ["common", "navigation"],
    "checkDynamicKeys": false
  }]
}
```

### `@intl-party/prefer-translation-hooks`

Encourages using translation hooks instead of direct i18n instance usage in React components.

#### ❌ Incorrect

```jsx
function Component() {
  const { i18n } = useI18nContext();
  return <h1>{i18n.t("welcome")}</h1>; // Direct i18n usage
}
```

#### ✅ Correct

```jsx
function Component() {
  const t = useTranslations("common");
  return <h1>{t("welcome")}</h1>; // Using translation hook
}
```

#### Configuration

```javascript
{
  "@intl-party/prefer-translation-hooks": ["warn", {
    "allowedMethods": ["formatDate", "formatNumber"],
    "ignoreServerComponents": true
  }]
}
```

## Configuration Presets

### Recommended Preset

```javascript
// Balanced rules for most projects
{
  "extends": ["@intl-party/recommended"]
}
```

Includes:

- `@intl-party/no-hardcoded-strings`: `error`
- `@intl-party/no-missing-keys`: `error`
- `@intl-party/prefer-translation-hooks`: `warn`

### Strict Preset

```javascript
// Stricter rules for high-quality i18n
{
  "extends": ["@intl-party/strict"]
}
```

Includes all recommended rules plus:

- Stricter hardcoded string detection
- Enforcement of namespace consistency
- Required translation comments

### TypeScript Preset

```javascript
// Additional rules for TypeScript projects
{
  "extends": [
    "@intl-party/recommended",
    "@intl-party/typescript"
  ]
}
```

Includes type-aware rules and TypeScript-specific checks.

## Advanced Configuration

### Project-Specific Settings

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["@intl-party"],
  settings: {
    "intl-party": {
      // Path to translation files
      translationsPath: "./src/locales",

      // Default locale for key validation
      defaultLocale: "en",

      // Available namespaces
      namespaces: ["common", "navigation", "forms"],

      // Translation file pattern
      filePattern: "{locale}/{namespace}.json",

      // Ignore patterns for hardcoded strings
      ignorePatterns: [
        "^[A-Z_]+$", // Constants
        "^\\d+$", // Numbers
        "^https?://", // URLs
        "^mailto:", // Email links
        "^tel:", // Phone links
      ],

      // Elements to ignore for hardcoded strings
      ignoreElements: ["script", "style", "code", "pre"],

      // Attributes to ignore
      ignoreAttributes: ["className", "id", "data-*", "aria-*"],
    },
  },
  rules: {
    "@intl-party/no-hardcoded-strings": "error",
    "@intl-party/no-missing-keys": "error",
    "@intl-party/prefer-translation-hooks": "warn",
  },
};
```

### Framework-Specific Configuration

#### Next.js

```javascript
// .eslintrc.js
module.exports = {
  extends: ["next/core-web-vitals", "@intl-party/recommended"],
  settings: {
    "intl-party": {
      translationsPath: "./messages",
      framework: "nextjs",
    },
  },
};
```

#### React

```javascript
// .eslintrc.js
module.exports = {
  extends: ["react-app", "@intl-party/recommended"],
  settings: {
    "intl-party": {
      translationsPath: "./src/translations",
      framework: "react",
    },
  },
};
```

## Integration with Build Tools

### CI/CD Integration

```yaml
# .github/workflows/lint.yml
name: Lint
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run lint:i18n # Custom script for i18n-specific linting
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "**/*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "eslint --ext .js,.jsx,.ts,.tsx --config .eslintrc.i18n.js"
    ]
  }
}
```

### Custom Scripts

```json
// package.json
{
  "scripts": {
    "lint": "eslint src/",
    "lint:i18n": "eslint src/ --config .eslintrc.i18n.js",
    "lint:fix": "eslint src/ --fix"
  }
}
```

## Troubleshooting

### Common Issues

1. **False positives for hardcoded strings**
   - Add patterns to `ignorePatterns` in rule configuration
   - Use `eslint-disable-next-line` comments for specific cases

2. **Missing key errors for dynamic keys**
   - Set `checkDynamicKeys: false` in rule configuration
   - Use template strings for predictable patterns

3. **Performance issues with large translation files**
   - Use `translationsPath` setting to optimize file loading
   - Consider splitting large translation files

### Debug Mode

Enable debug logging to troubleshoot rule issues:

```bash
DEBUG=eslint-plugin-intl-party eslint src/
```

### Custom Rule Configuration

```javascript
// For specific files or patterns
{
  "overrides": [
    {
      "files": ["**/*.test.{js,jsx,ts,tsx}"],
      "rules": {
        "@intl-party/no-hardcoded-strings": "off"
      }
    },
    {
      "files": ["**/admin/**"],
      "rules": {
        "@intl-party/no-missing-keys": "warn"
      }
    }
  ]
}
```

## Examples

### Real-world Configuration

```javascript
// .eslintrc.js for a Next.js project
module.exports = {
  extends: ["next/core-web-vitals", "@intl-party/recommended"],
  settings: {
    "intl-party": {
      translationsPath: "./messages",
      defaultLocale: "en",
      namespaces: ["common", "navigation", "forms", "errors"],
      ignorePatterns: [
        "^[A-Z_]+$",
        "^\\d+(\\.\\d+)?$",
        "^#[0-9a-fA-F]{3,6}$",
        "^rgb\\(",
        "^https?://",
        "^mailto:",
        "^\\+\\d",
      ],
    },
  },
  overrides: [
    {
      files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.stories.{js,jsx,ts,tsx}"],
      rules: {
        "@intl-party/no-hardcoded-strings": "off",
      },
    },
    {
      files: ["**/admin/**", "**/cms/**"],
      rules: {
        "@intl-party/no-hardcoded-strings": "warn",
      },
    },
  ],
};
```

## License

MIT © IntlParty
