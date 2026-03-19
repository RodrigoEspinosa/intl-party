import { useI18nContext } from "../context/I18nContext";
import type { Namespace } from "@intl-party/core";

// Hook for current namespace
export function useNamespace(): [Namespace, (namespace: Namespace) => void] {
  const { namespace, setNamespace } = useI18nContext();

  return [namespace, setNamespace];
}
