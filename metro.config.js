const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution of React Native libraries
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Add support for additional file extensions
config.resolver.sourceExts.push('cjs');

// Ensure proper autolinking
config.resolver.assetExts.push('bin');

module.exports = config; 