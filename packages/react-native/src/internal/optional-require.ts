/**
 * Loads an optional module in a way that works in both React Native (Metro)
 * and Node ESM tooling (Expo web, scripts).
 *
 * `literalLoad` must contain a *literal* `require("the-module")` call so Metro
 * can statically see and bundle the dependency. In the ESM build esbuild
 * rewrites that bare `require` into a shim that throws when called; we catch
 * that and fall back to `module.createRequire`, which resolves the module from
 * the consumer's node_modules.
 *
 * Returns the loaded module, or `null` if it isn't installed in either path.
 */
export function optionalRequire<T = unknown>(
  id: string,
  literalLoad: () => T,
): T | null {
  try {
    return literalLoad();
  } catch {
    // Fall through to the Node ESM strategy.
  }

  try {
    const proc = (
      globalThis as {
        process?: { getBuiltinModule?: (id: string) => unknown };
      }
    ).process;
    const getBuiltin = proc?.getBuiltinModule;
    if (typeof getBuiltin !== "function") return null;

    const moduleBuiltin = getBuiltin("module") as
      | { createRequire?: (filename: string) => (id: string) => unknown }
      | undefined;
    if (!moduleBuiltin?.createRequire) return null;

    // import.meta.url is only defined in the ESM build, which is the only
    // build that reaches this fallback.
    const base =
      typeof import.meta !== "undefined" ? import.meta.url : undefined;
    if (!base) return null;

    return moduleBuiltin.createRequire(base)(id) as T;
  } catch {
    return null;
  }
}
