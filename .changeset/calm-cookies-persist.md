---
"@intl-party/core": patch
---

Ignore malformed locale cookie encoding so detection can continue to later strategies. Persist locale changes when sessionStorage is configured, with storage failures reported through the existing error handler. Remove an unreachable unused-key validation loop.
