---
"@intl-party/nextjs": patch
---

The middleware now passes the resolved locale to the current request, so `?locale=` links and newly detected locales render correctly on the first request instead of from the next navigation (#45).
