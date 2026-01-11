const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable tsconfig paths support
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
