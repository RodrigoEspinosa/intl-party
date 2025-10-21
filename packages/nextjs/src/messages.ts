import type { Locale, Namespace } from "@intl-party/core";

export interface MessageLoadOptions {
  locales: Locale[];
  namespaces?: Namespace[];
  messagesPath?: string;
}

export async function loadMessages({
  locales,
  namespaces = ["common"],
  messagesPath = "./messages",
}: MessageLoadOptions): Promise<Record<Locale, Record<Namespace, any>>> {
  const result: Record<Locale, Record<Namespace, any>> = {};

  for (const locale of locales) {
    result[locale] = {};

    for (const namespace of namespaces) {
      try {
        // Try to load the message file
        const messagePath = `${messagesPath}/${locale}/${namespace}.json`;

        if (typeof window === "undefined") {
          // Server-side: use fs to read JSON files
          const { readFile } = await import("fs/promises");
          const { join } = await import("path");
          const fullPath = join(process.cwd(), messagePath);
          const fileContent = await readFile(fullPath, "utf-8");
          result[locale][namespace] = JSON.parse(fileContent);
        } else {
          // Client-side: dynamic import (though this won't work reliably)
          const messages = await import(/* @vite-ignore */ messagePath);
          result[locale][namespace] = messages.default;
        }
      } catch (error) {
        // If file doesn't exist, use empty object
        console.warn(
          `Could not load messages for ${locale}/${namespace}:`,
          error
        );
        result[locale][namespace] = {};
      }
    }
  }

  return result;
}

export async function loadMessagesForLocale(
  locale: Locale,
  options: Omit<MessageLoadOptions, "locales">
): Promise<Record<Namespace, any>> {
  const allMessages = await loadMessages({ ...options, locales: [locale] });
  return allMessages[locale] || {};
}

// Convenience function to load all messages with auto-detected namespaces
export async function loadAllMessages(config: {
  locales: Locale[];
  namespaces?: Namespace[];
  messagesPath: string;
}): Promise<Record<Locale, Record<Namespace, any>>> {
  const { locales, namespaces, messagesPath } = config;

  let finalNamespaces = namespaces;

  // If no namespaces specified, try to detect them (only on server)
  if (!finalNamespaces || finalNamespaces.length === 0) {
    if (typeof window === "undefined") {
      // Server-side: try to detect namespaces
      try {
        const { detectAvailableNamespaces } = await import("./server/utils");
        finalNamespaces = await detectAvailableNamespaces(
          locales,
          messagesPath
        );
      } catch {
        finalNamespaces = ["common"];
      }
    } else {
      // Client-side: default to "common"
      finalNamespaces = ["common"];
    }
  }

  return loadMessages({
    locales,
    namespaces: finalNamespaces,
    messagesPath,
  });
}
