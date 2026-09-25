// Metro config: shares ../src (pure game/state modules) with the Expo app, and supports TV source extensions.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);
const shared = path.resolve(__dirname, "../src");
config.watchFolders = [shared];

// ../src is written for Node ESM/tsc NodeNext: relative imports end in ".js" but the file is ".ts".
// Map those back to the TypeScript source when the .js file does not exist.
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith(".") && moduleName.endsWith(".js")) {
    const base = path.resolve(path.dirname(context.originModulePath), moduleName.slice(0, -3));
    for (const ext of [".ts", ".tsx"]) {
      if (fs.existsSync(base + ext)) return { type: "sourceFile", filePath: base + ext };
    }
  }
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

// Files in ../src must resolve react-native etc. from this app's node_modules.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];

if (process.env.EXPO_TV === "1") {
  const exts = config.resolver.sourceExts;
  config.resolver.sourceExts = [...exts.map((e) => `tv.${e}`), ...exts];
}
module.exports = config;
