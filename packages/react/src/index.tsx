import React from "react";

// Context exports
export {
  I18nProvider,
  TypedI18nProvider,
  ScopedI18nProvider,
  useI18nContext,
  useTypedI18nContext,
  withI18n,
  type I18nContextValue,
  type TypedI18nContextValue,
  type I18nProviderProps,
  type TypedI18nProviderProps,
  type ScopedI18nProviderProps,
  type WithI18nProps,
} from "./context/I18nContext";

// Hooks exports
export {
  useTranslations,
  useTypedTranslations,
  useT,
  useTypedT,
  useScopedTranslations,
  useMultipleTranslations,
  useOptionalTranslation,
  useTranslationWithFallback,
  useHasTranslation,
  useTranslationValue,
  useInterpolatedTranslation,
  usePluralization,
} from "./hooks/useTranslations";

// Import for internal use
import { useTypedTranslations } from "./hooks/useTranslations";
import { ScopedI18nProvider } from "./context/I18nContext";

export {
  useLocale,
  useLocaleInfo,
  useLocaleSwitch,
  useBrowserLocale,
  useLocalePreference,
  useDirection,
  useFormatting,
} from "./hooks/useLocale";

export {
  useNamespace,
  useNamespaceInfo,
  useNamespaceSwitch,
  useMultipleNamespaces,
  useNamespacePreloading,
} from "./hooks/useNamespace";

// Component exports
export {
  Trans,
  ConditionalTrans,
  PluralTrans,
  RichTrans,
  type TransProps,
  type ConditionalTransProps,
  type PluralTransProps,
  type RichTransProps,
} from "./components/Trans";

export {
  LocaleSelector,
  FlagLocaleSelector,
  CompactLocaleSelector,
  AccessibleLocaleSelector,
  type LocaleSelectorProps,
  type FlagLocaleSelectorProps,
  type CompactLocaleSelectorProps,
  type AccessibleLocaleSelectorProps,
} from "./components/LocaleSelector";

// Re-export core types and utilities for convenience
export type {
  I18nConfig,
  I18nInstance,
  TypedI18nInstance,
  Locale,
  Namespace,
  TranslationKey,
  TranslationValue,
  Translations,
  TranslationOptions,
  TranslationFunction,
  TypedTranslationFunction,
  DeepKeyOf,
} from "@intl-party/core";

// Version
export const VERSION = "0.1.0";

// ============================================================================
// NEXT-INTL COMPATIBILITY
// ============================================================================
// Our useTranslations(namespace?) hook is already compatible with next-intl!
// No additional exports needed - just use the existing useTranslations hook:
//
// import { useTranslations, useLocale } from '@intl-party/react';
//
// function MyComponent() {
//   const t = useTranslations('navigation'); // With namespace
//   const tGlobal = useTranslations(); // Without namespace
//   const locale = useLocale();
//
//   return <h1>{t('title')}</h1>; // Works exactly like next-intl
// }

// React-specific utilities
export function createI18nHook<T extends Record<string, any>>() {
  return {
    useTranslations: useTypedTranslations<T>,
    useT: useTypedTranslations<T>,
  };
}

// Higher-order component factory for specific translation namespaces
export function createNamespaceHOC(namespace: string) {
  return function withNamespace<P extends object>(
    Component: React.ComponentType<P>,
  ): React.ComponentType<P> {
    return function NamespacedComponent(props: P) {
      return (
        <ScopedI18nProvider namespace={namespace}>
          <Component {...props} />
        </ScopedI18nProvider>
      );
    };
  };
}

// Error boundary for i18n-related errors
export class I18nErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <div
          style={{
            padding: "1rem",
            border: "1px solid red",
            borderRadius: "4px",
          }}
        >
          <h3>Translation Error</h3>
          <p>Something went wrong with translations.</p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error.message}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
