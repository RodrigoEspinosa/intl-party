"use client";

import { useTranslations, useLocale } from "@intl-party/react";

// Icons as simple SVG components
const CheckIcon = () => (
  <svg
    className="demo-feature-icon"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const TypeScriptIcon = () => <span className="feature-icon">TS</span>;

const PerformanceIcon = () => <span className="feature-icon">⚡</span>;

const NextJSIcon = () => <span className="feature-icon">▲</span>;

const DeveloperIcon = () => <span className="feature-icon">👨‍💻</span>;

const FlexibleIcon = () => <span className="feature-icon">🔧</span>;

const CompatibilityIcon = () => <span className="feature-icon">🔄</span>;

function LanguageSelector() {
  const [locale, setLocale] = useLocale();
  const t = useTranslations("common");

  const languages = [
    { code: "en", name: t("languages.en") },
    { code: "es", name: t("languages.es") },
    { code: "fr", name: t("languages.fr") },
    { code: "de", name: t("languages.de") },
  ];

  return (
    <div className="language-selector">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`language-btn ${locale === lang.code ? "active" : ""}`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
}

function Navigation() {
  const t = useTranslations("common");

  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-content">
          <div className="nav-brand">IntlParty</div>
          <div className="nav-links">
            <a href="#" className="nav-link">
              {t("navigation.home")}
            </a>
            <a href="#features" className="nav-link">
              {t("navigation.features")}
            </a>
            <a href="#" className="nav-link">
              {t("navigation.docs")}
            </a>
            <a href="#" className="nav-link">
              {t("navigation.examples")}
            </a>
          </div>
          <LanguageSelector />
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const t = useTranslations("common");

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-badge fade-in-up">
          ✨ Modern i18n for React & Next.js
        </div>

        <h1 className="hero-title fade-in-up">{t("hero.title")}</h1>

        <p className="hero-subtitle fade-in-up">{t("hero.subtitle")}</p>

        <div className="hero-actions fade-in-up">
          <a href="#demo" className="btn btn-primary">
            {t("hero.cta.primary")}
          </a>
          <a href="#" className="btn btn-secondary">
            {t("hero.cta.secondary")}
          </a>
        </div>
      </div>
    </section>
  );
}

function Demo() {
  const t = useTranslations("common");
  const [locale] = useLocale();

  return (
    <section id="demo" className="demo">
      <div className="container">
        <h2 className="demo-title">{t("demo.title")}</h2>
        <p className="demo-subtitle">{t("demo.subtitle")}</p>

        <div className="demo-current">
          <span>🌍</span>
          {t("demo.current", { interpolation: { locale } })}
        </div>

        <LanguageSelector />

        <div className="demo-features">
          <div className="demo-feature">
            <CheckIcon />
            <span className="demo-feature-text">
              {t("demo.features.cookies")}
            </span>
          </div>
          <div className="demo-feature">
            <CheckIcon />
            <span className="demo-feature-text">{t("demo.features.ssr")}</span>
          </div>
          <div className="demo-feature">
            <CheckIcon />
            <span className="demo-feature-text">
              {t("demo.features.instant")}
            </span>
          </div>
          <div className="demo-feature">
            <CheckIcon />
            <span className="demo-feature-text">
              {t("demo.features.persistence")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const t = useTranslations("common");

  const features = [
    {
      icon: <TypeScriptIcon />,
      title: t("features.items.typescript.title"),
      description: t("features.items.typescript.description"),
    },
    {
      icon: <PerformanceIcon />,
      title: t("features.items.performance.title"),
      description: t("features.items.performance.description"),
    },
    {
      icon: <NextJSIcon />,
      title: t("features.items.nextjs.title"),
      description: t("features.items.nextjs.description"),
    },
    {
      icon: <DeveloperIcon />,
      title: t("features.items.developer.title"),
      description: t("features.items.developer.description"),
    },
    {
      icon: <FlexibleIcon />,
      title: t("features.items.flexible.title"),
      description: t("features.items.flexible.description"),
    },
    {
      icon: <CompatibilityIcon />,
      title: t("features.items.compatibility.title"),
      description: t("features.items.compatibility.description"),
    },
  ];

  return (
    <section id="features" className="features">
      <div className="container">
        <div className="features-header">
          <h2 className="features-title">{t("features.title")}</h2>
          <p className="features-subtitle">{t("features.subtitle")}</p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              {feature.icon}
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p className="footer-description">{t("footer.description")}</p>

          <div className="footer-links">
            <a href="#" className="footer-link">
              {t("footer.links.documentation")}
            </a>
            <a href="#" className="footer-link">
              {t("footer.links.github")}
            </a>
            <a href="#" className="footer-link">
              {t("footer.links.examples")}
            </a>
            <a href="#" className="footer-link">
              {t("footer.links.community")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main>
      <Navigation />
      <Hero />
      <Demo />
      <Features />
      <Footer />
    </main>
  );
}
