# @intl-party/cli

Command-line interface for IntlParty - extract, validate, and manage translations in your projects.

## Features

- 🔍 **Extract translations** - Automatically find translatable strings in your code
- ✅ **Validate translations** - Check for missing keys, unused translations, and consistency
- 🌐 **Generate translations** - Create translation files from extracted keys
- 🔄 **Sync translations** - Keep translation files in sync across locales
- ⚙️ **Configurable** - Flexible configuration for different project structures
- 📊 **Reports** - Detailed reports on translation coverage and issues

## Installation

```bash
npm install -g @intl-party/cli
# or
pnpm add -g @intl-party/cli
# or
yarn global add @intl-party/cli
```

Or install locally in your project:

```bash
npm install --save-dev @intl-party/cli
```

## Quick Start

### Initialize Configuration

```bash
intl-party nextjs --init
```

This creates an `intl-party.config.ts` file:

```typescript
export default {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  messages: "./messages",
};
```

### Extract Translations

Extract translatable strings from your code:

```bash
intl-party extract
```

This scans your source files for translation keys like:

- `t('welcome')`
- `useTranslations('common')('title')`
- `i18nKey="description"`

### Validate Translations

Check for issues in your translations:

```bash
intl-party check
```

Reports:

- Missing translations in different locales
- Unused translation keys
- Format errors in translations

### Synchronize Translations

Sync keys across all locales:

```bash
intl-party sync
```

## Commands

### `intl-party init`

Initialize IntlParty configuration in your project.

```bash
intl-party init [options]

Options:
  --config <path>    Configuration file path (default: intl-party.config.js)
  --force           Overwrite existing configuration
```

### `intl-party extract`

Extract translation keys from source code.

```bash
intl-party extract [options]

Options:
  --config <path>    Configuration file path
  --output <path>    Output directory for extracted keys
  --dry-run         Show what would be extracted without writing files
  --verbose         Show detailed extraction information
```

Example output:

```
✅ Extracted 145 translation keys
📁 Found in 23 source files
🏷️  Namespaces: common (89), navigation (34), forms (22)
📝 Created: extracted-keys.json
```

### `intl-party check`

Check for issues in translations and configuration.

```bash
intl-party check [options]

Options:
  --missing         Check for missing translations
  --unused          Check for unused translation keys
  --duplicates      Check for duplicate keys
  --format-errors   Check for format errors in translations
  --fix             Automatically fix issues where possible
```

### `intl-party check-config`

Validate your IntlParty configuration.

```bash
intl-party check-config [options]

Options:
  -c, --config <path>  Path to config file
```

### `intl-party generate`

Generate translation files from templates.

```bash
intl-party generate [options]

Options:
  --config <path>    Configuration file path
  --locale <code>    Generate for specific locale only
  --namespace <ns>   Generate for specific namespace only
  --template <path>  Custom template file
```

### `intl-party sync`

Synchronize translation keys across locales.

```bash
intl-party sync [options]

Options:
  --config <path>    Configuration file path
  --source <locale>  Source locale to sync from (default: defaultLocale)
  --target <locale>  Target locale to sync to (sync all if not specified)
  --add-missing     Add missing keys with placeholder values
  --remove-unused   Remove unused keys
```

## Configuration

### Basic Configuration

```javascript
// intl-party.config.js
module.exports = {
  // Required
  locales: ["en", "es", "fr", "de"],
  defaultLocale: "en",
  namespaces: ["common", "navigation", "forms"],

  // Paths
  translationsDir: "./messages", // Where translation files are stored
  sourceDir: "./src", // Where to scan for translation usage

  // File patterns
  patterns: {
    extract: [
      "**/*.{ts,tsx,js,jsx}", // Files to scan for translations
      "!**/*.test.*", // Exclude test files
      "!**/node_modules/**", // Exclude dependencies
    ],
    translation: "{locale}/{namespace}.json", // Translation file pattern
  },
};
```

### Advanced Configuration

```javascript
module.exports = {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["common", "navigation"],
  translationsDir: "./messages",
  sourceDir: "./src",

  // Extraction settings
  extraction: {
    // Custom function patterns to detect
    functions: ["t", "translate", "_"],

    // Hook patterns
    hooks: ["useTranslations"],

    // Component patterns
    components: ["Trans", "Translation"],

    // Key patterns (regex)
    keyPatterns: [
      /t\(['"`]([^'"`]+)['"`]\)/g,
      /useTranslations\(['"`]([^'"`]+)['"`]\)/g,
    ],
  },

  // Validation rules
  validation: {
    rules: {
      missingTranslations: "error", // error, warn, ignore
      unusedTranslations: "warn",
      inconsistentInterpolation: "error",
      emptyTranslations: "warn",
    },

    // Required interpolation variables
    requiredVariables: ["count", "name"],

    // Allowed HTML tags in translations
    allowedTags: ["strong", "em", "br"],
  },

  // Generation settings
  generation: {
    // Default value for missing translations
    defaultValue: "[MISSING: {{key}}]",

    // Template for new translation files
    template: "./templates/translation.json",

    // Sort keys alphabetically
    sortKeys: true,

    // Indentation in JSON files
    indent: 2,
  },
};
```

## Integration with Build Tools

### npm scripts

```json
{
  "scripts": {
    "i18n:extract": "intl-party extract",
    "i18n:validate": "intl-party validate",
    "i18n:sync": "intl-party sync",
    "prebuild": "npm run i18n:validate"
  }
}
```

### CI/CD Integration

```yaml
# .github/workflows/i18n.yml
name: Internationalization
on: [push, pull_request]

jobs:
  i18n:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run i18n:validate
      - run: npm run i18n:extract --dry-run
```

### Pre-commit Hooks

```json
// .husky/pre-commit or package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "intl-party validate --strict"
    }
  }
}
```

## File Structure Examples

### Flat Structure

```
messages/
  en.json
  es.json
  fr.json
```

### Namespaced Structure

```
messages/
  en/
    common.json
    navigation.json
    forms.json
  es/
    common.json
    navigation.json
    forms.json
```

### Custom Structure

```javascript
// intl-party.config.js
module.exports = {
  patterns: {
    translation: "locales/{locale}/messages/{namespace}.json",
  },
};

// Results in:
// locales/en/messages/common.json
// locales/es/messages/common.json
```

## Plugins and Extensions

### Custom Extractors

```javascript
// intl-party.config.js
module.exports = {
  plugins: [
    {
      name: "custom-extractor",
      extract: (content, filename) => {
        // Custom extraction logic
        const keys = [];
        // ... extract keys from content
        return keys;
      },
    },
  ],
};
```

### Custom Validators

```javascript
module.exports = {
  plugins: [
    {
      name: "custom-validator",
      validate: (translations, config) => {
        // Custom validation logic
        const issues = [];
        // ... validate translations
        return issues;
      },
    },
  ],
};
```

## Troubleshooting

### Common Issues

1. **Keys not extracted**: Check your function patterns in configuration
2. **False positives**: Use more specific regex patterns
3. **Missing files**: Verify translationsDir and file patterns
4. **Permission errors**: Ensure write access to output directories

### Debug Mode

```bash
intl-party extract --verbose --dry-run
```

### Configuration Validation

```bash
intl-party check-config
```

## License

MIT © IntlParty
