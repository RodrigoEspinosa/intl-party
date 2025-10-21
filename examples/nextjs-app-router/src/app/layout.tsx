import { Inter } from "next/font/google";
import { Provider } from "@intl-party/nextjs/client";
import "./globals.css";

export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "IntlParty Next.js Example",
  description:
    "Example application using zero-config IntlParty with Next.js App Router",
};

// Load messages server-side for all locales
async function loadMessages() {
  try {
    // Try to load from generated files in node_modules (Prisma-style)
    const { defaultMessages } = await import(".intl-party/messages.generated");
    return defaultMessages;
  } catch {
    // Fallback to loading from messages directory for all locales
    const { loadMessagesForLocale } = await import("@intl-party/nextjs/server");
    const locales = ["en", "es", "fr", "de"];
    const messages: Record<string, any> = {};

    for (const locale of locales) {
      try {
        messages[locale] = await loadMessagesForLocale(locale, {
          messagesPath: "./messages",
          namespaces: ["common"],
        });
      } catch (error) {
        console.warn(`Failed to load messages for ${locale}:`, error);
        messages[locale] = {};
      }
    }

    return messages;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await loadMessages();

  return (
    <html>
      <body>
        <Provider
          initialMessages={messages as Record<string, Record<string, any>>}
        >
          {children}
        </Provider>
      </body>
    </html>
  );
}
