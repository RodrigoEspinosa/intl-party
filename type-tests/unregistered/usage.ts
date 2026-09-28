// Without an IntlPartyRegister augmentation, namespaces and keys stay plain
// strings, so existing projects keep compiling unchanged.
import { useTranslations as useNextTranslations } from "@intl-party/nextjs";
import { useTranslations } from "@intl-party/react";

const namespace: string = "anything";
useNextTranslations(namespace)("any.key");
useNextTranslations()("whatever", { count: 1 });
useTranslations("common")("dynamic." + namespace);
