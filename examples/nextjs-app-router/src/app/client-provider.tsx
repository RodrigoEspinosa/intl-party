"use client";

// Zero-config client provider - everything auto-detected
import { Provider } from "@intl-party/nextjs";

export function ClientProvider({
  locale,
  initialData,
  children,
}: {
  locale: string;
  initialData?: any;
  children: React.ReactNode;
}) {
  return (
    <Provider locale={locale} initialMessages={initialData}>
      {children}
    </Provider>
  );
}
