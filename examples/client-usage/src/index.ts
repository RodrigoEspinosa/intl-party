#!/usr/bin/env tsx

/**
 * Example: Using @intl-party/client like @prisma/client
 *
 * This demonstrates how the generated client package provides:
 * 1. Type-safe translation keys
 * 2. Translation functions
 * 3. Client instance
 * 4. Direct message access
 * 5. Dynamic usage
 */

import {
  // Generated types - fully type-safe!
  TranslationKey,
  Locale,
  Namespace,

  // Runtime utilities
  createTranslationFunction,
  getLocaleMessages,
  createClient,
} from "@intl-party/client";

console.log("🌍 @intl-party/client Example - Similar to @prisma/client\n");

// ===========================================
// 1. Type-safe translation keys
// ===========================================

console.log("📝 Type-safe translation keys:");

// ✅ These will work - TypeScript validates them
const validKeys: TranslationKey[] = [
  "common.title",
  "common.welcome",
  "common.description",
  "common.features.title",
  "navigation.home",
  "navigation.about",
];

validKeys.forEach((key) => {
  console.log(`  ✓ ${key}`);
});

// ❌ This would cause a TypeScript error:
// const invalidKey: TranslationKey = 'invalid.key'; // Error!

console.log("\n🏷️  Available locales:");
const locales: Locale[] = ["en", "es", "fr", "de"];
locales.forEach((locale) => {
  console.log(`  ✓ ${locale}`);
});

console.log("\n📦 Available namespaces:");
const namespaces: Namespace[] = ["common", "navigation"];
namespaces.forEach((ns) => {
  console.log(`  ✓ ${ns}`);
});

// ===========================================
// 2. Translation function (like Prisma's query builder)
// ===========================================

console.log("\n🔧 Translation functions:");

// Create translation functions for different locales
const tEn = createTranslationFunction("en", {});
const tEs = createTranslationFunction("es", {});
const tFr = createTranslationFunction("fr", {});

console.log("\nEnglish translations:");
console.log(`  Title: ${tEn("common.title")}`);
console.log(`  Welcome: ${tEn("common.welcome", { appName: "IntlParty" })}`);
console.log(`  Features: ${tEn("common.features.title")}`);

console.log("\nSpanish translations:");
console.log(`  Title: ${tEs("common.title")}`);
console.log(`  Welcome: ${tEs("common.welcome", { appName: "IntlParty" })}`);
console.log(`  Features: ${tEs("common.features.title")}`);

console.log("\nFrench translations:");
console.log(`  Title: ${tFr("common.title")}`);
console.log(`  Welcome: ${tFr("common.welcome", { appName: "IntlParty" })}`);
console.log(`  Features: ${tFr("common.features.title")}`);

// ===========================================
// 3. Client instance (like PrismaClient)
// ===========================================

console.log("\n🏗️  Client instance (like PrismaClient):");

const client = createClient();

console.log("Client methods available:");
console.log(`  - t: ${typeof client.t}`);
console.log(`  - getLocaleMessages: ${typeof client.getLocaleMessages}`);

// Use client methods
console.log("\nUsing client methods:");
console.log(`  English title: ${client.t("en", {})("common.title")}`);

// ===========================================
// 4. Direct message access (like Prisma's data access)
// ===========================================

console.log("\n📊 Direct message access:");

// Access messages directly (like accessing Prisma models)
const enMessages = getLocaleMessages("en", {});
console.log("English messages structure:");
console.log(`  common.title: ${(enMessages as any).common?.title || "N/A"}`);
console.log(
  `  navigation.home: ${(enMessages as any).navigation?.home || "N/A"}`
);

// ===========================================
// 5. Dynamic usage (like Prisma's dynamic queries)
// ===========================================

console.log("\n🔄 Dynamic usage:");

function translateKey(
  locale: Locale,
  key: TranslationKey,
  options?: Record<string, any>
) {
  const t = createTranslationFunction(locale, {});
  return t(key, options);
}

console.log("Dynamic translation:");
console.log(
  `  ${translateKey("en", "common.welcome", { appName: "Dynamic App" })}`
);
console.log(
  `  ${translateKey("es", "common.welcome", { appName: "Aplicación Dinámica" })}`
);

console.log("\n🎉 Example completed!");
console.log("\n💡 Key benefits of @intl-party/client:");
console.log("  ✓ Type-safe translation keys (like Prisma model fields)");
console.log("  ✓ Runtime message data (like Prisma database data)");
console.log("  ✓ Utility functions (like Prisma query methods)");
console.log("  ✓ Client instance (like PrismaClient)");
console.log("  ✓ Similar developer experience to @prisma/client");
