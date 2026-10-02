import { createSetup } from "@intl-party/nextjs";
import intlConfig from "./intl-party.config";

const { middleware } = createSetup(intlConfig);

export { middleware as proxy };

// Next.js reads this at build time, so it must stay a static literal.
export const config = {
  matcher: ["/((?!api|_next|_vercel|favicon\\.ico).*)", "/"],
};
