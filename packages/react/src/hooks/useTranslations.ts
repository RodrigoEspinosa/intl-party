import { useCallback, useMemo } from "react";
import { useI18nContext } from "../context/I18nContext";
import type {
  TranslationKey,
  TranslationOptions,
  TranslationFunction,
  Namespace,
} from "@intl-party/core";

// Basic useTranslations hook
export function useTranslations(namespace?: Namespace): TranslationFunction {
  const { i18n, namespace: currentNamespace } = useI18nContext();

  const targetNamespace = namespace || currentNamespace;

  return useCallback(
    (key: TranslationKey, options?: TranslationOptions) => {
      return i18n.t(key, { ...options, namespace: targetNamespace });
    },
    [i18n, targetNamespace],
  );
}

// Hook for scoped translations (automatically bound to namespace)
export function useScopedTranslations(
  namespace: Namespace,
): TranslationFunction {
  const { i18n } = useI18nContext();

  return useMemo(() => {
    return i18n.createScopedTranslator(namespace);
  }, [i18n, namespace]);
}

// Hook for multiple namespaces
export function useMultipleTranslations(
  namespaces: Namespace[],
): Record<Namespace, TranslationFunction> {
  const { i18n } = useI18nContext();

  return useMemo(() => {
    const translators: Record<Namespace, TranslationFunction> = {};

    for (const namespace of namespaces) {
      translators[namespace] = i18n.createScopedTranslator(namespace);
    }

    return translators;
  }, [i18n, namespaces]);
}

// Hook for checking if translation exists
export function useHasTranslation(): (
  key: TranslationKey,
  namespace?: Namespace,
) => boolean {
  const { i18n, namespace: currentNamespace } = useI18nContext();

  return useCallback(
    (key: TranslationKey, namespace?: Namespace) => {
      const targetNamespace = namespace || currentNamespace;
      return i18n.hasTranslation(key, targetNamespace);
    },
    [i18n, currentNamespace],
  );
}

