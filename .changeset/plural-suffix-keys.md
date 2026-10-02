---
"@intl-party/core": minor
---

Support i18next-style plural keys. With a `count`, `t("items", { count })` now resolves `items_zero` (for 0), then `items_<category>` using the locale's plural rules (`one`, `few`, `many`, …), then `items_other`. So react-i18next message files work unchanged. An exact `items` key still takes precedence.

In development, a one-time warning now explains that ICU plural/select messages need the optional `intl-messageformat` package. Before, they rendered their raw ICU text without explanation.
