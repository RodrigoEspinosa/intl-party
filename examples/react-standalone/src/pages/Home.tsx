import React, { useState } from "react";
import { useTranslations } from "@intl-party/react";

const Home: React.FC = () => {
  const t = useTranslations("home");
  const [count, setCount] = useState(0);

  return (
    <div className="page home-page">
      <h2>{t("title")}</h2>
      <p>{t("greeting", { interpolation: { name: "World" } })}</p>
      <p>{t("description")}</p>

      <div className="counter">
        <p>{t("counter", { count })}</p>
        <button onClick={() => setCount(count + 1)}>Click me</button>
      </div>
    </div>
  );
};

export default Home;
