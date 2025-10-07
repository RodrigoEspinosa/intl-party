import { Inter } from "next/font/google";
import { getLocale } from "@intl-party/nextjs/server";
import { ClientProvider } from "./client-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "IntlParty Next.js Example",
  description: "Example application using IntlParty with Next.js App Router",
};

const i18nConfig = {
  locales: ["en", "es", "fr", "de"],
  defaultLocale: "en",
  namespaces: ["common"],
  cookieName: "INTL_LOCALE",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Detect locale from cookies/headers without URL parameters
  const locale = await getLocale(i18nConfig);

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <ClientProvider locale={locale}>{children}</ClientProvider>
      </body>
    </html>
  );
}
