import * as vscode from "vscode";
import { TranslationIndex } from "../translation-index";

/**
 * Shows translation values on hover when the cursor is over a translation key
 * inside a t("...") call.
 */
export class TranslationHoverProvider implements vscode.HoverProvider {
  constructor(private readonly index: TranslationIndex) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.Hover | undefined {
    const key = this.extractKeyAtPosition(document, position);
    if (!key) {
      return undefined;
    }

    const entries = this.index.getEntries(key);
    if (entries.length === 0) {
      return undefined;
    }

    const lines = entries.map(
      (entry) => `**${entry.locale}**: ${entry.value}`,
    );

    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`### Translation: \`${key}\`\n\n`);
    markdown.appendMarkdown(lines.join("\n\n"));

    const missingLocales = this.index.getMissingLocales(key);
    if (missingLocales.length > 0) {
      markdown.appendMarkdown(
        `\n\n---\n\n*Missing in: ${missingLocales.join(", ")}*`,
      );
    }

    return new vscode.Hover(markdown);
  }

  private extractKeyAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): string | undefined {
    const line = document.lineAt(position).text;

    // Find all t("key") or t('key') occurrences in the line
    const pattern = /\bt\(\s*["']([^"']+)["']/g;
    let result: RegExpExecArray | null;

    while ((result = pattern.exec(line)) !== null) {
      const keyStart = result.index + result[0].indexOf(result[1]);
      const keyEnd = keyStart + result[1].length;

      if (position.character >= keyStart && position.character <= keyEnd) {
        return result[1];
      }
    }

    return undefined;
  }
}
