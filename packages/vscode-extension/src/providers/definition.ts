import * as vscode from "vscode";
import { TranslationIndex } from "../translation-index";

/**
 * Provides go-to-definition for translation keys, jumping to the JSON file
 * where the key is defined.
 */
export class TranslationDefinitionProvider
  implements vscode.DefinitionProvider
{
  constructor(private readonly index: TranslationIndex) {}

  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.LocationLink[] | undefined {
    const key = this.extractKeyAtPosition(document, position);
    if (!key) {
      return undefined;
    }

    const defaultLocale = vscode.workspace
      .getConfiguration("intl-party")
      .get<string>("defaultLocale", "en");

    const entries = this.index.getEntries(key);
    if (entries.length === 0) {
      return undefined;
    }

    // Prefer the default locale entry, fall back to first available
    const sorted = entries.sort((a, b) => {
      if (a.locale === defaultLocale) return -1;
      if (b.locale === defaultLocale) return 1;
      return a.locale.localeCompare(b.locale);
    });

    // Build the origin selection range (the key string in the source file)
    const line = document.lineAt(position).text;
    const pattern = /\bt\(\s*["']([^"']+)["']/g;
    let originRange: vscode.Range | undefined;
    let found: RegExpExecArray | null;

    while ((found = pattern.exec(line)) !== null) {
      const keyStart = found.index + found[0].indexOf(found[1]);
      const keyEnd = keyStart + found[1].length;
      if (position.character >= keyStart && position.character <= keyEnd) {
        originRange = new vscode.Range(
          new vscode.Position(position.line, keyStart),
          new vscode.Position(position.line, keyEnd),
        );
        break;
      }
    }

    return sorted.map((entry) => {
      const targetUri = vscode.Uri.file(entry.filePath);
      // Point to the beginning of the file; a more advanced implementation
      // could parse the JSON to find the exact line.
      const targetRange = new vscode.Range(0, 0, 0, 0);

      return {
        originSelectionRange: originRange,
        targetUri,
        targetRange,
        targetSelectionRange: targetRange,
      } satisfies vscode.LocationLink;
    });
  }

  private extractKeyAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): string | undefined {
    const line = document.lineAt(position).text;
    const pattern = /\bt\(\s*["']([^"']+)["']/g;
    let found: RegExpExecArray | null;

    while ((found = pattern.exec(line)) !== null) {
      const keyStart = found.index + found[0].indexOf(found[1]);
      const keyEnd = keyStart + found[1].length;

      if (position.character >= keyStart && position.character <= keyEnd) {
        return found[1];
      }
    }

    return undefined;
  }
}
