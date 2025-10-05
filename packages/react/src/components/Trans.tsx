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

// Component for conditional rendering based on translation existence
export interface ConditionalTransProps extends TransProps {
  when?: boolean;
  fallbackComponent?: ReactNode;
}

export function ConditionalTrans({
  when = true,
  fallbackComponent,
  ...transProps
}: ConditionalTransProps) {
  if (!when) {
    return <Fragment>{fallbackComponent}</Fragment>;
  }

  return <Trans {...transProps} />;
}

// Component for pluralized translations
export interface PluralTransProps extends Omit<TransProps, "count"> {
  count: number;
  zero?: TranslationKey;
  one?: TranslationKey;
  other?: TranslationKey;
}

export function PluralTrans({
  count,
  zero,
  one,
  other,
  i18nKey,
  ...props
}: PluralTransProps) {
  const selectedKey = useMemo(() => {
    if (count === 0 && zero) return zero;
    if (count === 1 && one) return one;
    if (other) return other;
    return i18nKey;
  }, [count, zero, one, other, i18nKey]);

  return (
    <Trans
      {...props}
      i18nKey={selectedKey}
      count={count}
      values={{ count, ...props.values }}
    />
  );
}

// Component for rich text translations
export interface RichTransProps extends TransProps {
  allowedTags?: string[];
  sanitize?: boolean;
}

export function RichTrans({
  allowedTags = ["strong", "em", "br", "span"],
  sanitize = true,
  ...transProps
}: RichTransProps) {
  const t = useTranslations(transProps.namespace);

  const rendered = useMemo(() => {
    const translation = t(transProps.i18nKey, {
      interpolation: transProps.values,
      count: transProps.count,
      fallback: transProps.fallback,
    });

    if (sanitize) {
      // Basic HTML sanitization - in production, use a proper sanitization library
      const sanitized = translation.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        "",
      );
      return parseHTMLString(sanitized, allowedTags);
    }

    return parseHTMLString(translation, allowedTags);
  }, [t, transProps, allowedTags, sanitize]);

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

// Helper function to parse HTML string safely
function parseHTMLString(html: string, allowedTags: string[]): ReactNode {
  // This is a very basic HTML parser for demonstration
  // In production, use a proper HTML parsing library like html-react-parser

  if (!allowedTags.length) {
    return html;
  }

  // Basic implementation - replace with proper HTML parser
  const tagRegex = new RegExp(
    `<(/?)(${allowedTags.join("|")})(?:\\s[^>]*)?>`,
    "gi",
  );

  const parts = html.split(tagRegex).filter(Boolean);
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < parts.length) {
    const part = parts[i];

    if (allowedTags.some((tag) => part.toLowerCase() === tag)) {
      // Opening tag
      const tag = part.toLowerCase();
      let content = "";
      let depth = 1;
      i++;

      while (i < parts.length && depth > 0) {
        const nextPart = parts[i];
        if (nextPart === "/") {
          i++;
          if (i < parts.length && parts[i].toLowerCase() === tag) {
            depth--;
            i++;
          }
        } else if (allowedTags.some((t) => nextPart.toLowerCase() === t)) {
          depth++;
          content += `<${nextPart}>`;
          i++;
        } else {
          content += nextPart;
          i++;
        }
      }

      elements.push(
        React.createElement(tag, { key: elements.length }, content),
      );
    } else {
      elements.push(part);
      i++;
    }
  }

  return elements.length === 1 ? elements[0] : elements;
}
