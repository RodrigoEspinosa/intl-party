import { loadAllMessages } from "./messages";

// Utility to create a pre-configured client provider data loader
export async function createClientProviderData(config: {
  locales: string[];
  namespaces?: string[];
  messagesPath: string;
}) {
  return loadAllMessages(config);
}

// Utility to create a client-side i18n setup (no server locale detection)
export function createClientI18nSetup(config: {
  locales: string[];
  namespaces?: string[];
  messagesPath: string;
}) {
  return {
    // Load all messages for client-side
    loadMessages: () => loadAllMessages(config),

    // Get the config parts
    config,
  };
}
