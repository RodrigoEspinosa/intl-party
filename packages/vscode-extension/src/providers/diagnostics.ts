import * as vscode from "vscode";
import { TranslationIndex } from "../translation-index";

/**
 * Provides diagnostics (warning squiggles) for translation keys that are
 * missing from one or more locales.
 */
export class TranslationDiagnosticsProvider implements vscode.Disposable {
  private readonly diagnosticCollection: vscode.DiagnosticCollection;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly index: TranslationIndex) {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("intl-party");

    // Refresh diagnostics when documents change
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        this.updateDiagnostics(e.document);
      }),
    );

    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => {
        this.updateDiagnostics(doc);
      }),
    );

    this.disposables.push(
      vscode.workspace.onDidCloseTextDocument((doc) => {
        this.diagnosticCollection.delete(doc.uri);
      }),
    );

    // Refresh when translation index changes
    this.disposables.push(
      this.index.onDidChange(() => {
        for (const editor of vscode.window.visibleTextEditors) {
          this.updateDiagnostics(editor.document);
        }
      }),
    );

    // Initial pass on open editors
    for (const editor of vscode.window.visibleTextEditors) {
      this.updateDiagnostics(editor.document);
    }
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }

  private updateDiagnostics(document: vscode.TextDocument): void {
    if (!this.isSupported(document)) {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();
    const pattern = /\bt\(\s*["']([^"']+)["']/g;
    let found: RegExpExecArray | null;

    const allKeys = new Set(this.index.getAllKeys());

    while ((found = pattern.exec(text)) !== null) {
      const key = found[1];
      const keyOffset = found.index + found[0].indexOf(key);
      const startPos = document.positionAt(keyOffset);
      const endPos = document.positionAt(keyOffset + key.length);
      const range = new vscode.Range(startPos, endPos);

      if (!allKeys.has(key)) {
        // Key not found in any locale
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Translation key "${key}" not found in any locale`,
            vscode.DiagnosticSeverity.Error,
          ),
        );
      } else {
        // Check for missing locales
        const missing = this.index.getMissingLocales(key);
        if (missing.length > 0) {
          diagnostics.push(
            new vscode.Diagnostic(
              range,
              `Translation key "${key}" is missing in: ${missing.join(", ")}`,
              vscode.DiagnosticSeverity.Warning,
            ),
          );
        }
      }
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  private isSupported(document: vscode.TextDocument): boolean {
    const supported = [
      "typescript",
      "typescriptreact",
      "javascript",
      "javascriptreact",
    ];
    return supported.includes(document.languageId);
  }
}
