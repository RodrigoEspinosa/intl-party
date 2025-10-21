# Agent Guidelines for Intl Party

## Commands

- **Build**: `pnpm build` or `turbo run build` (builds all packages)
- **Test**: `pnpm test` or `turbo run test` (runs all tests)
- **Single test**: `vitest run path/to/test.test.ts` or `vitest path/to/test.test.ts` for watch mode
- **Lint**: `pnpm lint` or `turbo run lint`
- **Typecheck**: `pnpm typecheck` or `turbo run typecheck`
- **Dev**: `pnpm dev` or `turbo run dev` (watch mode)

## Code Style

- **TypeScript**: Strict mode enabled, prefer explicit types over `any`
- **Imports**: Use workspace aliases (`@intl-party/core`, `@intl-party/react`, etc.)
- **Naming**: PascalCase for classes/components, camelCase for functions/variables
- **Error handling**: Use proper error boundaries and validation, avoid silent failures
- **React**: Use functional components with hooks, follow React 18+ patterns
- **Testing**: Vitest with jsdom environment, use `@testing-library/*` for React components
- **Linting**: ESLint with TypeScript rules, unused vars with `_` prefix allowed
- **Formatting**: Prettier configured, prefer const over let when possible

## Package Structure

- Core logic in `packages/core/src/`
- React integration in `packages/react/src/`
- Next.js integration in `packages/nextjs/src/`
- CLI tools in `packages/cli/src/`
- ESLint plugin in `packages/eslint-plugin/src/`
