import type { Locale, Namespace } from "@intl-party/core";

// Server-only utilities
export async function detectAvailableNamespaces(
  locales: Locale[],
  messagesPath: string = "./messages"
): Promise<Namespace[]> {
  const namespaces = new Set<Namespace>();

  for (const locale of locales) {
    try {
      // It's preferable not to move these to standard imports at the top of the file,
      // because 'fs/promises' and 'path' are Node.js modules and may not be available in all execution environments
      // (such as during static builds or in edge runtimes). Dynamic import with await ensures graceful error handling.
      const fs = await import("fs/promises");
      const path = await import("path");

      const localeDir = path.join(process.cwd(), messagesPath, locale);

      try {
        const files = await fs.readdir(localeDir);
        const jsonFiles = files.filter((file) => file.endsWith(".json"));

        for (const file of jsonFiles) {
          const namespace = file.replace(".json", "");
          namespaces.add(namespace);
        }
      } catch {
        // Directory doesn't exist, continue
      }
    } catch {
      // fs module not available, continue
    }
  }

  return Array.from(namespaces).length > 0
    ? Array.from(namespaces)
    : ["common"];
}
