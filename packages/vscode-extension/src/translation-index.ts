import * as vscode from "vscode";
import * as path from "path";

export interface TranslationEntry {
  key: string;
  value: string;
  locale: string;
  filePath: string;
}

/**
 * Watches translation JSON files in the workspace and maintains
 * a flattened key-value index per locale for fast lookups.
 */
export class TranslationIndex {
  /** locale -> (flatKey -> TranslationEntry) */
  private index = new Map<string, Map<string, TranslationEntry>>();
  private fileWatcher: vscode.FileSystemWatcher | undefined;
  private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChange = this.onDidChangeEmitter.event;

  async initialize(): Promise<void> {
    await this.buildIndex();
    this.setupFileWatcher();
  }

  dispose(): void {
    this.fileWatcher?.dispose();
    this.onDidChangeEmitter.dispose();
  }

  /** Return all known translation keys (union across locales). */
  getAllKeys(): string[] {
    const keys = new Set<string>();
    for (const localeMap of this.index.values()) {
      for (const key of localeMap.keys()) {
        keys.add(key);
      }
    }
    return Array.from(keys);
  }

  /** Get the translation value for a key in a given locale. */
  getValue(key: string, locale: string): string | undefined {
    return this.index.get(locale)?.get(key)?.value;
  }

  /** Get all entries (across locales) for a given key. */
  getEntries(key: string): TranslationEntry[] {
    const entries: TranslationEntry[] = [];
    for (const localeMap of this.index.values()) {
      const entry = localeMap.get(key);
      if (entry) {
        entries.push(entry);
      }
    }
    return entries;
  }

  /** Get locales that are missing a specific key. */
  getMissingLocales(key: string): string[] {
    const allLocales = Array.from(this.index.keys());
    return allLocales.filter((locale) => !this.index.get(locale)?.has(key));
  }

  /** Get all known locales. */
  getLocales(): string[] {
    return Array.from(this.index.keys());
  }

  /** Force a full rebuild of the index. */
  async refresh(): Promise<void> {
    this.index.clear();
    await this.buildIndex();
    this.onDidChangeEmitter.fire();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private getGlobPattern(): string {
    const config = vscode.workspace.getConfiguration("intl-party");
    return config.get<string>("translationFiles", "**/locales/**/*.json");
  }

  private async buildIndex(): Promise<void> {
    const pattern = this.getGlobPattern();
    const files = await vscode.workspace.findFiles(pattern, "**/node_modules/**");

    for (const file of files) {
      await this.indexFile(file);
    }
  }

  private async indexFile(uri: vscode.Uri): Promise<void> {
    try {
      const raw = await vscode.workspace.fs.readFile(uri);
      const json = JSON.parse(Buffer.from(raw).toString("utf-8"));
      const locale = this.inferLocale(uri);

      if (!locale) return;

      if (!this.index.has(locale)) {
        this.index.set(locale, new Map());
      }

      const flat = this.flatten(json);
      const localeMap = this.index.get(locale)!;

      for (const [key, value] of Object.entries(flat)) {
        localeMap.set(key, {
          key,
          value: String(value),
          locale,
          filePath: uri.fsPath,
        });
      }
    } catch {
      // Silently ignore files that can't be parsed
    }
  }

  /**
   * Infer locale from the file path. Supports patterns like:
   *   locales/en/common.json  -> "en"
   *   locales/en.json         -> "en"
   *   i18n/fr-FR/messages.json -> "fr-FR"
   */
  private inferLocale(uri: vscode.Uri): string | undefined {
    const parts = uri.fsPath.split(path.sep);
    // Walk backwards looking for a locale-like segment
    for (let i = parts.length - 2; i >= 0; i--) {
      const segment = parts[i];
      if (/^[a-z]{2}(-[A-Z]{2})?$/.test(segment)) {
        return segment;
      }
    }
    // Fall back: use filename without extension
    const basename = path.basename(uri.fsPath, ".json");
    if (/^[a-z]{2}(-[A-Z]{2})?$/.test(basename)) {
      return basename;
    }
    return undefined;
  }

  /** Flatten nested JSON into dot-separated keys. */
  private flatten(
    obj: Record<string, unknown>,
    prefix = "",
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value as Record<string, unknown>, fullKey));
      } else {
        result[fullKey] = String(value ?? "");
      }
    }

    return result;
  }

  private setupFileWatcher(): void {
    const pattern = this.getGlobPattern();
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    const handleChange = async (uri: vscode.Uri) => {
      // Re-index the specific locale for this file
      const locale = this.inferLocale(uri);
      if (locale) {
        // Remove old entries from this file
        const localeMap = this.index.get(locale);
        if (localeMap) {
          for (const [key, entry] of localeMap) {
            if (entry.filePath === uri.fsPath) {
              localeMap.delete(key);
            }
          }
        }
      }
      await this.indexFile(uri);
      this.onDidChangeEmitter.fire();
    };

    this.fileWatcher.onDidChange(handleChange);
    this.fileWatcher.onDidCreate(handleChange);
    this.fileWatcher.onDidDelete(async (uri) => {
      const locale = this.inferLocale(uri);
      if (locale) {
        const localeMap = this.index.get(locale);
        if (localeMap) {
          for (const [key, entry] of localeMap) {
            if (entry.filePath === uri.fsPath) {
              localeMap.delete(key);
            }
          }
        }
        this.onDidChangeEmitter.fire();
      }
    });
  }
}
