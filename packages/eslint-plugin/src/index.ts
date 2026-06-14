import { noHardcodedStrings } from "./rules/no-hardcoded-strings";
import { noMissingKeys } from "./rules/no-missing-keys";
import { preferTranslationHooks } from "./rules/prefer-translation-hooks";
import { recommended } from "./configs/recommended";
import { strict } from "./configs/strict";

const plugin = {
  meta: {
    name: "@intl-party/eslint-plugin",
    version: "0.1.0",
  },
  rules: {
    "no-hardcoded-strings": noHardcodedStrings,
    "no-missing-keys": noMissingKeys,
    "prefer-translation-hooks": preferTranslationHooks,
  },
  configs: {} as Record<string, unknown>,
};

// Legacy (.eslintrc) presets plus flat-config presets. The flat presets
// reference the plugin object itself, so they are assigned after creation.
Object.assign(plugin.configs, {
  recommended,
  strict,
  "flat/recommended": {
    plugins: { "@intl-party": plugin },
    rules: recommended.rules,
    settings: recommended.settings,
  },
  "flat/strict": {
    plugins: { "@intl-party": plugin },
    rules: strict.rules,
    settings: strict.settings,
  },
});

export default plugin;
