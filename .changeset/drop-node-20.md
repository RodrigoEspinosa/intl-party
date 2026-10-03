---
"@intl-party/core": minor
"@intl-party/client": minor
"@intl-party/react": minor
"@intl-party/nextjs": minor
"@intl-party/react-native": minor
"@intl-party/cli": minor
"@intl-party/eslint-plugin": minor
---

Require Node.js 22.12 or later. Node 20 reached end of life in April 2026.

- `@intl-party/cli`: update commander, chalk, chokidar, glob, ora and inquirer to their latest majors (bundled into the CLI, so nothing changes for users).
- `@intl-party/core`, `@intl-party/nextjs`: update `@formatjs/intl-localematcher` to 0.9.
- `@intl-party/nextjs`: update chokidar to 5. The client entry now uses the automatic JSX runtime (`react/jsx-runtime`), the same as `@intl-party/react`.
