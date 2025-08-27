const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;
config.resolver.alias = {
  "@components": require("path").resolve(__dirname, "components"),
  "@assets": require("path").resolve(__dirname, "assets"),
  "@app": require("path").resolve(__dirname, "app"),
};

module.exports = config;