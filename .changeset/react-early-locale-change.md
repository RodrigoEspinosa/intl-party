---
"@intl-party/react": patch
---

`I18nProvider` no longer loses a locale or namespace change made right after it first renders. It subscribed to the i18n instance in an effect, which runs after paint, so a `setLocale` in that window (for example a tap on a locale switcher shown right after mount) changed the instance but never updated the UI or called `onLocaleChange`. The provider now catches up when it subscribes. This also applies to `@intl-party/react-native`, which uses this provider.
