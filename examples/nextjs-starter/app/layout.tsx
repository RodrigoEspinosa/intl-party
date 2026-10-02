import { createSetup } from "@intl-party/nextjs";
import config from "../intl-party.config";

const { getLocale, getMessages, Provider, routing } = createSetup(config);

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <Provider locale={locale} initialMessages={messages} routing={routing}>
          {children}
        </Provider>
      </body>
    </html>
  );
}