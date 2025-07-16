const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable support for TypeScript files
config.resolver.sourceExts.push('ts', 'tsx');

// Configure for Hermes compatibility
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Ensure proper module resolution
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;