import React, { ReactNode, Fragment, useMemo } from "react";
import { useTranslations } from "../hooks/useTranslations";
import type {
  TranslationKey,
  TranslationOptions,
  Namespace,
} from "@intl-party/core";

export interface TransProps {
  i18nKey: TranslationKey;
  namespace?: Namespace;
  values?: Record<string, any>;
  components?: Record<string, ReactNode>;
  count?: number;
  fallback?: string;
  children?: ReactNode;
}

// Component for rendering translations with React components
export function Trans({
  i18nKey,
  namespace,
  values = {},
  components = {},
  count,
  fallback,
  children,
}: TransProps) {
  const t = useTranslations(namespace);

  const rendered = useMemo(() => {
    const options: TranslationOptions = {
      interpolation: values,
      count,
      fallback,
    };

    const translation = t(i18nKey, options);

    // If no components are provided, return plain text
    if (Object.keys(components).length === 0) {
      return translation;
    }

    // Parse and render with components
    return parseTranslationWithComponents(translation, components);
  }, [t, i18nKey, values, components, count, fallback]);

  if (typeof rendered === "string") {
    return <Fragment>{rendered}</Fragment>;
  }

  return <Fragment>{rendered}</Fragment>;
}

// Helper function to parse translation with React components
function parseTranslationWithComponents(
  text: string,
  components: Record<string, ReactNode>,
): ReactNode[] {
  const parts: ReactNode[] = [];
  let currentIndex = 0;

  // Regular expression to find component placeholders like <0>text</0> or <tag>text</tag>
  const componentRegex = /<(\w+)>(.*?)<\/\1>/g;
  let match;

  while ((match = componentRegex.exec(text)) !== null) {
    const [fullMatch, componentKey, content] = match;
    const matchStart = match.index;

    // Add text before the component
    if (matchStart > currentIndex) {
      parts.push(text.slice(currentIndex, matchStart));
    }

    // Add the component
    if (components[componentKey]) {
      if (React.isValidElement(components[componentKey])) {
        parts.push(
          React.cloneElement(
            components[componentKey] as React.ReactElement,
            { key: parts.length },
            content,
          ),
        );
      } else {
        parts.push(components[componentKey]);
      }
    } else {
      // Fallback to plain text if component not found
      parts.push(content);
    }

    currentIndex = matchStart + fullMatch.length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.slice(currentIndex));
  }

  return parts.length > 0 ? parts : [text];
}

