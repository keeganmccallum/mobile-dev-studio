const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable support for TypeScript files
config.resolver.sourceExts.push('ts', 'tsx');

// Enable Hermes for better performance
config.transformer.hermesCommand = "hermes";

module.exports = config;