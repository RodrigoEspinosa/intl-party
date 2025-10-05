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
  configs: {
    recommended,
    strict,
  },
};

export default plugin;
