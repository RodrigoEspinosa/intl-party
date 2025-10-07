# IntlParty Examples

This directory contains various examples showcasing different use cases and features of IntlParty.

## Available Examples

### 🚀 [Next.js App Router](./nextjs-app-router/)

**Cookie-based locale storage with clean URLs**

The main example demonstrating:

- Cookie-based locale persistence without URL changes
- Real-time language switching
- Next.js App Router integration
- Server-side locale detection
- Modern dark UI with minimal design

```bash
cd examples/nextjs-app-router
pnpm install
pnpm dev
```

## Planned Examples

### 📱 Basic React Example

Simple React app showing core IntlParty features:

- Basic translation hooks
- Client-side locale switching
- TypeScript integration

### 🔗 URL-based Routing Example

Next.js example with locale in URLs:

- `/en/page` vs `/es/page` routing
- Automatic locale detection from URLs
- SEO-friendly internationalized routes

### 🖥️ Server-Side Rendering Example

Advanced SSR patterns:

- Server-side translation loading
- Hydration without layout shifts
- Performance optimizations

### 🔄 Migration Example

Demonstrates migrating from next-intl:

- Side-by-side comparison
- Drop-in replacement patterns
- Migration best practices

## Getting Started

Each example includes:

- Complete setup instructions
- Focused demonstration of specific features
- Clear, commented code
- README with explanations

Choose the example that best matches your use case and requirements.

## Contributing

To add a new example:

1. Create a new directory under `examples/`
2. Include a complete, runnable application
3. Add clear documentation
4. Focus on one primary use case
5. Keep it simple and educational
