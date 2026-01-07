import React from "react";
import { useTranslations } from "@intl-party/react";

const About: React.FC = () => {
  const t = useTranslations("about");

  return (
    <div className="page about-page">
      <h2>{t("title")}</h2>
      <p>{t("description")}</p>

      <h3>Features</h3>
      <ul>
        <li>
          <strong>{t("features.typeSafety")}</strong>
          <p>
            Full TypeScript support with auto-completion, no casting required
          </p>
        </li>
        <li>
          <strong>{t("features.simplicity")}</strong>
          <p>Simple hooks API that just works, with minimal configuration</p>
        </li>
        <li>
          <strong>{t("features.performance")}</strong>
          <p>
            Efficient caching and minimal re-renders for optimal performance
          </p>
        </li>
        <li>
          <strong>{t("features.framework")}</strong>
          <p>Works with any React setup, not just Next.js</p>
        </li>
      </ul>
    </div>
  );
};

export default About;
