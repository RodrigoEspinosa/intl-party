# Contributing to IntlParty

Thank you for your interest in contributing to IntlParty! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- Git

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/intl-party.git
   cd intl-party
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Build Packages**

   ```bash
   pnpm build
   ```

4. **Run Tests**
   ```bash
   pnpm test
   ```

### Project Structure

```
intl-party/
├── packages/
│   ├── core/           # @intl-party/core - Core library
│   ├── react/          # @intl-party/react - React integration
│   ├── nextjs/         # @intl-party/nextjs - Next.js integration
│   ├── cli/            # @intl-party/cli - CLI tools
│   └── eslint-plugin/  # @intl-party/eslint-plugin - ESLint rules
├── examples/           # Example applications
├── docs/              # Documentation
└── apps/              # Internal tooling
```

## 🛠️ Development Workflow

### Making Changes

1. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Your Changes**
   - Write code following our style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**

   ```bash
   # Run all tests
   pnpm test

   # Run tests for specific package
   pnpm test --filter @intl-party/core

   # Run type checking
   pnpm typecheck

   # Run linting
   pnpm lint
   ```

4. **Build and Verify**
   ```bash
   pnpm build
   ```

### Code Style

We use the following tools to maintain code quality:

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Vitest** for testing

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat(core): add advanced locale detection
fix(react): resolve hook dependency issue
docs: update getting started guide
test(cli): add validation command tests
```

## 📝 Pull Request Process

1. **Ensure Tests Pass**

   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   ```

2. **Update Documentation**
   - Update relevant documentation in `/docs`
   - Update README files if needed
   - Add JSDoc comments for new APIs

3. **Create Pull Request**
   - Use a descriptive title
   - Reference related issues
   - Provide detailed description of changes
   - Include screenshots for UI changes

4. **Review Process**
   - Automated checks must pass
   - At least one maintainer review required
   - Address feedback promptly

## 🧪 Testing

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Specific package
pnpm test --filter @intl-party/core

# Coverage report
pnpm test:coverage
```

### Writing Tests

- Place test files next to source files with `.test.ts` or `.spec.ts` extension
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies appropriately

**Example:**

```typescript
import { describe, it, expect } from "vitest";
import { createI18n } from "../src";

describe("createI18n", () => {
  it("should create an i18n instance with default configuration", () => {
    // Arrange
    const config = {
      locales: ["en", "es"],
      defaultLocale: "en",
      namespaces: ["common"],
    };

    // Act
    const i18n = createI18n(config);

    // Assert
    expect(i18n.getLocale()).toBe("en");
    expect(i18n.getAvailableLocales()).toEqual(["en", "es"]);
  });
});
```

## 📚 Documentation

### Writing Documentation

- Use clear, concise language
- Include code examples
- Provide use cases and best practices
- Keep documentation up to date with code changes

### Documentation Structure

- `/docs` - Main documentation
- `/examples` - Working examples
- Package READMEs - Package-specific documentation
- JSDoc comments - API documentation

## 🐛 Reporting Issues

### Bug Reports

Include the following information:

- **Description**: Clear description of the issue
- **Reproduction**: Steps to reproduce the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, Node.js version, package versions
- **Code Sample**: Minimal reproduction case

### Feature Requests

Include the following information:

- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other solutions considered
- **Additional Context**: Any other relevant information

## 🏗️ Architecture Guidelines

### Core Principles

1. **Type Safety**: Everything should be type-safe by default
2. **Performance**: Optimize for runtime performance
3. **Developer Experience**: Prioritize ease of use
4. **Modularity**: Keep packages focused and composable
5. **Backward Compatibility**: Avoid breaking changes when possible

### Package Dependencies

- **Core**: No external dependencies (except for locale matching)
- **React**: Depends on core, peer dependencies on React
- **Next.js**: Depends on core and React packages
- **CLI**: Can have external dependencies for tooling

### API Design

- Use consistent naming conventions
- Provide both simple and advanced APIs
- Include comprehensive TypeScript types
- Follow semantic versioning

## 🔧 Troubleshooting

### Common Issues

**Build Errors:**

```bash
# Clear all build artifacts
pnpm clean

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Test Failures:**

```bash
# Run tests in verbose mode
pnpm test --verbose

# Run specific test file
pnpm test packages/core/src/validation.test.ts
```

**Type Errors:**

```bash
# Check types for all packages
pnpm typecheck

# Check types for specific package
pnpm typecheck --filter @intl-party/core
```

### Getting Help

- **Discussions**: GitHub Discussions for questions and ideas
- **Issues**: GitHub Issues for bugs and feature requests
- **Discord**: Join our Discord server for real-time chat

## 📋 Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **Major** (x.0.0): Breaking changes
- **Minor** (0.x.0): New features, backward compatible
- **Patch** (0.0.x): Bug fixes, backward compatible

### Release Steps

1. **Create Changeset**

   ```bash
   pnpm changeset
   ```

2. **Version Packages**

   ```bash
   pnpm changeset version
   ```

3. **Build and Test**

   ```bash
   pnpm build
   pnpm test
   ```

4. **Publish**
   ```bash
   pnpm changeset publish
   ```

## 🤝 Community

### Code of Conduct

Please read and follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

### Communication

- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bugs and feature requests
- **Discord**: For real-time community chat
- **Twitter**: Follow [@intlparty](https://twitter.com/intlparty) for updates

### Recognition

Contributors are recognized in:

- Release notes
- Contributors section in README
- Annual contributor spotlight

## 📜 License

By contributing to IntlParty, you agree that your contributions will be licensed under the MIT License.
