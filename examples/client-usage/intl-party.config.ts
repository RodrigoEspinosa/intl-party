export default {
  locales: ["en", "es", "fr", "de"],
  namespaces: ["common", "navigation"],
  messagesPath: "./messages",

  // Optional: customize generation settings
  generate: {
    client: true, // Enable client package generation
    types: true,
    watch: false,
  },
};
