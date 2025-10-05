import { useCallback, useMemo } from "react";
import { useI18nContext } from "../context/I18nContext";
import type { Namespace } from "@intl-party/core";

// Hook for current namespace
export function useNamespace(): [Namespace, (namespace: Namespace) => void] {
  const { namespace, setNamespace } = useI18nContext();

  return [namespace, setNamespace];
}

// Hook for namespace information
export function useNamespaceInfo() {
  const { namespace, i18n } = useI18nContext();

  return useMemo(() => {
    const availableNamespaces = i18n.getAvailableNamespaces();

    return {
      current: namespace,
      available: availableNamespaces,
      isAvailable: availableNamespaces.includes(namespace),
    };
  }, [namespace, i18n]);
}

// Hook for namespace switching with validation
export function useNamespaceSwitch() {
  const { i18n, setNamespace } = useI18nContext();

  const switchNamespace = useCallback(
    (namespace: Namespace) => {
      const availableNamespaces = i18n.getAvailableNamespaces();

      if (!availableNamespaces.includes(namespace)) {
        throw new Error(
          `Namespace "${namespace}" is not available. Available namespaces: ${availableNamespaces.join(", ")}`,
        );
      }

      setNamespace(namespace);
    },
    [i18n, setNamespace],
  );

  const isNamespaceAvailable = useCallback(
    (namespace: Namespace) => {
      return i18n.getAvailableNamespaces().includes(namespace);
    },
    [i18n],
  );

  return {
    switchNamespace,
    isNamespaceAvailable,
    availableNamespaces: i18n.getAvailableNamespaces(),
  };
}

// Hook for multiple namespace management
export function useMultipleNamespaces(namespaces: Namespace[]) {
  const { i18n } = useI18nContext();

  const translators = useMemo(() => {
    return namespaces.reduce(
      (acc, ns) => {
        acc[ns] = i18n.createScopedTranslator(ns);
        return acc;
      },
      {} as Record<Namespace, ReturnType<typeof i18n.createScopedTranslator>>,
    );
  }, [i18n, namespaces]);

  const isAllAvailable = useMemo(() => {
    const available = i18n.getAvailableNamespaces();
    return namespaces.every((ns) => available.includes(ns));
  }, [i18n, namespaces]);

  const getMissingNamespaces = useCallback(() => {
    const available = i18n.getAvailableNamespaces();
    return namespaces.filter((ns) => !available.includes(ns));
  }, [i18n, namespaces]);

  return {
    translators,
    isAllAvailable,
    getMissingNamespaces,
  };
}

// Hook for namespace preloading
export function useNamespacePreloading() {
  const { i18n, locale } = useI18nContext();

  const preloadNamespace = useCallback(
    async (namespace: Namespace) => {
      await i18n.preloadTranslations(locale, namespace);
    },
    [i18n, locale],
  );

  const preloadNamespaces = useCallback(
    async (namespaces: Namespace[]) => {
      await i18n.preloadTranslations(locale, namespaces);
    },
    [i18n, locale],
  );

  return {
    preloadNamespace,
    preloadNamespaces,
  };
}
