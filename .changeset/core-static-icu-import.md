---
"@intl-party/core": patch
"@intl-party/client": patch
---

Fix ICU plurals and selects rendering as raw text in browser bundles. Core loaded `intl-messageformat` with a lazy `require`, which the ESM build turns into a throwing shim, so client components fell back to unformatted messages even with the package installed. Core now imports it statically and lists it as a regular dependency, so `npm install intl-messageformat` is no longer needed. You can remove it from your own dependencies unless you use it directly.
