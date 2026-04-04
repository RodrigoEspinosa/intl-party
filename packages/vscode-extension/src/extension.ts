import * as vscode from "vscode";
import { TranslationIndex } from "./translation-index";
import { TranslationCompletionProvider } from "./providers/completion";
import { TranslationHoverProvider } from "./providers/hover";
import { TranslationDiagnosticsProvider } from "./providers/diagnostics";
import { TranslationDefinitionProvider } from "./providers/definition";

let index: TranslationIndex;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  index = new TranslationIndex();
  await index.initialize();

  const selector: vscode.DocumentSelector = [
    { scheme: "file", language: "typescript" },
    { scheme: "file", language: "typescriptreact" },
    { scheme: "file", language: "javascript" },
    { scheme: "file", language: "javascriptreact" },
  ];

  // Completion provider triggered inside t(" contexts
  const completionProvider = new TranslationCompletionProvider(index);
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      selector,
      completionProvider,
      '"',
      "'",
      ".",
    ),
  );

  // Hover provider
  const hoverProvider = new TranslationHoverProvider(index);
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, hoverProvider),
  );

  // Diagnostics
  const diagnosticsProvider = new TranslationDiagnosticsProvider(index);
  context.subscriptions.push(diagnosticsProvider);

  // Go-to-definition
  const definitionProvider = new TranslationDefinitionProvider(index);
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, definitionProvider),
  );

  // Refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand("intl-party.refreshIndex", async () => {
      await index.refresh();
      vscode.window.showInformationMessage(
        "intl-party: Translation index refreshed",
      );
    }),
  );

  context.subscriptions.push(index);
}

export function deactivate(): void {
  index?.dispose();
}
