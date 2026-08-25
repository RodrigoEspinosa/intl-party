---
"@intl-party/core": patch
---

Fix `createStableCacheKey` collapsing every set of interpolated values into one cache key.

`JSON.stringify`'s array replacer is an allow-list applied at every depth, so
`interpolation`'s own keys were filtered out and all interpolated values
serialised identically. `TranslationStore.getTranslation` derives its cache key
from that string, so the first value rendered for a key was cached and returned
for every later call regardless of the values passed.

Anything with a live count, total, timer, or name went stale after first paint.
The fix landed on master in aa058aa (#29) but was never published; `latest`
(1.3.0) still carries the bug.

Closes #33.
