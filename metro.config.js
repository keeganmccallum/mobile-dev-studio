const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable Hermes for Termux compatibility
config.transformer.hermesConfig = false;
config.transformer.enableHermes = false;

// Configure for JSC engine
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;