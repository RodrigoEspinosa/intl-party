import type { TSESTree } from "@typescript-eslint/utils";

const TRANSLATION_HOOKS = new Set([
  "useTranslations",
  "useScopedTranslations",
  "useZeroTranslations",
]);

/**
 * Tracks translators created by hooks, e.g. `const t = useTranslations("common")`,
 * so rules can resolve `t("navigation.home")` inside the "common" namespace
 * instead of reading "navigation" as a namespace.
 *
 * Bindings are keyed by variable name for the whole file, which is enough for
 * the usual one-translator-per-component pattern.
 */
export class TranslatorBindings {
  private namespaces = new Map<string, string | null>();

  /** Call from a `VariableDeclarator` visitor. */
  record(node: TSESTree.VariableDeclarator): void {
    if (node.id.type !== "Identifier") return;
    const init = node.init;
    if (
      init?.type !== "CallExpression" ||
      init.callee.type !== "Identifier" ||
      !TRANSLATION_HOOKS.has(init.callee.name)
    ) {
      return;
    }

    const [arg] = init.arguments;
    const namespace =
      arg?.type === "Literal" && typeof arg.value === "string"
        ? arg.value
        : null;
    this.namespaces.set(node.id.name, namespace);
  }

  /** Whether `name` holds a translator created by a translation hook. */
  isTranslator(name: string): boolean {
    return this.namespaces.has(name);
  }

  /**
   * The namespace a translator is scoped to, or null when it isn't scoped
   * (no hook binding, or a hook called without a literal namespace).
   */
  namespaceOf(name: string): string | null {
    return this.namespaces.get(name) ?? null;
  }
}
