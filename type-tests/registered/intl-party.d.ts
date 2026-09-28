// Mirrors the file `intl-party generate --types` writes into a project.
import type common from "./messages/en/common.json";
import type home from "./messages/en/home.json";

declare module "@intl-party/nextjs" {
  interface IntlPartyRegister {
    messages: {
      common: typeof common;
      home: typeof home;
    };
  }
}
