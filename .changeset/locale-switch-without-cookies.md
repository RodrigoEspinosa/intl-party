---
"@intl-party/nextjs": patch
---

The locale switcher now works when the browser refuses the locale cookie, for example in a cross-site iframe like an online sandbox's preview, or with cookies blocked. Before, clicking did nothing in clean-URL mode. Inside HTTPS iframes the cookie is now set with `SameSite=None; Secure`. If the cookie still isn't stored, switching does a full page load with `?locale=<new>`.
