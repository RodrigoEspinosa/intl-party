import { useCallback, useMemo } from "react";
import {
  useI18nContext,
  useTypedI18nContext,
  type TypedI18nContextValue,
} from "../context/I18nContext";
import type {
  TranslationKey,
  TranslationOptions,
  TranslationFunction,
  TypedTranslationFunction,
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

// Typed version of useTranslations
export function useTypedTranslations<T extends Record<string, any>>(
  namespace?: Namespace,
): TypedTranslationFunction<T> {
  const { i18n, namespace: currentNamespace } = useTypedI18nContext<T>();

  const targetNamespace = namespace || currentNamespace;

  return useCallback(
    (key: string, options?: TranslationOptions) => {
      return i18n.t(key as TranslationKey, {
        ...options,
        namespace: targetNamespace,
      });
    },
    [i18n, targetNamespace],
  );
}

// Alias for shorter usage
export const useT = useTranslations;
export const useTypedT = useTypedTranslations;

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

// Hook for conditional translations (returns undefined if key doesn't exist)
export function useOptionalTranslation(
  key: TranslationKey,
  namespace?: Namespace,
  options?: TranslationOptions,
): string | undefined {
  const { i18n, namespace: currentNamespace } = useI18nContext();

  const targetNamespace = namespace || currentNamespace;

  return useMemo(() => {
    if (i18n.hasTranslation(key, targetNamespace)) {
      return i18n.t(key, { ...options, namespace: targetNamespace });
    }
    return undefined;
  }, [i18n, key, targetNamespace, options]);
}

// Hook for translation with fallback
export function useTranslationWithFallback(
  key: TranslationKey,
  fallback: string,
  namespace?: Namespace,
  options?: TranslationOptions,
): string {
  const { i18n, namespace: currentNamespace } = useI18nContext();

  const targetNamespace = namespace || currentNamespace;

  return useMemo(() => {
    return i18n.t(key, {
      ...options,
      namespace: targetNamespace,
      fallback,
    });
  }, [i18n, key, fallback, targetNamespace, options]);
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

// Hook for getting raw translation value
export function useTranslationValue(): (
  key: TranslationKey,
  namespace?: Namespace,
) => any {
  const { i18n, namespace: currentNamespace } = useI18nContext();

  return useCallback(
    (key: TranslationKey, namespace?: Namespace) => {
      const targetNamespace = namespace || currentNamespace;
      return i18n.getTranslation(key, targetNamespace);
    },
    [i18n, currentNamespace],
  );
}

// Hook for interpolated translations with reactive dependencies
export function useInterpolatedTranslation(
  key: TranslationKey,
  variables: Record<string, any>,
  namespace?: Namespace,
): string {
  const t = useTranslations(namespace);

  return useMemo(() => {
    return t(key, { interpolation: variables });
  }, [t, key, variables]);
}

// Hook for pluralized translations
export function usePluralization(
  key: TranslationKey,
  count: number,
  namespace?: Namespace,
  additionalOptions?: Omit<TranslationOptions, "count">,
): string {
  const t = useTranslations(namespace);

  return useMemo(() => {
    return t(key, { ...additionalOptions, count });
  }, [t, key, count, additionalOptions]);
}
