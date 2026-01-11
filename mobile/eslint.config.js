// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      // Disable import rules that have issues with flat config and tsconfig paths
      "import/no-unresolved": "off",
      "import/no-duplicates": "off",
      "import/namespace": "off",
    },
  },
]);
