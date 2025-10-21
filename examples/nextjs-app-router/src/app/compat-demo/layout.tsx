import { getLocale } from "@intl-party/nextjs/server";
import { CompatClientWrapper } from "./client-wrapper";

const config = {
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  namespaces: ["_flat"],
};

export default async function CompatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current locale from cookies/headers
  const locale = await getLocale(config);

  return (
    <div>
      <h2>Next-intl Compatibility Demo</h2>
      <p>
        Current locale: <strong>{locale}</strong> (from cookies)
      </p>

      <CompatClientWrapper locale={locale}>{children}</CompatClientWrapper>
    </div>
  );
}
