# IntlParty v0.1.0 - Initial Release

We're excited to announce the initial release of **IntlParty** - a comprehensive, type-safe internationalization library for modern web applications!

## 🎉 What's New

### Core Features

- **🔒 Type-Safe Translations**: Full TypeScript support with auto-completion for translation keys
- **🌍 Advanced Locale Detection**: Intelligent detection from browser, storage, geographic location, and more
- **✅ Comprehensive Validation**: Built-in validation tools for translation consistency and completeness
- **🚀 Performance Optimized**: Lazy loading, caching, and tree-shaking support

### Packages Included

#### @intl-party/core

- Framework-agnostic core library
- Advanced locale detection and fallback chains
- Translation validation and format checking
- Memory-efficient translation storage
- Event system for locale/namespace changes

#### @intl-party/react

- React hooks: `useTranslations`, `useLocale`, `useNamespace`
- Context providers with scoped translation support
- React components: `Trans`, `LocaleSelector`, `PluralTrans`
- Error boundaries and loading states
- TypeScript integration with typed hooks

#### @intl-party/nextjs

- Next.js App Router support with server components
- Intelligent middleware for locale routing
- Static generation helpers
- Metadata generation for SEO
- Server actions for locale switching

#### @intl-party/cli

- Translation validation and consistency checking
- Key extraction from source code
- Project initialization with templates
- Translation synchronization tools
- Multiple output formats (text, JSON, JUnit)

#### @intl-party/eslint-plugin

- ESLint rules for detecting hardcoded strings
- Translation key validation
- Best practices enforcement
- Auto-fixing capabilities

## 🚀 Getting Started

### Installation

```bash
npm install @intl-party/core @intl-party/react
```

### Quick Setup

```typescript
import { createI18n } from '@intl-party/core';
import { I18nProvider, useTranslations } from '@intl-party/react';

const i18n = createI18n({
  locales: ['en', 'es', 'fr'],
  defaultLocale: 'en',
  namespaces: ['common']
});

function App() {
  return (
    <I18nProvider i18n={i18n}>
      <YourApp />
    </I18nProvider>
  );
}

function YourComponent() {
  const t = useTranslations();
  return <h1>{t('welcome')}</h1>;
}
```

### CLI Usage

```bash
# Initialize project
npx @intl-party/cli init

# Extract translation keys
npx @intl-party/cli extract

# Validate translations
npx @intl-party/cli validate
```

## ✨ Key Advantages

### Over react-i18next

- **Better TypeScript Support**: Full type safety with auto-completion
- **Framework Agnostic Core**: Use with any framework or vanilla JavaScript
- **Advanced Validation**: Built-in tools for translation quality assurance
- **Performance Focused**: Optimized for large-scale applications

### Over next-intl

- **Broader Framework Support**: Not limited to Next.js
- **Comprehensive CLI Tools**: Built-in tooling for translation management
- **ESLint Integration**: Automated code quality checks
- **Advanced Locale Detection**: More detection strategies and geographic support

## 📊 Technical Highlights

- **Zero Runtime Dependencies**: Core library has minimal dependencies
- **Tree Shaking**: Only bundle what you use
- **SSR/SSG Ready**: Full server-side rendering support
- **Memory Efficient**: Smart caching and cleanup
- **Extensible**: Plugin system for custom functionality

## 🧪 Testing & Quality

- **Comprehensive Test Suite**: 95%+ code coverage across all packages
- **Type Safety**: Strict TypeScript configuration
- **ESLint Rules**: Code quality enforcement
- **CI/CD Pipeline**: Automated testing and releases

## 🔧 Development Tools

- **Monorepo Setup**: Organized with pnpm workspaces and Turbo
- **Development Mode**: Watch mode with hot reloading
- **Documentation**: Comprehensive guides and API reference
- **Examples**: Working examples for different frameworks

## 📋 What's Next

### v0.2.0 (Coming Soon)

- VS Code extension for translation management
- Additional CLI commands (sync, generate)
- React Native support
- Vue.js integration
- Advanced translation memory features

### Community & Contributions

- GitHub Discussions for questions and ideas
- Contribution guidelines and development setup
- Regular community calls and updates

## 🙏 Acknowledgments

IntlParty builds upon the excellent work of the i18n community, particularly:

- react-i18next for React integration patterns
- next-intl for Next.js integration insights
- FormatJS for locale matching algorithms

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to party with internationalization? 🎉**

Get started today and join our community of developers building globally accessible applications!

- 📚 [Documentation](https://github.com/RodrigoEspinosa/intl-party/docs)
- 🐛 [Report Issues](https://github.com/RodrigoEspinosa/intl-party/issues)
- 💬 [Discussions](https://github.com/RodrigoEspinosa/intl-party/discussions)
- 🌟 [Star on GitHub](https://github.com/RodrigoEspinosa/intl-party)
