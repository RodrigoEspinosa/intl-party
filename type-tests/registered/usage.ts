// Type-level tests: compiled with `tsc`, never executed. Each expect-error
// directive below must be consumed, or tsc fails with "Unused directive".
import { useTranslations as useNextTranslations } from "@intl-party/nextjs";
import { useTranslations, useScopedTranslations } from "@intl-party/react";

// --- @intl-party/nextjs (augmented directly)
const t = useNextTranslations("common");
t("welcome");
t("greeting", { name: "Ada" });
t("navigation.home");
// @ts-expect-error typo in key
t("welcom");
// @ts-expect-error parent objects aren't renderable keys
t("navigation");
// @ts-expect-error key from another namespace
t("title");
// @ts-expect-error unknown namespace
useNextTranslations("checkout");

// No namespace: keys from any registered namespace are accepted
const tAny = useNextTranslations();
tAny("title");
tAny("navigation.about");
// @ts-expect-error unknown key in every namespace
tAny("nope");

// --- @intl-party/react shares the same registry
const tr = useTranslations("home");
tr("title");
// @ts-expect-error key from another namespace
tr("welcome");

const scoped = useScopedTranslations("common");
scoped("navigation.about");
// @ts-expect-error unknown key
scoped("navigation.contact");
