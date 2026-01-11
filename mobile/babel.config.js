module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "@babel/plugin-transform-export-namespace-from",
      [
        "babel-plugin-module-resolver",
        {
          root: ["./src"],
          extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
          alias: {
            "@": "./src",
            "@app": "./src/app",
            "@features": "./src/features",
            "@shared": "./src/shared",
            "@constants": "./src/constants",
          },
        },
      ],
      [
        "react-native-unistyles/plugin",
        {
          root: "src",
          debug: false,
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
