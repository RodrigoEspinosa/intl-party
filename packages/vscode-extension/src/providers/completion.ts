import * as vscode from "vscode";
import { TranslationIndex } from "../translation-index";

/**
 * Provides autocomplete suggestions for translation keys when the cursor
 * is inside a t("...") or t('...') call.
 */
export class TranslationCompletionProvider
  implements vscode.CompletionItemProvider
{
  constructor(private readonly index: TranslationIndex) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.CompletionItem[] | undefined {
    const lineText = document.lineAt(position).text;
    const linePrefix = lineText.substring(0, position.character);

    // Match t(", t(', useTranslation and then t(" patterns
    const tCallMatch = linePrefix.match(/\bt\(\s*["']([^"']*)$/);
    if (!tCallMatch) {
      return undefined;
    }

    const typedPrefix = tCallMatch[1];
    const defaultLocale = vscode.workspace
      .getConfiguration("intl-party")
      .get<string>("defaultLocale", "en");

    const keys = this.index.getAllKeys();

    return keys
      .filter((key) => key.startsWith(typedPrefix))
      .map((key) => {
        const item = new vscode.CompletionItem(
          key,
          vscode.CompletionItemKind.Text,
        );

        const value = this.index.getValue(key, defaultLocale);
        if (value) {
          item.detail = value;
          item.documentation = new vscode.MarkdownString(
            `**${defaultLocale}**: ${value}`,
          );
        }

        // Sort matched keys by length so shorter (more specific) keys rank higher
        item.sortText = String(key.length).padStart(5, "0") + key;

        return item;
      });
  }
}
